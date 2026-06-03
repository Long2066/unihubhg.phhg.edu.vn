import React, { useState, useEffect } from "react";
import { useUniHub } from "../state";
import { STUDENT_FIELDS_META, Student } from "../types";
import { 
  Award, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  GraduationCap, 
  History, 
  Plus, 
  Upload, 
  Users, 
  X,
  PlusCircle,
  HelpCircle,
  Edit,
  User,
  Lock,
  ChevronRight,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Home,
  Menu,
  MapPin,
  Megaphone
} from "lucide-react";

// Predefined historical semesters for student DTG245140202053
const SEMESTER_HISTORY = [
  {
    id: "HOCKY_2_2025_2026",
    name: "Học kỳ II - 2025-2026",
    status: "Đang đánh giá",
    isCurrent: true,
  },
  {
    id: "HOCKY_1_2025_2026",
    name: "Học kỳ I - 2025-2026",
    status: "Đã chốt sổ",
    isCurrent: false,
    gpa: 3.55,
    learningStatus: "Bình thường",
    creditsEarned: 18,
    totalPoints: 82,
    grade: "TỐT",
    studyPoints: 18,
    violationPoints: 25,
    extracurricularPoints: 24,
    communityPoints: 10,
    achievementPoints: 5,
    logs: [
      { criteriaId: "TC1", points: 18, reason: "Phòng Đào tạo: Học lực giỏi GPA đạt 3.55", source: "ĐÀO TẠO", timestamp: "2026-01-10" },
      { criteriaId: "TC2", points: 25, reason: "Báo cáo nề nếp: Không vi phạm kỷ luật nội quy", source: "ĐÀO TẠO", timestamp: "2026-01-10" },
      { criteriaId: "TC3", points: 24, reason: "Ban chấp hành Đoàn: Tham gia đầy đủ các hoạt động chính trị xã hội", source: "CLB_ATTENDANCE", timestamp: "2025-12-15" },
      { criteriaId: "TC4", points: 10, reason: "Duyệt minh chứng ngoại lệ: Sự kiện Đông xuân tình nguyện Biên cương", source: "MINH_CHỨNG", timestamp: "2025-12-28" },
      { criteriaId: "TC5", points: 5, reason: "Ban cán sự lớp xác nhận: Đóng góp xuất sắc trong nề nếp lớp học kỳ", source: "BCS_DUYỆT", timestamp: "2026-01-05" }
    ]
  },
  {
    id: "HOCKY_2_2024_2025",
    name: "Học kỳ II - 2024-2025",
    status: "Đã chốt sổ",
    isCurrent: false,
    gpa: 3.24,
    learningStatus: "Bình thường",
    creditsEarned: 16,
    totalPoints: 77,
    grade: "KHÁ",
    studyPoints: 15,
    violationPoints: 25,
    extracurricularPoints: 22,
    communityPoints: 10,
    achievementPoints: 5,
    logs: [
      { criteriaId: "TC1", points: 15, reason: "Phòng Đào tạo: Học lực khá GPA đạt 3.24", source: "ĐÀO TẠO", timestamp: "2025-06-20" },
      { criteriaId: "TC2", points: 25, reason: "Báo cáo nề nếp: Nghiêm túc chấp hành nội quy giảng đường", source: "ĐÀO TẠO", timestamp: "2025-06-20" },
      { criteriaId: "TC3", points: 22, reason: "Ban chấp hành Đoàn: Tham gia Văn nghệ chào mừng 26/03", source: "CLB_ATTENDANCE", timestamp: "2025-05-18" },
      { criteriaId: "TC4", points: 10, reason: "Ban chấp hành Đoàn: Hoạt động Ngày Chủ nhật xanh bảo vệ dòng sông", source: "MINH_CHỨNG", timestamp: "2025-05-20" },
      { criteriaId: "TC5", points: 5, reason: "GVCN duyệt: Đạt gương sinh viên vượt khó giúp bạn học tập", source: "BCS_DUYỆT", timestamp: "2025-06-02" }
    ]
  },
  {
    id: "HOCKY_1_2024_2025",
    name: "Học kỳ I - 2024-2025",
    status: "Đã chốt sổ",
    isCurrent: false,
    gpa: 2.98,
    learningStatus: "Bình thường",
    creditsEarned: 19,
    totalPoints: 72,
    grade: "KHÁ",
    studyPoints: 15,
    violationPoints: 25,
    extracurricularPoints: 15,
    communityPoints: 12,
    achievementPoints: 5,
    logs: [
      { criteriaId: "TC1", points: 15, reason: "Phòng Đào tạo: Học lực khá GPA đạt 2.98", source: "ĐÀO TẠO", timestamp: "2025-01-15" },
      { criteriaId: "TC2", points: 25, reason: "Báo cáo nề nếp: Giữ gìn chuẩn mực phong cách sinh viên sư phạm", source: "ĐÀO TẠO", timestamp: "2025-01-15" },
      { criteriaId: "TC3", points: 15, reason: "Ban chủ nhiệm CLB: Hoạt động rèn luyện thể chất dã ngoại", source: "CLB_ATTENDANCE", timestamp: "2024-11-20" },
      { criteriaId: "TC4", points: 12, reason: "GVCN chốt: Quyên góp từ thiện ủng hộ gia đình bão lũ", source: "MINH_CHỨNG", timestamp: "2024-12-05" },
      { criteriaId: "TC5", points: 5, reason: "GVCN chốt: Có đóng góp tốt bảo vệ trật tự an toàn ký túc xá", source: "BCS_DUYỆT", timestamp: "2025-01-08" }
    ]
  }
];

