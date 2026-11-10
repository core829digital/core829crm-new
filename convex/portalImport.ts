import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { normalizeEmail, normalizeName, matchReason, sameName } from "./lib/dedupe";

/**
 * Importazione dei dati dal portale (portal.core829.net) nel CRM.
 *  - NON elimina mai nulla (nemmeno i lead gia' presenti).
 *  - Ripetibile: ogni record importato conserva l'id del portale (`portalRef`), quindi un secondo import aggiorna invece di duplicare.
 *  - Un cliente gia' presente (stesso id portale, stessa email o nome simile) viene riconosciuto e COMPLETATO, non sovrascritto.
 *  - `dryRun: true` mostra cosa succederebbe senza scrivere niente.
 * Il file arriva dal pulsante «Esporta per il CRM» del portale (mai salvato nel repository).
 */

type PClient = {
  ref: string; displayName: string; contactName: string; email: string; phone?: string; vatId?: string; address?: string; pec?: string;
  legalRep?: string; website?: string; status?: string;
  projects: { ref: string; name: string; description?: string; status: string; startDate?: number; dueDate?: number }[];
  invoices: { ref: string; number: string; amountCents: number; status: string; projectRef?: string; issuedAt: number; note?: string }[];
  subscriptions: { ref: string; name: string; description?: string; amountCents: number; interval: string; status: string }[];
};

const str = (x: unknown, max = 500): string => (typeof x === "string" ? x.trim().slice(0, max) : "");
const num = (x: unknown): number => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const iso = (ms: unknown): string => (typeof ms === "number" && Number.isFinite(ms) ? new Date(ms).toISOString() : new Date().toISOString());

function parseClients(raw: unknown): PClient[] {
  const root = raw as { clients?: unknown } | null;
  if (!root || !Array.isArray(root.clients)) throw new Error("Invalid file: expected { clients: [...] } exported from the portal.");
  if (root.clients.length > 2000) throw new Error("Too many clients in one file (max 2000).");
  return root.clients.map((c: Record<string, unknown>) => ({
    ref: str(c.ref, 80), displayName: str(c.displayName, 200), contactName: str(c.contactName, 200), email: str(c.email, 200),
    phone: str(c.phone, 60) || undefined, vatId: str(c.vatId, 60) || undefined, address: str(c.address, 300) || undefined, pec: str(c.pec, 200) || undefined,
    legalRep: str(c.legalRep, 200) || undefined, website: str(c.website, 300) || undefined, status: str(c.status, 30) || undefined,
    projects: (Array.isArray(c.projects) ? c.projects : []).slice(0, 200).map((p: Record<string, unknown>) => ({
      ref: str(p.ref, 80), name: str(p.name, 200), description: str(p.description, 1000) || undefined, status: str(p.status, 30),
      startDate: typeof p.startDate === "number" ? p.startDate : undefined, dueDate: typeof p.dueDate === "number" ? p.dueDate : undefined,
    })),
    invoices: (Array.isArray(c.invoices) ? c.invoices : []).slice(0, 1000).map((i: Record<string, unknown>) => ({
      ref: str(i.ref, 80), number: str(i.number, 60), amountCents: num(i.amountCents), status: str(i.status, 30),
      projectRef: str(i.projectRef, 80) || undefined, issuedAt: num(i.issuedAt), note: str(i.note, 500) || undefined,
    })),
    subscriptions: (Array.isArray(c.subscriptions) ? c.subscriptions : []).slice(0, 200).map((s: Record<string, unknown>) => ({
      ref: str(s.ref, 80), name: str(s.name, 200), description: str(s.description, 500) || undefined, amountCents: num(s.amountCents),
      interval: str(s.interval, 20), status: str(s.status, 20),
    })),
  })).filter((c) => c.ref && (c.displayName || c.contactName));
}

const PROJECT_STATUS: Record<string, string> = { planned: "Active", in_progress: "Active", in_review: "Active", completed: "Completed", on_hold: "On-Hold" };
const INVOICE_STATUS: Record<string, string> = { sent: "Pending", paid: "Paid", overdue: "Overdue", cancelled: "Cancelled" };
const SERVICE_STATUS: Record<string, string> = { active: "Accepted", paused: "Pending", cancelled: "Declined" };

