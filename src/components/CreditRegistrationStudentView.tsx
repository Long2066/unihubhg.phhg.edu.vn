import React, { useState, useMemo } from "react";
import { useUniHub } from "../state";
import { CourseOffering, CreditEnrollment, SEMESTER_LIST, Student } from "../types";
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
  Printer
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
    enrollCreditCourses,
    cancelCreditEnrollment
  } = useUniHub();

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

  // Toggle chọn môn
  const handleToggleSelect = (offeringId: string) => {
    if (!isPeriodOpen) return;
    if (myEnrolledOfferingIds.has(offeringId)) return; // Môn đã đăng ký rồi

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

  // Gửi đăng ký lên Firestore
  const handleSubmitEnrollment = async () => {
    if (!isPeriodOpen) {
      showFeedback("Đợt đăng ký hiện đang đóng. Không thể gửi đăng ký!", "error");
      return;
    }
    if (selectedOfferingIds.length === 0) {
      showFeedback("Vui lòng chọn ít nhất 1 học phần để đăng ký!", "error");
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
    const semName = SEMESTER_LIST.find(s => s.id === selectedSemesterId)?.name || selectedSemesterId;
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
            className="text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {SEMESTER_LIST.map(sem => (
              <option key={sem.id} value={sem.id}>{sem.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Banner Trạng Thái Đợt Đăng Ký */}
      {isPeriodOpen ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
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
                onClick={handleDownloadSlip}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
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
                    Cổng đăng ký mở từ <strong>{currentPeriod.startDate}</strong> đến <strong>{currentPeriod.endDate}</strong>. Hiện tại hệ thống đang khóa cổng tiếp nhận đăng ký mới hoặc hủy môn.
                  </>
                ) : (
                  "Phòng Đào tạo chưa mở đợt đăng ký cho học kỳ này. Vui lòng quay lại sau hoặc liên hệ Phòng Đào tạo."
                )}
              </p>
            </div>

            {myEnrollments.length > 0 && (
              <button
                onClick={handleDownloadSlip}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Xem Phiếu Đã ĐK
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thước Đo Tiến Độ Tín Chỉ (Realtime Credit Progress) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Tiến Độ Tích Lũy Tín Chỉ Học Kỳ</h3>
            <p className="text-xs text-slate-500">
              Số tín chỉ tối thiểu yêu cầu: <strong className="text-slate-700 font-semibold">{minCredits} TC</strong> • Giới hạn tối đa: <strong className="text-slate-700 font-semibold">{maxCredits} TC</strong>
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
          {/* Đã đăng ký chính thức */}
          <div 
            style={{ width: `${Math.min(100, (enrolledCredits / maxCredits) * 100)}%` }}
            className="bg-emerald-500 h-full transition-all duration-300 relative"
            title={`Đã đăng ký chính thức: ${enrolledCredits} TC`}
          />
          {/* Đang chọn thêm */}
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
              Đã ghi nhận: <strong className="font-mono text-slate-900">{enrolledCredits} TC</strong>
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
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Cần đăng ký thêm ít nhất {minCredits - projectedTotalCredits} TC để đạt mức tối thiểu.
              </span>
            )}
            {projectedTotalCredits >= minCredits && projectedTotalCredits <= maxCredits && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Số lượng tín chỉ đạt chuẩn quy định ({projectedTotalCredits} TC).
              </span>
            )}
            {projectedTotalCredits > maxCredits && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Vượt quá giới hạn tối đa {projectedTotalCredits - maxCredits} TC! Vui lòng bỏ bớt môn.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DANH SÁCH HỌC PHẦN ĐÃ ĐĂNG KÝ CHÍNH THỨC */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Học Phần Đã Đăng Ký Chính Thức ({myEnrollments.length} môn)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Các học phần này đã được đồng bộ trực tiếp lên hệ thống quản lý của Phân hiệu.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
            {enrolledCredits} Tín Chỉ
          </span>
        </div>

        {myEnrollments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Bạn chưa đăng ký học phần nào trong học kỳ này.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myEnrollments.map((en, idx) => (
              <div key={en.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-slate-400 text-xs pt-0.5 w-6">{idx + 1}.</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-md">
                        {en.subjectCode}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{en.subjectName}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                        {en.credits} TC
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Giảng viên: <strong className="text-slate-700">{en.teacherName}</strong> • Đăng ký lúc: {new Date(en.registeredAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>

                {isPeriodOpen && (
                  <button
                    onClick={() => handleCancelEnrollment(en.id, en.subjectName)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hủy môn này
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DANH MỤC HỌC PHẦN MỞ ĐĂNG KÝ (Dành cho chọn môn) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Danh Mục Học Phần Mở Đăng Ký ({filteredOfferings.length} môn)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tích chọn học phần muốn đăng ký và bấm "Xác Nhận Đăng Ký" bên dưới.
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên môn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {filteredOfferings.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Không có học phần nào mở cho lớp của bạn hoặc phù hợp với từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOfferings.map(off => {
              const isAlreadyEnrolled = myEnrolledOfferingIds.has(off.id);
              const isSelected = selectedOfferingIds.includes(off.id);

              return (
                <div 
                  key={off.id}
                  onClick={() => {
                    if (!isAlreadyEnrolled && isPeriodOpen) handleToggleSelect(off.id);
                  }}
                  className={`p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isAlreadyEnrolled 
                      ? "bg-slate-50/75 opacity-75 cursor-default"
                      : isPeriodOpen
                      ? "hover:bg-indigo-50/40 cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  } ${isSelected ? "ring-2 ring-indigo-500 bg-indigo-50/60" : ""}`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        disabled={isAlreadyEnrolled || !isPeriodOpen}
                        checked={isAlreadyEnrolled || isSelected}
                        onChange={() => {}} // Controlled by container onClick
                        className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {off.subjectCode}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{off.subjectName}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {off.credits} Tín Chỉ
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Giảng viên: <strong className="text-slate-700">{off.teacherName}</strong></span>
                        {off.targetClasses && (
                          <span>Lớp: <strong className="text-slate-700">{off.targetClasses.join(", ")}</strong></span>
                        )}
                        {off.notes && (
                          <span className="text-indigo-600 font-medium">({off.notes})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge / Action Button */}
                  <div className="shrink-0 self-end sm:self-center">
                    {isAlreadyEnrolled ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Đã Đăng Ký
                      </span>
                    ) : isPeriodOpen ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(off.id);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {isSelected ? "Bỏ chọn" : "+ Chọn môn"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Cổng đang khóa</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Thanh Xác Nhận Submit Nổi Bên Dưới */}
        {isPeriodOpen && selectedOfferingIds.length > 0 && (
          <div className="sticky bottom-4 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Đã chọn <span className="text-amber-400">{selectedOfferingIds.length}</span> học phần mới</span>
                <span>•</span>
                <span>+{selectedCredits} Tín Chỉ</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tổng dự kiến sau khi lưu: <strong className="text-white font-mono">{projectedTotalCredits} TC</strong> (Quy định: {minCredits} - {maxCredits} TC)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedOfferingIds([])}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Hủy chọn
              </button>
              <button
                onClick={handleSubmitEnrollment}
                disabled={actionLoading || projectedTotalCredits > maxCredits}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
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
    </div>
  );
};
