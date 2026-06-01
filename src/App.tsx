/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  Clock,
  ChevronLeft,
  ChevronRight,
  Bell,
  Trash2,
  Inbox,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Check,
  Info
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "alert";
  isRead: boolean;
  linkTab?: string;
}

const getInitialNotifications = (role: UserRole): NotificationItem[] => {
  switch (role) {
    case UserRole.STUDENT:
      return [
        {
          id: "st-1",
          title: "Minh chứng được duyệt",
          message: "Minh chứng tờ khai 'Đông ấm Biên giới 2025' (+10đ) đã được Ban cán sự lớp kiểm duyệt Chấp nhận.",
          time: "10 phút trước",
          type: "success",
          isRead: false,
          linkTab: "DIEM"
        },
        {
          id: "st-2",
          title: "Gia nhập Câu lạc bộ",
          message: "Ban chủ nhiệm CLB Sáng tạo Công nghệ UniTech đã phê duyệt và kết nạp bạn làm thành viên chính thức.",
          time: "2 giờ trước",
          type: "info",
          isRead: false,
          linkTab: "CLB"
        },
        {
          id: "st-3",
          title: "Cập nhật học lực",
          message: "Phòng Đào tạo Hà Giang đồng bộ bảng điểm chuyên cần hệ thống & GPA đạt 3.55.",
          time: "Hôm qua",
          type: "info",
          isRead: true,
          linkTab: "DIEM"
        },
        {
          id: "st-4",
          title: "Quyết định xử lý rèn luyện",
          message: "Văn phòng Khoa đã ký duyệt sơ bộ danh sách điểm loại TỐT của sinh viên toàn lớp.",
          time: "2 ngày trước",
          type: "warning",
          isRead: true
        }
      ];

    case UserRole.CLASS_MONITOR:
      return [
        {
          id: "cm-1",
          title: "Minh chứng mới",
          message: "Có 2 minh chứng quy chế mới từ sinh viên Lã Văn Đạt và Trần Văn Khánh đang chờ bạn phê duyệt.",
          time: "5 phút trước",
          type: "alert",
          isRead: false
        },
        {
          id: "cm-2",
          title: "Phản hồi thảo luận",
          message: "GVCN Hoàng Minh Đức đã gửi lưu ý chất lượng tự xếp loại rèn luyện thi đua lớp kì II.",
          time: "1 giờ trước",
          type: "info",
          isRead: false
        },
        {
          id: "cm-3",
          title: "Quyết định nề nếp",
          message: "Hệ thống tự động đồng bộ kết quả chuyên cần tích lũy tuần này thành công.",
          time: "Hôm qua",
          type: "success",
          isRead: true
        }
      ];

    case UserRole.ORGANIZER:
      return [
        {
          id: "org-1",
          title: "Ứng viên câu lạc bộ",
          message: "Có 3 hồ sơ xin gia nhập CLB mới cần xét duyệt đợt tuyển quân tháng 06/2026.",
          time: "15 phút trước",
          type: "alert",
          isRead: false,
          linkTab: "DS_THANHVIEN"
        },
        {
          id: "org-2",
          title: "Hoạt động đã khai báo",
          message: "Hoạt động 'Sân chơi Công nghệ trẻ' đã được Ban Quản lý ký phê duyệt phát sóng.",
          time: "3 giờ trước",
          type: "success",
          isRead: false
        },
        {
          id: "org-3",
          title: "Điểm danh tự động",
          message: "Quá trình đồng bộ điểm danh sự kiện 'Hiến máu Nhân đạo' của 45 thành viên hoàn thành.",
          time: "Hôm qua",
          type: "success",
          isRead: true
        }
      ];

    case UserRole.ADVISER:
      return [
        {
          id: "adv-1",
          title: "Lớp hoàn thành đánh giá",
          message: "Ban cán sự lớp K20-CNTT đã chốt điểm tự xếp loại và gửi yêu cầu phê duyệt.",
          time: "12 phút trước",
          type: "alert",
          isRead: false
        },
        {
          id: "adv-2",
          title: "Phản hồi phúc khảo loại",
          message: "Yêu cầu rà soát kỷ luật lỗi trễ chuyên môn từ sinh viên Lê Minh Tuấn gửi đến GVCN.",
          time: "4 giờ trước",
          type: "info",
          isRead: false
        },
        {
          id: "adv-3",
          title: "Ủy ban Khoa rà soát",
          message: "Hệ thống đã cập nhật biểu quyết kiểm soát dữ liệu rèn luyện từ Trưởng khoa chuyên trách.",
          time: "Hôm qua",
          type: "info",
          isRead: true
        }
      ];

    case UserRole.TRAINING_DEPT:
      return [
        {
          id: "td-1",
          title: "Duyệt dữ liệu Khoa",
          message: "Khoa Sư phạm đã hoàn thành kiểm soát xếp khảo và đồng bộ dữ liệu rèn luyện lên phòng đào tạo.",
          time: "30 phút trước",
          type: "alert",
          isRead: false
        },
        {
          id: "td-2",
          title: "Nhập điểm đồng loạt",
          message: "Tiến trình đồng bộ hoàn tất 1,240 bản ghi GPA phục hồi từ cơ quan khảo thí.",
          time: "3 giờ trước",
          type: "success",
          isRead: true
        }
      ];

    case UserRole.FACULTY:
      return [
        {
          id: "fac-1",
          title: "GVCN gửi ký số",
          message: "Lớp K20-CNTT đã được phê duyệt nề nếp thi đua từ GVCN Hoàng Minh Đức, đang chờ Khoa ký số.",
          time: "1 giờ trước",
          type: "alert",
          isRead: false
        },
        {
          id: "fac-2",
          title: "Tổ chức CLB báo cáo",
          message: "CLB Mỹ thuật đăng tuyển thành viên và cập nhật danh sách tổ kiểm nề nếp phong trào.",
          time: "Hôm qua",
          type: "info",
          isRead: true
        }
      ];

    case UserRole.ADMIN:
      return [
        {
          id: "adm-1",
          title: "Sao lưu bảo mật",
          message: "Backup dữ liệu Cloud Firestore an toàn tự động lúc 00:00 thành công.",
          time: "8 giờ trước",
          type: "success",
          isRead: false
        },
        {
          id: "adm-2",
          title: "Chỉ số hệ thống",
          message: "Lượt kết nối API rèn luyện thời gian thực đạt ngưỡng đỉnh béo cao tải kỷ lục.",
          time: "Hôm qua",
          type: "warning",
          isRead: true
        }
      ];

    default:
      return [
        {
          id: "def-1",
          title: "Chào mừng bạn",
          message: "Chào mừng bạn quay lại hệ thống quản lý rèn luyện tự động hóa UniHubHG.",
          time: "Vừa xong",
          type: "info",
          isRead: false
        }
      ];
  }
};

