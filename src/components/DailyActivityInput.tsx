"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";

interface DailyActivityInputProps {
  onClose: () => void;
  initialSetter?: string;
}

export default function DailyActivityInput({
  onClose,
  initialSetter = "",
}: DailyActivityInputProps) {
  const logActivity = useMutation(api.dailyActivity.logActivity);

  const [setterName, setSetterName] = useState(initialSetter);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dialsDMsent, setDialsDMsent] = useState(0);
  const [conversations, setConversations] = useState(0);
  const [callsScheduled, setCallsScheduled] = useState(0);
  const [callsTaken, setCallsTaken] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setterName.trim()) return;
    setSaving(true);
    await logActivity({
      setterName: setterName.trim(),
      date,
      dialsDMsent,
      conversations,
      callsScheduled,
      callsTaken,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md z-10 mx-2">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold">Log Daily Activity</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Setter Name</label>
            <input className="input" value={setterName} onChange={(e) => setSetterName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dials / DMs Sent</label>
            <input className="input" type="number" min="0" value={dialsDMsent} onChange={(e) => setDialsDMsent(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Conversations</label>
            <input className="input" type="number" min="0" value={conversations} onChange={(e) => setConversations(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Calls Scheduled</label>
            <input className="input" type="number" min="0" value={callsScheduled} onChange={(e) => setCallsScheduled(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Calls Taken</label>
            <input className="input" type="number" min="0" value={callsTaken} onChange={(e) => setCallsTaken(parseInt(e.target.value) || 0)} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            {saving ? "Saving..." : "Save Activity"}
          </button>
        </form>
      </div>
    </div>
  );
}
