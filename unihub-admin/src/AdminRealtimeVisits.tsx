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
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw 
} from "lucide-react";
import { 
  SystemVisitLog, 
  subscribeToSystemVisits, 
  aggregateVisitAnalytics 
} from "./visitTracker";

type TimeframeMode = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

export const AdminRealtimeVisits: React.FC = () => {
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSystemVisits((newVisits) => {
      setVisits(newVisits);
      setIsLiveConnected(true);
      const d = new Date();
      setLastSyncTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
      );
    });

    return () => unsubscribe();
  }, []);

  const analytics = useMemo(() => aggregateVisitAnalytics(visits), [visits]);

  const currentChartData = useMemo(() => {
    switch (timeframe) {
      case "HOUR":
        return analytics.hourly.map((item) => ({ label: item.label, value: item.count, sub: `${item.hour}h` }));
      case "DAY":
        return analytics.daily.map((item) => ({ label: item.label, value: item.count, sub: item.date }));
      case "WEEK":
        return analytics.weekly.map((item) => ({ label: item.label, value: item.count, sub: item.weekString }));
      case "MONTH":
        return analytics.monthly.map((item) => ({ label: item.label, value: item.count, sub: item.month }));
      case "YEAR":
        return analytics.yearly.map((item) => ({ label: item.label, value: item.count, sub: String(item.year) }));
    }
  }, [analytics, timeframe]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...currentChartData.map((d) => d.value), 1);
    return Math.max(max, 5);
  }, [currentChartData]);

  const diffTodayVsYesterday = analytics.today - analytics.yesterday;

  return (
    <div className="glass-card" style={{ padding: "28px", border: "1px solid #e2e8f0", borderRadius: "16px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Top Banner / Live Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(2, 132, 199, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                Thống kê Lưu lượng Truy cập Thời gian thực
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  background: isLiveConnected ? "#ecfdf5" : "#fffbeb",
                  color: isLiveConnected ? "#059669" : "#d97706",
                  border: isLiveConnected ? "1px solid #a7f3d0" : "1px solid #fde68a"
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: isLiveConnected ? "#10b981" : "#f59e0b"
                  }}
                />
                {isLiveConnected ? "LIVE FIREBASE" : "OFFLINE CACHE"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Mỗi lượt đăng nhập thành công của sinh viên, cán bộ, giảng viên được ghi nhận 1 lần và đồng bộ online tức thời.
            </p>
          </div>
        </div>

        {/* Sync status & Timeframe switcher */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            <RefreshCw size={13} style={{ color: "#0284c7" }} />
            <span>Đồng bộ: {lastSyncTime}</span>
          </div>

          <div style={{ display: "inline-flex", background: "#f8fafc", padding: "3px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            {(
              [
                { key: "HOUR", label: "Theo Giờ" },
                { key: "DAY", label: "Theo Ngày" },
                { key: "WEEK", label: "Theo Tuần" },
                { key: "MONTH", label: "Theo Tháng" },
                { key: "YEAR", label: "Theo Năm" }
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTimeframe(tab.key)}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: timeframe === tab.key ? "#0284c7" : "transparent",
                  color: timeframe === tab.key ? "#ffffff" : "#475569",
                  boxShadow: timeframe === tab.key ? "0 1px 3px rgba(2, 132, 199, 0.3)" : "none"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "24px" }}>
        {/* Card 1: Tổng tích lũy */}
        <div style={{ padding: "18px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
              Tổng lượt truy cập
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(2, 132, 199, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", marginTop: "10px", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            {analytics.total.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Tích lũy từ hệ thống</div>
        </div>

        {/* Card 2: Hôm nay */}
        <div style={{ padding: "18px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
              Hôm nay (24h)
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", marginTop: "10px", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            {analytics.today.toLocaleString("vi-VN")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", marginTop: "4px" }}>
            {diffTodayVsYesterday >= 0 ? (
              <span style={{ color: "#059669", display: "inline-flex", alignItems: "center", fontWeight: 600 }}>
                <ArrowUpRight size={14} /> +{diffTodayVsYesterday}
              </span>
            ) : (
              <span style={{ color: "#dc2626", display: "inline-flex", alignItems: "center", fontWeight: 600 }}>
                <ArrowDownRight size={14} /> {diffTodayVsYesterday}
              </span>
            )}
            <span style={{ color: "#64748b" }}>so với hôm qua ({analytics.yesterday})</span>
          </div>
        </div>

        {/* Card 3: Tuần này */}
        <div style={{ padding: "18px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
              Tuần hiện tại
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(124, 58, 237, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#7c3aed", marginTop: "10px", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            {analytics.thisWeek.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Lượt phiên 7 ngày qua</div>
        </div>

        {/* Card 4: Tháng này */}
        <div style={{ padding: "18px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
              Tháng hiện tại
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(234, 88, 12, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#ea580c", marginTop: "10px", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            {analytics.thisMonth.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Lượt phiên trong tháng</div>
        </div>

        {/* Card 5: Năm nay */}
        <div style={{ padding: "18px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
              Năm {new Date().getFullYear()}
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#2563eb", marginTop: "10px", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            {analytics.thisYear.toLocaleString("vi-VN")}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Tổng niên độ đào tạo</div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div style={{ marginTop: "28px", padding: "20px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
              Biểu đồ phân bổ lượt truy cập - {timeframe === "HOUR" ? "24 Giờ Hôm Nay" : timeframe === "DAY" ? "14 Ngày Gần Nhất" : timeframe === "WEEK" ? "8 Tuần Gần Nhất" : timeframe === "MONTH" ? "12 Tháng Trong Năm" : "Theo Niên Độ Năm"}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Rê chuột vào từng cột để xem số lượng chi tiết</span>
          </div>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0284c7", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
            Đỉnh cao nhất: {Math.max(...currentChartData.map((d) => d.value), 0)} lượt
          </span>
        </div>

        {/* Visual Bar Column Container */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "180px", paddingTop: "24px", overflowX: "auto" }}>
          {currentChartData.map((item, idx) => {
            const heightPct = Math.max((item.value / maxChartValue) * 100, item.value > 0 ? 8 : 2);
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  flex: 1,
                  minWidth: "28px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  cursor: "pointer",
                  position: "relative"
                }}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: `calc(${heightPct}% + 10px)`,
                      zIndex: 30,
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      pointerEvents: "none"
                    }}
                  >
                    <strong>{item.label}:</strong> {item.value} lượt
                  </div>
                )}

                {/* Column bar */}
                <div
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    borderRadius: "6px 6px 2px 2px",
                    background: item.value > 0 ? (isHovered ? "#0284c7" : "#38bdf8") : "#e2e8f0",
                    transition: "all 0.2s ease"
                  }}
                />

                {/* X-axis label */}
                <span
                  style={{
                    marginTop: "6px",
                    fontSize: "10px",
                    color: isHovered ? "#0284c7" : "#64748b",
                    fontWeight: isHovered ? 700 : 500,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    transform: currentChartData.length > 16 ? "rotate(-45deg)" : "none",
                    transformOrigin: "center top"
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Roles Breakdown + Live Logins Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {/* Left: Role distribution */}
        <div style={{ padding: "20px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={16} style={{ color: "#0284c7" }} />
            Phân bổ Lượt truy cập theo Vai trò
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {analytics.roleBreakdown.map((r, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
                    {r.count} lượt ({r.percent}%)
                  </span>
                </div>
                <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${r.percent}%`, background: r.color, borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Live Logins */}
        <div style={{ padding: "20px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={16} style={{ color: "#059669" }} />
            Lịch sử Đăng nhập Trực tiếp Gần nhất ({analytics.recentVisits.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "250px", overflowY: "auto" }}>
            {analytics.recentVisits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "13px" }}>
                Chưa có dữ liệu phiên đăng nhập
              </div>
            ) : (
              analytics.recentVisits.map((v) => {
                const d = new Date(v.timestamp);
                const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} - ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
                return (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {v.clientType === "ADMIN_PORTAL" ? (
                        <ShieldCheck size={14} style={{ color: "#7c3aed" }} />
                      ) : (
                        <Monitor size={14} style={{ color: "#0284c7" }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{v.name || v.username}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{v.username}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: v.role === "ADMIN" ? "#f3e8ff" : v.role === "STUDENT" ? "#e0f2fe" : "#f1f5f9",
                          color: v.role === "ADMIN" ? "#7c3aed" : v.role === "STUDENT" ? "#0284c7" : "#475569"
                        }}
                      >
                        {v.role}
                      </span>
                      <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px", fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>
                        {timeStr}
                      </div>
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
