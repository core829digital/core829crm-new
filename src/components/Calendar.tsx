"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, AlertTriangle, Clock } from "lucide-react";
import { Doc, Id } from "convex/_generated/dataModel";

const statusColors: Record<string, string> = {
  New: "#2563eb",
  Proposal: "#ca8a04",
  Deposit: "#16a34a",
  "Follow-Up Ongoing": "#ca8a04",
  "Meeting Follow-Up": "#2563eb",
  Won: "#16a34a",
  Lost: "#dc2626",
};

const meetingStatuses = [
  "", "Show", "No-Show", "Rescheduled By Us", "Rescheduled By Them", "Cancel", "DQ",
] as const;

const lossReasons = [
  "", "Price", "Timing", "Partner-Spouse", "Competitor", "Ghosted", "Not Qualified",
] as const;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface CalendarProps {
  leads: Doc<"leads">[];
  onCreateLead: (data: Record<string, unknown>) => Promise<unknown>;
  onUpdateLead: (data: Record<string, unknown>) => Promise<void>;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const cells: { date: Date; dayNum: number; isCurrent: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startPad + 1;
    const date = new Date(year, month, dayNum);
    cells.push({ date, dayNum, isCurrent: dayNum >= 1 && dayNum <= daysInMonth });
  }
  return cells;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar({ leads, onCreateLead, onUpdateLead }: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newModal, setNewModal] = useState<{ date: Date } | null>(null);
  const [detailLead, setDetailLead] = useState<Doc<"leads"> | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const leadsByDate = useMemo(() => {
    const map = new Map<string, Doc<"leads">[]>();
    for (const l of leads) {
      if (!l.dateOfMeeting) continue;
      const d = l.dateOfMeeting.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(l);
    }
    return map;
  }, [leads]);

  const hasMeetings = useMemo(() => {
    for (const l of leads) if (l.dateOfMeeting) return true;
    return false;
  }, [leads]);

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  const handleCellClick = (date: Date) => {
    setNewModal({ date });
  };

  const handleBlockClick = (lead: Doc<"leads">) => {
    setDetailLead(lead);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    const lead = leads.find((l) => l._id === leadId);
    if (!lead) return;
    const newDate = `${dateKey(targetDate)}T12:00:00`;
    await onUpdateLead({ id: leadId as Id<"leads">, dateOfMeeting: newDate });
  };

  const handleDragEnd = () => setDraggingId(null);

  const blockSignal = useCallback((lead: Doc<"leads">) => {
    const now = Date.now();
    const signals: string[] = [];
    if (lead.dateMeetingBooked && lead.dateOfMeeting) {
      const booked = new Date(lead.dateMeetingBooked).getTime();
      const meeting = new Date(lead.dateOfMeeting).getTime();
      const lag = (meeting - booked) / 86400000;
      if (lag > 4) signals.push("lag");
    }
    if (lead.leadStatus === "Follow-Up Ongoing" && lead.lastTouchDate) {
      const daysSince = Math.floor((now - new Date(lead.lastTouchDate).getTime()) / 86400000);
      if (daysSince >= 7) signals.push("aging");
    }
    if (lead.dateOfMeeting && !lead.meetingStatus) {
      const meetingDate = new Date(lead.dateOfMeeting);
      const dayAfter = new Date(meetingDate.getTime() + 86400000);
      if (now > dayAfter.getTime()) signals.push("missing");
    }
    return signals;
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="btn btn-secondary text-sm">Today</button>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="btn btn-secondary p-1.5"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-base min-w-[180px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="btn btn-secondary p-1.5"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {!hasMeetings && (
        <div className="text-center py-12 text-gray-400">
          No meetings scheduled. Click a day to create one.
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-gray-500 uppercase text-center">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d[0]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map(({ date, dayNum, isCurrent }) => {
            const key = dateKey(date);
            const dayLeads = leadsByDate.get(key) || [];
            const isToday = sameDay(date, today);
            const isDragOver = draggingId !== null;

            return (
              <div
                key={key}
                className={`min-h-[90px] sm:min-h-[120px] border-b border-r border-gray-100 p-[2px] sm:p-1 relative ${
                  !isCurrent ? "bg-gray-50" : "bg-white"
                } ${isDragOver ? "bg-blue-50" : ""}`}
                onDragOver={isCurrent ? handleDragOver : undefined}
                onDrop={isCurrent ? (e) => handleDrop(e, date) : undefined}
                onClick={() => isCurrent && handleCellClick(date)}
              >
                <div className={`text-[10px] sm:text-xs font-medium mb-[1px] sm:mb-1 px-1 py-[1px] sm:py-0.5 rounded-full w-fit ${
                  isToday ? "bg-red-600 text-white font-bold" : isCurrent ? "text-gray-700" : "text-gray-300"
                }`}>
                  {dayNum}
                </div>

                <div className="space-y-[1px] sm:space-y-0.5">
                  {dayLeads.slice(0, isCurrent && dayLeads.length > 2 ? 2 : dayLeads.length).map((lead) => {
                    const signals = blockSignal(lead);
                    return (
                      <div
                        key={lead._id}
                        onClick={(e) => { e.stopPropagation(); handleBlockClick(lead); }}
                        className={`text-[9px] sm:text-[11px] leading-tight px-1 sm:px-1.5 py-[1px] sm:py-1 rounded cursor-pointer transition-shadow hover:shadow-md ${
                          signals.includes("lag") || signals.includes("aging")
                            ? "bg-red-50 border border-red-300 text-red-700"
                            : signals.includes("missing")
                            ? "bg-amber-50 border border-amber-300 text-amber-700"
                            : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColors[lead.leadStatus] || "#999" }} />
                          <span className="font-medium truncate flex-1">{lead.leadName}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayLeads.length > 2 && isCurrent && (
                    <div className="text-[8px] sm:text-[10px] text-gray-400 text-center pt-[1px]">
                      +{dayLeads.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {newModal && (
        <NewMeetingModal
          date={newModal.date}
          leads={leads}
          onClose={() => setNewModal(null)}
          onCreateLead={onCreateLead}
          onUpdateLead={onUpdateLead}
        />
      )}

      {detailLead && (
        <MeetingDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onUpdateLead={onUpdateLead}
        />
      )}
    </div>
  );
}

function NewMeetingModal({
  date, leads, onClose, onCreateLead, onUpdateLead,
}: {
  date: Date;
  leads: Doc<"leads">[];
  onClose: () => void;
  onCreateLead: (data: Record<string, unknown>) => Promise<unknown>;
  onUpdateLead: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [time, setTime] = useState("12:00");
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newSetter, setNewSetter] = useState("");
  const [newCloser, setNewCloser] = useState("");

  const filtered = useMemo(() => {
    if (!search) return leads;
    const s = search.toLowerCase();
    return leads.filter((l) =>
      l.leadName?.toLowerCase().includes(s) || l.company?.toLowerCase().includes(s)
    );
  }, [leads, search]);

  const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const meetingDateTime = `${dateKey(date)}T${time}:00`;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === "new") {
        await onCreateLead({
          leadName: newName,
          company: newCompany,
          email: newEmail,
          phone: newPhone,
          source: newSource || "Calendar",
          setterName: newSetter,
          closerName: newCloser,
          leadStatus: "New",
          dateCreated: new Date().toISOString().split("T")[0],
          dateMeetingBooked: new Date().toISOString().split("T")[0],
          dateOfMeeting: meetingDateTime,
          offerMade: false,
          depositAmount: 0,
          totalDealValue: 0,
          cashCollected: 0,
          refundClawbackAmount: 0,
          commissionPercent: 0,
        });
      } else {
        await onUpdateLead({
          id: selectedId as Id<"leads">,
          dateMeetingBooked: new Date().toISOString().split("T")[0],
          dateOfMeeting: meetingDateTime,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center pt-0 sm:pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-md z-10 sm:mx-2 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-xl sm:rounded-t-lg">
          <h2 className="font-bold">New Meeting — {dateStr}</h2>
          <button onClick={onClose} className="p-2 sm:p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setMode("existing")} className={`btn text-sm flex-1 ${mode === "existing" ? "btn-primary" : "btn-secondary"}`}>
              Existing Lead
            </button>
            <button onClick={() => setMode("new")} className={`btn text-sm flex-1 ${mode === "new" ? "btn-primary" : "btn-secondary"}`}>
              New Lead
            </button>
          </div>

          {mode === "existing" ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search & Select Lead</label>
              <input className="input mb-2" placeholder="Search by name or company..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                {filtered.map((l) => (
                  <div
                    key={l._id}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedId === l._id ? "bg-red-50 font-medium" : ""}`}
                    onClick={() => setSelectedId(l._id)}
                  >
                    <div>{l.leadName}</div>
                    <div className="text-xs text-gray-400">{l.company} — {l.leadStatus}</div>
                  </div>
                ))}
                {filtered.length === 0 && <div className="px-3 py-4 text-sm text-gray-400 text-center">No leads found</div>}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lead Name *</label>
                <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                  <input className="input" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                  <input className="input" value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="Calendar" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input className="input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Setter Name</label>
                  <input className="input" value={newSetter} onChange={(e) => setNewSetter(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Closer Name</label>
                  <input className="input" value={newCloser} onChange={(e) => setNewCloser(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <Clock size={14} className="inline mr-1" />
              Meeting Time
            </label>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div>Date Meeting Booked: <strong>{new Date().toLocaleDateString()}</strong> (auto)</div>
            <div>Date of Meeting: <strong>{date.toLocaleDateString()} at {time}</strong></div>
          </div>
        </div>

        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || (mode === "existing" && !selectedId) || (mode === "new" && !newName.trim())}
            className="btn btn-primary text-sm"
          >
            {saving ? "Saving..." : "Create Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingDetailModal({
  lead, onClose, onUpdateLead,
}: {
  lead: Doc<"leads">;
  onClose: () => void;
  onUpdateLead: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [meetingStatus, setMeetingStatus] = useState(lead.meetingStatus || "");
  const [offerMade, setOfferMade] = useState(lead.offerMade ?? false);
  const [isOneCallSale, setIsOneCallSale] = useState<boolean | undefined>(lead.isOneCallSale);
  const [lossReason, setLossReason] = useState(lead.lossReason || "");
  const [leadStatus, setLeadStatus] = useState(lead.leadStatus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        id: lead._id as Id<"leads">,
        meetingStatus: meetingStatus || undefined,
        offerMade,
        isOneCallSale: isOneCallSale ?? undefined,
      };
      if (leadStatus === "Lost") {
        updates.lossReason = lossReason || undefined;
      }
      if (leadStatus !== lead.leadStatus) {
        updates.leadStatus = leadStatus;
        if (leadStatus !== "Lost") updates.lossReason = undefined;
      }
      await onUpdateLead(updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!confirm("Cancel this meeting? This will set Meeting Status to Cancel.")) return;
    setSaving(true);
    try {
      await onUpdateLead({
        id: lead._id as Id<"leads">,
        meetingStatus: "Cancel",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const earnings =
    (lead.totalDealValue - lead.refundClawbackAmount) *
    (lead.commissionPercent / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center pt-0 sm:pt-12">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto z-10 sm:mx-2">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-xl sm:rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColors[lead.leadStatus] || "#999" }} />
            <h2 className="font-bold truncate">{lead.leadName}</h2>
          </div>
          <button onClick={onClose} className="p-2 sm:p-1 hover:bg-gray-100 rounded-lg shrink-0"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-400">Company:</span> <span className="font-medium">{lead.company || "—"}</span></div>
            <div><span className="text-gray-400">Status:</span> <span className="font-medium">{lead.leadStatus}</span></div>
            <div><span className="text-gray-400">Setter:</span> <span className="font-medium">{lead.setterName || "—"}</span></div>
            <div><span className="text-gray-400">Closer:</span> <span className="font-medium">{lead.closerName || "—"}</span></div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meeting Info</h3>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><span className="text-gray-400">Booked:</span> {lead.dateMeetingBooked ? new Date(lead.dateMeetingBooked).toLocaleDateString() : "—"}</div>
              <div><span className="text-gray-400">Meeting:</span> {lead.dateOfMeeting ? new Date(lead.dateOfMeeting).toLocaleString() : "—"}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Status</label>
                <select className="select" value={meetingStatus} onChange={(e) => setMeetingStatus(e.target.value)}>
                  {meetingStatuses.map((s) => <option key={s} value={s}>{s || "—"}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm">Offer Made</label>
                <input type="checkbox" checked={offerMade} onChange={(e) => setOfferMade(e.target.checked)} className="w-4 h-4 accent-red-600" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sale Type</label>
                <select className="select" value={isOneCallSale === undefined ? "" : isOneCallSale ? "true" : "false"} onChange={(e) => {
                  const v = e.target.value;
                  setIsOneCallSale(v === "" ? undefined : v === "true");
                }}>
                  <option value="">—</option>
                  <option value="true">1-Call Sale</option>
                  <option value="false">Follow-Up Sale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lead Status</label>
                <select className="select" value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)}>
                  {["New","Proposal","Deposit","Follow-Up Ongoing","Meeting Follow-Up","Won","Lost"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {leadStatus === "Lost" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Loss Reason *</label>
                  <select className="select" value={lossReason} onChange={(e) => setLossReason(e.target.value)}>
                    {lossReasons.map((r) => <option key={r} value={r}>{r || "—"}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Info</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">Email:</span> {lead.email || "—"}</div>
              <div><span className="text-gray-400">Phone:</span> {lead.phone || "—"}</div>
              <div><span className="text-gray-400">Source:</span> {lead.source || "—"}</div>
              <div><span className="text-gray-400">First Contact:</span> {lead.firstContactDate ? new Date(lead.firstContactDate).toLocaleString() : "—"}</div>
            </div>
          </div>

          {lead.totalDealValue > 0 && (
            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Financials</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Deal Value:</span> ${lead.totalDealValue.toLocaleString()}</div>
                <div><span className="text-gray-400">Earnings:</span> ${Math.round(earnings).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t px-4 py-3 flex items-center justify-between rounded-b-lg">
          <button onClick={handleDeleteMeeting} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1">
            Cancel Meeting
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary text-xs">Close</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary text-xs">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
