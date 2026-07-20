import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { lossReasons } from "./schema";

export const create = mutation({
  args: {
    leadName: v.string(),
    company: v.string(),
    email: v.string(),
    phone: v.string(),
    source: v.string(),
    setterName: v.string(),
    closerName: v.string(),
    leadStatus: v.string(),
    dateCreated: v.string(),
    firstContactDate: v.optional(v.string()),
    dateMeetingBooked: v.optional(v.string()),
    dateOfMeeting: v.optional(v.string()),
    meetingStatus: v.optional(v.string()),
    offerMade: v.boolean(),
    isOneCallSale: v.optional(v.boolean()),
    lossReason: v.optional(v.string()),
    depositAmount: v.number(),
    totalDealValue: v.number(),
    cashCollected: v.number(),
    datePaidInFull: v.optional(v.string()),
    refundClawbackAmount: v.number(),
    commissionPercent: v.number(),
    lastTouchDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const earnings =
      (args.totalDealValue - args.refundClawbackAmount) *
      (args.commissionPercent / 100);
    return await ctx.db.insert("leads", { ...args, earnings });
  },
});

export const update = mutation({
  args: {
    id: v.id("leads"),
    leadName: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    setterName: v.optional(v.string()),
    closerName: v.optional(v.string()),
    leadStatus: v.optional(v.string()),
    firstContactDate: v.optional(v.string()),
    dateMeetingBooked: v.optional(v.string()),
    dateOfMeeting: v.optional(v.string()),
    meetingStatus: v.optional(v.string()),
    offerMade: v.optional(v.boolean()),
    isOneCallSale: v.optional(v.boolean()),
    lossReason: v.optional(v.string()),
    depositAmount: v.optional(v.number()),
    totalDealValue: v.optional(v.number()),
    cashCollected: v.optional(v.number()),
    datePaidInFull: v.optional(v.string()),
    refundClawbackAmount: v.optional(v.number()),
    commissionPercent: v.optional(v.number()),
    lastTouchDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead not found");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    const totalDealValue = updates.totalDealValue ?? existing.totalDealValue;
    const refundClawbackAmount =
      updates.refundClawbackAmount ?? existing.refundClawbackAmount;
    const commissionPercent =
      updates.commissionPercent ?? existing.commissionPercent;

    updates.earnings =
      (totalDealValue as number - (refundClawbackAmount as number)) *
      ((commissionPercent as number) / 100);

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: {
    statusFilter: v.optional(v.string()),
    setterFilter: v.optional(v.string()),
    closerFilter: v.optional(v.string()),
    sourceFilter: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db.query("leads").collect();

    if (args.statusFilter && args.statusFilter !== "all") {
      leads = leads.filter((l) => l.leadStatus === args.statusFilter);
    }
    if (args.setterFilter && args.setterFilter !== "all") {
      leads = leads.filter((l) => l.setterName === args.setterFilter);
    }
    if (args.closerFilter && args.closerFilter !== "all") {
      leads = leads.filter((l) => l.closerName === args.closerFilter);
    }
    if (args.sourceFilter && args.sourceFilter !== "all") {
      leads = leads.filter((l) => l.source === args.sourceFilter);
    }
    if (args.search) {
      const s = args.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.leadName.toLowerCase().includes(s) ||
          l.company.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s)
      );
    }
    return leads;
  },
});