const AppContent: React.FC = () => {
  const { currentUser, logout, period, activePortletTab, setActivePortletTab } = useUniHub();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const storageKey = currentUser ? `unihub_notifications_${currentUser.id}` : "";
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (!currentUser) return [];
    const key = `unihub_notifications_${currentUser.id}`;
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
    return getInitialNotifications(currentUser.role);
  });

  if (!currentUser) {
    return <LoginScreen />;
  }

  const saveNotifications = (items: NotificationItem[]) => {
    setNotifications(items);
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    saveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const handleClearAll = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (n: NotificationItem) => {
    handleMarkAsRead(n.id);
    if (n.linkTab) {
      setActivePortletTab(n.linkTab);
    }
    setShowNotificationsDropdown(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
      
      {/* 1. DYNAMIC EXPANDABLE/COLLAPSIBLE LEFT MENU SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col py-5 justify-between bg-white border-r border-slate-200 sticky top-0 h-screen z-50 shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? "w-[240px] px-4" : "w-[72px] items-center px-0"
        }`}
      >
        <div className="flex flex-col items-center gap-6 w-full animate-fade-in">
          {/* Logo brand and toggle line */}
          <div className={`flex items-center ${isSidebarExpanded ? "justify-between w-full px-2" : "justify-center w-full"}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 select-none cursor-pointer transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 shrink-0" title="UniHubHG Hệ thống">
                <TnuLogo size={32} />
              </div>
              {isSidebarExpanded && (
                <div className="flex flex-col leading-none">
                  <span className="text-[11px] font-black tracking-wider text-indigo-700 uppercase">UniHubHG</span>
                  <span className="text-[8px] font-semibold text-slate-400 uppercase mt-0.5 whitespace-nowrap">PH HÀ GIANG</span>
                </div>
              )}
            </div>
            
            {isSidebarExpanded && (
              <button 
                onClick={() => setIsSidebarExpanded(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                title="Thu gọn menu"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {!isSidebarExpanded && (
            <button
              onClick={() => setIsSidebarExpanded(true)}
              className="p-1 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-700 text-indigo-600 rounded-lg cursor-pointer transition-all flex items-center justify-center w-8"
              title="Mở rộng menu"
            >
              <ChevronRight size={14} />
            </button>
          )}

          <div className="w-full border-b border-slate-100 pb-1" />

          {/* Dynamic Menu Icons based on active logged in Portal */}
          <div className={`flex flex-col gap-2.5 w-full ${isSidebarExpanded ? "items-stretch px-1" : "items-center px-0"}`}>
            {sidebarTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activePortletTab === tab.id;
              
              if (isSidebarExpanded) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePortletTab(tab.id)}
                    className={`px-3.5 py-3 rounded-xl transition-all relative group flex items-center gap-3 cursor-pointer w-full text-left border ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-600 border-indigo-150/80 shadow-2xs font-extrabold" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent font-medium"
                    }`}
                  >
                    <TabIcon size={16} className="shrink-0" />
                    <span className="text-xs tracking-tight truncate whitespace-nowrap transition-all duration-300">
                      {tab.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePortletTab(tab.id)}
                  className={`p-3 rounded-xl transition-all relative group flex items-center justify-center cursor-pointer border ${
                    isActive 
                      ? "bg-indigo-50 text-indigo-600 border-indigo-150/80 shadow-xs scale-102" 
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50 border-transparent"
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
        <div className={`flex flex-col gap-4 w-full ${isSidebarExpanded ? "px-2" : "items-center px-0"}`}>
          <div className="w-full border-b border-slate-100" />
          
          {isSidebarExpanded ? (
            <button 
              onClick={logout}
              className="px-3.5 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer flex items-center gap-3 w-full text-left font-bold animate-fade-in"
            >
              <LogOut size={16} className="shrink-0 text-slate-400 group-hover:text-rose-600" />
              <span className="text-xs uppercase tracking-wider truncate">Đăng xuất</span>
            </button>
          ) : (
            <button 
              onClick={logout}
              className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={16} />
            </button>
          )}
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
            <div className="hidden md:flex flex-col text-right font-sans">
              <span className="text-xs font-black text-slate-900">{currentUser.name}</span>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5">{currentUser.username}</span>
            </div>

            {/* Bell Notification Button and Dropdown Icon Block */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`relative p-2.5 hover:bg-slate-50 border border-slate-150/85 hover:border-slate-350 rounded-xl text-slate-500 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center ${
                  showNotificationsDropdown ? "bg-slate-55 border-slate-300 text-indigo-600" : "bg-white"
                }`}
                title="Thông báo hệ thống"
              >
                <Bell size={16} className={unreadCount > 0 ? "animate-swing" : ""} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm ring-1 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <>
                  {/* Click overlay layer */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationsDropdown(false)} />
                  
                  {/* Floating Droplist Panel */}
                  <div className="absolute right-0 top-11 mt-2 bg-white border border-slate-200/90 shadow-2xl rounded-2xl w-80 sm:w-[380px] overflow-hidden z-50 text-left animate-fade-in divide-y divide-slate-100/80">
                    {/* Header */}
                    <div className="px-4 py-3 bg-indigo-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell size={13} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Thông báo ({unreadCount})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleMarkAllAsRead} 
                          className="text-[9px] text-indigo-600 hover:text-indigo-805 hover:text-indigo-800 font-extrabold px-1.5 py-0.5 rounded hover:bg-indigo-100/60 transition-colors cursor-pointer"
                        >
                          Đọc hết
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={handleClearAll}
                          className="text-[9px] text-rose-600 hover:text-rose-800 font-extrabold px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Xóa hết
                        </button>
                      </div>
                    </div>

                    {/* Scroll Body */}
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Inbox size={22} className="text-slate-300" />
                          <p className="text-[11px] font-bold text-slate-500">Bạn đã xem hết thông báo!</p>
                          <p className="text-[9px] text-slate-400 max-w-[240px] leading-relaxed mx-auto">Tất cả thông báo phê duyệt, phản hồi, cập nhật dữ liệu của bạn sẽ nằm gọn ở đây.</p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          let typeColorBg = "bg-blue-50/60 text-blue-600 border-blue-100";
                          let TypeIcon = Info;
                          if (n.type === "success") {
                            typeColorBg = "bg-emerald-50/60 text-emerald-600 border-emerald-100";
                            TypeIcon = CheckCircle2;
                          } else if (n.type === "warning") {
                            typeColorBg = "bg-amber-50/60 text-amber-600 border-amber-100";
                            TypeIcon = AlertTriangle;
                          } else if (n.type === "alert") {
                            typeColorBg = "bg-rose-50/60 text-rose-600 border-rose-100";
                            TypeIcon = AlertCircle;
                          }

                          return (
                            <div 
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3 hover:bg-slate-50 transition-all flex gap-3 cursor-pointer relative items-start group ${
                                !n.isRead ? "bg-indigo-50/10" : ""
                              }`}
                            >
                              {!n.isRead && (
                                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-600 rounded-l" />
                              )}
                              
                              <div className={`p-1.5 rounded-lg border shrink-0 ${typeColorBg}`}>
                                <TypeIcon size={12} />
                              </div>

                              <div className="flex-1 space-y-0.5">
                                <div className="flex justify-between items-start gap-2">
                                  <h5 className={`text-[11px] leading-snug ${!n.isRead ? "font-black text-slate-900" : "font-bold text-slate-750 text-slate-705"}`}>
                                    {n.title}
                                  </h5>
                                  <span className="text-[8px] font-mono font-medium text-slate-400 shrink-0 mt-0.5">{n.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-600 leading-relaxed">
                                  {n.message}
                                </p>
                                {n.linkTab && (
                                  <div className="pt-1">
                                    <span className="inline-block text-[8px] font-black text-indigo-600 bg-indigo-55 px-1.5 py-0.5 rounded border border-indigo-150 uppercase tracking-tight">
                                      Bấm để giải quyết ngay
                                    </span>
                                  </div>
                                )}
                              </div>

                              <button 
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-300 hover:text-[rgb(225,29,72)] hover:text-rose-600 transition-opacity rounded cursor-pointer self-center shrink-0"
                                title="Xóa thông báo"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="px-3.5 py-2 bg-slate-50/80 text-center text-[8.5px] text-slate-400 font-mono flex justify-between items-center">
                      <span>Xử lý liên thông rèn luyện tự động</span>
                      <span>Hà Giang © 2026</span>
                    </div>
                  </div>
                </>
              )}
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
        <footer className="bg-white border-t border-slate-200 py-5 px-6 lg:px-8 text-center text-xs text-slate-450 shrink-0 pb-20 md:pb-5">
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

      {/* Mobile Navigation Bottom Bar for high-quality universal platform layout */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-1 z-50 flex justify-around items-center shadow-[0_-4px_12px_rgba(15,23,42,0.06)] bg-white/95 backdrop-blur-md">
        {sidebarTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activePortletTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePortletTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? "text-indigo-600 font-extrabold scale-102" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <TabIcon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
              <span className="text-[9px] font-bold tracking-tight truncate max-w-[76px]">
                {tab.label.split(" & ")[0].split(" / ")[0]}
              </span>
            </button>
          );
        })}
      </nav>

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
