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

export const projectStatuses = [
  "Active",
  "On-Hold",
  "Completed",
  "Cancelled",
] as const;

export const invoiceStatuses = [
  "Pending",
  "Paid",
  "Overdue",
  "Cancelled",
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

  clients: defineTable({
    leadId: v.optional(v.id("leads")),
    clientName: v.string(),
    company: v.string(),
    email: v.string(),
    phone: v.string(),
    createdAt: v.string(),
  }).index("by_leadId", ["leadId"]),

  projects: defineTable({
    clientId: v.id("clients"),
    projectName: v.string(),
    description: v.string(),
    status: v.string(),
    startDate: v.string(),
    deadline: v.optional(v.string()),
    totalValue: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_clientId", ["clientId"]),

  projectTasks: defineTable({
    projectId: v.id("projects"),
    taskName: v.string(),
    completed: v.boolean(),
    createdAt: v.string(),
  }).index("by_projectId", ["projectId"]),

  invoices: defineTable({
    projectId: v.id("projects"),
    invoiceNumber: v.string(),
    amount: v.number(),
    status: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_projectId", ["projectId"]),

  users: defineTable({
    userId: v.string(),
    name: v.string(),
    surname: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    role: v.string(),
    createdBy: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_userId", ["userId"]),

  activityLogs: defineTable({
    userId: v.string(),
    userName: v.string(),
    action: v.string(),
    details: v.optional(v.string()),
    timestamp: v.string(),
  }).index("by_userId", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  notifications: defineTable({
    userId: v.optional(v.string()),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.string(),
  }).index("by_userId", ["userId"])
    .index("by_all", ["createdAt"]),

  services: defineTable({
    clientId: v.id("clients"),
    category: v.string(),
    serviceName: v.string(),
    description: v.optional(v.string()),
    quoteAmount: v.number(),
    quoteFileId: v.optional(v.id("_storage")),
    quoteFileName: v.optional(v.string()),
    status: v.string(),
    createdAt: v.string(),
  }).index("by_clientId", ["clientId"]),

  announcements: defineTable({
    text: v.string(),
    bgColor: v.string(),
    textColor: v.string(),
    isActive: v.boolean(),
    order: v.number(),
    createdAt: v.string(),
  }).index("by_active", ["isActive"]),

  loginAttempts: defineTable({
    userId: v.string(),
    ip: v.optional(v.string()),
    success: v.boolean(),
    timestamp: v.string(),
  }).index("by_userId_timestamp", ["userId", "timestamp"]),
});
