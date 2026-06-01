/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { UniHubProvider, useUniHub } from "./state";
import { UserRole } from "./types";
import { LoginScreen } from "./components/LoginScreen";
import { StudentPortal } from "./components/StudentPortal";
import { TnuLogo } from "./components/TnuLogo";
import { OrganizerPortal } from "./components/OrganizerPortal";
import { TrainingPortal } from "./components/TrainingPortal";
import { ClassPortal } from "./components/ClassPortal";
import { AdviserPortal } from "./components/AdviserPortal";
import { FacultyPortal } from "./components/FacultyPortal";
import { AdminPortal } from "./components/AdminPortal";
import { ClassStatisticsBottom } from "./components/ClassStatisticsBottom";
import { 
  LogOut, 
  School, 
  BookOpen, 
  User, 
  Cpu, 
  HelpCircle,
  GraduationCap,
  Users,
  UserCheck,
  ShieldAlert,
  Settings,
  ShieldAlert as AdviserIcon,
  Home,
  Award,
  Calendar,
  FileText,
  PlusCircle,
  Megaphone,
  UserPlus,
  UploadCloud,
  FileCode,
  BarChart2,
  Lock,
  Clock
} from "lucide-react";

const AppContent: React.FC = () => {
  const { currentUser, logout, period, activePortletTab, setActivePortletTab } = useUniHub();

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Choose corresponding Portal View based on current logged in user role
  const renderPortal = () => {
    switch (currentUser.role) {
      case UserRole.STUDENT:
        return <StudentPortal />;
      case UserRole.ORGANIZER:
        return <OrganizerPortal />;
      case UserRole.TRAINING_DEPT:
        return <TrainingPortal />;
      case UserRole.CLASS_MONITOR:
        return <ClassPortal />;
      case UserRole.ADVISER:
        return <AdviserPortal />;
      case UserRole.FACULTY:
        return <FacultyPortal />;
      case UserRole.ADMIN:
        return <AdminPortal />;
      default:
        return <StudentPortal />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return { label: "Sinh viên", color: "bg-blue-100 text-blue-800 border-blue-200", icon: GraduationCap };
      case UserRole.ORGANIZER: return { label: "CLB / Đoàn / Hội", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Users };
      case UserRole.TRAINING_DEPT: return { label: "Phòng Đào tạo", color: "bg-amber-100 text-amber-800 border-amber-200", icon: BookOpen };
      case UserRole.CLASS_MONITOR: return { label: "Ban Cán sự Lớp", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: UserCheck };
      case UserRole.ADVISER: return { label: "GVCN", color: "bg-rose-100 text-rose-800 border-rose-200", icon: AdviserIcon };
      case UserRole.FACULTY: return { label: "Văn phòng Khoa", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: School };
      case UserRole.ADMIN: return { label: "Admin tổng", color: "bg-slate-800 text-white border-slate-700", icon: Settings };
    }
  };

  const roleMeta = getRoleLabel(currentUser.role);
  const IconComp = roleMeta.icon;

  // Active side tabs maps matching Attachment 1 design
  const getSidebarTabs = () => {
    switch (currentUser.role) {
      case UserRole.STUDENT:
        return [
          { id: "TRANG_CHU", label: "Bảng tin & Hồ sơ chính", icon: Home },
          { id: "DIEM", label: "Tiến trình & Điểm số", icon: Award },
          { id: "HOATDONG", label: "SỰ kiện ngoại khóa", icon: Calendar },
          { id: "CLB", label: "Câu lạc bộ của tôi", icon: Users },
          { id: "MINHCHUNG", label: "Cấp minh chứng ngoại lệ", icon: FileText }
        ];
      case UserRole.ORGANIZER:
        return [
          { id: "DS_THANHVIEN", label: "Danh sách thành viên", icon: Users },
          { id: "TAO_HOATDONG", label: "Khai báo hoạt động", icon: PlusCircle },
          { id: "TAO_THONGBAO", label: "Đăng tải bảng thông báo", icon: Megaphone },
          { id: "QUANLY_DIEMDANH", label: "Sổ điểm danh & Event", icon: UserCheck }
        ];
      case UserRole.TRAINING_DEPT:
        return [
          { id: "IMPORT", label: "Nạp Điểm Học Tập", icon: UploadCloud },
          { id: "IMPORT_CLASSES", label: "Nạp Lớp Mới", icon: FileCode },
          { id: "LIST", label: "Đồng bộ rèn luyện", icon: BookOpen }
        ];
      case UserRole.FACULTY:
        return [
          { id: "STAT", label: "Theo dõi rèn luyện khoa", icon: BarChart2 },
          { id: "LOCKS", label: "Khóa dữ liệu & Ký duyệt", icon: Lock }
        ];
      case UserRole.ADMIN:
        return [
          { id: "CONFIG", label: "Cấu hình quy chế điểm", icon: Settings },
          { id: "PERIOD", label: "Quản lý Đợt đánh giá", icon: Clock },
          { id: "STATIONS", label: "Động cơ hệ thống", icon: Cpu },
          { id: "CLUBS", label: "Quản lý Tài khoản CLB", icon: Users }
        ];
      default:
        return [];
    }
  };

  const sidebarTabs = getSidebarTabs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden" id="unihub-app-layout">
      
      {/* 1. LEFT NARROW ICONIC MENU SIDEBAR (Requirement 1 - exactly like Microsoft/Redmond portal sidebar) */}
      <aside className="hidden md:flex flex-col items-center py-5 justify-between w-[72px] bg-white border-r border-slate-200 sticky top-0 h-screen z-50 shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo brand Phân hiệu Đại học Thái Nguyên tại Hà Giang */}
          <div className="w-10 h-10 select-none cursor-pointer transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100" title="UniHubHG Hệ thống">
            <TnuLogo size={32} />
          </div>

          <div className="w-8 border-b border-slate-100 pb-1" />

          {/* Dynamic Menu Icons based on active logged in Portal */}
          <div className="flex flex-col gap-3 w-full items-center">
            {sidebarTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activePortletTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePortletTab(tab.id)}
                  className={`p-3 rounded-xl transition-all relative group flex items-center justify-center cursor-pointer ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-150/80 shadow-xs scale-102" 
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                  title={tab.label}
                >
                  <TabIcon size={18} />
                  <span className="absolute left-[78px] bg-slate-900 border border-slate-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions inside the Left sidebar */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="w-8 border-b border-slate-100" />
          <button 
            onClick={logout}
            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 2. RIGHT HAND CONTENT SIDEBAR (Header sits right here, so it does NOT cut across the sidebar!) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/60 min-h-screen">
        
        {/* Horizontal Header (Bounded beside the menu sidebar!) */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90 shadow-2xs shrink-0 h-18 flex items-center justify-between px-6 lg:px-8">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 md:hidden">
              <TnuLogo size={32} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-405 font-mono tracking-wider uppercase leading-none">Phân hiệu ĐHTN tại Hà Giang</div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 mt-1.5 leading-none tracking-tight">Cổng Hệ thống UniHubHG</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-black text-slate-900">{currentUser.name}</span>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">{currentUser.username}</span>
            </div>

            <div className={`p-1 pl-1.5 pr-2.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${roleMeta.color}`}>
              <div className="p-0.5 bg-white/40 rounded-full">
                <IconComp size={10} />
              </div>
              <span>{roleMeta.label}</span>
            </div>

            {/* Logout button (Fallback for mobile screens) */}
            <button 
              onClick={logout}
              className="p-2 md:hidden bg-slate-150 hover:bg-slate-200 border text-slate-600 hover:text-slate-800 hover:cursor-pointer rounded-xl transition-all"
              title="Thoát hệ thống"
            >
              <LogOut size={14} />
            </button>
          </div>

        </header>

        {/* Core Main Viewport Panel */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderPortal()}
        </main>

        {/* Dynamic Class Stats and Ratings */}
        {currentUser?.role !== UserRole.ORGANIZER && <ClassStatisticsBottom />}

        {/* Clean Bottom Footer */}
        <footer className="bg-white border-t border-slate-200 py-5 px-6 lg:px-8 text-center text-xs text-slate-450 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              UniHub Rèn luyện © 2026. Công cụ quản lý tự động hoá thuộc Phân hiệu ĐHTN tại Hà Giang UniHubHG.
            </div>
            <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
              <Cpu size={12} className="text-slate-350" />
              <span>Xử lý và tính điểm tự động từ minh chứng thực tế</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
};

export default function App() {
  return (
    <UniHubProvider>
      <AppContent />
    </UniHubProvider>
  );
}
