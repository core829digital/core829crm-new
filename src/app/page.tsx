"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import KanbanBoard from "@/components/KanbanBoard";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const leads = useQuery(api.leads.list, {});
  const createLead = useMutation(api.leads.create);
  const updateLead = useMutation(api.leads.update);
  const deleteLead = useMutation(api.leads.remove);

  const handleUpdateStatus = async (id: string, status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateLead({ id: id as Id<"leads">, leadStatus: status, _userId: user?.userId, _userName: user?.name + " " + user?.surname } as any);
  };

  const handleSaveLead = async (data: Record<string, unknown>) => {
    if (data._id) {
      const { _id, ...fields } = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateLead({ id: _id as Id<"leads">, ...fields, _userId: user?.userId, _userName: user?.name + " " + user?.surname } as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createLead({ ...data, _userId: user?.userId, _userName: user?.name + " " + user?.surname } as any);
    }
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLead({ id: id as Id<"leads"> });
  };

  if (leads === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <KanbanBoard
      leads={leads}
      onUpdateStatus={handleUpdateStatus}
      onSaveLead={handleSaveLead}
      onDeleteLead={handleDeleteLead}
    />
  );
}
