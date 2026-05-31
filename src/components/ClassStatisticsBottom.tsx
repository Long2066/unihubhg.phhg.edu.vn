import React, { useState } from "react";
import { useUniHub } from "../state";
import { UserRole } from "../types";
import { 
  FileSpreadsheet, 
  Award, 
  Users, 
  Upload, 
  Download, 
  CheckCircle, 
  Layers, 
  Info,
  Sliders,
  Sparkles,
  Calendar,
  Filter,
  AlertTriangle,
  ClipboardList,
  Check,
  X,
  Search
} from "lucide-react";

export const ClassStatisticsBottom: React.FC = () => {
  const { 
    students, 
    results, 
    groupCriteria, 
    importGroupCriteria,
    dailyAttendance,
    currentUser 
  } = useUniHub();

  const [activeTab, setActiveTab] = useState<"THI_DUA" | "SI_SO">("THI_DUA");
  const [filterClass, setFilterClass] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [importJsonText, setImportJsonText] = useState("");
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // Group students dynamically to find all unique classes across UniHub
  const classes = Array.from(new Set(students.map(s => s.classId)));

  // Calculate stats per class
  const classStats = classes.map(classId => {
    const classStudents = students.filter(s => s.classId === classId);
    const classResults = results.filter(r => r.classId === classId);
    
    const total = classStudents.length;
    if (total === 0) {
      return {
        classId,
        total: 0,
        xs: 0, xsPct: 0,
        good: 0, goodPct: 0,
        fair: 0, fairPct: 0,
        tb: 0, tbPct: 0,
        weak: 0, weakPct: 0,
        collectiveRating: "Chưa có kết quả"
      };
    }

    const xs = classResults.filter(r => r.grade === "XUẤT SẮC").length;
    const good = classResults.filter(r => r.grade === "TỐT").length;
    const fair = classResults.filter(r => r.grade === "KHÁ").length;
    const tb = classResults.filter(r => r.grade === "TRUNG BÌNH").length;
    const weak = classResults.filter(r => r.grade === "YẾU" || r.grade === "KÉM").length;

    const xsPct = Math.round((xs / total) * 100);
    const goodPct = Math.round((good / total) * 100);
    const fairPct = Math.round((fair / total) * 100);
    const tbPct = Math.round((tb / total) * 100);
    const weakPct = Math.round((weak / total) * 100);

    // Dynamic Collective Group Evaluation based on imported Faculty Criteria
    const xsAndGoodPct = xsPct + goodPct;
    const badPct = weakPct;

    let collectiveRating = "Tập thể Trung bình/Đạt yêu cầu";
    
    // Sort criteria by highest requirements (e.g. minExcellentPercent descending)
    const sortedCriteria = [...groupCriteria].sort((a, b) => b.minExcellentPercent - a.minExcellentPercent);
    const matched = sortedCriteria.find(crit => xsAndGoodPct >= crit.minExcellentPercent && badPct <= crit.maxWeakPercent);
    if (matched) {
      collectiveRating = matched.name;
    }

    return {
      classId,
      total,
      xs, xsPct,
      good, goodPct,
      fair, fairPct,
      tb, tbPct,
      weak, weakPct,
      collectiveRating
    };
  });

  // Export criteria as JSON
  const handleExportCriteria = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groupCriteria, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "tieu_chi_xep_loai_tap_the.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import criteria JSON
  const handleImportCriteria = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (Array.isArray(parsed) && parsed.every(item => item.id && item.name && typeof item.minExcellentPercent === 'number')) {
        importGroupCriteria(parsed);
        alert("Đã cập nhật hệ thống tiêu chí đánh giá thi đua tập thể chính thức thành công!");
        setShowCriteriaModal(false);
        setImportJsonText("");
      } else {
        alert("Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra lại cấu trúc tiêu chí mẫu.");
      }
    } catch (e) {
      alert("Định dạng tệp tin JSON không chính xác. Hãy kiểm tra dấu ngoặc kép.");
    }
  };

  return (
    <div className="bg-white mt-10 rounded-2xl border border-slate-200/80 shadow-md p-6 max-w-7xl mx-auto space-y-6" id="class-statistics-bottom">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 text-amber-650 rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>Trung Tâm Giám Sát Sĩ Số & Thi Đua Lớp Phân Hiệu</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold font-mono border border-indigo-200">
                Toàn Cầu
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tính năng đồng bộ tự động hỗ trợ tất cả các cấp từ Lớp, Khoa, Phòng và Phân hiệu kiểm soát rèn luyện, chuyên cần tức thì.
            </p>
          </div>
        </div>

        {/* Tab switchers in header */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab("THI_DUA")}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-tight rounded-lg hover:cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "THI_DUA"
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <Layers size={13} />
            <span>Thi Đua Tập Thể</span>
          </button>
          
          <button
            onClick={() => setActiveTab("SI_SO")}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-tight rounded-lg hover:cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "SI_SO"
                ? "bg-white text-indigo-900 shadow-sm"
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <ClipboardList size={13} />
            <span>Nhật Ký Sĩ Số ({dailyAttendance.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "THI_DUA" ? (
        <>
          {/* ACTION ROW FOR THI DUA */}
          <div className="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 text-xs">
            <span className="text-slate-500 font-medium">Bản đối chiếu xếp hạng thi đua rèn luyện dựa trên chỉ số rèn luyện thực tế học kỳ</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCriteria}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors hover:cursor-pointer"
              >
                <Download size={13} />
                <span>Xuất Tiêu Chí</span>
              </button>
              
              <button
                onClick={() => setShowCriteriaModal(true)}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors hover:cursor-pointer"
              >
                <Upload size={13} />
                <span>Sửa Tiêu Chí</span>
              </button>
            </div>
          </div>

          {/* Grid of Class Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classStats.map(stat => {
              let badgeColor = "bg-slate-100 text-slate-800 border-slate-200";
              if (stat.collectiveRating.includes("Xuất sắc")) {
                badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 font-black animate-pulse";
              } else if (stat.collectiveRating.includes("Tiên tiến") || stat.collectiveRating.includes("Tốt")) {
                badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold";
              }

              return (
                <div 
                  key={stat.classId} 
                  className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-805 leading-none font-mono uppercase">
                          Lớp {stat.classId}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                          <Users size={11} />
                          Sĩ số: {stat.total} sinh viên
                        </span>
                      </div>
                      
                      {/* Dynamic Rating Badge */}
                      <span className={`px-2.5 py-1 text-[10px] rounded-lg border uppercase ${badgeColor}`}>
                        {stat.collectiveRating}
                      </span>
                    </div>

                    {/* Progress Visual bars */}
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-[10px] font-bold text-slate-605">
                        <span>Phổ rèn luyện tập thể:</span>
                        <span>XS - GIỎI - KHÁ - TB - YẾU</span>
                      </div>
                      
                      <div className="h-2 rounded-full overflow-hidden flex bg-slate-200">
                        <div className="bg-emerald-500 h-full" style={{ width: `${stat.xsPct}%` }} title={`Xuất sắc: ${stat.xsPct}%`} />
                        <div className="bg-cyan-500 h-full" style={{ width: `${stat.goodPct}%` }} title={`Danh dự: ${stat.goodPct}%`} />
                        <div className="bg-purple-500 h-full" style={{ width: `${stat.fairPct}%` }} title={`Khá: ${stat.fairPct}%`} />
                        <div className="bg-amber-500 h-full" style={{ width: `${stat.tbPct}%` }} title={`Trung bình: ${stat.tbPct}%`} />
                        <div className="bg-red-500 h-full" style={{ width: `${stat.weakPct}%` }} title={`Yếu/Kém: ${stat.weakPct}%`} />
                      </div>
                    </div>
                  </div>

                  {/* Data Breakdown list */}
                  <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100 text-center text-[10px] font-mono font-bold text-slate-500 bg-white/75 p-2 rounded-xl">
                    <div>
                      <div className="text-emerald-600 block">XS</div>
                      <div className="text-slate-850 mt-1">{stat.xsPct}%</div>
                    </div>
                    <div>
                      <div className="text-cyan-600 block">GIỎI</div>
                      <div className="text-slate-850 mt-1">{stat.goodPct}%</div>
                    </div>
                    <div>
                      <div className="text-purple-600 block">KHÁ</div>
                      <div className="text-slate-850 mt-1">{stat.fairPct}%</div>
                    </div>
                    <div>
                      <div className="text-amber-600 block">TB</div>
                      <div className="text-slate-850 mt-1">{stat.tbPct}%</div>
                    </div>
                    <div>
                      <div className="text-red-500 block">YẾU</div>
                      <div className="text-slate-850 mt-1">{stat.weakPct}%</div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Criteria Details Box */}
          <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs text-slate-600 leading-relaxed space-y-1">
            <div className="font-bold text-indigo-900 flex items-center gap-1">
              <Info size={14} />
              <span>Thông tin Tiêu Chí Xếp Loại Tập Thể hiện hành:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {groupCriteria.map(gc => (
                <div key={gc.id} className="bg-white/80 p-2.5 rounded-lg border border-slate-105">
                  <span className="font-extrabold text-slate-800 uppercase block">{gc.name}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{gc.description}</p>
                  <div className="text-[9px] font-mono text-cyan-800 mt-1">
                    Yêu cầu: Xuất sắc/Tốt &ge; {gc.minExcellentPercent}% | Yếu kém &le; {gc.maxWeakPercent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        // SI_SO TAB: SYSTEM ATTENDANCE LOGS FROM ALL CLASSES
        <div className="space-y-6">
          
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
                  className="w-full py-1.8 border bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X size={13} />
                  <span>Xóa bộ lọc</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 font-semibold italic text-right hidden md:block">
                  Sử dụng các khóa lọc để truy vấn lịch sử
                </div>
              )}
            </div>

          </div>

          {/* ATTENDANCE SUMMARY METRICS */}
          {(() => {
            const filteredReports = dailyAttendance.filter(da => {
              const classMatches = filterClass === "ALL" || da.classId.toLowerCase() === filterClass.toLowerCase();
              const dateMatches = !filterDate || da.date === filterDate;
              return classMatches && dateMatches;
            });

            let totalStudsSum = 0;
            let presentCountSum = 0;
            let totalUnexcusedAbs = 0;
            
            filteredReports.forEach(r => {
              totalStudsSum += r.totalStudents;
              presentCountSum += r.presentCount;
              totalUnexcusedAbs += r.absentees.filter(a => a.type === "KHÔNG_PHÉP").length;
            });

            const overallRate = totalStudsSum > 0 ? Math.round((presentCountSum / totalStudsSum) * 100) : 100;

            // Missing Submissions for today (May 24, 2026)
            const reportedCidsToday = dailyAttendance.filter(da => da.date === "2026-05-24").map(da => da.classId);
            const missingCidsToday = classes.filter(cid => !reportedCidsToday.includes(cid));

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block">Số Nhật Ký Khai Báo</span>
                    <span className="text-xl font-mono font-black text-indigo-950 block">{filteredReports.length} bản báo cáo</span>
                  </div>
                  
                  <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block">Tỷ Lệ Hiện Diện Bình Quân</span>
                    <span className="text-xl font-mono font-black text-emerald-650 block">
                      {overallRate}%
                    </span>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block">Số Lượt Vắng Không Phép</span>
                    <span className="text-xl font-mono font-black text-rose-550 block">
                      {totalUnexcusedAbs} lượt
                    </span>
                    <span className="text-[8px] text-slate-400 block font-semibold leading-none mt-1">(Tự động trừ 2đ rèn luyện rà soát nề nếp)</span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] font-bold text-emerald-850 uppercase block">Trạng thái ngày hiện tại</span>
                    <span className="text-xs font-sans font-black text-emerald-900 block">
                      Hôm nay (24/05/2026)
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block leading-tight">
                      {missingCidsToday.length === 0 ? "100% Các lớp hoàn tất báo cáo" : `Còn lớp (${missingCidsToday.join(", ")}) chưa gửi`}
                    </span>
                  </div>
                </div>

                {/* ALERT BOX FOR MISSING SUBMISSIONS TODAY */}
                {missingCidsToday.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Nhắc nhở toàn khóa học:</span> Hiện tại ngày hôm nay <span className="font-mono font-bold">2026-05-24</span>, vẫn còn <span className="font-bold">{missingCidsToday.length} cụm lớp</span> chưa chốt báo cáo sĩ số nề nếp: <span className="font-mono font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">{missingCidsToday.join(", ")}</span>. Đề nghị các Lớp trưởng khẩn trương nộp nề nếp.
                    </div>
                  </div>
                )}

                {/* DAILY ATTENDANCE FEED */}
                <div className="space-y-4">
                  <div className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-indigo-650" />
                    <span>Chi Tiết Nhật Ký Sĩ Số Thu Hoạch Từ Các Lớp ({filteredReports.length})</span>
                  </div>

                  {filteredReports.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 font-bold">Không tìm thấy bản báo cáo nào khớp với lớp hoặc ngày được lọc.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Vui lòng thay đổi cấu hình tìm chọn phía trên.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredReports.map(da => {
                        const rate = da.totalStudents > 0 ? Math.round((da.presentCount / da.totalStudents) * 100) : 100;
                        let progressColor = "bg-emerald-500";
                        if (rate < 80) progressColor = "bg-rose-500";
                        else if (rate < 100) progressColor = "bg-amber-500";

                        return (
                          <div key={da.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                            
                            <div>
                              {/* Card Title Header */}
                              <div className="flex justify-between items-start gap-2 pb-3 border-b border-slate-100">
                                <div>
                                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase">
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
                                    Có mặt: {da.presentCount}/{da.totalStudents} ({rate}%)
                                  </span>
                                  <span className="text-[9px] text-slate-400 block mt-1">
                                    Báo cáo lúc: {new Date(da.reportedAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar visual */}
                              <div className="mt-3.5 space-y-1">
                                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span>Mật độ sĩ số lớp học tập</span>
                                  <span>{rate}% Hiện diện</span>
                                </div>
                                <div className="h-1.5 bg-slate-105 rounded-full overflow-hidden">
                                  <div className={`h-full ${progressColor}`} style={{ width: `${rate}%` }} />
                                </div>
                              </div>

                              {/* Absentees nested section */}
                              <div className="mt-4 space-y-2">
                                <span className="text-[9px] font-bold text-slate-450 uppercase block">Danh sách vắng nghỉ:</span>
                                
                                {da.absentees.length === 0 ? (
                                  <div className="bg-emerald-50/40 p-2.5 rounded-lg text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                                    <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                                    <span>Nề nếp xuất sắc: Đi học đầy đủ 100%! Không có ai vắng học.</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {da.absentees.map((abs, aidx) => (
                                      <div key={aidx} className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col sm:flex-row justify-between sm:items-center text-[11px] gap-1">
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
                                            ? "bg-rose-50 text-rose-700 border border-rose-200" 
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                        }`}>
                                          {abs.type === "KHÔNG_PHÉP" ? "Không phép (-2đ)" : "Nghỉ có phép"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* footer of report card */}
                            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-405 flex justify-between items-center bg-slate-50/30 p-2 rounded-lg font-medium leading-none">
                              <span>Người kiểm điểm: <span className="font-bold text-slate-700">{da.reportedBy}</span> (Lớp trưởng)</span>
                              <span className="font-mono text-[9px]">ID: #{da.id}</span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

        </div>
      )}

      {/* MODAL: SỬA TIÊU CHÍ QUA JSON */}
      {showCriteriaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-600" />
                <span>Hiệu Chỉnh Tiêu Chí Xếp Hạng Tập Thể</span>
              </h4>
              <button 
                onClick={() => setShowCriteriaModal(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-bold uppercase cursor-pointer"
              >
                Đóng
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Cấu trúc dữ liệu JSON tiêu chí</label>
                <p className="text-[10px] text-slate-400 mb-2 leading-tight">Bạn có thể sửa trực tiếp danh sách ranh giới đánh giá rèn luyện tập thể của các lớp dưới đây:</p>
                <textarea
                  value={importJsonText || JSON.stringify(groupCriteria, null, 2)}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full h-56 font-mono text-xs p-3.5 border rounded-xl focus:outline-indigo-500 focus:border-indigo-500 text-slate-800"
                  placeholder="[{'id': 'XS', 'name': 'Tập thể Xuất sắc', 'minExcellentPercent': 30, 'maxWeakPercent': 0, 'description': '...'}]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setImportJsonText(JSON.stringify([
                      { id: "XS", name: "Tập thể Xuất sắc", minExcellentPercent: 35, maxWeakPercent: 0, description: "Yêu cầu XS&Tốt đạt từ 35% trở lên, tuyệt đối 0% yếu kém." },
                      { id: "TT", name: "Tập thể Tiên tiến", minExcellentPercent: 25, maxWeakPercent: 3, description: "Yêu cầu XS&Tốt đạt từ 25% trở lên, tối đa 3% yếu kém." },
                      { id: "K", name: "Tập thể Khá đạt", minExcellentPercent: 12, maxWeakPercent: 10, description: "Yêu cầu XS&Tốt đạt từ 12% trở lên, tối đa 10% yếu kém." }
                    ], null, 2));
                  }}
                  className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold rounded-lg mr-auto hover:bg-amber-100 hover:cursor-pointer transition-colors"
                >
                  Nạp Mẫu Cốt Khoa
                </button>
                <button
                  onClick={() => setShowCriteriaModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleImportCriteria}
                  className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg hover:cursor-pointer shadow-sm transition-colors"
                >
                  Cập nhật Tiêu chí
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
