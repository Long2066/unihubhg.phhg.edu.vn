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
  ClipboardList,
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
  Info,
  X,
  MapPin,
  Sparkles,
  ChevronDown,
  RefreshCw
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "alert";
  isRead: boolean;
  linkTab?: string;
  isClubAnnouncement?: boolean;
  clubName?: string;
  fullContent?: string;
  activityId?: string;
}

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    period, 
    activePortletTab, 
    setActivePortletTab,
    announcements,
    activities,
    registerForActivity,
    attendance,
    students,
    organizations,
    members,
    resetToSeeds,
    updateStudentProfile,
    selectedSemesterId,
    setSelectedSemesterId,
    evidence,
    classReviews,
    facultyReviews,
    feedbacks,
    results,
    dailyAttendance
  } = useUniHub();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // States for Editing profile
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  const studentId = currentUser?.targetId || "DTG245140202053";
  const studentObj = students.find(s => s.id === studentId || s.username === currentUser?.username);

  // Local state to track read and deleted notification IDs
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    if (!currentUser) return [];
    const cached = localStorage.getItem(`unihub_read_notifs_${currentUser.id}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [deletedNotifIds, setDeletedNotifIds] = useState<string[]>(() => {
    if (!currentUser) return [];
    const cached = localStorage.getItem(`unihub_deleted_notifs_${currentUser.id}`);
    return cached ? JSON.parse(cached) : [];
  });

  // Local state to track seen activity IDs for STUDENT role
  const [seenActivityIds, setSeenActivityIds] = useState<string[]>(() => {
    if (!currentUser) return [];
    const cached = localStorage.getItem(`unihub_seen_activities_${currentUser.id}`);
    return cached ? JSON.parse(cached) : [];
  });

  // Local state to track seen rejected evidence IDs for STUDENT role
  const [seenRejectedEvidenceIds, setSeenRejectedEvidenceIds] = useState<string[]>(() => {
    if (!currentUser) return [];
    const cached = localStorage.getItem(`unihub_seen_rejected_ev_${currentUser.id}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [selectedAnnForModal, setSelectedAnnForModal] = useState<any | null>(null);

  const saveReadNotifIds = (ids: string[]) => {
    if (!currentUser) return;
    setReadNotifIds(ids);
    localStorage.setItem(`unihub_read_notifs_${currentUser.id}`, JSON.stringify(ids));
  };

  const saveDeletedNotifIds = (ids: string[]) => {
    if (!currentUser) return;
    setDeletedNotifIds(ids);
    localStorage.setItem(`unihub_deleted_notifs_${currentUser.id}`, JSON.stringify(ids));
  };

  const saveSeenActivityIds = (ids: string[]) => {
    if (!currentUser) return;
    setSeenActivityIds(ids);
    localStorage.setItem(`unihub_seen_activities_${currentUser.id}`, JSON.stringify(ids));
  };

  const saveSeenRejectedEvidenceIds = (ids: string[]) => {
    if (!currentUser) return;
    setSeenRejectedEvidenceIds(ids);
    localStorage.setItem(`unihub_seen_rejected_ev_${currentUser.id}`, JSON.stringify(ids));
  };



  // Generate dynamic notification list based on roles and DB states
  const notifications: NotificationItem[] = React.useMemo(() => {
    if (!currentUser) return [];
    const list: NotificationItem[] = [];
    const targetId = currentUser.targetId || "";
    const todayStr = new Date().toISOString().split("T")[0];

    if (currentUser.role === UserRole.STUDENT) {
      // 1. Evidence approved/rejected
      evidence.forEach(ev => {
        if (ev.studentId === targetId && (ev.status === "APPROVED" || ev.status === "REJECTED")) {
          list.push({
            id: `ev-${ev.id}-${ev.status}`,
            title: ev.status === "APPROVED" ? "✅ Minh chứng được duyệt" : "❌ Minh chứng bị từ chối",
            message: `Minh chứng '${ev.activityName}' (+${ev.pointsRequested}đ) của bạn đã được duyệt ${ev.status === "APPROVED" ? "Chấp nhận" : "Từ chối"}.`,
            time: ev.submittedAt,
            type: ev.status === "APPROVED" ? "success" : "warning",
            isRead: readNotifIds.includes(`ev-${ev.id}-${ev.status}`),
            linkTab: "DIEM"
          });
        }
      });

      // 2. Club membership approved
      members.forEach(m => {
        if (m.studentId === targetId && m.status === "ACTIVE") {
          const org = organizations.find(o => o.id === m.orgId);
          list.push({
            id: `member-${m.id}`,
            title: "🎉 Thành viên CLB chính thức",
            message: `Yêu cầu tham gia CLB '${org?.name || m.orgId}' của bạn đã được phê duyệt thành công.`,
            time: m.joinedDate,
            type: "success",
            isRead: readNotifIds.includes(`member-${m.id}`),
            linkTab: "CLB"
          });
        }
      });

      // 3. New club announcements / BCH Meeting Announcements
      announcements.forEach(ann => {
        const titleLower = ann.title.toLowerCase();
        const contentLower = ann.content.toLowerCase();
        const isBCHMeeting = titleLower.includes("họp bch") || 
                             titleLower.includes("họp ban chấp hành") ||
                             contentLower.includes("họp bch") || 
                             contentLower.includes("họp ban chấp hành");

        if (isBCHMeeting) {
          // Check if student holds active BCH role in the publishing organization
          let isEligible = false;
          if (ann.orgId === "DOANTN") {
            isEligible = members.some(m => 
              m.studentId === targetId && 
              m.orgId === "DOANTN" && 
              m.status === "ACTIVE" && 
              ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
            );
          } else if (ann.orgId === "HOISV") {
            isEligible = members.some(m => 
              m.studentId === targetId && 
              m.orgId === "HOISV" && 
              m.status === "ACTIVE" && 
              ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
            );
          } else if (ann.orgId === "DOAN_HOI") {
            isEligible = members.some(m => 
              m.studentId === targetId && 
              (m.orgId === "DOANTN" || m.orgId === "HOISV") && 
              m.status === "ACTIVE" && 
              ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
            );
          } else {
            // For general clubs/orgs, check if active member has BCH/Leader role
            isEligible = members.some(m => 
              m.studentId === targetId && 
              m.orgId === ann.orgId && 
              m.status === "ACTIVE" && 
              ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
            );
          }

          if (!isEligible) return; // Non-BCH members do not get this notification

          if (ann.expiryDate && todayStr > ann.expiryDate) return;

          list.push({
            id: `ann-${ann.id}`,
            title: `📅 HỌP BCH KHẨN: ${ann.title}`,
            message: `${ann.content.substring(0, 80)}${ann.content.length > 80 ? "..." : ""}`,
            time: ann.createdAt,
            type: "warning",
            isRead: readNotifIds.includes(`ann-${ann.id}`),
            linkTab: "CLB",
            isClubAnnouncement: true,
            clubName: ann.orgName,
            fullContent: ann.content,
            activityId: ann.activityId
          });
        } else {
          // Normal announcement: check if active member
          const isMember = members.some(m => m.studentId === targetId && m.orgId === ann.orgId && m.status === "ACTIVE");
          if (isMember) {
            if (ann.expiryDate && todayStr > ann.expiryDate) return;
            list.push({
              id: `ann-${ann.id}`,
              title: `📢 THÔNG BÁO CLB: ${ann.title}`,
              message: `${ann.content.substring(0, 80)}${ann.content.length > 80 ? "..." : ""}`,
              time: ann.createdAt,
              type: "info",
              isRead: readNotifIds.includes(`ann-${ann.id}`),
              linkTab: "CLB",
              isClubAnnouncement: true,
              clubName: ann.orgName,
              fullContent: ann.content,
              activityId: ann.activityId
            });
          }
        }
      });

      // 4. Feedback from Adviser
      feedbacks.forEach(fb => {
        const studentObj = students.find(s => s.id === targetId);
        if ((fb.studentId === targetId || (fb.toClassId === studentObj?.classId && !fb.studentId)) && !fb.resolved) {
          list.push({
            id: `fb-${fb.id}`,
            title: `⚠️ Lưu ý từ GVCN ${fb.fromName}`,
            message: fb.comment,
            time: fb.createdAt,
            type: "warning",
            isRead: readNotifIds.includes(`fb-${fb.id}`),
            linkTab: "DIEM"
          });
        }
      });
    }

    else if (currentUser.role === UserRole.CLASS_MONITOR) {
      // 1. Pending evidence in their class
      evidence.forEach(ev => {
        if (ev.classId === targetId && ev.status === "PENDING") {
          list.push({
            id: `ev-pending-${ev.id}`,
            title: "📝 Minh chứng mới chờ duyệt",
            message: `Sinh viên ${ev.studentName} đã gửi minh chứng '${ev.activityName}' (+${ev.pointsRequested}đ) đang chờ bạn xét duyệt.`,
            time: ev.submittedAt,
            type: "alert",
            isRead: readNotifIds.includes(`ev-pending-${ev.id}`),
            linkTab: "TRANG_CHU"
          });
        }
      });

      // 2. Feedback unresolved for their class
      feedbacks.forEach(fb => {
        if (fb.toClassId === targetId && !fb.resolved) {
          list.push({
            id: `fb-class-${fb.id}`,
            title: "⚠️ Phản hồi nề nếp thi đua lớp",
            message: `${fb.fromName} lưu ý: "${fb.comment}"`,
            time: fb.createdAt,
            type: "warning",
            isRead: readNotifIds.includes(`fb-class-${fb.id}`),
            linkTab: "TRANG_CHU"
          });
        }
      });
    }

    else if (currentUser.role === UserRole.ADVISER) {
      // 1. Class scores submitted by Monitor
      classReviews.forEach(cr => {
        if (cr.classId === targetId && cr.representativeApproved && !cr.adviserApproved) {
          list.push({
            id: `class-sub-${cr.classId}`,
            title: "📊 Điểm lớp đã chốt",
            message: `Ban cán sự lớp ${cr.classId} đã gửi báo cáo tự xếp loại điểm rèn luyện, chờ bạn xét duyệt chính thức.`,
            time: cr.representativeApprovedAt || new Date().toISOString().split("T")[0],
            type: "alert",
            isRead: readNotifIds.includes(`class-sub-${cr.classId}`),
            linkTab: "TRANG_CHU"
          });
        }
      });

      // 2. Pending evidence in their class
      evidence.forEach(ev => {
        if (ev.classId === targetId && ev.status === "PENDING") {
          list.push({
            id: `ev-adv-pending-${ev.id}`,
            title: "📝 Minh chứng mới chờ duyệt",
            message: `Sinh viên ${ev.studentName} gửi minh chứng '${ev.activityName}' đang chờ Cố vấn lớp duyệt.`,
            time: ev.submittedAt,
            type: "info",
            isRead: readNotifIds.includes(`ev-adv-pending-${ev.id}`),
            linkTab: "TRANG_CHU"
          });
        }
      });
    }

    else if (currentUser.role === UserRole.ORGANIZER) {
      // 1. Pending membership applications
      members.forEach(m => {
        if (m.orgId === targetId && m.status === "PENDING") {
          list.push({
            id: `member-pending-${m.id}`,
            title: "📥 Đăng ký gia nhập CLB mới",
            message: `Sinh viên ${m.studentName} (${m.classId}) gửi hồ sơ ứng tuyển xin gia nhập CLB của bạn.`,
            time: m.joinedDate,
            type: "alert",
            isRead: readNotifIds.includes(`member-pending-${m.id}`),
            linkTab: "DS_THANHVIEN"
          });
        }
      });
    }

    else if (currentUser.role === UserRole.FACULTY) {
      // 1. Adviser approved class scores in their faculty
      classReviews.forEach(cr => {
        const belongsToFaculty = students.some(s => s.classId === cr.classId && s.facultyId === targetId);
        if (belongsToFaculty && cr.adviserApproved && !cr.facultyApproved) {
          list.push({
            id: `fac-review-${cr.classId}`,
            title: "📋 Lớp hoàn thành duyệt ký số",
            message: `Cố vấn lớp ${cr.classId} đã ký phê duyệt bảng rèn luyện, chờ Khoa ký duyệt số để khóa sổ.`,
            time: cr.adviserApprovedAt || new Date().toISOString().split("T")[0],
            type: "alert",
            isRead: readNotifIds.includes(`fac-review-${cr.classId}`),
            linkTab: "LOCKS"
          });
        }
      });
    }

    else if (currentUser.role === UserRole.TRAINING_DEPT) {
      // 1. Faculty locked their scores
      facultyReviews.forEach(fr => {
        if (fr.locked) {
          list.push({
            id: `fac-locked-${fr.facultyId}`,
            title: "🔒 Khoa đã khóa dữ liệu rèn luyện",
            message: `Khoa '${fr.facultyId}' đã ký duyệt và khóa sổ kết quả rèn luyện học kỳ, sẵn sàng đồng bộ.`,
            time: fr.lockedAt || new Date().toISOString().split("T")[0],
            type: "success",
            isRead: readNotifIds.includes(`fac-locked-${fr.facultyId}`),
            linkTab: "LIST"
          });
        }
      });
    }

    else if (currentUser.role === UserRole.ADMIN) {
      if (period.status === "LOCKED") {
        list.push({
          id: `period-locked-${period.id}`,
          title: "🔒 Đợt đánh giá đã khóa",
          message: `Học kỳ hiện tại ${period.semester} (${period.academicYear}) đã được khóa sổ rèn luyện thành công.`,
          time: period.endDate,
          type: "warning",
          isRead: readNotifIds.includes(`period-locked-${period.id}`),
          linkTab: "PERIOD"
        });
      }
    }

    // Default welcome notification for all roles
    list.push({
      id: "welcome-notif",
      title: "👋 Chào mừng bạn",
      message: `Chào mừng bạn quay lại hệ thống quản lý rèn luyện tự động hóa UniHubHG.`,
      time: new Date().toISOString().split("T")[0],
      type: "info",
      isRead: readNotifIds.includes("welcome-notif")
    });

    return list.filter(n => !deletedNotifIds.includes(n.id));
  }, [currentUser, evidence, members, organizations, announcements, feedbacks, students, classReviews, facultyReviews, period, readNotifIds, deletedNotifIds]);

  // Reactively mark notifications/activities as seen/read when visiting tabs
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== UserRole.STUDENT) return;

    if (activePortletTab === "TRANG_CHU") {
      const unread = notifications.filter(n => !n.isRead && (n.linkTab === "TRANG_CHU" || n.id === "welcome-notif"));
      if (unread.length > 0) {
        const newReadIds = [...readNotifIds, ...unread.map(n => n.id)];
        saveReadNotifIds(Array.from(new Set(newReadIds)));
      }
    } else if (activePortletTab === "DIEM") {
      const unread = notifications.filter(n => !n.isRead && n.linkTab === "DIEM");
      if (unread.length > 0) {
        const newReadIds = [...readNotifIds, ...unread.map(n => n.id)];
        saveReadNotifIds(Array.from(new Set(newReadIds)));
      }
    } else if (activePortletTab === "CLB") {
      const unread = notifications.filter(n => !n.isRead && n.linkTab === "CLB");
      if (unread.length > 0) {
        const newReadIds = [...readNotifIds, ...unread.map(n => n.id)];
        saveReadNotifIds(Array.from(new Set(newReadIds)));
      }
    } else if (activePortletTab === "HOATDONG") {
      const upcomingUnregisteredIds = activities
        .filter(a => a.status === "UPCOMING" && a.registrationOpen && !attendance.some(att => att.activityId === a.id && att.studentId === studentId))
        .map(a => a.id);
      const newSeenIds = Array.from(new Set([...seenActivityIds, ...upcomingUnregisteredIds]));
      if (newSeenIds.length !== seenActivityIds.length) {
        saveSeenActivityIds(newSeenIds);
      }
    } else if (activePortletTab === "MINHCHUNG") {
      const rejectedEvIds = evidence
        .filter(ev => ev.studentId === studentId && ev.status === "REJECTED")
        .map(ev => ev.id);
      const newSeenRejectedIds = Array.from(new Set([...seenRejectedEvidenceIds, ...rejectedEvIds]));
      if (newSeenRejectedIds.length !== seenRejectedEvidenceIds.length) {
        saveSeenRejectedEvidenceIds(newSeenRejectedIds);
      }
    }
  }, [activePortletTab, currentUser, notifications, activities, attendance, studentId]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      saveReadNotifIds([...readNotifIds, id]);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    saveReadNotifIds(Array.from(new Set([...readNotifIds, ...allIds])));
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deletedNotifIds.includes(id)) {
      saveDeletedNotifIds([...deletedNotifIds, id]);
    }
  };

  const handleClearAll = () => {
    const allIds = notifications.map(n => n.id);
    saveDeletedNotifIds(Array.from(new Set([...deletedNotifIds, ...allIds])));
  };

  const handleNotificationClick = (n: any) => {
    if (n.isClubAnnouncement) {
      if (!readNotifIds.includes(n.id)) {
        saveReadNotifIds([...readNotifIds, n.id]);
      }
      setSelectedAnnForModal(n);
    } else {
      handleMarkAsRead(n.id);
      if (n.linkTab) {
        setActivePortletTab(n.linkTab);
      }
    }
    setShowNotificationsDropdown(false);
  };

  const openProfileEditModal = () => {
    setEditName(currentUser.name);
    setEditAvatar(studentObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`);
    setEditPassword(currentUser.password || "");
    setProfileSuccessMsg("");
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Họ và tên không được để trống!");
      return;
    }
    const targetUserId = currentUser.targetId || currentUser.username || currentUser.id;
    updateStudentProfile(targetUserId, editName, editAvatar, editPassword);
    setProfileSuccessMsg("Đã cập nhật thông tin thành viên và mật khẩu thành công!");
    setTimeout(() => {
      setProfileSuccessMsg("");
      setShowProfileModal(false);
    }, 1500);
  };

  // Choose corresponding Portal View based on current logged in user role
  const renderPortal = () => {
    if (activePortletTab === "GIAM_SAT_SI_SO" && currentUser.role !== UserRole.ORGANIZER) {
      return <ClassStatisticsBottom />;
    }
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
      case UserRole.ORGANIZER: {
        const orgId = currentUser?.targetId || "";
        const org = organizations.find(o => o.id === orgId);
        let label = "CLB / Đoàn / Hội";
        if (org) {
          if (org.type === "CLB") label = "Câu lạc bộ";
          else if (org.type === "DOAN") label = "BCH Đoàn";
          else if (org.type === "HOI") label = "BCH Hội";
        }
        return { label, color: "bg-purple-100 text-purple-800 border-purple-200", icon: Users };
      }
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
          { id: "THOI_KHOA_BIEU", label: "Thời khóa biểu", icon: Clock },
          { id: "HOATDONG", label: "SỰ kiện ngoại khóa", icon: Calendar },
          { id: "CLB", label: "Câu lạc bộ của tôi", icon: Users },
          { id: "MINHCHUNG", label: "Cấp minh chứng ngoại lệ", icon: FileText },
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
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
          { id: "THOI_KHOA_BIEU", label: "Thời khóa biểu lớp", icon: Clock },
          { id: "LIST", label: "Đồng bộ rèn luyện", icon: BookOpen },
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
        ];
      case UserRole.FACULTY:
        return [
          { id: "STAT", label: "Theo dõi rèn luyện khoa", icon: BarChart2 },
          { id: "LOCKS", label: "Khóa dữ liệu & Ký duyệt", icon: Lock },
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
        ];
      case UserRole.ADMIN:
        return [
          { id: "CONFIG", label: "Cấu hình quy chế điểm", icon: Settings },
          { id: "PERIOD", label: "Quản lý Đợt đánh giá", icon: Clock },
          { id: "STATIONS", label: "Động cơ hệ thống", icon: Cpu },
          { id: "CLUBS", label: "Quản lý Tài khoản CLB", icon: Users },
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
        ];
      case UserRole.CLASS_MONITOR:
        return [
          { id: "TRANG_CHU", label: "Phân hệ báo cáo lớp", icon: Home },
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
        ];
      case UserRole.ADVISER:
        return [
          { id: "TRANG_CHU", label: "Xét duyệt & QL lớp", icon: Home },
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
        ];
      default:
        return [
          { id: "GIAM_SAT_SI_SO", label: "Giám sát Sĩ số", icon: ClipboardList }
        ];
    }
  };

  const getTabBadgeCount = (tabId: string): number => {
    if (!currentUser) return 0;
    
    if (currentUser.role === UserRole.STUDENT) {
      const studentId = currentUser.targetId || "DTG245140202053";
      switch (tabId) {
        case "TRANG_CHU":
          // Unread notifications linking to TRANG_CHU or welcome
          return notifications.filter(n => !n.isRead && (n.linkTab === "TRANG_CHU" || n.id === "welcome-notif")).length;
        case "DIEM":
          // Unread notifications linking to DIEM (e.g. gpa update, adviser feedback, evidence status changes)
          return notifications.filter(n => !n.isRead && n.linkTab === "DIEM").length;
        case "HOATDONG":
          // Number of upcoming activities open for registration that the student has not registered for and has not seen yet
          return activities.filter(a => 
            a.status === "UPCOMING" && 
            a.registrationOpen && 
            !attendance.some(att => att.activityId === a.id && att.studentId === studentId) &&
            !seenActivityIds.includes(a.id)
          ).length;
        case "CLB":
          // Unread notifications linking to CLB (e.g. club announcements, membership approved)
          return notifications.filter(n => !n.isRead && n.linkTab === "CLB").length;
        case "MINHCHUNG":
          // Count of rejected evidence submissions that the student has not seen yet
          return evidence.filter(ev => 
            ev.studentId === studentId && 
            ev.status === "REJECTED" &&
            !seenRejectedEvidenceIds.includes(ev.id)
          ).length;
        default:
          return 0;
      }
    }
    
    if (currentUser.role === UserRole.ORGANIZER) {
      const orgId = currentUser.targetId || "UNITECH";
      switch (tabId) {
        case "DS_THANHVIEN":
          return members.filter(m => m.orgId === orgId && m.status === "PENDING").length;
        default:
          return 0;
      }
    }
    
    if (currentUser.role === UserRole.CLASS_MONITOR) {
      const classId = currentUser.targetId || "";
      switch (tabId) {
        case "TRANG_CHU":
          return evidence.filter(ev => ev.classId === classId && ev.status === "PENDING").length;
        default:
          return 0;
      }
    }
    
    if (currentUser.role === UserRole.ADVISER) {
      const classId = currentUser.targetId || "";
      switch (tabId) {
        case "TRANG_CHU":
          const pendingEv = evidence.filter(ev => ev.classId === classId && ev.status === "PENDING").length;
          const pendingReview = classReviews.some(cr => cr.classId === classId && cr.representativeApproved && !cr.adviserApproved) ? 1 : 0;
          return pendingEv + pendingReview;
        default:
          return 0;
      }
    }
    
    if (currentUser.role === UserRole.FACULTY) {
      const facultyId = currentUser.targetId || "";
      switch (tabId) {
        case "LOCKS":
          return classReviews.filter(cr => {
            const studentObj = students.find(s => s.classId === cr.classId);
            return studentObj?.facultyId === facultyId && cr.adviserApproved && !cr.facultyApproved;
          }).length;
        default:
          return 0;
      }
    }

    if (currentUser.role === UserRole.TRAINING_DEPT) {
      switch (tabId) {
        case "LIST":
          return facultyReviews.filter(fr => fr.locked).length;
        default:
          return 0;
      }
    }
    
    return 0;
  };

  const sidebarTabs = getSidebarTabs();

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-row selection:bg-indigo-500 selection:text-white font-sans overflow-hidden" id="unihub-app-layout">
      
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
              const badgeCount = getTabBadgeCount(tab.id);
              
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
                    {badgeCount > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[9px] font-black h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-xs ring-1 ring-white">
                        {badgeCount}
                      </span>
                    )}
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
                      : "text-slate-405 hover:text-slate-700 hover:bg-slate-50 border-transparent"
                  }`}
                  title={tab.label}
                >
                  <TabIcon size={18} />
                  {badgeCount > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-black h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center shadow-xs ring-1 ring-white animate-pulse">
                      {badgeCount}
                    </span>
                  )}
                  <span className="absolute left-[78px] bg-slate-900 border border-slate-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </aside>

      {/* 2. RIGHT HAND CONTENT SIDEBAR (Header sits right here, so it does NOT cut across the sidebar!) */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/60 h-screen overflow-hidden">
        
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

          <div className="flex items-center gap-3 font-sans">
            
            {/* Top-Right Compact Profile Avatar + Name Block */}
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-150 p-1.5 pr-3 rounded-2xl transition-all cursor-pointer group shadow-2xs"
              >
                {/* Profile Image/Avatar representation */}
                <div className="relative shrink-0">
                  {studentObj?.avatar || currentUser.role === "STUDENT" ? (
                    <img 
                      referrerPolicy="no-referrer"
                      src={studentObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                      alt={currentUser.name} 
                      className="w-8 h-8 rounded-xl object-cover border border-slate-100 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`;
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                      {currentUser.name.trim().substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
                
                <div className="hidden md:flex flex-col text-right font-sans">
                  <span className="text-xs font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{currentUser.name}</span>
                  <span className="text-[8.5px] font-mono font-bold text-slate-400 mt-1 leading-none">
                    {currentUser.role === "STUDENT" ? "Sinh viên" : currentUser.role === "ORGANIZER" ? "Ban chủ nhiệm" : "Ban giám sát"}
                  </span>
                </div>
                
                <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
              </button>

              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                  <div className="absolute right-0 top-12 mt-1.5 bg-white border border-slate-200 shadow-2xl rounded-2xl w-76 sm:w-80 overflow-hidden z-200 animate-fade-in text-left divide-y divide-slate-100 shrink-0">
                    <div className="p-4 bg-slate-50 flex items-center gap-3">
                      <div>
                        {studentObj?.avatar || currentUser.role === "STUDENT" ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={studentObj?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                            alt={currentUser.name} 
                            className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm">
                            {currentUser.name.trim().substring(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 max-w-[180px]">
                        <h4 className="text-[12px] font-black text-slate-900 leading-tight truncate">{currentUser.name}</h4>
                        <p className="text-[10px] font-mono text-slate-400 font-bold leading-none">{currentUser.username}</p>
                        <span className="inline-block text-[8px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-750 rounded uppercase mt-1 tracking-wider">
                          Mã định danh: {currentUser.targetId || "ADMIN"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-3 font-sans">
                      {currentUser.role === "STUDENT" && studentObj && (
                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-150/60 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium text-left">
                            <div>Lớp: <span className="font-bold text-slate-900">{studentObj.classId}</span></div>
                            <div>Khoa: <span className="font-bold text-slate-900">{studentObj.facultyId}</span></div>
                          </div>
                      
                          <div className="space-y-1">
                            <label className="block text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Chọn học kì truy vấn:</label>
                            <select
                              value={selectedSemesterId}
                              onChange={(e) => setSelectedSemesterId(e.target.value)}
                              className="w-full bg-white border border-slate-250 text-[10.5px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 text-slate-800 focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="HOCKY_2_2025_2026">Học kỳ II - 2025-2026 (Hiện tại)</option>
                              <option value="HOCKY_1_2025_2026">Học kỳ I - 2025-2026 (Đã khóa)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <button 
                          onClick={openProfileEditModal}
                          className="w-full text-left font-bold text-xs text-slate-705 hover:text-indigo-600 hover:bg-indigo-50/50 px-3 py-2 rounded-xl border border-transparent hover:border-indigo-100 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <User size={13} className="text-slate-400" />
                          <span>Sửa hồ sơ & mật khẩu</span>
                        </button>

                        <button 
                          onClick={() => {
                            if (confirm("Hành động này sẽ tải lại toàn bộ hạt giáo dữ liệu rèn luyện mẫu, xóa sạch các lịch sử kiểm định học kỳ của bạn. Bạn có muốn khôi phục không?")) {
                              resetToSeeds();
                              alert("Đã phục hồi hoàn chỉnh dữ liệu mẫu!");
                              window.location.reload();
                            }
                          }}
                          className="w-full text-left font-bold text-xs text-slate-705 hover:text-amber-700 hover:bg-amber-50/50 px-3 py-2 rounded-xl border border-transparent hover:border-amber-100 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <RefreshCw size={13} className="text-slate-400" />
                          <span>Khôi phục dữ liệu mẫu</span>
                        </button>

                        <button 
                          onClick={logout}
                          className="w-full text-left font-bold text-xs text-slate-705 hover:text-rose-600 hover:bg-rose-50/50 px-3 py-2 rounded-xl border border-transparent hover:border-rose-100 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut size={13} className="text-slate-400" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bell Notification Button and Dropdown Icon Block */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`relative p-2.5 hover:bg-slate-50 border border-slate-150/85 hover:border-slate-350 rounded-xl text-slate-500 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-center ${
                  showNotificationsDropdown ? "bg-slate-55 border-slate-300 text-indigo-600" : "bg-white"
                }`}
                title="Thông báo cá nhân"
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
                          className="text-[9px] text-indigo-600 hover:text-indigo-850 font-extrabold px-1.5 py-0.5 rounded hover:bg-indigo-100/60 transition-colors cursor-pointer"
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
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100/60 custom-scrollbar text-slate-850 text-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                          <Inbox size={22} className="text-slate-300" />
                          <p className="text-[11px] font-bold text-slate-500">Bạn đã xem hết thông báo!</p>
                          <p className="text-[9px] text-slate-400 max-w-[240px] leading-relaxed mx-auto">Tất cả thông báo phê duyệt, phản hồi, cập nhật dữ liệu của bạn sẽ nằm gọn ở đây.</p>
                        </div>
                      ) : (
                        notifications.map((n: any) => {
                          let typeColorBg = "bg-blue-50/60 text-blue-600 border-blue-105 border-blue-100";
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
                          } else if (n.isClubAnnouncement) {
                            typeColorBg = "bg-amber-50/60 text-amber-700 border-amber-150";
                            TypeIcon = Megaphone;
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
                                  <h5 className={`text-[11px] leading-snug text-left ${!n.isRead ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                                    {n.title}
                                  </h5>
                                  <span className="text-[8px] font-mono font-medium text-slate-400 shrink-0 mt-0.5">{n.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 text-left font-sans">
                                  {n.message}
                                </p>
                                {((n.linkTab && !n.isClubAnnouncement) || (n.isClubAnnouncement && n.activityId)) && (
                                  <span className="inline-block text-[8px] font-black text-indigo-600 bg-indigo-55 px-1.5 py-0.5 rounded border border-indigo-150 uppercase tracking-tight mt-1.5">
                                    {n.isClubAnnouncement ? "Xem & Đăng ký sự kiện" : "Bấm để giải quyết ngay"}
                                  </span>
                                )}
                              </div>

                              <button 
                                onClick={(e) => handleDeleteNotification(n.id, e)}
                                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-opacity rounded cursor-pointer self-center shrink-0"
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
                      <span>Thông báo tích kiểm liên thông</span>
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

        {/* Scrollable container for main content and footer */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col">
          {/* Core Main Viewport Panel */}
          <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {renderPortal()}
          </main>

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

      </div>

      {selectedAnnForModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-md font-black">
                  {selectedAnnForModal.clubName}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedAnnForModal.time}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnForModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              <h3 className="text-base font-black text-slate-905 leading-snug">
                {selectedAnnForModal.title}
              </h3>
              <div className="text-xs text-slate-655 whitespace-pre-wrap leading-relaxed">
                {selectedAnnForModal.fullContent}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAnnForModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
