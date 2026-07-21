"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import Calendar from "@/components/Calendar";

export default function CalendarPage() {
  const leads = useQuery(api.leads.list, {});
  const createLead = useMutation(api.leads.create);
  const updateLead = useMutation(api.leads.update);

  const handleCreateLead = async (data: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await createLead(data as any);
  };

  const handleUpdateLead = async (data: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateLead(data as any);
  };

  if (leads === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Calendar
      leads={leads}
      onCreateLead={handleCreateLead}
      onUpdateLead={handleUpdateLead}
    />
  );
}
