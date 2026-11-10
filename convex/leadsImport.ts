import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin } from "./lib/authz";
import { matchReason } from "./lib/dedupe";
import { clientCategories } from "./lib/catalog";

/**
 * Inserisce lead letti da un foglio (CSV di Google Fogli). Il browser legge il file e manda le righe gia' convertite
 * (vedi convex/lib/leadSheet.ts); qui si controllano, si evitano i doppioni e si scrive.
 *  - NON elimina e NON modifica nulla di esistente.
 *  - Un lead gia' presente (stesso telefono, email o nome simile) viene saltato.
 *  - `dryRun: true` mostra solo cosa farebbe.
 */

const row = v.object({
  leadName: v.string(), company: v.string(), email: v.string(), phone: v.string(), source: v.string(), leadStatus: v.string(),
  lossReason: v.optional(v.string()), dateCreated: v.string(), website: v.optional(v.string()), notes: v.optional(v.string()),
  category: v.optional(v.string()), niche: v.optional(v.string()), lastTouchDate: v.optional(v.string()),
});

const STATUSES = new Set(["New", "Proposal", "Deposit", "Follow-Up Ongoing", "Meeting Follow-Up", "Won", "Lost"]);
const MAX = 2000;

export const run = mutation({
  args: { leads: v.array(row), dryRun: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.leads.length > MAX) throw new Error(`Too many rows in one file (max ${MAX}).`);
    const existing = await ctx.db.query("leads").collect();
    const report = { dryRun: args.dryRun, total: args.leads.length, created: 0, skippedExisting: [] as string[], skippedInvalid: [] as string[] };

    for (const l of args.leads) {
      const name = l.leadName.trim().slice(0, 200);
      const company = l.company.trim().slice(0, 200);
      if (!name || !company) {
        report.skippedInvalid.push(company || name || "(riga vuota)");
        continue;
      }
      const probe = { id: "new", name, company, email: l.email, phone: l.phone };
      const dup = existing.find((e) => matchReason({ id: e._id, name: e.leadName, company: e.company, email: e.email, phone: e.phone }, probe) !== null);
      if (dup) {
        report.skippedExisting.push(`${company} (già presente come «${dup.leadName}»)`);
        continue;
      }
      report.created++;
      if (args.dryRun) continue;
      const category = l.category && l.category in clientCategories ? l.category : undefined;
      const id = await ctx.db.insert("leads", {
        leadName: name, company, email: l.email.trim().slice(0, 200), phone: l.phone.trim().slice(0, 60), source: l.source.slice(0, 100),
        setterName: "", closerName: "", leadStatus: STATUSES.has(l.leadStatus) ? l.leadStatus : "New", lossReason: l.lossReason,
        dateCreated: l.dateCreated, offerMade: false, depositAmount: 0, totalDealValue: 0, cashCollected: 0, refundClawbackAmount: 0, commissionPercent: 0, earnings: 0,
        lastTouchDate: l.lastTouchDate, notes: l.notes?.slice(0, 5000), website: l.website?.slice(0, 300),
        category, niche: category && l.niche && clientCategories[category].includes(l.niche) ? l.niche : undefined,
      });
      existing.push((await ctx.db.get(id))!);
    }
    return report;
  },
});
