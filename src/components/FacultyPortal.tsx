import React, { useState } from "react";
import { useUniHub } from "../state";
import { 
  Building2, 
  Lock, 
  CheckCircle, 
  FileSpreadsheet, 
  BarChart2, 
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  Megaphone,
  Search
} from "lucide-react";

export const FacultyPortal: React.FC = () => {
  const { 
    currentUser, 
    results, 
    facultyReviews, 
    lockFacultyData, 
    students,
    classReviews,
    activePortletTab,
    setActivePortletTab,
    activities,
    createActivity,
    updateActivityStatus,
    addBulkAttendance,
    attendance,
    selectedSemesterId
  } = useUniHub();

  const activeTab = (activePortletTab as "STAT" | "LOCKS" | "EVENTS") || "STAT";

  const facultyId = currentUser?.targetId || "K-CNTT";
  
  // Find Faculty review status
  const facReviewInfo = facultyReviews.find(fr => fr.facultyId === facultyId);
  const isFacultyLocked = !!facReviewInfo?.locked;

  // Filter students in the faculty
  const facultyStudents = students.filter(s => s.facultyId === facultyId);
  const studentIds = facultyStudents.map(s => s.id);
  const facultyResults = results.filter(r => studentIds.includes(r.studentId) && r.periodId === selectedSemesterId);

  // Compute stat matrices
  const totalInFac = facultyResults.length;
  const averagePoints = totalInFac > 0 
    ? Math.round(facultyResults.reduce((acc, curr) => acc + curr.totalPoints, 0) / totalInFac)
    : 0;

  const countByGrade = (g: string) => facultyResults.filter(r => r.grade === g).length;
  
  const xsCount = countByGrade("XUẤT SẮC");
  const totCount = countByGrade("TỐT");
  const khaCount = countByGrade("KHÁ");
  const tbCount = countByGrade("TRUNG BÌNH");
  const yeuCount = countByGrade("YẾU") + countByGrade("KÉM");

  // Group classes under faculty
  const classes = Array.from(new Set(facultyStudents.map(s => s.classId)));

  const handleLockFaculty = () => {
    lockFacultyData(facultyId, "Trưởng Khoa CNTT");
    alert(`Khoa CNTT đã khoá sổ nộp điểm rèn luyện chính thức của toàn bộ các lớp trực thuộc lên Cổng CTHSSV trường.`);
  };

  // State variables for Event Broadcaster
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCriteria, setNewEventCriteria] = useState("TC3");
  const [newEventPoints, setNewEventPoints] = useState(2);
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");

  const [selectedActivityIdForAttendance, setSelectedActivityIdForAttendance] = useState<string | null>(null);
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  const [attendedStudentIds, setAttendedStudentIds] = useState<string[]>([]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate || !newEventLocation.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    createActivity({
      title: newEventTitle,
      criteriaId: newEventCriteria,
      points: newEventPoints,
      dateTime: newEventDate,
      location: newEventLocation,
      description: newEventDesc,
      registrationOpen: true,
      orgId: facultyId
    });

    alert(`Đã phát động thành công sự kiện ngoại khóa: ${newEventTitle}`);
    
    // Clear form
    setNewEventTitle("");
    setNewEventCriteria("TC3");
    setNewEventPoints(2);
    setNewEventDate("");
    setNewEventLocation("");
    setNewEventDesc("");
  };

  const handleSyncAttendance = () => {
    if (!selectedActivityIdForAttendance) return;
    
    addBulkAttendance(selectedActivityIdForAttendance, attendedStudentIds);
    updateActivityStatus(selectedActivityIdForAttendance, "COMPLETED");

    alert(`Đã điểm danh và đồng bộ cộng điểm rèn luyện thành công cho ${attendedStudentIds.length} sinh viên!`);
    
    setSelectedActivityIdForAttendance(null);
    setAttendedStudentIds([]);
    setSearchStudentQuery("");
  };

  return (
    <div className="space-y-6" id="faculty-portal-container">
      {/* Bio Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 uppercase tracking-wider">
            VĂN PHÒNG KHOA CÔNG NGHỆ THÔNG TIN
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Bàn Điều Hành & Thẩm Thư Cấp Khoa</h2>
          <p className="text-xs text-slate-505 mt-1 italic">
            Kiểm soát tổng số, kiểm toán tỷ lệ xếp loại, rà soát tiến trình ký quyết định của các GVCN lớp và khóa sổ nộp ban giám hiệu.
          </p>
        </div>

        {isFacultyLocked ? (
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm shrink-0">
            <CheckCircle size={15} />
            <span>Đã Khoá Sổ & Chuyển Admin</span>
          </div>
        ) : (
          <button 
            onClick={handleLockFaculty}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:cursor-pointer shrink-0 animate-pulse"
          >
            <Lock size={14} />
            <span>Ký Khóa Toàn Khoa</span>
          </button>
        )}
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 size={12} />
            Lớp liên đới
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">{classes.length}</div>
          <div className="text-[10px] text-slate-450 mt-1">Lớp K20-CNTT, K21-CNTT...</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp size={12} />
            Điểm trung bình
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono tracking-tight mt-1">{averagePoints} / 100</div>
          <div className="text-[10px] text-slate-455 mt-1">Tổng điểm trung bình toàn khoa</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Award size={12} />
            Loại Giỏi & Xuất Sắc
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight mt-1">
            {xsCount + totCount} <span className="text-slate-400 text-xs font-bold">({Math.round(((xsCount+totCount)/totalInFac)*100)}%)</span>
          </div>
          <div className="text-[10px] text-slate-455 mt-1">Đủ chuẩn xét học bổng thi đua</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle size={12} className="text-amber-500" />
            Loại Yếu Kém
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tracking-tight mt-1">
            {yeuCount} <span className="text-slate-400 text-xs font-bold">({Math.round((yeuCount/totalInFac)*100)}%)</span>
          </div>
          <div className="text-[10px] text-slate-455 mt-1">Cần có hoạt động hỗ trợ học kỳ sau</div>
        </div>
      </div>

      {/* Action Pane - Full Width layout */}
      <div className="w-full bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[440px] flex flex-col justify-between">
        
        {/* TAB 1: MODEL EXPORT SHEET & BEAUTIFUL CUSTOM GRAPHS */}
        {activeTab === "STAT" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
              <div>
                <h4 className="text-xs font-bold text-indigo-900 uppercase">Xuất Biểu Mẫu Thống Kê Điểm Rèn Luyện Cấp Khoa</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Xuất file Excel tổng hợp chính xác điểm của {facultyResults.length} sinh viên để lưu trữ hồ sơ Phân hiệu.</p>
              </div>
              <button 
                onClick={() => alert("Hệ thống đã chuẩn bị tệp tin Excel khoa_cntt_ren_luyen.xlsx xuất ra thiết bị của bạn.")}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg hover:cursor-pointer transition-colors flex items-center gap-1 shrink-0"
              >
                <FileSpreadsheet size={13} />
                <span>Xuất tệp Excel</span>
              </button>
            </div>

            {/* Custom Graph visually pairing bars */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Biểu tỷ lệ xếp loại rèn luyện trực quan của Khoa</h5>
              
              <div className="space-y-3 pt-1">
                {/* Xuat sac bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Xếp loại XUẤT SẮC (từ 90 điểm)</span>
                    <span className="font-mono text-slate-700">{xsCount} sinh viên</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${(xsCount / totalInFac) * 100}%` }}></div>
                  </div>
                </div>

                {/* Tot bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Xếp loại TỐT (từ 80 điểm)</span>
                    <span className="font-mono text-slate-700">{totCount} sinh viên</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all rounded-full" style={{ width: `${(totCount / totalInFac) * 100}%` }}></div>
                  </div>
                </div>

                {/* Kha bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Xếp loại KHÁ (từ 70 điểm)</span>
                    <span className="font-mono text-slate-700">{khaCount} sinh viên</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all rounded-full" style={{ width: `${(khaCount / totalInFac) * 100}%` }}></div>
                  </div>
                </div>

                {/* Trung Binh bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Xếp loại TRUNG BÌNH (từ 50 điểm)</span>
                    <span className="font-mono text-slate-700">{tbCount} sinh viên</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all rounded-full" style={{ width: `${(tbCount / totalInFac) * 100}%` }}></div>
                  </div>
                </div>

                {/* Yeu Kem bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span>Xếp loại YẾU / KÉM (dưới 50 điểm)</span>
                    <span className="font-mono text-slate-700">{yeuCount} sinh viên</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 transition-all rounded-full" style={{ width: `${(yeuCount / totalInFac) * 100}%` }}></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRESS LOCKING CONTROLLER */}
        {activeTab === "LOCKS" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiến độ ký duyệt nộp danh sách điểm của các Lớp</h4>
            
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-xs">
              {classes.map(cId => {
                const rev = classReviews.find(r => r.classId === cId);
                const isBCS = !!rev?.representativeApproved;
                const isGVCN = !!rev?.adviserApproved;
                
                return (
                  <div key={cId} className="p-4 bg-white hover:bg-slate-50/20 transition-colors flex justify-between items-center flex-wrap gap-4 text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-900">Chi hội Lớp: {cId}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Khoa Công nghệ thông tin liên kết</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Ban cán sự:</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider rounded border leading-none ${isBCS ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-slate-50 text-slate-400'}`}>
                          {isBCS ? "ĐÃ DUYỆT" : "CHƯA XN"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">Giáo viên chủ nhiệm:</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider rounded border leading-none ${isGVCN ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-slate-50 text-slate-400'}`}>
                          {isGVCN ? "ĐÃ DUYỆT" : "CHƯA KÝ"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Faculty Event Broadcaster & Automatic Points Sync */}
        {activeTab === "EVENTS" && (
          <div className="space-y-6 text-left">
            
            {/* Grid Form & List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form phát động */}
              <div className="lg:col-span-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="border-b pb-2">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1.5">
                    <Megaphone size={14} className="text-indigo-650" />
                    <span>Phát động hoạt động cấp Khoa</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tạo sự kiện ngoại khóa và công bố để sinh viên đăng ký.</p>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs text-slate-700">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-450 uppercase block mb-1">Tên hoạt động *</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Chiến dịch mùa hè xanh Khoa CNTT 2026..."
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-450 uppercase block mb-1">Tiêu chí cộng điểm</label>
                      <select
                        value={newEventCriteria}
                        onChange={(e) => setNewEventCriteria(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value="TC3">TC3 - Tham gia CLB / Phong trào</option>
                        <option value="TC4">TC4 - Ý thức trách nhiệm cộng đồng</option>
                        <option value="TC5">TC5 - Gương sáng đặc thù</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] font-bold text-slate-455 block mb-1">Số điểm cộng</label>
                      <select
                        value={newEventPoints}
                        onChange={(e) => setNewEventPoints(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value={1}>+1đ (Hoạt động nhỏ)</option>
                        <option value={2}>+2đ (Sự kiện Khoa thường niên)</option>
                        <option value={3}>+3đ (Chiến dịch tình nguyện lớn)</option>
                        <option value={5}>+5đ (Đạt giải thưởng thi đấu)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-450 uppercase block mb-1">Ngày tổ chức *</label>
                      <input 
                        type="date" 
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div>
                      <label className="text-[9.5px] font-bold text-slate-450 uppercase block mb-1">Địa điểm *</label>
                      <input 
                        type="text" 
                        placeholder="Hội trường A, Sân bóng..."
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        className="w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold text-slate-450 uppercase block mb-1">Mô tả chi tiết</label>
                    <textarea 
                      placeholder="Nội dung, kế hoạch chuẩn bị..."
                      rows={3}
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-colors cursor-pointer text-center border-0"
                  >
                    Phát động & Đăng tải thông tin
                  </button>
                </form>
              </div>

              {/* Danh sách hoạt động */}
              <div className="lg:col-span-7 space-y-4">
                <div className="border-b pb-2">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase">Danh sách chiến dịch ngoại khóa cấp Khoa</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Quản lý và thực hiện điểm danh đồng bộ điểm rèn luyện.</p>
                </div>

                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {activities.filter(a => a.orgId === facultyId).length === 0 ? (
                    <p className="text-xs italic text-slate-400 text-center py-8">Chưa phát động chiến dịch nào trong học kỳ này.</p>
                  ) : (
                    activities.filter(a => a.orgId === facultyId).map(act => {
                      const totalAttended = attendance.filter(att => att.activityId === act.id && att.attended).length;
                      
                      return (
                        <div key={act.id} className="bg-slate-50 p-4 border rounded-2xl flex flex-col justify-between gap-3 text-xs border-slate-205">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-[13px]">{act.title}</h5>
                              <p className="text-[10.5px] text-slate-500 mt-1 italic">{act.description}</p>
                              
                              <div className="flex flex-wrap gap-2.5 mt-2.5 font-mono text-[10px] text-slate-400">
                                <span>Ngày: {act.dateTime}</span>
                                <span>•</span>
                                <span>Địa điểm: {act.location}</span>
                                <span>•</span>
                                <span className="font-bold text-indigo-700">Cộng: {act.points}đ vào {act.criteriaId}</span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${act.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : act.status === "ONGOING" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse"}`}>
                              {act.status === "COMPLETED" ? "Đã chốt" : act.status === "ONGOING" ? "Đang diễn ra" : "Đang tuyển"}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-150">
                            <span className="font-semibold text-slate-500 text-[10.5px]">
                              Số SV đã cộng điểm: <strong className="text-slate-900 font-mono">{totalAttended} SV</strong>
                            </span>

                            {act.status !== "COMPLETED" && (
                              <button
                                onClick={() => {
                                  setSelectedActivityIdForAttendance(act.id);
                                  // Pre-select students already registered if any
                                  const registeredIds = attendance.filter(att => att.activityId === act.id).map(att => att.studentId);
                                  setAttendedStudentIds(registeredIds);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors border-0"
                              >
                                Điểm danh & Đồng bộ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        <div className="bg-slate-50 p-3.5 border-t border-slate-100 shrink-0 text-center rounded-b-xl mt-4">
          <span className="text-[9px] text-slate-400 font-mono">
            Khoa chỉ xem và rà soát nộp dữ liệu của các lớp học sinh liên đới, không sửa chữa trực tiếp kết quả gốc của Giáo viên.
          </span>
        </div>

      </div>

      {/* MODAL: EVENT ATTENDANCE & SYNC */}
      {selectedActivityIdForAttendance && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto flex flex-col justify-between">
            
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xs font-black text-slate-805 uppercase font-mono">Điểm danh & Đồng bộ điểm ngoại khóa</h3>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                  Hoạt động: {activities.find(a => a.id === selectedActivityIdForAttendance)?.title}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedActivityIdForAttendance(null);
                  setAttendedStudentIds([]);
                }}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold transition-colors"
              >
                Đóng
              </button>
            </div>

            {/* Search and List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="relative">
                <Search className="absolute left-3 top-2 text-slate-400" size={13} />
                <input 
                  type="text"
                  placeholder="Tìm sinh viên trong Khoa..."
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                />
              </div>

              <div className="border border-slate-150 rounded-xl max-h-[300px] overflow-y-auto divide-y text-slate-705">
                {facultyStudents
                  .filter(s => s.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) || s.id.toLowerCase().includes(searchStudentQuery.toLowerCase()))
                  .map(student => {
                    const isChecked = attendedStudentIds.includes(student.id);
                    
                    return (
                      <label key={student.id} className="p-3 flex justify-between items-center hover:bg-slate-50/50 cursor-pointer">
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-slate-900">{student.name}</span>
                          <span className="font-mono text-[9.5px] text-slate-400">{student.id} | Lớp: {student.classId}</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setAttendedStudentIds(attendedStudentIds.filter(id => id !== student.id));
                            } else {
                              setAttendedStudentIds([...attendedStudentIds, student.id]);
                            }
                          }}
                          className="rounded cursor-pointer w-4 h-4 accent-indigo-650"
                        />
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedActivityIdForAttendance(null);
                  setAttendedStudentIds([]);
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-center cursor-pointer text-xs transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSyncAttendance}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center cursor-pointer text-xs shadow-sm transition-colors border-0"
              >
                Xác nhận & Đồng bộ Điểm ({attendedStudentIds.length} SV)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
