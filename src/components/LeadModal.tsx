"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Id } from "convex/_generated/dataModel";

const leadStatuses = [
  "New",
  "Proposal",
  "Deposit",
  "Follow-Up Ongoing",
  "Meeting Follow-Up",
  "Won",
  "Lost",
] as const;

const meetingStatuses = [
  "",
  "Show",
  "No-Show",
  "Rescheduled By Us",
  "Rescheduled By Them",
  "Cancel",
  "DQ",
] as const;

const lossReasons = [
  "",
  "Price",
  "Timing",
  "Partner-Spouse",
  "Competitor",
  "Ghosted",
  "Not Qualified",
] as const;

interface LeadData {
  _id?: Id<"leads">;
  leadName: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  setterName: string;
  closerName: string;
  leadStatus: string;
  dateCreated: string;
  firstContactDate?: string;
  dateMeetingBooked?: string;
  dateOfMeeting?: string;
  meetingStatus?: string;
  offerMade: boolean;
  isOneCallSale?: boolean;
  lossReason?: string;
  depositAmount: number;
  totalDealValue: number;
  cashCollected: number;
  datePaidInFull?: string;
  refundClawbackAmount: number;
  commissionPercent: number;
  lastTouchDate?: string;
}

interface LeadModalProps {
  lead?: LeadData | null;
  onClose: () => void;
  onSave: (data: LeadData) => void;
  onDelete?: (id: Id<"leads">) => void;
}

function defaultForm(lead?: LeadData | null): LeadData {
  return {
    leadName: lead?.leadName || "",
    company: lead?.company || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    source: lead?.source || "",
    setterName: lead?.setterName || "",
    closerName: lead?.closerName || "",
    leadStatus: lead?.leadStatus || "New",
    dateCreated: lead?.dateCreated || new Date().toISOString().split("T")[0],
    firstContactDate: lead?.firstContactDate || "",
    dateMeetingBooked: lead?.dateMeetingBooked || "",
    dateOfMeeting: lead?.dateOfMeeting || "",
    meetingStatus: lead?.meetingStatus || "",
    offerMade: lead?.offerMade ?? false,
    isOneCallSale: lead?.isOneCallSale,
    lossReason: lead?.lossReason || "",
    depositAmount: lead?.depositAmount ?? 0,
    totalDealValue: lead?.totalDealValue ?? 0,
    cashCollected: lead?.cashCollected ?? 0,
    datePaidInFull: lead?.datePaidInFull || "",
    refundClawbackAmount: lead?.refundClawbackAmount ?? 0,
    commissionPercent: lead?.commissionPercent ?? 0,
    lastTouchDate: lead?.lastTouchDate || "",
  };
}

export default function LeadModal({ lead, onClose, onSave, onDelete }: LeadModalProps) {
  const initial = useMemo(() => defaultForm(lead), [lead]);
  const [form, setForm] = useState<LeadData>(initial);
  const isEditing = !!lead?._id;

  const update = (field: keyof LeadData, value: string | boolean | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const earnings =
    (form.totalDealValue - form.refundClawbackAmount) *
    (form.commissionPercent / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-10">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 mx-2">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">
            {isEditing ? "Edit Lead" : "New Lead"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lead Name *</label>
              <input className="input" value={form.leadName} onChange={(e) => update("leadName", e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
              <input className="input" value={form.company} onChange={(e) => update("company", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <input className="input" value={form.source} onChange={(e) => update("source", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Setter Name</label>
              <input className="input" value={form.setterName} onChange={(e) => update("setterName", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Closer Name</label>
              <input className="input" value={form.closerName} onChange={(e) => update("closerName", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lead Status</label>
              <select className="select" value={form.leadStatus} onChange={(e) => update("leadStatus", e.target.value)}>
                {leadStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Dates & Meeting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Created</label>
                <input className="input" type="date" value={form.dateCreated} onChange={(e) => update("dateCreated", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Contact Date</label>
                <input className="input" type="datetime-local" value={form.firstContactDate || ""} onChange={(e) => update("firstContactDate", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Meeting Booked</label>
                <input className="input" type="date" value={form.dateMeetingBooked || ""} onChange={(e) => update("dateMeetingBooked", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Meeting</label>
                <input className="input" type="date" value={form.dateOfMeeting || ""} onChange={(e) => update("dateOfMeeting", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Status</label>
                <select className="select" value={form.meetingStatus || ""} onChange={(e) => update("meetingStatus", e.target.value)}>
                  {meetingStatuses.map((s) => (
                    <option key={s} value={s}>{s || "—"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Touch Date</label>
                <input className="input" type="date" value={form.lastTouchDate || ""} onChange={(e) => update("lastTouchDate", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Call Outcome</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm">Offer Made</label>
                <input type="checkbox" checked={form.offerMade} onChange={(e) => update("offerMade", e.target.checked)} className="w-4 h-4 accent-red-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sale Type</label>
                <select className="select" value={form.isOneCallSale === undefined ? "" : form.isOneCallSale ? "true" : "false"} onChange={(e) => {
                  const val = e.target.value;
                  update("isOneCallSale", val === "" ? undefined : val === "true");
                }}>
                  <option value="">—</option>
                  <option value="true">1-Call Sale</option>
                  <option value="false">Follow-Up Sale</option>
                </select>
              </div>
              {form.leadStatus === "Lost" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Loss Reason *</label>
                  <select className="select" value={form.lossReason || ""} required onChange={(e) => update("lossReason", e.target.value)}>
                    {lossReasons.map((r) => (
                      <option key={r} value={r}>{r || "—"}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Money</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Deposit Amount</label>
                <input className="input" type="number" min="0" step="0.01" value={form.depositAmount} onChange={(e) => update("depositAmount", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total Deal Value</label>
                <input className="input" type="number" min="0" step="0.01" value={form.totalDealValue} onChange={(e) => update("totalDealValue", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cash Collected</label>
                <input className="input" type="number" min="0" step="0.01" value={form.cashCollected} onChange={(e) => update("cashCollected", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date Paid In Full</label>
                <input className="input" type="date" value={form.datePaidInFull || ""} onChange={(e) => update("datePaidInFull", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Refund/Clawback Amount</label>
                <input className="input" type="number" min="0" step="0.01" value={form.refundClawbackAmount} onChange={(e) => update("refundClawbackAmount", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Commission %</label>
                <input className="input" type="number" min="0" max="100" step="0.1" value={form.commissionPercent} onChange={(e) => update("commissionPercent", parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
              <span className="font-medium">Earnings: </span>
              <span className="text-red-600 font-bold">${earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-gray-500 ml-2">
                (Total - Refunds) × Commission %
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(lead._id!)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete Lead
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditing ? "Save Changes" : "Create Lead"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
