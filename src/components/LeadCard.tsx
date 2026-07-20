"use client";

import { Draggable } from "@hello-pangea/dnd";
import { DollarSign, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

interface LeadData {
  _id: string;
  leadName: string;
  company: string;
  leadStatus: string;
  setterName: string;
  closerName: string;
  totalDealValue: number;
  depositAmount: number;
  source: string;
  lastTouchDate?: string;
  meetingStatus?: string;
  dateOfMeeting?: string;
  dateCreated: string;
  offerMade: boolean;
}

interface LeadCardProps {
  lead: LeadData;
  index: number;
  onClick: () => void;
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

const meetingBadge: Record<string, string> = {
  Show: "badge-green",
  "No-Show": "badge-red",
  Cancel: "badge-red",
  DQ: "badge-gray",
};

export default function LeadCard({ lead, index, onClick }: LeadCardProps) {
  const [now] = useState(() => Date.now());
  const isAging = useMemo(() => {
    if (lead.leadStatus !== "Follow-Up Ongoing" || !lead.lastTouchDate) return false;
    const daysSince = Math.floor(
      (now - new Date(lead.lastTouchDate).getTime()) / 86400000
    );
    return daysSince >= 7;
  }, [lead.leadStatus, lead.lastTouchDate, now]);

  return (
    <Draggable draggableId={lead._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white border rounded-md ${
            isAging ? "border-red-300" : "border-gray-200"
          } px-2.5 py-2 text-xs cursor-pointer transition-shadow hover:shadow-sm ${
            snapshot.isDragging ? "shadow-md rotate-1" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-1 mb-1">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm leading-tight truncate">{lead.leadName}</div>
              {lead.company && (
                <div className="text-[11px] text-gray-400 truncate">{lead.company}</div>
              )}
            </div>
            <span className={`badge ${statusColors[lead.leadStatus] || "badge-gray"} text-[10px] px-1.5 py-0.5 shrink-0`}>
              {lead.leadStatus === "Follow-Up Ongoing" ? "F/Up" : lead.leadStatus === "Meeting Follow-Up" ? "Mtg F/Up" : lead.leadStatus}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-600 mb-1">
            <span className="flex items-center gap-0.5">
              <DollarSign size={10} />
              {lead.totalDealValue?.toLocaleString() ?? 0}
            </span>
            {lead.depositAmount > 0 && (
              <span className="text-gray-400">
                ${lead.depositAmount.toLocaleString()} dep
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 flex-wrap">
            {lead.setterName && (
              <span className="truncate max-w-[80px]">{lead.setterName}</span>
            )}
            {lead.meetingStatus && (
              <span className={`badge ${meetingBadge[lead.meetingStatus] || "badge-gray"} text-[9px] px-1 py-0`}>
                {lead.meetingStatus === "No-Show" ? "NS" : lead.meetingStatus === "Rescheduled By Us" ? "ReschU" : lead.meetingStatus === "Rescheduled By Them" ? "ReschT" : lead.meetingStatus}
              </span>
            )}
            {lead.offerMade && (
              <span className="badge badge-green text-[9px] px-1 py-0">Offer</span>
            )}
          </div>

          {isAging && (
            <div className="flex items-center gap-1 text-red-600 font-medium mt-1 text-[10px]">
              <AlertTriangle size={10} />
              <span>Aging 7+</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
