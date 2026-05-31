import React, { useState } from "react";
import { useUniHub } from "../state";
import { UserRole } from "../types";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Send, 
  AlertTriangle, 
  HelpCircle,
  FileCheck,
  Calendar,
  Plus,
  Trash2,
  ListFilter,
  Eye,
  Edit3,
  CheckSquare,
  XSquare,
  MessageSquare,
  Search,
  Award
} from "lucide-react";

export const ClassPortal: React.FC = () => {
  const { 
    currentUser, 
    students, 
    results, 
    classReviews, 
    approveClassScores,
    dailyAttendance,
    reportDailyAttendance,
    bulkApproveScores,
    adjustStudentScoreSpecific,
    evidence,
    feedbacks,
    sendFeedback
  } = useUniHub();

  const classId = currentUser?.targetId || "K20-CNTT";
  
  // Get classmates
  const myClassmatesArr = students.filter(s => s.classId === classId);
  const myClassResults = results.filter(r => r.classId === classId);
  const classReviewInfo = classReviews.find(cr => cr.classId === classId);

  const isApprovedByBCS = !!classReviewInfo?.representativeApproved;

  // Selected students for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // Navigation tabs state - Báo cáo sỹ sỗ và Bảng điểm rèn luyện
  const [activeTab, setActiveTab] = useState<"SI_SO" | "BANG_DIEM">("SI_SO");
  
  // Daily Attendance formulation states
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [draftAbsentees, setDraftAbsentees] = useState<{ studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[]>([]);

  // Modal manual adjustments control
  const [selectedDetailStudentId, setSelectedDetailStudentId] = useState<string | null>(null);
  
  // Fine control points adjustment states inside modal
  const [adjustCategory, setAdjustCategory] = useState("TC2 - Nội Quy Lớp Học");
  const [adjustPoints, setAdjustPoints] = useState(-2);
  const [adjustReason, setAdjustReason] = useState("");

  // Feedback input
  const [fbText, setFbText] = useState("");

  const handleApproveClass = () => {
    approveClassScores(classId);
    alert(`Ban cán sự lớp ${classId} đã chốt đối chiếu xếp loại rèn luyện tập thể của lớp, chuyển ký GVCN thành công!`);
  };

  // Bulk operation
  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(x => x !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === myClassResults.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(myClassResults.map(r => r.studentId));
    }
  };

  const handleBulkApprove = () => {
    if (selectedStudentIds.length === 0) return;
    bulkApproveScores(classId, selectedStudentIds, UserRole.CLASS_MONITOR);
    alert(`Đã duyệt đồng loạt rèn luyện cho ${selectedStudentIds.length} sinh viên lớp ${classId}`);
    setSelectedStudentIds([]);
  };

  // Toggle a student's absentee presence (adds or removes from draft list)
  const toggleStudentAbsentee = (studentId: string, studentName: string) => {
    if (draftAbsentees.some(da => da.studentId === studentId)) {
      setDraftAbsentees(draftAbsentees.filter(da => da.studentId !== studentId));
    } else {
      setDraftAbsentees([
        ...draftAbsentees,
        {
          studentId,
          studentName,
          type: "KHÔNG_PHÉP",
          reason: ""
        }
      ]);
    }
  };

  // Update specific fields (type or reason) for a particular student in the draft list
  const updateDraftAbsenteeField = (
    studentId: string, 
    fields: Partial<{ type: "PHẾP" | "KHÔNG_PHÉP"; reason: string }>
  ) => {
    setDraftAbsentees(prev => 
      prev.map(da => da.studentId === studentId ? { ...da, ...fields } : da)
    );
  };

  const removeAbsenteeFromDraft = (sid: string) => {
    setDraftAbsentees(draftAbsentees.filter(da => da.studentId !== sid));
  };

  // Report Daily Attendance
  const submitDailyRollCall = () => {
    if (draftAbsentees.length === 0) {
      // Allow reporting everyone present
      if (!window.confirm("Không có ai vắng học. Báo cáo lớp sĩ số hiện diện đủ đề phòng?")) {
        return;
      }
    }

    reportDailyAttendance(
      classId,
      reportDate,
      draftAbsentees,
      currentUser?.name || "Ban cán sự lớp"
    );

    alert(`Đã gửi báo cáo sĩ số ngày ${reportDate} thành công! Hệ thống tự động đối chiếu khấu trừ thi đua đối với các sinh viên vắng không phép.`);
    setDraftAbsentees([]);
  };

  // Adjust scores manual
  const applyPointAdjustment = () => {
    if (!selectedDetailStudentId) return;
    if (!adjustReason) {
      alert("Vui lòng điền mốc lý do hiệu chỉnh rèn luyện thi đua.");
      return;
    }

    adjustStudentScoreSpecific(
      selectedDetailStudentId,
      adjustCategory,
      adjustPoints,
      adjustReason
    );

    alert("Hệ thống đã bổ sung ghi chép phê duyệt hiệu chỉnh điểm rèn luyện.");
    setAdjustReason("");
  };

  const sendSuperiorFeedback = () => {
    if (!fbText) return;
    sendFeedback(
      UserRole.CLASS_MONITOR,
      currentUser?.name || `Lớp trưởng ${classId}`,
      classId,
      fbText,
      selectedDetailStudentId || undefined
    );
    setFbText("");
    alert("Đã gửi phản hồi nhanh lên hệ thống cán bộ GVCN và Khoa.");
  };

  const getRankColorLight = (points: number) => {
    if (points >= 90) return "bg-emerald-50 text-emerald-850 border-emerald-200";
    if (points >= 80) return "bg-blue-50 text-blue-850 border-blue-200";
    if (points >= 70) return "bg-purple-50 text-purple-850 border-purple-200";
    if (points >= 50) return "bg-amber-50 text-amber-850 border-amber-200";
    return "bg-rose-50 text-rose-850 border-rose-200";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold">Bản nháp tự động</span>;
      case "APPROVED_CLASS":
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold">Lớp đã duyệt chốt</span>;
      case "APPROVED_ADVISER":
        return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">Chờ Khoa ký</span>;
      case "APPROVED_FACULTY":
        return <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold font-mono">Chờ Phân hiệu duỵet</span>;
      case "APPROVED_FINAL":
        return <span className="px-2 py-0.5 rounded bg-emerald-55 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Điểm chính thức</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 border text-[10px]">{status}</span>;
    }
  };

  // Class attendance histories
  const classAttendances = dailyAttendance.filter(da => da.classId === classId);
  
  // Feedback specific to this class
  const classFeedbacks = feedbacks.filter(f => f.toClassId === classId);

  // Selected student details helper
  const selectedResult = myClassResults.find(r => r.studentId === selectedDetailStudentId);
  const selectedStudentObj = myClassmatesArr.find(s => s.id === selectedDetailStudentId);
  const studentEvidences = evidence.filter(ev => ev.studentId === selectedDetailStudentId);

  return (
    <div className="space-y-6" id="class-portal-container">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-250 uppercase tracking-wider">
            CỔNG BAN CÁN SỰ LỚP & ĐOÀN CHI BỘ
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Phân hệ Đối Chiếu Điểm Danh & Thi đua Lớp {classId}</h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            Nơi theo dõi sĩ số chuyên cần hàng ngày, hiệu chỉnh điều quy rèn luyện, báo cáo phản hồi lỗi dữ liệu của các sinh viên trực thuộc cho GVCN và Phòng đào tạo.
          </p>
        </div>

        {isApprovedByBCS ? (
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm shrink-0">
            <CheckCircle size={15} />
            <span>Đã Chốt & Gửi Chờ GVCN Duyệt</span>
          </div>
        ) : (
          <button 
            onClick={handleApproveClass}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all hover:cursor-pointer shrink-0 animate-pulse"
          >
            <Send size={14} />
            <span>Chốt Tập Thể & Gửi GVCN</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left tracking / Right student score list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Left Sidebar - Menu bên trái nhỏ gọn */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-150 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto shrink-0 lg:h-fit">
          <div className="hidden lg:block border-b border-slate-100 pb-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chức năng ban cán sự</span>
          </div>
          
          <button 
            type="button"
            onClick={() => setActiveTab("SI_SO")} 
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "SI_SO" ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Calendar size={13} />
            <span>Điểm danh & Sĩ số ngày</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab("BANG_DIEM")} 
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "BANG_DIEM" ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Award size={13} />
            <span>Bảng điểm rèn luyện ({myClassResults.length})</span>
          </button>
        </div>

        {/* Right main view content container - Giao diện chính hiện bên phải to nhất */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: ATTENDANCE & SĨ SỐ */}
          {activeTab === "SI_SO" && (
            <div className="space-y-6">
              
              {/* Class quick metrics */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông Số Sĩ Số Tổng Quát</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-slate-800 font-mono">{myClassmatesArr.length}</div>
                <div className="text-[10px] text-slate-450 mt-1">Sĩ Số Chính Thức</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-emerald-600 font-mono">
                  {classAttendances.length}
                </div>
                <div className="text-[10px] text-slate-450 mt-1">Đã Báo Cáo Sĩ Số</div>
              </div>
            </div>
          </div>

          {/* ATTENDANCE REPORTING ZONE */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b pb-2 flex justify-between items-center">
              <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-600" />
                Đóng Điểm Danh Sĩ Số Lớp Theo Ngày
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">CHỌN NGÀY báo CÁO SĨ SỐ</label>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-205 rounded-lg font-mono focus:outline-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Form to add multiple absentees with criteria */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative">
                <span className="text-[10px] font-black text-slate-500 uppercase block">Tìm kiếm & Chọn sinh viên vắng</span>
                
                {/* Search input */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Nhập tên hoặc mã SV..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pl-8 border border-slate-200 rounded-lg bg-white focus:outline-emerald-500 focus:border-emerald-500"
                  />
                  <Search size={13} className="absolute left-2.5 top-3.5 text-slate-400" />
                  {attendanceSearch && (
                    <button 
                      type="button"
                      onClick={() => setAttendanceSearch("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown/Box if query exists */}
                {attendanceSearch.trim() !== "" && (
                  <div className="bg-white border border-slate-250 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 absolute z-50 w-full left-0 right-0 top-[65px]">
                    {myClassmatesArr
                      .filter(s => 
                        s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                        s.id.toLowerCase().includes(attendanceSearch.toLowerCase())
                      )
                      .map(s => {
                        const isAbsent = draftAbsentees.some(da => da.studentId === s.id);
                        return (
                          <div 
                            key={s.id} 
                            onClick={() => {
                              toggleStudentAbsentee(s.id, s.name);
                              setAttendanceSearch(""); // clear search for next use
                            }}
                            className="p-2 flex justify-between items-center text-xs hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{s.name}</span>
                              <span className="text-slate-400 text-[10px] font-mono ml-1.5">({s.id})</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isAbsent ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                              {isAbsent ? "Đã chọn vắng (-)" : "+ Chọn vắng"}
                            </span>
                          </div>
                        );
                      })}
                    {myClassmatesArr.filter(s => 
                      s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                      s.id.toLowerCase().includes(attendanceSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-xs text-slate-400 italic text-center">Không tìm thấy sinh viên phù hợp</div>
                    )}
                  </div>
                )}

                {/* Collapsible / Quick grid of all classmates to click directly */}
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold block uppercase">Hoặc bấm chọn trực tiếp danh sách lớp:</label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded-lg">
                    {myClassmatesArr.map(s => {
                      const isAbsent = draftAbsentees.some(da => da.studentId === s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleStudentAbsentee(s.id, s.name)}
                          className={`text-[10px] px-2 py-1 rounded-md border font-normal transition-all hover:scale-102 flex items-center gap-1 ${
                            isAbsent 
                              ? "bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs" 
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isAbsent ? "bg-rose-600 animate-pulse" : "bg-slate-400"}`} />
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Staging of Draft Absentees with details for each */}
              {draftAbsentees.length > 0 ? (
                <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                    <span className="text-[10px] font-black text-slate-700 uppercase">
                      Chi tiết lý do vắng ({draftAbsentees.length} SV)
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setDraftAbsentees([])}
                      className="text-[9px] hover:text-red-650 font-bold text-slate-450 uppercase"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {draftAbsentees.map((da) => (
                      <div key={da.studentId} className="bg-white p-2.5 rounded-md border border-slate-150 shadow-xs space-y-2 relative">
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeAbsenteeFromDraft(da.studentId)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>

                        <div>
                          <span className="font-bold text-slate-800 text-xs">{da.studentName}</span>
                          <span className="text-slate-400 text-[10px] font-mono ml-1.5">({da.studentId})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] text-slate-400 font-bold block mb-0.5">PHÂN LOẠI</label>
                            <select
                              value={da.type}
                              onChange={(e) => updateDraftAbsenteeField(da.studentId, { type: e.target.value as any })}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-800 focus:outline-emerald-500 focus:border-emerald-500"
                            >
                              <option value="KHÔNG_PHÉP">KHÔNG PHÉP (-2đ)</option>
                              <option value="PHÉP">CÓ PHÉP (Duyệt)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-400 font-bold block mb-0.5">LÝ DO VẮNG CHI TIẾT</label>
                            <input 
                              type="text"
                              placeholder="Nhập lý do vắng..."
                              value={da.reason || ""}
                              onChange={(e) => updateDraftAbsenteeField(da.studentId, { reason: e.target.value })}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded focus:outline-emerald-500 text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50/20 border border-emerald-150 rounded-lg text-center">
                  <p className="text-xs text-emerald-800 font-medium font-sans">Đã hiện diện đủ</p>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">Nhấn chọn từ danh sách trên hoặc gõ tìm kiếm để báo vắng.</p>
                </div>
              )}

              <button
                type="button"
                onClick={submitDailyRollCall}
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:cursor-pointer transition-all shadow-md"
              >
                <CheckCircle size={14} />
                <span>Báo Cáo Sĩ Số Lớp Ngày {reportDate}</span>
              </button>

            </div>
          </div>

          {/* HISTORIES DAILY ROLLCALL */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
            <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
              <Clock size={13} className="text-amber-650" />
              Lịch Sử Nhật Ký Chuyên Cần Ngày
            </span>

            {classAttendances.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Chưa ghi nhận báo cáo sĩ số điểm danh nào thuộc học kỳ này.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto divide-y divide-slate-150">
                {classAttendances.map(da => (
                  <div key={da.id} className="pt-2 text-[11px] first:pt-0">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span className="font-mono">{da.date}</span>
                      <span className="text-indigo-600 font-medium">Hiện diện: {da.presentCount}/{da.totalStudents}</span>
                    </div>
                    {da.absentees.length > 0 ? (
                      <div className="mt-1 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-md space-y-0.5">
                        {da.absentees.map((abs, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>● {abs.studentName}</span>
                            <span className={abs.type === "KHÔNG_PHÉP" ? "text-rose-600 font-bold" : "text-amber-600"}>
                              {abs.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 mt-0.5">Hiện diện trọn vẹn 100% không vắng.</div>
                    )}
                    <div className="text-[9px] text-slate-400 tracking-tight text-right mt-1">Người lập: {da.reportedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUPERIOR FEEDBACK ALERTS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
            <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5">
              <MessageSquare size={13} className="text-indigo-600" />
              Thông báo Nhận Xét của GVCN / Khoa
            </span>
            {classFeedbacks.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Lớp được thẩm duyệt yên ổn, chưa nhận chỉ đạo điều chỉnh từ cấp trên.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                {classFeedbacks.map(fb => (
                  <div key={fb.id} className="pt-2 text-[11px] first:pt-0 space-y-1">
                    <div className="flex justify-between font-mono text-[9px] text-slate-400">
                      <span>{fb.fromName} ({fb.fromRole})</span>
                      <span>{fb.createdAt}</span>
                    </div>
                    <p className="text-slate-700 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">{fb.comment}</p>
                    {fb.studentId && (
                      <div className="text-[9px] bg-slate-100 border text-slate-500 px-1.5 py-0.5 rounded-sm inline-block">
                        SV Liên đới: {fb.studentId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GRADE SPREADSHEETS */}
      {activeTab === "BANG_DIEM" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm min-h-[500px] flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header control board */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase">Thống kê Điểm Rèn Luyện Lớp {classId}</h4>
                <p className="text-[11px] text-slate-400">Nhấp xem Chi tiết của từng sinh viên để đối soát minh chứng và gửi đề xuất hiệu chuẩn rèn luyện lên GVCN.</p>
              </div>
              
              {/* Batch Action Bar */}
              {selectedStudentIds.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center gap-3.5 self-stretch sm:self-auto justify-between animate-pulse">
                  <span className="text-[10px] font-bold text-amber-950">Đang chọn {selectedStudentIds.length} dòng</span>
                  <button
                    onClick={handleBulkApprove}
                    className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 text-[10px] font-black rounded-lg hover:cursor-pointer shadow-sm transition-all"
                  >
                    Duyệt nhóm BCS
                  </button>
                </div>
              )}
            </div>

            {/* Main Score Spreadsheet Table */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-[9px] text-slate-450 border-b">
                  <tr>
                    <th className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedStudentIds.length === myClassResults.length && myClassResults.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Mã số SV</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3 text-center">GPA</th>
                    <th className="p-3 text-center font-mono">Điểm rèn luyện</th>
                    <th className="p-3 text-center">Xếp loại</th>
                    <th className="p-3 text-center">Tiến trình duyệt</th>
                    <th className="p-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {myClassResults.map(res => {
                    const origStudent = myClassmatesArr.find(s => s.id === res.studentId);
                    const isSelected = selectedStudentIds.includes(res.studentId);

                    return (
                      <tr key={res.studentId} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(res.studentId)}
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-semibold">{res.studentId}</td>
                        <td className="p-3 font-black text-slate-900">{res.studentName}</td>
                        <td className="p-3 text-center font-mono text-slate-500">{origStudent?.gpa?.toFixed(2) || "Chưa nạp"}</td>
                        <td className="p-3 text-center font-black font-mono text-slate-900 text-sm">
                          {res.totalPoints}đ
                        </td>
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
                            className="p-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-extrabold text-slate-700 flex items-center gap-1 mx-auto hover:cursor-pointer transition-colors"
                          >
                            <Eye size={12} />
                            <span>Xem / Sửa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          <div className="bg-slate-50 p-3.5 border-t rounded-b-xl text-center text-[10px] text-slate-400 font-mono mt-4">
            * BCS lớp có quyền rà soát lỗi rèn luyện của sinh viên, xem trước minh chứng tự tải lên của sinh viên trước khi gửi phiếu thẩm định lớp chốt chính thức chờ ký duyệt chung bởi Giáo viên Chủ nhiệm (GVCN).
          </div>
        </div>
      )}

        </div>

      </div>

      {/* MODAL: DETAIL SCORE VIEW & MANUAL ADJUSTMENTS FOR BCS AND GVCN */}
      {selectedDetailStudentId && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="bg-slate-55 px-6 py-4 border-b border-slate-150 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">Hồ sơ chi tiết rèn luyện Sinh viên</h3>
                <p className="text-[10px] text-slate-400 font-mono">Họ tên: {selectedResult.studentName} | Mã sinh viên: {selectedResult.studentId}</p>
              </div>
              <button 
                onClick={() => setSelectedDetailStudentId(null)}
                className="text-slate-500 hover:text-slate-800 font-extrabold text-xs uppercase cursor-pointer bg-slate-200 px-3 py-1.5 rounded-lg"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column in Modal: Score Category breakdown & logs & evidence */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 5 Criteria Categories Overview */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-650 uppercase mb-3 text-left">Phân khúc chi tiết 5 tiêu chí rèn luyện</h4>
                  <div className="space-y-2.5 text-xs">
                    
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-2xs">
                      <span>TC1: Ý thức học tập (Max 20 XP)</span>
                      <strong className="font-mono text-slate-800 text-sm">{selectedResult.studyPoints}đ</strong>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-2xs">
                      <span>TC2: Chấp hành luật lệ, nội quy (Max 25 XP)</span>
                      <strong className="font-mono text-slate-800 text-sm">{selectedResult.violationPoints}đ</strong>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-2xs">
                      <span>TC3: Phẩm chất tham gia CLB, phong trào (Max 30 XP)</span>
                      <strong className="font-mono text-slate-800 text-sm">{selectedResult.extracurricularPoints}đ</strong>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-2xs">
                      <span>TC4: Trách nhiệm công dân cộng đồng (Max 15 XP)</span>
                      <strong className="font-mono text-slate-800 text-sm">{selectedResult.communityPoints}đ</strong>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-2xs">
                      <span>TC5: Phẩm chất thi đua khen thưởng (Max 10 XP)</span>
                      <strong className="font-mono text-slate-800 text-sm">{selectedResult.achievementPoints}đ</strong>
                    </div>

                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">TỔNG ĐIỂM CHUNG TÍCH LŨY</span>
                      <strong className="font-mono text-indigo-650 text-base font-black">{selectedResult.totalPoints}đ ({selectedResult.grade})</strong>
                    </div>

                  </div>
                </div>

                {/* TIMELINE OF COMPUTED LOGS */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-650 uppercase">Nhật Ký Lịch Sử Tính Toán Điểm Số</h4>
                  <div className="border border-slate-100 rounded-xl max-h-[170px] overflow-y-auto divide-y divide-slate-100 text-[11px] p-2 bg-white">
                    {selectedResult.logs.length === 0 ? (
                      <p className="p-3 text-slate-400 italic text-center">Hệ thống chưa ghi nhận cộng trừ thi đua nào.</p>
                    ) : (
                      selectedResult.logs.map((lg, index) => (
                        <div key={index} className="p-2 flex justify-between items-start gap-2">
                          <div className="text-left">
                            <span className="font-bold text-slate-800">
                              {lg.criteriaId ? `[${lg.criteriaId}] ` : ""} {lg.reason}
                            </span>
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">Nguồn: {lg.source} | Ngày cập: {lg.timestamp}</div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded font-mono font-black shrink-0 ${lg.points >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                            {lg.points >= 0 ? `+${lg.points}` : `${lg.points}`}đ
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* STUDENT SUBMITTED EVIDENCES FOR VISUAL AUDITING */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-650 uppercase">Xem Minh Chứng Do Sinh Viên Đính Kèm</h4>
                  <div className="space-y-2.5">
                    {studentEvidences.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center">Sinh viên này chưa tải/cập nhật minh chứng phục vụ học kỳ.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto">
                        {studentEvidences.map(ev => (
                          <div key={ev.id} className="p-3 bg-slate-50 border rounded-lg text-[10px] space-y-1.5 text-left flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="font-black text-slate-850 uppercase truncate max-w-[130px]">{ev.title}</span>
                                <span className={`px-1 py-0.2 rounded font-bold text-[8px] uppercase ${ev.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                                  {ev.status === "APPROVED" ? "Đã duyệt" : ev.status === "REJECTED" ? "Từ chối" : "Chờ phê duyệt"}
                                </span>
                              </div>
                              <p className="text-slate-500 mt-1 italic">{ev.description}</p>
                            </div>
                            
                            <div className="border-t pt-1.5 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                              <span>Mã mục: {ev.criteriaCategory}</span>
                              <a 
                                href={ev.evidenceUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-indigo-650 font-bold hover:underline flex items-center gap-0.5"
                              >
                                Thể hiện file &rarr;
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column in Modal: BCS/GVCN Adjustment inputs */}
              <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-5">
                
                {/* Manual override form */}
                <div className="space-y-3">
                  <div className="border-b pb-1.5">
                    <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                      <Edit3 size={13} className="text-indigo-600" />
                      Ghi nhận hiệu chỉnh nề nếp / thi đua của Lớp
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs text-left">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">CHỌN TIÊU CHÍ HIỆU CHỈNH</label>
                      <select
                        value={adjustCategory}
                        onChange={(e) => setAdjustCategory(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white"
                      >
                        <option value="TC1">TC1 - Ý thức học tập (GPA/Cảnh cáo)</option>
                        <option value="TC2">TC2 - Nội Quy Lớp Học (Nề nếp/Vắng học)</option>
                        <option value="TC3">TC3 - Ngoại Khóa & CLB (Sự kiện/Phong trào)</option>
                        <option value="TC4">TC4 - Hoạt Động Công Dân (Họp lớp/Trực tuần)</option>
                        <option value="TC5">TC5 - Khen Thưởng Thi Đua (Giấy khen/Gương sáng)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">MỐC ĐIỂM SỐ (+/-)</label>
                        <select
                          value={adjustPoints}
                          onChange={(e) => setAdjustPoints(Number(e.target.value))}
                          className="w-full text-xs p-2.5 border rounded-lg bg-white font-mono font-bold"
                        >
                          <option value="-5">-5đ vi phạm nghiêm trọng</option>
                          <option value="-3">-3đ vi phạm thường lệ</option>
                          <option value="-2">-2đ vắng họp/đi muộn</option>
                          <option value="1">+1đ đóng góp phong trào</option>
                          <option value="2">+2đ hoàn thành tốt trực tầu</option>
                          <option value="3">+3đ hoạt động năng nổ</option>
                          <option value="5">+5đ chiến sĩ thi đua xuất sắc</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">TÌNH TRẠNG DUYỆT</label>
                        <button
                          type="button"
                          onClick={() => {
                            bulkApproveScores(classId, [selectedDetailStudentId!], UserRole.CLASS_MONITOR);
                            alert("Đã ký duyệt điểm rèn luyện cho sinh viên này.");
                          }}
                          className="w-full rounded-lg text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold hover:cursor-pointer shadow-sm transition-colors text-center"
                        >
                          Ký Duyệt BCS
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 block mb-1">LÝ DO VI PHẠM / CỘNG ĐIỂM</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: Tích cực trực nhật dọn dẹp giảng đường..."
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-205 rounded-lg focus:outline-indigo-500 bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={applyPointAdjustment}
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 border hover:cursor-pointer shadow-sm transition-all"
                    >
                      <FileCheck size={14} />
                      <span>Áp Dụng Bản Ghi Hiệu Chỉnh</span>
                    </button>
                  </div>
                </div>

                {/* Send quick comment to superior cascade */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Gửi chỉ thị / phản hồi khiếu nại lên cấp trên</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Gửi lý do thắc mắc hoặc báo cáo đặc biệt về SV này..."
                      value={fbText}
                      onChange={(e) => setFbText(e.target.value)}
                      className="flex-1 text-xs p-2 border border-slate-200 rounded-lg bg-white focus:outline-indigo-500"
                    />
                    <button
                      onClick={sendSuperiorFeedback}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      Gửi
                    </button>
                  </div>
                  <span className="text-[8px] text-slate-400 block">* Nội dung phản hồi này sẽ hiển thị ngay trên bảng tin tiếp nhận của GVCN và Cán bộ Khoa.</span>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
