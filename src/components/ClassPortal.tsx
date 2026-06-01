import React, { useState } from "react";
import { useUniHub } from "../state";
import { Users, CheckCircle, Clock, Calendar, Trash2, Search } from "lucide-react";

export const ClassPortal: React.FC = () => {
  const { 
    currentUser, 
    students, 
    dailyAttendance,
    reportDailyAttendance
  } = useUniHub();

  const classId = currentUser?.targetId || "K20-CNTT";
  
  // Get classmates
  const myClassmatesArr = students.filter(s => s.classId === classId);

  // Daily Attendance formulation states
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [draftAbsentees, setDraftAbsentees] = useState<{ studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[]>([]);

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
    fields: Partial<{ type: "PHÉP" | "KHÔNG_PHÉP"; reason: string }>
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

    alert(`Đã gửi báo cáo sĩ số ngày ${reportDate} thành công!`);
    setDraftAbsentees([]);
  };

  // Class attendance histories
  const classAttendances = dailyAttendance.filter(da => da.classId === classId);
  
  return (
    <div className="space-y-6" id="class-portal-container">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-250 uppercase tracking-wider">
            CỔNG BAN CÁN SỰ LỚP & ĐOÀN CHI BỘ
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Phân hệ Báo cáo Sĩ số Lớp {classId}</h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            Nơi theo dõi và báo cáo sĩ số, chuyên cần lớp học hàng ngày gửi lên Phòng CTHSSV để đồng bộ giám sát nề nếp.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Info / Right Attendance reporting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Left Sidebar / Info Panel */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-150 shadow-sm space-y-4 lg:h-fit" id="bcs-info-panel">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Cán sự phụ trách</span>
            <span className="text-xs font-bold text-slate-800">{currentUser?.name || "Lớp trưởng"}</span>
          </div>
          
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Nhiệm vụ chính</span>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Thực hiện kiểm đếm sĩ số, báo cáo chuyên cần đi học và lý do vắng nghỉ của sinh viên lớp hàng ngày. Thông tin sĩ số sẽ được gửi trực tiếp tới hệ thống Phòng CTHSSV và Văn phòng khoa.
            </p>
          </div>
        </div>

        {/* Right main view content container - Sỹ số và điểm danh */}
        <div className="lg:col-span-9 space-y-6" id="class-attendance-workarea">
          
          {/* Class metrics overview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông Số Sĩ Số Tổng Quát</h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-slate-800 font-mono" id="official-size">{myClassmatesArr.length}</div>
                <div className="text-[10px] text-slate-450 mt-1">Sĩ Số Chính Thức</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xl font-black text-emerald-600 font-mono" id="submitted-reports-count">
                  {classAttendances.length}
                </div>
                <div className="text-[10px] text-slate-450 mt-1">Lượt Đã Báo Cáo Sĩ Số</div>
              </div>
            </div>
          </div>

          {/* ATTENDANCE REPORTING ZONE */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b pb-2 flex justify-between items-center">
              <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 font-sans">
                <Calendar size={13} className="text-emerald-600" />
                Lập báo cáo sĩ số nề nếp lớp học theo ngày
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono text-slate-400 font-bold block mb-1">CHỌN NGÀY BÁO CÁO SĨ SỐ</label>
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-205 rounded-lg font-mono focus:outline-emerald-500 focus:border-emerald-500 inline-block bg-white"
                  id="attendance-date"
                />
              </div>

              {/* Form to add multiple absentees with criteria */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative">
                <span className="text-[10px] font-black text-slate-500 uppercase block font-sans">Tìm kiếm & Chọn sinh viên vắng lớp:</span>
                
                {/* Search input */}
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Nhập tên hoặc mã SV để tìm và báo vắng nhanh..."
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pl-8 border border-slate-200 rounded-lg bg-white focus:outline-emerald-500 focus:border-emerald-500 inline-block"
                    id="member-search"
                  />
                  <Search size={13} className="absolute left-2.5 top-3.5 text-slate-400" />
                  {attendanceSearch && (
                    <button 
                      type="button"
                      onClick={() => setAttendanceSearch("")}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
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
                              {isAbsent ? "Đã báo vắng (-)" : "+ Chọn báo vắng"}
                            </span>
                          </div>
                        );
                      })}
                    {myClassmatesArr.filter(s => 
                      s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                      s.id.toLowerCase().includes(attendanceSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-xs text-slate-400 italic text-center">Không tìm thấy sinh viên tương ứng</div>
                    )}
                  </div>
                )}

                {/* Quick grid of all classmates to click directly */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-450 font-bold block uppercase font-sans">Hoặc bấm chọn trực tiếp thành viên vắng:</label>
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 bg-white border border-slate-200 rounded-lg">
                    {myClassmatesArr.map(s => {
                      const isAbsent = draftAbsentees.some(da => da.studentId === s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleStudentAbsentee(s.id, s.name)}
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all hover:scale-[1.01] flex items-center gap-1.5 cursor-pointer ${
                            isAbsent 
                              ? "bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs whitespace-nowrap" 
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 whitespace-nowrap"
                          }`}
                          id={`absent-toggle-${s.id}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isAbsent ? "bg-rose-600 animate-pulse" : "bg-slate-350"}`} />
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Staging of Draft Absentees with details for each */}
              {draftAbsentees.length > 0 ? (
                <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                    <span className="text-[10px] font-black text-slate-700 uppercase font-sans">
                      Chi tiết và lý do của {draftAbsentees.length} thành viên vắng hôm nay
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setDraftAbsentees([])}
                      className="text-[9px] hover:text-red-600 font-bold text-slate-450 uppercase cursor-pointer"
                    >
                      Xóa trắng danh sách vắng
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {draftAbsentees.map((da) => (
                      <div key={da.studentId} className="bg-white p-3 rounded-xl border border-slate-150 shadow-xs space-y-2 relative">
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeAbsenteeFromDraft(da.studentId)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-red-500 p-0.5 rounded-md hover:bg-slate-50 cursor-pointer"
                          title="Hủy báo vắng"
                        >
                          <Trash2 size={13} />
                        </button>

                        <div>
                          <span className="font-extrabold text-slate-800 text-xs">{da.studentName}</span>
                          <span className="text-slate-400 text-[10px] font-mono ml-1.5">({da.studentId})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] text-slate-400 font-bold block mb-0.5">PHÂN LOẠI VẮNG NGHI</label>
                            <select
                              value={da.type}
                              onChange={(e) => updateDraftAbsenteeField(da.studentId, { type: e.target.value as any })}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="KHÔNG_PHÉP">Vắng Không phép</option>
                              <option value="PHÉP">Vắng Có phép (Đã xin bổ phép)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] text-slate-400 font-bold block mb-0.5 font-sans">LÝ DO CHI TIẾT</label>
                            <input 
                              type="text"
                              placeholder="Nhập lý do (ví dụ: bị ốm, bận việc gia đình...)"
                              value={da.reason || ""}
                              onChange={(e) => updateDraftAbsenteeField(da.studentId, { reason: e.target.value })}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-350 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-emerald-50/20 border border-emerald-150 rounded-lg text-center">
                  <p className="text-xs text-emerald-800 font-extrabold font-sans">100% LỚP ĐI HỌC VÀ HIỆN DIỆN ĐỦ</p>
                  <p className="text-[10px] text-slate-400 italic mt-0.5 font-sans">Hiện diện đầy đủ cả lớp. Bấm vào nút bên dưới để chốt gửi báo cáo hiện diện đủ.</p>
                </div>
              )}

              <button
                type="button"
                onClick={submitDailyRollCall}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:cursor-pointer transition-all shadow-md font-sans"
                id="btn-report-attendance"
              >
                <CheckCircle size={14} />
                <span>Hoàn tất gửi báo cáo sĩ số ngày {reportDate}</span>
              </button>

            </div>
          </div>

          {/* HISTORIES DAILY ROLLCALL */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5">
            <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 font-sans">
              <Clock size={13} className="text-indigo-600" />
              Lịch sử nhật ký sĩ số đã nộp của Lớp
            </span>

            {classAttendances.length === 0 ? (
              <p className="text-[10.5px] text-slate-400 italic">Chưa ghi nhận lịch sử báo cáo sĩ số nào cho học kỳ hiện hành.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto divide-y divide-slate-150 pr-1">
                {classAttendances.map(da => (
                  <div key={da.id} className="pt-2 text-[11px] first:pt-0">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span className="font-mono text-slate-600">Ngày học: {da.date}</span>
                      <span className="text-indigo-600 font-bold">Hiện diện: {da.presentCount}/{da.totalStudents}</span>
                    </div>
                    {da.absentees.length > 0 ? (
                      <div className="mt-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                        {da.absentees.map((abs, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-1 rounded-sm border border-slate-50 shadow-2xs">
                            <span className="font-medium text-slate-750">● {abs.studentName} ({abs.studentId})</span>
                            <div className="flex items-center gap-1.5">
                              {abs.reason && <span className="text-[9px] text-slate-400 italic">Lý do: {abs.reason}</span>}
                              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black ${abs.type === "KHÔNG_PHÉP" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                                {abs.type === "KHÔNG_PHÉP" ? "Không phép" : "Có phép"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-700 font-medium mt-1 inline-block bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        Hiện diện trọn vẹn 100% không vắng.
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 tracking-tight text-right mt-1.5">Người lập báo cáo: {da.reportedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
