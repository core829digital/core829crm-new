import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/authz";
import { matchReason, normalizeEmail, normalizeName, sameName } from "./lib/dedupe";

/**
 * Esportazione completa del CRM (backup) e ripristino.
 *  - `exportAll`: un unico file JSON con lead, clienti, progetti, attivita', fatture e servizi. Lo stesso file serve:
 *      • come backup (si ripristina qui con `restore`),
 *      • per il portale (portal.core829.net → «Importa dal CRM»).
 *  - `restore`: rimette i dati da un backup SENZA creare doppioni (riconosce lead/clienti gia' presenti per email, telefono o nome)
 *    e senza cancellare nulla. `dryRun: true` mostra solo cosa farebbe.
 * Il file contiene dati personali: non va mai salvato in un repository.
 */

const LIMITS = { leads: 4000, clients: 1000, projects: 2500, tasks: 2500, invoices: 3000, services: 2500 } as const;

export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [leads, clients, projects, tasks, invoices, services] = await Promise.all([
      ctx.db.query("leads").take(LIMITS.leads + 1),
      ctx.db.query("clients").take(LIMITS.clients + 1),
      ctx.db.query("projects").take(LIMITS.projects + 1),
      ctx.db.query("projectTasks").take(LIMITS.tasks + 1),
      ctx.db.query("invoices").take(LIMITS.invoices + 1),
      ctx.db.query("services").take(LIMITS.services + 1),
    ]);
    const truncated = leads.length > LIMITS.leads || clients.length > LIMITS.clients || projects.length > LIMITS.projects || tasks.length > LIMITS.tasks || invoices.length > LIMITS.invoices || services.length > LIMITS.services;

    const group = <T extends { _id: string }>(rows: T[], key: (r: T) => string) => {
      const m = new Map<string, T[]>();
      for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
      return m;
    };
    const tasksBy = group(tasks, (t) => t.projectId);
    const projectsBy = group(projects, (p) => p.clientId);
    const invoicesBy = group(invoices, (i) => i.projectId);
    const servicesBy = group(services, (s) => s.clientId);
    const strip = <T extends Record<string, unknown>>(doc: T) => {
      const { _id, _creationTime, ...rest } = doc as Record<string, unknown>;
      void _creationTime;
      return { ref: _id as string, ...rest };
    };

    return {
      format: "core829-crm-export/1" as const,
      exportedAt: new Date().toISOString(),
      truncated,
      leads: leads.slice(0, LIMITS.leads).map(strip),
      clients: clients.slice(0, LIMITS.clients).map((c) => ({
        ...strip(c),
        leadRef: c.leadId as string | undefined,
        projects: (projectsBy.get(c._id) ?? []).map((p) => ({
          ...strip(p),
          tasks: (tasksBy.get(p._id) ?? []).map((t) => ({ taskName: t.taskName, completed: t.completed, createdAt: t.createdAt })),
          invoices: (invoicesBy.get(p._id) ?? []).map((i) => {
            const { fileId: _f, ...rest } = strip(i) as Record<string, unknown>;
            void _f; // i file (PDF) non viaggiano nel JSON: restano nello storage del CRM
            return rest;
          }),
        })),
        services: (servicesBy.get(c._id) ?? []).map((s) => {
          const { quoteFileId: _q, ...rest } = strip(s) as Record<string, unknown>;
          void _q;
          return rest;
        }),
      })),
    };
  },
});

// ------------------------------------------------------------------ ripristino

const str = (x: unknown, max = 2000): string => (typeof x === "string" ? x.slice(0, max) : "");
const optStr = (x: unknown, max = 2000): string | undefined => (typeof x === "string" && x.trim() ? x.slice(0, max) : undefined);
const num = (x: unknown): number => (typeof x === "number" && Number.isFinite(x) ? x : 0);
type Obj = Record<string, unknown>;
const arr = (x: unknown, max: number): Obj[] => (Array.isArray(x) ? (x.slice(0, max) as Obj[]) : []);

