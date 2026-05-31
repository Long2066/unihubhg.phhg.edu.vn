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
  MessageSquare
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
    dailyAttendance
  } = useUniHub();

  const classId = currentUser?.targetId || "K20-CNTT";

  // Filter class reviews
  const classReviewInfo = classReviews.find(cr => cr.classId === classId);
  const myClassResults = results.filter(r => r.classId === classId);
  const myClassmatesArr = students.filter(s => s.classId === classId);
  
  // Find evidence submissions of classmates
  const classStudentIds = myClassmatesArr.map(s => s.id);
  const classEvidence = evidence.filter(e => classStudentIds.includes(e.studentId));

  const [activeTab, setActiveTab] = useState<"DUYETDEM" | "MINHCHUNG" | "NOTIFICATIONS">("DUYETDEM");
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

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === myClassResults.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(myClassResults.map(r => r.studentId));
    }
  };

  const handleBulkApprove = () => {
    if (selectedStudentIds.length === 0) return;
    bulkApproveScores(classId, selectedStudentIds, UserRole.ADVISER);
    alert(`Đã ký duyệt điểm rèn luyện đồng loạt cho ${selectedStudentIds.length} sinh viên lớp ${classId}`);
    setSelectedStudentIds([]);
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
        return <span className="px-2 py-0.5 rounded bg-blue-55 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">GVCN Đã Duyệt</span>;
      case "APPROVED_FACULTY":
        return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold font-mono">Chờ Phân hiệu khóa</span>;
      case "APPROVED_FINAL":
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-250 text-[10px] font-bold">Điểm chính thức</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 border text-[10px]">{status}</span>;
    }
  };

  const selectedResult = myClassResults.find(r => r.studentId === selectedDetailStudentId);
  const selectedStudentObj = myClassmatesArr.find(s => s.id === selectedDetailStudentId);
  const studentEvidences = classEvidence.filter(ev => ev.studentId === selectedDetailStudentId);
  const classAttendances = dailyAttendance.filter(da => da.classId === classId);
  const classFeedbacks = feedbacks.filter(f => f.toClassId === classId);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Left Tabs */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-150 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveTab("DUYETDEM")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "DUYETDEM" ? "bg-rose-600 text-white shadow-md" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <BookOpen size={14} />
            <span>Thống kê & Xét duyệt lớp ({myClassResults.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab("MINHCHUNG")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "MINHCHUNG" ? "bg-rose-600 text-white shadow-md" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <FileText size={14} />
            <span>Minh chứng của lớp ({classEvidence.filter(e=>e.status === "PENDING").length})</span>
          </button>
          <button 
            onClick={() => setActiveTab("NOTIFICATIONS")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "NOTIFICATIONS" ? "bg-rose-600 text-white shadow-md" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <MessageSquare size={14} />
            <span>Nhật ký sĩ số & Thư từ lớp ({classAttendances.length})</span>
          </button>
        </div>

        {/* Right Active Viewport */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-150 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          {/* TAB 1: Score Sheet and Checker Table */}
          {activeTab === "DUYETDEM" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase">Danh sách bảng điểm rèn luyện lớp {classId}</h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">Giáo viên click Sửa để can thiệp điểm ngoại lệ hoặc Ký duyệt cá nhân rèn luyện từng em.</p>
                </div>

                {selectedStudentIds.length > 0 && (
                  <div className="bg-rose-50 border border-rose-250 p-2 rounded-xl flex items-center gap-3">
                    <span className="text-[9px] font-bold text-rose-900 font-mono">Chọn {selectedStudentIds.length} SV</span>
                    <button
                      onClick={handleBulkApprove}
                      className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 text-[10px] font-black rounded-lg hover:cursor-pointer transition-all"
                    >
                      Duyệt loạt GVCN
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-slate-205 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left text-slate-650">
                  <thead className="bg-slate-50 uppercase tracking-wider text-[9px] text-slate-450 border-b">
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
                      <th className="p-3">Sinh viên</th>
                      <th className="p-3 text-center">GPA</th>
                      <th className="p-3 text-center">Số điểm rèn luyện</th>
                      <th className="p-3 text-center">Phân loại</th>
                      <th className="p-3 text-center">Duyệt cấp</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {myClassResults.map(res => {
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
                          <td className="p-3 text-center font-mono text-slate-500">{origStudent?.gpa?.toFixed(2) || "Chưa nhập"}</td>
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
                    })}
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
                          
                          <p className="text-[11px] text-slate-500 italic mt-1">{ev.description}</p>
                          <div className="text-[10px] font-mono text-slate-400 mt-2">
                            Mã SV nộp: {ev.studentId} | Tên: {resInfo?.studentName}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-150 text-[11px]">
                          <span className="font-mono text-[9px] text-indigo-700">Lĩnh vực: {ev.criteriaCategory}</span>
                          
                          <div className="flex items-center gap-2">
                            <a 
                              href={ev.evidenceUrl} 
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
                    <p className="text-[10px] text-slate-400 italic font-medium pt-2 text-center">Ban cán sự lớp chưa lập báo cáo chuyên cần ngày học nào.</p>
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
                    <p className="text-[10px] text-slate-400 italic pt-2 text-center">Chưa có bản ghi trao đổi phản hồi nào.</p>
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

      </div>

      {/* MODAL: CORE SPECIFIC VIEW & OVERRIDE */}
      {selectedDetailStudentId && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase font-mono">Cổng hiệu chuẩn & Kiểm duyệt minh chứng của Giáo viên</h3>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">SV: {selectedResult.studentName} | Mã SV: {selectedResult.studentId} | Điểm hiện thời: {selectedResult.totalPoints}đ</p>
              </div>
              <button 
                onClick={() => setSelectedDetailStudentId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left detail grid */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 5 categories */}
                <div className="bg-slate-50 p-4 rounded-xl border">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Thang điểm rèn luyện 5 tiêu chuẩn</span>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between bg-white p-2 border rounded-lg">
                      <span>TC1 - Năng lực học tập học vụ</span>
                      <strong className="font-mono text-slate-800">{selectedResult.studyPoints}đ / 20đ</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 border rounded-lg">
                      <span>TC2 - Ý thức kỷ luật nề nếp</span>
                      <strong className="font-mono text-slate-800">{selectedResult.violationPoints}đ / 25đ</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 border rounded-lg">
                      <span>TC3 - Phong trào, hoạt động hội nhóm</span>
                      <strong className="font-mono text-slate-800">{selectedResult.extracurricularPoints}đ / 30đ</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 border rounded-lg">
                      <span>TC4 - Ý thức trách nhiệm cộng đồng</span>
                      <strong className="font-mono text-slate-800">{selectedResult.communityPoints}đ / 15đ</strong>
                    </div>
                    <div className="flex justify-between bg-white p-2 border rounded-lg">
                      <span>TC5 - Gương sáng sáng tạo đặc thù</span>
                      <strong className="font-mono text-slate-800">{selectedResult.achievementPoints}đ / 10đ</strong>
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

                {/* Evidence audits inside modal */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-black text-slate-650 uppercase">Phê duyệt trực tiếp văn kiện đính kèm</h4>
                  <div className="space-y-2 font-medium">
                    {studentEvidences.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center p-2.5 bg-slate-50/80 rounded-lg">Chưa tải lên minh chứng.</p>
                    ) : (
                      studentEvidences.map(ev => (
                        <div key={ev.id} className="bg-slate-50 p-3-5 p-3 rounded-lg border text-[11px] flex justify-between items-center">
                          <div>
                            <strong className="text-slate-850 block">{ev.title}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">Hạng mục: {ev.criteriaCategory} | Trạng thái: {ev.status}</span>
                          </div>
                          <div className="flex gap-2.5 items-center">
                            <a 
                              href={ev.evidenceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-650 font-extrabold hover:underline"
                            >
                              File.pdf
                            </a>
                            {ev.status === "PENDING" && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => handleAuditEvidence(ev.id, "APPROVED")}
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded cursor-pointer"
                                  title="Phê chuẩn"
                                >
                                  <Check size={11} />
                                </button>
                                <button
                                  onClick={() => handleAuditEvidence(ev.id, "REJECTED")}
                                  className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded cursor-pointer"
                                  title="Từ chối"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            )}
                          </div>
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

                {/* Feedback line back descending to Class Monitor */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Chỉ thị sửa đổi phản hồi xuống lớp trưởng</span>
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
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg cursor-pointer"
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

    </div>
  );
};
