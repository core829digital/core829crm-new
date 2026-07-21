import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify } from "./notify";

export const serviceCategories = {
  "Software Development": [
    "Web Application", "Mobile App (iOS)", "Mobile App (Android)",
    "API Development", "Database Design & Architecture",
    "Cloud Migration & Infrastructure", "DevOps & CI/CD Setup",
    "Code Audit & Refactoring", "UI/UX Design & Prototyping",
    "E-commerce Platform", "CMS Development", "Custom CRM Development",
    "SaaS Platform Development", "Blockchain / DLT Solution",
    "Smart Contract Development", "QA & Automated Testing",
    "Security Audit & Penetration Testing",
    "Legacy System Migration", "Microservices Architecture",
    "Real-time System (WebSocket/SSE)",
  ],
  "Marketing Services": [
    "SEO Optimization", "PPC Campaign Management",
    "Social Media Management", "Content Marketing Strategy",
    "Email Marketing & Automation", "Brand Strategy & Identity",
    "Market Research & Analysis", "Conversion Rate Optimization",
    "Marketing Automation Setup", "Influencer Marketing",
    "Video Production & Editing", "Copywriting & Content Creation",
    "PR & Communications", "Analytics & Reporting Dashboard",
    "Growth Strategy Consulting",
  ],
  "AI Services": [
    "Custom AI Model Development", "Chatbot / Conversational AI",
    "Data Pipeline & ETL Engineering", "NLP / Text Analytics Solution",
    "Computer Vision System", "RAG (Retrieval Augmented Generation)",
    "AI Consulting & Strategy", "ML Ops & Model Deployment",
    "Predictive Analytics Engine", "Recommendation System",
    "Document Intelligence (OCR/Extraction)",
    "Voice AI / Speech Recognition",
  ],
} as Record<string, string[]>;

export const listByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("services")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    category: v.string(),
    serviceName: v.string(),
    description: v.optional(v.string()),
    quoteAmount: v.number(),
    quoteFileId: v.optional(v.id("_storage")),
    quoteFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("services", {
      ...args,
      status: "Pending",
      createdAt: new Date().toISOString(),
    });
    await notify(ctx, {
      type: "service_added",
      title: "Service / Quote Added",
      message: `${args.serviceName} (${args.category}) — $${args.quoteAmount.toLocaleString()}`,
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("services"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.id);
    if (!service) throw new Error("Service not found");

    await ctx.db.patch(args.id, { status: args.status });

    if (args.status === "Accepted") {
      const client = await ctx.db.get(service.clientId);
      if (client?.leadId) {
        const lead = await ctx.db.get(client.leadId);
        if (lead && lead.leadStatus !== "Won") {
          await ctx.db.patch(client.leadId, { leadStatus: "Won" });
        }
      }
      await notify(ctx, {
        type: "service_accepted",
        title: "Service / Quote Accepted",
        message: `${service.serviceName} accepted — $${service.quoteAmount.toLocaleString()}`,
      });
    }
    if (args.status === "Declined") {
      await notify(ctx, {
        type: "service_declined",
        title: "Service / Quote Declined",
        message: `${service.serviceName} was declined`,
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("services") },
  handler: async (ctx, args) => {
    const service = await ctx.db.get(args.id);
    if (service?.quoteFileId) {
      await ctx.storage.delete(service.quoteFileId);
    }
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
