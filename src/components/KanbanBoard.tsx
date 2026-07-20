"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Doc } from "convex/_generated/dataModel";
import LeadCard from "./LeadCard";
import LeadPreview from "./LeadPreview";
import LeadModal from "./LeadModal";
import DailyActivityInput from "./DailyActivityInput";

const columns = [
  "New",
  "Proposal",
  "Deposit",
  "Follow-Up Ongoing",
  "Meeting Follow-Up",
  "Won",
  "Lost",
] as const;

interface KanbanBoardProps {
  leads: Doc<"leads">[];
  onUpdateStatus: (id: string, status: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaveLead: (data: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDeleteLead: (id: any) => void;
}

export default function KanbanBoard({
  leads,
  onUpdateStatus,
  onSaveLead,
  onDeleteLead,
}: KanbanBoardProps) {
  const [previewLead, setPreviewLead] = useState<Doc<"leads"> | null>(null);
  const [editLead, setEditLead] = useState<Doc<"leads"> | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { draggableId, destination } = result;
      onUpdateStatus(draggableId, destination.droppableId);
    },
    [onUpdateStatus]
  );

  const handleCardClick = (lead: Doc<"leads">) => {
    setPreviewLead(lead);
  };

  const handleNewLead = () => {
    setShowNewModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    onSaveLead(data);
    setEditLead(null);
    setPreviewLead(null);
    setShowNewModal(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = (id: any) => {
    onDeleteLead(id);
    setEditLead(null);
    setPreviewLead(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActivityOpen(true)}
            className="btn btn-secondary text-sm"
          >
            Log Daily Activity
          </button>
          <button
            onClick={handleNewLead}
            className="btn btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} />
            New Lead
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-2 sm:gap-3 pb-4 kanban-scroll">
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.leadStatus === col);
            return (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-w-0 rounded-lg ${
                      snapshot.isDraggingOver ? "bg-gray-100" : "bg-gray-50"
                    } p-2 sm:p-3`}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-700 truncate">
                        {col}
                      </h3>
                      <span className="badge badge-gray text-xs shrink-0 ml-1">
                        {colLeads.length}
                      </span>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-h-[60px]">
                      {colLeads.map((lead, index) => (
                        <LeadCard
                          key={lead._id}
                          lead={lead}
                          index={index}
                          onClick={() => handleCardClick(lead)}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {showNewModal && (
        <LeadModal
          lead={null}
          onClose={() => setShowNewModal(false)}
          onSave={handleSave}
        />
      )}

      {previewLead && !editLead && (
        <LeadPreview
          lead={previewLead}
          onClose={() => setPreviewLead(null)}
          onEdit={() => setEditLead(previewLead)}
        />
      )}

      {editLead && (
        <LeadModal
          lead={editLead}
          onClose={() => { setEditLead(null); setPreviewLead(null); }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {activityOpen && (
        <DailyActivityInput onClose={() => setActivityOpen(false)} />
      )}
    </div>
  );
}
