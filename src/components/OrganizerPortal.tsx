import React, { useState } from "react";
import { useUniHub } from "../state";
import { 
  Users, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Check, 
  X, 
  Shield, 
  Settings, 
  UserPlus, 
  Trash2, 
  UserCheck, 
  AlertCircle 
} from "lucide-react";

export const OrganizerPortal: React.FC = () => {
  const { 
    currentUser, 
    organizations, 
    members, 
    activities, 
    attendance, 
    students, 
    criteria,
    approveMemberRequest, 
    rejectMemberRequest, 
    assignMemberRole, 
    createActivity, 
    updateActivityStatus, 
    updateAttendance, 
    addBulkAttendance 
  } = useUniHub();

  const orgId = currentUser?.targetId || "UNITECH";
  
  // Find current organization
  const org = organizations.find(o => o.id === orgId) || organizations[0];
  const orgMembers = members.filter(m => m.orgId === org.id);
  const orgActivities = activities.filter(a => a.orgId === org.id);

  // Dynamic criteria mapping for and activity creation listing
  const activityCriteriaRules = criteria.flatMap(c => 
    c.rules.filter(r => r.type === "ACTIVITY_MEMBER" || r.type === "ACTIVITY_LEADER" || r.type === "EXCEPTION").map(r => ({
      criteriaId: r.id,
      categoryName: c.category,
      name: r.name,
      points: r.points
    }))
  );

  // States
  const [activeSubTab, setActiveSubTab] = useState<"THANHVIEN" | "HOATDONG" | "DIEMDANH">("THANHVIEN");
  const [selectedActId, setSelectedActId] = useState<string | null>(orgActivities[0]?.id || null);

  // Form State for new activity
  const [actTitle, setActTitle] = useState("");
  const [actCriteria, setActCriteria] = useState("TC3.1");
  const [actPoints, setActPoints] = useState(5);
  const [actDate, setActDate] = useState("");
  const [actLoc, setActLoc] = useState("");
  const [actDesc, setActDesc] = useState("");

  // Bulk Student state
  const [bulkInput, setBulkInput] = useState("");

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle || !actDate || !actLoc) {
      alert("Vui lòng điền đủ tên hoạt động, ngày giờ và địa điểm!");
      return;
    }

    createActivity({
      title: actTitle,
      orgId: org.id,
      criteriaId: actCriteria,
      points: Number(actPoints),
      dateTime: actDate,
      location: actLoc,
      description: actDesc,
      registrationOpen: true
    });

    // Reset Form
    setActTitle("");
    setActDate("");
    setActLoc("");
    setActDesc("");
    alert("Khởi tạo hoạt động ngoại khóa thành công! Học sinh đã có thể tự đăng ký.");
  };

  const handleBulkAttendanceAdd = () => {
    if (!selectedActId) return;
    if (!bulkInput.trim()) {
      alert("Hãy chọn Sinh viên từ danh sách.");
      return;
    }
    
    // Supports CSV or multiple options
    const studentIds = bulkInput.split(",").map(id => id.trim().toUpperCase());
    addBulkAttendance(selectedActId, studentIds);
    setBulkInput("");
    alert(`Đã điểm danh khẩn cấp thành công sinh viên!`);
  };

  const selectedAct = activities.find(a => a.id === selectedActId);
  const currentAttendance = attendance.filter(att => att.activityId === selectedActId);
  const liveMatchRule = selectedAct ? criteria.flatMap(c => c.rules).find(r => r.id === selectedAct.criteriaId) : null;
  const realActPoints = selectedAct ? (liveMatchRule ? liveMatchRule.points : selectedAct.points) : 0;

  // Pending vs Active members
  const pendingMembers = orgMembers.filter(m => m.status === "PENDING");
  const activeMembersArr = orgMembers.filter(m => m.status === "ACTIVE");

  const isDoan = org.type === "DOAN";
  const isHoi = org.type === "HOI";

  const themeBgActive = isDoan 
    ? "bg-rose-600 text-white shadow-md shadow-rose-100/50 hover:bg-rose-700" 
    : (isHoi 
      ? "bg-sky-600 text-white shadow-md shadow-sky-100/50 hover:bg-sky-700" 
      : "bg-purple-600 text-white shadow-md shadow-purple-100/50 hover:bg-purple-700"
    );

  const themeBgBadge = isDoan
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : (isHoi
      ? "bg-sky-50 text-sky-700 border-sky-250"
      : "bg-purple-50 text-purple-700 border-purple-200"
    );

  const themeTextLabel = isDoan
    ? "ĐOÀN THANH NIÊN PHÂN HIỆU"
    : (isHoi
      ? "HỘI SINH VIÊN VIỆT NAM"
      : "CÂU LẠC BỘ PHONG TRÀO"
    );

  const themeTextPrimary = isDoan ? "text-rose-600" : (isHoi ? "text-sky-600" : "text-purple-600");

  return (
    <div className="space-y-6" id="organizer-portal-container">
      {/* Bio banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${themeBgBadge}`}>
            {themeTextLabel}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">{org.name}</h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            Lĩnh vực: {org.field} | Đại diện: {org.leaderName}
          </p>
        </div>

        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 divide-x divide-slate-200">
          <div className="px-2 text-center">
            <div className="text-xs font-bold text-slate-800">{activeMembersArr.length}</div>
            <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Thành viên</div>
          </div>
          <div className="px-3 text-center">
            <div className={`text-xs font-bold ${themeTextPrimary}`}>{pendingMembers.length}</div>
            <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Đang xét duyệt</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-xs font-bold text-emerald-600">{orgActivities.length}</div>
            <div className="text-[10px] text-emerald-400 font-medium whitespace-nowrap">Sự kiện năm học</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar for Organizer Subviews */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto">
          <button 
            onClick={() => setActiveSubTab("THANHVIEN")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeSubTab === "THANHVIEN" ? themeBgActive : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Users size={14} />
            <span>Quản lý thành viên</span>
          </button>
          <button 
            onClick={() => setActiveSubTab("HOATDONG")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeSubTab === "HOATDONG" ? themeBgActive : "text-slate-650 hover:bg-slate-50"}`}
          >
            <PlusCircle size={14} />
            <span>Khai báo hoạt động mới</span>
          </button>
          <button 
            onClick={() => setActiveSubTab("DIEMDANH")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeSubTab === "DIEMDANH" ? themeBgActive : "text-slate-650 hover:bg-slate-50"}`}
          >
            <UserCheck size={14} />
            <span>Điểm danh có mặt ({orgActivities.filter(a=>a.status !== "COMPLETED").length})</span>
          </button>
        </div>

        {/* Workspace Display Area */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          {/* SUBVIEW 1: MEMBER MANAGEMENT */}
          {activeSubTab === "THANHVIEN" && (
            <div className="space-y-6">
              {/* Approvals section */}
              {pendingMembers.length > 0 && (
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${themeBgBadge}`}>
                    <AlertCircle size={14} className={themeTextPrimary} />
                    <span className={`text-xs font-bold ${isDoan ? "text-rose-900" : (isHoi ? "text-sky-900" : "text-purple-900")}`}>Yêu cầu tham gia {isDoan ? "Đoàn TNCS" : (isHoi ? "Hội Sinh Viên" : "CLB")} mới chưa xét duyệt</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    {pendingMembers.map(m => {
                      const studentInfo = students.find(s => s.id === m.studentId);
                      return (
                        <div key={m.id} className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50/20 transition-colors">
                          <div>
                            <span className="text-[10px] font-bold text-slate-800 font-mono tracking-tight">{m.studentId}</span>
                            <h5 className="text-xs font-extrabold text-slate-900 mt-0.5">{studentInfo?.name}</h5>
                            <p className="text-[10px] text-slate-500">Lớp: {m.classId} | Ngày xin gia nhập: {m.joinedDate}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => rejectMemberRequest(m.id)}
                              className="p-1 px-2.5 rounded border border-rose-200 hover:bg-rose-50 text-rose-600 hover:cursor-pointer text-[10px] font-bold transition-all"
                            >
                              Từ chối
                            </button>
                            <button 
                              onClick={() => approveMemberRequest(m.id)}
                              className={`p-1 px-2.5 rounded border border-transparent text-white hover:cursor-pointer text-[10px] font-bold transition-all flex items-center gap-0.5 ${themeBgActive}`}
                            >
                              <Check size={10} />
                              <span>Duyệt làm thành viên</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Members listing */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Danh bạ Thành viên hỗ trợ ({activeMembersArr.length})</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {activeMembersArr.map(member => {
                    const studentObj = students.find(s => s.id === member.studentId);
                    return (
                      <div key={member.id} className="p-3 bg-white flex justify-between items-center text-xs">
                        <div>
                          <h5 className="font-extrabold text-slate-950">{studentObj?.name || "Sinh viên"}</h5>
                          <p className="text-[10px] text-slate-500 font-mono">{member.studentId} • Lớp: {member.classId}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] text-slate-400 font-medium">Chức vụ:</label>
                          <select 
                            value={member.role}
                            onChange={(e) => assignMemberRole(member.id, e.target.value as any)}
                            className="text-[10px] font-bold py-1 px-2 border rounded-lg bg-slate-50 text-slate-800"
                          >
                            <option value="CHỦ NHIỆM">Chủ nhiệm</option>
                            <option value="BAN CHẤP HÀNH">Ban chấp hành</option>
                            <option value="ỦY VIÊN">Ủy viên</option>
                            <option value="THÀNH VIÊN">Thành viên</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUBVIEW 2: EVENT DECLARATION (Section 1.2) */}
          {activeSubTab === "HOATDONG" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Thiết lập hoạt động ngoài khoá mới trong học kỳ</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">Khi tạo hoạt động mới, hệ thống sẽ tự động ánh xạ tiêu chí tương ứng và sinh điểm cộng đề xuất khi sinh viên tham gia.</p>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên hoạt động chính thức</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Giải vô địch bóng đá sinh viên UniHub 2026..."
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 text-slate-800 ${isDoan ? "focus:ring-rose-500/10 focus:border-rose-600" : (isHoi ? "focus:ring-sky-500/10 focus:border-sky-600" : "focus:ring-purple-500/10 focus:border-purple-600")}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mục tiêu chí áp dụng</label>
                    <select 
                      value={actCriteria} 
                      onChange={(e) => {
                        const targetRuleId = e.target.value;
                        setActCriteria(targetRuleId);
                        const matchRuleObj = activityCriteriaRules.find(r => r.criteriaId === targetRuleId);
                        if (matchRuleObj) {
                          setActPoints(matchRuleObj.points);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                    >
                      {activityCriteriaRules.length > 0 ? (
                        activityCriteriaRules.map(rule => (
                          <option key={rule.criteriaId} value={rule.criteriaId}>
                            {rule.criteriaId}: {rule.name} (+{rule.points}đ)
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="TC3.1">TC3.1: Hoạt động Thể thao/Học thuật (+5đ)</option>
                          <option value="TC3.2">TC3.2: Công tác Tổ chức sự kiện (+8đ)</option>
                          <option value="TC4.1">TC4.1: Cống hiến hiến máu xã hội (+10đ)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Số điểm cộng quy chuẩn</label>
                    <input 
                      type="number"
                      required
                      value={actPoints}
                      onChange={(e) => setActPoints(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Thời gian tổ chức (Ngày/Giờ)</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 2026-06-10 08:00"
                      value={actDate}
                      onChange={(e) => setActDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Địa điểm thực tế</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Sân vận động Phân hiệu..."
                      value={actLoc}
                      onChange={(e) => setActLoc(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mô tả tóm tắt nội dung</label>
                  <textarea 
                    rows={2}
                    placeholder="Mục đích của chương trình và tệp đối tượng khuyến khích..."
                    value={actDesc}
                    onChange={(e) => setActDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <button 
                  type="submit"
                  className={`px-4 py-2 text-white hover:cursor-pointer rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 ${themeBgActive}`}
                >
                  <PlusCircle size={14} />
                  <span>Hình thành hoạt động</span>
                </button>
              </form>
            </div>
          )}

          {/* SUBVIEW 3: ATTENDANCE SCANNER & GRADE APPROVAL */}
          {activeSubTab === "DIEMDANH" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Chọn hoạt động cần thực thi điểm danh:</span>
                </div>
                <select 
                  value={selectedActId || ""}
                  onChange={(e) => setSelectedActId(e.target.value)}
                  className={`text-xs font-bold px-2 py-1 bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-800 ${isDoan ? "focus:ring-rose-600/10" : (isHoi ? "focus:ring-sky-600/10" : "focus:ring-purple-600/10")}`}
                >
                  {orgActivities.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.status})</option>
                  ))}
                </select>
              </div>

              {selectedAct ? (
                <div className="space-y-4">
                  
                  {/* Event summary details */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-xs">
                      <div className="text-slate-400 uppercase font-mono text-[9px]">Điểm chuẩn</div>
                      <div className="font-extrabold text-slate-800 mt-1 font-mono">+{realActPoints}đ (Mục TC{selectedAct.criteriaId.substring(2)})</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-slate-400 uppercase font-mono text-[9px]">Trạng thái</div>
                      <div className="font-extrabold text-slate-800 mt-1 uppercase text-indigo-700">{selectedAct.status}</div>
                    </div>
                    <div className="text-xs">
                      <div className="text-slate-400 uppercase font-mono text-[9px]">Tổng lượt đăng ký</div>
                      <div className="font-extrabold text-slate-800 mt-1">{currentAttendance.length} sinh viên</div>
                    </div>
                  </div>

                  {/* Manual bulk addition / quick search */}
                  {selectedAct.status !== "COMPLETED" && (
                    <div className={`p-3.5 border rounded-xl space-y-2 ${isDoan ? "bg-rose-50/20 border-rose-100" : (isHoi ? "bg-sky-50/20 border-sky-100" : "bg-purple-50/20 border-purple-100")}`}>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${isDoan ? "text-rose-900" : (isHoi ? "text-sky-900" : "text-purple-900")}`}>Điểm danh khẩn cấp / can thiệp (Nhập Mã SV)</label>
                      <div className="flex gap-2">
                        <select 
                          value={bulkInput}
                          onChange={(e) => setBulkInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                        >
                          <option value="">-- Chọn sinh viên chưa đăng ký --</option>
                          {students.filter(s => !currentAttendance.some(att=>att.studentId === s.id)).map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.id}) - Lớp: {s.classId}</option>
                          ))}
                        </select>
                        <button 
                          onClick={handleBulkAttendanceAdd}
                          className={`px-3 py-1.5 text-white hover:cursor-pointer text-xs font-bold rounded-lg shrink-0 transition-colors ${themeBgActive}`}
                        >
                          Thêm danh sách
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Attendance List */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Danh sách đăng ký kiểm diện ({currentAttendance.length})</h5>
                      <span className="text-[10px] text-slate-400 font-mono">Roll-call checklist</span>
                    </div>

                    {currentAttendance.length === 0 ? (
                      <div className="p-8 border border-dashed rounded-xl text-center text-slate-400 text-xs">
                        Chưa có sinh viên nào đăng ký tham gia hoạt động này. Sử dụng bảng nhập khẩn cấp phía trên để nạp sĩ số.
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                        {currentAttendance.map(att => (
                          <div key={att.id} className="p-2.5 bg-white flex justify-between items-center text-xs">
                            <div>
                              <h5 className="font-extrabold text-slate-850">{att.studentName}</h5>
                              <p className="text-[9px] text-slate-400 font-mono">{att.studentId} • Lớp: {att.classId}</p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400">Vai trò:</span>
                                <select 
                                  value={att.role}
                                  onChange={(e) => updateAttendance(att.id, att.attended, e.target.value as any)}
                                  className="text-[10px] py-0.5 border rounded bg-slate-50 text-slate-850"
                                  disabled={selectedAct.status === "COMPLETED"}
                                >
                                  <option value="MEM">Thành viên</option>
                                  <option value="BTC">Ban tổ chức</option>
                                  <option value="SUPPORTER">Tình nguyện viên</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="checkbox"
                                  checked={att.attended}
                                  onChange={(e) => updateAttendance(att.id, e.target.checked)}
                                  disabled={selectedAct.status === "COMPLETED"}
                                  className={`w-4 h-4 rounded border-slate-300 rounded-lg hover:cursor-pointer ${isDoan ? "text-rose-600 focus:ring-rose-500" : (isHoi ? "text-sky-600 focus:ring-sky-500" : "text-purple-600 focus:ring-purple-500")}`}
                                />
                                <span className="text-[10px] font-bold text-slate-600">{att.attended ? "CÓ MẶT" : "VẮNG"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Finalize confirmation */}
                  {selectedAct.status !== "COMPLETED" && (
                    <div className="pt-4 border-t border-slate-150 text-right">
                      <button 
                        onClick={() => updateActivityStatus(selectedAct.id, "COMPLETED")}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:cursor-pointer rounded-lg text-xs font-bold shadow-md transition-colors"
                      >
                        Chốt danh sách & Tự động đẩy điểm rèn luyện
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-12 border border-dashed rounded-xl text-center text-slate-400 text-xs">
                  Hiện tại không có sự kiện nào cần tích hợp điểm danh. Hãy chọn mục "Khai báo hoạt động mới" để đưa danh sách vào chương trình.
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 p-3.5 border-t border-slate-100 shrink-0 text-center rounded-b-xl">
            <span className="text-[9px] text-slate-400 font-mono">
              Phân hệ Tổ chức chỉ chịu trách nhiệm xác thực sự vụ có mặt. Quyết định duyệt cuối kỳ do GVCN nắm giữ.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
