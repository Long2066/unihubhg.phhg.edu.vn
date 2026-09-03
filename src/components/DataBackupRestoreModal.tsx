import React, { useState, useRef } from "react";
import { Download, Upload, ShieldCheck, Database, RefreshCw, X, AlertTriangle, CheckCircle2, FileJson } from "lucide-react";
import { useUniHub } from "../state";

interface DataBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBackupRestoreModal: React.FC<DataBackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { 
    students, 
    users, 
    teacherAssignments, 
    subjectGradeSheets, 
    schedules, 
    results, 
    evidence, 
    organizations, 
    members, 
    activities, 
    attendance, 
    dailyAttendance,
    announcements, 
    criteria,
    classReviews,
    facultyReviews,
    groupCriteria,
    groupAttendances,
    systemFeedbacks,
    gradingRules,
    period,
    restoreAllDataBackup
  } = useUniHub();

  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Export JSON backup of entire database
  const handleExportBackup = () => {
    try {
      const backupPayload = {
        metadata: {
          system: "UniHubHG - Đại học Thái Nguyên tại Hà Giang",
          version: "2.0.0",
          exportedAt: new Date().toISOString(),
          totalStudents: students.length,
          totalUsers: users.length
        },
        data: {
          students,
          users,
          teacherAssignments,
          subjectGradeSheets,
          schedules,
          results,
          evidence,
          organizations,
          members,
          activities,
          attendance,
          dailyAttendance,
          announcements,
          criteria,
          classReviews,
          facultyReviews,
          groupCriteria,
          groupAttendances,
          systemFeedbacks,
          gradingRules,
          period
        }
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `UniHubHG_Backup_CSDL_${dateStr}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Lỗi khi xuất file sao lưu: " + (err?.message || err));
    }
  };

  // 2. Import JSON backup and restore into state, localStorage, and Firestore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setRestoreError(null);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Kiểm tra tính hợp lệ của file backup
        const dataPayload = parsed.data || parsed;
        if (!dataPayload.students && !dataPayload.users) {
          throw new Error("Tệp không đúng định dạng sao lưu UniHubHG (thiếu mảng students/users).");
        }

        if (restoreAllDataBackup) {
          await restoreAllDataBackup(dataPayload);
          setRestoreStatus(`Khôi phục thành công! Đã phục hồi ${(dataPayload.students || []).length} sinh viên, ${(dataPayload.users || []).length} tài khoản người dùng và toàn bộ dữ liệu kèm theo.`);
        } else {
          // Fallback lưu trực tiếp
          localStorage.setItem("unihub_students", JSON.stringify(dataPayload.students || []));
          localStorage.setItem("unihub_students_backup", JSON.stringify(dataPayload.students || []));
          localStorage.setItem("unihub_users", JSON.stringify(dataPayload.users || []));
          localStorage.setItem("unihub_users_backup", JSON.stringify(dataPayload.users || []));
          setRestoreStatus("Đã khôi phục dữ liệu vào bộ nhớ an toàn. Vui lòng tải lại trang.");
        }
      } catch (err: any) {
        setRestoreError("Không thể đọc hoặc khôi phục tệp: " + (err?.message || err));
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      setRestoreError("Đã xảy ra lỗi trong quá trình đọc tệp tin.");
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  // Phục hồi nhanh từ bản sao lưu Local Storage tự động
  const handleRestoreFromLocalShield = () => {
    try {
      const backupStuds = localStorage.getItem("unihub_students_backup");
      const backupUsers = localStorage.getItem("unihub_users_backup");
      if (!backupStuds && !backupUsers) {
        alert("Chưa có bản sao lưu dự phòng tự động nào được ghi nhận trên trình duyệt này!");
        return;
      }
      const studs = backupStuds ? JSON.parse(backupStuds) : [];
      const usrs = backupUsers ? JSON.parse(backupUsers) : [];
      if (confirm(`Tìm thấy bản sao lưu bảo vệ gồm ${studs.length} sinh viên và ${usrs.length} tài khoản. Bạn có chắc chắn muốn khôi phục ngay không?`)) {
        if (restoreAllDataBackup) {
          restoreAllDataBackup({ students: studs, users: usrs });
        }
        alert("Đã khôi phục thành công từ bản sao lưu dự phòng tự động!");
      }
    } catch (e: any) {
      alert("Lỗi khi khôi phục từ bản dự phòng: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/20">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">Trung Tâm Bảo Vệ & Sao Lưu Dữ Liệu</h3>
              <p className="text-[10.5px] text-slate-300">Bảo toàn vĩnh viễn dữ liệu sinh viên, học vụ và tài khoản người dùng</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Status summary banner */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-150 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="text-indigo-600" size={18} />
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Trạng thái CSDL hiện thời</span>
                <span className="text-xs font-black text-slate-900">
                  {students.length} Sinh viên &bull; {users.length} Tài khoản &bull; {teacherAssignments.length} Lớp học phần
                </span>
              </div>
            </div>
            <span className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
              Đã kích hoạt lá chắn bảo vệ
            </span>
          </div>

          {/* Option 1: Tải file sao lưu JSON về máy cá nhân */}
          <div className="p-4 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Download size={14} className="text-indigo-600" />
                  <span>1. Xuất file Sao lưu Toàn bộ CSDL về Máy tính (.json)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tải về bản sao lưu toàn vẹn chứa tất cả danh sách sinh viên, điểm GPA, thời khóa biểu, tài khoản và quy chế. Quý Thầy/Cô có thể lưu vào máy cá nhân hoặc Google Drive để không bao giờ bị mất dữ liệu.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Download size={13} />
              <span>Tải Bản Sao Lưu (.json) Về Máy</span>
            </button>
          </div>

          {/* Option 2: Nạp file sao lưu JSON để khôi phục */}
          <div className="p-4 bg-white border border-slate-200 hover:border-emerald-200 rounded-xl space-y-2.5 shadow-2xs">
            <div className="space-y-0.5">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                <Upload size={14} className="text-emerald-600" />
                <span>2. Khôi phục CSDL từ File Sao lưu (.json)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Khôi phục lại toàn bộ sinh viên và tài khoản từ file backup đã lưu trước đó. Dữ liệu sẽ được ghi đè an toàn và đồng bộ ngay tức thì lên đám mây.
              </p>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              accept=".json" 
              onChange={handleFileSelect}
              className="hidden" 
              id="data-backup-file-input"
            />
            <label
              htmlFor="data-backup-file-input"
              className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
            >
              <FileJson size={13} />
              <span>{isProcessing ? "Đang xử lý..." : "Chọn Tệp JSON Để Khôi Phục"}</span>
            </label>
          </div>

          {/* Option 3: Phục hồi tức thì từ Bản dự phòng ngầm (Local Shield Slot) */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2.5">
            <div className="space-y-0.5">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                <RefreshCw size={13} className="text-amber-700" />
                <span>3. Phục hồi khẩn cấp từ Bản sao ngầm (Local Backup Slot)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Hệ thống luôn tự động lưu riêng một bản sao dự phòng của danh sách sinh viên & tài khoản. Nếu vừa bấm nhầm hoặc bị lỗi hiển thị, Thầy/Cô có thể bấm khôi phục ngay.
              </p>
            </div>
            <button
              onClick={handleRestoreFromLocalShield}
              className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <RefreshCw size={12} />
              <span>Khôi Phục Bản Sao Ngầm</span>
            </button>
          </div>

          {/* Result alerts */}
          {restoreStatus && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] font-medium leading-relaxed">{restoreStatus}</div>
            </div>
          )}

          {restoreError && (
            <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 flex items-start gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] font-medium leading-relaxed">{restoreError}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-150 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
