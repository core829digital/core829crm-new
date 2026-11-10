"use client";

import { clientCategories } from "../../convex/lib/catalog";

/** Settore + nicchia del cliente (cataloghi in convex/lib/catalog.ts). */
export default function CategoryNichePicker({
  category, niche, onChange, className = "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm",
}: {
  category?: string;
  niche?: string;
  onChange: (next: { category: string; niche: string }) => void;
  className?: string;
}) {
  const niches = category ? clientCategories[category] ?? [] : [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <select aria-label="Category" className={className} value={category ?? ""} onChange={(e) => onChange({ category: e.target.value, niche: "" })}>
        <option value="">Category…</option>
        {Object.keys(clientCategories).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select aria-label="Niche" className={className} value={niche ?? ""} disabled={!category} onChange={(e) => onChange({ category: category ?? "", niche: e.target.value })}>
        <option value="">{category ? "Niche…" : "Pick a category first"}</option>
        {niches.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}
