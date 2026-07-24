"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Phone, Target, AlertTriangle } from "lucide-react";

const lossReasonColors: Record<string, string> = {
  Price: "bg-red-100 text-red-700",
  Timing: "bg-yellow-100 text-yellow-700",
  "Partner-Spouse": "bg-purple-100 text-purple-700",
  Competitor: "bg-blue-100 text-blue-700",
  Ghosted: "bg-gray-100 text-gray-700",
  "Not Qualified": "bg-orange-100 text-orange-700",
};

export default function DashboardPage() {
  const [setterFilter, setSetterFilter] = useState("all");
  const [closerFilter, setCloserFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dashboardData = useQuery(api.leads.getDashboardData, {
    setterFilter: setterFilter || undefined,
    closerFilter: closerFilter || undefined,
    sourceFilter: sourceFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const leads = useQuery(api.leads.list, {});
  const goalData = useQuery(api.revenueGoal.getGoal, {
    month: new Date().toISOString().slice(0, 7),
  });
  const setGoal = useMutation(api.revenueGoal.setGoal);

  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [now] = useState(() => Date.now());

  const allSetters = useMemo(() => {
    if (!leads) return [];
    return [...new Set(leads.map((l) => l.setterName).filter(Boolean))].sort();
  }, [leads]);

  const allClosers = useMemo(() => {
    if (!leads) return [];
    return [...new Set(leads.map((l) => l.closerName).filter(Boolean))].sort();
  }, [leads]);

  const allSources = useMemo(() => {
    if (!leads) return [];
    return [...new Set(leads.map((l) => l.source).filter(Boolean))].sort();
  }, [leads]);

  const unpaidDeposits = useMemo(() => {
    if (!leads) return 0;
    return leads.filter((l) => {
      if (l.leadStatus !== "Deposit") return false;
      if (!l.dateCreated) return false;
      const daysSince = Math.floor((now - new Date(l.dateCreated).getTime()) / 86400000);
      return daysSince >= 14 && !l.datePaidInFull;
    }).length;
  }, [leads, now]);

  const totalAgingFollowUps = useMemo(() => {
    if (!dashboardData?.closerMetrics) return 0;
    return Object.values(dashboardData.closerMetrics as Record<string, { agingFollowUps: number }>).reduce(
      (sum: number, m) => sum + (m.agingFollowUps || 0), 0
    );
  }, [dashboardData]);

  const handleSetGoal = async () => {
    const val = parseFloat(goalInput);
    if (isNaN(val)) return;
    await setGoal({ month: new Date().toISOString().slice(0, 7), monthlyGoal: val });
    setEditingGoal(false);
  };

  if (!dashboardData || !leads) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  const { setterMetrics, closerMetrics, moneyMetrics } = dashboardData;
  const revenueGoal = goalData || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Visibility Dashboard</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select className="select text-sm flex-1 min-w-0 sm:flex-initial" value={setterFilter} onChange={(e) => setSetterFilter(e.target.value)}>
            <option value="all">All Setters</option>
            {allSetters.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select text-sm flex-1 min-w-0 sm:flex-initial" value={closerFilter} onChange={(e) => setCloserFilter(e.target.value)}>
            <option value="all">All Closers</option>
            {allClosers.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select text-sm flex-1 min-w-0 sm:flex-initial" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">All Sources</option>
            {allSources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="input text-sm flex-1 min-w-0 sm:w-36" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
          <input className="input text-sm flex-1 min-w-0 sm:w-36" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
        </div>
      </div>

      {/* Money Metrics */}
      <div className="bg-black text-white rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <DollarSign size={20} className="text-red-500" />
            Revenue Overview
          </h2>
          <div className="flex items-center gap-2">
            {editingGoal ? (
              <div className="flex gap-1">
                <input
                  className="input text-sm text-black w-28"
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="Goal $"
                  autoFocus
                />
                <button onClick={handleSetGoal} className="btn btn-primary text-xs py-1 px-2">Set</button>
                <button onClick={() => setEditingGoal(false)} className="btn btn-secondary text-xs py-1 px-2">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setGoalInput(String(revenueGoal)); setEditingGoal(true); }} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                <Target size={14} /> Edit Goal
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <div className="text-xs text-zinc-400">Deposits</div>
            <div className="text-xl font-bold">${(moneyMetrics?.deposits || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Total Sales</div>
            <div className="text-xl font-bold">{moneyMetrics?.totalSales || 0}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Revenue</div>
            <div className="text-xl font-bold">${(moneyMetrics?.revenueGenerated || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Cash Collected</div>
            <div className="text-xl font-bold">${(moneyMetrics?.cashCollected || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Net Revenue</div>
            <div className="text-xl font-bold">${(moneyMetrics?.netRevenue || 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Refunds</div>
            <div className="text-xl font-bold text-red-400">${(moneyMetrics?.refunds || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-zinc-700">
          <div>
            <div className="text-xs text-zinc-400">Goal</div>
            <div className="text-lg font-bold">${revenueGoal.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Goal Completion</div>
            <div className={`text-lg font-bold ${revenueGoal > 0 && (moneyMetrics?.netRevenue || 0) / revenueGoal >= 1 ? "text-green-400" : "text-red-400"}`}>
              {revenueGoal > 0 ? Math.min(100, Math.round(((moneyMetrics?.netRevenue || 0) / revenueGoal) * 100)) : 0}%
            </div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Deposit → Paid</div>
            <div className="text-lg font-bold">{moneyMetrics?.depositToPaidConversion || 0}%</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Avg Days to Collect</div>
            <div className="text-lg font-bold">{moneyMetrics?.avgDaysToCollect || "0"}</div>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="stat-card flex items-center gap-3 border-red-200 bg-red-50">
          <AlertTriangle size={24} className="text-red-500 shrink-0" />
          <div>
            <div className="stat-label text-red-600">Booking Lag Over 4 Days</div>
            <div className="stat-value text-red-600">
              {Object.entries(setterMetrics as Record<string, { bookingLag: string }>).filter(([, m]) => parseFloat(m.bookingLag) > 4).length} setters
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 border-red-200 bg-red-50">
          <AlertTriangle size={24} className="text-red-500 shrink-0" />
          <div>
            <div className="stat-label text-red-600">Aging Follow-Ups (7+ days)</div>
            <div className="stat-value text-red-600">{totalAgingFollowUps}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 border-red-200 bg-red-50">
          <AlertTriangle size={24} className="text-red-500 shrink-0" />
          <div>
            <div className="stat-label text-red-600">Unpaid Deposits (14+ days)</div>
            <div className="stat-value text-red-600">{unpaidDeposits}</div>
          </div>
        </div>
      </div>

      {/* Setter Metrics */}
      <div>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Phone size={18} className="text-red-500" />
          Setter Performance
        </h2>

        {/* Mobile setter cards */}
        <div className="sm:hidden space-y-2">
          {Object.entries(setterMetrics as Record<string, { speedToLead: number; bookingLag: string; meetingsSet: number; shows: number; noShows: number; cancels: number; showUpRate: number; dqRate: number }>).map(([name, m]) => (
            <div key={name} className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
              <div className="font-semibold text-sm mb-2">{name}</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-400">Speed</div>
                  <div className={`font-medium ${m.speedToLead <= 60 ? "text-green-600" : "text-red-600"}`}>{m.speedToLead}m</div>
                </div>
                <div>
                  <div className="text-gray-400">Lag</div>
                  <div className={`font-medium ${parseFloat(m.bookingLag) <= 4 ? "text-green-600" : "text-red-600"}`}>{m.bookingLag}d</div>
                </div>
                <div>
                  <div className="text-gray-400">Show Rate</div>
                  <div className="font-medium">{m.showUpRate}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Meetings</div>
                  <div className="font-medium">{m.meetingsSet}</div>
                </div>
                <div>
                  <div className="text-gray-400">Shows</div>
                  <div>{m.shows}</div>
                </div>
                <div>
                  <div className="text-gray-400">DQ Rate</div>
                  <div className={`${m.dqRate > 20 ? "text-red-600 font-bold" : ""}`}>{m.dqRate}%</div>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(setterMetrics).length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">No setter data</div>
          )}
        </div>

        {/* Desktop setter table */}
        <div className="hidden sm:block overflow-x-auto border rounded-lg table-scroll">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Setter</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Speed to Lead (min)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Booking Lag (days)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meetings Set</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shows</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No-Shows</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cancels</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Show-Up Rate</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">DQ Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(setterMetrics as Record<string, { speedToLead: number; bookingLag: string; meetingsSet: number; shows: number; noShows: number; cancels: number; showUpRate: number; dqRate: number }>).map(([name, m]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{name}</td>
                  <td className={`px-3 py-2 ${m.speedToLead <= 60 ? "text-green-600" : "text-red-600"}`}>{m.speedToLead}</td>
                  <td className={`px-3 py-2 ${parseFloat(m.bookingLag) <= 4 ? "text-green-600" : "text-red-600 font-bold"}`}>{m.bookingLag}</td>
                  <td className="px-3 py-2">{m.meetingsSet}</td>
                  <td className="px-3 py-2">{m.shows}</td>
                  <td className="px-3 py-2">{m.noShows}</td>
                  <td className="px-3 py-2">{m.cancels}</td>
                  <td className="px-3 py-2 font-medium">{m.showUpRate}%</td>
                  <td className={`px-3 py-2 ${m.dqRate > 20 ? "text-red-600 font-bold" : ""}`}>{m.dqRate}%</td>
                </tr>
              ))}
              {Object.keys(setterMetrics).length === 0 && (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No setter data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closer Metrics */}
      <div>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-red-500" />
          Closer Performance
        </h2>

        {/* Mobile closer cards */}
        <div className="sm:hidden space-y-2">
          {Object.entries(closerMetrics as Record<string, { callsTaken: number; offers: number; offerRate: number; sales: number; closeRate: number; closeRateOnOffers: number; oneCallSales: number; followUpSales: number; avgDealSize: number; rpc: number; lossReasons: Record<string, number>; agingFollowUps: number }>).map(([name, m]) => (
            <div key={name} className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
              <div className="font-semibold text-sm mb-2">{name}</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-400">Sales</div>
                  <div className="font-medium">{m.sales}</div>
                </div>
                <div>
                  <div className="text-gray-400">Close Rate</div>
                  <div className="font-medium">{m.closeRate}%</div>
                </div>
                <div>
                  <div className="text-gray-400">Avg Deal</div>
                  <div className="font-medium">${Math.round(m.avgDealSize).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">Calls</div>
                  <div>{m.callsTaken}</div>
                </div>
                <div>
                  <div className="text-gray-400">RPC</div>
                  <div>${Math.round(m.rpc).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">Aging F/Us</div>
                  <div className={`${m.agingFollowUps > 0 ? "text-red-600 font-bold" : ""}`}>{m.agingFollowUps}</div>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(closerMetrics).length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">No closer data</div>
          )}
        </div>

        {/* Desktop closer table */}
        <div className="hidden sm:block overflow-x-auto border rounded-lg table-scroll">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Closer</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Calls Taken</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Offers</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Offer Rate</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Close Rate</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Close on Offers</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">1-Call</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Follow-Up</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Deal</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">RPC</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aging F/Us</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(closerMetrics as Record<string, { callsTaken: number; offers: number; offerRate: number; sales: number; closeRate: number; closeRateOnOffers: number; oneCallSales: number; followUpSales: number; avgDealSize: number; rpc: number; lossReasons: Record<string, number>; agingFollowUps: number }>).map(([name, m]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{name}</td>
                  <td className="px-3 py-2">{m.callsTaken}</td>
                  <td className="px-3 py-2">{m.offers}</td>
                  <td className="px-3 py-2 font-medium">{m.offerRate}%</td>
                  <td className="px-3 py-2">{m.sales}</td>
                  <td className="px-3 py-2 font-medium">{m.closeRate}%</td>
                  <td className="px-3 py-2 font-medium">{m.closeRateOnOffers}%</td>
                  <td className="px-3 py-2">{m.oneCallSales}</td>
                  <td className="px-3 py-2">{m.followUpSales}</td>
                  <td className="px-3 py-2">${Math.round(m.avgDealSize).toLocaleString()}</td>
                  <td className="px-3 py-2">${Math.round(m.rpc).toLocaleString()}</td>
                  <td className={`px-3 py-2 ${m.agingFollowUps > 0 ? "text-red-600 font-bold" : ""}`}>{m.agingFollowUps}</td>
                </tr>
              ))}
              {Object.keys(closerMetrics).length === 0 && (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-gray-400">No closer data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loss Reason Breakdown */}
      <div>
        <h2 className="font-bold text-lg mb-3">Loss Reason Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(
            Object.values(closerMetrics as Record<string, { lossReasons: Record<string, number> }>).reduce(
              (acc: Record<string, number>, m) => {
                if (m.lossReasons) {
                  Object.entries(m.lossReasons).forEach(([reason, count]) => {
                    acc[reason] = (acc[reason] || 0) + (count as number);
                  });
                }
                return acc;
              },
              {}
            )
          ).map(([reason, count]) => (
            <div key={reason} className={`stat-card text-center ${lossReasonColors[reason] || ""}`}>
              <div className="stat-value text-base">{count as number}</div>
              <div className="stat-label">{reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commissions */}
      <div>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <DollarSign size={18} className="text-red-500" />
          Commissions Earned (Net of Clawbacks)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(moneyMetrics?.commissionsByRep || {}).map(([rep, amount]) => (
            <div key={rep} className="stat-card">
              <div className="stat-label">{rep}</div>
              <div className="stat-value text-lg">${(amount as number).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
