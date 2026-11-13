"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Trash2, X, Loader2 } from "lucide-react";
import { Doc } from "convex/_generated/dataModel";
import LeadModal from "./LeadModal";
import { useAuth } from "@/components/AuthContext";

type LeadData = Doc<"leads">;

interface LeadTableProps {
  leads: LeadData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
  /** Eliminazione definitiva di piu' lead (solo amministratore). Restituisce quanti ne ha eliminati. */
  onDeleteMany?: (ids: string[]) => Promise<number>;
}

const NO_NICHE = "__none__";
const CONFIRM_WORD = "DELETE";

type SortKey = "leadName" | "company" | "leadStatus" | "setterName" | "closerName" | "dateCreated" | "totalDealValue";

function SortHeader({
  label,
  sortField,
  currentSort,
  sortDir,
  onToggle,
}: {
  label: string;
  sortField: SortKey;
  currentSort: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (field: SortKey) => void;
}) {
  return (
    <th
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 whitespace-nowrap"
      onClick={() => onToggle(sortField)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentSort === sortField ? (
          sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        ) : (
          <ArrowUpDown size={14} className="opacity-30" />
        )}
      </div>
    </th>
  );
}

export default function LeadTable({ leads, onSave, onDelete, onDeleteMany }: LeadTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.userId === "00001" && onDeleteMany !== undefined;
  const [nicheFilter, setNicheFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dateCreated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingLead, setEditingLead] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const statuses = ["all", "New", "Proposal", "Deposit", "Follow-Up Ongoing", "Meeting Follow-Up", "Won", "Lost"];

  const filtered = useMemo(() => {
    let result = [...leads];

    if (statusFilter !== "all") {
      result = result.filter((l) => l.leadStatus === statusFilter);
    }
    if (nicheFilter === NO_NICHE) {
      result = result.filter((l) => !l.niche);
    } else if (nicheFilter !== "all") {
      result = result.filter((l) => l.niche === nicheFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.leadName?.toLowerCase().includes(s) ||
          l.company?.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s) ||
          l.phone?.includes(s) ||
          l.niche?.toLowerCase().includes(s) ||
          l.notes?.toLowerCase().includes(s)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortKey] ?? "";
      let bVal = b[sortKey] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, statusFilter, nicheFilter, sortKey, sortDir]);

  /** Nicchie presenti nei lead, con il conteggio, per il filtro. */
  const niches = useMemo(() => {
    const counts = new Map<string, number>();
    let none = 0;
    for (const l of leads) {
      if (l.niche) counts.set(l.niche, (counts.get(l.niche) ?? 0) + 1);
      else none++;
    }
    return { list: [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])), none };
  }, [leads]);

  // La selezione conta solo i lead ancora visibili con i filtri attuali (niente eliminazioni "nascoste").
  const visibleSelected = useMemo(() => filtered.filter((l) => selected.has(l._id)), [filtered, selected]);
  const allVisibleSelected = filtered.length > 0 && visibleSelected.length === filtered.length;

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) for (const l of filtered) next.delete(l._id);
      else for (const l of filtered) next.add(l._id);
      return next;
    });

  const runBulkDelete = async () => {
    if (!onDeleteMany) return;
    const ids = visibleSelected.map((l) => l._id as string);
    setDeleting(true);
    try {
      let total = 0;
      for (let i = 0; i < ids.length; i += 500) total += await onDeleteMany(ids.slice(i, i + 500));
      setSelected(new Set());
      setConfirmOpen(false);
      setConfirmText("");
      setNotice(`${total} lead deleted permanently.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleCardClick = (lead: Doc<"leads">) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    onSave(data);
    setModalOpen(false);
    setEditingLead(null);
  };

  const badgeClass = (status: string) => {
    switch (status) {
      case "Won": return "badge-green";
      case "Lost": return "badge-red";
      case "New": return "badge-blue";
      default: return "badge-yellow";
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Lead Log</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s}
              </option>
            ))}
          </select>
          <select className="select" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} aria-label="Filter by niche">
            <option value="all">All niches</option>
            {niches.list.map(([n, c]) => (
              <option key={n} value={n}>{n} ({c})</option>
            ))}
            {niches.none > 0 && <option value={NO_NICHE}>No niche ({niches.none})</option>}
          </select>
        </div>
      </div>

      {notice && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Close" className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
        </div>
      )}

      {isAdmin && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none sm:hidden">
            <input type="checkbox" className="h-4 w-4 accent-red-600" checked={allVisibleSelected} onChange={toggleAllVisible} />
            Select all shown ({filtered.length})
          </label>
          {visibleSelected.length > 0 && (
            <>
              <span className="font-medium">{visibleSelected.length} selected</span>
              <button type="button" className="text-gray-500 hover:text-gray-800 underline" onClick={() => setSelected(new Set())}>Clear</button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
                onClick={() => { setConfirmText(""); setConfirmOpen(true); }}
              >
                <Trash2 size={15} /> Delete permanently
              </button>
            </>
          )}
        </div>
      )}

      {/* Mobile card view */}
      <div className="sm:hidden space-y-2">
        {filtered.map((lead) => (
          <div
            key={lead._id}
            onClick={() => handleCardClick(lead)}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 active:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              {isAdmin && (
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                  checked={selected.has(lead._id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleOne(lead._id)}
                  aria-label={`Select ${lead.company || lead.leadName}`}
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{lead.leadName}</div>
                {lead.company && (
                  <div className="text-xs text-gray-500 truncate">{lead.company}</div>
                )}
              </div>
              <span className={`badge ${badgeClass(lead.leadStatus)} text-[10px] shrink-0`}>
                {lead.leadStatus === "Follow-Up Ongoing" ? "F/Up" : lead.leadStatus === "Meeting Follow-Up" ? "Mtg F/Up" : lead.leadStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
              <div><span className="text-gray-400">Setter:</span> {lead.setterName || "—"}</div>
              <div><span className="text-gray-400">Closer:</span> {lead.closerName || "—"}</div>
              <div><span className="text-gray-400">Value:</span> <span className="font-medium text-gray-700">${(lead.totalDealValue || 0).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Earnings:</span> <span className="font-medium text-red-600">${(lead.earnings || 0).toLocaleString()}</span></div>
              {lead.email && <div className="col-span-2 truncate"><span className="text-gray-400">📧</span> {lead.email}</div>}
              <div className="col-span-2 flex items-center gap-2 text-[10px] text-gray-400">
                <span>Created: {lead.dateCreated ? new Date(lead.dateCreated).toLocaleDateString() : "—"}</span>
                {lead.meetingStatus && (
                  <span>Mtg: {lead.meetingStatus}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No leads found</div>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto border border-gray-200 rounded-lg table-scroll">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {isAdmin && (
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" className="h-4 w-4 accent-red-600" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all shown leads" />
                </th>
              )}
              <SortHeader label="Lead Name" sortField="leadName" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Company" sortField="company" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niche</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <SortHeader label="Status" sortField="leadStatus" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Setter" sortField="setterName" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Closer" sortField="closerName" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Created" sortField="dateCreated" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting</th>
              <SortHeader label="Value" sortField="totalDealValue" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((lead) => (
              <tr
                key={lead._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCardClick(lead)}
              >
                {isAdmin && (
                  <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-red-600"
                      checked={selected.has(lead._id)}
                      onChange={() => toggleOne(lead._id)}
                      aria-label={`Select ${lead.company || lead.leadName}`}
                    />
                  </td>
                )}
                <td className="px-3 py-3 font-medium whitespace-nowrap">{lead.leadName}</td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{lead.company}</td>
                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{lead.niche || "—"}</td>
                <td className="px-3 py-3 text-gray-600 text-xs max-w-[160px] truncate">
                  <div>{lead.email}</div>
                  <div>{lead.phone}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`badge ${badgeClass(lead.leadStatus)}`}>
                    {lead.leadStatus}
                  </span>
                </td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{lead.setterName}</td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{lead.closerName}</td>
                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {lead.dateCreated ? new Date(lead.dateCreated).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {lead.meetingStatus || "—"}
                </td>
                <td className="px-3 py-3 whitespace-nowrap font-medium">
                  ${(lead.totalDealValue || 0).toLocaleString()}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  ${(lead.cashCollected || 0).toLocaleString()}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-red-600 font-medium">
                  ${(lead.earnings || 0).toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 13 : 12} className="px-3 py-8 text-center text-gray-400">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-del-title">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 id="bulk-del-title" className="text-lg font-semibold">Delete {visibleSelected.length} lead permanently?</h2>
            <p className="mt-2 text-sm text-gray-600">
              They will be removed from the CRM forever. Clients created from these leads stay (only the link is removed). This cannot be undone — export a backup from Data first if you are unsure.
            </p>
            <ul className="mt-3 max-h-32 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600">
              {visibleSelected.slice(0, 50).map((l) => (
                <li key={l._id} className="truncate">{l.company || l.leadName}{l.niche ? ` · ${l.niche}` : ""}</li>
              ))}
              {visibleSelected.length > 50 && <li>… and {visibleSelected.length - 50} more</li>}
            </ul>
            <label className="mt-4 block text-sm" htmlFor="bulk-del-confirm">Type <strong>{CONFIRM_WORD}</strong> to confirm</label>
            <input id="bulk-del-confirm" className="input mt-1" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" autoFocus />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={deleting || confirmText.trim() !== CONFIRM_WORD}
                onClick={() => void runBulkDelete()}
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={() => { setModalOpen(false); setEditingLead(null); }}
          onSave={handleSave}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
