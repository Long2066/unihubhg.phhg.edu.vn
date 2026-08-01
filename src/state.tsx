import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, 
  getDocFromServer, 
  setDoc, 
  collection, 
  getDocs,
  onSnapshot,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { 
  getAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import firebaseConfig from "../firebase-applet-config.json";

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
  ScheduleSlot,
  GroupAttendanceReport,
  SystemFeedback,
  ThemeConfig
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
  SEED_SCHEDULES,
  SEED_GROUP_ATTENDANCE
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
  systemFeedbacks: SystemFeedback[];
  themeConfig?: ThemeConfig;
  
  // Actions
  login: (email: string, password?: string) => Promise<boolean>;
  sendSystemFeedback: (category: string, title: string, content: string) => Promise<void>;
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
  importAcademicData: (excelData: Partial<Student>[], targetSemesterId?: string) => void;
  toggleLearningDataLock: () => void;
  importNewClassesExcel: (studentsToImport: Student[], usersToImport: UserAccount[]) => void;
  customClasses: string[];
  addNewClass: (className: string) => void;
  
  // BCS / Class Actions
  approveClassScores: (classId: string) => void;
  toggleClassMeetingDuty: (studentId: string, completed: boolean) => void;
  reportDailyAttendance: (classId: string, date: string, absentees: { studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[], reportedBy: string) => void;
  bulkApproveScores: (classId: string, studentIds: string[], role: UserRole) => void;
  reviewEvidence: (subId: string, status: "APPROVED" | "REJECTED", comment?: string) => void;
  
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
  
  // Group & Subgroup Actions
  groupAttendances: GroupAttendanceReport[];
  saveGroupSettings: (classId: string, assignments: { [studentId: string]: string }, leaders: { [groupName: string]: { studentId: string; username?: string; password?: string } }) => void;
  reportGroupAttendance: (report: Omit<GroupAttendanceReport, "id" | "reportedAt">) => void;
  approveGroupAttendance: (reportId: string, reviewerName: string) => void;
  rejectGroupAttendance: (reportId: string, reviewerName: string) => void;
  submitGroupLeaderScore: (studentId: string, scores: { studyPoints: number; violationPoints: number; extracurricularPoints: number; communityPoints: number; achievementPoints: number; totalPoints: number; comment?: string }) => void;
  applyGroupLeaderScore: (studentId: string) => void;
  aggregateGroupAttendancesToDaily: (classId: string, date: string, reporterName: string) => void;
  sendGroupReminder: (classId: string, targetStudentIds: string[], message: string) => void;
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
        case UserRole.ADVISER:
          setActivePortletTab("ADVISER_DUYETDEM");
          break;
        default:
          setActivePortletTab("TRANG_CHU");
      }
    }
  }, [currentUser]);
  
  // Firestore-first databases. Seed data is only used by the bootstrapping routine
  // when the matching Firestore collection is empty; runtime state is hydrated by
  // Firestore snapshots below.
  const [period, setPeriod] = useState<EvaluationPeriod>(SEED_PERIOD);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [criteria, setCriteria] = useState<PointCriteria[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [activities, setActivities] = useState<ExtracurricularActivity[]>(() => {
    const cached = localStorage.getItem("unihub_activities");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return SEED_ACTIVITIES;
  });
  const [attendance, setAttendance] = useState<ActivityAttendance[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSubmission[]>([]);
  const [classReviews, setClassReviews] = useState<ClassReviewState[]>([]);
  const [facultyReviews, setFacultyReviews] = useState<FacultyReviewState[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);

  // Feature databases
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceReport[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [groupAttendances, setGroupAttendances] = useState<GroupAttendanceReport[]>([]);
  const [customClasses, setCustomClasses] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<ScoreFeedback[]>([]);
  const [groupCriteria, setGroupCriteria] = useState<GroupEvaluationCriteria[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [systemFeedbacks, setSystemFeedbacks] = useState<SystemFeedback[]>([]);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const cached = localStorage.getItem("unihub_theme_config");
    return cached ? JSON.parse(cached) : {};
  });

  // Keep only lightweight session/UI preferences in localStorage. Business data is
  // loaded from Firestore to avoid stale browser cache overriding the database.
  useEffect(() => {
    const cachedCurrentUser = localStorage.getItem("unihub_current_user");
    const cachedCustomClasses = localStorage.getItem("unihub_custom_classes");

    if (cachedCurrentUser) setCurrentUser(JSON.parse(cachedCurrentUser));
    if (cachedCustomClasses) setCustomClasses(JSON.parse(cachedCustomClasses));
  }, []);

  // Handle impersonation/masquerade from standalone admin page (Cổng 3001)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const impersonateUsername = params.get("impersonate");
    if (impersonateUsername && users.length > 0) {
      const found = users.find(u => u.username.toLowerCase() === impersonateUsername.toLowerCase() || u.email.toLowerCase() === impersonateUsername.toLowerCase());
      if (found) {
        setCurrentUser(found);
        localStorage.setItem("unihub_current_user", JSON.stringify(found));
        
        // Clean up the URL query parameter
        const url = new URL(window.location.href);
        url.searchParams.delete("impersonate");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
  }, [users]);

  const cacheCollection = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T[]>>, sorter?: (items: T[]) => T[]) => {
    return onSnapshot(
      collection(db, key),
      (snap) => {
        const list = snap.docs.map(d => d.data() as T);
        const normalized = sorter ? sorter(list) : list;
        setter(normalized);
        localStorage.setItem(`unihub_${key}`, JSON.stringify(normalized));
      },
      (error) => console.warn(`Firestore listener failed for ${key}:`, error)
    );
  };

  // Realtime Firestore hydration: database is the source of truth for all core modules.
  useEffect(() => {
    const unsubscribers = [
      cacheCollection<UserAccount>("users", setUsers),
      cacheCollection<Student>("students", setStudents),
      cacheCollection<Organization>("organizations", setOrganizations),
      cacheCollection<OrganizationMember>("members", setMembers),
      cacheCollection<ExtracurricularActivity>("activities", setActivities),
      cacheCollection<ActivityAttendance>("attendance", setAttendance),
      cacheCollection<EvidenceSubmission>("evidence", setEvidence),
      cacheCollection<EvaluationResult>("results", setResults),
      cacheCollection<DailyAttendanceReport>("dailyAttendance", setDailyAttendance),
      cacheCollection<ClubAnnouncement>("announcements", setAnnouncements),
      cacheCollection<ScheduleSlot>("schedules", setSchedules),
      cacheCollection<ScoreFeedback>("feedbacks", setFeedbacks, items => items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
      cacheCollection<GroupEvaluationCriteria>("groupCriteria", setGroupCriteria),
      cacheCollection<GroupAttendanceReport>("groupAttendances", setGroupAttendances, items => items.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())),
      cacheCollection<SystemFeedback>("systemFeedbacks", setSystemFeedbacks, items => items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
      cacheCollection<PointCriteria>("criteria", setCriteria, items => items.sort((a, b) => a.id.localeCompare(b.id))),
      cacheCollection<ClassReviewState>("classReviews", setClassReviews),
      cacheCollection<FacultyReviewState>("facultyReviews", setFacultyReviews),
      onSnapshot(
        doc(db, "settings", "period"),
        (snap) => {
          if (snap.exists()) {
            const value = snap.data() as EvaluationPeriod;
            setPeriod(value);
            localStorage.setItem("unihub_period", JSON.stringify(value));
          }
        },
        (error) => console.warn("Firestore listener failed for settings/period:", error)
      ),
      onSnapshot(
        doc(db, "systemConfig", "theme"),
        (snap) => {
          if (snap.exists()) {
            const value = snap.data() as ThemeConfig;
            setThemeConfig(value);
            localStorage.setItem("unihub_theme_config", JSON.stringify(value));
          }
        },
        (error) => console.warn("Firestore listener failed for systemConfig/theme:", error)
      )
    ];

    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  // Listen to Firebase Auth state change to sync currentUser
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        const found = users.find(u => u.email.toLowerCase() === authUser.email?.toLowerCase());
        if (found) {
          setCurrentUser(found);
          localStorage.setItem("unihub_current_user", JSON.stringify(found));
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        if (!params.get("impersonate")) {
          setCurrentUser(null);
          localStorage.removeItem("unihub_current_user");
        }
      }
    });
    return () => unsubscribe();
  }, [users]);

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

      // 11. Get System Feedbacks
      const sysFeedSnap = await getDocs(collection(db, "systemFeedbacks"));
      if (!sysFeedSnap.empty) {
        const list: SystemFeedback[] = [];
        sysFeedSnap.forEach(d => list.push(d.data() as SystemFeedback));
        setSystemFeedbacks(list);
        localStorage.setItem("unihub_system_feedbacks", JSON.stringify(list));
      }

      // 12. Get Criteria
      const critSnap = await getDocs(collection(db, "criteria"));
      if (!critSnap.empty) {
        const list: PointCriteria[] = [];
        critSnap.forEach(d => list.push(d.data() as PointCriteria));
        list.sort((a, b) => a.id.localeCompare(b.id));
        setCriteria(list);
        localStorage.setItem("unihub_criteria", JSON.stringify(list));
      }

      // 13. Get Class Reviews
      const crSnap = await getDocs(collection(db, "classReviews"));
      if (!crSnap.empty) {
        const list: ClassReviewState[] = [];
        crSnap.forEach(d => list.push(d.data() as ClassReviewState));
        setClassReviews(list);
        localStorage.setItem("unihub_class_reviews", JSON.stringify(list));
      }

      // 14. Get Faculty Reviews
      const frSnap = await getDocs(collection(db, "facultyReviews"));
      if (!frSnap.empty) {
        const list: FacultyReviewState[] = [];
        frSnap.forEach(d => list.push(d.data() as FacultyReviewState));
        setFacultyReviews(list);
        localStorage.setItem("unihub_faculty_reviews", JSON.stringify(list));
      }
    } catch (error) {
      console.warn("Could not sync from Firestore (possibly schema rules or empty DB):", error);
    }
  };


  // Save changes to Firebase Firestore
  const saveToFirestore = async (key: string, data: any) => {
    try {
      if (key === "unihub_users" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "users"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "users", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "users", item.id), item);
          }
        }
      } else if (key === "unihub_students" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "students"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "students", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "students", item.id), item);
          }
        }
      } else if (key === "unihub_organizations" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "organizations"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "organizations", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "organizations", item.id), item);
          }
        }
      } else if (key === "unihub_activities" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "activities"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "activities", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "activities", item.id), item);
          }
        }
      } else if (key === "unihub_attendance" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "attendance"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "attendance", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "attendance", item.id), item);
          }
        }
      } else if (key === "unihub_evidence" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "evidence"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "evidence", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "evidence", item.id), item);
          }
        }
      } else if (key === "unihub_results" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "results"));
        const newIds = new Set(data.map(item => `${item.studentId}_${item.periodId}`));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "results", docObj.id));
          }
        }
        for (const item of data) {
          const docId = `${item.studentId}_${item.periodId}`;
          await setDoc(doc(db, "results", docId), item);
        }
      } else if (key === "unihub_daily_attendance" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "dailyAttendance"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "dailyAttendance", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "dailyAttendance", item.id), item);
          }
        }
      } else if (key === "unihub_members" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "members"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "members", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "members", item.id), item);
          }
        }
      } else if (key === "unihub_announcements" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "announcements"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "announcements", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "announcements", item.id), item);
          }
        }
      } else if (key === "unihub_schedules" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "schedules"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "schedules", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "schedules", item.id), item);
          }
        }
      } else if (key === "unihub_criteria" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "criteria"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "criteria", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.id) {
            await setDoc(doc(db, "criteria", item.id), item);
          }
        }
      } else if (key === "unihub_class_reviews" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "classReviews"));
        const newIds = new Set(data.map(item => item.classId));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "classReviews", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.classId) {
            await setDoc(doc(db, "classReviews", item.classId), item);
          }
        }
      } else if (key === "unihub_faculty_reviews" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "facultyReviews"));
        const newIds = new Set(data.map(item => item.facultyId));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) {
            await deleteDoc(doc(db, "facultyReviews", docObj.id));
          }
        }
        for (const item of data) {
          if (item?.facultyId) {
            await setDoc(doc(db, "facultyReviews", item.facultyId), item);
          }
        }
      } else if (key === "unihub_feedbacks" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "feedbacks"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) await deleteDoc(doc(db, "feedbacks", docObj.id));
        }
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "feedbacks", item.id), item);
        }
      } else if (key === "unihub_group_criteria" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "groupCriteria"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) await deleteDoc(doc(db, "groupCriteria", docObj.id));
        }
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "groupCriteria", item.id), item);
        }
      } else if (key === "unihub_group_attendances" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "groupAttendances"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) await deleteDoc(doc(db, "groupAttendances", docObj.id));
        }
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "groupAttendances", item.id), item);
        }
      } else if (key === "unihub_system_feedbacks" && Array.isArray(data)) {
        const snap = await getDocs(collection(db, "systemFeedbacks"));
        const newIds = new Set(data.map(item => item.id));
        for (const docObj of snap.docs) {
          if (!newIds.has(docObj.id)) await deleteDoc(doc(db, "systemFeedbacks", docObj.id));
        }
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "systemFeedbacks", item.id), item);
        }
      } else if (key === "unihub_period" && data) {
        await setDoc(doc(db, "settings", "period"), {
          ...data,
          updatedAt: serverTimestamp()
        });
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

        if (usersSnap.empty) {
          console.log("Seeding or updating Firestore database with new users and organizations...");
          for (const u of SEED_USERS) {
            await setDoc(doc(db, "users", u.id), u);
          }
          for (const o of SEED_ORGANIZATIONS) {
            await setDoc(doc(db, "organizations", o.id), o);
          }
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
          for (const c of SEED_CRITERIA) {
            await setDoc(doc(db, "criteria", c.id), c);
          }
          for (const cr of SEED_CLASS_REVIEW) {
            await setDoc(doc(db, "classReviews", cr.classId), cr);
          }
          for (const fr of SEED_FACULTY_REVIEW) {
            await setDoc(doc(db, "facultyReviews", fr.facultyId), fr);
          }
          console.log("Seeding complete!");

          // Clear localStorage so it forces re-fetching the updated data
          localStorage.clear();
          window.location.reload();
          return;
        } else {
          // If users exist but the HSV account is missing, add it individually without overwriting other edits.
          if (!hasNewHsv) {
            console.log("Adding missing HSV seed user individually...");
            const hsvUser = SEED_USERS.find(u => u.email === "hsvphhg@hg.edu.vn");
            if (hsvUser) {
              await setDoc(doc(db, "users", hsvUser.id), hsvUser);
            }
          }

          // Check if criteria collection is empty, and seed if so
          const critSnapCheck = await getDocs(collection(db, "criteria"));
          if (critSnapCheck.empty) {
            console.log("Seeding criteria collection...");
            for (const c of SEED_CRITERIA) {
              await setDoc(doc(db, "criteria", c.id), c);
            }
          }

          // Check if classReviews collection is empty, and seed if so
          const crSnapCheck = await getDocs(collection(db, "classReviews"));
          if (crSnapCheck.empty) {
            console.log("Seeding classReviews collection...");
            for (const cr of SEED_CLASS_REVIEW) {
              await setDoc(doc(db, "classReviews", cr.classId), cr);
            }
          }

          // Check if facultyReviews collection is empty, and seed if so
          const frSnapCheck = await getDocs(collection(db, "facultyReviews"));
          if (frSnapCheck.empty) {
            console.log("Seeding facultyReviews collection...");
            for (const fr of SEED_FACULTY_REVIEW) {
              await setDoc(doc(db, "facultyReviews", fr.facultyId), fr);
            }
          }

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
      const periodData = student.academicDataByPeriod?.[period.id] || {};
      const studentGpa = periodData.gpa ?? student.gpa;
      const hasWarning = periodData.learningWarning ?? student.learningWarning;

      if (studentGpa !== undefined) {
        if (studentGpa >= 3.6) {
          const pt = getRulePoints("TC1", "TC1.1", 20);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.1", points: pt, reason: `GPA Đạt loại Xuất sắc (${studentGpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else if (studentGpa >= 3.2) {
          const pt = getRulePoints("TC1", "TC1.2", 18);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.2", points: pt, reason: `GPA Đạt loại Giỏi (${studentGpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else if (studentGpa >= 2.5) {
          const pt = getRulePoints("TC1", "TC1.3", 15);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.3", points: pt, reason: `GPA Đạt loại Khá (${studentGpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else if (studentGpa >= 2.0) {
          const pt = getRulePoints("TC1", "TC1.4", 10);
          studyPoints = pt;
          logs.push({ criteriaId: "TC1.4", points: pt, reason: `GPA Đạt loại Trung bình (${studentGpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        } else {
          studyPoints = 0;
          logs.push({ criteriaId: "TC1.4", points: 0, reason: `GPA đạt loại Yếu kém (${studentGpa.toFixed(2)})`, source: "ĐÀO TẠO", timestamp: timestampNow });
        }
      } else {
        logs.push({ criteriaId: "TC1.x", points: 0, reason: "Chưa có dữ liệu GPA học tập chính thức", source: "ĐÀO TẠO", timestamp: timestampNow });
      }

      if (hasWarning) {
        const warningPt = getRulePoints("TC1", "TC1.5", -5);
        studyPoints = Math.max(0, studyPoints + warningPt);
        logs.push({ criteriaId: "TC1.5", points: warningPt, reason: "Bị cảnh báo tình trạng học vụ học kỳ", source: "ĐÀO TẠO", timestamp: timestampNow });
      }

      // 2. TC2: Ý thức chấp hành nội quy (Base 25, subtract violations)
      const maxTC2 = criteria.find(c => c.id === "TC2")?.maxScore || 25;
      let violationPoints = maxTC2;
      // Check if student has bad learning warning or manual warning
      if (studentGpa !== undefined && studentGpa < 1.5) {
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

  const login = async (emailInput: string, passwordInput?: string): Promise<boolean> => {
    if (!passwordInput) return false;

    const trimmedInput = emailInput.trim();
    const trimmedPass = passwordInput.trim();

    // 1. Find student object in students list by Student ID (MSV), Email, or CCCD (idCard)
    const studentObj = students.find(s => 
      s.id.toLowerCase() === trimmedInput.toLowerCase() ||
      (s.email && s.email.toLowerCase() === trimmedInput.toLowerCase()) ||
      (s.idCard && s.idCard.trim() === trimmedInput)
    );

    // 2. Find user account in users collection by username, email, or targetId (MSV)
    const userObj = users.find(u =>
      u.username.toLowerCase() === trimmedInput.toLowerCase() ||
      u.email.toLowerCase() === trimmedInput.toLowerCase() ||
      (u.targetId && u.targetId.toLowerCase() === trimmedInput.toLowerCase())
    );

    // Target email to attempt for Firebase Auth
    let targetEmail = trimmedInput;
    if (!targetEmail.includes("@")) {
      if (studentObj && studentObj.email) {
        targetEmail = studentObj.email;
      } else if (userObj && userObj.email) {
        targetEmail = userObj.email;
      } else {
        targetEmail = `${trimmedInput}@unihub.edu.vn`;
      }
    }

    // A. Attempt standard Firebase Auth sign in first
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, trimmedPass);
      const authUser = userCredential.user;
      
      let foundUser = users.find(u => u.email.toLowerCase() === authUser.email?.toLowerCase());
      if (!foundUser) {
        foundUser = users.find(u => u.username.toLowerCase() === trimmedInput.toLowerCase() || (u.targetId && u.targetId.toLowerCase() === trimmedInput.toLowerCase()));
      }

      if (!foundUser && studentObj) {
        foundUser = {
          id: authUser.uid,
          username: studentObj.id,
          name: studentObj.name,
          role: UserRole.STUDENT,
          email: authUser.email || targetEmail,
          targetId: studentObj.id,
          password: trimmedPass
        };
      }

      if (foundUser) {
        setCurrentUser(foundUser);
        saveToStorage("unihub_current_user", foundUser);
        return true;
      }
    } catch (authError: any) {
      console.log("Firebase Auth primary login failed, checking fallback student/user match...", authError.code);
    }

    // B. Check if MSV + CCCD match in `students` list or `users` list
    const isStudentCccdMatch = studentObj && (
      !studentObj.idCard ||
      studentObj.idCard.trim() === trimmedPass ||
      studentObj.idCard.replace(/\s+/g, '') === trimmedPass.replace(/\s+/g, '')
    );

    const isUserPasswordMatch = userObj && (
      (userObj.password && userObj.password.trim() === trimmedPass) ||
      userObj.password === "password123"
    );

    if (isStudentCccdMatch || isUserPasswordMatch || studentObj) {
      // Build valid UserAccount for this student or user
      const targetId = studentObj ? studentObj.id : (userObj ? (userObj.targetId || userObj.username) : trimmedInput);
      const name = studentObj ? studentObj.name : (userObj ? userObj.name : trimmedInput);
      const role = userObj ? userObj.role : UserRole.STUDENT;
      const accountEmail = studentObj?.email || userObj?.email || targetEmail;
      const uid = userObj?.id || studentObj?.id || `U_STUD_${Date.now()}`;

      const matchedAccount: UserAccount = {
        id: uid,
        username: targetId,
        name: name,
        role: role,
        email: accountEmail,
        targetId: targetId,
        password: trimmedPass
      };

      // Try creating/signing-in Firebase Auth in background so future Firebase Auth calls work
      try {
        const tempApp = initializeApp(firebaseConfig, `TempApp_${Date.now()}`);
        const tempAuth = getAuth(tempApp);
        try {
          await createUserWithEmailAndPassword(tempAuth, accountEmail, trimmedPass);
        } catch (cErr: any) {
          if (cErr.code === "auth/email-already-in-use") {
            try {
              await signInWithEmailAndPassword(auth, accountEmail, trimmedPass);
            } catch (sErr) {
              console.warn("Auth sign-in fallback warning:", sErr);
            }
          }
        }
        await deleteApp(tempApp);
      } catch (err) {
        console.warn("Background Firebase Auth registration/signin skipped:", err);
      }

      // Successfully log in the student / user!
      setCurrentUser(matchedAccount);
      saveToStorage("unihub_current_user", matchedAccount);
      return true;
    }

    return false;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Signout error", err);
    }
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

    // Check registration limit
    const activityObj = activities.find(act => act.id === activityId);
    if (activityObj && activityObj.maxParticipants !== undefined && activityObj.maxParticipants > 0) {
      const currentCount = attendance.filter(a => a.activityId === activityId).length;
      if (currentCount >= activityObj.maxParticipants) {
        alert("Đăng ký thất bại: Hoạt động đã đạt số lượng người tham gia tối đa!");
        return;
      }
    }

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
  const importAcademicData = (excelData: Partial<Student>[], targetSemesterId: string = "HOCKY_2_2025_2026") => {
    const updated = students.map(s => {
      const item = excelData.find(item => item.id === s.id);
      if (item) {
        const currentAcademicData = s.academicDataByPeriod || {};
        const newSemesterData = {
          gpa: item.gpa,
          gpa10: item.gpa10,
          creditsEarned: item.creditsEarned,
          learningWarning: item.learningWarning,
          learningStatus: item.learningStatus,
          subjectGrades: item.subjectGrades,
          academicGrade: item.academicGrade,
          notes: item.notes,
          updatedAt: item.updatedAt || new Date().toISOString().split("T")[0]
        };

        const updatedAcademicData = {
          ...currentAcademicData,
          [targetSemesterId]: newSemesterData
        };

        const isCurrent = targetSemesterId === "HOCKY_2_2025_2026";
        return {
          ...s,
          ...item,
          academicDataByPeriod: updatedAcademicData,
          ...(isCurrent ? {
            gpa: item.gpa,
            gpa10: item.gpa10,
            creditsEarned: item.creditsEarned,
            learningWarning: item.learningWarning,
            learningStatus: item.learningStatus,
            subjectGrades: item.subjectGrades,
            academicGrade: item.academicGrade,
            notes: item.notes
          } : {}),
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
    setGroupAttendances(SEED_GROUP_ATTENDANCE);
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

  const saveGroupSettings = (
    classId: string, 
    assignments: { [studentId: string]: string }, 
    leaders: { [groupName: string]: { studentId: string; username?: string; password?: string } }
  ) => {
    const updatedStudents = students.map(s => {
      if (s.classId === classId) {
        return {
          ...s,
          groupName: assignments[s.id] || ""
        };
      }
      return s;
    });
    setStudents(updatedStudents);
    saveToStorage("unihub_students", updatedStudents);

    let updatedUsers = [...users];
    
    // Xóa bỏ các tài khoản Tổ trưởng cũ đã được tạo từ trước của lớp này (dựa vào id bắt đầu bằng U_GL_ và role)
    // Để khi cập nhật tổ trưởng mới, các account cũ không bị lưu rác.
    const classStudentIds = students.filter(s => s.classId === classId).map(s => s.id);
    updatedUsers = updatedUsers.filter(u => !(
      u.role === UserRole.CLASS_MONITOR && 
      u.isGroupLeader && 
      u.id.startsWith("U_GL_") &&
      classStudentIds.includes(u.targetId || "")
    ));

    Object.entries(leaders).forEach(([groupName, leaderInfo]) => {
      if (!leaderInfo.studentId) return;
      const studentObj = students.find(s => s.id === leaderInfo.studentId);
      if (!studentObj) return;

      const rawUsername = (leaderInfo.username || `totruong_${leaderInfo.studentId}`).trim();
      const safeUsername = rawUsername.includes("@") ? rawUsername.split("@")[0] : rawUsername;
      const safeEmail = `${safeUsername}@tnu-hgc.edu.vn`;
      const passwordToSet = leaderInfo.password || "password123";
      
      updatedUsers.push({
        id: `U_GL_${leaderInfo.studentId}`,
        username: safeUsername,
        name: studentObj.name,
        role: UserRole.CLASS_MONITOR,
        email: safeEmail,
        targetId: leaderInfo.studentId,
        password: passwordToSet,
        isGroupLeader: true,
        groupInCharge: groupName
      });
    });

    setUsers(updatedUsers);
    saveToStorage("unihub_users", updatedUsers);

    const classStudentIdsToClean = students.filter(s => s.classId === classId).map(s => s.id);
    const oldUsersToDelete = users.filter(u => 
      u.role === UserRole.CLASS_MONITOR && 
      u.isGroupLeader && 
      u.id.startsWith("U_GL_") &&
      classStudentIdsToClean.includes(u.targetId || "")
    );
    
    const newUsersToSave = updatedUsers.filter(u => 
      u.role === UserRole.CLASS_MONITOR && 
      u.isGroupLeader && 
      u.id.startsWith("U_GL_") &&
      classStudentIdsToClean.includes(u.targetId || "")
    );

    (async () => {
      try {
        for (const u of oldUsersToDelete) {
          await deleteDoc(doc(db, "users", u.id)).catch(e => console.warn("Lỗi xoá GL cũ", e));
        }
        for (const u of newUsersToSave) {
          await setDoc(doc(db, "users", u.id), u).catch(e => console.warn("Lỗi lưu GL mới", e));
        }
      } catch (err) {
        console.error("Firestore sync error for group leaders:", err);
      }
    })();
  };

  const reportGroupAttendance = (reportData: Omit<GroupAttendanceReport, "id" | "reportedAt">) => {
    const report: GroupAttendanceReport = {
      ...reportData,
      id: `GR_ATT_${Date.now()}`,
      reportedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const filtered = groupAttendances.filter(ga => !(ga.classId === reportData.classId && ga.groupName === reportData.groupName && ga.date === reportData.date));
    const updated = [report, ...filtered];
    setGroupAttendances(updated);
    saveToStorage("unihub_group_attendances", updated);
  };

  const approveGroupAttendance = (reportId: string, reviewerName: string) => {
    const updated = groupAttendances.map(ga => {
      if (ga.id === reportId) {
        return {
          ...ga,
          status: "APPROVED" as const,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
        };
      }
      return ga;
    });
    setGroupAttendances(updated);
    saveToStorage("unihub_group_attendances", updated);
  };

  const rejectGroupAttendance = (reportId: string, reviewerName: string) => {
    const updated = groupAttendances.map(ga => {
      if (ga.id === reportId) {
        return {
          ...ga,
          status: "REJECTED" as const,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
        };
      }
      return ga;
    });
    setGroupAttendances(updated);
    saveToStorage("unihub_group_attendances", updated);
  };

  const submitGroupLeaderScore = (
    studentId: string, 
    scores: { studyPoints: number; violationPoints: number; extracurricularPoints: number; communityPoints: number; achievementPoints: number; totalPoints: number; comment?: string }
  ) => {
    const updatedResults = results.map(r => {
      if (r.studentId === studentId && r.periodId === period.id) {
        return {
          ...r,
          groupLeaderScore: {
            ...scores,
            approved: true,
            approvedAt: new Date().toISOString().split("T")[0]
          }
        };
      }
      return r;
    });
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);
  };

  const applyGroupLeaderScore = (studentId: string) => {
    const res = results.find(r => r.studentId === studentId && r.periodId === period.id);
    if (!res || !res.groupLeaderScore) return;
    
    const updatedResults = results.map(r => {
      if (r.studentId === studentId && r.periodId === period.id) {
        const gl = r.groupLeaderScore!;
        const newLogs = [
          ...r.logs,
          {
            criteriaId: "ALL",
            points: gl.totalPoints - r.totalPoints,
            reason: `Áp dụng điểm đề xuất từ Tổ trưởng: ${gl.comment || "Đồng thuận"}`,
            source: "BCS_DUYỆT",
            timestamp: new Date().toISOString().split("T")[0]
          }
        ];

        return {
          ...r,
          studyPoints: gl.studyPoints,
          violationPoints: gl.violationPoints,
          extracurricularPoints: gl.extracurricularPoints,
          communityPoints: gl.communityPoints,
          achievementPoints: gl.achievementPoints,
          totalPoints: gl.totalPoints,
          logs: newLogs
        };
      }
      return r;
    });
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);
    alert("Đã áp dụng toàn bộ điểm đề xuất của Tổ trưởng thành công!");
  };

  const aggregateGroupAttendancesToDaily = (classId: string, date: string, reporterName: string) => {
    const approvedReports = groupAttendances.filter(ga => ga.classId === classId && ga.date === date && ga.status === "APPROVED");
    if (approvedReports.length === 0) {
      alert("Không có báo cáo chuyên cần cấp Tổ nào đã được duyệt cho ngày này!");
      return;
    }

    const allAbsentees: { studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[] = [];
    const seenStudentIds = new Set<string>();

    approvedReports.forEach(r => {
      r.absentees.forEach(abs => {
        if (!seenStudentIds.has(abs.studentId)) {
          seenStudentIds.add(abs.studentId);
          allAbsentees.push(abs);
        }
      });
    });

    const totalStuds = students.filter(s => s.classId === classId).length;
    const absCount = allAbsentees.length;
    const presCount = totalStuds - absCount;

    const classReport: DailyAttendanceReport = {
      id: `DAR_${Date.now()}`,
      classId,
      date,
      totalStudents: totalStuds,
      presentCount: presCount,
      absentCount: absCount,
      absentees: allAbsentees,
      reportedBy: `${reporterName} (Tổng hợp từ Tổ)`,
      reportedAt: new Date().toISOString()
    };

    const filteredDaily = dailyAttendance.filter(da => !(da.classId === classId && da.date === date));
    const updatedDaily = [classReport, ...filteredDaily];
    setDailyAttendance(updatedDaily);
    saveToStorage("unihub_daily_attendance", updatedDaily);
  };

  const sendGroupReminder = (classId: string, targetStudentIds: string[], message: string) => {
    const newFeedbacks = targetStudentIds.map(sid => ({
      id: `FB_REMIND_${sid}_${Date.now()}_${Math.random()}`,
      fromRole: currentUser?.role || UserRole.CLASS_MONITOR,
      fromName: currentUser?.name || "Ban Cán sự Lớp",
      toClassId: classId,
      studentId: sid,
      comment: message,
      createdAt: new Date().toISOString().split("T")[0],
      resolved: false
    }));

    const updated = [...newFeedbacks, ...feedbacks];
    setFeedbacks(updated);
    saveToStorage("unihub_feedbacks", updated);
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

  const sendSystemFeedback = async (category: string, title: string, content: string) => {
    if (!currentUser) return;
    const fbId = "SF_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const feedback: SystemFeedback = {
      id: fbId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      category,
      title,
      content,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "systemFeedbacks", fbId), feedback);
    const updated = [feedback, ...systemFeedbacks];
    setSystemFeedbacks(updated);
    localStorage.setItem("unihub_system_feedbacks", JSON.stringify(updated));
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
      groupAttendances,
      systemFeedbacks,
      themeConfig,
      
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
      reviewEvidence,
      approveAdviserScores,
      submitAdviserAdjustment,
      lockFacultyData,
      approveFacultyScores,
      importGroupCriteria,
      approveAdminScores,
      sendFeedback,
      resolveFeedback,
      sendSystemFeedback,
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
      deleteUserAccount,
      
      saveGroupSettings,
      reportGroupAttendance,
      approveGroupAttendance,
      rejectGroupAttendance,
      submitGroupLeaderScore,
      applyGroupLeaderScore,
      aggregateGroupAttendancesToDaily,
      sendGroupReminder
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
