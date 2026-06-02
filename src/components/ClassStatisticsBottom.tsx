import React, { useState } from "react";
import { useUniHub } from "../state";
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle,
  Search,
  X,
  Clock
} from "lucide-react";

export const ClassStatisticsBottom: React.FC = () => {
  const { 
    students, 
    dailyAttendance 
  } = useUniHub();

  const [filterClass, setFilterClass] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  // Group students dynamically to find all unique classes across UniHub
  const classes = Array.from(new Set(students.map(s => s.classId)));

  // Filtered attendance reports
  const filteredReports = dailyAttendance.filter(da => {
    const classMatches = filterClass === "ALL" || da.classId.toLowerCase() === filterClass.toLowerCase();
    const dateMatches = !filterDate || da.date === filterDate;
    return classMatches && dateMatches;
  });

  // Calculate quick metrics
  let totalStudsSum = 0;
  let presentCountSum = 0;
  let totalUnexcusedAbs = 0;
  
  filteredReports.forEach(r => {
    totalStudsSum += r.totalStudents;
    presentCountSum += r.presentCount;
    totalUnexcusedAbs += r.absentees.filter(a => a.type === "KHÔNG_PHÉP").length;
  });

  const overallRate = totalStudsSum > 0 ? Math.round((presentCountSum / totalStudsSum) * 100) : 100;

  // Let's assume today is "2026-05-24" based on system states/seed data date
  const todayStr = "2026-05-24";
  const reportedCidsToday = dailyAttendance.filter(da => da.date === todayStr).map(da => da.classId);
  const missingCidsToday = classes.filter(cid => !reportedCidsToday.includes(cid));

  return (
    <div className="bg-white mt-2 rounded-2xl border border-slate-200/80 shadow-md p-6 max-w-7xl mx-auto space-y-6" id="class-statistics-bottom">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-600 rounded-xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>Trung Tâm Giám Sát Sĩ Số Toàn Phân Hiệu</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold font-mono border border-emerald-200">
                Live Monitor
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Theo dõi và rà soát tình hình nộp sĩ số, chuyên cần, nghỉ có học hoặc vắng không phép theo thời gian thực của tất cả cụm lớp khoa trực thuộc.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        <div className="md:col-span-5 relative">
          <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Mã Lớp Học</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-805 font-bold uppercase focus:outline-indigo-500"
            >
              <option value="ALL">-- Tất Cả Các Lớp ({classes.length}) --</option>
              {classes.map(cid => (
                <option key={cid} value={cid}>Lớp {cid}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Ngày Báo Cáo</label>
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full text-xs px-3 py-1.8 border border-slate-200 rounded-lg bg-white text-slate-805 focus:outline-indigo-500 placeholder:text-slate-350"
            />
          </div>
        </div>

        <div className="md:col-span-3 flex justify-end self-end">
          {(filterClass !== "ALL" || filterDate) ? (
            <button
              onClick={() => {
                setFilterClass("ALL");
                setFilterDate("");
              }}
              className="w-full py-1.8 border bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <X size={13} />
              <span>Xóa bộ lọc</span>
            </button>
          ) : (
            <div className="text-[10px] text-slate-400 font-semibold italic text-right hidden md:block">
              Sử dụng các bộ lọc để lọc theo lớp hoặc ngày học
            </div>
          )}
        </div>

      </div>

      {/* ATTENDANCE SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] font-bold text-slate-450 uppercase block">Số Nhật Ký Khai Báo</span>
          <span className="text-xl font-mono font-black text-slate-900 block">{filteredReports.length} bản báo cáo</span>
        </div>
        
        <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] font-bold text-slate-450 uppercase block">Tỷ Lệ Hiện Diện Bình Quân</span>
          <span className="text-xl font-mono font-black text-emerald-600 block">
            {overallRate}%
          </span>
        </div>

        <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
          <span className="text-[9px] font-bold text-slate-450 uppercase block">Số Lượt Vắng Không Phép</span>
          <span className="text-xl font-mono font-black text-rose-600 block">
            {totalUnexcusedAbs} lượt
          </span>
        </div>

        <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center flex flex-col justify-center space-y-1">
          <span className="text-[9px] font-bold text-slate-450 uppercase block">Trạng thái ngày hiện hành</span>
          <span className="text-xs font-sans font-black text-indigo-905 text-indigo-900 block">
            Ngày {todayStr}
          </span>
          <span className="text-[9px] font-mono text-slate-500 block leading-tight mt-0.5">
            {missingCidsToday.length === 0 ? "100% Các lớp đã nộp" : `Còn ${missingCidsToday.length} lớp chưa nộp sĩ số`}
          </span>
        </div>
      </div>

      {/* ALERT BOX FOR MISSING SUBMISSIONS TODAY */}
      {missingCidsToday.length > 0 && (
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2 font-sans">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Nhắc nhở nộp sĩ số:</span> Ngày <span className="font-mono font-bold">{todayStr}</span> hiện còn các cụm lớp chưa chốt nộp báo cáo sĩ số nề nếp: <span className="font-mono font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">{missingCidsToday.join(", ")}</span>. Đề nghị các Ban cán sự khẩn trương hoàn thành báo cáo sĩ số ngày.
          </div>
        </div>
      )}

      {/* DAILY ATTENDANCE FEED */}
      <div className="space-y-4">
        <div className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5 font-sans">
          <ClipboardList size={14} className="text-emerald-600" />
          <span>Nhật ký báo cáo sĩ số chi tiết từ các lớp ({filteredReports.length})</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-bold">Không tìm thấy bản báo cáo sĩ số nào phù hợp.</p>
            <p className="text-[10px] text-slate-400 mt-1">Vui lòng thay đổi cấu hình bộ lọc tuyển chọn phía trên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredReports.map(da => {
              const rate = da.totalStudents > 0 ? Math.round((da.presentCount / da.totalStudents) * 100) : 100;
              let progressColor = "bg-emerald-500";
              if (rate < 80) progressColor = "bg-rose-500";
              else if (rate < 100) progressColor = "bg-amber-500";

              return (
                <div key={da.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-350 hover:shadow-xs transition-all">
                  
                  <div>
                    {/* Card Title Header */}
                    <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase">
                          LỚP {da.classId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1.5 flex items-center gap-1">
                          <Calendar size={11} />
                          <span>Ngày học: {da.date}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          rate === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          Sĩ số: {da.presentCount}/{da.totalStudents} ({rate}%)
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          Thời điểm nộp: {new Date(da.reportedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar visual */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                        <span>ĐỘ LẤP ĐẦY HIỆN DIỆN</span>
                        <span>{rate}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${progressColor}`} style={{ width: `${rate}%` }} />
                      </div>
                    </div>

                    {/* Absentees nested section */}
                    <div className="mt-4 space-y-2">
                      <span className="text-[9px] font-bold text-slate-450 uppercase block font-sans">Chi tiết vắng học:</span>
                      
                      {da.absentees.length === 0 ? (
                        <div className="bg-emerald-50/40 p-2 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5 rounded-lg">
                          <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                          <span>Vở sạch chữ đẹp, sĩ số hoàn hảo: 100% đi học đủ!</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {da.absentees.map((abs, aidx) => (
                            <div key={aidx} className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col sm:flex-row justify-between sm:items-center text-[10.5px] gap-1">
                              <div>
                                <span className="font-bold text-slate-800">{abs.studentName}</span>
                                <span className="text-slate-400 text-[9px] font-mono ml-1">({abs.studentId})</span>
                                {abs.reason && (
                                  <span className="text-slate-500 block text-[9.5px] mt-0.5 italic leading-tight">
                                    Lý do: {abs.reason}
                                  </span>
                                )}
                              </div>

                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 text-center ${
                                abs.type === "KHÔNG_PHÉP" 
                                  ? "bg-rose-50 text-rose-705 text-rose-700 border border-rose-150" 
                                  : "bg-amber-50 text-amber-705 text-amber-700 border border-amber-150"
                              }`}>
                                {abs.type === "KHÔNG_PHÉP" ? "Không phép" : "Có xin phép"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* footer of report card */}
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center bg-slate-50 p-2 rounded-lg font-medium leading-none font-sans">
                    <span>Cán sự nộp: <span className="font-bold text-slate-700">{da.reportedBy}</span></span>
                    <span className="font-mono text-[9px] text-slate-405">ID: #{da.id}</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
