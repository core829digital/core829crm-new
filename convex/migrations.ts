import { mutation } from "./_generated/server";

export const backfillClientsFromWonLeads = mutation({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect();
    const wonLeads = leads.filter((l) => l.leadStatus === "Won");

    let created = 0;
    let skipped = 0;

    for (const lead of wonLeads) {
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_leadId", (q) => q.eq("leadId", lead._id))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      const clientId = await ctx.db.insert("clients", {
        leadId: lead._id,
        clientName: lead.leadName,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        createdAt: new Date().toISOString(),
      });

      await ctx.db.insert("projects", {
        clientId,
        projectName: `${lead.company} - Initial Deal`,
        description: "Project created from won deal",
        status: "Active",
        startDate: new Date().toISOString(),
        totalValue: lead.totalDealValue,
        createdAt: new Date().toISOString(),
      });

      created++;
    }

    return { created, skipped, totalWon: wonLeads.length };
  },
});