export const getById = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getDashboardData = query({
  args: {
    setterFilter: v.optional(v.string()),
    closerFilter: v.optional(v.string()),
    sourceFilter: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db.query("leads").collect();

    if (args.setterFilter && args.setterFilter !== "all") {
      leads = leads.filter((l) => l.setterName === args.setterFilter);
    }
    if (args.closerFilter && args.closerFilter !== "all") {
      leads = leads.filter((l) => l.closerName === args.closerFilter);
    }
    if (args.sourceFilter && args.sourceFilter !== "all") {
      leads = leads.filter((l) => l.source === args.sourceFilter);
    }
    if (args.dateFrom) {
      leads = leads.filter((l) => l.dateCreated >= args.dateFrom!);
    }
    if (args.dateTo) {
      leads = leads.filter((l) => l.dateCreated <= args.dateTo!);
    }

    const setters = new Set(leads.map((l) => l.setterName));
    const closers = new Set(leads.map((l) => l.closerName));

    const setterMetrics: Record<string, unknown> = {};
    const closerMetrics: Record<string, unknown> = {};

    for (const setter of setters) {
      if (!setter) continue;
      const sLeads = leads.filter((l) => l.setterName === setter);
      const withFirstContact = sLeads.filter((l) => l.firstContactDate);
      const booked = sLeads.filter((l) => l.dateMeetingBooked);
      const shows = sLeads.filter((l) => l.meetingStatus === "Show");
      const noShows = sLeads.filter((l) => l.meetingStatus === "No-Show");
      const cancels = sLeads.filter((l) => l.meetingStatus === "Cancel");
      const dqs = sLeads.filter((l) => l.meetingStatus === "DQ");

      let totalSpeedMinutes = 0;
      withFirstContact.forEach((l) => {
        const created = new Date(l.dateCreated).getTime();
        const contacted = new Date(l.firstContactDate!).getTime();
        totalSpeedMinutes += (contacted - created) / 60000;
      });

      let totalLag = 0;
      let lagCount = 0;
      sLeads.forEach((l) => {
        if (l.dateMeetingBooked && l.dateOfMeeting) {
          const bookedDate = new Date(l.dateMeetingBooked).getTime();
          const meetingDate = new Date(l.dateOfMeeting).getTime();
          totalLag += (meetingDate - bookedDate) / 86400000;
          lagCount++;
        }
      });

      setterMetrics[setter] = {
        totalLeads: sLeads.length,
        speedToLead:
          withFirstContact.length > 0
            ? Math.round(totalSpeedMinutes / withFirstContact.length)
            : 0,
        bookingLag:
          lagCount > 0 ? (totalLag / lagCount).toFixed(1) : "0",
        meetingsSet: booked.length,
        callsTaken: shows.length + noShows.length,
        declines: 0,
        cancels: cancels.length,
        noShows: noShows.length,
        shows: shows.length,
        showUpRate:
          booked.length > 0
            ? Math.round((shows.length / booked.length) * 100)
            : 0,
        dqRate:
          booked.length > 0
            ? Math.round((dqs.length / booked.length) * 100)
            : 0,
      };
    }

    for (const closer of closers) {
      if (!closer) continue;
      const cLeads = leads.filter((l) => l.closerName === closer);
      const shows = cLeads.filter((l) => l.meetingStatus === "Show");
      const offers = cLeads.filter((l) => l.offerMade);
      const sales = cLeads.filter(
        (l) => l.leadStatus === "Won"
      );
      const oneCall = sales.filter((l) => l.isOneCallSale === true);
      const followUp = sales.filter((l) => l.isOneCallSale === false);
      const lostByReason: Record<string, number> = {};
      lossReasons.forEach((r) => {
        lostByReason[r] = cLeads.filter(
          (l) => l.lossReason === r
        ).length;
      });

      const totalValue = sales.reduce((sum, l) => sum + l.totalDealValue, 0);
      const totalRevenue = sales.reduce(
        (sum, l) => sum + (l.totalDealValue - l.refundClawbackAmount),
        0
      );

      const agingFollowUps = cLeads.filter((l) => {
        if (l.leadStatus !== "Follow-Up Ongoing") return false;
        if (!l.lastTouchDate) return true;
        const daysSince = Math.floor(
          (Date.now() - new Date(l.lastTouchDate).getTime()) / 86400000
        );
        return daysSince >= 7;
      });

      closerMetrics[closer] = {
        totalLeads: cLeads.length,
        callsTaken: shows.length,
        offers: offers.length,
        offerRate:
          shows.length > 0
            ? Math.round((offers.length / shows.length) * 100)
            : 0,
        sales: sales.length,
        closeRate:
          shows.length > 0
            ? Math.round((sales.length / shows.length) * 100)
            : 0,
        closeRateOnOffers:
          offers.length > 0
            ? Math.round((sales.length / offers.length) * 100)
            : 0,
        oneCallSales: oneCall.length,
        followUpSales: followUp.length,
        avgDealSize: sales.length > 0 ? totalValue / sales.length : 0,
        rpc: shows.length > 0 ? totalRevenue / shows.length : 0,
        lossReasons: lostByReason,
        agingFollowUps: agingFollowUps.length,
      };
    }

    const won = leads.filter((l) => l.leadStatus === "Won");
    const totalSales = won.length;
    const deposits = won.reduce((sum, l) => sum + l.depositAmount, 0);
    const revenueGenerated = won.reduce(
      (sum, l) => sum + (l.totalDealValue - l.refundClawbackAmount),
      0
    );
    const cashCollected = won.reduce((sum, l) => sum + l.cashCollected, 0);
    const paidInFull = won.filter((l) => l.datePaidInFull);
    const refunds = won.reduce((sum, l) => sum + l.refundClawbackAmount, 0);

    let depositConversionCount = 0;
    let totalDaysToCollect = 0;
    won.forEach((l) => {
      if (l.datePaidInFull && l.depositAmount > 0) {
        depositConversionCount++;
        const created = new Date(l.dateCreated).getTime();
        const paid = new Date(l.datePaidInFull).getTime();
        totalDaysToCollect += (paid - created) / 86400000;
      }
    });

    const commByRep: Record<string, number> = {};
    won.forEach((l) => {
      const rep = l.closerName;
      if (!rep) return;
      commByRep[rep] =
        (commByRep[rep] || 0) + l.earnings;
    });

    return {
      setterMetrics,
      closerMetrics,
      moneyMetrics: {
        deposits,
        totalSales,
        revenueGenerated,
        cashCollected,
        paidInFull: paidInFull.length,
        depositToPaidConversion:
          won.length > 0
            ? Math.round((paidInFull.length / won.length) * 100)
            : 0,
        avgDaysToCollect:
          depositConversionCount > 0
            ? (totalDaysToCollect / depositConversionCount).toFixed(1)
            : "0",
        refunds,
        netRevenue: revenueGenerated - refunds,
        commissionsByRep: commByRep,
      },
    };
  },
});
