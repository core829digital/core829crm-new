"use client";

import { Draggable } from "@hello-pangea/dnd";
import { DollarSign, User, AlertTriangle } from "lucide-react";
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
          className={`card cursor-pointer text-sm mb-2 transition-shadow hover:shadow-md ${
            snapshot.isDragging ? "shadow-lg rotate-2" : ""
          } ${isAging ? "border-red-400" : ""}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="font-semibold truncate">{lead.leadName}</div>
              <div className="text-xs text-gray-500 truncate">{lead.company}</div>
            </div>
            <span className={`badge ${statusColors[lead.leadStatus] || "badge-gray"} shrink-0`}>
              {lead.leadStatus}
            </span>
          </div>

          <div className="space-y-1 text-xs text-gray-600">
            {lead.setterName && (
              <div className="flex items-center gap-1.5">
                <User size={12} />
                <span>S: {lead.setterName} | C: {lead.closerName || "—"}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <DollarSign size={12} />
              <span>
                ${lead.totalDealValue?.toLocaleString() ?? 0}
                {lead.depositAmount > 0 && (
                  <span className="text-gray-400 ml-1">
                    (${lead.depositAmount.toLocaleString()} dep)
                  </span>
                )}
              </span>
            </div>
            {lead.source && (
              <div className="text-gray-400">{lead.source}</div>
            )}
            {isAging && (
              <div className="flex items-center gap-1.5 text-red-600 font-medium mt-1">
                <AlertTriangle size={12} />
                <span>Aging 7+ days</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
