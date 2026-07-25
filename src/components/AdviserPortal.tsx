import React, { useState } from "react";
import { useUniHub } from "../state";
import { UserRole } from "../types";
import { 
  ShieldCheck, 
  UserPen, 
  Trash, 
  Check, 
  X, 
  AlertTriangle, 
  FileText, 
  CornerDownRight, 
  PlusCircle, 
  Award,
  BookOpen,
  Users,
  Eye,
  Send,
  Calendar,
  Layers,
  CheckCircle,
  MessageSquare,
  Download,
  Search,
  Megaphone,
  Filter
} from "lucide-react";

export const AdviserPortal: React.FC = () => {
  const { 
    currentUser, 
    results, 
    evidence, 
    classReviews, 
    submitAdviserAdjustment, 
    approveAdviserScores, 
    reviewEvidence,
    students,
    criteria,
    bulkApproveScores,
    adjustStudentScoreSpecific,
    feedbacks,
    sendFeedback,
    dailyAttendance,
    updateStudentProfile,
    activePortletTab,
    setActivePortletTab,
    selectedSemesterId
  } = useUniHub();

  const classId = currentUser?.targetId || "K20-CNTT";

  // Filter class reviews
  const classReviewInfo = classReviews.find(cr => cr.classId === classId);
  const myClassResults = results.filter(r => r.classId === classId && r.periodId === selectedSemesterId);
  const myClassmatesArr = students.filter(s => s.classId === classId);
  
  // Find evidence submissions of classmates
  const classStudentIds = myClassmatesArr.map(s => s.id);
  const classEvidence = evidence.filter(e => classStudentIds.includes(e.studentId));

  // Derived activeTab from activePortletTab
  const activeTab = activePortletTab === "ADVISER_MINHCHUNG" 
    ? "MINHCHUNG" 
    : activePortletTab === "ADVISER_NOTIFICATIONS" 
      ? "NOTIFICATIONS" 
      : "DUYETDEM";

  const [adComment, setAdComment] = useState("");

  // Grid check selection states
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Detailed modal inspect states
  const [selectedDetailStudentId, setSelectedDetailStudentId] = useState<string | null>(null);

  // Modal adjustments
  const [adjustCategory, setAdjustCategory] = useState("TC2 - Chấp hành Nội quy");
  const [adjustPoints, setAdjustPoints] = useState(-2);
  const [adjustReason, setAdjustReason] = useState("");

  // Feedback input
  const [fbComment, setFbComment] = useState("");

  // Search and status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [evalStatusFilter, setEvalStatusFilter] = useState("ALL");

  // Bulk score modal states
  const [showBulkScoreModal, setShowBulkScoreModal] = useState(false);
  const [bulkPoints, setBulkPoints] = useState(2);
  const [bulkCategory, setBulkCategory] = useState("TC3");
  const [bulkReason, setBulkReason] = useState("");

  const handleApproveAdviser = () => {
    approveAdviserScores(classId, adComment || "Đạt chuẩn nề nếp thi đua chung.");
    alert(`Giáo viên chủ nhiệm lớp ${classId} đã chính thức phê duyệt xếp hạng rèn luyện học kỳ và gửi nộp lên Cấp Khoa thẩm thư!`);
  };

  const handleAuditEvidence = (evId: string, status: "APPROVED" | "REJECTED") => {
    const comment = prompt("Nhập lời phê của thầy (Comment):", status === "APPROVED" ? "Giấy khen hợp lệ, duyệt điểm." : "Thiếu tài liệu gốc hoặc con dấu đối chiếu.");
    reviewEvidence(evId, status, comment || undefined);
    alert(`Đã duyệt kết quả minh chứng sinh viên.`);
  };

  // Bulk actions toggle
  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(x => x !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // Helper for unexcused absences
  const getUnexcusedAbsencesCount = (studentId: string) => {
    let count = 0;
    const classAttendances = dailyAttendance.filter(da => da.classId === classId);
    classAttendances.forEach(ca => {
      ca.absentees.forEach(abs => {
        if (abs.studentId === studentId && abs.type === "KHÔNG_PHÉP") {
          count++;
        }
      });
    });
    return count;
  };

  // Helper for warning detection
  const getEarlyWarnings = () => {
    const warnings: {
      studentId: string;
      studentName: string;
      gpa: number;
      unexcusedAbsences: number;
      violationPoints: number;
      reasons: string[];
      notes?: string;
    }[] = [];

    myClassmatesArr.forEach(student => {
      const res = myClassResults.find(r => r.studentId === student.id);
      const semData = student.academicDataByPeriod?.[selectedSemesterId] || {};
      const gpa = semData.gpa ?? student.gpa ?? 0;
      const unexcusedAbsences = getUnexcusedAbsencesCount(student.id);
      const violationPoints = res?.violationPoints || 0;

      const reasons: string[] = [];
      if (gpa < 2.0) reasons.push(`GPA thấp (${gpa.toFixed(2)})`);
      if (unexcusedAbsences > 3) reasons.push(`Vắng không phép nhiều (${unexcusedAbsences} buổi)`);
      if (res && violationPoints < 18) reasons.push(`Điểm nề nếp thấp (${violationPoints}đ)`);

      if (reasons.length > 0) {
        warnings.push({
          studentId: student.id,
          studentName: student.name,
          gpa,
          unexcusedAbsences,
          violationPoints,
          reasons,
          notes: student.notes
        });
      }
    });

    return warnings;
  };

  // Filter students
  const filteredResults = myClassResults.filter(res => {
    // Search query
    const matchesSearch = 
      res.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (evalStatusFilter === "ALL") return true;
    if (evalStatusFilter === "SELF_SUBMITTED") {
      return res.status !== "AUTO" && res.status !== "DRAFT";
    }
    if (evalStatusFilter === "SELF_PENDING") {
      return res.status === "AUTO" || res.status === "DRAFT";
    }
    if (evalStatusFilter === "APPROVED") {
      return res.status === "APPROVED_ADVISER" || res.status === "APPROVED_FINAL" || res.status === "APPROVED_FACULTY";
    }
    if (evalStatusFilter === "RE_EVALUATE") {
      const hasUnresolvedFeedback = feedbacks.some(f => f.studentId === res.studentId && !f.resolved);
      return hasUnresolvedFeedback;
    }
    return true;
  });

  const toggleSelectAll = () => {
    const filteredIds = filteredResults.map(r => r.studentId);
    const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds(selectedStudentIds.filter(id => !filteredIds.includes(id)));
    } else {
      const newSelections = [...selectedStudentIds];
      filteredIds.forEach(id => {
        if (!newSelections.includes(id)) {
          newSelections.push(id);
        }
      });
      setSelectedStudentIds(newSelections);
    }
  };

  const handleBulkApprove = () => {
    if (selectedStudentIds.length === 0) return;
    bulkApproveScores(classId, selectedStudentIds, UserRole.ADVISER);
    alert(`Đã ký duyệt điểm rèn luyện đồng loạt cho ${selectedStudentIds.length} sinh viên lớp ${classId}`);
    setSelectedStudentIds([]);
  };

  const handleApplyBulkScores = () => {
    if (!bulkReason.trim()) {
      alert("Hãy nhập lý do cộng điểm tập thể.");
      return;
    }
    selectedStudentIds.forEach(sid => {
      adjustStudentScoreSpecific(sid, bulkCategory, bulkPoints, bulkReason);
    });
    alert(`Đã cộng/trừ điểm rèn luyện hàng loạt cho ${selectedStudentIds.length} sinh viên thành công!`);
    setShowBulkScoreModal(false);
    setSelectedStudentIds([]);
    setBulkReason("");
  };

  const exportScoresToCSV = () => {
    const headers = [
      "Mã SV",
      "Họ và tên",
      "GPA",
      "TC1 (Học tập)",
      "TC2 (Kỷ luật)",
      "TC3 (Phong trào)",
      "TC4 (Cộng đồng)",
      "TC5 (Sáng tạo)",
      "Tổng điểm",
      "Xếp loại",
      "Trạng thái"
    ];

    const rows = myClassResults.map(res => {
      const origStudent = myClassmatesArr.find(s => s.id === res.studentId);
      return [
        res.studentId,
        res.studentName,
        origStudent?.gpa?.toFixed(2) || "0.00",
        res.studyPoints,
        res.violationPoints,
        res.extracurricularPoints,
        res.communityPoints,
        res.achievementPoints,
        res.totalPoints,
        res.grade,
        res.status
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bang_diem_ren_luyen_${classId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Score adjustments inside modal
  const applyScoreOverride = () => {
    if (!selectedDetailStudentId) return;
    if (!adjustReason) {
      alert("Hãy nhập lý do điều chỉnh ngoại lệ cho sinh viên.");
      return;
    }

    adjustStudentScoreSpecific(
      selectedDetailStudentId,
      adjustCategory,
      adjustPoints,
      adjustReason
    );

    alert("Đã áp dụng bản ghi can thiệp rèn luyện của Giáo viên Chủ nhiệm.");
    setAdjustReason("");
  };

  const submitSuperiorFeedBack = () => {
    if (!fbComment) return;
    sendFeedback(
      UserRole.ADVISER,
      currentUser?.name || "Giáo viên chủ nhiệm",
      classId,
      fbComment,
      selectedDetailStudentId || undefined
    );
    setFbComment("");
    alert("Đã gửi thông báo điều chỉnh chỉ thị cấp lớp.");
  };

  const isApprovedByAdviser = !!classReviewInfo?.adviserApproved;

  const getRankColorLight = (points: number) => {
    if (points >= 90) return "bg-emerald-50 text-emerald-805 border-emerald-100";
    if (points >= 80) return "bg-blue-50 text-blue-805 border-blue-100";
    if (points >= 70) return "bg-purple-50 text-purple-855 border-purple-100";
    if (points >= 50) return "bg-amber-50 text-amber-855 border-amber-100";
    return "bg-rose-50 text-rose-855 border-rose-100";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold">Bản nháp tự động</span>;
      case "APPROVED_CLASS":
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">BCS Đã Duyệt</span>;
      case "APPROVED_ADVISER":
        return <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">GVCN Đã Duyệt</span>;
      case "APPROVED_FACULTY":
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-605 border border-amber-200 text-[10px] font-bold font-mono">Chờ Phân hiệu khóa</span>;
      case "APPROVED_FINAL":
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold">Điểm chính thức</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 border text-[10px]">{status}</span>;
    }
  };

  const renderProofPreview = (proofUrl: string) => {
    if (!proofUrl) return null;
    const isBase64 = proofUrl.startsWith("data:");
    const isBlob = proofUrl.startsWith("blob:");
    const isHttp = proofUrl.startsWith("http");

    if (isBase64 || isBlob || isHttp) {
      if (proofUrl.startsWith("data:application/pdf")) {
        return (
          <div 
            className="w-10 h-10 rounded border bg-rose-50 border-rose-200 flex flex-col items-center justify-center text-rose-600 shrink-0 cursor-pointer hover:bg-rose-100 transition-colors" 
            onClick={() => window.open(proofUrl, "_blank")}
            title="Mở PDF minh chứng"
          >
            <FileText size={14} />
            <span className="text-[6.5px] font-black uppercase tracking-tight mt-0.5">PDF</span>
          </div>
        );
      }
      return (
        <div 
          className="w-10 h-10 rounded border bg-slate-100 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group" 
          onClick={() => window.open(proofUrl, "_blank")}
          title="Mở ảnh minh chứng"
        >
          <img src={proofUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
        </div>
      );
    }
    
    // Fallback for mockup seed filenames
    const isPdf = proofUrl.toLowerCase().endsWith(".pdf");
    return (
      <div 
        className={`w-10 h-10 rounded border flex flex-col items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-102 ${
          isPdf 
            ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
            : "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100"
        }`} 
        onClick={() => window.open(proofUrl.startsWith("/") ? proofUrl : `/${proofUrl}`, "_blank")}
        title={`Xem tệp: ${proofUrl}`}
      >
        <FileText size={14} />
        <span className="text-[6.5px] font-black uppercase tracking-tight text-center truncate max-w-full px-1 mt-0.5">
          {isPdf ? "PDF" : "ẢNH"}
        </span>
      </div>
    );
  };

  const renderNestedEvidences = (categoryCode: string) => {
    const categoryEvidences = studentEvidences.filter(ev => ev.criteriaId.startsWith(categoryCode));
    if (categoryEvidences.length === 0) return null;
    
    return (
      <div className="mt-2 pl-3 border-l-2 border-rose-500 space-y-2 text-left">
        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Minh chứng đính kèm:</span>
        {categoryEvidences.map(ev => (
          <div key={ev.id} className="bg-slate-50 p-2 rounded-lg border border-slate-150 text-[11px] flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 text-left min-w-0">
              {renderProofPreview(ev.proofUrl)}
              <div className="min-w-0">
                <span className="font-bold text-slate-800 block leading-tight">{ev.activityName || ev.title}</span>
                {ev.description && <p className="text-[9.5px] text-slate-505 mt-0.5 leading-normal">{ev.description}</p>}
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                  Mục: {ev.criteriaId} | Yêu cầu: +{ev.pointsRequested}đ | Trạng thái: 
                  <span className={`ml-1 font-bold ${ev.status === "APPROVED" ? "text-emerald-600" : ev.status === "REJECTED" ? "text-rose-600" : "text-yellow-600"}`}>
                    {ev.status === "APPROVED" ? "Đã duyệt" : ev.status === "REJECTED" ? "Bị từ chối" : "Đang chờ"}
                  </span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <a 
                href={ev.proofUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-rose-600 hover:text-rose-700 hover:underline font-semibold text-[10px] whitespace-nowrap"
              >
                File gốc
              </a>
              {ev.status === "PENDING" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAuditEvidence(ev.id, "APPROVED")}
                    className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded cursor-pointer"
                    title="Duyệt"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    onClick={() => handleAuditEvidence(ev.id, "REJECTED")}
                    className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded cursor-pointer"
                    title="Từ chối"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const selectedResult = myClassResults.find(r => r.studentId === selectedDetailStudentId);
  const selectedStudentObj = myClassmatesArr.find(s => s.id === selectedDetailStudentId);
  const studentEvidences = classEvidence.filter(ev => ev.studentId === selectedDetailStudentId);
  const classAttendances = dailyAttendance.filter(da => da.classId === classId);
  const classFeedbacks = feedbacks.filter(f => f.toClassId === classId);

  // Filter feedbacks for the selected student to render the message thread
  const studentFeedbacks = feedbacks
    .filter(f => f.studentId === selectedDetailStudentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Count grades for the top Analytics summary card layout
  const gradeCounts = {
    "XUẤT SẮC": 0,
    "TỐT": 0,
    "KHÁ": 0,
    "TRUNG BÌNH": 0,
    "YẾU": 0,
    "KÉM": 0
  };
  myClassResults.forEach(r => {
    const g = (r.grade || "").toUpperCase();
    if (g in gradeCounts) {
      gradeCounts[g as keyof typeof gradeCounts]++;
    }
  });

  // Calculate Academic grades dynamic counts
  const academicCounts = {
    "XUẤT SẮC": 0,
    "GIỎI": 0,
    "KHÁ": 0,
    "TRUNG BÌNH": 0,
    "YẾU": 0,
    "KÉM": 0
  };
  myClassmatesArr.forEach(student => {
    let grade = (student.academicGrade || "").toUpperCase().trim();
    if (!grade && student.gpa !== undefined) {
      const gpa = student.gpa;
      if (gpa >= 3.6) grade = "XUẤT SẮC";
      else if (gpa >= 3.2) grade = "GIỎI";
      else if (gpa >= 2.5) grade = "KHÁ";
      else if (gpa >= 2.0) grade = "TRUNG BÌNH";
      else if (gpa >= 1.0) grade = "YẾU";
      else grade = "KÉM";
    }
    
    if (grade === "XUẤT SẮC") academicCounts["XUẤT SẮC"]++;
    else if (grade === "GIỎI") academicCounts["GIỎI"]++;
    else if (grade === "KHÁ") academicCounts["KHÁ"]++;
    else if (grade === "TRUNG BÌNH") academicCounts["TRUNG BÌNH"]++;
    else if (grade === "YẾU") academicCounts["YẾU"]++;
    else if (grade === "KÉM") academicCounts["KÉM"]++;
  });

  const warningsList = getEarlyWarnings();

  return (
    <div className="space-y-6" id="adviser-portal-container">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200 uppercase tracking-wider">
            GIÁO VIÊN CHỦ NHIỆM / CỐ VẤN HỌC TẬP
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Cổng Quản Lý Cố Vấn Lớp {classId}</h2>
          <p className="text-xs text-slate-505 mt-1 italic">
            Người ký duyệt điểm, rà soát văn bản minh chứng ngoại khóa, giải quyết khiếu nại chất lượng rèn luyện sinh viên, ban hành sửa đổi thi đua.
          </p>
        </div>

        {isApprovedByAdviser ? (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm shrink-0">
            <ShieldCheck size={15} />
            <span>Đã Phê Duyệt Toàn Lớp</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 w-full sm:w-auto">
            <input 
              type="text"
              placeholder="Ghi chú thẩm duyệt thi đua..."
              value={adComment}
              onChange={(e) => setAdComment(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/10 text-slate-800 bg-white"
            />
            <button 
              onClick={handleApproveAdviser}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:cursor-pointer shrink-0"
            >
              <ShieldCheck size={14} />
              <span>Phê Duyệt & Chuyển Khoa</span>
            </button>
          </div>
        )}
      </div>

      {/* Viewport content - Full Width layout */}
      <div className="w-full bg-white p-6 rounded-xl border border-slate-150 shadow-sm min-h-[460px] flex flex-col justify-between">
        
        {/* TAB 1: Score Sheet and Checker Table */}
        {activeTab === "DUYETDEM" && (
          <div className="space-y-4">
            
            {/* Analytics Dashboard - Học tập & Rèn luyện song song */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Cột 1: Phân bố Rèn luyện */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-205 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs uppercase tracking-wider border-b pb-2">
                  <Award size={15} className="text-rose-600" />
                  <span>Phân bố Kết quả Rèn luyện</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Xuất sắc", count: gradeCounts["XUẤT SẮC"], color: "from-emerald-500 to-teal-600" },
                    { label: "Tốt", count: gradeCounts["TỐT"], color: "from-blue-500 to-indigo-600" },
                    { label: "Khá", count: gradeCounts["KHÁ"], color: "from-purple-500 to-deeppurple-600" },
                    { label: "Trung bình", count: gradeCounts["TRUNG BÌNH"], color: "from-amber-500 to-orange-600" },
                    { label: "Yếu", count: gradeCounts["YỀU"], color: "from-rose-500 to-pink-600" },
                    { label: "Kém", count: gradeCounts["KÉM"], color: "from-slate-500 to-slate-700" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-150 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
                      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color}`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">{item.label}</span>
                      <div className="flex items-baseline gap-1 mt-1.5 pl-1">
                        <span className="text-lg font-black text-slate-800 leading-none">{item.count}</span>
                        <span className="text-[8px] text-slate-400 font-semibold">SV</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden mx-1">
                        <div 
                          className={`h-full bg-gradient-to-r ${item.color}`} 
                          style={{ width: `${myClassResults.length > 0 ? (item.count / myClassResults.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cột 2: Phân bố Học tập */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-205 space-y-4">
                <div className="flex items-center gap-2 text-indigo-800 font-extrabold text-xs uppercase tracking-wider border-b pb-2">
                  <BookOpen size={15} className="text-indigo-600" />
                  <span>Phân bố Kết quả Học tập</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Xuất sắc", count: academicCounts["XUẤT SẮC"], color: "from-emerald-500 to-teal-600" },
                    { label: "Giỏi", count: academicCounts["GIỎI"], color: "from-blue-500 to-indigo-600" },
                    { label: "Khá", count: academicCounts["KHÁ"], color: "from-purple-500 to-deeppurple-600" },
                    { label: "Trung bình", count: academicCounts["TRUNG BÌNH"], color: "from-amber-500 to-orange-600" },
                    { label: "Yếu", count: academicCounts["YẾU"], color: "from-rose-500 to-pink-600" },
                    { label: "Kém", count: academicCounts["KÉM"], color: "from-slate-500 to-slate-700" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-150 shadow-2xs flex flex-col justify-between relative overflow-hidden group hover:shadow-xs transition-all">
                      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color}`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">{item.label}</span>
                      <div className="flex items-baseline gap-1 mt-1.5 pl-1">
                        <span className="text-lg font-black text-slate-800 leading-none">{item.count}</span>
                        <span className="text-[8px] text-slate-400 font-semibold">SV</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden mx-1">
                        <div 
                          className={`h-full bg-gradient-to-r ${item.color}`} 
                          style={{ width: `${myClassmatesArr.length > 0 ? (item.count / myClassmatesArr.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Early Warning Panel */}
            {warningsList.length > 0 && (
              <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-5 mb-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm border-b border-rose-200/60 pb-2">
                  <AlertTriangle className="text-rose-600 animate-pulse" size={18} />
                  <span>Cảnh báo học vụ & Nề nếp học kỳ ({warningsList.length} trường hợp)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {warningsList.map(warn => (
                    <div key={warn.studentId} className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between gap-3 text-xs">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900">{warn.studentName}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">{warn.studentId}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {warn.reasons.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px] border border-rose-100 uppercase tracking-tight">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <label className="text-[9px] font-bold text-slate-450 uppercase block">Nhật ký can thiệp của GVCN</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            defaultValue={warn.notes || ""}
                            placeholder="Nhập ghi chú can thiệp (ví dụ: Gọi điện gia đình...)"
                            id={`notes-input-${warn.studentId}`}
                            className="flex-1 text-[11px] p-2 border border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:bg-white focus:outline-rose-500"
                          />
                          <button
                            onClick={() => {
                              const el = document.getElementById(`notes-input-${warn.studentId}`) as HTMLInputElement;
                              if (el) {
                                const val = el.value.trim();
                                const sObj = myClassmatesArr.find(s => s.id === warn.studentId);
                                if (sObj) {
                                  updateStudentProfile(warn.studentId, sObj.name, sObj.avatar || "", undefined, { notes: val });
                                  alert(`Đã cập nhật nhật ký can thiệp của sinh viên ${sObj.name}`);
                                }
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer shrink-0 transition-colors"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-205 mb-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Tìm tên hoặc mã số sinh viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 text-slate-800"
                  />
                </div>

                <select
                  value={evalStatusFilter}
                  onChange={(e) => setEvalStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-250 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 text-slate-800 font-bold"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="SELF_SUBMITTED">Đã nộp tự đánh giá</option>
                  <option value="SELF_PENDING">Chưa tự đánh giá</option>
                  <option value="APPROVED">Đã duyệt xong (GVCN)</option>
                  <option value="RE_EVALUATE">Cần rà soát (Có phản hồi)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={exportScoresToCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:cursor-pointer"
                >
                  <Download size={13} />
                  <span>Xuất Excel bảng điểm lớp</span>
                </button>
              </div>
            </div>

            {/* Selection Banner */}
            {selectedStudentIds.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-fade-in mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span className="text-xs font-bold text-rose-900 font-mono">Đã chọn {selectedStudentIds.length} sinh viên</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkApprove}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1"
                  >
                    <ShieldCheck size={13} />
                    <span>Ký duyệt loạt GVCN</span>
                  </button>

                  <button
                    onClick={() => setShowBulkScoreModal(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1"
                  >
                    <PlusCircle size={13} />
                    <span>Cộng điểm tập thể</span>
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="border border-slate-205 rounded-xl overflow-x-auto text-xs">
              <table className="w-full text-left text-slate-650">
                <thead className="bg-slate-50 uppercase tracking-wider text-[9px] text-slate-450 border-b">
                  <tr>
                    <th className="p-3 text-center w-[50px]">
                      <input 
                        type="checkbox"
                        checked={filteredResults.length > 0 && filteredResults.every(r => selectedStudentIds.includes(r.studentId))}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Mã số SV</th>
                    <th className="p-3">Sinh viên</th>
                    <th className="p-3 text-center">GPA</th>
                    <th className="p-3 text-center">Số điểm rèn luyện</th>
                    <th className="p-3 text-center">Phân loại</th>
                    <th className="p-3 text-center">Duyệt cấp</th>
                    <th className="p-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                        Không tìm thấy sinh viên nào khớp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map(res => {
                      const origStudent = myClassmatesArr.find(s => s.id === res.studentId);
                      const isSelected = selectedStudentIds.includes(res.studentId);

                      return (
                        <tr key={res.studentId} className={`hover:bg-slate-50/50 ${isSelected ? 'bg-rose-50/20' : ''}`}>
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(res.studentId)}
                              className="rounded cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-mono text-slate-550 font-semibold">{res.studentId}</td>
                          <td className="p-3 font-extrabold text-slate-900">{res.studentName}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{origStudent?.academicDataByPeriod?.[selectedSemesterId]?.gpa?.toFixed(2) || origStudent?.gpa?.toFixed(2) || "Chưa nhập"}</td>
                          <td className="p-3 text-center font-black text-slate-900 text-sm font-mono">{res.totalPoints}đ</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wide border ${getRankColorLight(res.totalPoints)}`}>
                              {res.grade}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(res.status)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedDetailStudentId(res.studentId)}
                              className="p-1 px-3 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-extrabold text-slate-705 flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                            >
                              <Eye size={12} />
                              <span>Sửa chi tiết / Minh chứng</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Class Evidence Verification */}
        {activeTab === "MINHCHUNG" && (
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase mb-1">Kiểm toán Văn kiện & Bằng chứng rèn luyện</h3>
              <p className="text-[10px] text-slate-450">Các tệp ảnh chụp, văn bản, chứng nhận thi đấu khen thưởng sinh viên tải lên phục vụ châm điều kiện.</p>
            </div>

            {classEvidence.length === 0 ? (
              <p className="text-xs italic text-slate-400 py-6 text-center">Chưa có thành viên nào nộp hồ sơ bằng chứng trong học kỳ này.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classEvidence.map(ev => {
                  const resInfo = myClassResults.find(r => r.studentId === ev.studentId);
                  
                  return (
                    <div key={ev.id} className="bg-slate-50/50 p-4 border rounded-xl flex flex-col justify-between space-y-3.5 text-xs text-slate-700">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-900 uppercase truncate max-w-[170px]">{ev.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${ev.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : ev.status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-yellow-50 text-yellow-750 border border-yellow-250 animate-pulse"}`}>
                            {ev.status === "APPROVED" ? "Đã duyệt" : ev.status === "REJECTED" ? "Bị từ chối" : "Đang chờ"}
                          </span>
                        </div>
                        
                        <p className="text-[11px] text-slate-550 italic mt-1">{ev.description}</p>
                        <div className="text-[10px] font-mono text-slate-400 mt-2">
                          Mã SV nộp: {ev.studentId} | Tên: {resInfo?.studentName}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-150 text-[11px]">
                        <span className="font-mono text-[9px] text-indigo-700">Lĩnh vực: {ev.criteriaCategory}</span>
                        
                        <div className="flex items-center gap-2">
                          <a 
                            href={ev.proofUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-slate-505 font-bold hover:underline"
                          >
                            Tệp gốc.pdf
                          </a>
                          
                          {ev.status === "PENDING" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAuditEvidence(ev.id, "APPROVED")}
                                className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded cursor-pointer"
                                title="Duyệt minh chứng"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => handleAuditEvidence(ev.id, "REJECTED")}
                                className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded cursor-pointer"
                                title="Từ chối minh chứng"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Roll Call & Notifications */}
        {activeTab === "NOTIFICATIONS" && (
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase mb-1">Dữ liệu Chuyên cần Sĩ số & Trao đổi Lớp</h3>
              <p className="text-[10px] text-slate-400">Các ghi chép điểm danh chuyên cần của Ban cán sự lớp hằng ngày để rà soát trường hợp vắng không phép.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Roll Call */}
              <div className="bg-slate-50/50 p-4 border rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Calendar size={13} className="text-indigo-600" />
                  Sổ chấm chuyên cần hằng ngày ({classAttendances.length})
                </span>
                {classAttendances.length === 0 ? (
                  <p className="text-[10px] text-slate-450 italic font-medium pt-2 text-center">Ban cán sự lớp chưa lập báo cáo chuyên cần ngày học nào.</p>
                ) : (
                  <div className="space-y-2 divide-y max-h-[250px] overflow-y-auto">
                    {classAttendances.map(ca => (
                      <div key={ca.id} className="pt-2 first:pt-0 text-[11px] font-medium text-slate-700">
                        <div className="flex justify-between font-mono font-bold text-slate-800">
                          <span>{ca.date}</span>
                          <span className="text-emerald-700">Hiện diện: {ca.presentCount}/{ca.totalStudents}</span>
                        </div>
                        {ca.absentees.length > 0 && (
                          <div className="mt-1 text-[10px] bg-white p-1.5 rounded border border-slate-100 font-normal">
                            {ca.absentees.map((abs, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{abs.studentName}</span>
                                <span className={abs.type === "KHÔNG_PHÉP" ? "text-red-650 font-bold" : "text-amber-600"}>{abs.type}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedbacks board */}
              <div className="bg-slate-50/50 p-4 border rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <MessageSquare size={13} className="text-indigo-600" />
                  Giao thiệp Chỉ thị phản hồi của bạn ({classFeedbacks.length})
                </span>
                
                {classFeedbacks.length === 0 ? (
                  <p className="text-[10px] text-slate-450 italic pt-2 text-center">Chưa có bản ghi trao đổi phản hồi nào.</p>
                ) : (
                  <div className="space-y-2 divide-y max-h-[250px] overflow-y-auto">
                    {classFeedbacks.map(f => (
                      <div key={f.id} className="pt-2 first:pt-0 text-[11px] space-y-1">
                        <div className="flex justify-between font-bold text-slate-650">
                          <span>{f.fromName} ({f.fromRole})</span>
                          <span className="font-mono text-[9px] text-slate-400">{f.createdAt}</span>
                        </div>
                        <p className="text-slate-800 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">{f.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        <div className="bg-slate-50 p-3 shadow-2xs border-t rounded-b-xl text-center text-[10px] text-slate-400 font-mono mt-4">
          Đồng bộ dữ liệu Phòng đào tạo & Chi bộ. Cố vấn học tập có trách nhiệm thực hiện thẩm tra kỹ lưỡng các điều chỉnh tăng/giảm thi đua đặc biệt của sinh viên lớp mình phụ trách.
        </div>

      </div>

      {/* MODAL: CORE SPECIFIC VIEW & OVERRIDE */}
      {selectedDetailStudentId && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[90vh] max-h-[90dvh] overflow-y-auto">
            
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase font-mono">Cổng hiệu chuẩn & Kiểm duyệt minh chứng của Giáo viên</h3>
                <p className="text-[10px] text-slate-505 mt-1 font-semibold">SV: {selectedResult.studentName} | Mã SV: {selectedResult.studentId} | Điểm hiện thời: {selectedResult.totalPoints}đ</p>
              </div>
              <button 
                onClick={() => setSelectedDetailStudentId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-lg cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left detail grid */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 5 categories */}
                <div className="bg-slate-50 p-4 rounded-xl border space-y-3 text-left">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Thang điểm rèn luyện 5 tiêu chuẩn & Minh chứng</span>
                  <div className="space-y-3 text-xs">
                    
                    {/* Category TC1 */}
                    <div className="bg-white p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">TC1 - Năng lực học tập học vụ</span>
                        <strong className="font-mono text-slate-900">{selectedResult.studyPoints}đ / 20đ</strong>
                      </div>
                      {renderNestedEvidences("TC1")}
                    </div>

                    {/* Category TC2 */}
                    <div className="bg-white p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">TC2 - Ý thức kỷ luật nề nếp</span>
                        <strong className="font-mono text-slate-900">{selectedResult.violationPoints}đ / 25đ</strong>
                      </div>
                      {renderNestedEvidences("TC2")}
                    </div>

                    {/* Category TC3 */}
                    <div className="bg-white p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">TC3 - Phong trào, hoạt động hội nhóm</span>
                        <strong className="font-mono text-slate-900">{selectedResult.extracurricularPoints}đ / 30đ</strong>
                      </div>
                      {renderNestedEvidences("TC3")}
                    </div>

                    {/* Category TC4 */}
                    <div className="bg-white p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">TC4 - Ý thức trách nhiệm cộng đồng</span>
                        <strong className="font-mono text-slate-900">{selectedResult.communityPoints}đ / 15đ</strong>
                      </div>
                      {renderNestedEvidences("TC4")}
                    </div>

                    {/* Category TC5 */}
                    <div className="bg-white p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">TC5 - Gương sáng sáng tạo đặc thù</span>
                        <strong className="font-mono text-slate-900">{selectedResult.achievementPoints}đ / 10đ</strong>
                      </div>
                      {renderNestedEvidences("TC5")}
                    </div>

                  </div>
                </div>

                {/* TIMELINE OF COMPUTED LOGS */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-black text-slate-600 uppercase">Ghi nhận tiến trình xử lý tự động & thủ công</h4>
                  <div className="p-2 border rounded-xl bg-white max-h-[150px] overflow-y-auto divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
                    {selectedResult.logs.length === 0 ? (
                      <p className="p-3 text-slate-400 italic text-center text-[10px]">Chưa ghi nhận xử lý rèn luyện liên đới.</p>
                    ) : (
                      selectedResult.logs.map((lg, index) => (
                        <div key={index} className="py-2.5 flex justify-between items-start">
                          <div>
                            <span className="font-black text-slate-800">{lg.reason}</span>
                            <p className="text-[8px] text-slate-400 mt-0.5 font-mono">Mã mục: {lg.criteriaId} | Tác nhân: {lg.source} | Ngày: {lg.timestamp}</p>
                          </div>
                          <span className={`px-1.5 rounded font-black font-mono ${lg.points >= 0 ? 'bg-emerald-50 text-emerald-850' : 'bg-rose-50 text-rose-850'}`}>
                            {lg.points >= 0 ? `+${lg.points}` : lg.points}đ
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right detail overrides */}
              <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border flex flex-col justify-between space-y-4">
                
                <div className="space-y-3.5 text-left text-xs">
                  <div className="border-b pb-1.5">
                    <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                      <UserPen size={13} className="text-rose-600" />
                      Nhập Biên Bản Can Thiệp Rèn Luyện (GVCN)
                    </span>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Mục tiêu chuẩn điều chế</label>
                    <select
                      value={adjustCategory}
                      onChange={(e) => setAdjustCategory(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg bg-white"
                    >
                      <option value="TC1">TC1 - Điểm học thuật GPA</option>
                      <option value="TC2">TC2 - Nội qui, Chuyên cần sĩ số</option>
                      <option value="TC3">TC3 - Tham gia CLB / Phong trào</option>
                      <option value="TC4">TC4 - Hoạt động tự quản, Công dân</option>
                      <option value="TC5">TC5 - Giấy khen thi đua đặc biệt</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-455 block mb-1">ĐIỂM SỐ CỘNG / TRỪ</label>
                      <select
                        value={adjustPoints}
                        onChange={(e) => setAdjustPoints(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white font-mono font-bold"
                      >
                        <option value="-10">-10đ Vi phạm đặc thù nặng</option>
                        <option value="-5">-5đ Khấu trừ nề nếp thi đua</option>
                        <option value="-2">-2đ Vắng họp / Chuyên đề</option>
                        <option value="2">+2đ Thẩm tra nề nếp hợp chuẩn</option>
                        <option value="5">+5đ Chiến sĩ thi đua xuất sắc</option>
                        <option value="10">+10đ Phong trào gương sáng cấp trường</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-455 block mb-1">QUẦY PHÊ DUYỆT</label>
                      <button
                        type="button"
                        onClick={() => {
                          bulkApproveScores(classId, [selectedDetailStudentId!], UserRole.ADVISER);
                          alert("Đã ký phê duyệt rèn luyện giáo viên cho sinh viên.");
                        }}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-center text-xs hover:cursor-pointer shadow-sm transition-colors"
                      >
                        Ký Duyệt GVCN
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-455 block mb-1">LÝ DO LẬP PHIẾU ĐIỀU CHỈNH</label>
                    <input 
                      type="text"
                      placeholder="Ghi rõ: Đạt giải chiến sĩ thi đua xanh,..."
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-205 rounded-lg bg-white focus:outline-rose-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={applyScoreOverride}
                    className="w-full py-2.5 bg-rose-650 hover:bg-rose-700 text-white text-xs font-black rounded-lg transition-all shadow hover:cursor-pointer flex items-center justify-center gap-1"
                  >
                    <PlusCircle size={13} />
                    <span>Áp Dụng Bản Ghi Sửa Điểm</span>
                  </button>
                </div>

                {/* Feedback thread loop */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block text-left">Lịch sử hội thoại phản hồi</span>
                  <div className="max-h-[160px] overflow-y-auto p-2 bg-white rounded-lg border border-slate-200 space-y-2 text-[11px] text-left">
                    {studentFeedbacks.length === 0 ? (
                      <p className="text-slate-400 italic text-center py-2">Chưa có hội thoại trao đổi nào cho sinh viên này.</p>
                    ) : (
                      studentFeedbacks.map(f => {
                        const isMe = f.fromRole === UserRole.ADVISER;
                        return (
                          <div key={f.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-0.5">
                              <span className="font-bold">{f.fromName} ({f.fromRole})</span>
                              <span>•</span>
                              <span>{f.createdAt}</span>
                            </div>
                            <div className={`p-2 rounded-lg max-w-[90%] leading-relaxed ${isMe ? "bg-rose-50 text-rose-900 border border-rose-100" : "bg-slate-100 text-slate-800"}`}>
                              {f.comment}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Feedback line back descending to Class Monitor */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block text-left">Chỉ thị sửa đổi phản hồi xuống lớp trưởng</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Chỉ đạo: Yêu cầu BCS đối soát lại việc vắng học..."
                      value={fbComment}
                      onChange={(e) => setFbComment(e.target.value)}
                      className="flex-1 text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-rose-500"
                    />
                    <button
                      onClick={submitSuperiorFeedBack}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                    >
                      Phản Hồi
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK SCORE ADJUSTMENT */}
      {showBulkScoreModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-205 shadow-2xl max-w-md w-full p-6 text-left space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-slate-805 uppercase flex items-center gap-1.5">
                <Award size={16} className="text-indigo-600" />
                <span>Cộng điểm ngoại khóa tập thể</span>
              </h3>
              <button
                onClick={() => setShowBulkScoreModal(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Bạn đang cộng/trừ điểm rèn luyện hàng loạt cho <strong>{selectedStudentIds.length} sinh viên</strong> đã chọn.
            </p>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Mục tiêu chuẩn cộng</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                >
                  <option value="TC1">TC1 - Điểm học thuật GPA</option>
                  <option value="TC2">TC2 - Nội qui, Chuyên cần sĩ số</option>
                  <option value="TC3">TC3 - Tham gia CLB / Phong trào</option>
                  <option value="TC4">TC4 - Hoạt động tự quản, Công dân</option>
                  <option value="TC5">TC5 - Giấy khen thi đua đặc biệt</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-455 block mb-1">ĐIỂM SỐ CỘNG / TRỪ</label>
                <select
                  value={bulkPoints}
                  onChange={(e) => setBulkPoints(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border rounded-lg bg-white font-mono font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                >
                  <option value="1">+1đ Tham gia sự kiện thông thường</option>
                  <option value="2">+2đ Thẩm tra nề nếp hợp chuẩn (Mặc định)</option>
                  <option value="3">+3đ Hoạt động tình nguyện tích cực</option>
                  <option value="5">+5đ Chiến sĩ thi đua cấp trường</option>
                  <option value="10">+10đ Giải thưởng đặc biệt cấp khoa/trường</option>
                  <option value="-2">-2đ Vắng sinh hoạt chi đoàn / lớp</option>
                  <option value="-5">-5đ Trừ điểm nề nếp vi phạm tập thể</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-455 block mb-1">LÝ DO CỘNG ĐIỂM TẬP THỂ</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Tham gia hiến máu nhân đạo hè 2026,..."
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-205 rounded-lg bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkScoreModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-center cursor-pointer text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkScores}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center cursor-pointer text-xs shadow-sm transition-colors"
                >
                  Xác nhận cộng điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
