"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useAuth } from "./AuthContext";
import {
  Users, Shield, Activity, BarChart3, TrendingUp, Plus, X, Loader2,
  RefreshCw, DollarSign, Coins, UserCheck, Target, Megaphone, Pencil,
} from "lucide-react";

const allRoles = [
  "Shareholders' Meeting (General Assembly)", "Board of Directors", "Founder",
  "Chief Executive Officer (CEO)", "Sole Director / Managing Director",
  "Chairman of the Board of Directors", "General Manager (GM)",
  "Board of Statutory Auditors / Sole Statutory Auditor",
  "Independent Auditor (Statutory Auditor of Accounts)",
  "Chief Technology Officer (CTO) / Technical Director", "Head of Engineering",
  "Project Manager", "Product Owner", "Product Manager", "Solution Architect",
  "Senior Software Developer", "Junior Software Developer", "Front-End Developer",
  "Back-End Developer", "Full-Stack Developer", "Quality Assurance Manager (QA Manager)",
  "QA Tester", "DevOps Manager / Infrastructure Manager", "System Administrator",
  "Chief Information Security Officer (CISO)", "UX/UI Designer", "Data Analyst / Data Engineer",
  "Chief Revenue Officer (CRO) / Head of Sales", "Sales Manager", "Account Executive",
  "Sales Development Representative (Setter)", "Deal Closer", "Key Account Manager",
  "Business Development Manager", "Customer Onboarding Specialist",
  "Marketing Manager", "Corporate Communications Manager", "Social Media Manager",
  "Content Manager / Copywriter", "SEO/SEM Manager", "Graphic Designer",
  "Press & Public Relations Officer", "Chief Financial Officer (CFO)",
  "Head of General Accounting", "Accountant", "Financial Controller (Controlling Manager)",
  "Accounts Payable/Receivable Specialist", "Treasury Manager", "Procurement Manager",
  "Human Resources Manager (HR Manager)", "Recruiter (Talent Acquisition Specialist)",
  "Payroll Specialist", "Training & Development Manager",
  "Health & Safety Officer (Workplace Safety Manager)",
  "General Counsel (Head of Legal Affairs)", "Data Protection Officer (DPO)",
  "Internal Data Controller", "Regulatory & Contract Compliance Officer",
  "Intellectual Property Manager", "Customer Success Manager", "Help Desk Manager",
  "Tier 1 Support Specialist", "Tier 2 Support Specialist",
  "Product Maintenance & Updates Manager", "Operations Manager",
  "Logistics & Vendor Manager", "Office Manager", "General Administrative Assistant",
];

type Tab = "users" | "logs" | "market" | "performance" | "announcements";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user || user.userId !== "00001") {
    return (
      <div className="text-center py-20 text-red-500">
        <Shield size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm text-zinc-400 mt-1">Only the admin can access this page.</p>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const [tab, setTab] = useState<Tab>("users");

  const tabs = [
    { id: "users" as Tab, label: "User Management", icon: Users },
    { id: "logs" as Tab, label: "Activity Logs", icon: Activity },
    { id: "market" as Tab, label: "Market Analysis", icon: TrendingUp },
    { id: "performance" as Tab, label: "Performance", icon: BarChart3 },
    { id: "announcements" as Tab, label: "Announcements", icon: Megaphone },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-black text-white"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "users" && <UserManagement />}
      {tab === "logs" && <ActivityLogs />}
      {tab === "market" && <MarketAnalysis />}
      {tab === "performance" && <UserPerformance />}
      {tab === "announcements" && <AnnouncementsManagement />}
    </div>
  );
}

function UserManagement() {
  const users = useQuery(api.users.listUsers, {});
  const createUser = useMutation(api.users.createUser);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(allRoles[0]);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name || !surname || !password) return;
    setCreating(true);
    setError("");
    setCreatedId("");
    try {
      const id = await createUser({ adminUserId: "00001", name, surname, password, role });
      setCreatedId(id);
      setName(""); setSurname(""); setPassword(""); setRole(allRoles[0]);
      setShowForm(false);
    } catch {
      setError("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users size={18} /> Users
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-50 rounded-lg p-4 mb-4 space-y-3">
          {createdId && (
            <div className="bg-green-100 text-green-700 text-sm rounded-lg px-3 py-2">
              User created! ID: <strong>{createdId}</strong>
            </div>
          )}
          {error && <div className="bg-red-100 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Name *" className="border border-zinc-300 rounded-lg px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Surname *" className="border border-zinc-300 rounded-lg px-3 py-2 text-sm" value={surname} onChange={(e) => setSurname(e.target.value)} />
          </div>
          <input placeholder="Password *" type="password" className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            {allRoles.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating || !name || !surname || !password}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create User"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {users?.map((u) => (
          <div key={u._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                {u.name[0]}{u.surname[0]}
              </div>
              <div>
                <div className="text-sm font-medium">{u.name} {u.surname}</div>
                <div className="text-xs text-zinc-400">ID: {u.userId} &middot; {u.role}</div>
              </div>
            </div>
            <div className="text-xs text-zinc-400">
              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}
            </div>
          </div>
        ))}
        {users?.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">No users yet</p>}
      </div>
    </div>
  );
}

