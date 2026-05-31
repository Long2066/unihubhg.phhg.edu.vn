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
  ShieldAlert as AdviserIcon
} from "lucide-react";

const AppContent: React.FC = () => {
  const { currentUser, logout, period } = useUniHub();

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

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans" id="unihub-app-layout">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              <TnuLogo size={32} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase leading-none">Phân hiệu ĐHTN tại Hà Giang</div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-none tracking-tight">UniHubHG</h1>
            </div>
          </div>

          {/* User Dossier inside header */}
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

            {/* Logout button */}
            <button 
              onClick={logout}
              className="p-2 bg-slate-150 hover:bg-slate-200/80 border text-slate-600 hover:text-slate-800 hover:cursor-pointer rounded-xl transition-all"
              title="Thoát hệ thống"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPortal()}
      </main>

      {/* Dynamic Class Stats and Ratings */}
      <ClassStatisticsBottom />

      {/* Footer bar */}
      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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
  );
};

export default function App() {
  return (
    <UniHubProvider>
      <AppContent />
    </UniHubProvider>
  );
}
