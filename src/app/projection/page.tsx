"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { DollarSign, CalendarDays } from "lucide-react";

export default function ProjectionPage() {
  const leads = useQuery(api.leads.list, {});
  const dashboardData = useQuery(api.leads.getDashboardData, {});
  const goalData = useQuery(api.revenueGoal.getGoal, {
    month: new Date().toISOString().slice(0, 7),
  });

  const [showUpRate, setShowUpRate] = useState<number | null>(null);
  const [offerRate, setOfferRate] = useState<number | null>(null);
  const [closeRate, setCloseRate] = useState<number | null>(null);
  const [avgDealSize, setAvgDealSize] = useState<number | null>(null);

  const defaultRates = useMemo(() => {
    if (!leads || leads.length === 0) return null;
    const shows = leads.filter((l) => l.meetingStatus === "Show").length;
    const booked = leads.filter((l) => l.dateMeetingBooked).length;
    const offersMade = leads.filter((l) => l.offerMade).length;
    const callsTaken = leads.filter((l) => l.meetingStatus === "Show").length;
    const sales = leads.filter((l) => l.leadStatus === "Won").length;
    const totalValue = leads
      .filter((l) => l.leadStatus === "Won")
      .reduce((sum, l) => sum + l.totalDealValue, 0);
    return {
      showUp: booked > 0 ? Math.round((shows / booked) * 100) : 0,
      offer: callsTaken > 0 ? Math.round((offersMade / callsTaken) * 100) : 0,
      close: callsTaken > 0 ? Math.round((sales / callsTaken) * 100) : 0,
      dealSize: sales > 0 ? Math.round(totalValue / sales) : 0,
    };
  }, [leads]);

  useEffect(() => {
    if (defaultRates && showUpRate === null) setShowUpRate(defaultRates.showUp);
    if (defaultRates && offerRate === null) setOfferRate(defaultRates.offer);
    if (defaultRates && closeRate === null) setCloseRate(defaultRates.close);
    if (defaultRates && avgDealSize === null) setAvgDealSize(defaultRates.dealSize);
  }, [defaultRates, showUpRate, offerRate, closeRate, avgDealSize]);

  // meetings scheduled for the rest of this month
  const remainingMeetings = useMemo(() => {
    if (!leads) return 0;
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return leads.filter((l) => {
      if (!l.dateOfMeeting) return false;
      const meetingDate = new Date(l.dateOfMeeting);
      return meetingDate >= now && meetingDate <= endOfMonth;
    }).length;
  }, [leads]);

  const projection = useMemo(() => {
    const showRate = (showUpRate ?? 0) / 100;
    const offRate = (offerRate ?? 0) / 100;
    const closRate = (closeRate ?? 0) / 100;
    const dealSize = avgDealSize ?? 0;

    const expected = remainingMeetings * showRate * offRate * closRate * dealSize;
    const best = remainingMeetings * (((showUpRate ?? 0) + 10) / 100) * (((offerRate ?? 0) + 10) / 100) * (((closeRate ?? 0) + 10) / 100) * (dealSize * 1.15);
    const worst = remainingMeetings * Math.max(0, ((showUpRate ?? 0) - 10) / 100) * Math.max(0, ((offerRate ?? 0) - 10) / 100) * Math.max(0, ((closeRate ?? 0) - 10) / 100) * (dealSize * 0.85);

    return { expected, best: Math.max(expected, best), worst: Math.min(expected, worst) };
  }, [remainingMeetings, showUpRate, offerRate, closeRate, avgDealSize]);

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const daysLeft = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(0, Math.ceil((endOfMonth.getTime() - now.getTime()) / 86400000));
  }, []);

  if (!leads || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h1 className="text-2xl font-bold">Revenue Projection</h1>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <CalendarDays size={16} />
          {currentMonth} — {daysLeft} days remaining
        </div>
      </div>

      {/* Assumptions Editor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="stat-label">Remaining Meetings Scheduled</div>
          <div className="stat-value text-3xl">{remainingMeetings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Show-Up Rate %</div>
          <input
            className="input text-lg font-bold mt-1"
            type="number"
            min="0"
            max="100"
            value={showUpRate ?? ""}
            onChange={(e) => setShowUpRate(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="stat-card">
          <div className="stat-label">Offer Rate %</div>
          <input
            className="input text-lg font-bold mt-1"
            type="number"
            min="0"
            max="100"
            value={offerRate ?? ""}
            onChange={(e) => setOfferRate(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="stat-card">
          <div className="stat-label">Close Rate %</div>
          <input
            className="input text-lg font-bold mt-1"
            type="number"
            min="0"
            max="100"
            value={closeRate ?? ""}
            onChange={(e) => setCloseRate(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Deal Size ($)</div>
          <input
            className="input text-lg font-bold mt-1"
            type="number"
            min="0"
            value={avgDealSize ?? ""}
            onChange={(e) => setAvgDealSize(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Projection Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5">
          <div className="text-sm text-red-600 font-medium mb-1">Worst Case</div>
          <div className="text-3xl font-bold text-red-600">
            ${Math.round(projection.worst).toLocaleString()}
          </div>
          <div className="text-xs text-red-500 mt-1">
            -10% on all rates, -15% deal size
          </div>
        </div>
        <div className="bg-black text-white rounded-lg p-5">
          <div className="text-sm text-zinc-400 font-medium mb-1">Expected Case</div>
          <div className="text-3xl font-bold">
            ${Math.round(projection.expected).toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Current rates × {remainingMeetings} remaining meetings
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5">
          <div className="text-sm text-green-600 font-medium mb-1">Best Case</div>
          <div className="text-3xl font-bold text-green-600">
            ${Math.round(projection.best).toLocaleString()}
          </div>
          <div className="text-xs text-green-500 mt-1">
            +10% on all rates, +15% deal size
          </div>
        </div>
      </div>

      {/* Running Total */}
      <div className="stat-card">
        <div className="flex items-center gap-3">
          <DollarSign size={28} className="text-red-500" />
          <div>
            <div className="stat-label">Revenue Already Closed This Month</div>
            <div className="stat-value text-2xl">
              ${(dashboardData?.moneyMetrics?.revenueGenerated || 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="stat-label">Projected Month-End Total</div>
          <div className="grid grid-cols-3 gap-4 mt-1">
            <div>
              <span className="text-red-600 font-bold text-lg">
                ${Math.round((dashboardData?.moneyMetrics?.revenueGenerated || 0) + projection.worst).toLocaleString()}
              </span>
              <div className="text-xs text-gray-500">Worst</div>
            </div>
            <div>
              <span className="font-bold text-lg">
                ${Math.round((dashboardData?.moneyMetrics?.revenueGenerated || 0) + projection.expected).toLocaleString()}
              </span>
              <div className="text-xs text-gray-500">Expected</div>
            </div>
            <div>
              <span className="text-green-600 font-bold text-lg">
                ${Math.round((dashboardData?.moneyMetrics?.revenueGenerated || 0) + projection.best).toLocaleString()}
              </span>
              <div className="text-xs text-gray-500">Best</div>
            </div>
          </div>
        </div>
        {goalData != null && goalData > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="stat-label">Monthly Goal</div>
            <div className="flex items-center gap-4 mt-1">
              <span className="font-bold text-lg">${goalData.toLocaleString()}</span>
              {(() => {
                const expectedTotal = (dashboardData?.moneyMetrics?.revenueGenerated || 0) + projection.expected;
                const pct = Math.round((expectedTotal / goalData) * 100);
                return (
                  <span className={`font-bold text-lg ${pct >= 100 ? "text-green-600" : "text-red-600"}`}>
                    {pct}% projected
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
