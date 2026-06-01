import React, { useState } from "react";
import { useUniHub } from "../state";
import { UserRole, Student, UserAccount } from "../types";
import { 
  FileSpreadsheet, 
  Upload, 
  Lock, 
  CheckCircle, 
  Edit, 
  RefreshCw, 
  FileText, 
  Info,
  ChevronDown,
  Users,
  Grid,
  ShieldAlert,
  Key
} from "lucide-react";

export const TrainingPortal: React.FC = () => {
  const { 
    students, 
    importAcademicData, 
    toggleLearningDataLock,
    importNewClassesExcel,
    users,
    activePortletTab,
    setActivePortletTab
  } = useUniHub();

  const activeTab = (activePortletTab as "IMPORT" | "IMPORT_CLASSES" | "LIST") || "IMPORT";
  const setActiveTab = (tab: "IMPORT" | "IMPORT_CLASSES" | "LIST") => {
    setActivePortletTab(tab);
  };
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modal manual edit GPA
  const [editGpa, setEditGpa] = useState(3.0);
  const [editCredits, setEditCredits] = useState(15);
  const [editWarning, setEditWarning] = useState(false);
  const [editStatus, setEditStatus] = useState("Bình thường");

  // Mock GPA template upload
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Class Import Simulator
  const [showClassPreview, setShowClassPreview] = useState(false);
  const [selectedClassFileLabel, setSelectedClassFileLabel] = useState("");
  const [importedClassStudents, setImportedClassStudents] = useState<Student[]>([]);
  const [importedClassUsers, setImportedClassUsers] = useState<UserAccount[]>([]);

  const handleMockExcelUpload = () => {
    // Generate simulated high-performing student updates to show the power of the engine
    const updates = [
      { id: "DTG245140202053", gpa: 3.52, creditsEarned: 21, learningWarning: false, learningStatus: "Bình thường" },
      { id: "SV20CN02", gpa: 2.85, creditsEarned: 18, learningWarning: false, learningStatus: "Bình thường" },
      { id: "SV20CN04", gpa: 1.82, creditsEarned: 13, learningWarning: true, learningStatus: "Bị cảnh báo" }
    ];

    setPreviewData(updates);
    setShowPreview(true);
  };

  const handleApplyImport = () => {
    importAcademicData(previewData);
    setShowPreview(false);
    setPreviewData([]);
    alert("Dữ liệu kết quả học tập từ cổng đào tạo đã được đồng bộ & khóa chính thức thành công!");
  };

  // Class list imports simulator
  const handleLoadClassExcelSimulator = (type: "GDTH" | "SUFAM") => {
    let className = "";
    let classAlias = "";
    let dataList: Student[] = [];
    let userList: UserAccount[] = [];

    if (type === "GDTH") {
      className = "K2-GDTH-A";
      classAlias = "k2gdtha";
      setSelectedClassFileLabel("danh_sach_lop_k2_gdth_a_goc.xlsx");

      dataList = [
        { id: "GDTH001", name: "Nguyễn Thị Hoa", email: "gdth001@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 3.82, creditsEarned: 20, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH002", name: "Phan Văn Minh", email: "gdth002@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 3.25, creditsEarned: 18, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH003", name: "Lệ Thu Thảo", email: "gdth003@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 2.76, creditsEarned: 15, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH045", name: "Bùi Tiến Đạt", email: "gdth045@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 1.45, creditsEarned: 12, learningWarning: true, learningStatus: "Bị cảnh báo" }
      ];

      userList = [
        {
          id: "U_GDTH_M",
          username: "cblk2gdtha@hg.edu.vn",
          password: "password123",
          email: "cblk2gdtha@hg.edu.vn",
          name: "Lớp trưởng K2 GDTH A",
          role: UserRole.CLASS_MONITOR,
          targetId: "K2-GDTH-A"
        }
      ];
    } else {
      className = "K3-GDTH-B";
      classAlias = "k3gdthb";
      setSelectedClassFileLabel("danh_sach_lop_k3_gdth_b_goc.xlsx");

      dataList = [
        { id: "GDTH101", name: "Trần Bảo Long", email: "gdth101@hg.edu.vn", classId: "K3-GDTH-B", facultyId: "K-GDTH", gpa: 3.65, creditsEarned: 20, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH102", name: "Hoàng Mỹ Duyên", email: "gdth102@hg.edu.vn", classId: "K3-GDTH-B", facultyId: "K-GDTH", gpa: 3.12, creditsEarned: 18, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH103", name: "Ngô Quốc Bảo", email: "gdth103@hg.edu.vn", classId: "K3-GDTH-B", facultyId: "K-GDTH", gpa: 2.10, creditsEarned: 14, learningWarning: false, learningStatus: "Bình thường" }
      ];

      userList = [
        {
          id: "U_GDTH3_M",
          username: "cblk3gdthb@hg.edu.vn",
          password: "password123",
          email: "cblk3gdthb@hg.edu.vn",
          name: "Lớp trưởng K3 GDTH B",
          role: UserRole.CLASS_MONITOR,
          targetId: "K3-GDTH-B"
        }
      ];
    }

    setImportedClassStudents(dataList);
    setImportedClassUsers(userList);
    setShowClassPreview(true);
  };

  const handleApplyClassImport = () => {
    importNewClassesExcel(importedClassStudents, importedClassUsers);
    setShowClassPreview(false);
    setImportedClassStudents([]);
    setImportedClassUsers([]);
    alert("Nhập danh mục nhiều lớp & auto-provision tài khoản BCS lớp (cblk2gdtha@hg.edu.vn / password123) thành công!");
  };

  const startEdit = (studentId: string) => {
    const s = students.find(item => item.id === studentId);
    if (s) {
      setSelectedStudentId(studentId);
      setEditGpa(s.gpa || 3.0);
      setEditCredits(s.creditsEarned || 15);
      setEditWarning(!!s.learningWarning);
      setEditStatus(s.learningStatus || "Bình thường");
    }
  };

  const saveDetails = () => {
    if (selectedStudentId) {
      importAcademicData([{
        id: selectedStudentId,
        gpa: Number(editGpa),
        creditsEarned: Number(editCredits),
        learningWarning: editWarning,
        learningStatus: editStatus
      }]);
      setSelectedStudentId(null);
      alert("Đã hiệu chỉnh học vụ thành công.");
    }
  };

  return (
    <div className="space-y-6" id="training-portal-container">
      {/* Bio Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 uppercase tracking-wider">
            PHÒNG ĐÀO TẠO & KHẢO THÍ HỌC VỤ
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Cổng Kiểm Toán & Nạp Cơ Sở Học Vị Phân Hiệu</h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            Nạp, đồng bộ khóa học vụ GPA sinh viên, chốt và khởi tạo nhanh các lớp sinh hoạt, tài khoản Ban cán sự lớp đồng quy.
          </p>
        </div>

        <button 
          onClick={toggleLearningDataLock}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all hover:cursor-pointer shrink-0"
        >
          <Lock size={14} />
          <span>Khóa Sổ Toàn Phân Hiệu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveTab("IMPORT")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "IMPORT" ? "bg-amber-600 text-white shadow-md shadow-amber-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Upload size={14} />
            <span>Nạp Excel GPA học kỳ</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("IMPORT_CLASSES")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "IMPORT_CLASSES" ? "bg-amber-600 text-white shadow-md shadow-amber-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <Users size={14} />
            <span>Nhập danh sách lớp học</span>
          </button>

          <button 
            onClick={() => setActiveTab("LIST")}
            className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 ${activeTab === "LIST" ? "bg-amber-600 text-white shadow-md shadow-amber-100" : "text-slate-650 hover:bg-slate-50"}`}
          >
            <FileSpreadsheet size={14} />
            <span>Hồ sơ học lực ({students.length})</span>
          </button>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-9 bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          {/* TAB 1: CSV / EXCEL MOCK IMPORTER */}
          {activeTab === "IMPORT" && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Đồng quy dữ liệu điểm GPA</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">Phòng Đào tạo tải lên mẫu file chứa thông tin GPA học kỳ nhằm tự động cộng hoặc khấu trừ rèn luyện hệ thống.</p>
              </div>

              {/* Upload zone */}
              <div 
                className="border-2 border-dashed border-amber-200 bg-amber-50/10 hover:bg-amber-50/20 p-8 rounded-2xl text-center cursor-pointer transition-colors"
                onClick={handleMockExcelUpload}
              >
                <FileText size={40} className="mx-auto text-amber-500 mb-3" />
                <h4 className="text-xs font-black text-slate-800">Nhấp vào đây để mô phỏng tải lên tệp Excel GPA (`unihub_gpa_template.xlsx`)</h4>
                <p className="text-[10px] text-slate-450 mt-1 max-w-sm mx-auto">Mẫu Excel chứa điểm GPA mới: Nguyễn Văn An được nâng lên 3.52, Phan Thị Bình nâng lên 2.85.</p>
              </div>

              {/* Preview table */}
              {showPreview && (
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                      <Lock size={12} />
                      XEM TRƯỚC BẢNG ĐỒNG BỘ GPA ({previewData.length} dòng)
                    </span>
                    <button 
                      onClick={handleApplyImport}
                      className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg hover:cursor-pointer shadow-sm transition-all"
                    >
                      Xác nhận & Đồng bộ học lý lịch
                    </button>
                  </div>

                  <div className="border border-slate-200 bg-white rounded-lg overflow-x-auto text-[11px] font-mono">
                    <div className="min-w-[650px] divide-y divide-slate-100">
                      <div className="p-2.5 bg-slate-100 font-bold grid grid-cols-4 gap-2 text-slate-700">
                        <span>Mã SV</span>
                        <span>GPA nạp</span>
                        <span>Số TC tích lũy</span>
                        <span>Cảnh báo học phẩm</span>
                      </div>
                      {previewData.map(row => {
                        const origin = students.find(s => s.id === row.id);
                        return (
                          <div key={row.id} className="p-2 grid grid-cols-4 gap-2 text-slate-800 items-center">
                            <span className="font-bold">{row.id}</span>
                            <span>
                              {row.gpa.toFixed(2)}{" "}
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded-sm ml-1">
                                (Cũ: {origin?.gpa?.toFixed(2)})
                              </span>
                            </span>
                            <span>{row.creditsEarned} TC</span>
                            <span className={`text-[10px] font-bold ${row.learningWarning ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {row.learningStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-slate-50 border flex gap-3.5 items-start text-[11px] text-slate-600 leading-relaxed">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cơ chế cộng rèn luyện tự động từ Học lực GPA:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>GPA &ge; 3.6: Loại Xuất sắc, auto cộng tối đa 20 điểm rèn luyện (TC1.1).</li>
                    <li>GPA &ge; 3.2: Loại Giỏi, auto cộng 18 điểm rèn luyện (TC1.2).</li>
                    <li>GPA &ge; 2.5: Loại Khá, cộng 15 điểm rèn luyện (TC1.3).</li>
                    <li>Học lực Cảnh báo học phẩm: Auto phạt trừ 5 điểm rèn luyện (TC1.5).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL IMPORT CLASS LISTS AND CREATE MONITOR ACCOUNT */}
          {activeTab === "IMPORT_CLASSES" && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Nộp Excel danh mục nhiều lớp & Auto provisioning</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Phòng Đào tạo tải lên tệp Excel danh sách các thành viên lớp mới. Hệ thống sẽ tự tạo tài khoản Lớp trưởng/Bản cán sự lớp với định dạng email mặc định: <strong>cblk2gdtha@hg.edu.vn</strong> (mật khẩu: <code>password123</code>).
                </p>
              </div>

              {/* Upload choices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div 
                  className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/5 hover:bg-amber-50/15 p-6 rounded-2xl text-center cursor-pointer transition-colors"
                  onClick={() => handleLoadClassExcelSimulator("GDTH")}
                >
                  <Users size={32} className="mx-auto text-amber-600 mb-2" />
                  <strong className="text-xs text-slate-800 block">Nạp tệp Excel: Lớp K2 GDTH A</strong>
                  <p className="text-[10px] text-slate-450 mt-1">Mô phỏng nạp 4 sinh viên ngành GD Tiểu Học, tự động kích hoạt email điều hướng: <code className="block mt-0.5 bg-slate-100 p-0.5 rounded text-amber-700">cblk2gdtha@hg.edu.vn</code></p>
                </div>

                <div 
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/5 hover:bg-slate-50/15 p-6 rounded-2xl text-center cursor-pointer transition-colors"
                  onClick={() => handleLoadClassExcelSimulator("SUFAM")}
                >
                  <Users size={32} className="mx-auto text-slate-650 mb-2" />
                  <strong className="text-xs text-slate-800 block">Nạp tệp Excel: Lớp K3 GDTH B</strong>
                  <p className="text-[10px] text-slate-450 mt-1">Mô phỏng nạp 3 sinh viên khóa mới, tự động kích hoạt tài khoản Lớp trưởng: <code className="block mt-0.5 bg-slate-100 p-0.5 rounded text-indigo-700">cblk3gdthb@hg.edu.vn</code></p>
                </div>

              </div>

              {/* Show preview list of imported class students */}
              {showClassPreview && (
                <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">TẬP TIN ĐANG CHỜ NẠP</span>
                      <strong className="text-xs text-slate-700 font-mono">{selectedClassFileLabel}</strong>
                    </div>
                    
                    <button
                      onClick={handleApplyClassImport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Xác nhận nạp Lớp mới
                    </button>
                  </div>

                  {/* Student list preview */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Mẫu xem trước 1: Thành viên lớp mới ({importedClassStudents.length} SV)</span>
                    <div className="border bg-white rounded-lg divide-y text-[11px] font-mono max-h-[140px] overflow-y-auto">
                      {importedClassStudents.map(is => (
                        <div key={is.id} className="p-2 flex justify-between">
                          <span>{is.name} ({is.id})</span>
                          <span>Lớp: {is.classId} | GPA: {is.gpa}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provisioned Class Monitor account preview */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-950">
                    <Key size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Mẫu xem trước 2: Auto provision tài khoản Lớp trưởng (BCS)</strong>
                      {importedClassUsers.map(iu => (
                        <div key={iu.id} className="mt-1 space-y-0.5 font-mono text-[10px]">
                          <div>• Tên hiển thị: {iu.name}</div>
                          <div>• Email đăng nhập: <strong className="bg-yellow-100 px-1 rounded text-red-700">{iu.email}</strong></div>
                          <div>• Mật khẩu: <code>{iu.password}</code></div>
                          <div>• Quyền hạn: CLASS_MONITOR | Quản lý mã lớp: {iu.targetId}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 3: MANUAL DATABASE EDIT OR INSPECTION */}
          {activeTab === "LIST" && (
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Danh mục hồ sơ học vị của sinh viên Phân hiệu</h4>
              
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                {students.map(s => (
                  <div key={s.id} className="p-3 bg-white flex justify-between items-center flex-wrap gap-2 text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-900">{s.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono">MSSV: {s.id} | Lớp: {s.classId} | Khoa: {s.facultyId}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-medium">Số GPA</div>
                        <div className="text-xs font-bold text-slate-800 font-mono">{s.gpa?.toFixed(2) || "Chưa nhập"}</div>
                      </div>
                      <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-medium font-mono">Tác vụ phụ</div>
                        <div className="text-xs font-bold text-slate-800 font-mono">{s.creditsEarned || 0} TC</div>
                      </div>
                      <button 
                        onClick={() => startEdit(s.id)}
                        className="p-1 px-2.5 rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold hover:cursor-pointer transition-colors"
                      >
                        Sửa nhanh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-3.5 border-t border-slate-100 shrink-0 text-center rounded-b-xl mt-4">
            <span className="text-[9px] text-slate-400 font-mono">
              Công cụ đồng bộ học bạ UniHub liên kết dữ liệu Phân hiệu, bảo mật tài khoản BCS.
            </span>
          </div>

        </div>

      </div>

      {/* MODAL: MANUAL STUDENT EDIT DIALOG */}
      {selectedStudentId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                <Edit size={14} />
                <span>Hiệu chỉnh học học vị: {selectedStudentId}</span>
              </h3>
              <button 
                onClick={() => setSelectedStudentId(null)}
                className="text-slate-450 hover:text-slate-700 text-xs font-bold font-mono uppercase"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 space-y-4 text-left text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">ĐIỂM GPA CHÍNH THỨC</label>
                <input 
                  type="number"
                  step="0.01"
                  value={editGpa}
                  onChange={(e) => setEditGpa(Number(e.target.value))}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">SỐ TÍN CHỈ TÍCH LŨY</label>
                <input 
                  type="number"
                  value={editCredits}
                  onChange={(e) => setEditCredits(Number(e.target.value))}
                  className="w-full text-xs p-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox"
                  id="chk-warning-learning"
                  checked={editWarning}
                  onChange={(e) => setEditWarning(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <label htmlFor="chk-warning-learning" className="text-[11px] font-extrabold text-red-650 cursor-pointer">
                  Cảnh báo kết quả tình trạng học vụ
                </label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">TRẠNG THÁI HỌC TẬP</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs p-2 border rounded-lg bg-white"
                >
                  <option value="Bình thường">Bình thường</option>
                  <option value="Bị cảnh báo">Bị cảnh báo</option>
                  <option value="Đình chỉ học">Đình chỉ học</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={saveDetails}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
