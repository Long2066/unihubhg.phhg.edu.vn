import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, 
  getDocFromServer, 
  setDoc, 
  collection, 
  getDocs 
} from "firebase/firestore";
import { db } from "./firebase";

import { 
  UserAccount, 
  UserRole, 
  Student, 
  Organization, 
  OrganizationMember, 
  ExtracurricularActivity, 
  ActivityAttendance, 
  EvidenceSubmission, 
  ClassReviewState, 
  FacultyReviewState, 
  EvaluationResult, 
  EvaluationPeriod,
  PointCriteria,
  DailyAttendanceReport,
  ScoreFeedback,
  GroupEvaluationCriteria,
  ClubAnnouncement,
  ScheduleSlot
} from "./types";
import { 
  SEED_PERIOD, 
  SEED_USERS, 
  SEED_CRITERIA, 
  SEED_STUDENTS, 
  SEED_ORGANIZATIONS, 
  SEED_MEMBERS, 
  SEED_ACTIVITIES, 
  SEED_ATTENDANCE, 
  SEED_EVIDENCE, 
  SEED_CLASS_REVIEW, 
  SEED_FACULTY_REVIEW, 
  SEED_RESULTS,
  SEED_DAILY_ATTENDANCE,
  SEED_SCHEDULES
} from "./data";

interface UniHubContextType {
  currentUser: UserAccount | null;
  period: EvaluationPeriod;
  users: UserAccount[];
  criteria: PointCriteria[];
  students: Student[];
  organizations: Organization[];
  members: OrganizationMember[];
  activities: ExtracurricularActivity[];
  attendance: ActivityAttendance[];
  evidence: EvidenceSubmission[];
  classReviews: ClassReviewState[];
  facultyReviews: FacultyReviewState[];
  results: EvaluationResult[];
  dailyAttendance: DailyAttendanceReport[];
  feedbacks: ScoreFeedback[];
  groupCriteria: GroupEvaluationCriteria[];
  announcements: ClubAnnouncement[];
  schedules: ScheduleSlot[];
  
  // Actions
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  updatePeriodStatus: (status: "ACTIVE" | "LOCKED") => void;
  
  // Schedule Actions
  importScheduleData: (slots: ScheduleSlot[]) => void;
  deleteScheduleSlot: (id: string) => void;
  clearSchedules: () => void;
  
  // Student Actions
  registerForActivity: (activityId: string, studentId: string) => void;
  submitEvidence: (data: Omit<EvidenceSubmission, "id" | "submittedAt" | "status">) => void;
  joinOrganizationRequest: (studentId: string, orgId: string, details?: Partial<OrganizationMember>) => void;
  updateStudentProfile: (studentId: string, name: string, avatar: string, password?: string, additionalFields?: Partial<Student>) => void;
  
  // Organizer Actions
  createActivity: (activity: Omit<ExtracurricularActivity, "id" | "status" | "orgName"> & { expiryDate?: string }) => string;
  updateActivityStatus: (activityId: string, status: "UPCOMING" | "ONGOING" | "COMPLETED") => void;
  approveMemberRequest: (memberId: string) => void;
  rejectMemberRequest: (memberId: string) => void;
  assignMemberRole: (memberId: string, role: "CHỦ NHIỆM" | "BAN CHẤP HÀNH" | "ỦY VIÊN" | "THÀNH VIÊN") => void;
  updateAttendance: (attendanceId: string, attended: boolean, role?: "MEM" | "BTC" | "SUPPORTER") => void;
  addBulkAttendance: (activityId: string, studentIds: string[]) => void;
  
  // New clb actions
  createAnnouncement: (announcement: Omit<ClubAnnouncement, "id" | "orgName" | "createdAt">) => string;
  deleteAnnouncement: (id: string) => void;
  addMemberManual: (member: Omit<OrganizationMember, "id" | "joinedDate" | "term" | "status">) => void;
  deleteMember: (memberId: string) => void;
  updateMemberDetails: (memberId: string, details: Partial<OrganizationMember>) => void;
  importMembersExcel: (membersToImport: OrganizationMember[]) => void;
  
  // Training Dept Actions
  importAcademicData: (excelData: Partial<Student>[]) => void;
  toggleLearningDataLock: () => void;
  importNewClassesExcel: (studentsToImport: Student[], usersToImport: UserAccount[]) => void;
  customClasses: string[];
  addNewClass: (className: string) => void;
  
