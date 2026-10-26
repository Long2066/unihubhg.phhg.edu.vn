import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye
} from "lucide-react";
import { 
  SystemVisitLog, 
  subscribeToSystemVisits, 
  aggregateVisitAnalytics 
} from "../utils/visitTracker";

type TimeframeMode = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

export const RealtimeVisitsAnalytics: React.FC = () => {
  const [visits, setVisits] = useState<SystemVisitLog[]>(() => {
    try {
      const raw = localStorage.getItem("unihub_system_visits");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [timeframe, setTimeframe] = useState<TimeframeMode>("HOUR");
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Đang kết nối...");

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const unsubscribe = subscribeToSystemVisits((newVisits) => {
      setVisits(newVisits);
      setIsLiveConnected(true);
      const d = new Date();
      setLastSyncTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`);
    });

    return () => unsubscribe();
  }, []);

  // Compute aggregated stats
  const analytics = useMemo(() => aggregateVisitAnalytics(visits), [visits]);

  // Selected chart data based on timeframe mode
  const currentChartData = useMemo(() => {
    switch (timeframe) {
      case "HOUR":
        return analytics.hourly.map(item => ({ label: item.label, value: item.count, sub: `${item.hour}h` }));
      case "DAY":
        return analytics.daily.map(item => ({ label: item.label, value: item.count, sub: item.date }));
      case "WEEK":
        return analytics.weekly.map(item => ({ label: item.label, value: item.count, sub: item.weekString }));
      case "MONTH":
        return analytics.monthly.map(item => ({ label: item.label, value: item.count, sub: item.month }));
      case "YEAR":
        return analytics.yearly.map(item => ({ label: item.label, value: item.count, sub: String(item.year) }));
      default:
        return [];
    }
  }, [timeframe, analytics]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...currentChartData.map(d => d.value), 1);
    return max;
  }, [currentChartData]);

  const todayDiff = analytics.today - analytics.yesterday;

  return (
    <div className="bg-white rounded-3xl p-6 ring-1 ring-slate-900/5 shadow-xs space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Lượt truy cập hệ thống theo thời gian thực
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>ONLINE REALTIME</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi lần đăng nhập người dùng được tự động đồng bộ tức thì qua Firebase CSDL đám mây.
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { mode: "HOUR" as TimeframeMode, label: "Theo Giờ" },
            { mode: "DAY" as TimeframeMode, label: "Theo Ngày" },
            { mode: "WEEK" as TimeframeMode, label: "Theo Tuần" },
            { mode: "MONTH" as TimeframeMode, label: "Theo Tháng" },
            { mode: "YEAR" as TimeframeMode, label: "Theo Năm" },
          ].map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setTimeframe(tab.mode)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                timeframe === tab.mode
                  ? "bg-white text-indigo-650 shadow-xs scale-100 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Visits */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white p-4 rounded-2xl border border-indigo-100/60 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng tích lũy</span>
          <div className="text-2xl lg:text-3xl font-extrabold text-indigo-900 font-mono tabular-nums mt-1.5">
            {analytics.total.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Eye className="w-3 h-3 text-indigo-500" />
            Lượt đăng nhập
          </span>
        </div>

        {/* Today */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hôm nay</span>
            {todayDiff >= 0 ? (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center font-mono">
                <ArrowUpRight className="w-3 h-3" />+{todayDiff}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-500 flex items-center font-mono">
                <ArrowDownRight className="w-3 h-3" />{todayDiff}
              </span>
            )}
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1.5">
            {analytics.today.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Hôm qua: <strong className="text-slate-600 font-mono">{analytics.yesterday}</strong>
          </span>
        </div>

        {/* This Week */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tuần này</span>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1.5">
            {analytics.thisWeek.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Trong tuần hiện hành</span>
        </div>

        {/* This Month */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tháng này</span>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1.5">
            {analytics.thisMonth.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tháng {new Date().getMonth() + 1}</span>
        </div>

        {/* This Year */}
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Năm {new Date().getFullYear()}</span>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono tabular-nums mt-1.5">
            {analytics.thisYear.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Toàn niên độ</span>
        </div>
      </div>

      {/* Visual Chart Breakdown */}
      <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Biểu đồ phân bố lượt truy cập ({
              timeframe === "HOUR" ? "24 Giờ hôm nay" :
              timeframe === "DAY" ? "14 Ngày gần nhất" :
              timeframe === "WEEK" ? "8 Tuần gần nhất" :
              timeframe === "MONTH" ? "12 Tháng trong năm" : "Các năm gần đây"
            })
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Đồng bộ: {lastSyncTime}
          </span>
        </div>

        {/* Bar chart container */}
        <div className="pt-6 pb-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-end gap-2 min-w-[540px] h-44 px-2">
            {currentChartData.map((bar, idx) => {
              const heightPercent = maxChartValue > 0 ? Math.max(Math.round((bar.value / maxChartValue) * 100), 4) : 4;
              const isPeak = bar.value === maxChartValue && bar.value > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {bar.label}: {bar.value} lượt
                  </div>

                  {/* Value label */}
                  {bar.value > 0 && (
                    <span className="text-[10px] font-mono font-bold text-slate-600 tabular-nums">
                      {bar.value}
                    </span>
                  )}

                  {/* Column Bar */}
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isPeak 
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-xs" 
                        : bar.value > 0 
                        ? "bg-gradient-to-t from-slate-300 to-indigo-300 hover:from-indigo-400 hover:to-indigo-500" 
                        : "bg-slate-200/60"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* Bottom X-axis label */}
                  <span className={`text-[10px] font-mono truncate max-w-[48px] text-center ${isPeak ? "font-bold text-indigo-700" : "text-slate-500"}`}>
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role Breakdown & Live Recent Logins Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Role Distribution */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Lượt truy cập theo phân quyền
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">{analytics.roleBreakdown.length} nhóm đối tượng</span>
          </div>

          <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            {analytics.roleBreakdown.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Chưa có dữ liệu phân quyền truy cập.
              </div>
            ) : (
              analytics.roleBreakdown.map((r, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{r.label}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {r.count.toLocaleString()} lượt ({r.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.percent}%`, backgroundColor: r.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Login Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Lượt đăng nhập mới nhất (Live stream)
            </h4>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">Tự động đẩy tin</span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
            {analytics.recentVisits.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-slate-100">
                Chưa có bản ghi đăng nhập nào trong phiên này.
              </div>
            ) : (
              analytics.recentVisits.map((v, idx) => {
                const timeStr = v.isoString ? new Date(v.isoString).toLocaleTimeString("vi-VN") : "";
                const dateStr = v.date || "";

                return (
                  <div 
                    key={v.id || idx}
                    className="p-2.5 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs font-mono">
                        {v.name ? v.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-900 block truncate leading-tight">
                          {v.name || v.username}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {v.username} • {v.role || "STUDENT"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-bold text-slate-700 block">
                        {timeStr}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {dateStr}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
