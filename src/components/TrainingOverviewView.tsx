import React, { useMemo } from "react";
import { useUniHub, normalizeClassId } from "../state";
import { isStudentProfileComplete } from "../types";
import { 
  FileSpreadsheet, 
  Users, 
  Award, 
  Bell, 
  BookOpen, 
  Clock, 
  UploadCloud, 
  Grid, 
  ClipboardList, 
  Calendar, 
  Plus, 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight,
  Database,
  Lock,
  BarChart2
} from "lucide-react";

interface TrainingOverviewViewProps {
  onNavigateTab: (tabId: string) => void;
  onOpenAddSemesterModal: () => void;
}

export const TrainingOverviewView: React.FC<TrainingOverviewViewProps> = ({
  onNavigateTab,
  onOpenAddSemesterModal
}) => {
  const { 
    students,
    teacherAssignments,
    subjectGradeSheets,
    unlockRequests,
    gradeAppeals,
    schedules,
    registrationPeriods,
    courseOfferings,
    creditEnrollments,
    customClasses,
    allSemesters,
    selectedSemesterId,
    setSelectedSemesterId,
    results,
    toggleLearningDataLock
  } = useUniHub();

  const currentSemesterObj = allSemesters.find(s => s.id === selectedSemesterId) || allSemesters[0];

  // 1. Phân công & Nộp điểm
  const semAssignments = useMemo(() => {
    return teacherAssignments.filter(a => a.semesterId === selectedSemesterId);
  }, [teacherAssignments, selectedSemesterId]);

  const totalAssignmentsCount = semAssignments.length;
  const submittedCount = useMemo(() => {
    return semAssignments.filter(a => {
      const sheet = subjectGradeSheets.find(
        s => s.semesterId === a.semesterId && s.classId === a.classId && s.subjectCode === a.subjectCode
      );
      return sheet?.status === "SUBMITTED" || sheet?.status === "LOCKED";
    }).length;
  }, [semAssignments, subjectGradeSheets]);

  const submissionRate = totalAssignmentsCount > 0 
    ? Math.round((submittedCount / totalAssignmentsCount) * 100) 
    : 0;
  const pendingSubmissionCount = Math.max(0, totalAssignmentsCount - submittedCount);

  // 2. Học vụ & Sinh viên
  const totalStudentsCount = students.length;
  const warningStudentsCount = useMemo(() => {
    return students.filter(s => s.learningWarning || (s.learningStatus && s.learningStatus.toLowerCase().includes("cảnh báo"))).length;
  }, [students]);

  const suspendedStudentsCount = useMemo(() => {
    return students.filter(s => s.learningStatus && s.learningStatus.toLowerCase().includes("đình chỉ")).length;
  }, [students]);

  const normalStudentsCount = Math.max(0, totalStudentsCount - warningStudentsCount - suspendedStudentsCount);

  // 3. Phân loại GPA
  const gpaStats = useMemo(() => {
    let excellent = 0; // >= 3.6
    let good = 0;      // 3.2 - 3.59
    let fair = 0;      // 2.5 - 3.19
    let average = 0;   // 2.0 - 2.49
    let weak = 0;      // < 2.0
    let totalGpa = 0;
    let countedStudents = 0;

    students.forEach(s => {
      let gpa = s.gpa;
      if ((gpa === undefined || gpa === 0) && s.gpa10) {
        gpa = (s.gpa10 / 10) * 4;
      }
      if (typeof gpa === "number" && gpa > 0) {
        totalGpa += gpa;
        countedStudents++;
        if (gpa >= 3.6) excellent++;
        else if (gpa >= 3.2) good++;
        else if (gpa >= 2.5) fair++;
        else if (gpa >= 2.0) average++;
        else weak++;
      }
    });

    const avg = countedStudents > 0 ? (totalGpa / countedStudents).toFixed(2) : "0.00";
    return { excellent, good, fair, average, weak, avg, total: countedStudents };
  }, [students]);

  // 4. Học bổng
  const scholarshipEligibleCount = useMemo(() => {
    return students.filter(s => {
      let gpa = s.gpa;
      if ((gpa === undefined || gpa === 0) && s.gpa10) {
        gpa = (s.gpa10 / 10) * 4;
      }
      const isWarned = s.learningWarning || (s.learningStatus && s.learningStatus.toLowerCase().includes("cảnh báo"));
      const hasF = s.subjectGrades?.some(sg => sg.grade === "F");
      return (gpa || 0) >= 2.5 && !isWarned && !hasF;
    }).length;
  }, [students]);

  // 5. Yêu cầu chờ duyệt
  const pendingUnlockCount = unlockRequests.filter(r => r.status === "PENDING").length;
  const pendingAppealsCount = gradeAppeals.filter(a => a.status === "PENDING" || a.status === "REVIEWING").length;
  const totalPendingRequests = pendingUnlockCount + pendingAppealsCount;

  // 6. Lớp học & Quy mô
  const uniqueClassIds = useMemo(() => {
    return Array.from(new Set([
      ...students.map(s => normalizeClassId(s.classId)),
      ...customClasses.map(c => normalizeClassId(c))
    ])).filter(Boolean);
  }, [students, customClasses]);

  const topClassesByCount = useMemo(() => {
    return uniqueClassIds.map(clsId => {
      const classStudents = students.filter(s => normalizeClassId(s.classId) === clsId);
      let totalGpa = 0;
      let gpaCount = 0;
      classStudents.forEach(s => {
        let gpa = s.gpa || (s.gpa10 ? (s.gpa10 / 10) * 4 : 0);
        if (gpa > 0) {
          totalGpa += gpa;
          gpaCount++;
        }
      });
      return {
        classId: clsId,
        count: classStudents.length,
        avgGpa: gpaCount > 0 ? (totalGpa / gpaCount).toFixed(2) : "-"
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [uniqueClassIds, students]);

  // 7. Đăng ký tín chỉ & TKB
  const openCreditPeriodsCount = registrationPeriods.filter(p => p.status === "OPEN").length;
  const scheduledClassesCount = useMemo(() => {
    return new Set(schedules.map(s => normalizeClassId(s.classId))).size;
  }, [schedules]);

  // Radial progress calculations
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (submissionRate / 100) * circumference;

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in" id="training-overview-dashboard">
      {/* ─── HERO HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Glow decorative blobs */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Firebase Cloud Trực Tuyến
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phòng Đào Tạo & Khảo Thí
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Bảng Chỉ Số Tổng Quan Học Vụ Toàn Trường
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              Theo dõi tiến độ nộp điểm của giảng viên, tình trạng học vụ sinh viên, phân công giảng dạy, xét học bổng và lịch học đồng bộ thời gian thực.
            </p>
          </div>

          {/* Semester Selector Card on Header */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col gap-2.5 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-400" />
                Học kỳ đang chọn:
              </span>
              <button
                type="button"
                onClick={onOpenAddSemesterModal}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                title="Tạo học kỳ mới tùy chỉnh"
              >
                <Plus size={13} />
                <span>Thêm HK</span>
              </button>
            </div>

            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="bg-slate-900/80 border border-white/20 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-inner"
            >
              {allSemesters.map(sem => (
                <option key={sem.id} value={sem.id} className="bg-slate-900 text-white">
                  {sem.name} {sem.isCustom ? "(Tùy biến)" : ""}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10">
              <span>Số phân công HK này:</span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">{totalAssignmentsCount} lớp HP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 TOP KPI METRIC CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {/* KPI 1: Tiến độ nộp điểm */}
        <div 
          onClick={() => onNavigateTab("IMPORT")}
          className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <FileSpreadsheet size={22} />
            </div>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
              submissionRate >= 80 ? "bg-emerald-100 text-emerald-800" :
              submissionRate >= 50 ? "bg-amber-100 text-amber-800" :
              "bg-slate-100 text-slate-700"
            }`}>
              {submissionRate}%
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">
              Tiến Độ Nộp Điểm Giảng Viên
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tabular-nums font-mono">
                {submittedCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {totalAssignmentsCount} lớp học phần</span>
            </div>

            {/* Mini Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${submissionRate}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Chưa nộp: <strong className="text-slate-700">{pendingSubmissionCount}</strong></span>
              <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Nạp điểm <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Sinh viên & Cảnh báo */}
        <div 
          onClick={() => onNavigateTab("LIST")}
          className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Users size={22} />
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-150">
              {uniqueClassIds.length} Lớp
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">
              Sinh Viên & Học Vụ Toàn Trường
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 tabular-nums font-mono">
                {totalStudentsCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">sinh viên</span>
            </div>

            <div className="flex items-center gap-2 mt-3 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {normalStudentsCount} Bình thường
              </span>
              {warningStudentsCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  {warningStudentsCount} Cảnh báo
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Đình chỉ: <strong className="text-rose-600">{suspendedStudentsCount}</strong></span>
              <span className="text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Xem DS học vụ <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Xét Học Bổng */}
        <div 
          onClick={() => onNavigateTab("XET_HOC_BONG")}
          className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <Award size={22} />
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              GPA ≥ 2.5
            </span>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">
              Ứng Viên Học Bổng KKHT
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700 tabular-nums font-mono">
                {scholarshipEligibleCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">SV đủ chuẩn xét</span>
            </div>

            <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold">
              <span className="px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800">
                {gpaStats.excellent} Xuất sắc
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800">
                {gpaStats.good} Giỏi
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800">
                {gpaStats.fair} Khá
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Không có điểm F & kỷ luật</span>
              <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Xét ngay <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Yêu cầu chờ xử lý */}
        <div 
          onClick={() => onNavigateTab(pendingUnlockCount > 0 ? "UNLOCK_REQUESTS" : "GRADE_APPEALS")}
          className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform ${
              totalPendingRequests > 0 
                ? "bg-rose-50 border border-rose-200 text-rose-600 animate-pulse" 
                : "bg-slate-50 border border-slate-100 text-slate-500"
            }`}>
              <Bell size={22} />
            </div>
            {totalPendingRequests > 0 ? (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-bounce">
                Cần xử lý
              </span>
            ) : (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Đã xử lý xong
              </span>
            )}
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">
              Yêu Cầu & Khiếu Nại Cần Phê Duyệt
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black tabular-nums font-mono ${
                totalPendingRequests > 0 ? "text-rose-600" : "text-slate-900"
              }`}>
                {totalPendingRequests}
              </span>
              <span className="text-xs text-slate-400 font-medium">hồ sơ tồn đọng</span>
            </div>

            <div className="flex items-center gap-2 mt-3 text-[11px] font-medium text-slate-600">
              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold">
                Mở khóa: {pendingUnlockCount}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold">
                Phúc khảo: {pendingAppealsCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Được duyệt bởi Đào tạo</span>
              <span className="text-rose-600 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Xử lý hồ sơ <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 MAIN VISUAL CHARTS & ANALYTICS ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: Phân Phối Học Lực GPA Toàn Trường */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-600" />
                Phân Phối Học Lực & GPA Toàn Phân Hiệu
              </h3>
              <p className="text-[11px] text-slate-500">Phân bố sinh viên theo thang điểm 4.0 và xếp loại học vụ</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-450 block">GPA Trung Bình</span>
              <span className="text-xl font-black text-indigo-700 font-mono tabular-nums">{gpaStats.avg}</span>
            </div>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>Tỷ lệ phân bổ học lực</span>
              <span>Tổng {gpaStats.total} SV có điểm</span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {gpaStats.total > 0 && (
                <>
                  <div style={{ width: `${(gpaStats.excellent / gpaStats.total) * 100}%` }} className="bg-amber-400 h-full" title={`Xuất sắc: ${gpaStats.excellent}`} />
                  <div style={{ width: `${(gpaStats.good / gpaStats.total) * 100}%` }} className="bg-indigo-500 h-full" title={`Giỏi: ${gpaStats.good}`} />
                  <div style={{ width: `${(gpaStats.fair / gpaStats.total) * 100}%` }} className="bg-emerald-500 h-full" title={`Khá: ${gpaStats.fair}`} />
                  <div style={{ width: `${(gpaStats.average / gpaStats.total) * 100}%` }} className="bg-slate-400 h-full" title={`Trung bình: ${gpaStats.average}`} />
                  <div style={{ width: `${(gpaStats.weak / gpaStats.total) * 100}%` }} className="bg-rose-500 h-full" title={`Yếu: ${gpaStats.weak}`} />
                </>
              )}
            </div>
          </div>

          {/* Detailed GPA Bars */}
          <div className="space-y-3 pt-1">
            {[
              { label: "Xuất sắc (GPA ≥ 3.6)", count: gpaStats.excellent, color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
              { label: "Giỏi (3.2 ≤ GPA < 3.6)", count: gpaStats.good, color: "bg-indigo-600", text: "text-indigo-700", bg: "bg-indigo-50" },
              { label: "Khá (2.5 ≤ GPA < 3.2)", count: gpaStats.fair, color: "bg-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "Trung bình (2.0 ≤ GPA < 2.5)", count: gpaStats.average, color: "bg-slate-500", text: "text-slate-700", bg: "bg-slate-50" },
              { label: "Yếu / Cần hỗ trợ (GPA < 2.0)", count: gpaStats.weak, color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" }
            ].map(tier => {
              const pct = gpaStats.total > 0 ? Math.round((tier.count / gpaStats.total) * 100) : 0;
              return (
                <div key={tier.label} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{tier.label}</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${tier.bg} ${tier.text}`}>
                        {tier.count} SV
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`${tier.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: Radial Gauge Tiến Độ Nộp Điểm & Chỉ Số Khóa */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <BarChart2 size={16} className="text-emerald-600" />
                Tiến Độ Thu Điểm & Hoàn Thiện Hồ Sơ
              </h3>
              <p className="text-[11px] text-slate-500">Chỉ số hoàn thành nộp bảng điểm giảng viên và xử lý học vụ</p>
            </div>
            <button
              type="button"
              onClick={toggleLearningDataLock}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Lock size={12} />
              <span>Khóa sổ học vụ</span>
            </button>
          </div>

          {/* Radial progress ring */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="72" 
                  cy="72" 
                  r={radius} 
                  stroke="#f1f5f9" 
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                />
                <circle 
                  cx="72" 
                  cy="72" 
                  r={radius} 
                  stroke="#10b981" 
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{submissionRate}%</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Đã Nộp Điểm</span>
              </div>
            </div>

            {/* Metric gauges list */}
            <div className="space-y-3 w-full max-w-xs text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Bảng điểm đã nộp</span>
                  <span className="font-mono font-bold text-emerald-700 tabular-nums">{submittedCount}/{totalAssignmentsCount}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${submissionRate}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Đơn mở khóa điểm đã xử lý</span>
                  <span className="font-mono font-bold text-indigo-700 tabular-nums">
                    {unlockRequests.filter(r => r.status !== "PENDING").length}/{unlockRequests.length || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full" 
                    style={{ width: `${unlockRequests.length > 0 ? ((unlockRequests.length - pendingUnlockCount) / unlockRequests.length) * 100 : 100}%` }} 
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Đơn phúc khảo đã phản hồi</span>
                  <span className="font-mono font-bold text-amber-700 tabular-nums">
                    {gradeAppeals.filter(a => a.status === "UPDATED" || a.status === "REJECTED").length}/{gradeAppeals.length || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full" 
                    style={{ width: `${gradeAppeals.length > 0 ? ((gradeAppeals.length - pendingAppealsCount) / gradeAppeals.length) * 100 : 100}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Học kỳ: <strong>{currentSemesterObj?.name}</strong></span>
            <button
              onClick={() => onNavigateTab("TEACHER_ASSIGNMENTS")}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem phân công giảng dạy</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* CHART 3: Quy Mô Sinh Viên & Điểm GPA Theo Lớp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Top Lớp Học Có Quy Mô Lớn Nhất
              </h3>
              <p className="text-[11px] text-slate-500">Thống kê số lượng sinh viên và GPA trung bình từng lớp</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("LIST")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả ({uniqueClassIds.length})</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {topClassesByCount.map((cls, idx) => {
              const maxCount = topClassesByCount[0]?.count || 1;
              const pctOfMax = Math.round((cls.count / maxCount) * 100);
              return (
                <div key={cls.classId} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 font-mono">{cls.classId}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                      <span className="text-slate-500 font-semibold">{cls.count} SV</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        GPA {cls.avgGpa}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Toàn phân hiệu hiện có: <strong className="text-slate-900">{totalStudentsCount} SV</strong> trên <strong className="text-slate-900">{uniqueClassIds.length} lớp</strong></span>
            <button
              onClick={() => onNavigateTab("IMPORT_CLASSES")}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UploadCloud size={13} />
              <span>Nạp thêm lớp mới</span>
            </button>
          </div>
        </div>

        {/* CHART 4: Tín Chỉ & Thời Khóa Biểu Lớp */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <Clock size={16} className="text-amber-600" />
                Đăng Ký Tín Chỉ & Thời Khóa Biểu
              </h3>
              <p className="text-[11px] text-slate-500">Tình trạng mở đợt đăng ký môn và dữ liệu xếp lịch học</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              openCreditPeriodsCount > 0 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}>
              {openCreditPeriodsCount > 0 ? "Đang mở đợt ĐK tín chỉ" : "Chưa mở đợt tín chỉ"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Box Credit */}
            <div 
              onClick={() => onNavigateTab("DANG_KY_TIN_CHI")}
              className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-indigo-700 mb-1">
                <BookOpen size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-100">
                  Tín Chỉ
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-2">
                {courseOfferings.length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Học phần mở tín chỉ</div>
              <div className="text-[11px] text-indigo-700 font-bold mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>{creditEnrollments.length} lượt SV đăng ký</span>
                <ChevronRight size={12} />
              </div>
            </div>

            {/* Box Schedule */}
            <div 
              onClick={() => onNavigateTab("THOI_KHOA_BIEU")}
              className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 hover:border-amber-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <Clock size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-amber-100">
                  TKB Lớp
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-2">
                {schedules.length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Tiết / Ca học đã xếp</div>
              <div className="text-[11px] text-amber-800 font-bold mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>{scheduledClassesCount}/{uniqueClassIds.length} lớp có TKB</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab("DANG_KY_TIN_CHI")}
              className="py-2 px-3 text-xs font-bold rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen size={13} />
              <span>Quản lý Tín chỉ</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("THOI_KHOA_BIEU")}
              className="py-2 px-3 text-xs font-bold rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock size={13} />
              <span>Xếp TKB Lớp</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM QUICK NAVIGATION LAUNCHPAD (9 MODULES) ────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              Điều Hướng Nhanh Đến 9 Chức Năng Đào Tạo
            </h3>
            <p className="text-[11px] text-slate-500">Truy cập tức thời đến mọi nghiệp vụ đào tạo, khảo thí và quản trị học sinh sinh viên</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              id: "IMPORT",
              label: "Nạp & Tổng Hợp Điểm HK",
              desc: "Nạp file Excel hoặc tự động gom điểm GV nộp",
              icon: FileSpreadsheet,
              badge: `${submittedCount}/${totalAssignmentsCount}`,
              color: "text-emerald-600 bg-emerald-50 border-emerald-100"
            },
            {
              id: "DANG_KY_TIN_CHI",
              label: "Đăng Ký Tín Chỉ",
              desc: "Mở đợt đăng ký, học phần & danh sách SV đăng ký",
              icon: BookOpen,
              badge: `${courseOfferings.length} môn`,
              color: "text-blue-600 bg-blue-50 border-blue-100"
            },
            {
              id: "TEACHER_ASSIGNMENTS",
              label: "Phân Công Giảng Dạy",
              desc: "Gán GV phụ trách môn học và cấp tài khoản tự động",
              icon: Users,
              badge: `${totalAssignmentsCount} lớp HP`,
              color: "text-indigo-600 bg-indigo-50 border-indigo-100"
            },
            {
              id: "UNLOCK_REQUESTS",
              label: "Duyệt Mở Khóa Điểm",
              desc: "Xem xét và phê duyệt đơn xin sửa điểm của GV",
              icon: Lock,
              badge: pendingUnlockCount > 0 ? `${pendingUnlockCount} chờ duyệt` : "0",
              color: pendingUnlockCount > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-slate-600 bg-slate-50 border-slate-100"
            },
            {
              id: "GRADE_APPEALS",
              label: "Xử Lý Phúc Khảo",
              desc: "Tiếp nhận và giải quyết đơn khiếu nại điểm của SV",
              icon: Bell,
              badge: pendingAppealsCount > 0 ? `${pendingAppealsCount} chờ xử lý` : "0",
              color: pendingAppealsCount > 0 ? "text-rose-600 bg-rose-50 border-rose-200" : "text-slate-600 bg-slate-50 border-slate-100"
            },
            {
              id: "IMPORT_CLASSES",
              label: "Nạp Danh Sách SV Lớp Mới",
              desc: "Import danh sách SV các lớp từ file Excel mẫu",
              icon: UploadCloud,
              badge: `${uniqueClassIds.length} lớp`,
              color: "text-purple-600 bg-purple-50 border-purple-100"
            },
            {
              id: "LIST",
              label: "Danh Sách Học Vụ SV",
              desc: "Quản lý hồ sơ, GPA, tín chỉ và khóa sổ từng lớp",
              icon: Grid,
              badge: `${totalStudentsCount} SV`,
              color: "text-teal-600 bg-teal-50 border-teal-100"
            },
            {
              id: "THOI_KHOA_BIEU",
              label: "Thời Khóa Biểu Lớp",
              desc: "Khai báo ca học, phòng học và thời khóa biểu",
              icon: Clock,
              badge: `${schedules.length} tiết`,
              color: "text-amber-600 bg-amber-50 border-amber-100"
            },
            {
              id: "XET_HOC_BONG",
              label: "Xét Học Bổng",
              desc: "Tự động lọc sinh viên đạt chuẩn và xuất file Excel",
              icon: Award,
              badge: `${scholarshipEligibleCount} SV đạt`,
              color: "text-amber-700 bg-amber-50 border-amber-200"
            }
          ].map(module => {
            const ModIcon = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => onNavigateTab(module.id)}
                className="p-3.5 rounded-xl border border-slate-150 hover:border-indigo-300 hover:bg-slate-50/50 transition-all cursor-pointer group flex items-start gap-3"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${module.color} group-hover:scale-105 transition-transform`}>
                  <ModIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                      {module.label}
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                      {module.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {module.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