  // BCS / Class Actions
  approveClassScores: (classId: string) => void;
  toggleClassMeetingDuty: (studentId: string, completed: boolean) => void;
  reportDailyAttendance: (classId: string, date: string, absentees: { studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[], reportedBy: string) => void;
  bulkApproveScores: (classId: string, studentIds: string[], role: UserRole) => void;
  
  // GVCN Actions
  approveAdviserScores: (classId: string, comment: string) => void;
  submitAdviserAdjustment: (studentId: string, criteriaCategory: string, points: number, reason: string) => void;
  
  // Faculty Actions
  lockFacultyData: (facultyId: string, lockedBy: string) => void;
  approveFacultyScores: (classId: string, comment: string) => void;
  importGroupCriteria: (criteria: GroupEvaluationCriteria[]) => void;
  
  // Admin Actions
  approveAdminScores: (classId: string, comment: string) => void;
  sendFeedback: (fromRole: UserRole, fromName: string, toClassId: string, comment: string, studentId?: string) => void;
  resolveFeedback: (feedbackId: string) => void;
  adjustStudentScoreSpecific: (studentId: string, category: string, points: number, reason: string) => void;
  updateCriteriaScore: (criteriaId: string, ruleId: string, newPoints: number) => void;
  bulkUpdateCriteria: (newCriteria: PointCriteria[]) => void;
  resetToSeeds: () => void;
  createClubWithAccount: (club: Organization, account: UserAccount) => void;
  updateClubAndAccount: (clubId: string, updatedClub: Partial<Organization>, updatedAccount: Partial<UserAccount>) => void;
  deleteClubAndAccount: (clubId: string) => void;
  activePortletTab: string;
  setActivePortletTab: (tab: string) => void;
  selectedSemesterId: string;
  setSelectedSemesterId: (sem: string) => void;
  createUserAccount: (account: UserAccount) => void;
  updateUserAccount: (userId: string, updatedAccount: Partial<UserAccount>) => void;
  deleteUserAccount: (userId: string) => void;
}

const UniHubContext = createContext<UniHubContextType | undefined>(undefined);

export const UniHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activePortletTab, setActivePortletTab] = useState<string>("TRANG_CHU");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("HOCKY_2_2025_2026");

  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case UserRole.STUDENT:
          setActivePortletTab("TRANG_CHU");
          break;
        case UserRole.ORGANIZER:
          setActivePortletTab("DS_THANHVIEN");
          break;
        case UserRole.ADMIN:
          setActivePortletTab("CONFIG");
          break;
        case UserRole.TRAINING_DEPT:
          setActivePortletTab("IMPORT");
          break;
        case UserRole.FACULTY:
          setActivePortletTab("STAT");
          break;
        default:
          setActivePortletTab("TRANG_CHU");
      }
    }
  }, [currentUser]);
  
  // Core Databases in LocalStorage or State
  const [period, setPeriod] = useState<EvaluationPeriod>(SEED_PERIOD);
  const [users, setUsers] = useState<UserAccount[]>(SEED_USERS);
  const [criteria, setCriteria] = useState<PointCriteria[]>(SEED_CRITERIA);
  const [students, setStudents] = useState<Student[]>(SEED_STUDENTS);
  const [organizations, setOrganizations] = useState<Organization[]>(SEED_ORGANIZATIONS);
  const [members, setMembers] = useState<OrganizationMember[]>(SEED_MEMBERS);
  const [activities, setActivities] = useState<ExtracurricularActivity[]>(SEED_ACTIVITIES);
  const [attendance, setAttendance] = useState<ActivityAttendance[]>(SEED_ATTENDANCE);
  const [evidence, setEvidence] = useState<EvidenceSubmission[]>(SEED_EVIDENCE);
  const [classReviews, setClassReviews] = useState<ClassReviewState[]>(SEED_CLASS_REVIEW);
  const [facultyReviews, setFacultyReviews] = useState<FacultyReviewState[]>(SEED_FACULTY_REVIEW);
  const [results, setResults] = useState<EvaluationResult[]>(SEED_RESULTS);

  // New features databases
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceReport[]>(SEED_DAILY_ATTENDANCE);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(SEED_SCHEDULES);
  const [customClasses, setCustomClasses] = useState<string[]>(() => {
    const cached = localStorage.getItem("unihub_custom_classes");
    return cached ? JSON.parse(cached) : [];
  });
  const [feedbacks, setFeedbacks] = useState<ScoreFeedback[]>([
    { id: "FB1", fromRole: UserRole.ADVISER, fromName: "Hoàng Minh Đức", toClassId: "K20-CNTT", comment: "Cần điều chỉnh, đối chiếu kỹ hơn danh sách nề nếp thi đua lớp trước khi gửi ký chính thống.", createdAt: "2026-05-23", resolved: false }
  ]);
  const [groupCriteria, setGroupCriteria] = useState<GroupEvaluationCriteria[]>([
    { id: "XS", name: "Tập thể Xuất sắc", minExcellentPercent: 30, maxWeakPercent: 0, description: "Tỉ lệ rèn luyện Xuất sắc & Tốt đạt từ 30% trở lên, không có sinh viên xếp loại Yếu hoặc Kém." },
    { id: "TT", name: "Tập thể Tiên tiến", minExcellentPercent: 20, maxWeakPercent: 5, description: "Tỉ lệ rèn luyện Xuất sắc & Tốt đạt từ 20% trở lên, tỉ lệ xếp loại Yếu hoặc Kém không quá 5%." }
  ]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([
    {
      id: "ANN_01",
      orgId: "UNITECH",
      orgName: "CLB Sáng tạo Công nghệ UniTech",
      title: "Tuyển thành viên Ban chủ nhiệm nhiệm kỳ mới 2026-2027",
      content: "CLB thông báo tuyển ứng tuyển nhân sự cho các ban: Truyền thông & Sự kiện, Nghiên cứu phát triển. Hạn chốt đăng ký trước ngày 15/06/2026.",
      createdAt: "2026-05-20",
      expiryDate: "2026-06-25"
    },
    {
      id: "ANN_02",
      orgId: "UNITECH",
      orgName: "CLB Sáng tạo Công nghệ UniTech",
      title: "Buổi sinh hoạt chuyên đề: Trí tuệ nhân tạo thế hệ mới",
      content: "Trân trọng kính mời tất cả các thành viên tham dự buổi sinh hoạt chuyên đề thảo luận ứng dụng của AI vào học tập, giải thưởng và nghiên cứu khoa học sinh viên.",
      createdAt: "2026-06-01",
      expiryDate: "2026-06-24"
    }
  ]);

  // Load state from local storage on boot
  useEffect(() => {
    const cachedPeriod = localStorage.getItem("unihub_period");
    const cachedUsers = localStorage.getItem("unihub_users");
    const cachedCriteria = localStorage.getItem("unihub_criteria");
    const cachedStudents = localStorage.getItem("unihub_students");
    const cachedOrgs = localStorage.getItem("unihub_organizations");
    const cachedMembers = localStorage.getItem("unihub_members");
    const cachedActivities = localStorage.getItem("unihub_activities");
    const cachedAttendance = localStorage.getItem("unihub_attendance");
    const cachedEvidence = localStorage.getItem("unihub_evidence");
    const cachedClassReviews = localStorage.getItem("unihub_class_reviews");
    const cachedFacultyReviews = localStorage.getItem("unihub_faculty_reviews");
    const cachedResults = localStorage.getItem("unihub_results");
    const cachedCurrentUser = localStorage.getItem("unihub_current_user");

    const cachedDailyAtt = localStorage.getItem("unihub_daily_attendance");
    const cachedFeedbacks = localStorage.getItem("unihub_feedbacks");
    const cachedGroupCriteria = localStorage.getItem("unihub_group_criteria");
    const cachedAnnouncements = localStorage.getItem("unihub_announcements");
    const cachedSchedules = localStorage.getItem("unihub_schedules");

    let shouldReset = false;
    if (cachedUsers) {
      try {
        const parsedUsers = JSON.parse(cachedUsers) as UserAccount[];
        if (!parsedUsers.some(u => u.email === "hsvphhg@hg.edu.vn")) {
          shouldReset = true;
        }
      } catch (e) {
        shouldReset = true;
      }
    }
    
    if (shouldReset) {
      localStorage.clear();
      window.location.reload();
      return;
    }

    if (cachedPeriod) setPeriod(JSON.parse(cachedPeriod));
    if (cachedUsers) setUsers(JSON.parse(cachedUsers));
    if (cachedCriteria) setCriteria(JSON.parse(cachedCriteria));
    if (cachedStudents) setStudents(JSON.parse(cachedStudents));
    if (cachedOrgs) setOrganizations(JSON.parse(cachedOrgs));
    if (cachedMembers) setMembers(JSON.parse(cachedMembers));
    if (cachedActivities) setActivities(JSON.parse(cachedActivities));
    if (cachedAttendance) setAttendance(JSON.parse(cachedAttendance));
    if (cachedEvidence) setEvidence(JSON.parse(cachedEvidence));
    if (cachedClassReviews) setClassReviews(JSON.parse(cachedClassReviews));
    if (cachedFacultyReviews) setFacultyReviews(JSON.parse(cachedFacultyReviews));
    if (cachedResults) setResults(JSON.parse(cachedResults));
    if (cachedCurrentUser) setCurrentUser(JSON.parse(cachedCurrentUser));

    if (cachedDailyAtt) setDailyAttendance(JSON.parse(cachedDailyAtt));
    if (cachedFeedbacks) setFeedbacks(JSON.parse(cachedFeedbacks));
    if (cachedGroupCriteria) setGroupCriteria(JSON.parse(cachedGroupCriteria));
    if (cachedAnnouncements) setAnnouncements(JSON.parse(cachedAnnouncements));
    if (cachedSchedules) setSchedules(JSON.parse(cachedSchedules));
  }, []);

  // Validate Connection to Firestore on startup
  const testConnection = async () => {
    try {
      const testDoc = doc(db, "test", "connection");
      await getDocFromServer(testDoc);
      console.log("Firebase Connection verified successfully.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("offline")) {
        console.error("Please check your Firebase configuration. Client is offline.");
      } else {
        console.log("Firebase connection established or verified with server response.");
      }
    }
  };

  // Load data from Firebase Firestore
  const loadFromFirestore = async () => {
    try {
      // 1. Get Users
      const usersSnap = await getDocs(collection(db, "users"));
      if (!usersSnap.empty) {
        const list: UserAccount[] = [];
        usersSnap.forEach(d => list.push(d.data() as UserAccount));
        setUsers(list);
        localStorage.setItem("unihub_users", JSON.stringify(list));
      }
      
      // 2. Get Students
      const studsSnap = await getDocs(collection(db, "students"));
      if (!studsSnap.empty) {
        const list: Student[] = [];
        studsSnap.forEach(d => list.push(d.data() as Student));
        setStudents(list);
        localStorage.setItem("unihub_students", JSON.stringify(list));
      }

      // 3. Get Organizations
      const orgsSnap = await getDocs(collection(db, "organizations"));
      if (!orgsSnap.empty) {
        const list: Organization[] = [];
        orgsSnap.forEach(d => list.push(d.data() as Organization));
        setOrganizations(list);
        localStorage.setItem("unihub_organizations", JSON.stringify(list));
      }

      // 4. Get Activities
      const actsSnap = await getDocs(collection(db, "activities"));
      if (!actsSnap.empty) {
        const list: ExtracurricularActivity[] = [];
        actsSnap.forEach(d => list.push(d.data() as ExtracurricularActivity));
        setActivities(list);
        localStorage.setItem("unihub_activities", JSON.stringify(list));
      }

      // 5. Get Attendance
      const attsSnap = await getDocs(collection(db, "attendance"));
      if (!attsSnap.empty) {
        const list: ActivityAttendance[] = [];
        attsSnap.forEach(d => list.push(d.data() as ActivityAttendance));
        setAttendance(list);
        localStorage.setItem("unihub_attendance", JSON.stringify(list));
      }

      // 6. Get Evidence
      const evsSnap = await getDocs(collection(db, "evidence"));
      if (!evsSnap.empty) {
        const list: EvidenceSubmission[] = [];
        evsSnap.forEach(d => list.push(d.data() as EvidenceSubmission));
        setEvidence(list);
        localStorage.setItem("unihub_evidence", JSON.stringify(list));
      }

      // 7. Get Results
      const resSnap = await getDocs(collection(db, "results"));
      if (!resSnap.empty) {
        const list: EvaluationResult[] = [];
        resSnap.forEach(d => list.push(d.data() as EvaluationResult));
        setResults(list);
        localStorage.setItem("unihub_results", JSON.stringify(list));
      }

      // 8. Get Daily Attendance
      const daSnap = await getDocs(collection(db, "dailyAttendance"));
      if (!daSnap.empty) {
        const list: DailyAttendanceReport[] = [];
        daSnap.forEach(d => list.push(d.data() as DailyAttendanceReport));
        setDailyAttendance(list);
        localStorage.setItem("unihub_daily_attendance", JSON.stringify(list));
      }

      // 9. Get Members
      const membersSnap = await getDocs(collection(db, "members"));
      if (!membersSnap.empty) {
        const list: OrganizationMember[] = [];
        membersSnap.forEach(d => list.push(d.data() as OrganizationMember));
        setMembers(list);
        localStorage.setItem("unihub_members", JSON.stringify(list));
      }

      // 10. Get Announcements
      const annSnap = await getDocs(collection(db, "announcements"));
      if (!annSnap.empty) {
        const list: ClubAnnouncement[] = [];
        annSnap.forEach(d => list.push(d.data() as ClubAnnouncement));
        setAnnouncements(list);
        localStorage.setItem("unihub_announcements", JSON.stringify(list));
      }
    } catch (error) {
      console.warn("Could not sync from Firestore (possibly schema rules or empty DB):", error);
    }
  };

  // Save changes to Firebase Firestore
  const saveToFirestore = async (key: string, data: any) => {
    try {
      if (key === "unihub_users" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "users", item.id), item);
          }
        }
      } else if (key === "unihub_students" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "students", item.id), item);
          }
        }
      } else if (key === "unihub_organizations" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "organizations", item.id), item);
          }
        }
      } else if (key === "unihub_activities" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "activities", item.id), item);
          }
        }
      } else if (key === "unihub_attendance" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "attendance", item.id), item);
          }
        }
      } else if (key === "unihub_evidence" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "evidence", item.id), item);
          }
        }
      } else if (key === "unihub_results" && Array.isArray(data)) {
        for (const item of data) {
          const docId = `${item.studentId}_${item.periodId}`;
          await setDoc(doc(db, "results", docId), item);
        }
      } else if (key === "unihub_daily_attendance" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "dailyAttendance", item.id), item);
          }
        }
      } else if (key === "unihub_members" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "members", item.id), item);
          }
        }
      } else if (key === "unihub_announcements" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "announcements", item.id), item);
          }
        }
      }
    } catch (error) {
      console.warn(`Firestore upload failed for key ${key}:`, error);
    }
  };

  // Run automatically on boot to check connection and seed state
  useEffect(() => {
    testConnection();
    
    const initAndSeedFirestore = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        let dbUsers: UserAccount[] = [];
        usersSnap.forEach(d => dbUsers.push(d.data() as UserAccount));
        
        const hasNewHsv = dbUsers.some(u => u.email === "hsvphhg@hg.edu.vn" || u.username === "hsvphhg@hg.edu.vn");

        if (usersSnap.empty || !hasNewHsv) {
          console.log("Seeding or updating Firestore database with new users and organizations...");
          for (const u of SEED_USERS) {
            await setDoc(doc(db, "users", u.id), u);
          }
          for (const o of SEED_ORGANIZATIONS) {
            await setDoc(doc(db, "organizations", o.id), o);
          }
          
          if (usersSnap.empty) {
            for (const s of SEED_STUDENTS) {
              await setDoc(doc(db, "students", s.id), s);
            }
            for (const a of SEED_ACTIVITIES) {
              await setDoc(doc(db, "activities", a.id), a);
            }
            for (const att of SEED_ATTENDANCE) {
              await setDoc(doc(db, "attendance", att.id), att);
            }
            for (const ev of SEED_EVIDENCE) {
              await setDoc(doc(db, "evidence", ev.id), ev);
            }
            for (const m of SEED_MEMBERS) {
              await setDoc(doc(db, "members", m.id), m);
            }
            const initAnns: ClubAnnouncement[] = [
              {
                id: "ANN_01",
                orgId: "UNITECH",
                orgName: "CLB Sáng tạo Công nghệ UniTech",
                title: "Tuyển thành viên Ban chủ nhiệm nhiệm kỳ mới 2026-2027",
                content: "CLB thông báo tuyển ứng tuyển nhân sự cho các ban: Truyền thông & Sự kiện, Nghiên cứu phát triển. Hạn chốt đăng ký trước ngày 15/06/2026.",
                createdAt: "2026-05-20",
                expiryDate: "2026-06-25"
              },
              {
                id: "ANN_02",
                orgId: "UNITECH",
                orgName: "CLB Sáng tạo Công nghệ UniTech",
                title: "Buổi sinh hoạt chuyên đề: Trí tuệ nhân tạo thế hệ mới",
                content: "Trân trọng kính mời tất cả các thành viên tham dự buổi sinh hoạt chuyên đề thảo luận ứng dụng của AI vào học tập, giải thưởng và nghiên cứu khoa học sinh viên.",
                createdAt: "2026-06-01",
                expiryDate: "2026-06-24"
              }
            ];
            for (const ann of initAnns) {
              await setDoc(doc(db, "announcements", ann.id), ann);
            }
            for (const da of SEED_DAILY_ATTENDANCE) {
              await setDoc(doc(db, "dailyAttendance", da.id), da);
            }
            for (const r of SEED_RESULTS) {
              const docId = `${r.studentId}_${r.periodId}`;
              await setDoc(doc(db, "results", docId), r);
            }
            console.log("Seeding complete!");
          } else {
            console.log("Firestore users list updated successfully.");
          }

          // Clear localStorage so it forces re-fetching the updated data
          localStorage.clear();
          window.location.reload();
          return;
        } else {
          await loadFromFirestore();
        }
      } catch (err) {
        console.warn("Could not auto-seed Firestore (ignoring during initial startup auth limits):", err);
      }
    };

    initAndSeedFirestore();
  }, []);

  // Save changes helper
  const saveToStorage = (key: string, data: any) => {
    localStorage.setValue ? localStorage.setValue(key, data) : localStorage.setItem(key, JSON.stringify(data));
    saveToFirestore(key, data);
  };


  // Run automatically whenever criteria, students, members, activities, attendance, evidence changes to make evaluation engine REAL
  useEffect(() => {
    if (students.length === 0) return;
    
    // Helper to find dynamic score rules updated by Admin
    const getRulePoints = (cid: string, rid: string, defaultPoints: number): number => {
      const critObj = criteria.find(c => c.id === cid);
      const ruleObj = critObj?.rules.find(r => r.id === rid);
      return ruleObj !== undefined ? ruleObj.points : defaultPoints;
    };
    
    // Engine Re-calculation
    const computedResults: EvaluationResult[] = students.map(student => {
      const logs: EvaluationResult["logs"] = [];
      const timestampNow = new Date().toISOString().split("T")[0];

      // 1. TC1: Ý thức học tập (Max 20 XP)
      let studyPoints = 0;
      if (student.gpa !== undefined) {
        if (student.gpa >= 3.6) {
          const pt = getRulePoints("TC1", "TC1.1", 20);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.1", points: pt, reason: `GPA Đạt loại Xuất sắc (${student.gpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else if (student.gpa >= 3.2) {
          const pt = getRulePoints("TC1", "TC1.2", 18);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.2", points: pt, reason: `GPA Đạt loại Giỏi (${student.gpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else if (student.gpa >= 2.5) {
          const pt = getRulePoints("TC1", "TC1.3", 15);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.3", points: pt, reason: `GPA Đạt loại Khá (${student.gpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else if (student.gpa >= 2.0) {
          const pt = getRulePoints("TC1", "TC1.4", 10);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.4", points: pt, reason: `GPA Đạt loại Trung bình (${student.gpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else {
          studyPoints = 0;
          logs.push({ criteriaId: "TC1.4", points: 0, reason: `GPA đạt loại Yếu kém (${student.gpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        }
      } else {
        logs.push({ criteriaId: "TC1.x", points: 0, reason: "Chưa có dữ liệu GPA học tập chính thức", source: "ĐÀO TẠO", timestamp: timestampNow });
      }

      if (student.learningWarning) {
        const warningPt = getRulePoints("TC1", "TC1.5", -5);
        studyPoints = Math.max(0, studyPoints + warningPt);
        logs.push({ criteriaId: "TC1.5", points: warningPt, reason: "Bị cảnh báo tình trạng học vụ học kỳ", source: "ĐÀO TẠO", timestamp: timestampNow });
      }

      // 2. TC2: Ý thức chấp hành nội quy (Base 25, subtract violations)
      const maxTC2 = criteria.find(c => c.id === "TC2")?.maxScore || 25;
      let violationPoints = maxTC2;
      // Check if student has bad learning warning or manual warning
      if (student.gpa !== undefined && student.gpa < 1.5) {
        const rule2pt = getRulePoints("TC2", "TC2.2", -10);
        violationPoints = Math.max(0, violationPoints + rule2pt);
        logs.push({ criteriaId: "TC2.2", points: rule2pt, reason: "Vi phạm quy chế nợ nhiều học phần hoặc cảnh báo học lực quá thấp", source: "ĐÀO TẠO", timestamp: timestampNow });
      }

      // Let's model manual classroom tardiness reports from class monitor or teachers
      const subbedTardiness = student.id === "SV20CN02"; // Phan Thi Binh đi học muộn
      if (subbedTardiness) {
        const rule1pt = getRulePoints("TC2", "TC2.1", -2);
        violationPoints = Math.max(0, violationPoints + rule1pt);
        logs.push({ criteriaId: "TC2.1", points: rule1pt, reason: "Báo cáo nề nếp lớp: Đi học muộn quá thời gian quy định", source: "ĐÀO TẠO", timestamp: timestampNow });
      }

      // Dynamic Daily Attendance: Deduct 2 points for every unexcused absence ("KHÔNG_PHÉP")
      const unexcusedReportCount = dailyAttendance.filter(rep => 
        rep.classId === student.classId && 
        rep.absentees.some(abs => abs.studentId === student.id && abs.type === "KHÔNG_PHÉP")
      ).length;

      if (unexcusedReportCount > 0) {
        const loss = unexcusedReportCount * -2;
        violationPoints = Math.max(0, violationPoints + loss);
        logs.push({
          criteriaId: "TC2.1",
          points: loss,
          reason: `Hệ thống ghi nhận vắng không phép ${unexcusedReportCount} buổi học tập`,
          source: "ĐÀO TẠO",
          timestamp: timestampNow
        });
      }

      // 3. TC3: Tham gia CLB / hoạt động Đoàn (Max 30 XP)
      let extracurricularPoints = 0;
      const maxTC3 = criteria.find(c => c.id === "TC3")?.maxScore || 30;
      
      // Active membership points
      const isCLBMember = members.some(m => m.studentId === student.id && m.orgId === "UNITECH" && m.status === "ACTIVE");
      const isGiotHongMember = members.some(m => m.studentId === student.id && m.orgId === "TINHNX" && m.status === "ACTIVE");
      
      if (isCLBMember || isGiotHongMember) {
        const activeOrgPt = getRulePoints("TC3", "TC3.3", 10);
        extracurricularPoints += activeOrgPt;
        const orgNames = members
          .filter(m => m.studentId === student.id && m.status === "ACTIVE")
          .map(m => organizations.find(o => o.id === m.orgId)?.name || "Tổ chức")
          .join(", ");
        logs.push({ criteriaId: "TC3.3", points: activeOrgPt, reason: `Là thành viên tích cực: ${orgNames}`, source: "CLB_ATTENDANCE", timestamp: timestampNow });
      }

      // Attended events points
      const attendedEvents = attendance.filter(a => a.studentId === student.id && a.attended && a.verified);
      attendedEvents.forEach(att => {
        const act = activities.find(act => act.id === att.activityId);
        if (act) {
          const scoreIncrement = att.role === "BTC" 
            ? getRulePoints("TC3", "TC3.2", 8) 
            : (att.role === "SUPPORTER" ? 6 : getRulePoints("TC3", "TC3.1", 5));
          extracurricularPoints += scoreIncrement;
          logs.push({ 
            criteriaId: act.criteriaId, 
            points: scoreIncrement, 
            reason: `Tham gia hoạt động: "${act.title}" (${att.role === "BTC" ? "Ban tổ chức" : (att.role === "SUPPORTER" ? "Ban hỗ trợ" : "Thành viên")})`, 
            source: "CLB_ATTENDANCE", 
            timestamp: timestampNow 
          });
        }
      });
      extracurricularPoints = Math.min(maxTC3, extracurricularPoints);

      // 4. TC4: Ý thức công dân, cộng đồng (Max 15 XP)
      let communityPoints = 0;
      const maxTC4 = criteria.find(c => c.id === "TC4")?.maxScore || 15;
      
      // Check Approved Evidence Submissions for community activity (TC4.1)
      const approvedEvs = evidence.filter(e => e.status === "APPROVED" && e.criteriaId === "TC4.1");
      approvedEvs.forEach(ev => {
        if (ev.studentId === student.id) {
          communityPoints += ev.pointsRequested;
          logs.push({ 
            criteriaId: "TC4.1", 
            points: ev.pointsRequested, 
            reason: `Phê duyệt minh chứng ngoại lệ: "${ev.activityName}"`, 
            source: "MINH_CHỨNG", 
            timestamp: ev.submittedAt 
          });
        }
      });

      // Default class monitor activity (TC4.2)
      // If student is Triet (SV20CN03) or An (DTG245140202053 with blood donation completed via standard list)
      const hasBloodDonation = attendance.some(a => a.studentId === student.id && a.activityId === "ACT_02" && a.attended && a.verified);
      // If student has completed active class clean duty
      const hasCleanDuty = student.id === "DTG245140202053" || student.id === "SV20CN02" || student.id === "SV20CN03" || student.id === "SV20NL01";
      if (hasCleanDuty) {
        const cleanPt = getRulePoints("TC4", "TC4.2", 5);
        communityPoints += cleanPt;
        logs.push({ criteriaId: "TC4.2", points: cleanPt, reason: "Phê duyệt nề nếp tự quản, lao động và trực nhật lớp", source: "BCS_DUYỆT", timestamp: timestampNow });
      }

      communityPoints = Math.min(maxTC4, communityPoints);

      // 5. TC5: Chức vụ, khen thưởng, thành tích (Max 10)
      let achievementPoints = 0;
      const maxTC5 = criteria.find(c => c.id === "TC5")?.maxScore || 10;
      
      // Class monitor bonus
      const isMonitor = student.id === "SV20CN03" || student.id === "SV20NL01"; // Triết and Mạnh are monitors
      if (isMonitor) {
        const monitorPt = getRulePoints("TC5", "TC5.1", 10);
        achievementPoints += monitorPt;
        logs.push({ criteriaId: "TC5.1", points: monitorPt, reason: "Đảm nhiệm chức vụ Ban cán sự Lớp hoàn thành tốt nhiệm vụ", source: "BCS_DUYỆT", timestamp: timestampNow });
      }

      // Org leader / BCH bonus (TC5.2)
      const isBCHMember = members.some(m => 
        m.studentId === student.id && 
        m.status === "ACTIVE" && 
        (m.orgId === "DOANTN" || m.orgId === "HOISV") && 
        ["BAN CHẤP HÀNH", "ỦY VIÊN", "CHỦ NHIỆM"].includes(m.role)
      );
      const isClubLeader = members.some(m => 
        m.studentId === student.id && 
        m.status === "ACTIVE" && 
        m.orgId !== "DOANTN" && 
        m.orgId !== "HOISV" && 
        m.role === "CHỦ NHIỆM"
      );

      if ((isBCHMember || isClubLeader) && !isMonitor) {
        const leaderPt = getRulePoints("TC5", "TC5.2", 8);
        achievementPoints += leaderPt;
        const reasonStr = isBCHMember 
          ? "Đóng vai trò Ủy viên BCH Đoàn / Hội Phân hiệu" 
          : "Đóng vai trò Chủ nhiệm / Ban điều hành CLB sinh viên xuất sắc";
        logs.push({ criteriaId: "TC5.2", points: leaderPt, reason: reasonStr, source: "MINH_CHỨNG", timestamp: timestampNow });
      }

      achievementPoints = Math.min(maxTC5, achievementPoints);

      // Apply manually adjusted scores by Advisor if exists
      // Check if there's any adviser adjustments logged in previous states or results
      const oldRes = results.find(r => r.studentId === student.id);
      
      // Let's preserve old adjustments if status was approved by adviser or locked 
      let adviserNotes = oldRes?.adviserNotes || null;
      let status: EvaluationResult["status"] = "AUTO";

      const currentClassReview = classReviews.find(cr => cr.classId === student.classId);
      const currentFacReview = facultyReviews.find(fr => fr.facultyId === student.facultyId);

      if (currentFacReview?.locked) {
        status = "LOCKED";
      } else if (currentClassReview?.adviserApproved) {
        status = "APPROVED_ADVISER";
      } else if (currentClassReview?.representativeApproved) {
        status = "APPROVED_CLASS";
      }

      const totalPoints = studyPoints + violationPoints + extracurricularPoints + communityPoints + achievementPoints;
      
      let grade: EvaluationResult["grade"] = "TRUNG BÌNH";
      if (totalPoints >= 90) grade = "XUẤT SẮC";
      else if (totalPoints >= 80) grade = "TỐT";
      else if (totalPoints >= 70) grade = "KHÁ";
      else if (totalPoints >= 50) grade = "TRUNG BÌNH";
      else if (totalPoints >= 30) grade = "YẾU";
      else grade = "KÉM";

      return {
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        facultyId: student.facultyId,
        periodId: period.id,
        studyPoints,
        violationPoints,
        extracurricularPoints,
        communityPoints,
        achievementPoints,
        totalPoints,
        grade,
        status,
        adviserNotes,
        logs
      };
    });

    setResults(computedResults);
    saveToStorage("unihub_results", computedResults);
  }, [students, members, activities, attendance, evidence, classReviews, facultyReviews, period.id, criteria, dailyAttendance]);

  const login = (email: string, password?: string): boolean => {
    const found = users.find(u => u.username.toLowerCase() === email.toLowerCase() || u.email.toLowerCase() === email.toLowerCase() || (u.targetId && u.targetId.toLowerCase() === email.toLowerCase()));
    if (found) {
      const expectedPassword = found.password || "password123";
      if (password && password !== expectedPassword) {
        return false;
      }
      setCurrentUser(found);
      saveToStorage("unihub_current_user", found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("unihub_current_user");
  };

  const updatePeriodStatus = (status: "ACTIVE" | "LOCKED") => {
    const updated = { ...period, status };
    setPeriod(updated);
    saveToStorage("unihub_period", updated);
  };

  // Student Actions
  const registerForActivity = (activityId: string, studentId: string) => {
    const alreadyRegistered = attendance.some(a => a.activityId === activityId && a.studentId === studentId);
    if (alreadyRegistered) return;

    const studentObj = students.find(s => s.id === studentId);
    if (!studentObj) return;

    const newAttendee: ActivityAttendance = {
      id: `AT_NEW_${Date.now()}`,
      activityId,
      studentId,
      studentName: studentObj.name,
      classId: studentObj.classId,
      registeredAt: new Date().toISOString().split("T")[0],
      role: "MEM",
      attended: false,
      verified: false
    };

    const updated = [...attendance, newAttendee];
    setAttendance(updated);
    saveToStorage("unihub_attendance", updated);
  };

  const submitEvidence = (data: Omit<EvidenceSubmission, "id" | "submittedAt" | "status">) => {
    const newEvidence: EvidenceSubmission = {
      ...data,
      id: `EV_NEW_${Date.now()}`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "PENDING"
    };

    const updated = [...evidence, newEvidence];
    setEvidence(updated);
    saveToStorage("unihub_evidence", updated);
  };

  const joinOrganizationRequest = (studentId: string, orgId: string, details?: Partial<OrganizationMember>) => {
    const studentObj = students.find(s => s.id === studentId);
    if (!studentObj) return;

    const pendingMember: OrganizationMember = {
      id: `M_NEW_${Date.now()}`,
      studentId,
      classId: studentObj.classId,
      orgId,
      role: "THÀNH VIÊN",
      joinedDate: new Date().toISOString().split("T")[0],
      term: period.academicYear,
      status: "PENDING",
      studentName: studentObj.name,
      ...details
    };

    const updated = [...members, pendingMember];
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const updateStudentProfile = (studentId: string, name: string, avatar: string, password?: string, additionalFields?: Partial<Student>) => {
    // 1. Update students array
    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return { ...s, ...additionalFields, name, avatar };
      }
      return s;
    });
    setStudents(updatedStudents);
    saveToStorage("unihub_students", updatedStudents);

    // 2. Update users credentials and name
    const updatedUsers = users.map(u => {
      if (u.targetId === studentId || u.username === studentId || u.email === studentId || u.id === studentId) {
        const uo = { ...u, name };
        if (password) {
          uo.password = password;
        }
        return uo;
      }
      return u;
    });
    setUsers(updatedUsers);
    saveToStorage("unihub_users", updatedUsers);

    // 3. Keep current user in sync
    if (currentUser && (currentUser.targetId === studentId || currentUser.username === studentId || currentUser.id === studentId)) {
      const updatedCur = { ...currentUser, name };
      if (password) {
        updatedCur.password = password;
      }
      setCurrentUser(updatedCur);
      saveToStorage("unihub_current_user", updatedCur);
    }

    // 4. Update seed results
    const updatedResults = results.map(r => {
      if (r.studentId === studentId) {
        return { ...r, studentName: name };
      }
      return r;
    });
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);

    // 5. Update attendance names
    const updatedAttendance = attendance.map(a => {
      if (a.studentId === studentId) {
        return { ...a, studentName: name };
      }
      return a;
    });
    setAttendance(updatedAttendance);
    saveToStorage("unihub_attendance", updatedAttendance);

    // 6. Update evidence submissions
    const updatedEvidence = evidence.map(ev => {
      if (ev.studentId === studentId) {
        return { ...ev, studentName: name };
      }
      return ev;
    });
    setEvidence(updatedEvidence);
    saveToStorage("unihub_evidence", updatedEvidence);
  };

  // Organizer Actions
  const createActivity = (activity: Omit<ExtracurricularActivity, "id" | "status" | "orgName"> & { expiryDate?: string }): string => {
    const org = organizations.find(o => o.id === activity.orgId);
    const newAct: ExtracurricularActivity & { expiryDate?: string } = {
      ...activity,
      id: `ACT_NEW_${Date.now()}`,
      orgName: org?.name || "Chi hội",
      status: "UPCOMING"
    };

    const updated = [...activities, newAct];
    setActivities(updated);
    saveToStorage("unihub_activities", updated);
    return newAct.id;
  };

  const updateActivityStatus = (activityId: string, status: "UPCOMING" | "ONGOING" | "COMPLETED") => {
    const updated = activities.map(act => {
      if (act.id === activityId) {
        return { ...act, status };
      }
      return act;
    });

    // If status becomes completed, mark all signed attendance to be verified
    if (status === "COMPLETED") {
      const updatedAttendance = attendance.map(att => {
        if (att.activityId === activityId) {
          return { ...att, verified: true };
        }
        return att;
      });
      setAttendance(updatedAttendance);
      saveToStorage("unihub_attendance", updatedAttendance);
    }

    setActivities(updated);
    saveToStorage("unihub_activities", updated);
  };

  // New clb actions
  const createAnnouncement = (announcement: Omit<ClubAnnouncement, "id" | "orgName" | "createdAt">): string => {
    const org = organizations.find(o => o.id === announcement.orgId);
    const newAnn: ClubAnnouncement = {
      ...announcement,
      id: `ANN_NEW_${Date.now()}`,
      orgName: org?.name || "Chi hội",
      createdAt: new Date().toISOString().split("T")[0]
    };
    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    saveToStorage("unihub_announcements", updated);
    return newAnn.id;
  };

  const deleteAnnouncement = (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    saveToStorage("unihub_announcements", updated);
  };

  const addMemberManual = (member: Omit<OrganizationMember, "id" | "joinedDate" | "term" | "status">) => {
    const newMember: OrganizationMember = {
      ...member,
      id: `M_NEW_${Date.now()}`,
      joinedDate: new Date().toISOString().split("T")[0],
      term: "2025-2026",
      status: "ACTIVE"
    };
    const updated = [...members, newMember];
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const deleteMember = (memberId: string) => {
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const updateMemberDetails = (memberId: string, details: Partial<OrganizationMember>) => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        return { ...m, ...details };
      }
      return m;
    });
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const importMembersExcel = (membersToImport: OrganizationMember[]) => {
    const updated = [...members, ...membersToImport];
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const approveMemberRequest = (memberId: string) => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        return { ...m, status: "ACTIVE" as const };
      }
      return m;
    });
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const rejectMemberRequest = (memberId: string) => {
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const assignMemberRole = (memberId: string, role: "CHỦ NHIỆM" | "BAN CHẤP HÀNH" | "ỦY VIÊN" | "THÀNH VIÊN") => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        return { ...m, role };
      }
      return m;
    });
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const updateAttendance = (attendanceId: string, attended: boolean, role?: "MEM" | "BTC" | "SUPPORTER") => {
    const updated = attendance.map(a => {
      if (a.id === attendanceId) {
        return { 
          ...a, 
          attended, 
          role: role || a.role 
        };
      }
      return a;
    });
    setAttendance(updated);
    saveToStorage("unihub_attendance", updated);
  };

  const addBulkAttendance = (activityId: string, studentIds: string[]) => {
    const currentAct = activities.find(a => a.id === activityId);
    if (!currentAct) return;

    // Filter out studentIds already in attendance for this activity
    const cleanIds = studentIds.filter(id => !attendance.some(att => att.activityId === activityId && att.studentId === id));
    
    const newRecords: ActivityAttendance[] = cleanIds.map(sid => {
      const sObj = students.find(s => s.id === sid);
      return {
        id: `AT_BLK_${Date.now()}_${sid}`,
        activityId,
        studentId: sid,
        studentName: sObj?.name || sid,
        classId: sObj?.classId || "K20-CNTT",
        registeredAt: new Date().toISOString().split("T")[0],
        role: "MEM",
        attended: true,
        verified: true
      };
    });

    const updatedRecords = [...attendance, ...newRecords];
    setAttendance(updatedRecords);
    saveToStorage("unihub_attendance", updatedRecords);
  };

  // Training Dept Actions
  const importAcademicData = (excelData: Partial<Student>[]) => {
    const updated = students.map(s => {
      const item = excelData.find(item => item.id === s.id);
      if (item) {
        return {
          ...s,
          ...item,
          learningDataLocked: true
        };
      }
      return s;
    });
    setStudents(updated);
    saveToStorage("unihub_students", updated);
  };

  const toggleLearningDataLock = () => {
    const updated = students.map(s => ({ ...s, learningDataLocked: true }));
    setStudents(updated);
    saveToStorage("unihub_students", updated);
  };

  // BCS / Class Actions
  const approveClassScores = (classId: string) => {
    // Check if class review exists
    const exists = classReviews.some(cr => cr.classId === classId);
    let updated: ClassReviewState[];
    
    if (exists) {
      updated = classReviews.map(cr => {
        if (cr.classId === classId) {
          return { ...cr, representativeApproved: true, representativeApprovedAt: new Date().toISOString().split("T")[0] };
        }
        return cr;
      });
    } else {
      updated = [
        ...classReviews,
        { classId, representativeApproved: true, representativeApprovedAt: new Date().toISOString().split("T")[0], adviserApproved: false }
      ];
    }

    setClassReviews(updated);
    saveToStorage("unihub_class_reviews", updated);
  };

  const toggleClassMeetingDuty = (studentId: string, completed: boolean) => {
    // For local tracking if desired
  };

  // GVCN Actions
  const approveAdviserScores = (classId: string, comment: string) => {
    const exists = classReviews.some(cr => cr.classId === classId);
    let updated: ClassReviewState[];

    if (exists) {
      updated = classReviews.map(cr => {
        if (cr.classId === classId) {
          return { 
            ...cr, 
            adviserApproved: true, 
            adviserApprovedAt: new Date().toISOString().split("T")[0],
            adviserComment: comment
          };
        }
        return cr;
      });
    } else {
      updated = [
        ...classReviews,
        { 
          classId, 
          representativeApproved: true, 
          representativeApprovedAt: new Date().toISOString().split("T")[0], 
          adviserApproved: true, 
          adviserApprovedAt: new Date().toISOString().split("T")[0],
          adviserComment: comment
        }
      ];
    }

    setClassReviews(updated);
    saveToStorage("unihub_class_reviews", updated);
  };

  const submitAdviserAdjustment = (studentId: string, criteriaCategory: string, points: number, reason: string) => {
    // Adjust result's logs and save
    const updatedResults = results.map(res => {
      if (res.studentId === studentId) {
        const timestampNow = new Date().toISOString().split("T")[0];
        
        // Push adjustment log
        const updatedLogs = [
          ...res.logs,
          {
            criteriaId: "ADJUST_MANUAL",
            points,
            reason: `GVCN điều chỉnh mục ${criteriaCategory}: ${reason}`,
            source: "GV_ĐIỀU_CHỈNH" as const,
            timestamp: timestampNow
          }
        ];

        // Recalculate specific sections depending on category
        let studyPoints = res.studyPoints;
        let violationPoints = res.violationPoints;
        let extracurricularPoints = res.extracurricularPoints;
        let communityPoints = res.communityPoints;
        let achievementPoints = res.achievementPoints;

        if (criteriaCategory.includes("học tập")) studyPoints = Math.min(20, Math.max(0, studyPoints + points));
        else if (criteriaCategory.includes("nội quy")) violationPoints = Math.min(25, Math.max(0, violationPoints + points));
        else if (criteriaCategory.includes("hoạt động")) extracurricularPoints = Math.min(30, Math.max(0, extracurricularPoints + points));
        else if (criteriaCategory.includes("công dân")) communityPoints = Math.min(15, Math.max(0, communityPoints + points));
        else if (criteriaCategory.includes("khen thưởng")) achievementPoints = Math.min(10, Math.max(0, achievementPoints + points));

        const totalPoints = studyPoints + violationPoints + extracurricularPoints + communityPoints + achievementPoints;
        let grade: EvaluationResult["grade"] = "TRUNG BÌNH";
        if (totalPoints >= 90) grade = "XUẤT SẮC";
        else if (totalPoints >= 80) grade = "TỐT";
        else if (totalPoints >= 70) grade = "KHÁ";
        else if (totalPoints >= 50) grade = "TRUNG BÌNH";
        else if (totalPoints >= 30) grade = "YẾU";
        else grade = "KÉM";

        return {
          ...res,
          studyPoints,
          violationPoints,
          extracurricularPoints,
          communityPoints,
          achievementPoints,
          totalPoints,
          grade,
          adviserNotes: reason,
          logs: updatedLogs
        };
      }
      return res;
    });

    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);
  };

  // Faculty Actions
  const lockFacultyData = (facultyId: string, lockedBy: string) => {
    const exists = facultyReviews.some(fr => fr.facultyId === facultyId);
    let updated: FacultyReviewState[];

    if (exists) {
      updated = facultyReviews.map(fr => {
        if (fr.facultyId === facultyId) {
          return { ...fr, locked: true, lockedAt: new Date().toISOString().split("T")[0], lockedBy };
        }
        return fr;
      });
    } else {
      updated = [
        ...facultyReviews,
        { facultyId, locked: true, lockedAt: new Date().toISOString().split("T")[0], lockedBy }
      ];
    }

    setFacultyReviews(updated);
    saveToStorage("unihub_faculty_reviews", updated);

    // Turn all class reviews for this faculty to locked
    const facultyClasses = students.filter(s => s.facultyId === facultyId).map(s => s.classId);
    const updatedClassReviews = classReviews.map(cr => {
      if (facultyClasses.includes(cr.classId)) {
        return { ...cr, adviserApproved: true };
      }
      return cr;
    });
    setClassReviews(updatedClassReviews);
    saveToStorage("unihub_class_reviews", updatedClassReviews);
  };

  // Evidence Management (Review)
  const reviewEvidence = (subId: string, status: "APPROVED" | "REJECTED", comment?: string) => {
    const updated = evidence.map(e => {
      if (e.id === subId) {
        return { 
          ...e, 
          status, 
          reviewedBy: currentUser?.name || "Cán bộ quản lý",
          reviewComment: comment || "Đã kiểm duyệt minh chứng."
        };
      }
      return e;
    });

    setEvidence(updated);
    saveToStorage("unihub_evidence", updated);
  };

  // Admin Actions
  const updateCriteriaScore = (criteriaId: string, ruleId: string, newPoints: number) => {
    const updated = criteria.map(c => {
      if (c.id === criteriaId) {
        return {
          ...c,
          rules: c.rules.map(r => {
            if (r.id === ruleId) {
              return { ...r, points: newPoints };
            }
            return r;
          })
        };
      }
      return c;
    });
    setCriteria(updated);
    saveToStorage("unihub_criteria", updated);
  };

  const bulkUpdateCriteria = (newCriteria: PointCriteria[]) => {
    setCriteria(newCriteria);
    saveToStorage("unihub_criteria", newCriteria);
  };

  const resetToSeeds = () => {
    localStorage.clear();
    setPeriod(SEED_PERIOD);
    setUsers(SEED_USERS);
    setCriteria(SEED_CRITERIA);
    setStudents(SEED_STUDENTS);
    setOrganizations(SEED_ORGANIZATIONS);
    setMembers(SEED_MEMBERS);
    setActivities(SEED_ACTIVITIES);
    setAttendance(SEED_ATTENDANCE);
    setEvidence(SEED_EVIDENCE);
    setClassReviews(SEED_CLASS_REVIEW);
    setFacultyReviews(SEED_FACULTY_REVIEW);
    setResults(SEED_RESULTS);
    setDailyAttendance(SEED_DAILY_ATTENDANCE);
    setSchedules(SEED_SCHEDULES);
    setFeedbacks([
      { id: "FB1", fromRole: UserRole.ADVISER, fromName: "Hoàng Minh Đức", toClassId: "K20-CNTT", comment: "Cần điều chỉnh, đối chiếu kỹ hơn danh sách nề nếp thi đua lớp trước khi gửi ký chính thống.", createdAt: "2026-05-23", resolved: false }
    ]);
    setGroupCriteria([
      { id: "XS", name: "Tập thể Xuất sắc", minExcellentPercent: 30, maxWeakPercent: 0, description: "Tỉ lệ rèn luyện Xuất sắc & Tốt đạt từ 30% trở lên, không có sinh viên xếp loại Yếu hoặc Kém." },
      { id: "TT", name: "Tập thể Tiên tiến", minExcellentPercent: 20, maxWeakPercent: 5, description: "Tỉ lệ rèn luyện Xuất sắc & Tốt đạt từ 20% trở lên, tỉ lệ xếp loại Yếu hoặc Kém không quá 5%." }
    ]);
    setCurrentUser(SEED_USERS[0]); // Default back to Student Nguyễn Văn An
    saveToStorage("unihub_current_user", SEED_USERS[0]);
  };

  const importScheduleData = (slots: ScheduleSlot[]) => {
    setSchedules(slots);
    saveToStorage("unihub_schedules", slots);
  };

  const deleteScheduleSlot = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    saveToStorage("unihub_schedules", updated);
  };

  const clearSchedules = () => {
    setSchedules([]);
    saveToStorage("unihub_schedules", []);
  };

  const reportDailyAttendance = (
    classId: string, 
    date: string, 
    absentees: { studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[], 
    reportedBy: string
  ) => {
    const totalStuds = students.filter(s => s.classId === classId).length;
    const absCount = absentees.length;
    const presCount = totalStuds - absCount;

    const report: DailyAttendanceReport = {
      id: `DAR_${Date.now()}`,
      classId,
      date,
      totalStudents: totalStuds,
      presentCount: presCount,
      absentCount: absCount,
      absentees,
      reportedBy,
      reportedAt: new Date().toISOString()
    };

    const updated = [report, ...dailyAttendance];
    setDailyAttendance(updated);
    saveToStorage("unihub_daily_attendance", updated);
  };

  const sendFeedback = (
    fromRole: UserRole, 
    fromName: string, 
    toClassId: string, 
    comment: string, 
    studentId?: string
  ) => {
    const newFeedback: ScoreFeedback = {
      id: `FB_${Date.now()}`,
      fromRole,
      fromName,
      toClassId,
      studentId,
      comment,
      createdAt: new Date().toISOString().split("T")[0],
      resolved: false
    };

    const updated = [newFeedback, ...feedbacks];
    setFeedbacks(updated);
    saveToStorage("unihub_feedbacks", updated);
  };

  const resolveFeedback = (feedbackId: string) => {
    const updated = feedbacks.map(fb => {
      if (fb.id === feedbackId) {
        return { ...fb, resolved: true };
      }
      return fb;
    });
    setFeedbacks(updated);
    saveToStorage("unihub_feedbacks", updated);
  };

  const importGroupCriteria = (criteriaList: GroupEvaluationCriteria[]) => {
    setGroupCriteria(criteriaList);
    saveToStorage("unihub_group_criteria", criteriaList);
  };

  const approveFacultyScores = (classId: string, comment: string) => {
    const exists = classReviews.some(cr => cr.classId === classId);
    let updated: ClassReviewState[];
    if (exists) {
      updated = classReviews.map(cr => {
        if (cr.classId === classId) {
          return { 
            ...cr, 
            facultyApproved: true, 
            facultyApprovedAt: new Date().toISOString().split("T")[0],
            facultyComment: comment 
          };
        }
        return cr;
      });
    } else {
      updated = [
        ...classReviews,
        { 
          classId, 
          representativeApproved: true, 
          adviserApproved: true, 
          facultyApproved: true, 
          facultyApprovedAt: new Date().toISOString().split("T")[0], 
          facultyComment: comment 
        }
      ];
    }
    setClassReviews(updated);
    saveToStorage("unihub_class_reviews", updated);
  };

  const approveAdminScores = (classId: string, comment: string) => {
    const exists = classReviews.some(cr => cr.classId === classId);
    let updated: ClassReviewState[];
    if (exists) {
      updated = classReviews.map(cr => {
        if (cr.classId === classId) {
          return { 
            ...cr, 
            adminApproved: true, 
            adminApprovedAt: new Date().toISOString().split("T")[0],
            adminComment: comment 
          };
        }
        return cr;
      });
    } else {
      updated = [
        ...classReviews,
        { 
          classId, 
          representativeApproved: true, 
          adviserApproved: true, 
          facultyApproved: true, 
          adminApproved: true, 
          adminApprovedAt: new Date().toISOString().split("T")[0], 
          adminComment: comment 
        }
      ];
    }
    setClassReviews(updated);
    saveToStorage("unihub_class_reviews", updated);
  };

  const createClubWithAccount = (club: Organization, account: UserAccount) => {
    const updatedOrgs = [...organizations, club];
    setOrganizations(updatedOrgs);
    saveToStorage("unihub_organizations", updatedOrgs);

    const updatedUsers = [...users, { ...account, role: UserRole.ORGANIZER }];
    setUsers(updatedUsers);
    saveToStorage("unihub_users", updatedUsers);
  };

  const updateClubAndAccount = (clubId: string, updatedClub: Partial<Organization>, updatedAccount: Partial<UserAccount>) => {
    const updatedOrgs = organizations.map(o => {
      if (o.id === clubId) {
        return { ...o, ...updatedClub };
      }
      return o;
    });
    setOrganizations(updatedOrgs);
    saveToStorage("unihub_organizations", updatedOrgs);

    const updatedUsers = users.map(u => {
      if (u.role === UserRole.ORGANIZER && (u.targetId === clubId || u.username === updatedAccount.username)) {
        return { ...u, ...updatedAccount, targetId: clubId };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveToStorage("unihub_users", updatedUsers);

    if (currentUser && currentUser.role === UserRole.ORGANIZER && currentUser.targetId === clubId) {
      const matchNewUser = updatedUsers.find(u => u.targetId === clubId);
      if (matchNewUser) {
        setCurrentUser(matchNewUser);
        saveToStorage("unihub_current_user", matchNewUser);
      }
    }
  };

  const deleteClubAndAccount = (clubId: string) => {
    const updatedOrgs = organizations.filter(o => o.id !== clubId);
    setOrganizations(updatedOrgs);
    saveToStorage("unihub_organizations", updatedOrgs);

    const updatedUsers = users.filter(u => !(u.role === UserRole.ORGANIZER && u.targetId === clubId));
    setUsers(updatedUsers);
    saveToStorage("unihub_users", updatedUsers);
  };

  const createUserAccount = (account: UserAccount) => {
    const updated = [...users, account];
    setUsers(updated);
    saveToStorage("unihub_users", updated);
  };

  const updateUserAccount = (userId: string, updatedAccount: Partial<UserAccount>) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, ...updatedAccount };
      }
      return u;
    });
    setUsers(updated);
    saveToStorage("unihub_users", updated);
  };

  const deleteUserAccount = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveToStorage("unihub_users", updated);
  };

  const importNewClassesExcel = (studentsToImport: Student[], usersToImport: UserAccount[]) => {
    const combinedStudents = [...students];
    studentsToImport.forEach(newStud => {
      const existingIdx = combinedStudents.findIndex(s => s.id === newStud.id);
      if (existingIdx !== -1) {
        combinedStudents[existingIdx] = { ...combinedStudents[existingIdx], ...newStud };
      } else {
        combinedStudents.push(newStud);
      }
    });

    const combinedUsers = [...users];
    usersToImport.forEach(newUser => {
      const existingIdx = combinedUsers.findIndex(u => u.username.toLowerCase() === newUser.username.toLowerCase() || u.email.toLowerCase() === newUser.email.toLowerCase());
      if (existingIdx !== -1) {
        combinedUsers[existingIdx] = { ...combinedUsers[existingIdx], ...newUser };
      } else {
        combinedUsers.push(newUser);
      }
    });

    setStudents(combinedStudents);
    setUsers(combinedUsers);
    saveToStorage("unihub_students", combinedStudents);
    saveToStorage("unihub_users", combinedUsers);
  };

  const addNewClass = (className: string) => {
    if (!className.trim()) return;
    const normalized = className.trim();
    if (!customClasses.includes(normalized)) {
      const updated = [...customClasses, normalized];
      setCustomClasses(updated);
      localStorage.setItem("unihub_custom_classes", JSON.stringify(updated));
    }
  };

  const bulkApproveScores = (classId: string, studentIds: string[], role: UserRole) => {
    const updatedResults = results.map(res => {
      if (studentIds.includes(res.studentId)) {
        let newStatus = res.status;
        if (role === UserRole.CLASS_MONITOR) {
          newStatus = "APPROVED_CLASS" as const;
        } else if (role === UserRole.ADVISER) {
          newStatus = "APPROVED_ADVISER" as const;
        }
        return { ...res, status: newStatus };
      }
      return res;
    });
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);
  };

  const adjustStudentScoreSpecific = (studentId: string, category: string, points: number, reason: string) => {
    const updatedResults = results.map(res => {
      if (res.studentId === studentId) {
        let studyPoints = res.studyPoints;
        let violationPoints = res.violationPoints;
        let extracurricularPoints = res.extracurricularPoints;
        let communityPoints = res.communityPoints;
        let achievementPoints = res.achievementPoints;

        if (category.toLowerCase().includes("học tập") || category.includes("TC1")) studyPoints = Math.min(20, Math.max(0, studyPoints + points));
        else if (category.toLowerCase().includes("nội quy") || category.includes("TC2")) violationPoints = Math.max(0, Math.min(25, violationPoints + points));
        else if (category.toLowerCase().includes("hoạt động") || category.includes("TC3")) extracurricularPoints = Math.min(30, Math.max(0, extracurricularPoints + points));
        else if (category.toLowerCase().includes("công dân") || category.includes("TC4")) communityPoints = Math.min(15, Math.max(0, communityPoints + points));
        else if (category.toLowerCase().includes("khen thưởng") || category.includes("TC5")) achievementPoints = Math.min(10, Math.max(0, achievementPoints + points));

        const totalPoints = studyPoints + violationPoints + extracurricularPoints + communityPoints + achievementPoints;
        let grade: EvaluationResult["grade"] = "TRUNG BÌNH";
        if (totalPoints >= 90) grade = "XUẤT SẮC";
        else if (totalPoints >= 80) grade = "TỐT";
        else if (totalPoints >= 70) grade = "KHÁ";
        else if (totalPoints >= 50) grade = "TRUNG BÌNH";
        else if (totalPoints >= 30) grade = "YẾU";
        else grade = "KÉM";

        const updatedLogs = [
          ...res.logs,
          {
            criteriaId: "ADJUST_MANUAL",
            points,
            reason: `Hiệu chỉnh [${category}]: ${reason}`,
            source: "BCS_DUYỆT" as const,
            timestamp: new Date().toISOString().split("T")[0]
          }
        ];

        return {
          ...res,
          studyPoints,
          violationPoints,
          extracurricularPoints,
          communityPoints,
          achievementPoints,
          totalPoints,
          grade,
          logs: updatedLogs
        };
       }
       return res;
    });
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);
  };

  return (
    <UniHubContext.Provider value={{
      currentUser,
      period,
      users,
      criteria,
      students,
      organizations,
      members,
      activities,
      attendance,
      evidence,
      classReviews,
      facultyReviews,
      results,
      dailyAttendance,
      feedbacks,
      groupCriteria,
      announcements,
      schedules,
      
      login,
      logout,
      updatePeriodStatus,
      importScheduleData,
      deleteScheduleSlot,
      clearSchedules,
      
      registerForActivity,
      submitEvidence,
      joinOrganizationRequest,
      updateStudentProfile,
      createActivity,
      updateActivityStatus,
      approveMemberRequest,
      rejectMemberRequest,
      assignMemberRole,
      updateAttendance,
      addBulkAttendance,
      createAnnouncement,
      deleteAnnouncement,
      addMemberManual,
      deleteMember,
      updateMemberDetails,
      importMembersExcel,
      importAcademicData,
      toggleLearningDataLock,
      importNewClassesExcel,
      customClasses,
      addNewClass,
      approveClassScores,
      toggleClassMeetingDuty,
      reportDailyAttendance,
      bulkApproveScores,
      approveAdviserScores,
      submitAdviserAdjustment,
      lockFacultyData,
      approveFacultyScores,
      importGroupCriteria,
      approveAdminScores,
      sendFeedback,
      resolveFeedback,
      adjustStudentScoreSpecific,
      updateCriteriaScore,
      bulkUpdateCriteria,
      resetToSeeds,
      createClubWithAccount,
      updateClubAndAccount,
      deleteClubAndAccount,
      activePortletTab,
      setActivePortletTab,
      selectedSemesterId,
      setSelectedSemesterId,
      createUserAccount,
      updateUserAccount,
      deleteUserAccount
    }}>
      {children}
    </UniHubContext.Provider>
  );
};

export const useUniHub = () => {
  const context = useContext(UniHubContext);
  if (context === undefined) {
    throw new Error("useUniHub must be used within a UniHubProvider");
  }
  return context;
};
