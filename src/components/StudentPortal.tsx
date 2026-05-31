import React, { useState, useEffect } from "react";
import { useUniHub } from "../state";
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
  Image as ImageIcon
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
    updateStudentProfile
  } = useUniHub();

  const studentId = currentUser?.targetId || "DTG245140202053";
  const sObj = students?.find(s => s.id === studentId);

  const statusColors = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-250";
      default: return "bg-amber-50 text-amber-700 border-amber-250";
    }
  };
  
  // States
  const [selectedSemesterId, setSelectedSemesterId] = useState("HOCKY_2_2025_2026");
  const [activeTab, setActiveTab] = useState<"DIEM" | "HOATDONG" | "CLB" | "MINHCHUNG">("DIEM");
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [activityMilestone, setActivityMilestone] = useState<"ALL" | "WEEK" | "MONTH" | "TERM">("ALL");
  
  // Profiling Edit Dialog Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Modal State for Evidence Upload
  const [showEvModal, setShowEvModal] = useState(false);
  const [evActivity, setEvActivity] = useState("");
  const [evCriteriaId, setEvCriteriaId] = useState("TC4.1");
  const [evPoints, setEvPoints] = useState(10);
  const [evDesc, setEvDesc] = useState("");
  const [evFile, setEvFile] = useState<File | null>(null);
  const [evFileMockUrl, setEvFileMockUrl] = useState("giay_xac_nhan.jpg");

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
    }
  }, [currentUser, sObj, showProfileModal]);

  // Handle profile edit save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert("Họ và tên không được để trống!");
      return;
    }
    updateStudentProfile(studentId, editName, editAvatar, editPassword);
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
    if (activityMilestone === "WEEK") {
      return act.id === "ACT_03" || act.title.toLowerCase().includes("hội thảo") || act.title.toLowerCase().includes("tuần");
    }
    if (activityMilestone === "MONTH") {
      return act.id === "ACT_04" || act.title.toLowerCase().includes("nghị quyết") || act.title.toLowerCase().includes("tháng") || act.title.toLowerCase().includes("ngày hội");
    }
    if (activityMilestone === "TERM") {
      return act.id !== "ACT_03" && act.id !== "ACT_04" && !act.title.toLowerCase().includes("hội thảo") && !act.title.toLowerCase().includes("nghị quyết");
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
              <button 
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="text-[10px] bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-600 border border-indigo-100/60 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
              >
                <Edit size={10} />
                <span>Sửa hồ sơ / Đổi MK</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-550 flex items-center gap-2 flex-wrap font-medium">
              <span>Lớp quản lý: <strong className="text-slate-800">{sObj?.classId || "K20-CNTT"}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Khoa đào tạo: <strong className="text-slate-800">Khoa Sư Phạm</strong></span>
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

          <div className="w-full border-t border-slate-100 pt-4 mt-5 space-y-2.5 text-left text-xs text-slate-500 font-mono font-medium">
            <div className="flex justify-between items-center text-[11px]">
              <span>Số tín chỉ đăng ký:</span>
              <span className="font-bold text-slate-800">{currentCreditsEarned} Tín chỉ</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Trạng thái học tập:</span>
              <span className={`font-bold uppercase ${currentLearningStatus.includes("cảnh báo") ? "text-rose-600" : "text-emerald-600"}`}>
                {currentLearningStatus}
              </span>
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
              <span className="font-bold text-slate-805">{communityPoints} / 15đ</span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up" id="student-portal-container">
      {/* Banner info */}
      {renderProfileBanner()}

      {/* BẢNG TIN HOẠT ĐỘNG & SỰ KIỆN NỔI BẬT KHÔNG KHÍ SÔI NỔI */}
      {renderNewsBoard()}

      {/* Symmetrical Dual Gauges: Điểm Học Tập & Điểm Rèn Luyện */}
      {renderSymmetricalGauges()}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Left Sidebar - Menu bên trái nhỏ gọn */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible shrink-0 lg:h-fit custom-scrollbar">
          <div className="hidden lg:block border-b border-slate-100 pb-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Danh mục cá nhân</span>
          </div>
          
          <button 
            type="button"
            onClick={() => setActiveTab("DIEM")} 
            className={`whitespace-nowrap text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 lg:w-full ${activeTab === "DIEM" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Award size={13} className="shrink-0" />
            <span>Chi tiết điểm rèn luyện</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab("HOATDONG")} 
            className={`whitespace-nowrap text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 lg:w-full ${activeTab === "HOATDONG" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Calendar size={13} className="shrink-0" />
            <span>Ngoại khóa ({activities.length})</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab("CLB")} 
            className={`whitespace-nowrap text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 lg:w-full ${activeTab === "CLB" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Users size={13} className="shrink-0" />
            <span>Câu lạc bộ ({filteredClubs.length})</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab("MINHCHUNG")} 
            className={`whitespace-nowrap text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 hover:cursor-pointer flex items-center gap-2 lg:w-full ${activeTab === "MINHCHUNG" ? "bg-indigo-600 text-white shadow-md shadow-indigo-150" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <FileText size={13} className="shrink-0" />
            <span>Minh chứng ({myEvidence.length})</span>
          </button>
        </div>

        {/* Right main view content container - Giao diện chính hiện bên phải to nhất */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[460px] overflow-hidden">
          {/* Tab contents */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[440px] custom-scrollbar">
          
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh sách Câu lạc bộ Sinh viên</h4>
                  <p className="text-[10px] text-slate-400">Đăng ký thành viên trực tiếp vào các chi hội CLB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredClubs.map(org => {
                  const membership = myOrganizations.find(m => m.orgId === org.id);
                  
                  return (
                    <div key={org.id} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[8px] font-black px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                            {org.field}
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase font-mono">
                            Cấp {org.level === "TRUONG" ? "Trường" : "Khoa"}
                          </span>
                        </div>
                        <h5 className="text-xs font-extrabold text-slate-800 mt-1.5">{org.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-1">Chủ nhiệm: <span className="font-bold">{org.leaderName}</span></p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 mt-4 flex justify-between items-center">
                        <span className="text-[10px] text-slate-450 italic">Cộng 10đ thành viên</span>
                        
                        {membership ? (
                          <span className={`text-[9px] font-extrabold px-2 py-1 rounded border leading-none ${membership.status === "ACTIVE" ? 'bg-emerald-5 text-emerald-700 border-emerald-150' : 'bg-amber-5 text-amber-700 border-amber-150'}`}>
                            {membership.status === "ACTIVE" ? membership.role : "CHỜ DUYỆT GIA NHẬP"}
                          </span>
                        ) : (
                          <button 
                            onClick={() => joinOrganizationRequest(studentId, org.id)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-extrabold px-3 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            Tham gia CLB
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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

        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0 text-center flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400">
          <span>Hệ thống chấm điểm rèn luyện UniHub Hà Giang © 2026</span>
          <span className="font-mono mt-1 sm:mt-0">Liên hệ Văn phòng CTHSSV hoặc GVCN lớp để giải đáp kỹ thuật</span>
        </div>

      </div>

    </div>

      {/* MODAL EDIT STUDENT PROFILE (Requirement #8) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center bg-indigo-50/50 px-6 py-4 border-b border-indigo-100">
              <h3 className="text-xs font-black text-indigo-900 flex items-center gap-2">
                <User size={15} />
                <span>Cập Nhật Thông Tin Hồ Sơ Cá Nhân & Đổi Mật Khẩu</span>
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl text-center">
                  {profileSuccessMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên sinh viên</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ảnh đại diện</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-slate-800 font-mono"
                    />
                    <button 
                      type="button"
                      onClick={() => setEditAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${studentId}`)}
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
                      <div className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-105 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-indigo-700 text-xs text-center font-bold transition-colors flex items-center justify-center gap-1.5">
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
                                setEditAvatar(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Ấn nút "Mẫu" để tự động tạo avatar ngẫu nhiên, hoặc bấm "Tải ảnh từ máy" để chọn ảnh lưu cục bộ.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Chưa đổi mật khẩu mới"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 text-slate-800 font-mono"
                  />
                  <Lock size={12} className="absolute left-3 top-3 text-slate-400" />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Lưu trữ ngoại tuyến an toàn trong bộ nhớ cục bộ (Local Storage).</p>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cập nhật ngay
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
