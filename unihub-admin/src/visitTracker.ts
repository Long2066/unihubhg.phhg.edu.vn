import { collection, doc, setDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export interface SystemVisitLog {
  id: string;
  timestamp: number;
  isoString: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0 - 23
  dayOfWeek: number; // 0 - 6
  weekString: string; // YYYY-Wxx
  month: string; // YYYY-MM
  year: number; // YYYY
  role: string;
  username: string;
  name: string;
  clientType?: string;
}

export const getIsoWeekString = (d: Date): string => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

export const recordSystemVisit = async (
  user: { role?: string; username?: string; name?: string },
  clientType: string = "ADMIN_PORTAL"
): Promise<void> => {
  try {
    const now = new Date();
    const id = `VISIT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    
    const visit: SystemVisitLog = {
      id,
      timestamp: Date.now(),
      isoString: now.toISOString(),
      date: dateStr,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      weekString: getIsoWeekString(now),
      month: monthStr,
      year: now.getFullYear(),
      role: user.role || "ADMIN",
      username: user.username || "admin",
      name: user.name || "Quản trị viên",
      clientType
    };

    await setDoc(doc(db, "system_visits", id), visit);
    try {
      const raw = localStorage.getItem("unihub_system_visits");
      const list: SystemVisitLog[] = raw ? JSON.parse(raw) : [];
      const updated = [visit, ...list.filter(v => v.id !== id)].slice(0, 500);
      localStorage.setItem("unihub_system_visits", JSON.stringify(updated));
    } catch {}
  } catch (err) {
    console.warn("Lỗi ghi nhận lượt truy cập admin:", err);
  }
};

export const subscribeToSystemVisits = (
  callback: (visits: SystemVisitLog[]) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, "system_visits"),
      orderBy("timestamp", "desc"),
      limit(2500)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const visits: SystemVisitLog[] = [];
        snapshot.forEach((d) => {
          visits.push(d.data() as SystemVisitLog);
        });
        if (visits.length > 0) {
          localStorage.setItem("unihub_system_visits", JSON.stringify(visits.slice(0, 500)));
        }
        callback(visits);
      },
      (err) => {
        console.warn("Lỗi snapshot visits admin, fallback cache:", err);
        try {
          const raw = localStorage.getItem("unihub_system_visits");
          if (raw) callback(JSON.parse(raw));
        } catch {}
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Lỗi khởi tạo listener visits admin:", err);
    try {
      const raw = localStorage.getItem("unihub_system_visits");
      if (raw) callback(JSON.parse(raw));
    } catch {}
    return () => {};
  }
};

export interface AnalyticsAggregate {
  total: number;
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  hourly: { label: string; count: number; hour: number }[];
  daily: { label: string; date: string; count: number }[];
  weekly: { label: string; weekString: string; count: number }[];
  monthly: { label: string; month: string; count: number }[];
  yearly: { label: string; year: number; count: number }[];
  roleBreakdown: { role: string; label: string; count: number; percent: number; color: string }[];
  recentVisits: SystemVisitLog[];
}

export const aggregateVisitAnalytics = (visits: SystemVisitLog[]): AnalyticsAggregate => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const yesterdayDate = new Date(now.getTime() - 86400000);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;
  
  const currentWeekStr = getIsoWeekString(now);
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = now.getFullYear();

  let todayCount = 0;
  let yesterdayCount = 0;
  let thisWeekCount = 0;
  let thisMonthCount = 0;
  let thisYearCount = 0;

  const hourMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) hourMap.set(h, 0);

  const dayMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayMap.set(dStr, 0);
  }

  const weekMap = new Map<string, number>();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 86400000);
    weekMap.set(getIsoWeekString(d), 0);
  }

  const monthMap = new Map<string, number>();
  for (let m = 1; m <= 12; m++) {
    const mStr = `${currentYear}-${String(m).padStart(2, "0")}`;
    monthMap.set(mStr, 0);
  }

  const yearMap = new Map<number, number>();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    yearMap.set(y, 0);
  }

  const roleMap: Record<string, number> = {};

  visits.forEach((v) => {
    if (v.date === todayStr) {
      todayCount++;
      const h = typeof v.hour === "number" ? v.hour : new Date(v.timestamp).getHours();
      hourMap.set(h, (hourMap.get(h) || 0) + 1);
    }
    if (v.date === yesterdayStr) {
      yesterdayCount++;
    }
    if (v.weekString === currentWeekStr) {
      thisWeekCount++;
    }
    if (v.month === currentMonthStr) {
      thisMonthCount++;
    }
    if (v.year === currentYear) {
      thisYearCount++;
    }

    if (dayMap.has(v.date)) {
      dayMap.set(v.date, (dayMap.get(v.date) || 0) + 1);
    }
    if (weekMap.has(v.weekString)) {
      weekMap.set(v.weekString, (weekMap.get(v.weekString) || 0) + 1);
    }
    if (monthMap.has(v.month)) {
      monthMap.set(v.month, (monthMap.get(v.month) || 0) + 1);
    }
    if (yearMap.has(v.year)) {
      yearMap.set(v.year, (yearMap.get(v.year) || 0) + 1);
    }

    const r = v.role || "STUDENT";
    roleMap[r] = (roleMap[r] || 0) + 1;
  });

  const hourly = Array.from(hourMap.entries()).map(([hour, count]) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    count
  }));

  const daily = Array.from(dayMap.entries()).map(([date, count]) => {
    const parts = date.split("-");
    return {
      date,
      label: `${parts[2]}/${parts[1]}`,
      count
    };
  });

  const weekly = Array.from(weekMap.entries()).map(([weekString, count]) => {
    const parts = weekString.split("-W");
    return {
      weekString,
      label: `Tuần ${parts[1] || weekString}`,
      count
    };
  });

  const monthly = Array.from(monthMap.entries()).map(([month, count]) => {
    const parts = month.split("-");
    return {
      month,
      label: `Tháng ${parseInt(parts[1], 10)}`,
      count
    };
  });

  const yearly = Array.from(yearMap.entries()).map(([year, count]) => ({
    year,
    label: `Năm ${year}`,
    count
  }));

  const roleLabels: Record<string, { label: string; color: string }> = {
    STUDENT: { label: "Sinh viên", color: "#6366f1" },
    FACULTY: { label: "Giảng viên / CVHT", color: "#10b981" },
    TEACHER: { label: "Giảng viên", color: "#10b981" },
    CLUB_MANAGER: { label: "BCN Câu lạc bộ", color: "#ec4899" },
    ORGANIZER: { label: "Ban tổ chức", color: "#f59e0b" },
    YOUTH_UNION: { label: "Đoàn Thanh niên", color: "#ef4444" },
    STUDENT_UNION: { label: "Hội Sinh viên", color: "#06b6d4" },
    TRAINING_DEPT: { label: "Phòng Đào tạo", color: "#8b5cf6" },
    ADMIN: { label: "Quản trị viên", color: "#f97316" }
  };

  const totalVisits = visits.length || 1;
  const roleBreakdown = Object.entries(roleMap).map(([role, count]) => {
    const meta = roleLabels[role] || { label: role, color: "#94a3b8" };
    return {
      role,
      label: meta.label,
      count,
      percent: Math.round((count / totalVisits) * 100),
      color: meta.color
    };
  }).sort((a, b) => b.count - a.count);

  return {
    total: visits.length,
    today: todayCount,
    yesterday: yesterdayCount,
    thisWeek: thisWeekCount,
    thisMonth: thisMonthCount,
    thisYear: thisYearCount,
    hourly,
    daily,
    weekly,
    monthly,
    yearly,
    roleBreakdown,
    recentVisits: visits.slice(0, 15)
  };
};
