import { v } from "convex/values";
import { action } from "./_generated/server";

export const fetchRates = action({
  args: {
    from: v.string(),
    to: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (_, args) => {
    let url = `https://api.frankfurter.app/latest?from=${args.from}`;
    if (args.to) url += `&to=${args.to}`;
    if (args.amount) url += `&amount=${args.amount}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch rates");
    return await res.json();
  },
});