export const StudentPortal: React.FC = () => {
  const { 
    currentUser, 
    period, 
    results, 
    activities, 
    attendance, 
    evidence, 
    registerForActivity, 
    submitEvidence, 
    organizations, 
    members, 
    joinOrganizationRequest,
    students,
    criteria,
    updateStudentProfile,
    resetToSeeds,
    announcements,
    updateMemberDetails,
    activePortletTab,
    setActivePortletTab,
    selectedSemesterId,
    setSelectedSemesterId,
    schedules
  } = useUniHub();

  const activeTab = (activePortletTab as "TRANG_CHU" | "DIEM" | "HOATDONG" | "CLB" | "MINHCHUNG" | "THOI_KHOA_BIEU") || "TRANG_CHU";
  const setActiveTab = (tab: "TRANG_CHU" | "DIEM" | "HOATDONG" | "CLB" | "MINHCHUNG" | "THOI_KHOA_BIEU") => {
    setActivePortletTab(tab);
  };

  const studentId = currentUser?.targetId || "DTG245140202053";
  const sObj = students?.find(s => s.id === studentId);

  const isDoanBCH = members.some(m => 
    m.studentId === studentId && 
    m.orgId === "DOANTN" && 
    m.status === "ACTIVE" && 
    ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
  );
  const isHoiBCH = members.some(m => 
    m.studentId === studentId && 
    m.orgId === "HOISV" && 
    m.status === "ACTIVE" && 
    ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
  );

  const statusColors = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-250";
      default: return "bg-amber-50 text-amber-700 border-amber-250";
    }
  };
  
  // States
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [activityMilestone, setActivityMilestone] = useState<"ALL" | "WEEK" | "MONTH" | "TERM">("ALL");
  
  // Club detailed popup states
  const [selectedClubIdDetail, setSelectedClubIdDetail] = useState<string | null>(null);
  const [profileAttachmentInput, setProfileAttachmentInput] = useState("");
  
  // Club registration Form States
  const [applyName, setApplyName] = useState("");
  const [applyGender, setApplyGender] = useState("Nam");
  const [applyDob, setApplyDob] = useState("");
  const [applyEthnicity, setApplyEthnicity] = useState("Kinh");
  const [applyPhone, setApplyPhone] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPermanentAddress, setApplyPermanentAddress] = useState("");
  const [applyTemporaryAddress, setApplyTemporaryAddress] = useState("");
  const [applyMajor, setApplyMajor] = useState("Công nghệ thông tin");
  const [applyAttachmentUrl, setApplyAttachmentUrl] = useState("");
  const [isApplyingClub, setIsApplyingClub] = useState(false);

  // Sync club registration defaults when active club details open
  useEffect(() => {
    if (sObj && selectedClubIdDetail) {
      setApplyName(sObj.name || "");
      setApplyEmail(sObj.email || "");
      // Defaults and resets
      setApplyGender("Nam");
      setApplyDob("2006-01-01");
      setApplyEthnicity("Kinh");
      setApplyPhone("");
      setApplyPermanentAddress("");
      setApplyTemporaryAddress("");
      setApplyMajor("Công nghệ thông tin");
      setApplyAttachmentUrl("");
      setIsApplyingClub(false);
    }
  }, [sObj, selectedClubIdDetail]);
  
  // Profiling Edit Dialog Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileFields, setProfileFields] = useState<Partial<any>>({});
  const [activeProfileTab, setActiveProfileTab] = useState<"personal" | "family" | "education" | "account">("personal");

  // Modal State for Evidence Upload
  const [showEvModal, setShowEvModal] = useState(false);
  const [evActivity, setEvActivity] = useState("");
  const [evCriteriaId, setEvCriteriaId] = useState("TC4.1");
  const [evPoints, setEvPoints] = useState(10);
  const [evDesc, setEvDesc] = useState("");
  const [evFile, setEvFile] = useState<File | null>(null);
  const [evFileMockUrl, setEvFileMockUrl] = useState("giay_xac_nhan.jpg");

  // Feed filters for CLB Announcements and Activities on Student Dashboard
  const [clubFeedTab, setClubFeedTab] = useState<"ALL" | "ANNOUNCEMENTS" | "ACTIVITIES">("ALL");
  const [onlyMyClubsFilter, setOnlyMyClubsFilter] = useState(false);
  const [selectedStudentScheduleClass, setSelectedStudentScheduleClass] = useState("");
  const [announcementKeyword, setAnnouncementKeyword] = useState("");

  // States for professional activity news board ticker & carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTicker, setCurrentTicker] = useState(0);

  // Automated scroll for news ticker & carousel
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3); // 3 featured slides
    }, 7000);
    
    const tickerTimer = setInterval(() => {
      setCurrentTicker((prev) => (prev + 1) % 5); // 5 ticker items
    }, 5000);
    
    return () => {
      clearInterval(slideTimer);
      clearInterval(tickerTimer);
    };
  }, []);

  // Sync profile editing states
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditAvatar(sObj?.avatar || "");
      setEditPassword(currentUser.password || "password123");
      
      if (sObj) {
        const fields: Partial<any> = {};
        STUDENT_FIELDS_META.forEach(f => {
          (fields as any)[f.key] = (sObj as any)[f.key] || "";
        });
        setProfileFields(fields);
      }
    }
  }, [currentUser, sObj, showProfileModal]);

  // Handle profile edit save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Họ và tên không được để trống!");
      return;
    }
    updateStudentProfile(studentId, editName, editAvatar, editPassword, profileFields);
    setProfileSuccessMsg("Đã cập nhật thông tin thành viên và mật khẩu thành công!");
    setTimeout(() => {
      setProfileSuccessMsg("");
      setShowProfileModal(false);
    }, 1500);
  };

  // Find dynamic criteria
  const getCriteriaDetail = (cid: string, defaultName: string, defaultDesc: string, defaultMax: number) => {
    const found = criteria.find(c => c.id === cid);
    return {
      categoryName: found ? found.category : defaultName,
      description: found ? found.description : defaultDesc,
      maxScore: found ? found.maxScore : defaultMax
    };
  };

  const tc1 = getCriteriaDetail("TC1", "1. Ý thức học tập", "GPA, đăng ký tín chỉ và cảnh báo từ phòng đào tạo", 20);
  const tc2 = getCriteriaDetail("TC2", "2. Ý thức chấp hành nội quy", "Tuân quy chế thi, bảo hiểm xã hội, kỷ luật giảng đường", 25);
  const tc3 = getCriteriaDetail("TC3", "3. Hoạt động chính trị, xã hội, CLB", "Sinh hoạt Đoàn-Hội, hiến máu, tham gia chiến dịch tình nguyện", 30);
  const tc4 = getCriteriaDetail("TC4", "4. Ý thức công dân, cộng đồng", "Phong trào tự quản, hiến máu, địa bàn dân cư hỗ trợ", 15);
  const tc5 = getCriteriaDetail("TC5", "5. Chức vụ, thành tích, khen thưởng đặc biệt", "Cán sự Đoàn, lớp trưởng, giấy biểu dung huyện, tỉnh", 10);

  const exceptionRules = criteria.flatMap(c => 
    c.rules.filter(r => r.type === "EXCEPTION").map(r => ({
      criteriaId: r.id,
      categoryName: c.category,
      name: r.name,
      points: r.points
    }))
  );

  const myAttendance = attendance.filter(a => a.studentId === studentId);
  const myEvidence = evidence.filter(e => e.studentId === studentId);
  const myOrganizations = members.filter(m => m.studentId === studentId);

  // Determine current or historic semester selection
  const isSelectedCurrent = selectedSemesterId === "HOCKY_2_2025_2026";
  const historicSem = SEMESTER_HISTORY.find(h => h.id === selectedSemesterId);

  // Compute live academic data
  const liveGpa = sObj?.gpa ?? 3.42;
  const currentGpa = isSelectedCurrent ? liveGpa : (historicSem?.gpa ?? 3.0);
  const currentLearningStatus = isSelectedCurrent ? (sObj?.learningStatus || "Bình thường") : (historicSem?.learningStatus || "Bình thường");
  const currentCreditsEarned = isSelectedCurrent ? (sObj?.creditsEarned || 15) : (historicSem?.creditsEarned || 15);

  const getAcademicClassification = (gpa: number) => {
    if (gpa >= 3.6) return { label: "XUẤT SẮC", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-250" };
    if (gpa >= 3.2) return { label: "GIỎI", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-250" };
    if (gpa >= 2.5) return { label: "KHÁ", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-250" };
    if (gpa >= 2.0) return { label: "TRUNG BÌNH", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-250" };
    return { label: "YẾU / KÉM", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-250" };
  };

  const academicMeta = getAcademicClassification(currentGpa);

  // Compute live conduct data
  const liveResult = results.find(r => r.studentId === studentId);
  const currentConductPoints = isSelectedCurrent ? (liveResult?.totalPoints ?? 0) : (historicSem?.totalPoints ?? 0);
  const currentConductStatus = isSelectedCurrent ? (liveResult?.status || "AUTO") : "LOCKED";

  const getConductClassification = (points: number) => {
    if (points >= 90) return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-250", label: "XUẤT SẮC" };
    if (points >= 80) return { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-250", label: "TỐT" };
    if (points >= 70) return { text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-250", label: "KHÁ" };
    if (points >= 50) return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-250", label: "TRUNG BÌNH" };
    return { text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-250", label: "YẾU / KÉM" };
  };

  const conductMeta = getConductClassification(currentConductPoints);

  // Retrieve current or historic breakdown
  const studyPoints = isSelectedCurrent ? (liveResult?.studyPoints ?? 0) : (historicSem?.studyPoints ?? 0);
  const violationPoints = isSelectedCurrent ? (liveResult?.violationPoints ?? 0) : (historicSem?.violationPoints ?? 0);
  const extracurricularPoints = isSelectedCurrent ? (liveResult?.extracurricularPoints ?? 0) : (historicSem?.extracurricularPoints ?? 0);
  const communityPoints = isSelectedCurrent ? (liveResult?.communityPoints ?? 0) : (historicSem?.communityPoints ?? 0);
  const achievementPoints = isSelectedCurrent ? (liveResult?.achievementPoints ?? 0) : (historicSem?.achievementPoints ?? 0);

  const displayLogs = isSelectedCurrent ? (liveResult?.logs || []) : (historicSem?.logs || []);

  // Filter activities by weekly/monthly/semester milestones
  const filterByMilestone = (act: typeof activities[number]) => {
    if (activityMilestone === "ALL") return true;
    
    // Check if the date can be parsed
    const actDateObj = new Date(act.dateTime.substring(0, 10));
    const now = new Date();
    
    if (!isNaN(actDateObj.getTime())) {
      const diffTime = Math.abs(now.getTime() - actDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (activityMilestone === "WEEK") {
        return diffDays <= 7 || act.title.toLowerCase().includes("hội thảo") || act.title.toLowerCase().includes("tuần");
      }
      if (activityMilestone === "MONTH") {
        return diffDays <= 30 || act.title.toLowerCase().includes("nghị quyết") || act.title.toLowerCase().includes("tháng") || act.title.toLowerCase().includes("ngày hội");
      }
      if (activityMilestone === "TERM") {
        return diffDays <= 120;
      }
    } else {
      // Fallback if not valid ISO/Date structure
      if (activityMilestone === "WEEK") {
        return act.id === "ACT_03" || act.title.toLowerCase().includes("hội thảo") || act.title.toLowerCase().includes("tuần");
      }
      if (activityMilestone === "MONTH") {
        return act.id === "ACT_04" || act.title.toLowerCase().includes("nghị quyết") || act.title.toLowerCase().includes("tháng") || act.title.toLowerCase().includes("ngày hội");
      }
      if (activityMilestone === "TERM") {
        return act.id !== "ACT_03" && act.id !== "ACT_04" && !act.title.toLowerCase().includes("hội thảo") && !act.title.toLowerCase().includes("nghị quyết");
      }
    }
    return true;
  };

  // Only display Clubs ("Mục 'CLB / Hội của tôi' chỉ để mỗi 'Câu lạc bộ'")
  const filteredClubs = organizations.filter(o => o.type === "CLB");

  // Handle evidence form submission
  const handleSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evActivity.trim() || !evDesc.trim()) {
      alert("Vui lòng điền đầy đủ tên hoạt động và mô tả chính xác!");
      return;
    }
    
    submitEvidence({
      studentId,
      studentName: currentUser?.name || "Nguyễn Văn An",
      classId: sObj?.classId || "K20-CNTT",
      criteriaId: evCriteriaId,
      activityName: evActivity,
      description: evDesc,
      pointsRequested: Number(evPoints),
      proofUrl: evFileMockUrl
    });

    // Reset forms
    setEvActivity("");
    setEvDesc("");
    setShowEvModal(false);
  };

  const renderProfileBanner = () => {
    return (
      <div className="bg-white py-3 px-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-3.5 items-center">
          {sObj?.avatar ? (
            <img 
              referrerPolicy="no-referrer"
              src={sObj.avatar} 
              alt={currentUser?.name} 
              className="w-11 h-11 rounded-full object-cover shadow-xs border border-indigo-100 shrink-0" 
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-xs uppercase shrink-0">
              {currentUser?.name.substring(0, 2)}
            </div>
          )}
          
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900 leading-none">{currentUser?.name}</h2>
              <span className="text-[10px] font-mono bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold">
                MSSV: {studentId}
              </span>
              {isDoanBCH && (
                <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-705 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  ★ Ủy viên BCH Đoàn Phân hiệu
                </span>
              )}
              {isHoiBCH && (
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-705 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  ★ Ủy viên BCH Hội Phân hiệu
                </span>
              )}
              <button 
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="text-[10px] bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-600 border border-indigo-100/60 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
              >
                <Edit size={10} />
                <span>Sửa hồ sơ / Đổi MK</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu mẫu ban đầu để dọn dẹp bộ nhớ cache không?")) {
                    resetToSeeds();
                    window.location.reload();
                  }
                }}
                className="text-[10px] bg-amber-50 hover:bg-amber-105 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
                title="Khôi phục dữ liệu mẫu ban đầu"
              >
                <History size={10} />
                <span>Đặt lại dữ liệu gốc</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-550 flex items-center gap-2 flex-wrap font-medium">
              <span>Lớp quản lý: <strong className="text-slate-800">{sObj?.classId || "K20-CNTT"}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Khoa đào tạo: <strong className="text-slate-800">{sObj?.facultyId === "K-CNTT" ? "Khoa Công nghệ Thông tin" : "Khoa Sư phạm"}</strong></span>
            </div>
          </div>
        </div>

        {/* Dynamic Semester Selector and Data locks */}
        <div className="flex gap-2.5 shrink-0 w-full md:w-auto items-center">
          <div className="py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Học Kỳ:</span>
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="bg-transparent border-0 text-xs font-black text-slate-800 p-0 focus:ring-0 focus:outline-none cursor-pointer"
            >
              {SEMESTER_HISTORY.map(sem => (
                <option key={sem.id} value={sem.id} className="text-slate-800 text-xs">
                  {sem.name} {sem.isCurrent ? " (Hiện tại)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className={`py-1.5 px-3 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold ${
            currentConductStatus === "LOCKED" 
              ? "bg-rose-50/60 border-rose-100 text-rose-700" 
              : "bg-emerald-50/60 border-emerald-100 text-emerald-700"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentConductStatus === "LOCKED" ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`}></span>
            <span>{currentConductStatus === "LOCKED" ? "Đã Chốt Sổ Kỳ" : "Ủy Quyền Tự Động"}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderNewsBoard = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md" id="student-news-board">
        
        {/* Real-time Scrolling Ticker Banner */}
        <div className="bg-slate-900 text-white py-2.5 px-4 text-xs flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-2 shrink-0 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
            <Sparkles size={11} />
            <span>TIN MỚI</span>
          </div>
          
          <div className="flex-1 overflow-hidden h-5 relative flex items-center">
            {[
              "📌 HỌC KỲ II 2025-2026: Đang trong giai đoạn rà soát và tự chốt đánh giá điểm rèn luyện cấp Chi đoàn trước ngày 15/06/2026!",
              "🔥 SỰ KIỆN HOT: Đăng ký ngay 'Mùa hè xanh - Sức trẻ Biên cương' nhận ngay 10 điểm rèn luyện thuộc nhóm TC4.1!",
              "💡 Mẹo hay rèn luyện: Bạn có thể tự chụp minh chứng hoạt động ngoại lệ để xin cộng điểm trực tiếp lên hệ thông trực tuyến.",
              "Club News: CLB Sáng tạo Công nghệ UniTech thông báo cập nhật kết quả chuyên cần định kỳ tháng 05/2026.",
              "📢 HÀNH CHÍNH: Văn phòng Khoa đã bắt đầu đồng bộ Kết quả GPA từ Phòng Đào tạo về cơ sở dữ liệu rèn luyện tự động học kỳ II."
            ].map((text, idx) => (
              <div 
                key={idx} 
                className={`absolute w-full truncate transition-all duration-700 ease-out flex items-center gap-1.5 font-bold text-slate-205 text-[11px] ${
                  idx === currentTicker 
                    ? "opacity-100 translate-y-0 text-amber-305" 
                    : "opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-1 shrink-0">
            <button 
              type="button"
              onClick={() => setCurrentTicker((prev) => (prev - 1 + 5) % 5)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Quay lại"
            >
              <ChevronRight size={13} className="rotate-180" />
            </button>
            <button 
              type="button"
              onClick={() => setCurrentTicker((prev) => (prev + 1) % 5)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Tiếp theo"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Event Banner Center split into 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          <div className="lg:col-span-7 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  🔥 Sự kiện học đường nổi bật
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Slide {currentSlide + 1} / 3</span>
              </div>

              {[
                {
                  id: "ACT_04",
                  title: "Hội nghị Học tập Nghị quyết & Diễn đàn Sinh viên 5 Tốt",
                  orgName: "BCH Đoàn TNCS Phân hiệu Hà Giang",
                  points: 5,
                  dateTime: "2026-06-05 08:30",
                  location: "Hội trường Hoa Ban",
                  description: "Triển khai học tập chính trị chuyên đề bắt buộc của sinh viên và Vinh danh các gương mặt tiêu biểu phong trào Sinh viên 5 Tốt.",
                  badge: "BẮT BUỘC",
                  color: "from-blue-600 via-indigo-700 to-indigo-800",
                  tc: "TC3.1"
                },
                {
                  id: "ACT_05",
                  title: "Chiến dịch tình nguyện Mùa hè xanh - Sức trẻ Biên cương",
                  orgName: "BCH Đoàn TNCS Phân hiệu Hà Giang",
                  points: 10,
                  dateTime: "2026-07-01 07:00",
                  location: "Huyện Hoàng Su Phì, Hà Giang",
                  description: "Chuyến đi thực tế đem công nghệ và tri thức lên vùng biên giới Hà Giang, hỗ trợ xây dựng nếp sống văn hóa, dạy học và từ thiện.",
                  badge: "ƯU TIÊN LỚN",
                  color: "from-emerald-600 via-teal-700 to-indigo-800",
                  tc: "TC4.1"
                },
                {
                  id: "ACT_03",
                  title: "Hội thảo 'AI & Tương lai nghề nghiệp ngành Công nghệ'",
                  orgName: "CLB Sáng tạo Công nghệ UniTech",
                  points: 5,
                  dateTime: "2026-05-25 14:00",
                  location: "Phòng Seminar nhà B",
                  description: "Đón đầu làn sóng công nghệ, hướng dẫn ứng dụng Generative AI, Gemini API vào hỗ trợ học tập, nghiên cứu và nghề nghiệp.",
                  badge: "KỸ NĂNG",
                  color: "from-purple-600 via-pink-700 to-indigo-800",
                  tc: "TC3.1"
                }
              ].map((slide, sIdx) => {
                const studentReg = myAttendance.find(a => a.activityId === slide.id);
                const isRegistered = !!studentReg;
                
                return (
                  <div 
                    key={slide.id}
                    className={`transition-all duration-500 ease-in-out ${
                      sIdx === currentSlide ? "block opacity-100 scale-100" : "hidden opacity-0 scale-95"
                    }`}
                  >
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${slide.color} text-white mb-4 shadow-sm relative overflow-hidden group`}>
                      <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-5 translate-y-5 select-none pointer-events-none transition-transform group-hover:scale-110 duration-700">
                        <Award size={150} />
                      </div>
                      
                      <div className="relative z-10 text-left">
                        <div className="flex gap-2 items-center mb-2">
                          <span className="text-[9px] font-black tracking-wider bg-white/25 px-2 py-0.5 rounded uppercase">
                            {slide.badge}
                          </span>
                          <span className="text-[9px] bg-emerald-500 text-white font-mono px-2 py-0.5 rounded font-bold">
                            +{slide.points} ĐIỂM RÈN LUYỆN
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-black tracking-tight leading-snug">{slide.title}</h4>
                        <p className="text-[10px] text-white/80 mt-1 line-clamp-2 leading-relaxed shrink-0 font-light">{slide.description}</p>
                        
                        <div className="flex items-center gap-3 text-[10px] text-white/90 font-mono mt-3 border-t border-white/10 pt-2 flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={11} /> {slide.dateTime}</span>
                          <span className="flex items-center gap-1">• Địa điểm: {slide.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-left">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 block font-bold">Đơn vị chủ trì</span>
                        <span className="text-xs font-black text-slate-705">{slide.orgName}</span>
                      </div>
                      
                      <div>
                        {isRegistered ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-lg border border-emerald-200">
                            <CheckCircle size={12} className="text-emerald-600" />
                            <span>Đã đăng ký</span>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              registerForActivity(slide.id, studentId);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white hover:cursor-pointer text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-100 transition-all cursor-pointer"
                          >
                            <PlusCircle size={13} />
                            <span>Đăng ký tham gia</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-1 md:w-4 h-1 px-0 rounded-full transition-all cursor-pointer ${
                      idx === currentSlide ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Smart Milestones Tracker Card */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between" id="smart-criteria-recommender">
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                  💡 Gợi ý Rèn Luyện Cá Nhân
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">Đào Tạo AI</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed text-left">
                  Tài khoản <strong className="text-slate-800">{currentUser?.name}</strong> đạt <strong className="text-indigo-650 font-mono font-bold">{currentConductPoints} điểm rèn luyện</strong>, xếp loại <span className={`font-black px-1.5 py-0.5 rounded text-[10px] border ${conductMeta.bg} ${conductMeta.text} ${conductMeta.border}`}>{conductMeta.label}</span>.
                </p>

                {currentConductPoints < 90 ? (
                  <div className="bg-white border border-slate-100 p-3.5 rounded-xl space-y-2 text-left shadow-xs">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>Lộ trình lên mức Xuất sắc (90+ đRL)</span>
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Bạn chỉ cần tích lũy thêm <strong className="text-emerald-650">{Math.max(1, 90 - currentConductPoints)} điểm</strong> nữa để thăng hạng xếp loại rèn luyện kỳ này:
                    </p>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 font-medium">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>Đăng ký Chiến dịch <strong>Mùa hè xanh</strong> (+10 điểm nhóm TC4.1)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>Tham gia <strong>Hội nghị học tập chính trị</strong> ngày 05/06 (+5 điểm nhóm TC3.1)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-indigo-500 mt-0.5">→</span>
                        <button 
                          type="button"
                          onClick={() => setActiveTab("MINHCHUNG")}
                          className="text-indigo-600 underline hover:text-indigo-805 cursor-pointer font-bold inline-flex items-center gap-0.5 text-left text-[11px] bg-transparent border-0 p-0"
                        >
                          Tự đính kèm minh chứng ngoại lệ để xin cộng điểm
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl space-y-1 text-left">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                      <CheckCircle size={11} className="text-emerald-600" />
                      <span>Rèn Luyện Đạt Đỉnh Xuất Sắc!</span>
                    </span>
                    <p className="text-xs text-emerald-850 leading-relaxed">
                      Chúc mừng bạn đã đạt xuất sắc! Thành tích rèn luyện của bạn sẽ được bảo vệ khi kỳ học chốt sổ. Hãy tiếp tục duy trì và giúp đỡ các sinh viên khác trong chi đoàn nhé!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 text-left">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Tham gia CLB & Đoàn:</span>
                <span className="font-bold text-indigo-600">Đã tham gia {filteredClubs.length} CLB chuyên môn</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  };

  const renderClubNotifications = () => {
    // Filter memberships for current student
    const studentMemberships = members.filter(m => m.studentId === studentId);
    
    if (studentMemberships.length === 0) return null;

    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3" id="club-notifications-center">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <div className="p-1 px-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold font-mono">
            ✉
          </div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Hộp Thư Thông Báo Trạng Thái Gia Nhập CLB ({studentMemberships.length})
          </h4>
        </div>

        <div className="space-y-2.5">
          {studentMemberships.map(m => {
            const club = organizations.find(o => o.id === m.orgId);
            if (!club) return null;

            const isApproved = m.status === "ACTIVE";
            const isPending = m.status === "PENDING";

            return (
              <div 
                key={m.id} 
                className={`p-3.5 rounded-xl border text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${
                  isApproved 
                    ? "bg-emerald-50/45 border-emerald-150 text-emerald-950" 
                    : isPending 
                    ? "bg-amber-50/45 border-amber-150 text-amber-950" 
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${isApproved ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                    <span className="font-extrabold uppercase text-[10px] tracking-wide font-mono">
                      {isApproved ? "Phê duyệt thành công" : "Hồ sơ đang chờ duyệt"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">• {m.joinedDate}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isApproved ? (
                      <>
                        Chúc mừng sinh viên <strong className="font-bold text-emerald-900">{m.studentName || sObj?.name || "bạn"}</strong>! Đơn của bạn gia nhập <strong className="font-bold text-indigo-700">{club.name}</strong> đã được <strong className="font-bold text-slate-700">Chủ nhiệm {club.leaderName}</strong> xét duyệt đồng ý. Chức danh của bạn là <strong className="px-1.5 py-0.2 bg-emerald-100 border border-emerald-250 text-emerald-800 rounded font-black">{m.role}</strong>.
                      </>
                    ) : (
                      <>
                        Hồ sơ xin gia nhập <strong className="font-bold text-amber-900">{club.name}</strong> của bạn đã được nhận vào hệ thống thành công. Các thông tin khai báo (SĐT: <span className="font-mono">{m.phone}</span>, Học chuyên ngành: {m.major}) đang chờ <strong className="font-bold text-slate-700">Ban chủ nhiệm {club.leaderName}</strong> thẩm duyệt tài khoản chính thức.
                      </>
                    )}
                  </p>
                  {m.attachmentUrl && (
                    <div className="flex items-center gap-1.5 text-[10.5px] mt-1">
                      <span className="text-slate-400 font-sans">Đơn ứng tuyển đính kèm:</span>
                      <a 
                        href={m.attachmentUrl} 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer" 
                        className="text-indigo-600 hover:underline font-mono truncate max-w-xs"
                      >
                        {m.attachmentUrl}
                      </a>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center">
                  <button 
                    onClick={() => {
                      setSelectedClubIdDetail(club.id);
                      setProfileAttachmentInput(m.attachmentUrl || "");
                    }}
                    className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider cursor-pointer border ${
                      isApproved 
                        ? "bg-white hover:bg-emerald-100/50 text-emerald-800 border-emerald-250 hover:border-emerald-300" 
                        : "bg-white hover:bg-amber-100/50 text-amber-800 border-amber-250 hover:border-amber-300"
                    }`}
                  >
                    Xem Chi tiết CLB →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderClubFeed = () => {
    const studentMemberships = members.filter(m => m.studentId === studentId && m.status === "ACTIVE");
    const joinedClubIds = studentMemberships.map(m => m.orgId);
    const todayStr = new Date().toISOString().split("T")[0];

    // Get active / upcoming / completed club and youth union activities
    const activeClubActs = activities.filter(act => {
      const club = organizations.find(o => o.id === act.orgId);
      if (!club || (club.type !== "CLB" && club.type !== "DOAN" && club.type !== "HOI")) return false;
      if (onlyMyClubsFilter) {
        const isJoined = joinedClubIds.includes(act.orgId) || 
          (act.orgId === "DOAN_HOI" && (joinedClubIds.includes("DOANTN") || joinedClubIds.includes("HOISV")));
        if (!isJoined) return false;
      }
      
      const registered = myAttendance.some(r => r.activityId === act.id);
      if (act.status === "COMPLETED" && !registered) return false;
      
      const expiry = (act as any).expiryDate;
      if (expiry && todayStr > expiry) return false;
      
      return true;
    });

    // Get active club and youth union announcements
    const activeClubAnns = announcements.filter(ann => {
      const club = organizations.find(o => o.id === ann.orgId);
      if (!club || (club.type !== "CLB" && club.type !== "DOAN" && club.type !== "HOI")) return false;
      if (onlyMyClubsFilter) {
        const isJoined = joinedClubIds.includes(ann.orgId) || 
          (ann.orgId === "DOAN_HOI" && (joinedClubIds.includes("DOANTN") || joinedClubIds.includes("HOISV")));
        if (!isJoined) return false;
      }
      
      if (ann.expiryDate && todayStr > ann.expiryDate) return false;
      
      return true;
    });

    // Build unified feed items list
    const feedItems: (
      | { type: "ACTIVITY"; data: typeof activeClubActs[0]; dateSort: string }
      | { type: "ANNOUNCEMENT"; data: typeof activeClubAnns[0]; dateSort: string }
    )[] = [];

    if (clubFeedTab === "ALL" || clubFeedTab === "ACTIVITIES") {
      activeClubActs.forEach(act => {
        feedItems.push({ type: "ACTIVITY", data: act, dateSort: act.dateTime || "" });
      });
    }

    if (clubFeedTab === "ALL" || clubFeedTab === "ANNOUNCEMENTS") {
      activeClubAnns.forEach(ann => {
        feedItems.push({ type: "ANNOUNCEMENT", data: ann, dateSort: ann.createdAt || "" });
      });
    }

    // Sort descending by date
    feedItems.sort((a, b) => b.dateSort.localeCompare(a.dateSort));

    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden space-y-5" id="club-portal-integrated-feed">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
              🔥 BẢN TIN CHUYÊN BIỆT
            </span>
            <h4 className="text-xs font-black text-slate-850 uppercase tracking-tight flex items-center gap-1.5 text-slate-800">
              <Megaphone size={13} className="text-indigo-500 animate-pulse" />
              <span>Bản Tin Hoạt Động & Thông Báo Đoàn Hội, CLB</span>
            </h4>
            <p className="text-[10px] text-slate-450 leading-relaxed">
              Các thông cáo khẩn, lịch sinh hoạt thường kỳ, và sự kiện rèn luyện mới nhất từ Ban Chấp hành Đoàn Hội và các CLB.
            </p>
          </div>

          {/* Quick toggle filter */}
          <div className="flex items-center shrink-0">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-150/80 hover:border-indigo-250 transition-all select-none">
              <input 
                type="checkbox" 
                checked={onlyMyClubsFilter}
                onChange={(e) => setOnlyMyClubsFilter(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-55 focus:ring-opacity-25 h-3.5 w-3.5 cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-705">Chỉ hiện Đoàn Hội/CLB của tôi ({studentMemberships.length})</span>
            </label>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
          <button
            type="button"
            onClick={() => setClubFeedTab("ALL")}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              clubFeedTab === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 border border-slate-150/80 hover:bg-slate-100"
            }`}
          >
            Tất cả ({activeClubActs.length + activeClubAnns.length})
          </button>
          <button
            type="button"
            onClick={() => setClubFeedTab("ANNOUNCEMENTS")}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              clubFeedTab === "ANNOUNCEMENTS"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 border border-slate-150/80 hover:bg-slate-100"
            }`}
          >
            Thông báo mới ({activeClubAnns.length})
          </button>
          <button
            type="button"
            onClick={() => setClubFeedTab("ACTIVITIES")}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
              clubFeedTab === "ACTIVITIES"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 border border-slate-150/80 hover:bg-slate-100"
            }`}
          >
            Lịch & Hoạt động ({activeClubActs.length})
          </button>
        </div>

        {/* Interactive List Containers */}
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-150/60 rounded-2xl text-[11px] font-bold text-slate-500">
              Không có bài đăng hay sự kiện nào phù hợp bộ lọc!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedItems.map(item => {
                if (item.type === "ACTIVITY") {
                  const act = item.data;
                  const isMyClub = joinedClubIds.includes(act.orgId);
                  const registered = myAttendance.some(r => r.activityId === act.id);
                  const isActCompleted = act.status === "COMPLETED";

                  return (
                    <div 
                      key={act.id} 
                      className="p-4 bg-white hover:bg-slate-50/50 border border-slate-155 rounded-2xl relative transition-all flex flex-col justify-between group h-full space-y-3 shadow-xs hover:shadow-xs text-left"
                    >
                      {act.imageUrl && (
                        <div className="w-full h-32 rounded-xl overflow-hidden shrink-0 border border-slate-100/80 relative">
                          <img 
                            src={act.imageUrl} 
                            alt={act.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        </div>
                      )}
                      <div className="space-y-2 text-left">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="text-[8.5px] font-black px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded uppercase font-mono tracking-tight shrink-0">
                            📅 {act.orgName}
                          </span>
                          <div className="flex gap-1.5 shrink-0">
                            {isMyClub && (
                              <span className="text-[8.5px] font-black px-1.5 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded uppercase tracking-tight flex items-center gap-1">
                                <Sparkles size={9} /> Thành viên
                              </span>
                            )}
                            <span className="text-[8.5px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded uppercase font-mono">
                              +{act.points}đ TC{act.criteriaId.substring(2)}
                            </span>
                          </div>
                        </div>

                        <h5 className="text-[12px] font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {act.title}
                        </h5>
                        
                        {act.description && (
                          <p className="text-[10px] text-slate-550 leading-normal line-clamp-2 italic font-sans">{act.description}</p>
                        )}

                        <div className="space-y-1 pt-1 text-[9.5px] text-slate-500 font-sans border-t border-slate-55">
                          <div className="flex items-center gap-1.5"><Clock size={11} className="text-indigo-500 shrink-0" /> {act.dateTime}</div>
                          <div className="flex items-center gap-1.5"><MapPin size={11} className="text-indigo-500 shrink-0" /> {act.location}</div>
                        </div>
                      </div>

                      <div className="pt-2 !mt-auto border-t border-slate-100 flex justify-end items-center">
                        {registered ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-105 border border-emerald-250 text-emerald-800 text-[9px] font-black rounded-lg uppercase select-none font-sans">
                            ✓ ĐÃ ĐĂNG KÝ THAM GIA
                          </span>
                        ) : isActCompleted ? (
                          <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-400 border border-slate-200 text-[9px] font-black rounded-lg uppercase select-none font-sans">
                            ĐÃ CHỐT ĐIỂM DANH
                          </span>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              registerForActivity(act.id, studentId);
                              alert(`Đăng ký thành công hoạt động "${act.title}"! Ban chủ nhiệm sẽ tiến hành kiểm diện điểm danh trực tiếp tại sự kiện.`);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9.5px] rounded-lg cursor-pointer shadow-xs transition-colors shrink-0 animate-pulse"
                          >
                            Đăng ký tham diễn
                          </button>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // Rendering ANNOUNCEMENT
                  const ann = item.data;
                  const isMyClub = joinedClubIds.includes(ann.orgId);

                  return (
                    <div 
                      key={ann.id} 
                      className="p-4 bg-amber-50/20 hover:bg-amber-50/30 border border-amber-100 rounded-2xl relative transition-all flex flex-col justify-between group h-full space-y-3 shadow-xs hover:shadow-xs text-left"
                    >
                      {ann.imageUrl && (
                        <div className="w-full h-32 rounded-xl overflow-hidden shrink-0 border border-amber-100 relative">
                          <img 
                            src={ann.imageUrl} 
                            alt={ann.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        </div>
                      )}
                      <div className="space-y-2 text-left">
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <span className="text-[8.5px] font-black px-2 py-0.5 bg-amber-50 border border-amber-150 text-amber-700 rounded uppercase font-mono tracking-tight shrink-0 flex items-center gap-1">
                            <Megaphone size={9} /> {ann.orgName}
                          </span>
                          <div className="flex gap-1.5 shrink-0">
                            {isMyClub && (
                              <span className="text-[8.5px] font-black px-1.5 py-0.5 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded uppercase tracking-tight flex items-center gap-1">
                                <Sparkles size={9} /> Thành viên
                              </span>
                            )}
                          </div>
                        </div>

                        <h5 className="text-[12px] font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {ann.title}
                        </h5>
                        
                        {ann.content && (
                          <p className="text-[10px] text-slate-550 leading-normal line-clamp-3 italic font-sans">{ann.content}</p>
                        )}

                        <div className="space-y-1 pt-1 text-[9.5px] text-slate-450 border-t border-slate-100 flex items-center gap-1.5">
                          <Clock size={11} className="text-amber-500 shrink-0" />
                          <span>Đăng ngày: {ann.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSymmetricalGauges = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Academic Score Gauge Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between items-center text-center transition-all hover:shadow-md">
          <div className="w-full">
            <div className="flex justify-between items-center border-b border-slate-100/60 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap size={15} className="text-blue-500" />
                <span>Điểm học tập học kỳ</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono italic">Thống kê từ đào tạo</span>
            </div>
            
            <div className="relative w-36 h-36 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#3b82f6" strokeWidth="8" fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * (currentGpa / 4.0))}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{currentGpa.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">/ 4.00 GPA</span>
              </div>
            </div>

            <div className="mt-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${academicMeta.bg} ${academicMeta.text} ${academicMeta.border}`}>
                <Award size={13} />
                <span>XẾP LOẠI: {academicMeta.label}</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-100 pt-4 mt-4 space-y-3 text-left text-xs text-slate-600 font-sans">
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-400">Số tín chỉ tích lũy:</span>
              <span className="font-bold text-slate-800">{currentCreditsEarned} Tín chỉ</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono">
              <span className="text-slate-400">Trạng thái học tập:</span>
              <span className={`font-bold uppercase ${currentLearningStatus.includes("cảnh báo") ? "text-rose-600" : "text-emerald-600"}`}>
                {currentLearningStatus}
              </span>
            </div>
            
            <div className="border-t border-slate-100/60 pt-3 space-y-2 text-[11px]">
              <div className="font-bold text-[9px] uppercase text-slate-400 tracking-wider font-mono">Thông tin lý lịch & Học vụ chi tiết:</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-medium text-slate-650">
                <div>Giới tính: <strong className="text-slate-850 font-bold">{sObj?.gender || "Chưa cập nhật"}</strong></div>
                <div>Ngày sinh: <strong className="text-slate-850 font-bold">{sObj?.dob || "Chưa cập nhật"}</strong></div>
                <div>Dân tộc: <strong className="text-slate-850 font-bold">{sObj?.ethnicity || "Chưa cập nhật"}</strong></div>
                <div>Quê quán: <strong className="text-slate-850 font-bold">{sObj?.pob || "Chưa cập nhật"}</strong></div>
                <div className="col-span-2">Số CCCD: <strong className="text-slate-850 font-mono">{sObj?.idCard || "Chưa cập nhật"}</strong></div>
                {sObj?.idCardDate && (
                  <div className="col-span-2 text-[10px] text-slate-400 font-normal leading-tight">
                    Cấp ngày {sObj.idCardDate} tại {sObj.idCardPlace}
                  </div>
                )}
                <div className="col-span-2 space-y-1">
                  <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider font-bold">Học phần & Điểm chi tiết:</span>
                  {(() => {
                    const gradesList = sObj?.subjectGrades 
                      ? sObj.subjectGrades.split(",").map(p => p.trim())
                      : [];
                    const subjectsList = sObj?.subjects 
                      ? sObj.subjects.split(",").map(p => p.trim()).filter(Boolean)
                      : [];
                    
                    if (gradesList.length === 0 && subjectsList.length === 0) {
                      return <strong className="text-slate-450 italic text-[11px]">Chưa cập nhật học phần</strong>;
                    }
                    
                    const itemsCount = Math.max(subjectsList.length, gradesList.length);
                    const pairedItems = Array.from({ length: itemsCount }, (_, idx) => {
                      const name = subjectsList[idx] || `Học phần ${idx + 1}`;
                      let grade = gradesList[idx] || "-";
                      if (grade === "") grade = "-";
                      return { name, grade };
                    });
                    
                    return (
                      <div className="border border-slate-100/80 rounded-xl overflow-hidden shadow-xs mt-1">
                        <table className="w-full text-left text-[11px] font-sans">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-450 text-[9px] font-bold uppercase tracking-wider">
                              <th className="p-2 pl-3">Tên học phần</th>
                              <th className="p-2 pr-3 text-right">Điểm số</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/60 bg-white">
                            {pairedItems.map((item, idx) => {
                              const scoreNum = Number(item.grade);
                              const scoreColor = item.grade !== "-" && !isNaN(scoreNum)
                                ? scoreNum >= 8.5 ? "text-emerald-600 font-bold"
                                  : scoreNum >= 7.0 ? "text-blue-600 font-bold"
                                  : scoreNum >= 5.0 ? "text-slate-700"
                                  : "text-rose-500 font-bold"
                                : "text-slate-400";
                              return (
                                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="p-2 pl-3 text-slate-800 font-medium">{item.name}</td>
                                  <td className={`p-2 pr-3 text-right font-mono font-black ${scoreColor}`}>{item.grade}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
                <div>Điểm hệ 10: <strong className="text-indigo-650 font-mono font-bold">{sObj?.gpa10 !== undefined ? sObj.gpa10.toFixed(2) : "Chưa cập nhật"}</strong></div>
                <div>Điểm hệ 4: <strong className="text-blue-650 font-mono font-bold">{sObj?.gpa !== undefined ? sObj.gpa.toFixed(2) : "Chưa cập nhật"}</strong></div>
                <div className="col-span-2">Xếp loại: <strong className="text-slate-850 font-bold">{sObj?.academicGrade || "Chưa cập nhật"}</strong></div>
                {sObj?.notes && <div className="col-span-2 text-[10.5px]">Ghi chú: <span className="text-slate-500 italic">{sObj.notes}</span></div>}
                {sObj?.updatedAt && <div className="col-span-2 text-[9px] text-slate-400 font-mono">Ngày cập nhật: {sObj.updatedAt}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Conduct Score Gauge Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between items-center text-center transition-all hover:shadow-md">
          <div className="w-full">
            <div className="flex justify-between items-center border-b border-slate-100/60 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={15} className="text-indigo-500" />
                <span>Điểm rèn luyện đề xuất</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono italic">Liên thông thời gian thực</span>
            </div>
            
            <div className="relative w-36 h-36 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#4f46e5" strokeWidth="8" fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * (currentConductPoints / 100))}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{currentConductPoints}</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">/ 100 điểm</span>
              </div>
            </div>

            <div className="mt-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${conductMeta.bg} ${conductMeta.text} ${conductMeta.border}`}>
                <CheckCircle size={13} />
                <span>XẾP LOẠI: {conductMeta.label}</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-slate-100 pt-4 mt-5 space-y-2.5 text-left text-xs text-slate-500 font-mono font-medium">
            <div className="flex justify-between items-center text-[11px]">
              <span>Kỷ luật chấp hành lớp:</span>
              <span className={`font-bold ${violationPoints < 25 ? "text-rose-500" : "text-emerald-600"}`}>
                {violationPoints} / 25đ
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Ý thức cộng đồng phong trào:</span>
              <span className="font-bold text-slate-800">{communityPoints} / 15đ</span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="student-portal-container">
      
      {/* RIGHT CONTENT CONTAINER - GIAO DIÊN CHÍNH ĐƯỢC THAY THEO TABS */}
      <div className="space-y-6 w-full min-w-0">

          {/* TAB 1: TRANG CHỦ - CHỈ CHỨA HỒ SƠ SINH VIÊN VÀ BẢNG TIN QUAN TRỌNG */}
          {activeTab === "TRANG_CHU" && (
            <div className="space-y-6 animate-fade-in text-slate-800">

              {/* News Board container */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm overflow-hidden space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                      <Sparkles size={13} className="text-indigo-500 animate-pulse animate-pulse" />
                      <span>Thông Báo Hoạt Động & Sự Kiện Hot Trong Tuần</span>
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Bảng tin học kì</span>
                </div>
                {renderNewsBoard()}
              </div>

              {/* Integrated portal feed for CLB announcements & activities (Requirement 4 output) */}
              {renderClubFeed()}
            </div>
          )}

          {/* TAB 2: ĐIỂM SỐ TIẾN TRÌNH - CHỨA ĐỒNG HỒ ĐỐI XỨNG CÂN BẰNG TÍCH LŨY */}
          {activeTab === "DIEM" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Tiến trình cân bằng học lực & Rèn luyện</h4>
                <p className="text-[10px] text-slate-405 leading-relaxed mt-1">
                  Đồng hồ đo đối xứng hiển thị tương quan đa nhiệm giữa Điểm tích lũy học tập chuyên ngành (GPA) và Kết quả rèn đức luyện tài (Điểm rèn luyện).
                </p>
              </div>
              {renderSymmetricalGauges()}
            </div>
          )}

          {/* DYNAMIC CONTENT CONTAINER WRAPPER FOR BACKEND DETAILED TABS */}
          {activeTab !== "TRANG_CHU" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[460px] overflow-hidden">
              {/* Tab contents */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[640px] custom-scrollbar">
          
          {/* TAB: CONDUCT BREAKDOWN WITH ACCORDION (Sync with Criteria) */}
          {activeTab === "DIEM" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Minh giải chi tiết quy chuẩn rèn luyện</h4>
                <span className="text-[10px] text-slate-400 font-mono tracking-wide">Ấn để kiểm tra nguồn gốc số liệu</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                
                {/* 1. Ý thức học tập */}
                <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setExpandedCriteria(expandedCriteria === "TC1" ? null : "TC1")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-7 rounded-sm bg-blue-500"></span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{tc1.categoryName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tc1.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{studyPoints} / {tc1.maxScore}đ</span>
                      <span className="text-[10px] text-indigo-500 font-medium">{expandedCriteria === "TC1" ? "Thu gọn" : "Xem nguồn"}</span>
                    </div>
                  </div>
                  {expandedCriteria === "TC1" && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-2 border-l-2 border-blue-500 font-mono">
                      {displayLogs.filter(l => l.criteriaId.startsWith("TC1")).length > 0 ? (
                        displayLogs.filter(l => l.criteriaId.startsWith("TC1")).map((log, i) => (
                          <div key={i} className="flex justify-between items-start gap-4">
                            <span>• {log.reason} (+{log.points}đ)</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded select-none uppercase shrink-0">Nguồn: {log.source}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400">• Chưa có dữ liệu học tập ghi nhận kì này</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Ý thức nề nếp */}
                <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setExpandedCriteria(expandedCriteria === "TC2" ? null : "TC2")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-7 rounded-sm bg-rose-500"></span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{tc2.categoryName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tc2.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{violationPoints} / {tc2.maxScore}đ</span>
                      <span className="text-[10px] text-indigo-500 font-medium">{expandedCriteria === "TC2" ? "Thu gọn" : "Xem nguồn"}</span>
                    </div>
                  </div>
                  {expandedCriteria === "TC2" && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-2 border-l-2 border-rose-500 font-mono">
                      {displayLogs.filter(l => l.criteriaId.startsWith("TC2")).length > 0 ? (
                        displayLogs.filter(l => l.criteriaId.startsWith("TC2")).map((log, i) => (
                          <div key={i} className="flex justify-between items-start gap-4">
                            <span>• {log.reason} ({log.points >= 0 ? "+" : ""}{log.points}đ)</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded select-none uppercase shrink-0">Nguồn: {log.source}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400">• Không có vi phạm nề nếp kỷ luật giảng đường</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Hoạt động ngoại khóa xã hội */}
                <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setExpandedCriteria(expandedCriteria === "TC3" ? null : "TC3")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-7 rounded-sm bg-purple-500"></span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{tc3.categoryName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tc3.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{extracurricularPoints} / {tc3.maxScore}đ</span>
                      <span className="text-[10px] text-indigo-500 font-medium">{expandedCriteria === "TC3" ? "Thu gọn" : "Xem nguồn"}</span>
                    </div>
                  </div>
                  {expandedCriteria === "TC3" && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-2 border-l-2 border-purple-500 font-mono">
                      {displayLogs.filter(l => l.criteriaId.startsWith("TC3")).length > 0 ? (
                        displayLogs.filter(l => l.criteriaId.startsWith("TC3")).map((log, i) => (
                          <div key={i} className="flex justify-between items-start gap-4">
                            <span>• {log.reason} (+{log.points}đ)</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-purple-55 text-purple-700 rounded select-none uppercase shrink-0">Nguồn: {log.source}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400">• Chưa ghi nhận tham gia hoạt động chi ủy Đoàn hay CLB</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Ý thức công dân */}
                <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setExpandedCriteria(expandedCriteria === "TC4" ? null : "TC4")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-7 rounded-sm bg-emerald-500"></span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{tc4.categoryName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tc4.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{communityPoints} / {tc4.maxScore}đ</span>
                      <span className="text-[10px] text-indigo-500 font-medium">{expandedCriteria === "TC4" ? "Thu gọn" : "Xem nguồn"}</span>
                    </div>
                  </div>
                  {expandedCriteria === "TC4" && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-2 border-l-2 border-emerald-500 font-mono">
                      {displayLogs.filter(l => l.criteriaId.startsWith("TC4")).length > 0 ? (
                        displayLogs.filter(l => l.criteriaId.startsWith("TC4")).map((log, i) => (
                          <div key={i} className="flex justify-between items-start gap-4">
                            <span>• {log.reason} (+{log.points}đ)</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded select-none uppercase shrink-0">Nguồn: {log.source}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400">• Chưa tích lũy điểm phục vụ cộng đồng và học phong trào</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Chức vụ, thành tích đặc biệt */}
                <div className="p-3.5 hover:bg-slate-50/50 transition-colors">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => setExpandedCriteria(expandedCriteria === "TC5" ? null : "TC5")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-7 rounded-sm bg-amber-500"></span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{tc5.categoryName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tc5.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{achievementPoints} / {tc5.maxScore}đ</span>
                      <span className="text-[10px] text-indigo-500 font-medium">{expandedCriteria === "TC5" ? "Thu gọn" : "Xem nguồn"}</span>
                    </div>
                  </div>
                  {expandedCriteria === "TC5" && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-2 border-l-2 border-amber-500 font-mono">
                      {displayLogs.filter(l => l.criteriaId.startsWith("TC5")).length > 0 ? (
                        displayLogs.filter(l => l.criteriaId.startsWith("TC5")).map((log, i) => (
                          <div key={i} className="flex justify-between items-start gap-4">
                            <span>• {log.reason} (+{log.points}đ)</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded select-none uppercase shrink-0">Nguồn: {log.source}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400">• Chưa có giấy khen thành tích đặc biệt nào</div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: PROGRESS TRACKING & REGISTRATIONS WITH MILESTONES (Requirement #4) */}
          {activeTab === "HOATDONG" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh mục hoạt động mở năm học</h4>
                  <p className="text-[10px] text-slate-405">Đọc và đăng ký nhanh hoạt động ngoại khóa</p>
                </div>
                
                {/* Milestone Filtering tool */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setActivityMilestone("ALL")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityMilestone === "ALL" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Tất cả ({activities.length})
                  </button>
                  <button 
                    onClick={() => setActivityMilestone("WEEK")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityMilestone === "WEEK" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Mốc Tuần
                  </button>
                  <button 
                    onClick={() => setActivityMilestone("MONTH")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityMilestone === "MONTH" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Mốc Tháng
                  </button>
                  <button 
                    onClick={() => setActivityMilestone("TERM")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityMilestone === "TERM" ? "bg-white text-indigo-650 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                  >
                    Mốc Kỳ
                  </button>
                </div>
              </div>

              {/* Activities rendering based on timeline milestone */}
              <div className="space-y-3">
                {activities.filter(filterByMilestone).length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs font-medium">
                    Không có hoạt động nào được mở cho mốc này trong lịch trường.
                  </div>
                ) : (
                  activities.filter(filterByMilestone).map(act => {
                    const studentReg = myAttendance.find(a => a.activityId === act.id);
                    const isRegistered = !!studentReg;
                    
                    const matchRule = criteria.flatMap(c => c.rules).find(r => r.id === act.criteriaId);
                    const actLivePoints = matchRule ? matchRule.points : act.points;
                    
                    // Display Milestone Category tag
                    let milestoneTag = "Mốc Học Kỳ";
                    if (act.id === "ACT_03" || act.title.toLowerCase().includes("hội thảo")) milestoneTag = "Mốc Tuần Này";
                    else if (act.id === "ACT_04" || act.title.toLowerCase().includes("nghị quyết")) milestoneTag = "Mốc Tháng Này";

                    return (
                      <div key={act.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-xs hover:border-slate-200 transition-all bg-white shadow-xs">
                        {act.imageUrl && (
                          <div className="w-full h-40 rounded-xl overflow-hidden mb-3 border border-slate-100 relative shrink-0">
                            <img 
                              src={act.imageUrl} 
                              alt={act.title} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs font-extrabold text-slate-900">{act.title}</h5>
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-indigo-700">
                                {milestoneTag}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Đơn vị chủ trì: <span className="font-bold text-indigo-600">{act.orgName}</span></p>
                            <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">{act.description}</p>
                            
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1.5 flex-wrap">
                              <span className="flex items-center gap-1 font-mono"><Calendar size={11} className="text-indigo-500" /> {act.dateTime}</span>
                              <span>Điểm rèn luyện: <strong className="text-emerald-600 font-bold font-mono">+{actLivePoints}đ</strong> (Mục TC{act.criteriaId.substring(2)})</span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right space-y-2">
                            {/* Registration state */}
                            <div>
                              {isRegistered ? (
                                <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded text-[9px] font-black uppercase">
                                  Đã Đăng Ký
                                </span>
                              ) : (
                                <button 
                                  onClick={() => registerForActivity(act.id, studentId)}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white hover:cursor-pointer transition-colors text-[10px] font-black rounded-lg flex items-center gap-1 shadow-xs"
                                  disabled={act.status === "COMPLETED"}
                                >
                                  <Plus size={11} />
                                  <span>Đăng ký</span>
                                </button>
                              )}
                            </div>

                            {/* Confirmation state indicator */}
                            <div className="text-[9px] font-mono text-slate-450">
                              {studentReg ? (
                                studentReg.attended ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5 justify-end">
                                    <CheckCircle size={10} /> Đã Xác Nhận Điểm
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-medium animate-pulse block">
                                    ⏳ Đang chờ xác nhận mặt
                                  </span>
                                )
                              ) : (
                                <span className="text-slate-400">Chưa bắt đầu mốc</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: CLUB PARTICIPATION (Requirement #5 only showing Clubs) */}
          {activeTab === "CLB" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh bạ Câu lạc bộ Sinh viên</h4>
                  <p className="text-[10px] text-slate-400">Xem tin tức, bảng thông báo, đăng ký tham dự hoạt động và lưu hồ sơ lưu trữ đính kèm</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredClubs.map(org => {
                  const membership = myOrganizations.find(m => m.orgId === org.id);
                  
                  return (
                    <div 
                      key={org.id} 
                      onClick={() => {
                        setSelectedClubIdDetail(org.id);
                        if (membership) {
                          setProfileAttachmentInput(membership.attachmentUrl || "");
                        } else {
                          setProfileAttachmentInput("");
                        }
                      }}
                      className="p-4 border border-slate-100 rounded-2xl bg-white shadow-xs hover:shadow-sm hover:border-indigo-250 transition-all flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                            {org.field}
                          </span>
                          <span className="text-[8px] font-black text-slate-450 uppercase font-mono group-hover:text-indigo-600">
                            Chi tiết & Đăng ký →
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-800 mt-1.5 group-hover:text-indigo-700 transition-colors">{org.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-1">Chủ nhiệm: <span className="font-bold text-slate-650">{org.leaderName}</span></p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center">
                        <span className="text-[9px] text-slate-455 italic font-mono uppercase">Lĩnh chọn tự động</span>
                        
                        {membership ? (
                          <span className={`text-[8px] font-black px-2 py-1 rounded border leading-none tracking-tight ${membership.status === "ACTIVE" ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-amber-50 text-amber-700 border-amber-150'}`}>
                            {membership.status === "ACTIVE" ? membership.role : "CHỜ DUYỆT GIA NHẬP"}
                          </span>
                        ) : (
                          <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-1 rounded-lg">
                            CHƯA GIA NHẬP CLB
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* IMMERSIVE MODAL: CLUB DETAILS, ANNOUNCEMENTS, EXPIRED FILTERED EVENTS & ATTACHMENT */}
              {selectedClubIdDetail && (() => {
                const club = organizations.find(o => o.id === selectedClubIdDetail);
                if (!club) return null;

                const membership = myOrganizations.find(m => m.orgId === club.id);
                
                // Get active club announcements (Requirement 4: Có thời hạn hiển thị tùy chỉnh, hết thời hạn sẽ auto biến)
                const todayStr = new Date().toISOString().split("T")[0];
                const activeClubAnns = announcements.filter(ann => {
                  if (ann.orgId !== club.id) return false;
                  if (!ann.expiryDate) return true;
                  return todayStr <= ann.expiryDate; // expiry date validation
                });

                // Get upcoming club activities with expiry filter (Requirement 4)
                const activeClubActs = activities.filter(act => {
                  if (act.orgId !== club.id) return false;
                  // Exclude COMPLETED unless registered
                  const registered = myAttendance.some(r => r.activityId === act.id);
                  if (act.status === "COMPLETED" && !registered) return false;
                  
                  // expiryDate filter
                  const expiry = (act as any).expiryDate;
                  if (expiry) {
                    return todayStr <= expiry;
                  }
                  return true;
                });

                return (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="club-details-modal">
                    <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                      
                      {/* Modal Header */}
                      <div className="flex justify-between items-center bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 shrink-0">
                        <div>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-mono select-none uppercase tracking-wider">
                            CHI TIẾT PHÂN HỆ
                          </span>
                          <h3 className="text-sm font-black text-slate-950 mt-1">{club.name}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedClubIdDetail(null)} 
                          className="p-1 text-slate-450 hover:text-slate-650 cursor-pointer rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Modal Body Scroll */}
                      <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        
                        {/* Club Metadata summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs">
                          <div>
                            <span className="font-semibold block text-slate-400">Đại diện chủ nhiệm:</span>
                            <span className="font-bold text-slate-800">{club.leaderName}</span>
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-400">Lĩnh vực phong trào:</span>
                            <span className="font-bold text-indigo-600">{club.field}</span>
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-400 font-sans">Xếp loại cấp kiểm vụ:</span>
                            <span className="font-bold text-slate-800 font-mono">CẤP {club.level === "TRUONG" ? "TRƯỜNG" : "KHOA"}</span>
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-400 font-sans">Yêu cầu chuyên cần:</span>
                            <span className="font-bold text-emerald-600">Ổn định mốc cộng</span>
                          </div>
                        </div>

                        {/* ANNOUNCEMENTS SECTION (BẢN TIN THÔNG BÁO) */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <Megaphone size={14} className="text-indigo-500 animate-bounce" />
                            <span>Bảng tin thông cáo CLB mới cập nhật ({activeClubAnns.length})</span>
                          </h4>

                          {activeClubAnns.length === 0 ? (
                            <div className="p-6 bg-slate-50/50 rounded-xl border border-dashed text-center text-slate-400 text-xs">
                              Không có thông báo mới hoặc thông báo đã quá hạn hiển thị.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeClubAnns.map(ann => (
                                <div key={ann.id} className="p-3.5 bg-yellow-50/30 border border-amber-100 rounded-xl text-xs space-y-1">
                                  {ann.imageUrl && (
                                    <div className="w-full h-32 rounded-lg overflow-hidden border border-amber-150/50 mb-2 relative shrink-0">
                                      <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono">
                                      Hạn phát sóng: {ann.expiryDate || "Không giới hạn"}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono">{ann.createdAt}</span>
                                  </div>
                                  <h5 className="font-black text-slate-900 mt-1">{ann.title}</h5>
                                  <p className="text-[10px] text-slate-600 leading-relaxed font-sans">{ann.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ACTIVITIES REGISTRATION SECTION */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                            <Calendar size={14} className="text-indigo-500" />
                            <span>Lịch sinh hoạt & Tìm hoạt động phong trào ({activeClubActs.length})</span>
                          </h4>

                          {activeClubActs.length === 0 ? (
                            <div className="p-6 bg-slate-50/50 rounded-xl border border-dashed text-center text-slate-400 text-xs">
                              Không có hoạt động phong trào nào đang tổ chức.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeClubActs.map(act => {
                                const registered = myAttendance.some(r => r.activityId === act.id);
                                const isActCompleted = act.status === "COMPLETED";

                                return (
                                  <div key={act.id} className="p-4 bg-white border border-slate-150 rounded-xl flex justify-between items-start md:items-center flex-wrap md:flex-nowrap gap-3 text-xs">
                                    <div className="space-y-1">
                                      <h5 className="font-black text-slate-900">{act.title}</h5>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-sans">
                                        <span className="flex items-center gap-1"><Clock size={11} /> {act.dateTime}</span>
                                        <span className="flex items-center gap-1"><MapPin size={11} /> {act.location}</span>
                                        <span className="text-emerald-700 font-bold">Chuẩn nạp: +{act.points}đ mốc TC{act.criteriaId.substring(2)}</span>
                                      </div>
                                      {act.description && <p className="text-[9px] text-slate-400 italic mt-1 leading-normal line-clamp-2">{act.description}</p>}
                                    </div>

                                    {registered ? (
                                      <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-250 font-black text-[9px] rounded-xl font-mono shrink-0">
                                        ✓ ĐÃ ĐĂNG KÝ
                                      </span>
                                    ) : isActCompleted ? (
                                      <span className="px-3 py-1 bg-slate-100 text-slate-500 font-bold text-[9px] rounded-lg cursor-not-allowed select-none">
                                        ĐÃ HẾT HẠN ĐĂNG KÝ
                                      </span>
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          registerForActivity(act.id, studentId);
                                          alert(`Đăng ký thành công hoạt động "${act.title}"! Ban chủ nhiệm sẽ tiến hành kiểm diện điểm danh trực tiếp tại sự kiện.`);
                                        }}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
                                      >
                                        Đăng ký tham dự
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* OPTIONAL ATTACHMENTS PORTFOLIO (HỒ SƠ THÀNH VIÊN & TỆP ĐÍNH KÈM CÁ NHÂN) */}
                        <div className="space-y-3.5 pt-2 border-t border-slate-100">
                          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                            <FileText size={14} className="text-indigo-500" />
                            <span>Cổng hồ sơ & Tờ trình đính kèm thành viên cá nhân</span>
                          </h4>

                          {!membership ? (
                            <div className="space-y-4">
                              {!isApplyingClub ? (
                                <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                                  <div className="space-y-1">
                                    <span className="font-extrabold text-indigo-950 block">Chào bạn sinh rèn! Bạn chưa tham gia sinh hoạt chi hội này.</span>
                                    <p className="text-[10px] text-slate-550">Tuyển sinh chính thức học kỳ năm học ${period.academicYear}. Đảm bảo cập nhật hồ sơ chuyên cần & rèn luyện đồng bộ.</p>
                                  </div>
                                  <button 
                                    onClick={() => setIsApplyingClub(true)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all text-center"
                                  >
                                    Đăng ký gia nhập trực tuyến
                                  </button>
                                </div>
                              ) : (
                                <div className="p-5 border border-slate-200 bg-white rounded-xl space-y-4 text-xs shadow-xs animate-slide-up">
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <h5 className="font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                                      <Sparkles size={13} className="text-indigo-500 animate-spin-slow" />
                                      <span>Tờ khai đăng ký đính kèm thành viên chi hội</span>
                                    </h5>
                                    <button 
                                      type="button"
                                      onClick={() => setIsApplyingClub(false)}
                                      className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1 bg-slate-100 rounded-lg text-[10px]"
                                    >
                                      Thu gọn đơn
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {/* Ho va ten */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Họ và tên thí sinh/học sinh <span className="text-red-500">*</span></label>
                                        <input 
                                          type="text" 
                                          placeholder="Nhập đầy đủ tên"
                                          value={applyName}
                                          onChange={(e) => setApplyName(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-medium focus:border-indigo-500 focus:outline-none"
                                          required
                                        />
                                      </div>

                                      {/* Ma SV & Lop lock */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Mã sinh viên</label>
                                          <input 
                                            type="text" 
                                            disabled
                                            value={studentId}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-450 font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Lớp sinh hoạt</label>
                                          <input 
                                            type="text" 
                                            disabled
                                            value={sObj?.classId || "K20-CNTT"}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-450"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {/* Gioi tinh */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Giới tính</label>
                                        <select 
                                          value={applyGender}
                                          onChange={(e) => setApplyGender(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                                        >
                                          <option value="Nam">Nam</option>
                                          <option value="Nữ">Nữ</option>
                                          <option value="Khác">Khác</option>
                                        </select>
                                      </div>

                                      {/* Ngay sinh */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                                        <input 
                                          type="date" 
                                          value={applyDob}
                                          onChange={(e) => setApplyDob(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                                          required
                                        />
                                      </div>

                                      {/* Dan toc */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Dân tộc <span className="text-red-500">*</span></label>
                                        <input 
                                          type="text" 
                                          placeholder="Kinh, Tày, Nùng..."
                                          value={applyEthnicity}
                                          onChange={(e) => setApplyEthnicity(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {/* So dien thoai */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Số điện thoại liên lạc <span className="text-red-500">*</span></label>
                                        <input 
                                          type="tel" 
                                          placeholder="Nhập SĐT di động"
                                          value={applyPhone}
                                          onChange={(e) => setApplyPhone(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-mono"
                                          required
                                        />
                                      </div>

                                      {/* Dia chi Email */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Địa chỉ Email liên hệ <span className="text-red-500">*</span></label>
                                        <input 
                                          type="email" 
                                          placeholder="student@gmail.com"
                                          value={applyEmail}
                                          onChange={(e) => setApplyEmail(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-mono"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {/* Chuyen nganh */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Chuyên ngành đào tạo <span className="text-red-500">*</span></label>
                                        <input 
                                          type="text" 
                                          placeholder="An toàn thông tin, CNTT..."
                                          value={applyMajor}
                                          onChange={(e) => setApplyMajor(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                                          required
                                        />
                                      </div>

                                      {/* Attachment URL */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-indigo-950 mb-1 leading-tight">
                                          Tờ trình / CV / Đường dẫn Đơn xin gia nhập
                                        </label>
                                        <input 
                                          type="url" 
                                          placeholder="https://drive.google.com/file/..."
                                          value={applyAttachmentUrl}
                                          onChange={(e) => setApplyAttachmentUrl(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {/* Dia chi Thuong tru */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Địa chỉ thường trú</label>
                                        <input 
                                          type="text" 
                                          placeholder="Tỉnh/Thành phố quê quán sở tại"
                                          value={applyPermanentAddress}
                                          onChange={(e) => setApplyPermanentAddress(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                                        />
                                      </div>

                                      {/* Dia chi tam tru */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Địa chỉ tạm trú hiện tại</label>
                                        <input 
                                          type="text" 
                                          placeholder="Ký túc xá hoặc địa chỉ phòng trọ"
                                          value={applyTemporaryAddress}
                                          onChange={(e) => setApplyTemporaryAddress(e.target.value)}
                                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-2.5 border-t border-slate-100 flex justify-end gap-2">
                                    <button 
                                      type="button"
                                      onClick={() => setIsApplyingClub(false)}
                                      className="px-3.5 py-2 hover:bg-slate-50 text-slate-600 border border-slate-200 font-extrabold text-[10px] rounded-lg cursor-pointer"
                                    >
                                      Hủy bỏ đơn
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (!applyName || !applyDob || !applyEthnicity || !applyPhone || !applyEmail || !applyMajor) {
                                          alert("Vui lòng nhập đầy đủ các trường thông tin bắt buộc có dấu (*)");
                                          return;
                                        }

                                        // Call join request action with collected details
                                        joinOrganizationRequest(studentId, club.id, {
                                          studentName: applyName,
                                          gender: applyGender,
                                          dob: applyDob,
                                          ethnicity: applyEthnicity,
                                          phone: applyPhone,
                                          email: applyEmail,
                                          major: applyMajor,
                                          permanentAddress: applyPermanentAddress,
                                          temporaryAddress: applyTemporaryAddress,
                                          attachmentUrl: applyAttachmentUrl
                                        });

                                        alert(`Nộp hồ sơ gia nhập CLB "${club.name}" thành công! Chỉ chức danh và dữ liệu liên lạc của bạn sẽ hiển thị tự hóa khi Chủ nhiệm duyệt.`);
                                        setIsApplyingClub(false);
                                      }}
                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer shadow-sm active:scale-95 transition-all"
                                    >
                                      Gửi đơn gia nhập CLB chính thức
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 border border-violet-100 bg-violet-50/15 rounded-xl space-y-3 text-xs text-slate-705">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 font-sans block">Chức vụ trong tổ chức:</span>
                                  <span className="font-extrabold text-slate-900 bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-md mt-1 inline-block">
                                    {membership.role}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-sans block">Trạng thái sinh hoạt:</span>
                                  <span className={`font-extrabold px-2.5 py-0.5 rounded-md mt-1 inline-block ${membership.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                    {membership.status === "ACTIVE" ? "ĐANG SINH HOẠT" : "CHỜ PHÊ DUYỆT ĐƠN"}
                                  </span>
                                </div>
                              </div>

                              {/* Editable attachment URL input (Requirement #1: Thêm tệp đính kèm cho các thành viên CLB) */}
                              <div className="pt-2">
                                <label className="block text-[11px] font-bold text-slate-650 mb-1 leading-tight">
                                  Đường dẫn Tệp đính kèm cá nhân học sinh (CV, Hồ sơ rèn luyện, chứng minh chứng):
                                </label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="e.g. https://drive.google.com/file/d/abcdefgh_cv.pdf"
                                    value={profileAttachmentInput}
                                    onChange={(e) => setProfileAttachmentInput(e.target.value)}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-250 bg-white focus:outline-none"
                                  />
                                  <button 
                                    onClick={() => {
                                      updateMemberDetails(membership.id, {
                                        attachmentUrl: profileAttachmentInput
                                      });
                                      alert("Cập nhật tệp đính kèm thành viên thành công! Chủ nhiệm CLB đã có thể xem từ hệ quản trị.");
                                    }}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    Lưu tệp
                                  </button>
                                </div>
                                <span className="text-[9px] text-slate-420 block mt-1">
                                  Ghi chú: Bản đính kèm này sẽ hiển thị trực tiếp cho Ban chủ nhiệm kiểm sát hồ sơ thi đua.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Modal Footer */}
                      <div className="bg-slate-50 px-6 py-4.5 border-t border-slate-150 flex justify-end shrink-0">
                        <button 
                          onClick={() => setSelectedClubIdDetail(null)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          Đóng cửa sổ
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: CUSTOM EVIDENCE SUBMISSIONS */}
          {activeTab === "MINHCHUNG" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Yêu cầu xét minh chứng ngoại lệ</h4>
                  <p className="text-[10px] text-slate-400">Nộp hồ sơ minh chứng đóng góp cấp ngoài hệ thống trường</p>
                </div>
                <button 
                  onClick={() => setShowEvModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0 shadow-sm cursor-pointer"
                >
                  <PlusCircle size={13} />
                  <span>Nộp tờ khai ngoại lệ</span>
                </button>
              </div>

              {myEvidence.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Chưa nộp minh chứng ngoại hệ thống nào cho kỳ này.
                </div>
              ) : (
                <div className="space-y-3">
                  {myEvidence.map(ev => (
                    <div key={ev.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 hover:bg-slate-50/40 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono uppercase">
                            Mục TC{ev.criteriaId.substring(2)}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 mt-1">{ev.activityName}</h5>
                          <p className="text-[10px] text-slate-550 leading-relaxed">{ev.description}</p>
                          <p className="text-[10px] text-slate-400 pt-1 flex items-center gap-2 flex-wrap">
                            <span>Tệp tờ trình: <span className="font-mono underline text-indigo-500">{ev.proofUrl}</span></span>
                            <span>• Ngày nộp: {ev.submittedAt}</span>
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className={`text-[9px] font-black bg-amber-5 px-2 py-0.5 rounded border leading-none ${statusColors(ev.status)}`}>
                            {ev.status === "PENDING" ? "CHỜ BCS DUYỆT" : (ev.status === "APPROVED" ? "ĐÃ CHẤP NHẬN" : "BỊ TỪ CHỐI")}
                          </div>
                          <span className="text-xs font-extrabold text-slate-700 block mt-2 font-mono">+{ev.pointsRequested}đ</span>
                        </div>
                      </div>

                      {ev.reviewComment && (
                        <div className="mt-2.5 p-2 bg-slate-50 rounded text-[9px] text-slate-605 border-l-2 border-slate-300">
                          <strong>Biên bảnh phản hồi:</strong> {ev.reviewComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: THOI_KHOA_BIEU */}
          {activeTab === "THOI_KHOA_BIEU" && (() => {
            const getVNDayOfWeek = () => {
              const day = new Date().getDay();
              if (day === 0) return 8; // Chủ Nhật
              return day + 1;
            };
            const todayVN = getVNDayOfWeek();
            
            // Get all unique classes available in schedules
            const availableClasses = Array.from(new Set([
              ...(sObj?.classId ? [sObj.classId] : []),
              ...schedules.map(s => s.classId)
            ])).filter(Boolean).sort();

            const currentClassToView = selectedStudentScheduleClass || sObj?.classId || availableClasses[0] || "";

            const norm = (str: string) => str.toLowerCase().replace(/[-_\s]/g, "");
            const mySchedules = schedules.filter(s => 
              s.classId === currentClassToView || 
              (currentClassToView && norm(s.classId) === norm(currentClassToView))
            );

            const todayClasses = mySchedules
              .filter(s => s.dayOfWeek === todayVN)
              .sort((a, b) => a.periodStart - b.periodStart);

            const dayLabels = [
              { day: 2, label: "Thứ Hai", short: "T2" },
              { day: 3, label: "Thứ Ba", short: "T3" },
              { day: 4, label: "Thứ Tư", short: "T4" },
              { day: 5, label: "Thứ Năm", short: "T5" },
              { day: 6, label: "Thứ Sáu", short: "T6" },
              { day: 7, label: "Thứ Bảy", short: "T7" },
              { day: 8, label: "Chủ Nhật", short: "CN" }
            ];

            return (
              <div className="space-y-6 text-left animate-fade-in">
                {/* 1. Today's Highlight widget */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                      <Clock size={14} className="text-indigo-600 animate-spin" style={{ animationDuration: '12s' }} />
                      <span>Lịch học hôm nay (Thứ {todayVN === 8 ? "Chủ Nhật" : todayVN})</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Hôm nay</span>
                  </div>

                  {todayClasses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Sparkles className="mx-auto text-indigo-500 mb-2 animate-bounce" size={24} />
                      <strong className="text-slate-700 text-xs block">Không có lịch học nào cho lớp {currentClassToView} hôm nay!</strong>
                      <p className="text-[10px] text-slate-400 mt-1">Hãy chọn lớp học khác từ ô tìm kiếm bên dưới nếu bạn muốn tra cứu lịch học của các lớp khác.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {todayClasses.map(cls => (
                        <div 
                          key={cls.id} 
                          className="p-4 rounded-xl border border-slate-100 bg-indigo-50/10 relative overflow-hidden flex flex-col justify-between"
                          style={{ borderLeft: `4px solid ${cls.colorHex || '#4F46E5'}` }}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                Tiết {cls.periodStart} - {cls.periodEnd} {cls.session ? `(${cls.session})` : ""}
                              </span>
                              {cls.studyMode && (
                                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-sm ${cls.studyMode === "Online" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                  {cls.studyMode}
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs font-black text-slate-800 mt-1.5">{cls.subjectName}</h5>
                            {cls.subjectCode && (
                              <p className="text-[9px] font-mono text-slate-400 font-semibold">{cls.subjectCode} {cls.credits ? `• ${cls.credits} Tín chỉ` : ""}</p>
                            )}
                            <p className="text-[10.5px] text-slate-500 font-medium mt-1">{cls.teacherName}</p>
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-slate-600 font-mono bg-white border rounded-lg px-2.5 py-1 w-fit shadow-2xs">
                            <MapPin size={11} className="text-rose-500 shrink-0" />
                            <span className="font-bold">{cls.room}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Full Weekly Grid layout */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="border-b border-slate-100 pb-3 mb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                        <Calendar size={14} className="text-indigo-600" />
                        <span>Bảng thời khóa biểu tuần chi tiết ({currentClassToView})</span>
                      </h4>
                      <p className="text-[10px] text-slate-405 mt-0.5">Lịch học chính thức được cập nhật trực tiếp bởi Phòng Đào tạo phân hiệu.</p>
                    </div>

                    {availableClasses.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Tra cứu lớp khác:</span>
                        <select 
                          value={currentClassToView}
                          onChange={(e) => setSelectedStudentScheduleClass(e.target.value)}
                          className="text-[11px] p-1 px-2 border rounded-lg bg-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700"
                        >
                          {availableClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {dayLabels.map(({ day, label }) => {
                      const dayClasses = mySchedules
                        .filter(s => s.dayOfWeek === day)
                        .sort((a, b) => a.periodStart - b.periodStart);
                      const isToday = day === todayVN;

                      return (
                        <div 
                          key={day} 
                          className={`rounded-xl p-3 border flex flex-col space-y-3 min-h-[180px] transition-all ${
                            isToday 
                              ? "bg-indigo-50/20 border-indigo-200 ring-1 ring-indigo-200/50 shadow-xs" 
                              : "bg-slate-50/40 border-slate-150"
                          }`}
                        >
                          <div className="border-b border-slate-200/80 pb-1.5 flex justify-between items-center">
                            <span className={`text-[10.5px] font-black tracking-wider uppercase ${isToday ? "text-indigo-700 font-extrabold" : "text-slate-500"}`}>
                              {label}
                            </span>
                            {isToday && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col space-y-3">
                            {dayClasses.length === 0 ? (
                              <span className="text-[9.5px] text-slate-400 italic block py-4 text-center my-auto">Không học</span>
                            ) : (
                              (() => {
                                const morningClasses = dayClasses.filter(s => !s.session || s.session.trim().toLowerCase() === "sáng");
                                const afternoonClasses = dayClasses.filter(s => s.session && s.session.trim().toLowerCase() === "chiều");
                                return (
                                  <>
                                    {/* Sáng */}
                                    <div className="space-y-1.5 flex-1">
                                      <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 pb-0.5 mb-1.5">
                                        <span>🌅 Sáng</span>
                                      </div>
                                      {morningClasses.length === 0 ? (
                                        <span className="text-[8px] text-slate-300 italic block py-1 text-center">Không học</span>
                                      ) : (
                                        morningClasses.map(cls => (
                                          <div 
                                            key={cls.id} 
                                            className="p-2 rounded-lg border border-slate-100 bg-white hover:shadow-xs transition-shadow flex flex-col space-y-1 text-[10.5px] text-left"
                                            style={{ borderLeft: `3px solid ${cls.colorHex || '#4F46E5'}` }}
                                          >
                                            <div>
                                              <strong className="text-slate-800 font-bold block leading-tight truncate" title={cls.subjectName}>{cls.subjectName}</strong>
                                              {cls.subjectCode && (
                                                <span className="text-[8px] font-mono text-slate-400 block font-semibold leading-none mt-0.5">{cls.subjectCode} {cls.credits ? `(${cls.credits}TC)` : ""}</span>
                                              )}
                                              <span className="text-[8.5px] text-slate-450 block italic mt-0.5 truncate" title={cls.teacherName}>{cls.teacherName}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500 mt-1 bg-slate-50 px-1 rounded">
                                              <span>T{cls.periodStart}-{cls.periodEnd}</span>
                                              <span className="font-bold text-slate-700">{cls.room}</span>
                                            </div>
                                            {cls.studyMode && (
                                              <span className={`text-[7.5px] self-start px-1 rounded-xs font-semibold ${cls.studyMode === "Online" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                                {cls.studyMode}
                                              </span>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>

                                    {/* Chiều */}
                                    <div className="space-y-1.5 flex-1">
                                      <div className="text-[8.5px] font-bold text-indigo-500/80 uppercase tracking-wider flex items-center gap-1 border-b border-indigo-50/50 pb-0.5 mb-1.5 mt-2">
                                        <span>🌇 Chiều</span>
                                      </div>
                                      {afternoonClasses.length === 0 ? (
                                        <span className="text-[8px] text-slate-300 italic block py-1 text-center">Không học</span>
                                      ) : (
                                        afternoonClasses.map(cls => (
                                          <div 
                                            key={cls.id} 
                                            className="p-2 rounded-lg border border-slate-100 bg-white hover:shadow-xs transition-shadow flex flex-col space-y-1 text-[10.5px] text-left"
                                            style={{ borderLeft: `3px solid ${cls.colorHex || '#4F46E5'}` }}
                                          >
                                            <div>
                                              <strong className="text-slate-800 font-bold block leading-tight truncate" title={cls.subjectName}>{cls.subjectName}</strong>
                                              {cls.subjectCode && (
                                                <span className="text-[8px] font-mono text-slate-400 block font-semibold leading-none mt-0.5">{cls.subjectCode} {cls.credits ? `(${cls.credits}TC)` : ""}</span>
                                              )}
                                              <span className="text-[8.5px] text-slate-450 block italic mt-0.5 truncate" title={cls.teacherName}>{cls.teacherName}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-500 mt-1 bg-slate-50 px-1 rounded">
                                              <span>T{cls.periodStart}-{cls.periodEnd}</span>
                                              <span className="font-bold text-slate-700">{cls.room}</span>
                                            </div>
                                            {cls.studyMode && (
                                              <span className={`text-[7.5px] self-start px-1 rounded-xs font-semibold ${cls.studyMode === "Online" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                                {cls.studyMode}
                                              </span>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

              </div> {/* Close dynamic scrollable padding wrapper */}

              {/* Minor inline footer inside sub-options */}
              <div className="bg-slate-50/60 p-4 border-t border-slate-100 shrink-0 text-center flex flex-col sm:flex-row justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>PHÂN HỆ HỖ TRỢ SINH VIÊN UNIHUB © 2026</span>
                <span className="mt-1 sm:mt-0">Bảo mật thông tin mã hóa bảo vệ quy trình xếp khảo</span>
              </div>

            </div>
          )}

        </div> {/* Close right content area */}

      {/* GRAND UNIHUB FOOTER */}
      <footer className="bg-slate-100 p-5 rounded-3xl border border-slate-200 mt-8 text-center flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-medium">
        <span>Cổng thông tin tự phục vụ sinh viên UniHub Hà Giang • Thiết kế chuẩn tối giản và hiệu năng</span>
        <span className="font-mono mt-1.5 sm:mt-0 flex items-center gap-1.5 text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-150 shadow-2xs">
          <Clock size={11} className="text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Thời gian kiểm liên thông: Kì II - 2025-2026</span>
        </span>
      </footer>

      {/* MODAL EDIT STUDENT PROFILE (Requirement #8) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 shrink-0">
              <h3 className="text-xs font-black text-indigo-900 flex items-center gap-2">
                <User size={15} />
                <span>Cập Nhật Thông Tin Hồ Sơ Cá Nhân & Đổi Mật Khẩu</span>
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Profile Tab Navigation */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto shrink-0 gap-1 select-none">
              <button
                type="button"
                onClick={() => setActiveProfileTab("personal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeProfileTab === "personal"
                    ? "bg-indigo-650 text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-100"
                }`}
              >
                Cá nhân & Liên lạc
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("family")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeProfileTab === "family"
                    ? "bg-indigo-650 text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-100"
                }`}
              >
                Gia đình
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("education")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeProfileTab === "education"
                    ? "bg-indigo-650 text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-100"
                }`}
              >
                Học tập & Tài chính
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("account")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeProfileTab === "account"
                    ? "bg-indigo-650 text-white shadow-xs"
                    : "text-slate-650 hover:bg-slate-100"
                }`}
              >
                Tài khoản & Ảnh
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-250 text-xs font-bold rounded-xl text-center">
                    {profileSuccessMsg}
                  </div>
                )}

                {activeProfileTab === "account" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên sinh viên</label>
                      <input 
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setProfileFields(prev => ({ ...prev, name: e.target.value }));
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-650 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh đại diện (URL)</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="https://images.unsplash.com/..."
                            value={editAvatar}
                            onChange={(e) => {
                              setEditAvatar(e.target.value);
                              setProfileFields(prev => ({ ...prev, avatar: e.target.value }));
                            }}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-655 text-slate-800 font-mono"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const seedUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`;
                              setEditAvatar(seedUrl);
                              setProfileFields(prev => ({ ...prev, avatar: seedUrl }));
                            }}
                            className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 text-xs shrink-0 cursor-pointer"
                          >
                            Mẫu
                          </button>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {editAvatar ? (
                            <img 
                              referrerPolicy="no-referrer"
                              src={editAvatar} 
                              alt="Preview Avatar" 
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`;
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <ImageIcon size={16} />
                            </div>
                          )}
                          <label className="flex-1 cursor-pointer">
                            <div className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-indigo-750 text-xs text-center font-bold transition-colors flex items-center justify-center gap-1.5">
                              <Upload size={12} />
                              <span>Tải ảnh từ máy</span>
                            </div>
                            <input 
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      const dataUrl = event.target.result as string;
                                      setEditAvatar(dataUrl);
                                      setProfileFields(prev => ({ ...prev, avatar: dataUrl }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Ấn nút "Mẫu" để tự động tạo avatar ngẫu nhiên, hoặc tải ảnh từ máy tính của bạn.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Chưa đổi mật khẩu mới"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-650 text-slate-800 font-mono"
                        />
                        <Lock size={12} className="absolute left-3 top-3 text-slate-400" />
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">Mật khẩu này sẽ được lưu để đăng nhập cho các lần sau.</p>
                    </div>
                  </div>
                )}

                {activeProfileTab === "personal" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STUDENT_FIELDS_META.filter(meta => meta.category === "personal").map(meta => {
                      const isReadOnly = meta.readOnly;
                      const value = (profileFields as any)[meta.key] || "";
                      
                      return (
                        <div key={meta.key} className={meta.key === "permanentAddress" || meta.key === "temporaryAddress" ? "sm:col-span-2" : ""}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{meta.label}</label>
                          {meta.type === "select" ? (
                            <select
                              value={value}
                              disabled={isReadOnly}
                              onChange={(e) => {
                                const val = e.target.value;
                                setProfileFields(prev => ({ ...prev, [meta.key]: val }));
                                if (meta.key === "name") {
                                  setEditName(val);
                                }
                              }}
                              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none text-slate-800 bg-white ${
                                isReadOnly ? "bg-slate-50 cursor-not-allowed border-slate-200 text-slate-450" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-650"
                              }`}
                            >
                              <option value="">-- Chọn {meta.label} --</option>
                              {meta.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={meta.type === "number" ? "number" : meta.type === "date" ? "date" : "text"}
                              value={value}
                              disabled={isReadOnly}
                              onChange={(e) => {
                                const val = meta.type === "number" ? Number(e.target.value) : e.target.value;
                                setProfileFields(prev => ({ ...prev, [meta.key]: val }));
                                if (meta.key === "name") {
                                  setEditName(e.target.value);
                                }
                              }}
                              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none text-slate-800 ${
                                isReadOnly ? "bg-slate-50 border-slate-250/60 text-slate-450 cursor-not-allowed font-semibold" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-650"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeProfileTab === "family" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STUDENT_FIELDS_META.filter(meta => meta.category === "family").map(meta => {
                      const value = (profileFields as any)[meta.key] || "";
                      return (
                        <div key={meta.key}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{meta.label}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setProfileFields(prev => ({ ...prev, [meta.key]: e.target.value }))}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-650 text-slate-800"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeProfileTab === "education" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STUDENT_FIELDS_META.filter(meta => meta.category === "education" || meta.category === "finance").map(meta => {
                      const isReadOnly = meta.readOnly;
                      const value = (profileFields as any)[meta.key] || "";
                      return (
                        <div key={meta.key} className={meta.key === "creditClassesList" || meta.key === "enrollmentNotes" ? "sm:col-span-2" : ""}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">{meta.label}</label>
                          <input
                            type={meta.type === "number" ? "number" : "text"}
                            value={value}
                            disabled={isReadOnly}
                            onChange={(e) => setProfileFields(prev => ({ ...prev, [meta.key]: meta.type === "number" ? Number(e.target.value) : e.target.value }))}
                            className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none text-slate-800 ${
                              isReadOnly ? "bg-slate-50 border-slate-250/60 text-slate-450 cursor-not-allowed font-semibold" : "border-slate-200 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-655"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT EXCEPTION EVIDENCE FORM */}
      {showEvModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex justify-between items-center bg-indigo-50/50 px-6 py-4 border-b border-indigo-100">
              <h3 className="text-xs font-black text-indigo-900 flex items-center gap-2">
                <Upload size={14} />
                <span>Nộp Tờ Khai Minh Chứng Đóng Góp Ngoài Hệ Thống</span>
              </h3>
              <button onClick={() => setShowEvModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmission} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên hoạt động xã hội / tình nguyện đóng góp</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Tham gia chiến dịch Mùa hè xanh Hà Giang hoặc giải thể thao..."
                  value={evActivity}
                  onChange={(e) => setEvActivity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu chí áp dụng cộng điểm</label>
                  <select 
                    value={evCriteriaId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setEvCriteriaId(cid);
                      const matched = exceptionRules.find(r => r.criteriaId === cid);
                      if (matched) {
                        setEvPoints(matched.points);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 bg-white text-slate-800"
                  >
                    {exceptionRules.length > 0 ? (
                      exceptionRules.map(rule => (
                        <option key={rule.criteriaId} value={rule.criteriaId}>
                          {rule.categoryName || `Mục ${rule.criteriaId.substring(2, 3)}`}: {rule.name} (+{rule.points}đ)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="TC4.1">Mục 4: Hoạt động cộng đồng/xã hội (+10đ)</option>
                        <option value="TC5.3">Mục 5: Khen thưởng biểu dương (+10đ)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm tự đề xuất</label>
                  <select 
                    value={evPoints}
                    onChange={(e) => setEvPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 bg-white text-slate-800"
                  >
                    <option value={evPoints}>+{evPoints} Điểm (Theo quy chế)</option>
                    <option value={5}>+5 Điểm</option>
                    <option value={10}>+10 Điểm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả đóng góp & Chứng cứ tóm tắt</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Mô tả cụ thể thời gian, địa điểm, thành tích đạt được để GVCN/Bộ phận quản lý xác minh..."
                  value={evDesc}
                  onChange={(e) => setEvDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-slate-800"
                />
              </div>

              {/* Drag and Drop Box with manual selection capability */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload tệp minh chứng quyết định (Ảnh/PDF)</label>
                <div 
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-55/60 p-4 rounded-xl text-center cursor-pointer transition-colors"
                  onClick={() => document.getElementById("evidence-file-input")?.click()}
                >
                  <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-bold text-slate-700 mb-0.5">Kéo thả minh chứng vào đây hoặc click để chọn</p>
                  <p className="text-[9px] text-slate-400">Hỗ trợ PNG, JPG, PDF tối đa 10MB</p>
                  
                  {evFileMockUrl && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-55 text-indigo-750 rounded-full border border-indigo-150 text-[9px] font-mono font-medium">
                      <span>Đã chọn: {evFileMockUrl}</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="evidence-file-input" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEvFile(e.target.files[0]);
                        setEvFileMockUrl(e.target.files[0].name);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEvModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Gửi phê duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
