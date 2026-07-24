"use client";

import { X, Edit3, DollarSign, CalendarDays, Phone, User, Tag, Building2, Mail, AlertTriangle, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Doc } from "convex/_generated/dataModel";

interface LeadPreviewProps {
  lead: Doc<"leads">;
  onClose: () => void;
  onEdit: () => void;
}

const statusColors: Record<string, string> = {
  New: "badge-blue",
  Proposal: "badge-yellow",
  Deposit: "badge-green",
  "Follow-Up Ongoing": "badge-yellow",
  "Meeting Follow-Up": "badge-blue",
  Won: "badge-green",
  Lost: "badge-red",
};

const meetingStatusColors: Record<string, string> = {
  Show: "badge-green",
  "No-Show": "badge-red",
  Cancel: "badge-red",
  DQ: "badge-gray",
  "Rescheduled By Us": "badge-yellow",
  "Rescheduled By Them": "badge-yellow",
};

export default function LeadPreview({ lead, onClose, onEdit }: LeadPreviewProps) {
  const [now] = useState(() => Date.now());
  const earnings =
    (lead.totalDealValue - lead.refundClawbackAmount) *
    (lead.commissionPercent / 100);

  const isAging =
    lead.leadStatus === "Follow-Up Ongoing" &&
    lead.lastTouchDate &&
    Math.floor((now - new Date(lead.lastTouchDate).getTime()) / 86400000) >= 7;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center pt-0 sm:pt-12">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto z-10 sm:mx-2">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 rounded-t-xl sm:rounded-t-lg">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-bold text-base truncate">{lead.leadName}</h2>
            <span className={`badge shrink-0 ${statusColors[lead.leadStatus] || "badge-gray"}`}>
              {lead.leadStatus}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="btn btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
            >
              <Edit3 size={14} />
              Edit
            </button>
            <button onClick={onClose} className="p-2 sm:p-1.5 hover:bg-gray-100 rounded-lg ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 text-sm">
          {isAging && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs font-medium">
              <AlertTriangle size={14} />
              Lead aging — no touch in 7+ days
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{lead.leadName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{lead.company || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{lead.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{lead.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Tag size={14} className="text-gray-400 shrink-0" />
                <span>{lead.source || "—"}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sales Team</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400 text-xs">Setter</span>
                <div className="font-medium">{lead.setterName || "—"}</div>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Closer</span>
                <div className="font-medium">{lead.closerName || "—"}</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <CalendarDays size={12} className="inline mr-1" />
              Dates & Meeting
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div><span className="text-gray-400">Created:</span> <span className="font-medium">{lead.dateCreated ? new Date(lead.dateCreated).toLocaleDateString() : "—"}</span></div>
              <div><span className="text-gray-400">First Contact:</span> <span className="font-medium">{lead.firstContactDate ? new Date(lead.firstContactDate).toLocaleString() : "—"}</span></div>
              <div><span className="text-gray-400">Meeting Booked:</span> <span className="font-medium">{lead.dateMeetingBooked ? new Date(lead.dateMeetingBooked).toLocaleDateString() : "—"}</span></div>
              <div><span className="text-gray-400">Meeting Date:</span> <span className="font-medium">{lead.dateOfMeeting ? new Date(lead.dateOfMeeting).toLocaleDateString() : "—"}</span></div>
              <div><span className="text-gray-400">Last Touch:</span> <span className="font-medium">{lead.lastTouchDate ? new Date(lead.lastTouchDate).toLocaleDateString() : "—"}</span></div>
              <div>
                <span className="text-gray-400">Meeting Status:</span>{" "}
                {lead.meetingStatus ? (
                  <span className={`badge ${meetingStatusColors[lead.meetingStatus] || "badge-gray"} text-[10px]`}>{lead.meetingStatus}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <TrendingUp size={12} className="inline mr-1" />
              Call Outcome
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Offer Made:</span>{" "}
                <span className={`font-medium ${lead.offerMade ? "text-green-600" : "text-gray-500"}`}>
                  {lead.offerMade ? "Yes" : "No"}
                </span>
              </div>
              {lead.isOneCallSale !== undefined && (
                <div>
                  <span className="text-gray-400">Sale Type:</span>{" "}
                  <span className="font-medium">{lead.isOneCallSale ? "1-Call Sale" : "Follow-Up Sale"}</span>
                </div>
              )}
              {lead.lossReason && (
                <div className="col-span-2">
                  <span className="text-gray-400">Loss Reason:</span>{" "}
                  <span className="font-medium text-red-600">{lead.lossReason}</span>
                </div>
              )}
            </div>
          </div>

          {lead.notes && (
            <div className="border-t pt-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
              <div className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md leading-relaxed">
                {lead.notes}
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <DollarSign size={12} className="inline mr-1" />
              Financials
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div><span className="text-gray-400">Deposit:</span> <span className="font-medium">${(lead.depositAmount || 0).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Deal Value:</span> <span className="font-medium">${(lead.totalDealValue || 0).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Cash Collected:</span> <span className="font-medium">${(lead.cashCollected || 0).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Paid In Full:</span> <span className="font-medium">{lead.datePaidInFull ? new Date(lead.datePaidInFull).toLocaleDateString() : "—"}</span></div>
              <div><span className="text-gray-400">Refund/Clawback:</span> <span className={`font-medium ${lead.refundClawbackAmount > 0 ? "text-red-600" : ""}`}>${(lead.refundClawbackAmount || 0).toLocaleString()}</span></div>
              <div><span className="text-gray-400">Commission:</span> <span className="font-medium">{lead.commissionPercent}%</span></div>
              <div className="col-span-2 p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-500">Earnings:</span>{" "}
                <span className="font-bold text-red-600">${Math.round(earnings).toLocaleString()}</span>
                <span className="text-gray-400 ml-1 text-xs">(value − refunds) × {lead.commissionPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex justify-end gap-2 rounded-b-xl sm:rounded-b-lg">
          <button onClick={onClose} className="btn btn-secondary text-xs py-2.5 sm:py-1.5">
            Close
          </button>
          <button onClick={onEdit} className="btn btn-primary text-xs flex items-center gap-1.5 py-2.5 sm:py-1.5">
            <Edit3 size={14} />
            Edit Lead
          </button>
        </div>
      </div>
    </div>
  );
}