export const run = mutation({
  args: { payload: v.any(), dryRun: v.boolean(), preferPortalNames: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const clients = parseClients(args.payload);
    const write = !args.dryRun;
    const now = new Date().toISOString();
    const report = {
      dryRun: args.dryRun,
      clientsCreated: 0, clientsMatched: 0, clientsCompleted: 0, leadsLinked: 0,
      projectsCreated: 0, projectsExisting: 0, invoicesCreated: 0, invoicesExisting: 0, invoicesSkippedDraft: 0,
      servicesCreated: 0, servicesExisting: 0,
      nameConflicts: [] as { crm: string; portal: string; renamed: boolean }[],
      matches: [] as { portal: string; crm: string; how: string }[],
    };

    const crmClients = await ctx.db.query("clients").collect();
    const crmLeads = await ctx.db.query("leads").collect();

    for (const pc of clients) {
      const person = { id: pc.ref, name: pc.contactName || pc.displayName, company: pc.displayName, email: pc.email, phone: pc.phone };
      // 1) id del portale, 2) email/telefono/nome simile
      let how = "";
      let existing: Doc<"clients"> | undefined = crmClients.find((c) => c.portalRef === pc.ref);
      if (existing) how = "already imported";
      if (!existing) {
        for (const c of crmClients) {
          const r = matchReason(person, { id: c._id, name: c.clientName, company: c.company, email: c.email, phone: c.phone });
          const rc = !r && pc.displayName && c.company && normalizeName(pc.displayName).length >= 5 && sameName(pc.displayName, c.company) ? "same company name" : r;
          if (rc) { existing = c; how = rc; break; }
        }
      }

      let clientId: Id<"clients">;
      const extra = {
        website: pc.website, address: pc.address, pec: pc.pec, vatId: pc.vatId, legalRep: pc.legalRep,
      };
      if (existing) {
        report.clientsMatched++;
        report.matches.push({ portal: `${pc.contactName || pc.displayName} (${pc.displayName})`, crm: `${existing.clientName} (${existing.company})`, how });
        clientId = existing._id;
        const patch: Record<string, unknown> = {};
        if (!existing.portalRef) patch.portalRef = pc.ref;
        const e = existing as Record<string, unknown>;
        for (const [k, val] of Object.entries({ ...extra, phone: pc.phone, email: pc.email })) if (val && !e[k]) patch[k] = val;
        if (pc.contactName && normalizeName(pc.contactName) !== normalizeName(existing.clientName)) {
          const rename = args.preferPortalNames === true;
          report.nameConflicts.push({ crm: existing.clientName, portal: pc.contactName, renamed: rename });
          if (rename) patch.clientName = pc.contactName;
        }
        if (Object.keys(patch).length) {
          report.clientsCompleted++;
          if (write) await ctx.db.patch(clientId, patch);
        }
      } else {
        report.clientsCreated++;
        clientId = "dry-run" as Id<"clients">;
        if (write) {
          clientId = await ctx.db.insert("clients", {
            clientName: pc.contactName || pc.displayName, company: pc.displayName, email: pc.email, phone: pc.phone ?? "", createdAt: now, portalRef: pc.ref,
            ...Object.fromEntries(Object.entries(extra).filter(([, val]) => val)),
          });
        }
      }

      // Collega il lead di origine (se esiste gia' nel CRM e il cliente non ne ha uno).
      const cur = existing ?? undefined;
      if (!cur?.leadId) {
        const lead = crmLeads.find((l) => (pc.email && normalizeEmail(l.email) === normalizeEmail(pc.email)) || sameName(l.leadName, pc.contactName || pc.displayName));
        if (lead && !crmClients.some((c) => c.leadId === lead._id)) {
          report.leadsLinked++;
          if (write && clientId !== ("dry-run" as Id<"clients">)) await ctx.db.patch(clientId, { leadId: lead._id });
        }
      }

      // Progetti
      const projectIdByRef = new Map<string, Id<"projects">>();
      const existingProjects = write || existing ? await ctx.db.query("projects").withIndex("by_clientId", (q) => q.eq("clientId", clientId)).collect() : [];
      const projectTotal = new Map<string, number>();
      for (const i of pc.invoices) if (i.projectRef && i.status !== "cancelled" && i.status !== "draft") projectTotal.set(i.projectRef, (projectTotal.get(i.projectRef) ?? 0) + i.amountCents / 100);
      for (const pp of pc.projects) {
        const found = existingProjects.find((p) => p.portalRef === pp.ref) ?? existingProjects.find((p) => normalizeName(p.projectName) === normalizeName(pp.name));
        if (found) {
          report.projectsExisting++;
          projectIdByRef.set(pp.ref, found._id);
          if (write && !found.portalRef) await ctx.db.patch(found._id, { portalRef: pp.ref });
          continue;
        }
        report.projectsCreated++;
        if (write) {
          projectIdByRef.set(pp.ref, await ctx.db.insert("projects", {
            clientId, projectName: pp.name || "Project", description: pp.description ?? "Imported from the client portal",
            status: PROJECT_STATUS[pp.status] ?? "Active", startDate: iso(pp.startDate), deadline: pp.dueDate ? iso(pp.dueDate) : undefined,
            totalValue: projectTotal.get(pp.ref) ?? 0, createdAt: now, portalRef: pp.ref,
          }));
        }
      }

      // Fatture: su un progetto del cliente; quelle senza progetto vanno in «General billing».
      let billingId: Id<"projects"> | undefined;
      const ensureBilling = async () => {
        if (billingId) return billingId;
        const found = existingProjects.find((p) => p.portalRef === `${pc.ref}:billing`);
        if (found) return (billingId = found._id);
        if (!write) return undefined;
        return (billingId = await ctx.db.insert("projects", {
          clientId, projectName: "General billing", description: "Invoices from the client portal not tied to a specific project",
          status: "Active", startDate: now, totalValue: 0, createdAt: now, portalRef: `${pc.ref}:billing`,
        }));
      };
      for (const inv of pc.invoices) {
        if (inv.status === "draft") { report.invoicesSkippedDraft++; continue; }
        const projectId = inv.projectRef && projectIdByRef.has(inv.projectRef) ? projectIdByRef.get(inv.projectRef) : await ensureBilling();
        let dup = false;
        if (projectId) {
          const list = await ctx.db.query("invoices").withIndex("by_projectId", (q) => q.eq("projectId", projectId)).collect();
          dup = list.some((x) => x.portalRef === inv.ref || x.invoiceNumber === inv.number);
        } else if (existing) {
          // dry-run su un cliente esistente senza progetti: cerca in tutti i suoi progetti
          for (const p of existingProjects) {
            const list = await ctx.db.query("invoices").withIndex("by_projectId", (q) => q.eq("projectId", p._id)).collect();
            if (list.some((x) => x.portalRef === inv.ref || x.invoiceNumber === inv.number)) dup = true;
          }
        }
        if (dup) { report.invoicesExisting++; continue; }
        report.invoicesCreated++;
        if (write && projectId) {
          await ctx.db.insert("invoices", {
            projectId, invoiceNumber: inv.number, amount: inv.amountCents / 100, status: INVOICE_STATUS[inv.status] ?? "Pending",
            notes: inv.note, createdAt: iso(inv.issuedAt), portalRef: inv.ref,
          });
        }
      }

      // Abbonamenti -> servizi
      const existingServices = write || existing ? await ctx.db.query("services").withIndex("by_clientId", (q) => q.eq("clientId", clientId)).collect() : [];
      for (const sub of pc.subscriptions) {
        const found = existingServices.find((s) => s.portalRef === sub.ref) ?? existingServices.find((s) => normalizeName(s.serviceName) === normalizeName(sub.name));
        if (found) {
          report.servicesExisting++;
          if (write && !found.portalRef) await ctx.db.patch(found._id, { portalRef: sub.ref });
          continue;
        }
        report.servicesCreated++;
        if (write) {
          await ctx.db.insert("services", {
            clientId, category: "Hosting & Infrastructure", serviceName: sub.name || "Subscription",
            description: [sub.description, sub.interval === "month" ? "Monthly subscription" : "Yearly subscription"].filter(Boolean).join(" · "),
            quoteAmount: sub.amountCents / 100, status: SERVICE_STATUS[sub.status] ?? "Pending", createdAt: now, portalRef: sub.ref,
          });
        }
      }
    }
    return report;
  },
});
