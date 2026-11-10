import { v } from "convex/values";
import { action } from "./_generated/server";

export const fetchRates = action({
  args: {
    from: v.string(),
    to: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Le azioni non leggono il database: basta un token valido firmato dal server.
    if (!(await ctx.auth.getUserIdentity())) throw new Error("Not authenticated");
    if (!/^[A-Za-z]{3}$/.test(args.from) || (args.to !== undefined && !/^[A-Za-z]{3}(,[A-Za-z]{3})*$/.test(args.to))) throw new Error("Invalid currency code");
    let url = `https://api.frankfurter.app/latest?from=${args.from}`;
    if (args.to) url += `&to=${args.to}`;
    if (args.amount) url += `&amount=${args.amount}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch rates");
    return await res.json();
  },
});
