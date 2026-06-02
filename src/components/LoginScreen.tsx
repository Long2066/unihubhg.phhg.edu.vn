import React, { useState } from "react";
import { useUniHub } from "../state";
import { UserRole } from "../types";
import { TnuLogo } from "./TnuLogo";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  UserCheck, 
  School, 
  ShieldAlert, 
  Settings, 
  ArrowRight,
  Info
} from "lucide-react";

export const LoginScreen: React.FC = () => {
  const { login, users } = useUniHub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Vui lòng nhập tên đăng nhập hoặc mã số.");
      return;
    }
    const success = login(email, password);
    if (success) {
      setErrorMsg("");
    } else {
      setErrorMsg("Tên đăng nhập hoặc mật khẩu không chính xác. Thử lại hoặc dùng mặc định 'password123'.");
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    login(userEmail);
  };

  const roleMeta = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return { 
          icon: GraduationCap, 
          label: "Sinh viên", 
          desc: "Đăng ký hoạt động, nộp minh chứng, xem điểm dự kiến", 
          color: "bg-blue-50 text-blue-700 border-blue-200" 
        };
      case UserRole.ORGANIZER:
        return { 
          icon: Users, 
          label: "CLB / Đoàn / Hội", 
          desc: "Quản lý thành viên, tạo sự kiện, chốt điểm danh", 
          color: "bg-purple-50 text-purple-700 border-purple-200" 
        };
      case UserRole.TRAINING_DEPT:
        return { 
          icon: BookOpen, 
          label: "Phòng Đào tạo", 
          desc: "Import kết quả GPA, tín chỉ, nợ học phí, khóa học vụ", 
          color: "bg-amber-50 text-amber-700 border-amber-200" 
        };
      case UserRole.CLASS_MONITOR:
        return { 
          icon: UserCheck, 
          label: "Ban Cán Sự Lớp", 
          desc: "Theo dõi lớp sĩ số, xác nhận nề nếp chung lớp", 
          color: "bg-emerald-50 text-emerald-700 border-emerald-200" 
        };
      case UserRole.ADVISER:
        return { 
          icon: ShieldAlert, 
          label: "Giáo viên chủ nhiệm (GVCN)", 
          desc: "Rà soát điểm lớp, duyệt nộp ngoại lệ, hạ điểm vi phạm", 
          color: "bg-rose-50 text-rose-700 border-rose-200" 
        };
      case UserRole.FACULTY:
        return { 
          icon: School, 
          label: "Văn phòng Khoa", 
          desc: "Kiểm tra xếp loại rèn luyện, báo cáo, khóa sổ của Khoa", 
          color: "bg-indigo-50 text-indigo-700 border-indigo-200" 
        };
      case UserRole.ADMIN:
        return { 
          icon: Settings, 
          label: "Admin / Phòng CTHSSV", 
          desc: "Cấu hình tiêu chí, mở/đóng kỳ toàn phân hiệu, audit logs", 
          color: "bg-slate-100 text-slate-800 border-slate-300" 
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-8 px-4 font-sans selection:bg-indigo-500 selection:text-white" id="unihub-login-screen">
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full text-center my-4">
        <div className="inline-flex items-center gap-4 justify-center mb-2">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
            <TnuLogo size={44} />
          </div>
          <div className="text-left">
            <h4 className="font-mono text-xs font-black text-indigo-600 tracking-wider uppercase">Phân hiệu ĐHTN tại Hà Giang</h4>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">CỔNG THÔNG TIN UNIHUBHG</h1>
          </div>
        </div>
        <p className="max-w-xl mx-auto text-sm text-slate-500 mt-2">
          Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang - Tra cứu ngay thông tin của bạn
        </p>
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto w-full my-auto" id="manual-login-card-container">
        
        {/* Manual Login Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex flex-col justify-between" id="manual-login-card">
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Đăng nhập tài khoản</h2>
              <p className="text-xs text-slate-400 mt-1">Sử dụng Email hoặc Mã định danh cán bộ/sinh viên</p>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Tên đăng nhập / Email / Mã sinh viên</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập tài khoản hoặc mã số..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all text-slate-800"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Mật khẩu</label>
                  <span className="text-xs text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors">Quên mật khẩu?</span>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition-all text-slate-800"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 flex gap-2 items-start text-xs text-rose-600">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-150 transition-all flex items-center justify-center gap-2 text-sm mt-4 hover:cursor-pointer"
              >
                <span>Đăng nhập</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-5">
            <div className="p-3 bg-slate-50 rounded-xl flex flex-col gap-2 text-xs text-slate-500">
              <div className="flex gap-2 items-start">
                <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                <span>
                  Mật khẩu chung cho tất cả tài khoản mẫu là <strong>password123</strong>.
                </span>
              </div>
              <details className="mt-1 border-t border-slate-200/60 pt-2 text-[11px]">
                <summary className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer focus:outline-none select-none">
                  Xem danh sách tài khoản Demo các cấp
                </summary>
                <div className="mt-2 space-y-1 bg-white p-2.5 rounded border border-slate-150 font-mono text-[10.5px] text-slate-600 max-h-[180px] overflow-y-auto custom-scrollbar">
                  <p className="border-b border-slate-50 pb-1">• <strong>Sinh viên:</strong> <span className="text-slate-800 font-bold">DTG245140202053</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>Câu lạc bộ:</strong> <span className="text-slate-800 font-bold">clbnckh@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>BCH Đoàn:</strong> <span className="text-slate-800 font-bold">doantnphhg@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>BCH Hội SV:</strong> <span className="text-slate-800 font-bold">hsvphhg@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>Phòng Đào tạo:</strong> <span className="text-slate-800 font-bold">dtphhg@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>Cán bộ lớp:</strong> <span className="text-slate-800 font-bold">cblk2gdtha@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>GVCN:</strong> <span className="text-slate-800 font-bold">gvcnk2gdtha@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>Khoa Sư phạm:</strong> <span className="text-slate-800 font-bold">khoasp@hg.edu.vn</span></p>
                  <p className="border-b border-slate-50 pb-1">• <strong>Phòng CTHSSV:</strong> <span className="text-slate-800 font-bold">pcthssvhg.edu.vn</span></p>
                </div>
              </details>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding info */}
      <footer className="max-w-6xl mx-auto w-full text-center border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div>
          Hệ thống UniHub Rèn luyện © 2026. Phiên bản 1.0 - Bản kế hoạch thí điểm tại Hà Giang.
        </div>
        <div className="font-mono text-[10px]">
          Dùng chung Cơ sở dữ liệu, API & Thang điểm quy chuẩn liên thông.
        </div>
      </footer>
    </div>
  );
};
