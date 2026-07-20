"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Doc } from "convex/_generated/dataModel";
import LeadCard from "./LeadCard";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Doc<"leads"> | null>(null);
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
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleNewLead = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    onSaveLead(data);
    setModalOpen(false);
    setEditingLead(null);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingLead(null);
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colLeads = leads.filter((l) => l.leadStatus === col);
            return (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`kanban-column rounded-lg ${
                      snapshot.isDraggingOver ? "bg-gray-100" : "bg-gray-50"
                    } p-3`}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="font-semibold text-sm text-gray-700">
                        {col}
                      </h3>
                      <span className="badge badge-gray text-xs">
                        {colLeads.length}
                      </span>
                    </div>
                    <div className="space-y-2 min-h-[60px]">
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

      {modalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={onDeleteLead}
        />
      )}

      {activityOpen && (
        <DailyActivityInput onClose={() => setActivityOpen(false)} />
      )}
    </div>
  );
}
