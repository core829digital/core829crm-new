import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const leadStatuses = [
  "New",
  "Proposal",
  "Deposit",
  "Follow-Up Ongoing",
  "Meeting Follow-Up",
  "Won",
  "Lost",
] as const;

export const meetingStatuses = [
  "Show",
  "No-Show",
  "Rescheduled By Us",
  "Rescheduled By Them",
  "Cancel",
  "DQ",
] as const;

export const lossReasons = [
  "Price",
  "Timing",
  "Partner-Spouse",
  "Competitor",
  "Ghosted",
  "Not Qualified",
] as const;

export default defineSchema({
  leads: defineTable({
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
    earnings: v.number(),
    lastTouchDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_status", ["leadStatus"])
    .index("by_setter", ["setterName"])
    .index("by_closer", ["closerName"])
    .index("by_created", ["dateCreated"]),

  dailyActivities: defineTable({
    setterName: v.string(),
    date: v.string(),
    dialsDMsent: v.number(),
    conversations: v.number(),
    callsScheduled: v.number(),
    callsTaken: v.number(),
  }).index("by_setter_date", ["setterName", "date"]),

  revenueGoals: defineTable({
    monthlyGoal: v.number(),
    month: v.string(),
  }).index("by_month", ["month"]),
});
