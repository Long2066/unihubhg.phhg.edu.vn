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
  Award
} from "lucide-react";

export const FacultyPortal: React.FC = () => {
  const { 
    currentUser, 
    results, 
    facultyReviews, 
    lockFacultyData, 
    students,
    classReviews 
  } = useUniHub();

  const facultyId = currentUser?.targetId || "K-CNTT";
  
  // Find Faculty review status
  const facReviewInfo = facultyReviews.find(fr => fr.facultyId === facultyId);
  const isFacultyLocked = !!facReviewInfo?.locked;

  // Filter students in the faculty
  const facultyStudents = students.filter(s => s.facultyId === facultyId);
  const studentIds = facultyStudents.map(s => s.id);
  const facultyResults = results.filter(r => studentIds.includes(r.studentId));

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

  const [activeTab, setActiveTab] = useState<"STAT" | "LOCKS">("STAT");

  const getRankColorLight = (points: number) => {
    if (points >= 90) return "bg-emerald-50 text-emerald-800 border-emerald-100";
    if (points >= 80) return "bg-blue-50 text-blue-800 border-blue-100";
    if (points >= 70) return "bg-purple-50 text-purple-800 border-purple-100";
    if (points >= 50) return "bg-amber-50 text-amber-800 border-amber-100";
    return "bg-rose-50 text-rose-800 border-rose-100";
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
          <p className="text-xs text-slate-500 mt-1 italic">
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

      {/* Main Stats Cards (Section 2.2) */}
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
          <div className="text-[10px] text-slate-450 mt-1">Tổng điểm trung bình toàn khoa</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Award size={12} />
            Loại Giỏi & Xuất Sắc
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight mt-1">
            {xsCount + totCount} <span className="text-slate-400 text-xs font-bold">({Math.round(((xsCount+totCount)/totalInFac)*100)}%)</span>
          </div>
          <div className="text-[10px] text-slate-450 mt-1">Đủ chuẩn xét học bổng thi đua</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle size={12} className="text-amber-500" />
            Loại Yếu Kém
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tracking-tight mt-1">
            {yeuCount} <span className="text-slate-400 text-xs font-bold">({Math.round((yeuCount/totalInFac)*100)}%)</span>
          </div>
          <div className="text-[10px] text-slate-450 mt-1">Cần có hoạt động hỗ trợ học kỳ sau</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveTab("STAT")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "STAT" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <BarChart2 size={14} />
            <span>Thống kê khoa & Xuất Excel</span>
          </button>
          <button 
            onClick={() => setActiveTab("LOCKS")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "LOCKS" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Lock size={14} />
            <span>Tiến độ nộp điểm các lớp ({classes.length})</span>
          </button>
        </div>

        {/* Action Pane */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[440px] flex flex-col justify-between">
          
          {/* TAB 1: MODEL EXPORT SHEET & BEAUTIFUL CUSTOM GRAPHS (Section 1.2 / 2.2) */}
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

              {/* Custom Graph visually pairing negative-space bars */}
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
                      <div className="h-full bg-amber-50 transition-all rounded-full" style={{ width: `${(tbCount / totalInFac) * 100}%` }}></div>
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
                          <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider rounded border leading-none ${isBCS ? 'bg-emerald-5 text-emerald-700 border-emerald-150' : 'bg-slate-50 text-slate-400'}`}>
                            {isBCS ? "ĐÃ DUYỆT" : "CHƯA XN"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Giáo viên chủ nhiệm:</span>
                          <span className={`px-2 py-0.5 text-[9px] font-black tracking-wider rounded border leading-none ${isGVCN ? 'bg-emerald-5 text-emerald-700 border-emerald-150' : 'bg-slate-50 text-slate-400'}`}>
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

          <div className="bg-slate-50 p-3.5 border-t border-slate-100 shrink-0 text-center rounded-b-xl">
            <span className="text-[9px] text-slate-400 font-mono">
              Khoa chỉ xem và rà soát nộp dữ liệu của các lớp học sinh liên đới, không sửa chữa trực tiếp kết quả gốc của Giáo viên.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
