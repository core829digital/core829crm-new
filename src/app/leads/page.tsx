"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import LeadTable from "@/components/LeadTable";

export default function LeadsPage() {
  const leads = useQuery(api.leads.list, {});
  const createLead = useMutation(api.leads.create);
  const updateLead = useMutation(api.leads.update);
  const deleteLead = useMutation(api.leads.remove);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: any) => {
    if (data._id) {
      const { _id, ...fields } = data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateLead({ id: _id, ...fields } as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createLead(data as any);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = async (id: any) => {
    await deleteLead({ id });
  };

  if (leads === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return <LeadTable leads={leads} onSave={handleSave} onDelete={handleDelete} />;
}
