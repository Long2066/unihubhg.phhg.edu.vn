import React, { useState, useMemo, useRef } from "react";
import { useUniHub, normalizeClassId } from "../state";
import { 
  RegistrationPeriod, 
  CourseOffering, 
  CreditEnrollment, 
  SEMESTER_LIST, 
  UserRole 
} from "../types";
import { 
  downloadCourseOfferingsTemplate, 
  parseCourseOfferingsExcel, 
  exportCreditEnrollmentsReport 
} from "../utils/creditRegistrationExcel";
import { 
  BookOpen, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  UploadCloud, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Unlock, 
  Trash2, 
  Edit3, 
  Users, 
  Layers, 
  Check, 
  X, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders
} from "lucide-react";

export const CreditRegistrationTrainingView: React.FC = () => {
  const {
    currentUser,
    students,
    selectedSemesterId,
    setSelectedSemesterId,
    registrationPeriods,
    courseOfferings,
    creditEnrollments,
    saveRegistrationPeriod,
    deleteRegistrationPeriod,
    toggleRegistrationPeriodStatus,
    saveCourseOffering,
    deleteCourseOffering,
    importCourseOfferingsExcel,
    cancelCreditEnrollment
  } = useUniHub();

  // Tab con trong màn hình Đào tạo
  const [activeSubTab, setActiveSubTab] = useState<"PERIODS" | "OFFERINGS" | "TRACKING">("TRACKING");

  // Filters
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "REGISTERED" | "NOT_REGISTERED" | "BELOW_MIN">("ALL");

  // Modal Thêm/Sửa Đợt
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<Partial<RegistrationPeriod> | null>(null);

  // Modal Thêm/Sửa Môn
  const [showOfferingModal, setShowOfferingModal] = useState<boolean>(false);
  const [editingOffering, setEditingOffering] = useState<Partial<CourseOffering> | null>(null);

  // Modal Chi tiết Đăng ký SV
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<string | null>(null);

  // Loading / Feedback
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Đợt đăng ký áp dụng cho học kỳ đang chọn
  const currentPeriod = useMemo(() => {
    return registrationPeriods.find(p => p.semesterId === selectedSemesterId) || null;
  }, [registrationPeriods, selectedSemesterId]);

  // Danh mục môn học của học kỳ đang chọn
  const semesterOfferings = useMemo(() => {
    return courseOfferings.filter(o => o.semesterId === selectedSemesterId);
  }, [courseOfferings, selectedSemesterId]);

  // Đăng ký của học kỳ đang chọn
  const semesterEnrollments = useMemo(() => {
    return creditEnrollments.filter(e => e.semesterId === selectedSemesterId && e.isActive);
  }, [creditEnrollments, selectedSemesterId]);

  // Danh sách các lớp học sinh hoạt
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.classId) set.add(normalizeClassId(s.classId));
    });
    return Array.from(set).sort();
  }, [students]);

  // Map số tín chỉ của từng SV
  const studentCreditStats = useMemo(() => {
    const map = new Map<string, { totalCredits: number; list: CreditEnrollment[] }>();
    semesterEnrollments.forEach(en => {
      const cur = map.get(en.studentId) || { totalCredits: 0, list: [] };
      cur.totalCredits += Number(en.credits) || 0;
      cur.list.push(en);
      map.set(en.studentId, cur);
    });
    return map;
  }, [semesterEnrollments]);

  // Danh sách sinh viên sau khi filter
  const filteredStudents = useMemo(() => {
    const minTC = currentPeriod?.minCreditsPerStudent || 12;
    return students.filter(s => {
      if (classFilter !== "ALL" && normalizeClassId(s.classId) !== classFilter) return false;

      const stats = studentCreditStats.get(s.id);
      const tc = stats?.totalCredits || 0;

      if (statusFilter === "REGISTERED" && tc === 0) return false;
      if (statusFilter === "NOT_REGISTERED" && tc > 0) return false;
      if (statusFilter === "BELOW_MIN" && (tc === 0 || tc >= minTC)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        const matchClass = s.classId.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchClass) return false;
      }

      return true;
    });
  }, [students, classFilter, statusFilter, searchQuery, studentCreditStats, currentPeriod]);

  // Thống kê tổng hợp
  const totalStudentsInScope = useMemo(() => {
    if (classFilter === "ALL") return students.length;
    return students.filter(s => normalizeClassId(s.classId) === classFilter).length;
  }, [students, classFilter]);

  const registeredStudentsCount = useMemo(() => {
    return filteredStudents.filter(s => (studentCreditStats.get(s.id)?.totalCredits || 0) > 0).length;
  }, [filteredStudents, studentCreditStats]);

  const totalCreditsAccumulated = useMemo(() => {
    return filteredStudents.reduce((sum, s) => sum + (studentCreditStats.get(s.id)?.totalCredits || 0), 0);
  }, [filteredStudents, studentCreditStats]);

  // Xử lý tạo / sửa Đợt
  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod?.name) return;
    try {
      setActionLoading(true);
      const semObj = SEMESTER_LIST.find(s => s.id === (editingPeriod.semesterId || selectedSemesterId));
      const payload: RegistrationPeriod = {
        id: editingPeriod.id || `REGPERIOD_${editingPeriod.semesterId || selectedSemesterId}`,
        semesterId: editingPeriod.semesterId || selectedSemesterId,
        name: editingPeriod.name.trim(),
        startDate: editingPeriod.startDate || new Date().toISOString().split("T")[0],
        endDate: editingPeriod.endDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
        status: editingPeriod.status || "OPEN",
        maxCreditsPerStudent: Math.max(1, Number(editingPeriod.maxCreditsPerStudent) || 24),
        minCreditsPerStudent: Math.max(1, Number(editingPeriod.minCreditsPerStudent) || 12),
        instructions: editingPeriod.instructions || "Sinh viên đăng ký các học phần theo kế hoạch đào tạo của Phân hiệu.",
        createdBy: currentUser?.name || "Phòng Đào tạo",
        createdAt: editingPeriod.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveRegistrationPeriod(payload);
      setShowPeriodModal(false);
      setEditingPeriod(null);
      showFeedback("Đã lưu đợt đăng ký tín chỉ thành công và đồng bộ đám mây!");
    } catch (err: any) {
      showFeedback("Lỗi khi lưu đợt đăng ký: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý tạo / sửa Môn học
  const handleSaveOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffering?.subjectCode || !editingOffering?.subjectName) return;
    try {
      setActionLoading(true);
      const code = editingOffering.subjectCode.trim().toUpperCase();
      const payload: CourseOffering = {
        id: editingOffering.id || `OFFERING_${selectedSemesterId}_${code}`,
        periodId: currentPeriod?.id || `REGPERIOD_${selectedSemesterId}`,
        semesterId: selectedSemesterId,
        subjectCode: code,
        subjectName: editingOffering.subjectName.trim(),
        credits: Math.max(1, Number(editingOffering.credits) || 3),
        teacherName: editingOffering.teacherName?.trim() || "Chưa phân công",
        targetClasses: editingOffering.targetClasses && editingOffering.targetClasses.length > 0 ? editingOffering.targetClasses : undefined,
        isActive: editingOffering.isActive !== undefined ? editingOffering.isActive : true,
        notes: editingOffering.notes?.trim() || undefined,
        createdBy: currentUser?.name || "Phòng Đào tạo",
        createdAt: editingOffering.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveCourseOffering(payload);
      setShowOfferingModal(false);
      setEditingOffering(null);
      showFeedback("Đã cập nhật học phần tín chỉ thành công!");
    } catch (err: any) {
      showFeedback("Lỗi khi lưu học phần: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý import Excel môn học
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActionLoading(true);
      const parsed = await parseCourseOfferingsExcel(
        file,
        currentPeriod?.id || `REGPERIOD_${selectedSemesterId}`,
        selectedSemesterId,
        currentUser?.name || "Phòng Đào tạo"
      );
      await importCourseOfferingsExcel(parsed);
      showFeedback(`Đã nạp thành công ${parsed.length} học phần vào CSDL đám mây!`);
    } catch (err: any) {
      showFeedback("Lỗi nạp tệp Excel: " + err.message, "error");
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Xuất file báo cáo Excel
  const handleExportReport = async () => {
    const semName = SEMESTER_LIST.find(s => s.id === selectedSemesterId)?.name || selectedSemesterId;
    try {
      setActionLoading(true);
      await exportCreditEnrollmentsReport({
        semesterName: semName,
        classFilter,
        students,
        enrollments: semesterEnrollments,
        minCredits: currentPeriod?.minCreditsPerStudent || 12
      });
      showFeedback("Đã xuất file Excel báo cáo chuẩn Times New Roman thành công!");
    } catch (err: any) {
      showFeedback("Lỗi khi xuất file Excel: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-3 duration-200 border ${
          feedbackMessage.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
            : "bg-rose-50 text-rose-900 border-rose-200"
        }`}>
          {feedbackMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedbackMessage.text}</span>
        </div>
      )}

      {/* Header & Bộ lọc học kỳ */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Hệ Thống Quản Trị Tín Chỉ
          </div>
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Đăng Ký Học Phần Tín Chỉ</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Quản trị đợt mở đăng ký, danh mục học phần và giám sát tổng số tín chỉ sinh viên toàn Phân hiệu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Học kỳ làm việc:</label>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            {SEMESTER_LIST.map(sem => (
              <option key={sem.id} value={sem.id}>{sem.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Thanh trạng thái đợt đăng ký hiện tại (Live Status Banner) */}
      <div className={`rounded-2xl p-5 border shadow-xs transition-all ${
        currentPeriod?.status === "OPEN"
          ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200"
          : currentPeriod?.status === "UPCOMING"
          ? "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200"
          : "bg-slate-50 border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${
              currentPeriod?.status === "OPEN"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : currentPeriod?.status === "UPCOMING"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                : "bg-slate-400 text-white"
            }`}>
              {currentPeriod?.status === "OPEN" ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">
                  {currentPeriod?.name || "Chưa khởi tạo đợt đăng ký tín chỉ cho học kỳ này"}
                </span>
                {currentPeriod && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    currentPeriod.status === "OPEN"
                      ? "bg-emerald-100 text-emerald-800"
                      : currentPeriod.status === "UPCOMING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {currentPeriod.status === "OPEN" ? "ĐANG MỞ ĐĂNG KÝ" : currentPeriod.status === "UPCOMING" ? "SẮP MỞ" : "ĐÃ ĐÓNG CỔNG"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {currentPeriod ? (
                  <>
                    Thời hạn: <strong className="font-medium text-slate-800">{currentPeriod.startDate}</strong> đến <strong className="font-medium text-slate-800">{currentPeriod.endDate}</strong> • Giới hạn: <strong className="text-indigo-600 font-semibold">{currentPeriod.minCreditsPerStudent} - {currentPeriod.maxCreditsPerStudent} TC</strong> / sinh viên
                  </>
                ) : (
                  "Bấm nút \"Khởi Tạo Đợt Đăng Ký\" bên dưới để mở cổng cho sinh viên đăng ký học phần."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentPeriod ? (
              <>
                {currentPeriod.status === "OPEN" ? (
                  <button
                    onClick={() => toggleRegistrationPeriodStatus(currentPeriod.id, "CLOSED")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    Đóng Cổng Đăng Ký
                  </button>
                ) : (
                  <button
                    onClick={() => toggleRegistrationPeriodStatus(currentPeriod.id, "OPEN")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Unlock className="w-4 h-4" />
                    Kích Hoạt Mở Cổng
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingPeriod(currentPeriod);
                    setShowPeriodModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Cấu hình
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingPeriod({
                    semesterId: selectedSemesterId,
                    name: `Đăng ký tín chỉ ${SEMESTER_LIST.find(s => s.id === selectedSemesterId)?.name || ""}`,
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
                    status: "OPEN",
                    minCreditsPerStudent: 12,
                    maxCreditsPerStudent: 24,
                    instructions: "Sinh viên lựa chọn các học phần mở trong học kỳ để tích lũy đủ số tín chỉ quy định."
                  });
                  setShowPeriodModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Khởi Tạo Đợt Đăng Ký
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab("TRACKING")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "TRACKING"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Giám Sát & Theo Dõi Sinh Viên ({filteredStudents.length})
        </button>

        <button
          onClick={() => setActiveSubTab("OFFERINGS")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "OFFERINGS"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Danh Mục Học Phần Mở ({semesterOfferings.length})
        </button>

        <button
          onClick={() => setActiveSubTab("PERIODS")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "PERIODS"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Lịch Sử Đợt Đăng Ký ({registrationPeriods.length})
        </button>
      </div>

      {/* ─── TAB 1: GIÁM SÁT & THEO DÕI SINH VIÊN ────────────────────── */}
      {activeSubTab === "TRACKING" && (
        <div className="space-y-6">
          {/* 4 Cards KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Sinh Viên</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalStudentsInScope}</span>
                <span className="text-xs text-slate-400 font-medium">{classFilter === "ALL" ? "Toàn trường" : classFilter}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Đã Đăng Ký Tín Chỉ</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600 tabular-nums">{registeredStudentsCount}</span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {totalStudentsInScope > 0 ? Math.round((registeredStudentsCount / totalStudentsInScope) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tổng Tín Chỉ Tích Lũy</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-indigo-600 tabular-nums">{totalCreditsAccumulated}</span>
                <span className="text-xs text-slate-400 font-medium">TC học kỳ</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trung Bình / SV</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {registeredStudentsCount > 0 ? (totalCreditsAccumulated / registeredStudentsCount).toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-slate-400 font-medium">TC / sinh viên</span>
              </div>
            </div>
          </div>

          {/* Controls: Search, Filter, Export Excel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Lọc Lớp */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Lớp:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả các lớp</option>
                  {classList.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Lọc Trạng Thái TC */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="REGISTERED">Đã đăng ký ({">"} 0 TC)</option>
                  <option value="BELOW_MIN">Cảnh báo thiếu tín chỉ</option>
                  <option value="NOT_REGISTERED">Chưa đăng ký (0 TC)</option>
                </select>
              </div>

              {/* Ô tìm kiếm */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm MSSV, họ tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-52"
                />
              </div>
            </div>

            {/* Nút Xuất Excel Chuẩn Times New Roman */}
            <button
              onClick={handleExportReport}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Báo Cáo Excel (Times New Roman)
            </button>
          </div>

          {/* Bảng Dữ Liệu Sinh Viên */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-12">STT</th>
                    <th className="py-3.5 px-4 w-32">Mã SV</th>
                    <th className="py-3.5 px-4">Họ và Tên</th>
                    <th className="py-3.5 px-4 w-32">Lớp</th>
                    <th className="py-3.5 px-4 text-center w-28">Số Tín Chỉ</th>
                    <th className="py-3.5 px-4">Chi Tiết Môn Đăng Ký</th>
                    <th className="py-3.5 px-4 text-center w-36">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Không tìm thấy sinh viên nào phù hợp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const stats = studentCreditStats.get(s.id);
                      const totalTC = stats?.totalCredits || 0;
                      const ens = stats?.list || [];
                      const minTC = currentPeriod?.minCreditsPerStudent || 12;
                      const isQualified = totalTC >= minTC;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">{s.id}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{s.name}</td>
                          <td className="py-3 px-4 text-slate-600">{s.classId}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                              totalTC === 0
                                ? "bg-slate-100 text-slate-500"
                                : isQualified
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {totalTC} TC
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {ens.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {ens.map(en => (
                                  <span key={en.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-100">
                                    <strong>{en.subjectCode}</strong>: {en.subjectName} ({en.credits}TC)
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Chưa đăng ký môn nào</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {totalTC === 0 ? (
                              <span className="text-[11px] font-medium text-slate-400">Chưa nộp</span>
                            ) : isQualified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Đạt chuẩn ({totalTC} TC)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                Thiếu ({totalTC}/{minTC} TC)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {ens.length > 0 && (
                              <button
                                onClick={() => setSelectedStudentDetail(s.id)}
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Chi tiết
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DANH MỤC HỌC PHẦN MỞ ────────────────────────────── */}
      {activeSubTab === "OFFERINGS" && (
        <div className="space-y-6">
          {/* Thanh công cụ quản lý môn học */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800">
                Tổng cộng: <strong className="text-indigo-600 font-bold">{semesterOfferings.length}</strong> môn mở
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tải tệp mẫu Excel */}
              <button
                onClick={() => {
                  const semName = SEMESTER_LIST.find(s => s.id === selectedSemesterId)?.name;
                  downloadCourseOfferingsTemplate(semName);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Tải Tệp Excel Mẫu
              </button>

              {/* Nạp từ Excel */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                Nạp Danh Sách Môn (Excel)
              </button>

              {/* Thêm môn thủ công */}
              <button
                onClick={() => {
                  setEditingOffering({
                    semesterId: selectedSemesterId,
                    credits: 3,
                    isActive: true
                  });
                  setShowOfferingModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Thêm Môn Mới
              </button>
            </div>
          </div>

          {/* Bảng danh sách môn học */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-center w-12">STT</th>
                    <th className="py-3.5 px-4 w-28">Mã HP</th>
                    <th className="py-3.5 px-4">Tên Học Phần</th>
                    <th className="py-3.5 px-4 text-center w-20">Số TC</th>
                    <th className="py-3.5 px-4">Giảng Viên</th>
                    <th className="py-3.5 px-4">Lớp Áp Dụng</th>
                    <th className="py-3.5 px-4 text-center w-24">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right w-24">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
                  {semesterOfferings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        Chưa có môn học phần nào được mở cho học kỳ này. Hãy nạp file Excel hoặc thêm mới môn học.
                      </td>
                    </tr>
                  ) : (
                    semesterOfferings.map((off, idx) => (
                      <tr key={off.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{off.subjectCode}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{off.subjectName}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-800">{off.credits}</td>
                        <td className="py-3 px-4 text-slate-600">{off.teacherName}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {off.targetClasses && off.targetClasses.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                              {off.targetClasses.join(", ")}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Toàn trường</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            off.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {off.isActive ? "Đang mở" : "Tạm khóa"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingOffering(off);
                                setShowOfferingModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa môn học"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xác nhận xóa môn học "${off.subjectName}" (${off.subjectCode})?`)) {
                                  deleteCourseOffering(off.id);
                                  showFeedback(`Đã xóa môn học ${off.subjectCode}`);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa môn học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LỊCH SỬ ĐỢT ĐĂNG KÝ ─────────────────────────────── */}
      {activeSubTab === "PERIODS" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Danh Sách Các Đợt Đăng Ký Tín Chỉ</h3>
            <button
              onClick={() => {
                setEditingPeriod({
                  semesterId: selectedSemesterId,
                  name: `Đăng ký tín chỉ ${SEMESTER_LIST.find(s => s.id === selectedSemesterId)?.name || ""}`,
                  startDate: new Date().toISOString().split("T")[0],
                  endDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
                  status: "OPEN",
                  minCreditsPerStudent: 12,
                  maxCreditsPerStudent: 24
                });
                setShowPeriodModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo Đợt Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrationPeriods.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <span className="text-xs text-slate-500">
                      Học kỳ: {SEMESTER_LIST.find(s => s.id === p.semesterId)?.name || p.semesterId}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === "OPEN"
                      ? "bg-emerald-100 text-emerald-800"
                      : p.status === "UPCOMING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {p.status === "OPEN" ? "ĐANG MỞ" : p.status === "UPCOMING" ? "SẮP MỞ" : "ĐÃ ĐÓNG"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 space-y-1">
                  <div>⏱ Thời gian: <strong>{p.startDate}</strong> đến <strong>{p.endDate}</strong></div>
                  <div>📌 Giới hạn: <strong>{p.minCreditsPerStudent}</strong> đến <strong>{p.maxCreditsPerStudent}</strong> tín chỉ/sinh viên</div>
                  {p.instructions && <div className="italic text-slate-500 pt-1">"{p.instructions}"</div>}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingPeriod(p);
                      setShowPeriodModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Xác nhận xóa đợt đăng ký "${p.name}"?`)) {
                        deleteRegistrationPeriod(p.id);
                        showFeedback(`Đã xóa đợt đăng ký ${p.name}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL TẠO / SỬA ĐỢT ĐĂNG KÝ ─────────────────────────────── */}
      {showPeriodModal && editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingPeriod.id ? "Cấu Hình Đợt Đăng Ký Tín Chỉ" : "Tạo Đợt Đăng Ký Tín Chỉ Mới"}
              </h3>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đợt đăng ký *</label>
                <input
                  type="text"
                  required
                  value={editingPeriod.name || ""}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, name: e.target.value })}
                  placeholder="Ví dụ: Đăng ký tín chỉ Học kỳ II - 2025-2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học kỳ áp dụng</label>
                  <select
                    value={editingPeriod.semesterId || selectedSemesterId}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, semesterId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    {SEMESTER_LIST.map(sem => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái cổng</label>
                  <select
                    value={editingPeriod.status || "OPEN"}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  >
                    <option value="OPEN">Đang mở (Sinh viên được đăng ký)</option>
                    <option value="UPCOMING">Sắp mở (Hiển thị đếm ngược)</option>
                    <option value="CLOSED">Đã đóng sổ (Chỉ xem)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={editingPeriod.startDate || ""}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={editingPeriod.endDate || ""}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tối thiểu (Tín chỉ)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editingPeriod.minCreditsPerStudent || 12}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, minCreditsPerStudent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tối đa (Tín chỉ)</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={editingPeriod.maxCreditsPerStudent || 24}
                    onChange={(e) => setEditingPeriod({ ...editingPeriod, maxCreditsPerStudent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hướng dẫn sinh viên</label>
                <textarea
                  rows={3}
                  value={editingPeriod.instructions || ""}
                  onChange={(e) => setEditingPeriod({ ...editingPeriod, instructions: e.target.value })}
                  placeholder="Ghi chú quy chế, điều kiện tín chỉ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Lưu & Đồng Bộ Đám Mây
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL THÊM / SỬA MÔN HỌC ─────────────────────────────────── */}
      {showOfferingModal && editingOffering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingOffering.id ? "Chỉnh Sửa Học Phần Tín Chỉ" : "Thêm Học Phần Tín Chỉ Mới"}
              </h3>
              <button
                onClick={() => setShowOfferingModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffering} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học phần *</label>
                  <input
                    type="text"
                    required
                    value={editingOffering.subjectCode || ""}
                    onChange={(e) => setEditingOffering({ ...editingOffering, subjectCode: e.target.value })}
                    placeholder="VD: VPS7251"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên học phần *</label>
                  <input
                    type="text"
                    required
                    value={editingOffering.subjectName || ""}
                    onChange={(e) => setEditingOffering({ ...editingOffering, subjectName: e.target.value })}
                    placeholder="VD: Cơ sở Tự nhiên và Xã hội"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số tín chỉ *</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={editingOffering.credits || 3}
                    onChange={(e) => setEditingOffering({ ...editingOffering, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giảng viên giảng dạy</label>
                  <input
                    type="text"
                    value={editingOffering.teacherName || ""}
                    onChange={(e) => setEditingOffering({ ...editingOffering, teacherName: e.target.value })}
                    placeholder="TS. Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lớp áp dụng (để trống = toàn trường)
                </label>
                <input
                  type="text"
                  value={editingOffering.targetClasses?.join(", ") || ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const arr = raw.split(",").map(c => c.trim()).filter(Boolean);
                    setEditingOffering({ ...editingOffering, targetClasses: arr });
                  }}
                  placeholder="K2-GDTH A, K2-GDTH B (ngăn cách bằng dấu phẩy)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú học phần</label>
                <input
                  type="text"
                  value={editingOffering.notes || ""}
                  onChange={(e) => setEditingOffering({ ...editingOffering, notes: e.target.value })}
                  placeholder="Điều kiện tiên quyết, phòng máy, địa điểm..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="offeringActive"
                  checked={editingOffering.isActive !== false}
                  onChange={(e) => setEditingOffering({ ...editingOffering, isActive: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="offeringActive" className="text-xs font-medium text-slate-700">
                  Mở học phần này cho sinh viên được đăng ký
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOfferingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Lưu Học Phần
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL CHI TIẾT ĐĂNG KÝ CỦA SINH VIÊN ────────────────────── */}
      {selectedStudentDetail && (() => {
        const student = students.find(s => s.id === selectedStudentDetail);
        const stats = studentCreditStats.get(selectedStudentDetail);
        const ens = stats?.list || [];
        const totalTC = stats?.totalCredits || 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Chi Tiết Đăng Ký Tín Chỉ Sinh Viên</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {student?.name} • MSSV: <strong className="font-mono text-slate-700">{student?.id}</strong> • Lớp: {student?.classId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Tổng số tín chỉ đăng ký</span>
                    <div className="text-xl font-bold font-mono text-indigo-700 mt-0.5">{totalTC} Tín chỉ</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    totalTC >= (currentPeriod?.minCreditsPerStudent || 12)
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {totalTC >= (currentPeriod?.minCreditsPerStudent || 12) ? "ĐẠT CHUẨN" : "CHƯA ĐẠT CHUẨN TỐI THIỂU"}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Danh Sách Các Học Phần ({ens.length})</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {ens.map(en => (
                    <div key={en.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span className="font-mono text-indigo-600">{en.subjectCode}</span>
                          <span>{en.subjectName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px]">
                            {en.credits} TC
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          GV: {en.teacherName} • ĐK lúc: {new Date(en.registeredAt).toLocaleString("vi-VN")}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Xác nhận hủy môn "${en.subjectName}" (${en.subjectCode}) của sinh viên ${student?.name}?`)) {
                            await cancelCreditEnrollment(en.id);
                            showFeedback(`Đã hủy học phần ${en.subjectCode}`);
                          }
                        }}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Hủy môn này
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
