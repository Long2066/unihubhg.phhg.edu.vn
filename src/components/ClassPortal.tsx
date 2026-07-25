import React, { useState, useEffect, useMemo } from "react";
import { useUniHub } from "../state";
import { UserRole } from "../types";
import { ClassStatisticsBottom } from "./ClassStatisticsBottom";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Trash2, 
  Search, 
  ShieldCheck, 
  UserPen, 
  Trash, 
  Check, 
  X, 
  AlertTriangle, 
  FileText, 
  PlusCircle, 
  Eye, 
  BookOpen, 
  Megaphone,
  Home,
  ClipboardList,
  UserPlus,
  ChevronRight,
  UserCheck,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Filter,
  RefreshCw
} from "lucide-react";

export const ClassPortal: React.FC = () => {
  const { 
    currentUser, 
    students, 
    dailyAttendance,
    reportDailyAttendance,
    results,
    evidence,
    classReviews,
    approveClassScores,
    bulkApproveScores,
    adjustStudentScoreSpecific,
    reviewEvidence,
    activePortletTab,
    users,
    groupAttendances,
    saveGroupSettings,
    reportGroupAttendance,
    approveGroupAttendance,
    rejectGroupAttendance,
    submitGroupLeaderScore,
    applyGroupLeaderScore,
    aggregateGroupAttendancesToDaily,
    sendGroupReminder,
    selectedSemesterId
  } = useUniHub();

  const classId = currentUser?.isGroupLeader 
    ? (students.find(s => s.id === currentUser.targetId)?.classId || "K20-CNTT") 
    : (currentUser?.targetId || "K20-CNTT");
  
  // Get classmates
  const myClassmatesArr = students.filter(s => s.classId === classId);
  const groupName = currentUser?.isGroupLeader ? currentUser.groupInCharge : "";

  // Grouped members for Tổ trưởng
  const myGroupMembers = useMemo(() => {
    if (!currentUser?.isGroupLeader || !groupName) return [];
    return myClassmatesArr.filter(s => s.groupName === groupName);
  }, [myClassmatesArr, currentUser, groupName]);

  // General state variables
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [draftAbsentees, setDraftAbsentees] = useState<{ studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[]>([]);

  // Selection states for bulk group assignments
  const [selectedGroupStudentIds, setSelectedGroupStudentIds] = useState<string[]>([]);
  const [hideAssignedGroupStudents, setHideAssignedGroupStudents] = useState(false);

  // Local state replicas of class group structure for editor
  const [groupAssignments, setGroupAssignments] = useState<{ [studentId: string]: string }>({});
  const [groupLeaders, setGroupLeaders] = useState<{ [groupName: string]: { studentId: string; username?: string; password?: string } }>({});

  // Sync state replicas with database changes
  useEffect(() => {
    const initial: { [studentId: string]: string } = {};
    myClassmatesArr.forEach(s => {
      if (s.groupName) {
        initial[s.id] = s.groupName;
      }
    });
    setGroupAssignments(initial);
  }, [students, classId]);

  useEffect(() => {
    const initialLeaders: { [groupName: string]: { studentId: string; username?: string; password?: string } } = {};
    ["Tổ 1", "Tổ 2", "Tổ 3", "Tổ 4"].forEach(g => {
      const leaderUser = users.find(u => 
        u.role === UserRole.CLASS_MONITOR && 
        u.isGroupLeader && 
        u.groupInCharge === g &&
        u.targetId
      );
      if (leaderUser) {
        initialLeaders[g] = {
          studentId: leaderUser.targetId || "",
          username: leaderUser.username || "",
          password: leaderUser.password || "123456"
        };
      } else {
        initialLeaders[g] = { studentId: "", username: "", password: "password123" };
      }
    });
    setGroupLeaders(initialLeaders);
  }, [users, classId]);

  // Dashboard state variables
  const [attendanceTimeframe, setAttendanceTimeframe] = useState<"day" | "week" | "month" | "year">("day");
  const [evalStatusFilter, setEvalStatusFilter] = useState<"ALL" | "AUTO" | "PENDING_CLASS" | "APPROVED">("ALL");
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  const [selectedDetailStudentId, setSelectedDetailStudentId] = useState<string | null>(null);

  // Manual adjustment form state
  const [adjustCategory, setAdjustCategory] = useState("TC2 - Ý thức kỷ luật nề nếp");
  const [adjustPoints, setAdjustPoints] = useState(-2);
  const [adjustReason, setAdjustReason] = useState("");
  const [reviewerComment, setReviewerComment] = useState("");

  const classReviewInfo = classReviews.find(cr => cr.classId === classId);
  const classDailyReports = dailyAttendance.filter(da => da.classId === classId);

  // Get early warnings for academics/disciplines
  const getEarlyWarnings = () => {
    const warnings: { studentId: string; studentName: string; reasons: string[]; severity: "HIGH" | "MEDIUM" }[] = [];
    const targetStudents = currentUser?.isGroupLeader ? myGroupMembers : myClassmatesArr;
    
    targetStudents.forEach(s => {
      const reasons: string[] = [];
      const semData = s.academicDataByPeriod?.[selectedSemesterId] || {};
      const studentGpa = semData.gpa ?? s.gpa;
      const isWarning = semData.learningWarning ?? s.learningWarning;
      const learningStatus = semData.learningStatus ?? s.learningStatus;

      if (studentGpa !== undefined && studentGpa < 2.0) {
        reasons.push(`GPA học tập dưới mức trung bình (${studentGpa.toFixed(2)})`);
      }
      if (isWarning || learningStatus === "Bị cảnh báo") {
        reasons.push(`Bị cảnh báo học vụ từ Phòng Đào tạo`);
      }

      // Count unexcused absences
      let unexcusedCount = 0;
      classDailyReports.forEach(r => {
        const abs = r.absentees.find(a => a.studentId === s.id && a.type === "KHÔNG_PHÉP");
        if (abs) unexcusedCount++;
      });
      if (unexcusedCount > 3) {
        reasons.push(`Vắng học không phép ${unexcusedCount} buổi`);
      }

      if (reasons.length > 0) {
        warnings.push({
          studentId: s.id,
          studentName: s.name,
          reasons,
          severity: (unexcusedCount > 3 || (studentGpa !== undefined && studentGpa < 1.5)) ? "HIGH" : "MEDIUM"
        });
      }
    });
    return warnings;
  };

  const currentWarnings = useMemo(() => getEarlyWarnings(), [myClassmatesArr, myGroupMembers, classDailyReports, selectedSemesterId]);

  // Toggle draft absentees
  const toggleStudentAbsentee = (studentId: string, studentName: string) => {
    if (draftAbsentees.some(da => da.studentId === studentId)) {
      setDraftAbsentees(draftAbsentees.filter(da => da.studentId !== studentId));
    } else {
      setDraftAbsentees([
        ...draftAbsentees,
        { studentId, studentName, type: "KHÔNG_PHÉP", reason: "" }
      ]);
    }
  };

  const updateDraftAbsenteeField = (studentId: string, fields: Partial<{ type: "PHÉP" | "KHÔNG_PHÉP"; reason: string }>) => {
    setDraftAbsentees(prev => 
      prev.map(da => da.studentId === studentId ? { ...da, ...fields } : da)
    );
  };

  const removeAbsenteeFromDraft = (sid: string) => {
    setDraftAbsentees(draftAbsentees.filter(da => da.studentId !== sid));
  };

  // Submit roll calls
  const submitDailyRollCall = () => {
    if (draftAbsentees.length === 0) {
      if (!window.confirm("Không có ai vắng học. Ghi nhận cả lớp đi học đầy đủ?")) {
        return;
      }
    }

    reportDailyAttendance(
      classId,
      reportDate,
      draftAbsentees,
      currentUser?.name || "Ban cán sự lớp"
    );

    alert(`Đã gửi báo cáo sĩ số lớp ngày ${reportDate} thành công!`);
    setDraftAbsentees([]);
  };

  // Group Leader reports group attendance
  const submitGroupRollCall = () => {
    if (!groupName) return;

    if (draftAbsentees.length === 0) {
      if (!window.confirm("Không có thành viên nào vắng. Báo cáo Tổ đi học đầy đủ?")) {
        return;
      }
    }

    const totalStuds = myGroupMembers.length;
    const absentCount = draftAbsentees.length;
    const presentCount = totalStuds - absentCount;

    reportGroupAttendance({
      classId,
      groupName,
      date: reportDate,
      totalStudents: totalStuds,
      presentCount,
      absentCount,
      absentees: draftAbsentees,
      reportedBy: currentUser?.name || "Tổ trưởng",
      status: "PENDING"
    });

    alert(`Tổ trưởng đã gửi báo cáo sĩ số Tổ ngày ${reportDate}. Chờ Ban cán sự lớp phê duyệt.`);
    setDraftAbsentees([]);
  };

  // Calculate attendance averages
  const classResults = useMemo(() => {
    return results.filter(r => r.classId === classId && r.periodId === selectedSemesterId);
  }, [results, classId, selectedSemesterId]);

  const activeGroupResults = useMemo(() => {
    if (currentUser?.isGroupLeader && groupName) {
      const groupStudentIds = myGroupMembers.map(s => s.id);
      return classResults.filter(r => groupStudentIds.includes(r.studentId));
    }
    return classResults;
  }, [classResults, currentUser, groupName, myGroupMembers]);

  // Overall attendance rate
  const attendanceRate = useMemo(() => {
    let totalExpected = 0;
    let totalPresent = 0;
    classDailyReports.forEach(r => {
      totalExpected += r.totalStudents;
      totalPresent += r.presentCount;
    });
    return totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 100;
  }, [classDailyReports]);

  // Group attendance rate for Tổ trưởng
  const groupAttendanceRate = useMemo(() => {
    if (!currentUser?.isGroupLeader || !groupName) return 100;
    const approvedGroupReps = groupAttendances.filter(ga => 
      ga.classId === classId && 
      ga.groupName === groupName && 
      ga.status === "APPROVED"
    );
    let totalExpected = 0;
    let totalPresent = 0;
    approvedGroupReps.forEach(r => {
      totalExpected += r.totalStudents;
      totalPresent += r.presentCount;
    });
    return totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 100;
  }, [groupAttendances, currentUser, groupName, classId]);

  // Average criteria scores
  const classAvgScore = useMemo(() => {
    if (classResults.length === 0) return 0;
    const sum = classResults.reduce((acc, r) => acc + r.totalPoints, 0);
    return Math.round(sum / classResults.length);
  }, [classResults]);

  const groupAvgScore = useMemo(() => {
    if (activeGroupResults.length === 0) return 0;
    const sum = activeGroupResults.reduce((acc, r) => acc + r.totalPoints, 0);
    return Math.round(sum / activeGroupResults.length);
  }, [activeGroupResults]);

  // Selection states for bulk score approvals
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const toggleSelectStudent = (sid: string) => {
    if (selectedStudentIds.includes(sid)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== sid));
    } else {
      setSelectedStudentIds([...selectedStudentIds, sid]);
    }
  };

  const handleBulkApprove = () => {
    if (selectedStudentIds.length === 0) return;
    if (window.confirm(`Phê duyệt kết quả rèn luyện cho ${selectedStudentIds.length} sinh viên đã chọn?`)) {
      bulkApproveScores(classId, selectedStudentIds, UserRole.CLASS_MONITOR);
      setSelectedStudentIds([]);
      alert("Đã phê duyệt hàng loạt thành công!");
    }
  };

  // Header banner info
  const getBannerMeta = () => {
    switch (activePortletTab) {
      case "TRANG_CHU":
        return {
          title: currentUser?.isGroupLeader ? `Trang chủ Tổng quan Tổ ${groupName}` : `Bảng điều khiển Tổng quan Lớp ${classId}`,
          desc: currentUser?.isGroupLeader 
            ? "Xem tổng hợp sĩ số chuyên cần và tình hình rèn luyện của các thành viên trong Tổ của bạn." 
            : "Xem tổng hợp sĩ số, chuyên cần và phân bố điểm rèn luyện của toàn bộ sinh viên trong lớp học."
        };
      case "BCS_DIEMDANH":
        return {
          title: currentUser?.isGroupLeader ? `Báo cáo Sĩ số Tổ ${groupName}` : `Giám sát Sĩ số & Điểm danh Lớp ${classId}`,
          desc: currentUser?.isGroupLeader 
            ? "Nơi theo dõi và báo cáo chuyên cần đi học và lý do vắng nghỉ của thành viên Tổ lên Cán sự lớp." 
            : "Ghi nhận điểm danh hằng ngày và giám sát nhật ký chuyên cần của toàn lớp."
        };
      case "BCS_DUYET_TO":
        return {
          title: "Phê duyệt Sĩ số cấp Tổ",
          desc: "Ban cán sự lớp rà soát và phê duyệt các báo cáo vắng chuyên cần được đề xuất từ các Tổ trưởng."
        };
      case "BCS_THONG_KE":
        return {
          title: `Thống kê Chuyên cần Lớp ${classId}`,
          desc: "Theo dõi và tra cứu dữ liệu chuyên cần, lịch sử vắng có phép/không phép của sinh viên trong lớp."
        };
      case "BCS_CHIA_TO":
        return {
          title: "Phân Tổ & Cấp quyền",
          desc: "Phân chia tổ học tập cho sinh viên trong lớp và cấp quyền tài khoản Tổ trưởng quản lý."
        };
      case "BCS_XETDUYET":
        return {
          title: currentUser?.isGroupLeader ? "Đề xuất Điểm rèn luyện Tổ" : "Xét duyệt Điểm rèn luyện & Minh chứng",
          desc: currentUser?.isGroupLeader 
            ? "Tổ trưởng đánh giá, nhận xét và đề xuất khung điểm rèn luyện học kỳ cho các thành viên trong Tổ." 
            : "Ban cán sự lớp rà soát, điều chỉnh điểm rèn luyện và duyệt minh chứng hoạt động của toàn lớp."
        };
      default:
        return {
          title: "Cổng Quản lý Lớp học",
          desc: "Nơi quản trị các hoạt động chuyên cần, thi đua và xét điểm rèn luyện cấp chi đoàn."
        };
    }
  };

  // SVGs Chart Builders
  const renderAttendanceChart = () => {
    // 1. Progress ring for year / overall
    if (attendanceTimeframe === "year") {
      let totalPres = 0;
      let totalPhep = 0;
      let totalKhongPhep = 0;
      
      const reports = classDailyReports;
      reports.forEach(r => {
        totalPres += r.presentCount;
        r.absentees.forEach(a => {
          if (a.type === "PHÉP") totalPhep++;
          else totalKhongPhep++;
        });
      });

      const totalRecords = totalPres + totalPhep + totalKhongPhep;
      const presPct = totalRecords > 0 ? Math.round((totalPres / totalRecords) * 100) : 100;
      const phepPct = totalRecords > 0 ? Math.round((totalPhep / totalRecords) * 100) : 0;
      const kpPct = totalRecords > 0 ? Math.round((totalKhongPhep / totalRecords) * 100) : 0;

      // Circle configuration
      const radius = 60;
      const strokeWidth = 12;
      const circ = 2 * Math.PI * radius;

      return (
        <div className="flex flex-col items-center justify-center py-4 space-y-4 md:flex-row md:space-y-0 md:space-x-8">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background ring */}
              <circle cx="72" cy="72" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
              {/* Present ring */}
              <circle 
                cx="72" 
                cy="72" 
                r={radius} 
                stroke="#6366f1" 
                strokeWidth={strokeWidth} 
                fill="transparent" 
                strokeDasharray={circ}
                strokeDashoffset={circ - (presPct / 100) * circ}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-slate-800">{presPct}%</span>
              <span className="block text-[9px] text-slate-400 font-bold uppercase">Đi học đủ</span>
            </div>
          </div>
          <div className="space-y-2 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500 rounded-xs"></span>
              <span>Hiện diện đi học: {presPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-xs"></span>
              <span>Nghỉ có phép: {phepPct}% ({totalPhep} lượt)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-xs"></span>
              <span>Vắng không phép: {kpPct}% ({totalKhongPhep} lượt)</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Bar chart / Line chart for daily or monthly
    const sorted = [...classDailyReports].sort((a, b) => a.date.localeCompare(b.date));
    let dataPoints: { label: string; rate: number }[] = [];

    if (attendanceTimeframe === "day") {
      const last7 = sorted.slice(-7);
      dataPoints = last7.map(r => ({
        label: r.date.substring(5), // MM-DD
        rate: r.totalStudents > 0 ? Math.round((r.presentCount / r.totalStudents) * 100) : 100
      }));
    } else if (attendanceTimeframe === "month") {
      const monthly: { [key: string]: { tot: number; pres: number } } = {};
      sorted.forEach(r => {
        const m = r.date.substring(0, 7);
        if (!monthly[m]) monthly[m] = { tot: 0, pres: 0 };
        monthly[m].tot += r.totalStudents;
        monthly[m].pres += r.presentCount;
      });
      Object.keys(monthly).sort().slice(-4).forEach(m => {
        dataPoints.push({
          label: `Tháng ${m.split("-")[1]}`,
          rate: monthly[m].tot > 0 ? Math.round((monthly[m].pres / monthly[m].tot) * 100) : 100
        });
      });
    } else {
      // Week aggregate
      const chunks = [];
      for (let i = 0; i < sorted.length; i += 5) {
        chunks.push(sorted.slice(i, i + 5));
      }
      chunks.slice(-4).forEach((chk, idx) => {
        let tot = 0, pres = 0;
        chk.forEach(c => { tot += c.totalStudents; pres += c.presentCount; });
        dataPoints.push({
          label: `Tuần ${idx + 1}`,
          rate: tot > 0 ? Math.round((pres / tot) * 100) : 100
        });
      });
    }

    if (dataPoints.length === 0) {
      return <div className="text-center py-10 text-xs text-slate-400 italic">Chưa có dữ liệu thống kê chuyên cần.</div>;
    }

    const svgWidth = 460;
    const svgHeight = 160;
    const barWidth = 40;
    const spacing = (svgWidth - 60 - dataPoints.length * barWidth) / (dataPoints.length + 1);

    if (attendanceTimeframe === "week") {
      // Draw a line chart instead of bars
      const points = dataPoints.map((dp, i) => {
        const x = 50 + i * 110;
        const y = svgHeight - 30 - (dp.rate / 100) * 100;
        return { x, y, dp };
      });

      let dPath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + 40;
        const cpY1 = prev.y;
        const cpX2 = curr.x - 40;
        const cpY2 = curr.y;
        dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }

      // Path for area fill below line
      const dAreaPath = `${dPath} L ${points[points.length - 1].x} ${svgHeight - 30} L ${points[0].x} ${svgHeight - 30} Z`;

      return (
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full font-mono text-[9px] font-bold text-slate-400">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[100, 75, 50].map(val => (
            <g key={val}>
              <line x1="40" y1={svgHeight - 30 - val} x2={svgWidth - 20} y2={svgHeight - 30 - val} stroke="#f1f5f9" strokeWidth="1" />
              <text x="15" y={svgHeight - 26 - val} fill="#cbd5e1">{val}%</text>
            </g>
          ))}

          {/* Area under curve */}
          <path d={dAreaPath} fill="url(#lineGrad)" />

          {/* Bezier Line */}
          <path d={dPath} fill="transparent" stroke="#6366f1" strokeWidth="2.5" />

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#6366f1" strokeWidth="2" />
              <text x={pt.x - 10} y={pt.y - 10} fill="#4f46e5" className="font-black">{pt.dp.rate}%</text>
              <text x={pt.x - 15} y={svgHeight - 12} fill="#64748b" className="font-sans">{pt.dp.label}</text>
            </g>
          ))}
        </svg>
      );
    }

    // Bar chart for Day/Month
    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full font-mono text-[9px] font-bold text-slate-400">
        {[100, 75, 50].map(val => (
          <g key={val}>
            <line x1="40" y1={svgHeight - 30 - val} x2={svgWidth - 20} y2={svgHeight - 30 - val} stroke="#f1f5f9" strokeWidth="1" />
            <text x="15" y={svgHeight - 26 - val} fill="#cbd5e1">{val}%</text>
          </g>
        ))}

        {dataPoints.map((dp, i) => {
          const x = 50 + spacing + i * (barWidth + spacing);
          const barHeight = (dp.rate / 100) * 100;
          const y = svgHeight - 30 - barHeight;

          return (
            <g key={i}>
              {/* Background bar */}
              <rect x={x} y={svgHeight - 130} width={barWidth} height="100" fill="#f8fafc" rx="4" />
              {/* Highlight bar */}
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={barHeight} 
                fill={dp.rate >= 90 ? "#6366f1" : dp.rate >= 80 ? "#818cf8" : "#fb7185"} 
                rx="4" 
                className="transition-all duration-500"
              />
              <text x={x + barWidth / 2 - 10} y={y - 8} fill="#4f46e5" className="font-black">{dp.rate}%</text>
              <text x={x + barWidth / 2 - dp.label.length * 3} y={svgHeight - 12} fill="#64748b" className="font-sans">{dp.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderCriteriaChart = () => {
    const targetResults = activeGroupResults;
    const gradeCounts = { EXCELLENT: 0, GOOD: 0, FAIR: 0, AVERAGE: 0, WEAK: 0 };
    targetResults.forEach(r => {
      if (r.totalPoints >= 90) gradeCounts.EXCELLENT++;
      else if (r.totalPoints >= 80) gradeCounts.GOOD++;
      else if (r.totalPoints >= 70) gradeCounts.FAIR++;
      else if (r.totalPoints >= 50) gradeCounts.AVERAGE++;
      else gradeCounts.WEAK++;
    });

    const totalStuds = targetResults.length || 1;
    const grades = [
      { key: "EXCELLENT", label: "Xuất sắc (90-100)", color: "bg-indigo-600", count: gradeCounts.EXCELLENT },
      { key: "GOOD", label: "Tốt (80-89)", color: "bg-emerald-500", count: gradeCounts.GOOD },
      { key: "FAIR", label: "Khá (70-79)", color: "bg-amber-500", count: gradeCounts.FAIR },
      { key: "AVERAGE", label: "Trung bình (50-69)", color: "bg-indigo-400", count: gradeCounts.AVERAGE },
      { key: "WEAK", label: "Yếu/Kém (<50)", color: "bg-rose-500", count: gradeCounts.WEAK }
    ];

    return (
      <div className="space-y-3 py-1.5 text-xs font-bold text-slate-700">
        {grades.map(g => {
          const pct = Math.round((g.count / totalStuds) * 100);
          return (
            <div key={g.key} className="space-y-1">
              <div className="flex justify-between font-bold text-[11px]">
                <span className="text-slate-600">{g.label}</span>
                <span className="text-slate-800">{g.count} SV ({pct}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${g.color} transition-all duration-500`} 
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 1. Dashboard Tab View
  const renderOverviewDashboard = () => {
    const isGL = currentUser?.isGroupLeader;
    const displayAvgRate = isGL ? groupAttendanceRate : attendanceRate;
    const displayAvgScore = isGL ? groupAvgScore : classAvgScore;
    const totalCount = isGL ? myGroupMembers.length : myClassmatesArr.length;

    return (
      <div className="space-y-6">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Sĩ số quản lý</span>
              <span className="text-2xl font-black text-slate-800">{totalCount}</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Sinh viên chính thức</span>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Chuyên cần trung bình</span>
              <span className="text-2xl font-black text-emerald-600">{displayAvgRate}%</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Tỉ lệ đi học đầy đủ</span>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">ĐRL trung bình</span>
              <span className="text-2xl font-black text-indigo-700">{displayAvgScore}</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Học kỳ hiện hành</span>
            </div>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left">
            <div className={`p-3 rounded-xl shrink-0 ${currentWarnings.length > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-450"}`}>
              <AlertTriangle size={22} className={currentWarnings.length > 0 ? "animate-pulse" : ""} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Sinh viên lưu ý</span>
              <span className={`text-2xl font-black ${currentWarnings.length > 0 ? "text-rose-600" : "text-slate-800"}`}>{currentWarnings.length}</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">Cảnh báo học vụ & nề nếp</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Attendance Trend Chart */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col justify-between">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase block font-sans">Thống kê Chuyên cần</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Đồ thị trực quan tỉ lệ chuyên cần đi học của lớp học.</p>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-150">
                {(["day", "week", "month", "year"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setAttendanceTimeframe(tf)}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${attendanceTimeframe === tf ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    {tf === "day" ? "Ngày" : tf === "week" ? "Tuần" : tf === "month" ? "Tháng" : "Học kỳ"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-44 flex items-center justify-center mt-4">
              {renderAttendanceChart()}
            </div>
          </div>

          {/* Criteria Score Distribution */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col justify-between">
            <div className="border-b pb-2">
              <span className="text-xs font-black text-slate-800 uppercase block font-sans">Phân bố Điểm Rèn luyện</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Phân bố thứ hạng xếp loại rèn luyện học kỳ hiện tại.</p>
            </div>
            <div className="mt-4 flex-1 flex flex-col justify-center">
              {renderCriteriaChart()}
            </div>
          </div>
        </div>

        {/* Early Warnings Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
          <div className="border-b pb-2">
            <span className="text-xs font-black text-slate-800 uppercase block font-sans flex items-center gap-1.5">
              <AlertCircle size={15} className="text-rose-500 animate-pulse" />
              Danh sách Cảnh báo & Nhắc nhở chuyên cần, học tập
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">Sinh viên có GPA học kỳ thấp hoặc vắng nghỉ không phép nhiều lần.</p>
          </div>

          {currentWarnings.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 italic">Không phát hiện sinh viên nào thuộc diện cảnh báo nguy cơ.</div>
          ) : (
            <div className="border rounded-xl overflow-hidden text-xs max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-slate-700">
                <thead className="bg-slate-50 uppercase tracking-wider text-[9px] text-slate-405 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Sinh viên</th>
                    <th className="p-3">Nguyên nhân cảnh báo</th>
                    <th className="p-3 text-center">Mức độ</th>
                    <th className="p-3 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {currentWarnings.map(w => (
                    <tr key={w.studentId} className="hover:bg-slate-50/40">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{w.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{w.studentId}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-650 max-w-[320px]">
                        <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                          {w.reasons.map((r, i) => (
                            <li key={i} className="truncate">{r}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${w.severity === "HIGH" ? "bg-rose-50 border border-rose-250 text-rose-700" : "bg-amber-50 border border-amber-250 text-amber-700"}`}>
                          {w.severity === "HIGH" ? "Cao" : "Trung bình"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            const msg = `Lưu ý từ Cán sự lớp: Bạn đang thuộc diện cảnh báo học kỳ về [${w.reasons.join(" và ") }]. Vui lòng tập trung học tập và đi học chuyên cần đầy đủ.`;
                            sendGroupReminder(classId, [w.studentId], msg);
                            alert(`Đã gửi thông báo nhắc nhở riêng cho sinh viên ${w.studentName}`);
                          }}
                          className="py-1 px-3.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-750 font-black rounded-lg text-[10.5px] cursor-pointer shadow-3xs transition-colors shrink-0"
                        >
                          Gửi Nhắc Nhở Riêng
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    );
  };

  // 2. Class Monitor / Group Leader attendance tab
  const renderAttendanceTab = () => {
    const isGL = currentUser?.isGroupLeader;
    const targetStudents = isGL 
      ? myGroupMembers.filter(s => s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.id.includes(attendanceSearch))
      : myClassmatesArr.filter(s => s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.id.includes(attendanceSearch));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Select absentees */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-2">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase block font-sans">
                  {isGL ? `Danh sách thành viên Tổ ${groupName}` : "Danh sách sinh viên lớp"}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Nhấp chọn sinh viên vắng mặt học để thêm lý do vào báo cáo.</p>
              </div>
              <div className="relative w-full md:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên / mã SV..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {targetStudents.map(s => {
                const isAbsent = draftAbsentees.some(da => da.studentId === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleStudentAbsentee(s.id, s.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${isAbsent ? "bg-rose-50 border-rose-250 shadow-3xs" : "bg-white border-slate-200 hover:bg-slate-50/50"}`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">
                        {s.id} {s.groupName ? `| ${s.groupName}` : ""}
                      </span>
                    </div>
                    {isAbsent ? (
                      <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-md">VẮNG</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">CÓ MẶT</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Draft absentees table */}
          {draftAbsentees.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-fade-in text-left">
              <div className="border-b pb-2">
                <span className="text-xs font-black text-rose-700 uppercase block font-sans">Chi tiết lý do vắng học ({draftAbsentees.length} SV)</span>
                <p className="text-[10px] text-slate-455 mt-0.5">Xác nhận lý do vắng có phép hoặc không phép của từng sinh viên.</p>
              </div>

              <div className="border rounded-xl overflow-x-auto text-xs max-h-[220px] overflow-y-auto">
                <table className="w-full text-left text-slate-700">
                  <thead className="bg-slate-50 uppercase tracking-wider text-[9px] text-slate-405 border-b sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Sinh viên</th>
                      <th className="p-3 text-center">Phân loại</th>
                      <th className="p-3">Lý do cụ thể</th>
                      <th className="p-3 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {draftAbsentees.map(da => (
                      <tr key={da.studentId}>
                        <td className="p-3 font-semibold text-slate-800">
                          {da.studentName}
                          <span className="block text-[9.5px] font-mono text-slate-400 font-bold">{da.studentId}</span>
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={da.type}
                            onChange={(e) => updateDraftAbsenteeField(da.studentId, { type: e.target.value as "PHÉP" | "KHÔNG_PHÉP" })}
                            className="p-1 border border-slate-200 rounded-md bg-white text-xs font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="KHÔNG_PHÉP">KHÔNG PHÉP</option>
                            <option value="PHÉP">CÓ PHÉP</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Lý do (ốm đau, việc gia đình...)"
                            value={da.reason || ""}
                            onChange={(e) => updateDraftAbsenteeField(da.studentId, { reason: e.target.value })}
                            className="w-full p-1.5 border border-slate-200 rounded-md text-xs font-semibold"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeAbsenteeFromDraft(da.studentId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-0 bg-transparent"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Info: Submit actions & history */}
        <div className="lg:col-span-4 space-y-6">
          {/* Submit card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left space-y-4">
            <span className="text-xs font-black text-slate-800 uppercase block font-sans border-b pb-2">Báo cáo Sĩ số Chuyên cần</span>
            
            <div className="space-y-3.5 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block">Ngày học báo cáo</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-705 focus:outline-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border rounded-xl p-3 space-y-2 text-[11px] font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-450">Sĩ số quản lý:</span>
                  <span className="text-slate-850 font-mono">{targetStudents.length} người</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Vắng học dự kiến:</span>
                  <span className="text-rose-600 font-mono">{draftAbsentees.length} người</span>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-slate-700">Đi học thực tế:</span>
                  <span className="text-indigo-650 font-extrabold font-mono">{targetStudents.length - draftAbsentees.length} người</span>
                </div>
              </div>

              <button
                onClick={isGL ? submitGroupRollCall : submitDailyRollCall}
                className="w-full py-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-sm transition-colors text-center border-0 flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                <span>{isGL ? "Nộp Báo Cáo Sĩ Số Tổ" : "Gửi Báo Cáo Sĩ Số Lớp"}</span>
              </button>
            </div>
          </div>

          {/* Attendance History (Group Leaders only, Monitors see ClassStatisticsBottom) */}
          {isGL && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5 text-left">
              <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1.5 font-sans">
                <Clock size={13} className="text-indigo-600" />
                Lịch sử nhật ký sĩ số đã nộp của Tổ {groupName}
              </span>
              {groupAttendances.filter(ga => ga.classId === classId && ga.groupName === groupName).length === 0 ? (
                <p className="text-[10.5px] text-slate-400 italic">Chưa ghi nhận lịch sử báo cáo sĩ số nào của Tổ.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto divide-y divide-slate-150 pr-1 text-left">
                  {groupAttendances.filter(ga => ga.classId === classId && ga.groupName === groupName).map(ga => (
                    <div key={ga.id} className="pt-2 text-[11px] first:pt-0">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span className="font-mono text-slate-600">
                          Ngày học: {ga.date} [Trạng thái: 
                          <span className={`ml-1 font-bold ${ga.status === "APPROVED" ? "text-emerald-600" : ga.status === "REJECTED" ? "text-rose-600" : "text-amber-500"}`}>
                            {ga.status === "APPROVED" ? "Đã duyệt" : ga.status === "REJECTED" ? "Từ chối" : "Đang chờ"}
                          </span>]
                        </span>
                        <span className="text-indigo-655 font-bold">Hiện diện: {ga.presentCount}/{ga.totalStudents}</span>
                      </div>
                      {ga.absentees.length > 0 ? (
                        <div className="mt-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                          {ga.absentees.map((abs, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="font-bold">{abs.studentName}</span>
                              <span className="font-semibold italic text-slate-450">({abs.type === "PHÉP" ? "Có phép" : "Không phép"}{abs.reason ? `: ${abs.reason}` : ""})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Cả Tổ đi học đầy đủ</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    );
  };

  // 3. BCS Approve Group attendance reports
  const renderApproveGroupsTab = () => {
    const pendingReports = groupAttendances.filter(ga => ga.classId === classId && ga.status === "PENDING");

    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left space-y-4">
        <div className="border-b pb-2">
          <span className="text-xs font-black text-slate-800 uppercase block font-sans">Danh sách báo cáo sĩ số chờ duyệt từ các Tổ trưởng</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Duyệt các báo cáo nghỉ/vắng của từng tổ để hệ thống tự động tổng hợp lên nhật ký sĩ số lớp.</p>
        </div>

        {pendingReports.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 italic">Không có báo cáo sĩ số cấp tổ nào đang chờ phê duyệt.</div>
        ) : (
          <div className="space-y-4">
            {pendingReports.map(rep => (
              <div key={rep.id} className="bg-slate-50 border border-slate-150 p-4.5 rounded-xl space-y-3.5 text-xs">
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold rounded-lg text-[10.5px]">
                      {rep.groupName}
                    </span>
                    <span className="font-bold text-slate-700">| Ngày báo cáo: <span className="font-mono text-slate-900">{rep.date}</span></span>
                  </div>
                  <div className="text-slate-500 font-semibold">
                    Người nộp: <span className="font-bold text-slate-700">{rep.reportedBy}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-lg text-[11px] font-bold">
                  <span className="text-slate-500">Thành viên đi học:</span>
                  <span className="text-indigo-650 font-black font-mono">{rep.presentCount} / {rep.totalStudents} người</span>
                </div>

                {rep.absentees.length > 0 ? (
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Thành viên vắng học:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rep.absentees.map((abs, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">{abs.studentName}</span>
                            <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5">{abs.studentId}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-xs text-[9px] font-black uppercase ${abs.type === "PHÉP" ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : "bg-rose-50 text-rose-700 border border-rose-250"}`}>
                              {abs.type}
                            </span>
                            {abs.reason && <span className="block text-[9.5px] text-slate-400 font-semibold italic mt-0.5 truncate max-w-[120px]">{abs.reason}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Cả Tổ đi học đầy đủ</p>
                )}

                <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-200/50">
                  <button
                    onClick={() => {
                      if (window.confirm("Từ chối báo cáo này để Tổ trưởng điều chỉnh lại?")) {
                        rejectGroupAttendance(rep.id, currentUser?.name || "Lớp trưởng");
                      }
                    }}
                    className="py-1.5 px-4 bg-white hover:bg-slate-100 text-rose-600 font-bold border border-rose-200 rounded-lg text-xs cursor-pointer shadow-3xs transition-colors shrink-0"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      approveGroupAttendance(rep.id, currentUser?.name || "Lớp trưởng");
                      alert("Đã phê duyệt báo cáo sĩ số Tổ thành công!");
                    }}
                    className="py-1.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-3xs transition-colors shrink-0 border-0 flex items-center gap-1"
                  >
                    <Check size={13} />
                    <span>Duyệt & Ghi nhận</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 4. BCS Chia to (Group Configuration)
  const renderChiaTo = () => {
    const displayedStudents = hideAssignedGroupStudents
      ? myClassmatesArr.filter(s => !groupAssignments[s.id])
      : myClassmatesArr;

    return (
      <div className="space-y-6 text-left">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          
          <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-4">
            <div>
              <span className="text-xs font-black text-slate-700 uppercase block font-sans">Phân bổ thành viên vào Tổ</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Chọn Tổ cho từng sinh viên trong lớp để thực hiện điểm danh và chấm điểm Tổ.</p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-650 bg-slate-50 border px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hideAssignedGroupStudents}
                  onChange={(e) => {
                    setHideAssignedGroupStudents(e.target.checked);
                    setSelectedGroupStudentIds([]); // Clear select
                  }}
                  className="cursor-pointer rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>Ẩn thành viên đã phân tổ ({myClassmatesArr.filter(s => groupAssignments[s.id]).length} người)</span>
              </label>
              <button
                onClick={() => {
                  saveGroupSettings(classId, groupAssignments, groupLeaders);
                  alert("Đã lưu cấu hình Tổ & tài khoản Tổ trưởng thành công!");
                }}
                className="py-1.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-sm transition-colors text-center border-0"
              >
                Lưu cấu hình Tổ & Tổ Trưởng
              </button>
            </div>
          </div>

          {/* Bulk Group Assignment Action Bar */}
          {selectedGroupStudentIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 border border-indigo-150 p-3.5 rounded-xl animate-fade-in text-xs font-bold text-indigo-950 shadow-3xs">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold animate-pulse-subtle">
                  {selectedGroupStudentIds.length}
                </span>
                <span>sinh viên đã chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Phân vào tổ hàng loạt:</span>
                <select
                  id="bulk-group-select"
                  className="p-1.5 border border-indigo-200 rounded-lg bg-white text-xs font-bold text-slate-700 focus:outline-indigo-500 cursor-pointer"
                  defaultValue="placeholder"
                  onChange={(e) => {
                    const group = e.target.value;
                    if (group === "placeholder") return;
                    setGroupAssignments(prev => {
                      const updated = { ...prev };
                      selectedGroupStudentIds.forEach(id => {
                        if (group === "UNASSIGNED") {
                          delete updated[id];
                        } else {
                          updated[id] = group;
                        }
                      });
                      return updated;
                    });
                    setSelectedGroupStudentIds([]);
                    e.target.value = "placeholder";
                  }}
                >
                  <option value="placeholder" disabled>-- Chọn tổ nhận hàng loạt --</option>
                  <option value="Tổ 1">Tổ 1</option>
                  <option value="Tổ 2">Tổ 2</option>
                  <option value="Tổ 3">Tổ 3</option>
                  <option value="Tổ 4">Tổ 4</option>
                  <option value="UNASSIGNED">Bỏ phân tổ (Chưa chia tổ)</option>
                </select>
              </div>
            </div>
          )}

          <div className="border rounded-xl overflow-x-auto text-xs max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-slate-700">
              <thead className="bg-slate-50 uppercase tracking-wider text-[9px] text-slate-405 border-b sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      checked={displayedStudents.length > 0 && selectedGroupStudentIds.length === displayedStudents.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroupStudentIds(displayedStudents.map(s => s.id));
                        } else {
                          setSelectedGroupStudentIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-3">Mã SV</th>
                  <th className="p-3">Sinh viên</th>
                  <th className="p-3">Tổ Hiện Tại</th>
                  <th className="p-3">Chuyển Tổ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 font-bold">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 italic">Mọi sinh viên đều đã được phân tổ.</td>
                  </tr>
                ) : (
                  displayedStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/40">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          className="cursor-pointer rounded border-slate-355 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          checked={selectedGroupStudentIds.includes(s.id)}
                          onChange={() => {
                            if (selectedGroupStudentIds.includes(s.id)) {
                              setSelectedGroupStudentIds(selectedGroupStudentIds.filter(id => id !== s.id));
                            } else {
                              setSelectedGroupStudentIds([...selectedGroupStudentIds, s.id]);
                            }
                          }}
                        />
                      </td>
                      <td className="p-3 font-mono font-medium text-slate-500">{s.id}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {groupAssignments[s.id] || "Chưa phân tổ"}
                      </td>
                      <td className="p-3">
                        <select
                          value={groupAssignments[s.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGroupAssignments(prev => {
                              const updated = { ...prev };
                              if (!val) {
                                delete updated[s.id];
                              } else {
                                updated[s.id] = val;
                              }
                              return updated;
                            });
                          }}
                          className="p-1 border border-slate-200 rounded bg-white text-[11px] font-bold text-slate-700 cursor-pointer focus:outline-indigo-500"
                        >
                          <option value="">Chưa phân tổ</option>
                          <option value="Tổ 1">Tổ 1</option>
                          <option value="Tổ 2">Tổ 2</option>
                          <option value="Tổ 3">Tổ 3</option>
                          <option value="Tổ 4">Tổ 4</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Set Group Leaders Credentials */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-2">
            <span className="text-xs font-black text-slate-700 uppercase block font-sans">Bổ nhiệm Tổ trưởng & Quản trị tài khoản</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Chỉ định sinh viên trong tổ làm Tổ trưởng và thiết lập mật khẩu truy cập cho họ.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Tổ 1", "Tổ 2", "Tổ 3", "Tổ 4"].map(groupName => {
              const currentLeader = groupLeaders[groupName] || { studentId: "", username: "", password: "password123" };
              const groupStudents = myClassmatesArr.filter(s => groupAssignments[s.id] === groupName);

              return (
                <div key={groupName} className="bg-slate-50 border rounded-xl p-4.5 space-y-3">
                  <span className="text-xs font-black text-indigo-700 uppercase block font-sans">{groupName}</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Chỉ định Tổ trưởng</label>
                    <select
                      value={currentLeader.studentId || ""}
                      onChange={(e) => {
                        const sid = e.target.value;
                        setGroupLeaders(prev => ({
                          ...prev,
                          [groupName]: {
                            ...prev[groupName],
                            studentId: sid
                          }
                        }));
                      }}
                      className="w-full p-2 border rounded-lg bg-white text-xs font-bold text-slate-705 focus:outline-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Chưa chỉ định --</option>
                      {groupStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                      ))}
                    </select>
                  </div>

                  {currentLeader.studentId && (
                    <div className="space-y-2 animate-fade-in pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-455 uppercase block">Tên đăng nhập / Email</label>
                        <input
                          type="text"
                          value={currentLeader.username || ""}
                          onChange={(e) => {
                            const uname = e.target.value;
                            setGroupLeaders(prev => ({
                              ...prev,
                              [groupName]: {
                                ...prev[groupName],
                                username: uname
                              }
                            }));
                          }}
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold text-slate-700 focus:outline-indigo-500"
                          placeholder="Ví dụ: t1k2gdtha..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-455 uppercase block">Mật khẩu tài khoản</label>
                        <input
                          type="text"
                          value={currentLeader.password || ""}
                          onChange={(e) => {
                            const pwd = e.target.value;
                            setGroupLeaders(prev => ({
                              ...prev,
                              [groupName]: {
                                ...prev[groupName],
                                password: pwd
                              }
                            }));
                          }}
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold text-slate-700 focus:outline-indigo-500"
                          placeholder="Mật khẩu..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 5. Evaluate Class Results (BCS_XETDUYET)
  const renderEvaluateTab = () => {
    const isGL = currentUser?.isGroupLeader;
    
    // Filters applied
    const filteredResults = activeGroupResults.filter(r => {
      const nameMatch = r.studentName.toLowerCase().includes(searchStudentQuery.toLowerCase()) || r.studentId.includes(searchStudentQuery);
      if (!nameMatch) return false;

      if (evalStatusFilter === "ALL") return true;
      if (evalStatusFilter === "AUTO") return r.status === "AUTO" || r.status === "DRAFT";
      if (evalStatusFilter === "PENDING_CLASS") return r.status === "PENDING_CLASS";
      if (evalStatusFilter === "APPROVED") {
        return r.status === "APPROVED_CLASS" || r.status === "APPROVED_ADVISER" || r.status === "LOCKED";
      }
      return true;
    });

    return (
      <div className="space-y-6 text-left">
        
        {/* Bulk approval bar and Search Filters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-2 flex-wrap">
            <div>
              <span className="text-xs font-black text-slate-700 uppercase block font-sans">Danh sách chấm điểm rèn luyện</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Theo dõi và rà soát kết quả rèn luyện học kỳ của từng sinh viên.</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Class monitors can bulk approve and lock class scores */}
              {!isGL && (
                <>
                  {selectedStudentIds.length > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      className="py-1.5 px-3.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-750 font-black rounded-lg text-[10.5px] cursor-pointer shadow-3xs transition-colors shrink-0"
                    >
                      Duyệt Hàng Loạt ({selectedStudentIds.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm("Chốt và gửi toàn bộ kết quả chấm điểm rèn luyện của lớp lên GVCN xét duyệt?")) {
                        approveClassScores(classId);
                        alert("Đã chốt và gửi báo cáo điểm rèn luyện lớp thành công!");
                      }
                    }}
                    className={`py-1.5 px-4 font-black rounded-lg text-xs cursor-pointer shadow-sm transition-colors text-center border-0 ${classReviewInfo?.representativeApproved ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed" : "bg-indigo-650 hover:bg-indigo-700 text-white"}`}
                    disabled={!!classReviewInfo?.representativeApproved}
                  >
                    {classReviewInfo?.representativeApproved ? "Lớp đã chốt & gửi GVCN" : "Khóa & Gửi GVCN duyệt"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 border border-slate-150 p-4 rounded-xl">
            <div className="md:col-span-8 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm sinh viên theo họ tên / mã sinh viên..."
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-indigo-500 font-semibold"
              />
            </div>
            <div className="md:col-span-4">
              <select
                value={evalStatusFilter}
                onChange={(e) => setEvalStatusFilter(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 focus:outline-indigo-500 cursor-pointer"
              >
                <option value="ALL">-- Tất cả trạng thái --</option>
                <option value="AUTO">Chưa duyệt (DRAFT / AUTO)</option>
                <option value="APPROVED">Đã chốt (APPROVED)</option>
              </select>
            </div>
          </div>

          {/* Score Table */}
          <div className="border rounded-xl overflow-x-auto text-xs max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-slate-700">
              <thead className="bg-slate-50 uppercase tracking-wider text-[9px] text-slate-405 border-b sticky top-0 z-10">
                <tr>
                  {!isGL && (
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        className="cursor-pointer rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        checked={filteredResults.length > 0 && selectedStudentIds.length === filteredResults.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds(filteredResults.map(r => r.studentId));
                          } else {
                            setSelectedStudentIds([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="p-3">Sinh viên</th>
                  <th className="p-3 text-center">Tổng điểm</th>
                  <th className="p-3 text-center">Xếp loại</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  {isGL && <th className="p-3 text-center">Đề xuất của Tổ</th>}
                  <th className="p-3 text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 font-bold">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={isGL ? 6 : 7} className="p-4 text-center text-slate-400 italic">Không tìm thấy kết quả nào phù hợp.</td>
                  </tr>
                ) : (
                  filteredResults.map(r => {
                    const origStudent = students.find(s => s.id === r.studentId);
                    const isSelected = selectedStudentIds.includes(r.studentId);
                    const hasProposed = r.groupLeaderScore;

                    return (
                      <tr key={r.studentId} className="hover:bg-slate-50/40">
                        {!isGL && (
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              className="cursor-pointer rounded border-slate-355 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(r.studentId)}
                            />
                          </td>
                        )}
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{r.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {r.studentId} {origStudent?.groupName ? `| ${origStudent.groupName}` : ""}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-indigo-700 text-sm">{r.totalPoints}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${r.grade === "XUẤT SẮC" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : r.grade === "TỐT" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : r.grade === "KHÁ" ? "bg-amber-50 text-amber-700 border border-amber-250" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${r.status.startsWith("APPROVED") || r.status === "LOCKED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {r.status === "AUTO" || r.status === "DRAFT" ? "Chưa duyệt" : r.status === "APPROVED_CLASS" ? "Lớp đã duyệt" : r.status === "APPROVED_ADVISER" ? "GVCN đã duyệt" : "Đã khóa"}
                          </span>
                        </td>
                        {isGL && (
                          <td className="p-3 text-center">
                            {hasProposed ? (
                              <span className="text-[10px] text-emerald-600 font-black">{hasProposed.totalPoints}đ (Đã đề xuất)</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Chưa có đề xuất</span>
                            )}
                          </td>
                        )}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedDetailStudentId(r.studentId)}
                            className="py-1 px-3 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg text-[10px] cursor-pointer shadow-3xs transition-colors shrink-0 flex items-center gap-1 mx-auto"
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  };

  // 6. Detailed student score adjuster / proposed score & evidence modal
  const renderDetailStudentModal = () => {
    if (!selectedDetailStudentId) return null;

    const studentObj = students.find(s => s.id === selectedDetailStudentId);
    const resultObj = results.find(r => r.studentId === selectedDetailStudentId && r.periodId === selectedSemesterId);
    const studentEvidences = evidence.filter(ev => ev.studentId === selectedDetailStudentId);

    if (!resultObj) return null;

    const isGL = currentUser?.isGroupLeader;
    const hasProposed = resultObj.groupLeaderScore;

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col justify-between transform transition-all duration-300 text-left max-h-[90vh]">
          
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-150 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide font-mono">
                  {isGL ? "Đánh giá Đề xuất Tổ viên" : "Xét duyệt Chi tiết Sinh viên"}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {studentObj?.name} | Mã SV: {selectedDetailStudentId} {studentObj?.groupName ? `| ${studentObj.groupName}` : ""}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedDetailStudentId(null);
                setReviewerComment("");
              }}
              className="text-slate-400 hover:text-slate-650 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer border-0 bg-transparent flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Content Scroll Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Top Score Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              {[
                { label: "TC1: Học tập", max: 20, points: resultObj.studyPoints, color: "text-indigo-650 bg-indigo-50 border-indigo-100" },
                { label: "TC2: Nội quy nề nếp", max: 25, points: resultObj.violationPoints, color: "text-rose-650 bg-rose-50 border-rose-100" },
                { label: "TC3: Đoàn thể, CLB", max: 30, points: resultObj.extracurricularPoints, color: "text-emerald-650 bg-emerald-50 border-emerald-100" },
                { label: "TC4: Xã hội, lớp học", max: 15, points: resultObj.communityPoints, color: "text-amber-650 bg-amber-50 border-amber-100" },
                { label: "TC5: Chức vụ, thưởng", max: 10, points: resultObj.achievementPoints, color: "text-violet-650 bg-violet-50 border-violet-100" }
              ].map((tc, idx) => (
                <div key={idx} className={`p-3 border rounded-xl flex flex-col justify-between ${tc.color} font-bold text-center`}>
                  <span className="text-[9.5px] uppercase tracking-wide opacity-80">{tc.label}</span>
                  <div className="text-xl font-black mt-1.5 font-mono">{tc.points} <span className="text-xs font-bold opacity-60">/ {tc.max}</span></div>
                </div>
              ))}
            </div>

            {/* Total Points & Status summary */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Tổng Điểm Rèn Luyện</span>
                  <span className="text-2xl font-black text-indigo-700 font-mono">{resultObj.totalPoints}đ</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Xếp Loại</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase inline-block mt-0.5 ${resultObj.grade === "XUẤT SẮC" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {resultObj.grade}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase">Trạng Thái Xét Duyệt</span>
                  <span className="text-slate-700 font-bold block mt-0.5">{resultObj.status}</span>
                </div>
              </div>

              {/* Group Leader Score Proposed Info */}
              {hasProposed && (
                <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl max-w-sm">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[10.5px] uppercase">
                    <CheckCircle2 size={13} />
                    <span>Đề xuất từ Tổ trưởng</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Đề xuất: <span className="font-bold font-mono">{hasProposed.totalPoints}đ</span>. 
                    {hasProposed.comment && <span className="block mt-0.5 italic">Nhận xét: "{hasProposed.comment}"</span>}
                  </div>
                  {!isGL && (
                    <button
                      onClick={() => {
                        applyGroupLeaderScore(selectedDetailStudentId);
                        alert("Đã áp dụng kết quả đề xuất của Tổ trưởng làm điểm chính thức!");
                      }}
                      className="mt-2 py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] cursor-pointer shadow-3xs border-0"
                    >
                      Áp dụng điểm đề xuất này
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Traceability logs */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase block font-sans border-b pb-1.5">
                  Lịch sử điểm cộng / trừ tự động & điều chỉnh
                </span>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {resultObj.logs.map((log, idx) => (
                    <div key={idx} className="bg-white border p-3 rounded-xl text-[11px] flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-50 border text-slate-500 font-extrabold rounded-md text-[9px] font-mono">
                            {log.criteriaId}
                          </span>
                          <span className="font-extrabold text-slate-700">{log.reason}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          Nguồn: <span className="uppercase">{log.source}</span> | {log.timestamp}
                        </div>
                      </div>
                      <span className={`font-mono font-black shrink-0 ${log.points >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {log.points >= 0 ? `+${log.points}` : log.points}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Actions (Score adjusting / Evidence review) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* 1. If Group Leader: Score proposal fields */}
                {isGL && (
                  <div className="bg-slate-50 border border-slate-250 p-4.5 rounded-xl space-y-4 text-xs font-bold text-slate-650">
                    <span className="text-xs font-black text-indigo-700 uppercase block font-sans">Biểu mẫu đề xuất điểm Tổ</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Điểm Học tập (Max 20)</label>
                        <input
                          type="number"
                          defaultValue={resultObj.studyPoints}
                          id="gl-study-pt"
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                          min="0" max="20"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Ý thức nội quy (Max 25)</label>
                        <input
                          type="number"
                          defaultValue={resultObj.violationPoints}
                          id="gl-violation-pt"
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                          min="0" max="25"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Hoạt động Đoàn (Max 30)</label>
                        <input
                          type="number"
                          defaultValue={resultObj.extracurricularPoints}
                          id="gl-extracurricular-pt"
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                          min="0" max="30"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Cộng đồng (Max 15)</label>
                        <input
                          type="number"
                          defaultValue={resultObj.communityPoints}
                          id="gl-community-pt"
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                          min="0" max="15"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Chức vụ, Thưởng (Max 10)</label>
                      <input
                        type="number"
                        defaultValue={resultObj.achievementPoints}
                        id="gl-achievement-pt"
                        className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                        min="0" max="10"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Ý kiến / Nhận xét của Tổ trưởng</label>
                      <input
                        type="text"
                        placeholder="Nhập nhận xét (e.g. Đi học chuyên cần...)"
                        id="gl-comment"
                        className="w-full p-2 border rounded-lg bg-white text-xs font-bold"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const study = parseInt((document.getElementById("gl-study-pt") as HTMLInputElement).value) || 0;
                        const vio = parseInt((document.getElementById("gl-violation-pt") as HTMLInputElement).value) || 0;
                        const extra = parseInt((document.getElementById("gl-extracurricular-pt") as HTMLInputElement).value) || 0;
                        const comm = parseInt((document.getElementById("gl-community-pt") as HTMLInputElement).value) || 0;
                        const ach = parseInt((document.getElementById("gl-achievement-pt") as HTMLInputElement).value) || 0;
                        const commentVal = (document.getElementById("gl-comment") as HTMLInputElement).value;
                        const tot = study + vio + extra + comm + ach;

                        submitGroupLeaderScore(selectedDetailStudentId, {
                          studyPoints: study,
                          violationPoints: vio,
                          extracurricularPoints: extra,
                          communityPoints: comm,
                          achievementPoints: ach,
                          totalPoints: tot,
                          comment: commentVal,
                          approved: false
                        });

                        alert("Đã gửi đề xuất điểm rèn luyện Tổ thành công!");
                        setSelectedDetailStudentId(null);
                      }}
                      className="w-full py-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-sm transition-colors border-0"
                    >
                      Gửi Đề xuất Điểm Tổ
                    </button>
                  </div>
                )}

                {/* 2. If Class Monitor: Manual adjustment form */}
                {!isGL && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 text-xs font-bold text-slate-700 text-left">
                    <span className="text-xs font-black text-indigo-750 uppercase block font-sans">Cộng / Trừ điểm thủ công</span>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Mục tiêu chí điều chỉnh</label>
                      <select
                        value={adjustCategory}
                        onChange={(e) => setAdjustCategory(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded bg-white text-xs font-bold focus:outline-indigo-500 cursor-pointer"
                      >
                        <option value="TC1 - Ý thức học tập">TC1 - Ý thức học tập (Max 20)</option>
                        <option value="TC2 - Ý thức kỷ luật nề nếp">TC2 - Ý thức kỷ luật nề nếp (Max 25)</option>
                        <option value="TC3 - Hoạt động Đoàn hội CLB">TC3 - Hoạt động Đoàn hội CLB (Max 30)</option>
                        <option value="TC4 - Ý thức cộng đồng xã hội">TC4 - Ý thức cộng đồng xã hội (Max 15)</option>
                        <option value="TC5 - Chức danh khen thưởng đặc biệt">TC5 - Chức danh khen thưởng đặc biệt (Max 10)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Điểm số (+/-)</label>
                        <input
                          type="number"
                          value={adjustPoints}
                          onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold focus:outline-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Lý do điều chỉnh</label>
                        <input
                          type="text"
                          placeholder="Lý do điều chỉnh..."
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className="w-full p-2 border rounded-lg bg-white text-xs font-bold focus:outline-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!adjustReason.trim()) {
                          alert("Vui lòng điền lý do điều chỉnh điểm!");
                          return;
                        }
                        adjustStudentScoreSpecific(selectedDetailStudentId, adjustCategory, adjustPoints, adjustReason);
                        alert(`Đã điều chỉnh ${adjustPoints >= 0 ? `+${adjustPoints}` : adjustPoints}đ cho sinh viên!`);
                        setAdjustReason("");
                      }}
                      className="w-full py-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-lg text-xs cursor-pointer shadow-sm transition-colors border-0"
                    >
                      Cập nhật Điểm số
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence submissions sub-section */}
            {studentEvidences.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-150">
                <span className="text-xs font-black text-slate-800 uppercase block font-sans">
                  Danh sách minh chứng hoạt động đã nộp
                </span>

                <div className="space-y-3.5">
                  {studentEvidences.map(ev => (
                    <div key={ev.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4 text-xs">
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold rounded-lg text-[9.5px] font-mono">
                            {ev.criteriaId}
                          </span>
                          <span className="font-extrabold text-slate-805 text-sm">{ev.activityName}</span>
                          <span className="text-rose-600 font-bold font-mono">+{ev.pointsRequested}đ</span>
                        </div>
                        <p className="text-slate-500 font-semibold">{ev.description}</p>
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-bold">
                          <span>Nộp lúc: {ev.submittedAt}</span>
                          <span>| Trạng thái: 
                            <span className={`ml-1 uppercase font-black ${ev.status === "APPROVED" ? "text-emerald-600" : ev.status === "REJECTED" ? "text-rose-600" : "text-amber-500"}`}>
                              {ev.status === "APPROVED" ? "Đã duyệt" : ev.status === "REJECTED" ? "Từ chối" : "Đang chờ duyệt"}
                            </span>
                          </span>
                        </div>
                        <div className="pt-1">
                          <a 
                            href={ev.proofUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-indigo-600 hover:text-indigo-800 underline font-black inline-flex items-center gap-1"
                          >
                            <FileText size={12} />
                            Xem tập tin minh chứng gốc
                          </a>
                        </div>
                      </div>

                      {/* Evidence review triggers (Monitors only) */}
                      {!isGL && ev.status === "PENDING" && (
                        <div className="bg-white border rounded-xl p-3 space-y-2 md:w-56 shrink-0 text-left">
                          <label className="text-[9px] font-bold text-slate-400 uppercase block">Ý kiến phản hồi / Nhận xét</label>
                          <input
                            type="text"
                            placeholder="Ghi chú duyệt..."
                            value={reviewerComment}
                            onChange={(e) => setReviewerComment(e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded text-[11px] font-semibold"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                reviewEvidence(ev.id, "REJECTED", reviewerComment);
                                alert("Đã từ chối minh chứng của sinh viên.");
                                setReviewerComment("");
                              }}
                              className="flex-1 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-black rounded-lg text-[10.5px] cursor-pointer shadow-3xs transition-colors shrink-0 text-center"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => {
                                reviewEvidence(ev.id, "APPROVED", reviewerComment);
                                alert("Đã phê duyệt và cộng điểm cho sinh viên.");
                                setReviewerComment("");
                              }}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10.5px] cursor-pointer shadow-3xs transition-colors shrink-0 text-center border-0"
                            >
                              Duyệt cộng
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-5 py-3 border-t border-slate-150 flex justify-end gap-2.5 shrink-0">
            <button
              onClick={() => {
                setSelectedDetailStudentId(null);
                setReviewerComment("");
              }}
              className="px-4.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer border-0"
            >
              Hoàn tất xét duyệt
            </button>
          </div>

        </div>
      </div>
    );
  };

  // Render routing tab selection
  const renderTabContent = () => {
    switch (activePortletTab) {
      case "TRANG_CHU":
        return renderOverviewDashboard();
      case "BCS_DIEMDANH":
        return (
          <div className="space-y-6">
            {renderAttendanceTab()}
            {!currentUser?.isGroupLeader && (
              <ClassStatisticsBottom />
            )}
          </div>
        );
      case "BCS_DUYET_TO":
        return renderApproveGroupsTab();
      case "BCS_CHIA_TO":
        return renderChiaTo();
      case "BCS_XETDUYET":
        return renderEvaluateTab();
      case "BCS_THONG_KE":
        return <ClassStatisticsBottom />;
      default:
        return renderOverviewDashboard();
    }
  };

  const banner = getBannerMeta();

  return (
    <div className="space-y-6" id="class-portal-container font-sans">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 uppercase tracking-wider">
            {currentUser?.isGroupLeader ? `CỔNG TỔ TRƯỞNG - ${groupName}` : "CỔNG BAN CÁN SỰ LỚP & ĐOÀN CHI BỘ"}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            {banner.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            {banner.desc}
          </p>
        </div>
      </div>

      {/* Main Tab Render */}
      {renderTabContent()}

      {/* Detailed Modal inspect */}
      {renderDetailStudentModal()}

    </div>
  );
};
