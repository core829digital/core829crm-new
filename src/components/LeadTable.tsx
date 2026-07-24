"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Doc } from "convex/_generated/dataModel";
import LeadModal from "./LeadModal";

type LeadData = Doc<"leads">;

interface LeadTableProps {
  leads: LeadData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => void;
  onDelete: (id: string) => void;
}

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

export default function LeadTable({ leads, onSave, onDelete }: LeadTableProps) {
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

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.leadName?.toLowerCase().includes(s) ||
          l.company?.toLowerCase().includes(s) ||
          l.email?.toLowerCase().includes(s) ||
          l.phone?.includes(s)
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
  }, [leads, search, statusFilter, sortKey, sortDir]);

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
        </div>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-2">
        {filtered.map((lead) => (
          <div
            key={lead._id}
            onClick={() => handleCardClick(lead)}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 active:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
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
              <SortHeader label="Lead Name" sortField="leadName" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Company" sortField="company" currentSort={sortKey} sortDir={sortDir} onToggle={toggleSort} />
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
                <td className="px-3 py-3 font-medium whitespace-nowrap">{lead.leadName}</td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{lead.company}</td>
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
                <td colSpan={11} className="px-3 py-8 text-center text-gray-400">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
