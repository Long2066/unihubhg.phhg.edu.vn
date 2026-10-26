import React, { useState, useMemo, useEffect } from "react";
import { useUniHub } from "../state";
import { CourseOffering, CreditEnrollment, Student } from "../types";
import { exportStudentEnrollmentSlip } from "../utils/creditRegistrationExcel";
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Printer,
  Zap,
  ListChecks
} from "lucide-react";

export const CreditRegistrationStudentView: React.FC = () => {
  const {
    currentUser,
    students,
    selectedSemesterId,
    setSelectedSemesterId,
    registrationPeriods,
    courseOfferings,
    creditEnrollments,
    allSemesters,
    enrollCreditCourses,
    cancelCreditEnrollment
  } = useUniHub();

  // Tab con: Mặc định hiển thị tab ĐĂNG KÝ MÔN MỚI
  const [activeTab, setActiveTab] = useState<"REGISTER" | "MY_COURSES">("REGISTER");

  // Xác định sinh viên hiện tại
  const sObj = useMemo(() => {
    return students?.find(s => 
      (currentUser?.targetId && s.id.toLowerCase() === currentUser.targetId.toLowerCase()) ||
      (currentUser?.username && (s.id.toLowerCase() === currentUser.username.toLowerCase() || (s.email && s.email.toLowerCase() === currentUser.username.toLowerCase()))) ||
      (currentUser?.email && s.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || null;
  }, [students, currentUser]);

  const studentId = sObj?.id || currentUser?.targetId || currentUser?.username || "";
  const studentName = sObj?.name || currentUser?.name || "Sinh viên";
  const studentClassId = sObj?.classId || "Chưa phân lớp";

  // Đợt đăng ký áp dụng cho học kỳ
  const currentPeriod = useMemo(() => {
    return registrationPeriods.find(p => p.semesterId === selectedSemesterId) || null;
  }, [registrationPeriods, selectedSemesterId]);

  const isPeriodOpen = currentPeriod?.status === "OPEN";

  // Tự động chuyển sang học kỳ có đợt đang MỞ nếu học kỳ hiện tại đang đóng
  useEffect(() => {
    if (!isPeriodOpen && registrationPeriods.length > 0) {
      const openPeriod = registrationPeriods.find(p => p.status === "OPEN");
      if (openPeriod && openPeriod.semesterId !== selectedSemesterId) {
        setSelectedSemesterId(openPeriod.semesterId);
      }
    }
  }, [registrationPeriods, isPeriodOpen, selectedSemesterId, setSelectedSemesterId]);

  // Các học kỳ khác đang mở (nếu có)
  const otherOpenPeriods = useMemo(() => {
    return registrationPeriods.filter(p => p.status === "OPEN" && p.semesterId !== selectedSemesterId);
  }, [registrationPeriods, selectedSemesterId]);

  // Môn học mở của học kỳ
  const availableOfferings = useMemo(() => {
    return courseOfferings.filter(o => {
      if (o.semesterId !== selectedSemesterId) return false;
      if (!o.isActive) return false;
      // Nếu môn có giới hạn lớp, kiểm tra lớp của SV
      if (o.targetClasses && o.targetClasses.length > 0 && studentClassId) {
        const normClass = studentClassId.toLowerCase();
        const match = o.targetClasses.some(c => c.toLowerCase() === normClass || normClass.includes(c.toLowerCase()));
        if (!match) return false;
      }
      return true;
    });
  }, [courseOfferings, selectedSemesterId, studentClassId]);

  // Các môn sinh viên này ĐÃ đăng ký trong học kỳ này
  const myEnrollments = useMemo(() => {
    return creditEnrollments.filter(e => 
      e.studentId === studentId && 
      e.semesterId === selectedSemesterId && 
      e.isActive
    );
  }, [creditEnrollments, studentId, selectedSemesterId]);

  const myEnrolledOfferingIds = useMemo(() => {
    return new Set(myEnrollments.map(e => e.offeringId));
  }, [myEnrollments]);

  // Danh sách ID môn đang chọn (để đăng ký mới)
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Tính toán số tín chỉ
  const enrolledCredits = useMemo(() => {
    return myEnrollments.reduce((sum, e) => sum + (Number(e.credits) || 0), 0);
  }, [myEnrollments]);

  const selectedCredits = useMemo(() => {
    return availableOfferings
      .filter(o => selectedOfferingIds.includes(o.id) && !myEnrolledOfferingIds.has(o.id))
      .reduce((sum, o) => sum + (Number(o.credits) || 0), 0);
  }, [availableOfferings, selectedOfferingIds, myEnrolledOfferingIds]);

  const projectedTotalCredits = enrolledCredits + selectedCredits;

  const minCredits = currentPeriod?.minCreditsPerStudent || 12;
  const maxCredits = currentPeriod?.maxCreditsPerStudent || 24;

  // Toggle chọn môn bằng checkbox
  const handleToggleSelect = (offeringId: string) => {
    if (!isPeriodOpen) return;
    if (myEnrolledOfferingIds.has(offeringId)) return;

    setSelectedOfferingIds(prev => {
      if (prev.includes(offeringId)) {
        return prev.filter(id => id !== offeringId);
      } else {
        const off = availableOfferings.find(o => o.id === offeringId);
        const added = Number(off?.credits) || 0;
        if (projectedTotalCredits + added > maxCredits) {
          showFeedback(`Không thể chọn thêm: Số tín chỉ sẽ vượt quá hạn mức tối đa (${maxCredits} TC)!`, "error");
          return prev;
        }
        return [...prev, offeringId];
      }
    });
  };

  // 1-Click: Đăng ký ngay một học phần duy nhất (trực quan, nhanh chóng)
  const handleQuickRegister = async (offering: CourseOffering) => {
    if (!isPeriodOpen) {
      showFeedback("Cổng đăng ký hiện đang đóng. Không thể đăng ký học phần!", "error");
      return;
    }
    const addedCredits = Number(offering.credits) || 0;
    if (enrolledCredits + addedCredits > maxCredits) {
      showFeedback(`Không thể đăng ký: Tổng tín chỉ sẽ là ${enrolledCredits + addedCredits} TC, vượt mức tối đa ${maxCredits} TC!`, "error");
      return;
    }

    try {
      setActionLoading(true);
      const res = await enrollCreditCourses(studentId, studentName, studentClassId, [offering.id]);
      if (res.success) {
        setSelectedOfferingIds(prev => prev.filter(id => id !== offering.id));
        showFeedback(`Đã đăng ký thành công môn ${offering.subjectName} (${offering.subjectCode})!`, "success");
      } else {
        showFeedback(res.message, "error");
      }
    } catch (err: any) {
      showFeedback("Lỗi khi đăng ký: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Gửi đăng ký hàng loạt (nhiều môn cùng lúc khi đã tích chọn checkbox)
  const handleSubmitBatchEnrollment = async () => {
    if (!isPeriodOpen) {
      showFeedback("Đợt đăng ký hiện đang đóng. Không thể gửi đăng ký!", "error");
      return;
    }
    if (selectedOfferingIds.length === 0) {
      showFeedback("Vui lòng tích chọn ít nhất 1 học phần để đăng ký!", "error");
      return;
    }

    try {
      setActionLoading(true);
      const res = await enrollCreditCourses(studentId, studentName, studentClassId, selectedOfferingIds);
      if (res.success) {
        setSelectedOfferingIds([]);
        showFeedback(res.message, "success");
      } else {
        showFeedback(res.message, "error");
      }
    } catch (err: any) {
      showFeedback("Lỗi khi đăng ký: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Hủy môn đã đăng ký
  const handleCancelEnrollment = async (enrollmentId: string, subjectName: string) => {
    if (!isPeriodOpen) {
      showFeedback("Đợt đăng ký đã đóng. Không thể hủy học phần!", "error");
      return;
    }

    if (window.confirm(`Xác nhận hủy đăng ký học phần "${subjectName}"?`)) {
      try {
        setActionLoading(true);
        await cancelCreditEnrollment(enrollmentId);
        showFeedback(`Đã hủy học phần "${subjectName}" thành công!`);
      } catch (err: any) {
        showFeedback("Lỗi khi hủy môn: " + err.message, "error");
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Tải phiếu đăng ký cá nhân
  const handleDownloadSlip = async () => {
    if (!sObj && !studentId) {
      showFeedback("Không có đủ thông tin sinh viên để tạo phiếu!", "error");
      return;
    }
    const semName = allSemesters.find(s => s.id === selectedSemesterId)?.name || selectedSemesterId;
    try {
      setActionLoading(true);
      await exportStudentEnrollmentSlip({
        student: sObj || ({
          id: studentId,
          name: studentName,
          classId: studentClassId,
          email: currentUser?.email || "",
          facultyId: ""
        } as Student),
        semesterName: semName,
        enrollments: myEnrollments,
        maxCredits,
        minCredits
      });
      showFeedback("Đã xuất phiếu đăng ký tín chỉ Excel (Times New Roman) thành công!");
    } catch (err: any) {
      showFeedback("Lỗi khi tạo phiếu: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Lọc môn học theo tìm kiếm
  const filteredOfferings = useMemo(() => {
    if (!searchQuery.trim()) return availableOfferings;
    const q = searchQuery.toLowerCase().trim();
    return availableOfferings.filter(o => 
      o.subjectCode.toLowerCase().includes(q) || 
      o.subjectName.toLowerCase().includes(q) ||
      o.teacherName.toLowerCase().includes(q)
    );
  }, [availableOfferings, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-3 duration-200 border ${
          feedback.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
            : "bg-rose-50 text-rose-900 border-rose-200"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Header Sinh Viên */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Cổng Đăng Ký Học Phần Tín Chỉ
          </div>
          <h2 className="text-xl font-bold text-slate-900">Đăng Ký Học Phần Theo Tín Chỉ</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Sinh viên: <strong className="text-slate-800 font-semibold">{studentName}</strong> • MSSV: <strong className="font-mono text-indigo-600">{studentId}</strong> • Lớp: <strong className="text-slate-800">{studentClassId}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Học kỳ:</label>
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            {allSemesters.map(sem => {
              const semPeriod = registrationPeriods.find(p => p.semesterId === sem.id);
              const isOpen = semPeriod?.status === "OPEN";
              return (
                <option key={sem.id} value={sem.id}>
                  {isOpen ? "🟢 " : ""}{sem.name}{sem.isCustom ? " (Tùy chỉnh)" : ""}{isOpen ? " [ĐANG MỞ]" : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Banner Gợi ý học kỳ đang mở nếu học kỳ hiện tại đang đóng */}
      {!isPeriodOpen && otherOpenPeriods.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950">Phát hiện đợt đăng ký tín chỉ đang mở!</h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                Đợt: <strong className="font-semibold">{otherOpenPeriods[0].name}</strong> ({allSemesters.find(s => s.id === otherOpenPeriods[0].semesterId)?.name}) đang tiếp nhận đăng ký.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSemesterId(otherOpenPeriods[0].semesterId)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 self-end sm:self-auto min-h-[44px]"
          >
            <span>Chuyển sang đợt này ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner Trạng Thái Đợt Đăng Ký Hiện Tại */}
      {isPeriodOpen ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-base">{currentPeriod?.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    ĐANG MỞ ĐĂNG KÝ
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Thời hạn đóng cổng: <strong className="text-slate-800 font-medium">{currentPeriod?.endDate}</strong> • Quy định: <strong className="text-indigo-600 font-semibold">{minCredits} - {maxCredits} TC</strong> / sinh viên
                </p>
                {currentPeriod?.instructions && (
                  <p className="text-xs text-slate-500 italic mt-1 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-100 inline-block">
                    💡 Hướng dẫn: {currentPeriod.instructions}
                  </p>
                )}
              </div>
            </div>

            {myEnrollments.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSlip}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto min-h-[44px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                In Phiếu Đăng Ký (Excel)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {currentPeriod ? currentPeriod.name : "Cổng Đăng Ký Học Phần Tín Chỉ Đang Tạm Khóa"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                  {currentPeriod?.status === "UPCOMING" ? "SẮP MỞ" : "ĐÃ ĐÓNG SỔ"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {currentPeriod ? (
                  <>
                    Cổng đăng ký mở từ <strong>{currentPeriod.startDate}</strong> đến <strong>{currentPeriod.endDate}</strong>. Hiện tại hệ thống đang tạm khóa đăng ký mới hoặc hủy môn.
                  </>
                ) : (
                  "Phòng Đào tạo chưa mở đợt đăng ký cho học kỳ này. Bạn có thể chọn học kỳ khác ở góc trên hoặc xem lại danh sách môn đã đăng ký."
                )}
              </p>
            </div>

            {myEnrollments.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadSlip}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Xem Phiếu Đã ĐK
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2-TAB NAVIGATION: ĐẶT MỤC ĐĂNG KÝ HỌC PHẦN LÊN ĐẦU TIÊN TRỰC QUAN */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("REGISTER")}
          className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
            activeTab === "REGISTER"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>📝 Đăng Ký Môn Mới</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono">
            {availableOfferings.length} môn mở
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("MY_COURSES")}
          className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${
            activeTab === "MY_COURSES"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>📋 Học Phần Đã Đăng Ký</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
            myEnrollments.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}>
            {myEnrollments.length} môn ({enrolledCredits} TC)
          </span>
        </button>
      </div>

      {/* TAB 1: DANH MỤC ĐĂNG KÝ HỌC PHẦN MỚI */}
      {activeTab === "REGISTER" && (
        <div className="space-y-6">
          {/* Thước Đo Tiến Độ Tín Chỉ (Realtime Credit Progress) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tiến Độ Tích Lũy Tín Chỉ Học Kỳ</h3>
                <p className="text-xs text-slate-500">
                  Số tín chỉ tối thiểu: <strong className="text-slate-700 font-semibold">{minCredits} TC</strong> • Hạn mức tối đa: <strong className="text-slate-700 font-semibold">{maxCredits} TC</strong>
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 font-medium">Tổng số:</span>
                <span className={`text-2xl font-black font-mono ${
                  projectedTotalCredits >= minCredits && projectedTotalCredits <= maxCredits
                    ? "text-emerald-600"
                    : projectedTotalCredits > maxCredits
                    ? "text-rose-600"
                    : "text-amber-600"
                }`}>
                  {projectedTotalCredits}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ {maxCredits} TC</span>
              </div>
            </div>

            {/* Thanh bar */}
            <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex relative">
              <div 
                style={{ width: `${Math.min(100, (enrolledCredits / maxCredits) * 100)}%` }}
                className="bg-emerald-500 h-full transition-all duration-300 relative"
                title={`Đã đăng ký chính thức: ${enrolledCredits} TC`}
              />
              {selectedCredits > 0 && (
                <div 
                  style={{ width: `${Math.min(100 - (enrolledCredits / maxCredits) * 100, (selectedCredits / maxCredits) * 100)}%` }}
                  className="bg-indigo-400 h-full transition-all duration-300 relative animate-pulse"
                  title={`Đang chọn thêm: ${selectedCredits} TC`}
                />
              )}
            </div>

            {/* Chú giải và Cảnh báo */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Đã chính thức: <strong className="font-mono text-slate-900">{enrolledCredits} TC</strong>
                </span>
                {selectedCredits > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-indigo-700 font-medium">
                    <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
                    Đang chọn: <strong className="font-mono text-indigo-900">+{selectedCredits} TC</strong>
                  </span>
                )}
              </div>

              <div>
                {projectedTotalCredits < minCredits && (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    Cần thêm ít nhất {minCredits - projectedTotalCredits} TC để đạt mức tối thiểu.
                  </span>
                )}
                {projectedTotalCredits >= minCredits && projectedTotalCredits <= maxCredits && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Đạt chuẩn quy định ({projectedTotalCredits} TC).
                  </span>
                )}
                {projectedTotalCredits > maxCredits && (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    Vượt quá {projectedTotalCredits - maxCredits} TC! Vui lòng bỏ bớt môn.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Tìm kiếm & Thông tin */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Danh Mục Học Phần Mở Đăng Ký</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm nút <strong className="text-indigo-600 font-semibold">[+ Đăng Ký Ngay]</strong> trên từng môn để ghi danh trực tiếp hoặc tích chọn nhiều môn.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã hoặc tên học phần..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {selectedOfferingIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSubmitBatchEnrollment}
                    disabled={actionLoading || projectedTotalCredits > maxCredits}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 min-h-[40px] flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Đăng Ký {selectedOfferingIds.length} Môn Đã Chọn (+{selectedCredits} TC)
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách học phần */}
            {filteredOfferings.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Không có học phần nào phù hợp với lớp của bạn hoặc từ khóa tìm kiếm.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOfferings.map(off => {
                  const isAlreadyEnrolled = myEnrolledOfferingIds.has(off.id);
                  const isSelected = selectedOfferingIds.includes(off.id);

                  return (
                    <div 
                      key={off.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isAlreadyEnrolled
                          ? "bg-slate-50/80 border-slate-200/60 opacity-90"
                          : isSelected
                          ? "bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/20"
                          : "bg-white border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      {/* Course Info */}
                      <div className="flex items-start gap-3.5 flex-1">
                        {/* Checkbox (chỉ hiện khi chưa đăng ký và cổng mở) */}
                        {isPeriodOpen && !isAlreadyEnrolled && (
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(off.id)}
                              className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              title="Tích chọn môn này để đăng ký cùng lúc"
                            />
                          </div>
                        )}

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                              {off.subjectCode}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">{off.subjectName}</h4>
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                              {off.credits} Tín Chỉ
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                            <span>Giảng viên: <strong className="text-slate-700 font-medium">{off.teacherName}</strong></span>
                            {off.targetClasses && off.targetClasses.length > 0 && (
                              <span>Lớp áp dụng: <strong className="text-slate-700 font-medium">{off.targetClasses.join(", ")}</strong></span>
                            )}
                            {off.notes && (
                              <span className="text-indigo-600 font-medium">({off.notes})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button: NÚT ĐĂNG KÝ TRỰC QUAN RÕ RÀNG */}
                      <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                        {isAlreadyEnrolled ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold min-h-[44px]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Đã Đăng Ký
                          </span>
                        ) : isPeriodOpen ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(off.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[44px] ${
                                isSelected
                                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {isSelected ? "Bỏ chọn" : "Chọn thêm"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickRegister(off)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 min-h-[44px]"
                            >
                              <Plus className="w-4 h-4" />
                              Đăng Ký Ngay
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic px-3 py-1.5 bg-slate-100 rounded-lg">
                            <Lock className="w-3.5 h-3.5" />
                            Cổng tạm đóng
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thanh Xác Nhận Nổi Bên Dưới khi có chọn môn qua Checkbox */}
          {isPeriodOpen && selectedOfferingIds.length > 0 && (
            <div className="sticky bottom-4 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>Đang chọn <span className="text-amber-400">{selectedOfferingIds.length}</span> học phần</span>
                  <span>•</span>
                  <span>+{selectedCredits} Tín Chỉ</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tổng dự kiến: <strong className="text-white font-mono">{projectedTotalCredits} TC</strong> (Quy định: {minCredits} - {maxCredits} TC)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOfferingIds([])}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer min-h-[40px]"
                >
                  Hủy chọn
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBatchEnrollment}
                  disabled={actionLoading || projectedTotalCredits > maxCredits}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer min-h-[40px] ${
                    projectedTotalCredits > maxCredits
                      ? "bg-slate-600 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 active:scale-95"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Xác Nhận Lưu Đăng Ký ({selectedOfferingIds.length} môn)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DANH SÁCH HỌC PHẦN ĐÃ ĐĂNG KÝ CHÍNH THỨC */}
      {activeTab === "MY_COURSES" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Học Phần Đã Đăng Ký Chính Thức</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các học phần đã được ghi nhận vào CSDL quản lý sinh viên của Phân hiệu.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                {enrolledCredits} Tín Chỉ / {myEnrollments.length} Môn
              </span>
              {myEnrollments.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer min-h-[36px]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  In Phiếu Excel
                </button>
              )}
            </div>
          </div>

          {myEnrollments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">Bạn chưa đăng ký học phần nào trong học kỳ này.</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hãy chuyển sang tab "Đăng Ký Môn Mới" để chọn các học phần mở cho lớp của bạn.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("REGISTER")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 min-h-[44px]"
              >
                <Zap className="w-4 h-4" />
                Đến Trang Đăng Ký Môn Ngay
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myEnrollments.map((en, idx) => (
                <div key={en.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-slate-400 text-xs pt-1 w-6">{idx + 1}.</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                          {en.subjectCode}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{en.subjectName}</h4>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                          {en.credits} TC
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Giảng viên: <strong className="text-slate-700">{en.teacherName}</strong> • Đăng ký lúc: {new Date(en.registeredAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>

                  {isPeriodOpen ? (
                    <button
                      type="button"
                      onClick={() => handleCancelEnrollment(en.id, en.subjectName)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors cursor-pointer self-end sm:self-center min-h-[44px] border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hủy môn này
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic self-end sm:self-center">
                      Cổng đã đóng (Không thể hủy)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