export const restore = mutation({
  args: { payload: v.any(), dryRun: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const root = args.payload as { format?: unknown; leads?: unknown; clients?: unknown } | null;
    if (!root || root.format !== "core829-crm-export/1") throw new Error("Invalid file: expected a CRM export (core829-crm-export/1).");
    const write = !args.dryRun;
    const report = { dryRun: args.dryRun, leadsCreated: 0, leadsExisting: 0, clientsCreated: 0, clientsExisting: 0, projectsCreated: 0, projectsExisting: 0, invoicesCreated: 0, invoicesExisting: 0, servicesCreated: 0, servicesExisting: 0, tasksCreated: 0 };

    // ---- lead
    const existingLeads = await ctx.db.query("leads").collect();
    const leadIdByRef = new Map<string, Id<"leads">>();
    for (const l of arr(root.leads, 4000)) {
      const name = str(l.leadName, 200);
      if (!name) continue;
      const found = existingLeads.find((e) => matchReason({ id: e._id, name: e.leadName, company: e.company, email: e.email, phone: e.phone }, { id: "x", name, company: str(l.company), email: str(l.email), phone: str(l.phone) }));
      if (found) {
        report.leadsExisting++;
        leadIdByRef.set(str(l.ref, 80), found._id);
        continue;
      }
      report.leadsCreated++;
      if (!write) continue;
      const earnings = num(l.earnings);
      const id = await ctx.db.insert("leads", {
        leadName: name, company: str(l.company, 200), email: str(l.email, 200), phone: str(l.phone, 60), source: str(l.source, 100),
        setterName: str(l.setterName, 100), closerName: str(l.closerName, 100), leadStatus: str(l.leadStatus, 40) || "New", dateCreated: str(l.dateCreated, 40) || new Date().toISOString().slice(0, 10),
        firstContactDate: optStr(l.firstContactDate, 40), dateMeetingBooked: optStr(l.dateMeetingBooked, 40), dateOfMeeting: optStr(l.dateOfMeeting, 40), meetingStatus: optStr(l.meetingStatus, 40),
        offerMade: l.offerMade === true, isOneCallSale: typeof l.isOneCallSale === "boolean" ? l.isOneCallSale : undefined, lossReason: optStr(l.lossReason, 40),
        depositAmount: num(l.depositAmount), totalDealValue: num(l.totalDealValue), cashCollected: num(l.cashCollected), datePaidInFull: optStr(l.datePaidInFull, 40),
        refundClawbackAmount: num(l.refundClawbackAmount), commissionPercent: num(l.commissionPercent), earnings,
        lastTouchDate: optStr(l.lastTouchDate, 40), notes: optStr(l.notes, 5000), website: optStr(l.website, 300),
        socialLinks: Array.isArray(l.socialLinks) ? (l.socialLinks.filter((s) => typeof s === "string").slice(0, 10) as string[]) : undefined,
        category: optStr(l.category, 100), niche: optStr(l.niche, 100),
      });
      leadIdByRef.set(str(l.ref, 80), id);
      existingLeads.push((await ctx.db.get(id))!);
    }

    // ---- clienti, progetti, fatture, servizi
    const existingClients = await ctx.db.query("clients").collect();
    for (const c of arr(root.clients, 1000)) {
      const clientName = str(c.clientName, 200);
      const company = str(c.company, 200);
      if (!clientName && !company) continue;
      const probe = { id: "x", name: clientName || company, company, email: str(c.email), phone: str(c.phone) };
      let client = existingClients.find((e) => matchReason({ id: e._id, name: e.clientName, company: e.company, email: e.email, phone: e.phone }, probe) !== null);
      if (!client && company && normalizeName(company).length >= 5) client = existingClients.find((e) => sameName(e.company, company) && (!normalizeEmail(e.email) || !normalizeEmail(probe.email) || normalizeEmail(e.email) === normalizeEmail(probe.email)));
      let clientId: Id<"clients"> | undefined = client?._id;
      if (client) report.clientsExisting++;
      else {
        report.clientsCreated++;
        if (write) {
          const leadId = c.leadRef ? leadIdByRef.get(str(c.leadRef, 80)) : undefined;
          clientId = await ctx.db.insert("clients", {
            leadId, clientName: clientName || company, company: company || clientName, email: str(c.email, 200), phone: str(c.phone, 60), createdAt: str(c.createdAt, 40) || new Date().toISOString(),
            category: optStr(c.category, 100), niche: optStr(c.niche, 100), website: optStr(c.website, 300), address: optStr(c.address, 300), pec: optStr(c.pec, 200),
            vatId: optStr(c.vatId, 60), legalRep: optStr(c.legalRep, 200), notes: optStr(c.notes, 5000), portalRef: optStr(c.portalRef, 80),
          });
          existingClients.push((await ctx.db.get(clientId))!);
        }
      }

      const existingProjects = clientId ? await ctx.db.query("projects").withIndex("by_clientId", (q) => q.eq("clientId", clientId!)).collect() : [];
      for (const p of arr(c.projects, 200)) {
        const pname = str(p.projectName, 200);
        if (!pname) continue;
        let project = existingProjects.find((e) => normalizeName(e.projectName) === normalizeName(pname));
        let projectId: Id<"projects"> | undefined = project?._id;
        if (project) report.projectsExisting++;
        else {
          report.projectsCreated++;
          if (write && clientId) {
            projectId = await ctx.db.insert("projects", {
              clientId, projectName: pname, description: str(p.description, 2000), status: str(p.status, 30) || "Active", startDate: str(p.startDate, 40) || new Date().toISOString(),
              deadline: optStr(p.deadline, 40), totalValue: num(p.totalValue), notes: optStr(p.notes, 3000), createdAt: str(p.createdAt, 40) || new Date().toISOString(), portalRef: optStr(p.portalRef, 80),
            });
            project = (await ctx.db.get(projectId)) ?? undefined;
            for (const t of arr(p.tasks, 200)) {
              await ctx.db.insert("projectTasks", { projectId, taskName: str(t.taskName, 300) || "Task", completed: t.completed === true, createdAt: str(t.createdAt, 40) || new Date().toISOString() });
              report.tasksCreated++;
            }
          }
        }
        const existingInvoices = projectId ? await ctx.db.query("invoices").withIndex("by_projectId", (q) => q.eq("projectId", projectId!)).collect() : [];
        for (const i of arr(p.invoices, 500)) {
          const number = str(i.invoiceNumber, 60);
          if (!number) continue;
          if (existingInvoices.some((e) => e.invoiceNumber === number)) {
            report.invoicesExisting++;
            continue;
          }
          report.invoicesCreated++;
          if (write && projectId) await ctx.db.insert("invoices", { projectId, invoiceNumber: number, amount: num(i.amount), status: str(i.status, 30) || "Pending", notes: optStr(i.notes, 1000), createdAt: str(i.createdAt, 40) || new Date().toISOString(), portalRef: optStr(i.portalRef, 80) });
        }
      }

      const existingServices = clientId ? await ctx.db.query("services").withIndex("by_clientId", (q) => q.eq("clientId", clientId!)).collect() : [];
      for (const s of arr(c.services, 200)) {
        const sname = str(s.serviceName, 200);
        if (!sname) continue;
        if (existingServices.some((e) => normalizeName(e.serviceName) === normalizeName(sname))) {
          report.servicesExisting++;
          continue;
        }
        report.servicesCreated++;
        if (write && clientId) await ctx.db.insert("services", { clientId, category: str(s.category, 100) || "Software Development", serviceName: sname, description: optStr(s.description, 1000), quoteAmount: num(s.quoteAmount), status: str(s.status, 30) || "Pending", createdAt: str(s.createdAt, 40) || new Date().toISOString(), portalRef: optStr(s.portalRef, 80) });
      }
    }
    return report;
  },
});