function ActivityLogs() {
  const logs = useQuery(api.activityLogs.list, { limit: 100 });

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <Activity size={18} /> Activity Logs
      </h2>
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {logs?.map((log) => (
          <div key={log._id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-zinc-50 text-sm">
            <div className="w-2 h-2 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-xs">{log.userName}</span>
                <span className="text-xs text-zinc-400">({log.userId})</span>
                <span className="text-xs text-zinc-500">{log.action}</span>
              </div>
              {log.details && <div className="text-xs text-zinc-400 mt-0.5">{log.details}</div>}
              <div className="text-[10px] text-zinc-300 mt-0.5">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {logs?.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">No logs yet</p>}
      </div>
    </div>
  );
}

function MarketAnalysis() {
  const fetchRatesAction = useAction(api.market.fetchRates);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState("USD");

  const fetchRates = async (base: string) => {
    setLoading(true);
    try {
      const data = await fetchRatesAction({ from: base });
      setRates(data.rates);
    } catch {
      setRates(null);
    } finally {
      setLoading(false);
    }
  };

  const [amount, setAmount] = useState(100);
  const [fromCur, setFromCur] = useState("USD");
  const [toCur, setToCur] = useState("EUR");
  const [convResult, setConvResult] = useState<number | null>(null);
  const [convLoading, setConvLoading] = useState(false);

  const convert = async () => {
    setConvLoading(true);
    try {
      const data = await fetchRatesAction({ from: fromCur, to: toCur, amount });
      setConvResult(data.rates[toCur]);
    } catch {
      setConvResult(null);
    } finally {
      setConvLoading(false);
    }
  };

  const popular = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "CNY", "BRL"];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <TrendingUp size={18} /> Currency Exchange Rates
        </h2>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-zinc-500">Base:</span>
          <select
            className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm"
            value={baseCurrency}
            onChange={(e) => { setBaseCurrency(e.target.value); setRates(null); }}
          >
            {popular.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => fetchRates(baseCurrency)}
            disabled={loading}
            className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Fetch Rates
          </button>
        </div>

        {rates && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(rates).slice(0, 20).map(([cur, rate]) => (
              <div key={cur} className="bg-zinc-50 rounded-lg px-3 py-2 text-sm flex justify-between">
                <span className="font-medium">{cur}</span>
                <span className="text-zinc-600">{typeof rate === "number" ? rate.toFixed(4) : rate}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Coins size={18} /> Currency Converter
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Amount</label>
            <input type="number" className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm w-24" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">From</label>
            <select className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm" value={fromCur} onChange={(e) => setFromCur(e.target.value)}>
              {popular.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">To</label>
            <select className="border border-zinc-300 rounded-lg px-3 py-1.5 text-sm" value={toCur} onChange={(e) => setToCur(e.target.value)}>
              {popular.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={convert}
            disabled={convLoading}
            className="flex items-center gap-1 text-sm bg-black text-white px-4 py-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            {convLoading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
            Convert
          </button>
          {convResult !== null && (
            <div className="text-sm font-medium bg-green-50 px-4 py-1.5 rounded-lg border border-green-200">
              {amount} {fromCur} = {convResult.toFixed(2)} {toCur}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserPerformance() {
  const leads = useQuery(api.leads.list, {});
  const usersList = useQuery(api.users.listUsers, {});

  if (!leads || !usersList) {
    return <div className="text-zinc-400 text-center py-8">Loading...</div>;
  }

  const wonLeads = leads.filter((l) => l.leadStatus === "Won");
  const totalRevenue = wonLeads.reduce((s, l) => s + l.totalDealValue, 0);
  const totalCash = wonLeads.reduce((s, l) => s + l.cashCollected, 0);

  const userStats = usersList.map((u) => {
    const byUser = leads.filter((l) =>
      l.setterName?.toLowerCase().includes(u.name.toLowerCase()) ||
      l.closerName?.toLowerCase().includes(u.name.toLowerCase())
    );
    const won = byUser.filter((l) => l.leadStatus === "Won");
    const revenue = won.reduce((s, l) => s + l.totalDealValue, 0);
    const cash = won.reduce((s, l) => s + l.cashCollected, 0);
    return { ...u, totalLeads: byUser.length, won: won.length, revenue, cash };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 flex items-center gap-1"><Target size={12} /> Total Leads</div>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 flex items-center gap-1"><UserCheck size={12} /> Won</div>
          <p className="text-2xl font-bold mt-1">{wonLeads.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 flex items-center gap-1"><DollarSign size={12} /> Revenue</div>
          <p className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="text-xs text-zinc-400 flex items-center gap-1"><DollarSign size={12} /> Cash</div>
          <p className="text-2xl font-bold mt-1">${totalCash.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <BarChart3 size={18} /> Per-User Stats
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-400 text-xs">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium text-right">Leads</th>
                <th className="pb-2 font-medium text-right">Won</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
                <th className="pb-2 font-medium text-right">Cash</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((u) => (
                <tr key={u._id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2 font-medium">{u.name} {u.surname}</td>
                  <td className="py-2 text-zinc-400">{u.userId}</td>
                  <td className="py-2 text-zinc-500 text-xs">{u.role}</td>
                  <td className="py-2 text-right">{u.totalLeads}</td>
                  <td className="py-2 text-right text-green-600 font-medium">{u.won}</td>
                  <td className="py-2 text-right">${u.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right">${u.cash.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {userStats.length === 0 && <p className="text-center text-zinc-400 py-8">No users</p>}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Target size={18} /> Top Performers (by Revenue)
        </h2>
        <div className="space-y-2">
          {[...userStats].filter((u) => u.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((u, i) => (
            <div key={u._id} className="flex items-center gap-3 py-1.5">
              <span className="w-6 text-center text-sm font-bold text-zinc-300">#{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                {u.name[0]}{u.surname[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{u.name} {u.surname}</div>
                <div className="text-xs text-zinc-400">{u.won} deals closed</div>
              </div>
              <div className="text-sm font-bold">${u.revenue.toLocaleString()}</div>
            </div>
          ))}
          {userStats.filter((u) => u.revenue > 0).length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-4">No closed deals yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

const PRESET_COLORS = [
  { label: "Dark", bg: "#18181b", text: "#ffffff" },
  { label: "Red", bg: "#dc2626", text: "#ffffff" },
  { label: "Blue", bg: "#2563eb", text: "#ffffff" },
  { label: "Green", bg: "#16a34a", text: "#ffffff" },
  { label: "Amber", bg: "#d97706", text: "#ffffff" },
  { label: "Purple", bg: "#9333ea", text: "#ffffff" },
  { label: "Zinc", bg: "#27272a", text: "#ffffff" },
  { label: "Rose", bg: "#e11d48", text: "#ffffff" },
  { label: "White", bg: "#ffffff", text: "#18181b" },
];

function AnnouncementsManagement() {
  const announcements = useQuery(api.announcements.list);
  const createAnnouncement = useMutation(api.announcements.create);
  const updateAnnouncement = useMutation(api.announcements.update);
  const removeAnnouncement = useMutation(api.announcements.remove);

  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState("#18181b");
  const [textColor, setTextColor] = useState("#ffffff");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<Id<"announcements"> | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const resetForm = () => {
    setText(""); setBgColor("#18181b"); setTextColor("#ffffff"); setEditingId(null); setErrMsg("");
  };

  const handleSave = async () => {
    if (!text.trim()) { setErrMsg("Text cannot be empty"); return; }
    setSaving(true);
    setErrMsg("");
    try {
      if (editingId) {
        await updateAnnouncement({ id: editingId, text: text.trim(), bgColor, textColor });
      } else {
        const count = announcements?.length || 0;
        await createAnnouncement({ text: text.trim(), bgColor, textColor, order: count + 1 });
      }
      resetForm();
    } catch (e) {
      setErrMsg("Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a: { _id: Id<"announcements">; text: string; bgColor: string; textColor: string }) => {
    setText(a.text); setBgColor(a.bgColor); setTextColor(a.textColor); setEditingId(a._id); setErrMsg("");
  };

  const handleCancel = () => { resetForm(); };

  const handleToggle = async (a: { _id: Id<"announcements">; isActive: boolean }) => {
    try {
      await updateAnnouncement({ id: a._id, isActive: !a.isActive });
    } catch (e) {
      setErrMsg("Toggle failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const activeCount = announcements?.filter((a) => a.isActive).length || 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Megaphone size={18} /> Announcements
          </h2>
          <span className="text-xs text-zinc-400">{activeCount}/5 active</span>
        </div>

          <div className="bg-zinc-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </h3>
              {editingId && (
                <button onClick={handleCancel} className="text-xs text-zinc-400 hover:text-zinc-600">
                  Cancel
                </button>
              )}
            </div>
            {errMsg && (
              <div className="bg-red-100 text-red-600 text-sm rounded-lg px-3 py-2">{errMsg}</div>
            )}
          <textarea
            placeholder="Announcement text..."
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
          />
          <div className="text-xs text-zinc-400 text-right">{text.length}/200</div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">Color preset</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setBgColor(p.bg); setTextColor(p.text); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    bgColor === p.bg ? "border-black scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: p.bg }}
                  title={p.label}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Preview</label>
              <div className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: bgColor, color: textColor }}>
                {text || "Preview text"}
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
            {editingId ? "Update Announcement" : "Add Announcement"}
          </button>
        </div>

        <div className="space-y-2">
          {announcements?.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-6">No announcements yet</p>
          )}
          {announcements?.map((a) => (
            <div
              key={a._id}
              className={`flex items-center justify-between py-2 px-3 rounded-lg border transition-all ${
                a.isActive ? "border-zinc-200" : "border-zinc-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  onClick={() => handleToggle(a)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                    a.isActive ? "bg-green-500 border-green-500" : "border-zinc-300"
                  }`}
                  title={a.isActive ? "Deactivate" : "Activate"}
                >
                  {a.isActive && <span className="text-white text-[10px]">✓</span>}
                </button>
                <div className="rounded px-2 py-1 text-xs font-medium truncate" style={{ backgroundColor: a.bgColor, color: a.textColor }}>
                  {a.text}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm("Delete this announcement?")) removeAnnouncement({ id: a._id }); }}
                  className="p-1 text-zinc-400 hover:text-red-500"
                  title="Delete"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
