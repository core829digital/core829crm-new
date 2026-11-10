import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { groupDuplicates } from "./lib/dedupe";
import { requireAdmin } from "./lib/authz";

/** Gruppi di lead e di clienti che sembrano la stessa persona/azienda (nome simile, stessa email o telefono). */
export const findGroups = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const leads = await ctx.db.query("leads").collect();
    const clients = await ctx.db.query("clients").collect();
    const leadGroups = groupDuplicates(leads.map((l) => ({ id: l._id as string, name: l.leadName, company: l.company, email: l.email, phone: l.phone })));
    const clientGroups = groupDuplicates(clients.map((c) => ({ id: c._id as string, name: c.clientName, company: c.company, email: c.email, phone: c.phone })));
    return {
      leads: leadGroups.map((g) => ({ reasons: g.reasons, items: g.items.map((i) => ({ id: i.id, name: i.name, company: i.company ?? "", email: i.email ?? "", phone: i.phone ?? "" })) })),
      clients: clientGroups.map((g) => ({ reasons: g.reasons, items: g.items.map((i) => ({ id: i.id, name: i.name, company: i.company ?? "", email: i.email ?? "", phone: i.phone ?? "" })) })),
    };
  },
});

const FILL_FROM_DUPLICATE = ["company", "email", "phone", "website", "address", "pec", "vatId", "legalRep", "notes", "category", "niche", "portalRef"] as const;

/**
 * Unisce piu' clienti in uno: progetti e servizi passano al cliente tenuto, i campi vuoti si completano con quelli dei doppioni,
 * poi i doppioni vengono eliminati. Opzionalmente corregge il nome.
 */
export const mergeClients = mutation({
  args: { keepId: v.id("clients"), removeIds: v.array(v.id("clients")), canonicalName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const keep = await ctx.db.get(args.keepId);
    if (!keep) throw new Error("Client to keep not found");
    const patch: Record<string, unknown> = {};
    let moved = 0;
    for (const id of new Set(args.removeIds)) {
      if (id === args.keepId) continue;
      const dup = await ctx.db.get(id);
      if (!dup) continue;
      for (const p of await ctx.db.query("projects").withIndex("by_clientId", (q) => q.eq("clientId", id)).collect()) {
        await ctx.db.patch(p._id, { clientId: args.keepId });
        moved++;
      }
      for (const s of await ctx.db.query("services").withIndex("by_clientId", (q) => q.eq("clientId", id)).collect()) {
        await ctx.db.patch(s._id, { clientId: args.keepId });
        moved++;
      }
      const d = dup as Record<string, unknown>;
      const k = keep as Record<string, unknown>;
      for (const f of FILL_FROM_DUPLICATE) if ((k[f] === undefined || k[f] === "") && patch[f] === undefined && d[f]) patch[f] = d[f];
      if (!keep.leadId && dup.leadId && patch.leadId === undefined) patch.leadId = dup.leadId;
      await ctx.db.delete(id);
    }
    if (args.canonicalName?.trim()) patch.clientName = args.canonicalName.trim();
    if (Object.keys(patch).length) await ctx.db.patch(args.keepId, patch);
    return { moved };
  },
});

/**
 * Unisce piu' lead in uno. I dati del lead tenuto non vengono sovrascritti (si completano solo i campi vuoti);
 * i clienti e le conversazioni collegati ai doppioni passano al lead tenuto.
 */
export const mergeLeads = mutation({
  args: { keepId: v.id("leads"), removeIds: v.array(v.id("leads")), canonicalName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const keep = await ctx.db.get(args.keepId);
    if (!keep) throw new Error("Lead to keep not found");
    const patch: Record<string, unknown> = {};
    for (const id of new Set(args.removeIds)) {
      if (id === args.keepId) continue;
      const dup = await ctx.db.get(id);
      if (!dup) continue;
      for (const c of await ctx.db.query("clients").withIndex("by_leadId", (q) => q.eq("leadId", id)).collect()) await ctx.db.patch(c._id, { leadId: args.keepId });
      for (const cv of await ctx.db.query("conversations").withIndex("by_leadId", (q) => q.eq("leadId", id)).collect()) await ctx.db.patch(cv._id, { leadId: args.keepId });
      const d = dup as Record<string, unknown>;
      const k = keep as Record<string, unknown>;
      for (const f of ["company", "email", "phone", "website", "notes", "category", "niche", "firstContactDate", "lastTouchDate"]) {
        if ((k[f] === undefined || k[f] === "") && patch[f] === undefined && d[f]) patch[f] = d[f];
      }
      // Il valore economico piu' alto/completo vince solo se il lead tenuto non ne ha.
      for (const f of ["totalDealValue", "cashCollected", "depositAmount"] as const) {
        if (!keep[f] && dup[f] && patch[f] === undefined) patch[f] = dup[f];
      }
      await ctx.db.delete(id as Id<"leads">);
    }
    if (args.canonicalName?.trim()) patch.leadName = args.canonicalName.trim();
    if (Object.keys(patch).length) await ctx.db.patch(args.keepId, patch);
  },
});

/** Corregge il nome (ortografia) di un lead e/o cliente in un colpo, senza unire nulla. */
export const renamePerson = mutation({
  args: { leadIds: v.array(v.id("leads")), clientIds: v.array(v.id("clients")), name: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Name is required");
    for (const id of args.leadIds) await ctx.db.patch(id, { leadName: name });
    for (const id of args.clientIds) await ctx.db.patch(id, { clientName: name });
  },
});
