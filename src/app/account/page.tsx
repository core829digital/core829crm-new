"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function AccountPage() {
  const { user } = useAuth();
  const changePassword = useMutation(api.users.changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next !== again) return setMsg({ ok: false, text: "The two new passwords do not match." });
    if (next.length < 10) return setMsg({ ok: false, text: "The new password must be at least 10 characters." });
    setBusy(true);
    try {
      const r = await changePassword({ userId: user.userId, currentPassword: current, newPassword: next });
      if (r.ok) {
        setMsg({ ok: true, text: "Password changed." });
        setCurrent(""); setNext(""); setAgain("");
      } else setMsg({ ok: false, text: "Current password is incorrect." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error && /Too many/.test(err.message) ? "Too many attempts. Try again in 15 minutes." : "Could not change the password." });
    } finally {
      setBusy(false);
    }
  };
  const cls = "w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm";
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">My account</h1>
      <p className="text-sm text-zinc-500 mb-5">{user.name} {user.surname} · ID {user.userId}</p>
      <form onSubmit={submit} className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
        <h2 className="font-semibold">Change password</h2>
        <input type="password" autoComplete="current-password" placeholder="Current password" className={cls} value={current} onChange={(e) => setCurrent(e.target.value)} />
        <input type="password" autoComplete="new-password" placeholder="New password (min 10 characters)" className={cls} value={next} onChange={(e) => setNext(e.target.value)} />
        <input type="password" autoComplete="new-password" placeholder="Repeat new password" className={cls} value={again} onChange={(e) => setAgain(e.target.value)} />
        {msg && <p role="alert" className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
        <button disabled={busy || !current || !next} className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save new password"}
        </button>
      </form>
    </div>
  );
}
