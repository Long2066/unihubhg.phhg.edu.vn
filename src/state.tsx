import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, 
  getDoc,
  getDocFromServer, 
  setDoc, 
  collection, 
  getDocs,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query,
  where
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
  isOrgRole,
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
  ThemeConfig,
  CourseClassAssignment,
  SubjectGradeSheet,
  GradeUnlockRequest,
  GradeAppeal,
  GradeAuditLog,
  GradingRulesConfig
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
  SEED_GROUP_ATTENDANCE,
  SEED_TEACHER_ASSIGNMENTS,
  SEED_SUBJECT_GRADES
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
  createActivity: (activity: Omit<ExtracurricularActivity, "id" | "status" | "orgName">) => Promise<string>;
  updateActivityStatus: (activityId: string, status: "UPCOMING" | "ONGOING" | "COMPLETED") => void;
  approveMemberRequest: (memberId: string) => void;
  rejectMemberRequest: (memberId: string) => void;
  assignMemberRole: (memberId: string, role: "CHỦ NHIỆM" | "BAN CHẤP HÀNH" | "ỦY VIÊN" | "THÀNH VIÊN") => void;
  updateAttendance: (attendanceId: string, attended: boolean, role?: "MEM" | "BTC" | "SUPPORTER") => void;
  addBulkAttendance: (activityId: string, studentIds: string[]) => void;
  
  // New clb actions
  createAnnouncement: (announcement: Omit<ClubAnnouncement, "id" | "orgName" | "createdAt">) => Promise<string>;
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
  renameClass: (oldClassId: string, newClassId: string) => void;
  deleteClass: (classId: string) => void;
  
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

  // Teacher & Subject Grade Actions
  teacherAssignments: CourseClassAssignment[];
  subjectGradeSheets: SubjectGradeSheet[];
  unlockRequests: GradeUnlockRequest[];
  gradeAppeals: GradeAppeal[];
  gradeAuditLogs: GradeAuditLog[];
  gradingRules: GradingRulesConfig;
  saveTeacherAssignments: (assignments: CourseClassAssignment[]) => void;
  importTeacherAssignmentsExcel: (assignments: CourseClassAssignment[]) => void;
  saveSubjectGradeSheet: (sheet: SubjectGradeSheet) => void;
  submitSubjectGradeSheet: (sheetId: string) => void;
  requestGradeUnlock: (request: Omit<GradeUnlockRequest, "id" | "requestedAt" | "status">) => void;
  approveUnlockRequest: (requestId: string) => void;
  rejectUnlockRequest: (requestId: string) => void;
  submitGradeAppeal: (appeal: Omit<GradeAppeal, "id" | "requestedAt" | "status">) => void;
  resolveGradeAppeal: (appealId: string, status: "UPDATED" | "REJECTED", newGrade?: string, response?: string) => void;
  addGradeAuditLog: (log: Omit<GradeAuditLog, "id" | "timestamp">) => void;
  updateGradingRules: (rules: GradingRulesConfig) => void;
  aggregateSubjectGradesToSemesterGpa: (semesterId: string) => { updatedCount: number; warningsCount: number };
  restoreAllDataBackup: (backupData: any) => Promise<void>;
  normalizeAllAccounts: () => void;
}

export const normalizeClassId = (classId: string | undefined | null): string => {
  if (!classId) return "";
  let str = String(classId).trim();
  return str.replace(/^(K\d+)[-_ ]+GDTH[-_ ]+([A-Z0-9]+)$/i, "$1-GDTH $2");
};

/**
 * Hàm chuẩn hóa tài khoản hệ thống sang đuôi @phhg.edu.vn
 * - Tài khoản hệ thống gốc trong SEED_USERS: cập nhật theo thông tin chuẩn
 * - Sinh viên: Tên đăng nhập là Mã SV, email đuôi @phhg.edu.vn
 * - Các tài khoản khác: bắt buộc chuẩn hóa đuôi @phhg.edu.vn
 */
export const normalizeUserAccount = (u: UserAccount): UserAccount => {
  if (!u) return u;

  // 1. Kiểm tra tài khoản mặc định của hệ thống trong SEED_USERS
  const defaultSeed = SEED_USERS.find(seed => seed.id === u.id);
  if (defaultSeed) {
    return {
      ...u,
      username: defaultSeed.username,
      email: defaultSeed.email,
      name: u.name || defaultSeed.name,
      role: defaultSeed.role,
      targetId: defaultSeed.targetId || u.targetId
    };
  }

  // 2. Sinh viên: username là Mã SV, email chuẩn hóa @phhg.edu.vn
  if (u.role === UserRole.STUDENT) {
    const rawUsername = (u.username || u.id || "").trim();
    const cleanStudentId = rawUsername.includes("@") ? rawUsername.split("@")[0] : rawUsername;
    
    let cleanEmail = (u.email || "").trim();
    if (cleanEmail) {
      cleanEmail = cleanEmail.replace(/@(hg\.edu\.vn|unihub\.edu\.vn|tnu-hgc\.edu\.vn)/gi, "@phhg.edu.vn");
    } else {
      cleanEmail = `${cleanStudentId.toLowerCase()}@phhg.edu.vn`;
    }

    return {
      ...u,
      username: cleanStudentId,
      email: cleanEmail
    };
  }

  // 3. Cán bộ, Giảng viên, Đơn vị, Ban cán sự: chuẩn hóa đuôi @phhg.edu.vn
  let cleanUsername = (u.username || "").trim();
  if (cleanUsername.includes("@")) {
    cleanUsername = cleanUsername.replace(/@(hg\.edu\.vn|unihub\.edu\.vn|tnu-hgc\.edu\.vn)/gi, "@phhg.edu.vn");
  } else if (cleanUsername) {
    cleanUsername = `${cleanUsername}@phhg.edu.vn`;
  }

  let cleanEmail = (u.email || "").trim();
  if (cleanEmail.includes("@")) {
    cleanEmail = cleanEmail.replace(/@(hg\.edu\.vn|unihub\.edu\.vn|tnu-hgc\.edu\.vn)/gi, "@phhg.edu.vn");
  } else if (cleanEmail) {
    cleanEmail = `${cleanEmail}@phhg.edu.vn`;
  } else {
    cleanEmail = cleanUsername;
  }

  return {
    ...u,
    username: cleanUsername,
    email: cleanEmail
  };
};

const UniHubContext = createContext<UniHubContextType | undefined>(undefined);

export const UniHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activePortletTab, setActivePortletTab] = useState<string>("TRANG_CHU");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("HOCKY_2_2025_2026");

  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
        case UserRole.STUDENT:
        case UserRole.GROUP_LEADER:
          setActivePortletTab("TRANG_CHU");
          break;
        case UserRole.ORGANIZER:
        case UserRole.CLUB_MANAGER:
        case UserRole.YOUTH_UNION:
        case UserRole.STUDENT_UNION:
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
        case UserRole.TEACHER:
          setActivePortletTab("TEACHER_GRADES");
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
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const cached = localStorage.getItem("unihub_users");
    let list: UserAccount[] = SEED_USERS;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }
    const normalized = list.map(normalizeUserAccount);
    try {
      localStorage.setItem("unihub_users", JSON.stringify(normalized));
    } catch {}
    return normalized;
  });

  const [criteria, setCriteria] = useState<PointCriteria[]>([]);
  const [students, setStudents] = useState<Student[]>(() => {
    const formatStudentId = (id: any) => {
      const str = String(id || "").trim();
      if (!str) return str;
      if (!str.toUpperCase().startsWith("DTG") && /^\d+$/.test(str)) {
        return `DTG${str}`;
      }
      return str;
    };

    const cached = localStorage.getItem("unihub_students");
    let list: Student[] = SEED_STUDENTS;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }
    return list.map((s: Student) => {
      const stdId = formatStudentId(s.id);
      let classId = normalizeClassId(s.classId);
      let facultyId = s.facultyId;
      let subjects = s.subjects;
      
      // Auto-correct Ma Văn Long (DTG245140202053) to K2-GDTH A & K-GDTH
      if (stdId === "DTG245140202053" && (classId === "K20-CNTT" || !classId || facultyId === "K-CNTT")) {
        classId = "K2-GDTH A";
        facultyId = "K-GDTH";
        subjects = "Phương pháp dạy học Toán, Phương pháp dạy học Tiếng Việt, Tâm lý học tiểu học";
      }

      return {
        ...s,
        id: stdId,
        classId,
        facultyId,
        subjects: subjects || s.subjects
      };
    });
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [activities, setActivities] = useState<ExtracurricularActivity[]>(() => {
    const cached = localStorage.getItem("unihub_activities");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });
  const [attendance, setAttendance] = useState<ActivityAttendance[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSubmission[]>([]);
  const [classReviews, setClassReviews] = useState<ClassReviewState[]>([]);
  const [facultyReviews, setFacultyReviews] = useState<FacultyReviewState[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);

  // Feature databases
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceReport[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(() => {
    const cached = localStorage.getItem("unihub_schedules");
    let list: ScheduleSlot[] = SEED_SCHEDULES;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }
    return list.map(item => ({
      ...item,
      classId: normalizeClassId(item.classId),
      className: normalizeClassId(item.className || item.classId)
    }));
  });
  const [groupAttendances, setGroupAttendances] = useState<GroupAttendanceReport[]>([]);
  const [customClasses, setCustomClasses] = useState<string[]>(() => {
    const cached = localStorage.getItem("unihub_custom_classes");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed.map(c => normalizeClassId(c));
      } catch {}
    }
    return [];
  });
  const [feedbacks, setFeedbacks] = useState<ScoreFeedback[]>([]);
  const [groupCriteria, setGroupCriteria] = useState<GroupEvaluationCriteria[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [systemFeedbacks, setSystemFeedbacks] = useState<SystemFeedback[]>([]);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const cached = localStorage.getItem("unihub_theme_config");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {}
    }
    return {};
  });

  const [teacherAssignments, setTeacherAssignments] = useState<CourseClassAssignment[]>(() => {
    const cached = localStorage.getItem("unihub_teacher_assignments");
    let list: CourseClassAssignment[] = SEED_TEACHER_ASSIGNMENTS;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }
    return list.map(item => ({
      ...item,
      classId: normalizeClassId(item.classId),
      className: normalizeClassId(item.className || item.classId)
    }));
  });

  const [subjectGradeSheets, setSubjectGradeSheets] = useState<SubjectGradeSheet[]>(() => {
    const cached = localStorage.getItem("unihub_subject_grade_sheets");
    let list: SubjectGradeSheet[] = SEED_SUBJECT_GRADES;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {}
    }
    return list.map(item => ({
      ...item,
      classId: normalizeClassId(item.classId)
    }));
  });

  const [unlockRequests, setUnlockRequests] = useState<GradeUnlockRequest[]>(() => {
    const cached = localStorage.getItem("unihub_unlock_requests");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [gradeAppeals, setGradeAppeals] = useState<GradeAppeal[]>(() => {
    const cached = localStorage.getItem("unihub_grade_appeals");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [gradeAuditLogs, setGradeAuditLogs] = useState<GradeAuditLog[]>(() => {
    const cached = localStorage.getItem("unihub_grade_audit_logs");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  const [gradingRules, setGradingRules] = useState<GradingRulesConfig>(() => {
    const cached = localStorage.getItem("unihub_grading_rules");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {}
    }
    return {
      ccWeight: 10,
      processWeight: 30,
      examWeight: 60,
      roundingDecimals: 1,
      passScoreMin10: 4.0
    };
  });

  const persistTeacherAssignmentsToFirestore = (assignments: (CourseClassAssignment & { teacherPassword?: string })[]) => {
    assignments.forEach(assign => {
      if (!assign?.id) return;
      const { teacherPassword, ...cleanAssignment } = assign as any;
      const payload = {
        ...cleanAssignment,
        updatedAt: assign.updatedAt || new Date().toISOString()
      };
      setDoc(doc(db, "teacherAssignments", assign.id), payload, { merge: true })
        .catch(e => console.warn("Lỗi lưu phân công giảng dạy Firestore:", e));
    });
  };

  const provisionTeacherAccounts = (assignments: (CourseClassAssignment & { teacherPassword?: string })[]) => {
    setUsers(prevUsers => {
      let updated = false;
      const nextUsers = [...prevUsers];

      assignments.forEach(assign => {
        if (!assign.teacherName) return;
        const teacherEmail = (assign.teacherId || assign.teacherName.toLowerCase().replace(/[^a-z0-9]/g, "") + "@phhg.edu.vn").trim();

        // Check if account already exists
        const existingIdx = nextUsers.findIndex(u => 
          (u.email && u.email.toLowerCase() === teacherEmail.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === teacherEmail.toLowerCase()) ||
          (u.name && u.name.trim().toLowerCase() === assign.teacherName.trim().toLowerCase() && u.role === UserRole.TEACHER)
        );

        if (existingIdx >= 0) {
          const curr = nextUsers[existingIdx];
          let userChanged = false;
          const updatedUser = { ...curr };

          // Enforce UserRole.TEACHER for non-admin/non-training accounts
          if (curr.role === UserRole.ADMIN || curr.role === UserRole.TRAINING_DEPT) {
            // Keep administrative privileges intact
          } else if (curr.role === UserRole.FACULTY) {
            // Keep faculty privileges intact
          } else if (curr.role === UserRole.ADVISER) {
            // Keep adviser privileges intact
          } else if (curr.role === UserRole.STUDENT || curr.role === UserRole.CLASS_MONITOR) {
            // Protect student accounts from role alteration
          } else if (curr.role !== UserRole.TEACHER) {
            updatedUser.role = UserRole.TEACHER;
            userChanged = true;
          }

          if (userChanged) {
            nextUsers[existingIdx] = updatedUser;
            updated = true;
          }
        } else {
          const newAccount: UserAccount = {
            id: `U_TEACHER_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            username: teacherEmail,
            name: assign.teacherName,
            role: UserRole.TEACHER,
            email: teacherEmail,
            targetId: assign.subjectCode
          };
          nextUsers.push(newAccount);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem("unihub_users", JSON.stringify(nextUsers));
        try {
          nextUsers.forEach(u => {
            if (u.role === UserRole.TEACHER) {
              setDoc(doc(db, "users", u.id), sanitizeForFirestore(u), { merge: true }).catch(() => {});
            }
          });
        } catch {}
      }
      return nextUsers;
    });
  };

  useEffect(() => {
    const listToSync = teacherAssignments && teacherAssignments.length > 0 ? teacherAssignments : SEED_TEACHER_ASSIGNMENTS;
    if (!teacherAssignments || teacherAssignments.length === 0) {
      setTeacherAssignments(SEED_TEACHER_ASSIGNMENTS);
    }
    provisionTeacherAccounts(listToSync);
    persistTeacherAssignmentsToFirestore(listToSync);
  }, []);

  const saveTeacherAssignments = (assignments: CourseClassAssignment[]) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to save teacher assignments");
      return;
    }
    const seen = new Set<string>();
    const sanitized = (assignments || []).filter(a => {
      if (!a || !a.classId || !a.subjectCode || !a.semesterId) return false;
      const key = `${a.semesterId}::${normalizeClassId(a.classId)}::${a.subjectCode.trim().toUpperCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(a => ({
      ...a,
      classId: normalizeClassId(a.classId),
      subjectCode: a.subjectCode.trim(),
      credits: Math.max(1, Math.min(20, Math.round(Number(a.credits) || 3)))
    }));

    setTeacherAssignments(sanitized);
    localStorage.setItem("unihub_teacher_assignments", JSON.stringify(sanitized));
    persistTeacherAssignmentsToFirestore(sanitized);
    provisionTeacherAccounts(sanitized);
  };

  const importTeacherAssignmentsExcel = (newAssignments: (CourseClassAssignment & { teacherPassword?: string })[]) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to import teacher assignments");
      return;
    }
    setTeacherAssignments(prev => {
      const merged = [...prev];
      newAssignments.forEach(item => {
        const idx = merged.findIndex(a => a.semesterId === item.semesterId && a.classId === item.classId && a.subjectCode === item.subjectCode);
        if (idx >= 0) {
          merged[idx] = item;
        } else {
          merged.push(item);
        }
      });
      localStorage.setItem("unihub_teacher_assignments", JSON.stringify(merged));
      persistTeacherAssignmentsToFirestore(newAssignments);
      return merged;
    });
    provisionTeacherAccounts(newAssignments);
  };

  const addGradeAuditLog = (log: Omit<GradeAuditLog, "id" | "timestamp">) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT && currentUser.role !== UserRole.TEACHER)) {
      console.warn("Unauthorized attempt to add grade audit log");
      return;
    }
    const item: GradeAuditLog = {
      ...log,
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setGradeAuditLogs(prev => {
      const next = [item, ...prev];
      localStorage.setItem("unihub_grade_audit_logs", JSON.stringify(next));
      return next;
    });
  };

  const updateGradingRules = (rules: GradingRulesConfig) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to update grading rules");
      return;
    }
    if (isNaN(rules.ccWeight) || isNaN(rules.processWeight) || isNaN(rules.examWeight)) {
      console.warn("Invalid grading rule weights");
      return;
    }
    const safeRules: GradingRulesConfig = {
      ...rules,
      ccWeight: Math.max(0, Math.min(100, Math.round(Number(rules.ccWeight) || 10))),
      processWeight: Math.max(0, Math.min(100, Math.round(Number(rules.processWeight) || 30))),
      examWeight: Math.max(0, Math.min(100, Math.round(Number(rules.examWeight) || 60))),
      roundingDecimals: Math.max(0, Math.min(4, Math.round(Number(rules.roundingDecimals) || 1))),
      passScoreMin10: Math.max(0, Math.min(10, Math.round((Number(rules.passScoreMin10) || 4.0) * 10) / 10))
    };
    setGradingRules(safeRules);
    localStorage.setItem("unihub_grading_rules", JSON.stringify(safeRules));
  };

  const aggregateSubjectGradesToSemesterGpa = (semesterId: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT && currentUser.role !== UserRole.TEACHER)) {
      console.warn("Unauthorized attempt to aggregate grades");
      return { updatedCount: 0, warningsCount: 0 };
    }
    const validSheets = subjectGradeSheets.filter(s => s.semesterId === semesterId && (s.status === "SUBMITTED" || s.status === "LOCKED"));

    let updatedCount = 0;
    let warningsCount = 0;

    setStudents(prevStudents => {
      return prevStudents.map(student => {
        const studentGradesInSemester: { credits: number; tb10: number; tb4: number; isPass: boolean }[] = [];

        validSheets.forEach(sheet => {
          const match = sheet.grades.find(g => g.studentId === student.id);
          if (match && match.tb10 !== undefined && match.tb10 !== "" && match.tb10 !== "-") {
            const tb10 = parseFloat(String(match.tb10));
            const tb4 = parseFloat(String(match.tb4)) || 0;
            if (!isNaN(tb10)) {
              studentGradesInSemester.push({
                credits: sheet.credits || 2,
                tb10,
                tb4,
                isPass: tb10 >= gradingRules.passScoreMin10
              });
            }
          }
        });

        if (studentGradesInSemester.length === 0) {
          return student;
        }

        updatedCount++;

        let totalCredits = 0;
        let earnedCredits = 0;
        let weightedScore10Sum = 0;
        let weightedScore4Sum = 0;

        studentGradesInSemester.forEach(g => {
          totalCredits += g.credits;
          weightedScore10Sum += g.tb10 * g.credits;
          weightedScore4Sum += g.tb4 * g.credits;
          if (g.isPass) {
            earnedCredits += g.credits;
          }
        });

        const semGpa10 = Math.round((weightedScore10Sum / (totalCredits || 1)) * 100) / 100;
        const semGpa4 = Math.round((weightedScore4Sum / (totalCredits || 1)) * 100) / 100;

        let academicGrade = "Trung bình";
        if (semGpa10 >= 9.0) academicGrade = "Xuất sắc";
        else if (semGpa10 >= 8.0) academicGrade = "Giỏi";
        else if (semGpa10 >= 6.5) academicGrade = "Khá";
        else if (semGpa10 >= 5.0) academicGrade = "Trung bình";
        else if (semGpa10 >= 4.0) academicGrade = "Yếu";
        else academicGrade = "Kém";

        const failedCredits = totalCredits - earnedCredits;
        const failedRatio = totalCredits > 0 ? failedCredits / totalCredits : 0;

        let learningWarning = false;
        let learningStatus = "Bình thường";

        if (semGpa4 < 0.8 || failedRatio > 0.6) {
          learningWarning = true;
          learningStatus = "Bị cảnh báo (Mức 2)";
          warningsCount++;
        } else if (semGpa4 < 1.0 || failedRatio > 0.5) {
          learningWarning = true;
          learningStatus = "Bị cảnh báo (Mức 1)";
          warningsCount++;
        }

        const existingPeriodData = student.academicDataByPeriod || {};
        const periodData = {
          gpa: semGpa4,
          gpa10: semGpa10,
          creditsEarned: (student.creditsEarned || 0) + earnedCredits,
          learningWarning,
          learningStatus,
          academicGrade,
          updatedAt: new Date().toISOString().split("T")[0]
        };

        return {
          ...student,
          gpa: semGpa4,
          gpa10: semGpa10,
          accumulatedCredits: (student.accumulatedCredits || 0) + earnedCredits,
          learningWarning,
          learningStatus,
          academicGrade,
          academicDataByPeriod: {
            ...existingPeriodData,
            [semesterId]: periodData
          }
        };
      });
    });

    return { updatedCount, warningsCount };
  };

  const saveSubjectGradeSheet = (sheet: SubjectGradeSheet) => {
    if (!currentUser) return;
    const isAcademicAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINING_DEPT;
    const isTeacher = currentUser.role === UserRole.TEACHER;
    if (!isAcademicAdmin && !isTeacher) {
      console.warn("Unauthorized attempt to save subject grade sheet");
      return;
    }

    const existingSheet = subjectGradeSheets.find(s => s.id === sheet.id);
    if (isTeacher) {
      const targetTid = (existingSheet?.teacherId || sheet.teacherId || "").toLowerCase();
      if (!targetTid) {
        console.warn("Missing teacherId on grade sheet");
        return;
      }
      const match = (currentUser.email && targetTid === currentUser.email.toLowerCase()) ||
                    (currentUser.id && targetTid === currentUser.id.toLowerCase()) ||
                    (currentUser.username && targetTid === currentUser.username.toLowerCase()) ||
                    (currentUser.targetId && targetTid === currentUser.targetId.toLowerCase());
      if (!match) {
        console.warn("Unauthorized attempt to save another teacher's grade sheet");
        return;
      }
      if (existingSheet && (existingSheet.status === "LOCKED" || existingSheet.status === "SUBMITTED")) {
        console.warn("Cannot edit submitted or locked grade sheet without unlock approval");
        return;
      }
    }

    const sanitizeGradeNum = (val: any) => {
      if (val === undefined || val === null || val === "" || val === "-") return val;
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return !isNaN(num) ? Math.max(0, Math.min(10, Math.round(num * 10) / 10)) : val;
    };

    const sanitizedGrades = (sheet.grades || []).map(g => {
      const safeTb4 = typeof g.tb4 === "number" ? Math.max(0, Math.min(4, Math.round(g.tb4 * 100) / 100)) : g.tb4;
      return {
        ...g,
        cc: sanitizeGradeNum(g.cc),
        tx1: sanitizeGradeNum(g.tx1),
        tx2: sanitizeGradeNum(g.tx2),
        dk1: sanitizeGradeNum(g.dk1),
        dk2: sanitizeGradeNum(g.dk2),
        exam: sanitizeGradeNum((g as any).exam),
        thi: sanitizeGradeNum((g as any).thi),
        tb10: sanitizeGradeNum(g.tb10),
        tb4: safeTb4
      };
    });

    const safeSheet: SubjectGradeSheet = {
      ...sheet,
      teacherId: (isTeacher && !isAcademicAdmin && existingSheet) ? existingSheet.teacherId : sheet.teacherId,
      status: (isAcademicAdmin || !existingSheet) ? sheet.status : existingSheet.status,
      grades: sanitizedGrades,
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    setSubjectGradeSheets(prev => {
      const idx = prev.findIndex(s => s.id === sheet.id);
      let next: SubjectGradeSheet[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = safeSheet;
      } else {
        next = [safeSheet, ...prev];
      }
      localStorage.setItem("unihub_subject_grade_sheets", JSON.stringify(next));
      saveToFirestore("unihub_subject_grade_sheets", next);
      return next;
    });
  };

  const submitSubjectGradeSheet = (sheetId: string) => {
    if (!currentUser) return;
    const isAcademicAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINING_DEPT;
    const isTeacher = currentUser.role === UserRole.TEACHER;
    if (!isAcademicAdmin && !isTeacher) {
      console.warn("Unauthorized attempt to submit subject grade sheet");
      return;
    }
    const sheet = subjectGradeSheets.find(s => s.id === sheetId);
    if (!sheet) return;

    if (isTeacher) {
      const tid = (sheet.teacherId || "").toLowerCase();
      const match = (currentUser.email && tid === currentUser.email.toLowerCase()) ||
                    (currentUser.id && tid === currentUser.id.toLowerCase()) ||
                    (currentUser.username && tid === currentUser.username.toLowerCase()) ||
                    (currentUser.targetId && tid === currentUser.targetId.toLowerCase());
      if (!match) {
        console.warn("Unauthorized attempt to submit another teacher's grade sheet");
        return;
      }
      if (sheet.status === "LOCKED") {
        console.warn("Grade sheet is already locked");
        return;
      }
    }

    setSubjectGradeSheets(prev => {
      const next = prev.map(s => {
        if (s.id === sheetId) {
          return {
            ...s,
            status: "SUBMITTED" as const,
            submittedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
          };
        }
        return s;
      });
      localStorage.setItem("unihub_subject_grade_sheets", JSON.stringify(next));
      saveToFirestore("unihub_subject_grade_sheets", next);
      return next;
    });
  };

  const requestGradeUnlock = (req: Omit<GradeUnlockRequest, "id" | "requestedAt" | "status">) => {
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINING_DEPT || currentUser.role === UserRole.TEACHER;
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to request grade unlock");
      return;
    }
    const cleanReason = (req.reason || "").trim();
    if (!cleanReason) {
      console.warn("Unlock request reason cannot be empty");
      return;
    }
    const pendingExists = unlockRequests.some(ur => ur.sheetId === req.sheetId && ur.status === "PENDING");
    if (pendingExists) {
      console.warn("A pending unlock request already exists for this grade sheet");
      return;
    }
    const sheet = subjectGradeSheets.find(s => s.id === req.sheetId);
    if (!sheet) {
      console.warn("Cannot request grade unlock: grade sheet not found");
      return;
    }
    if (currentUser.role === UserRole.TEACHER) {
      const tid = (sheet.teacherId || req.teacherId || "").toLowerCase();
      const match = (currentUser.email && tid === currentUser.email.toLowerCase()) ||
                    (currentUser.id && tid === currentUser.id.toLowerCase()) ||
                    (currentUser.username && tid === currentUser.username.toLowerCase()) ||
                    (currentUser.targetId && tid === currentUser.targetId.toLowerCase());
      if (!match) {
        console.warn("Unauthorized attempt to request unlock for another teacher's grade sheet");
        return;
      }
    }

    const newReq: GradeUnlockRequest = {
      ...req,
      reason: cleanReason,
      id: `REQ_${Date.now()}`,
      requestedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      status: "PENDING"
    };
    setUnlockRequests(prev => {
      const next = [newReq, ...prev];
      localStorage.setItem("unihub_unlock_requests", JSON.stringify(next));
      return next;
    });
  };

  const approveUnlockRequest = (requestId: string) => {
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINING_DEPT || currentUser.role === UserRole.FACULTY;
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to approve unlock request");
      return;
    }

    const req = unlockRequests.find(r => r.id === requestId);
    if (!req) return;
    if (currentUser.role === UserRole.FACULTY) {
      if (!currentUser.targetId) {
        console.warn("Unauthorized attempt by unassigned faculty to approve unlock request");
        return;
      }
      const isFacultyClass = students.some(s => s.classId === req.classId && s.facultyId === currentUser.targetId);
      if (!isFacultyClass) {
        console.warn("Unauthorized attempt by faculty to approve unlock request for another faculty");
        return;
      }
    }

    setSubjectGradeSheets(prev => {
      const next = prev.map(s => s.id === req.sheetId ? { ...s, status: "UNLOCKED" as const } : s);
      localStorage.setItem("unihub_subject_grade_sheets", JSON.stringify(next));
      return next;
    });
    setUnlockRequests(prev => {
      const next = prev.map(r => r.id === requestId ? { ...r, status: "APPROVED" as const, reviewedAt: new Date().toISOString().replace("T", " ").substring(0, 19) } : r);
      localStorage.setItem("unihub_unlock_requests", JSON.stringify(next));
      return next;
    });
  };

  const rejectUnlockRequest = (requestId: string) => {
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINING_DEPT || currentUser.role === UserRole.FACULTY;
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to reject unlock request");
      return;
    }

    const req = unlockRequests.find(r => r.id === requestId);
    if (!req) return;
    if (currentUser.role === UserRole.FACULTY) {
      if (!currentUser.targetId) {
        console.warn("Unauthorized attempt by unassigned faculty to reject unlock request");
        return;
      }
      const isFacultyClass = students.some(s => s.classId === req.classId && s.facultyId === currentUser.targetId);
      if (!isFacultyClass) {
        console.warn("Unauthorized attempt by faculty to reject unlock request for another faculty");
        return;
      }
    }

    setUnlockRequests(prev => {
      const next = prev.map(r => r.id === requestId ? { ...r, status: "REJECTED" as const, reviewedAt: new Date().toISOString().replace("T", " ").substring(0, 19) } : r);
      localStorage.setItem("unihub_unlock_requests", JSON.stringify(next));
      return next;
    });
  };

  const submitGradeAppeal = (appeal: Omit<GradeAppeal, "id" | "requestedAt" | "status">) => {
    if (!currentUser) return;
    if (currentUser.role !== UserRole.STUDENT && currentUser.role !== UserRole.ADMIN) {
      console.warn("Only students or administrators can submit grade appeals");
      return;
    }

    const cleanReason = (appeal.reason || "").trim();
    if (!cleanReason) {
      alert("Vui lòng nhập lý do đề nghị phúc khảo điểm môn học!");
      return;
    }
    const cleanSubjectCode = (appeal.subjectCode || "").trim();
    if (!cleanSubjectCode) {
      alert("Vui lòng chọn môn học cần đề nghị phúc khảo!");
      return;
    }

    const effectiveStudentId = currentUser.role === UserRole.STUDENT
      ? (currentUser.targetId || currentUser.username)
      : appeal.studentId;

    if (currentUser.role === UserRole.STUDENT && currentUser.targetId && currentUser.targetId !== appeal.studentId) {
      console.warn("Unauthorized grade appeal submission for another student");
      return;
    }

    const hasPendingAppeal = gradeAppeals.some(a => a.studentId === effectiveStudentId && a.subjectCode === appeal.subjectCode && a.status === "PENDING");
    if (hasPendingAppeal) {
      alert("Bạn đã có đơn phúc khảo đang chờ xử lý cho môn học này!");
      return;
    }

    const targetStudent = students.find(s => s.id === effectiveStudentId);
    const resolvedClassId = targetStudent?.classId || appeal.classId || "";
    const resolvedStudentName = targetStudent?.name || appeal.studentName || "Sinh viên";
    const matchedSheet = subjectGradeSheets.find(s => 
      s.semesterId === (appeal.semesterId || selectedSemesterId) && 
      normalizeClassId(s.classId) === normalizeClassId(resolvedClassId) && 
      s.subjectCode.toUpperCase() === cleanSubjectCode.toUpperCase()
    );

    const newAppeal: GradeAppeal = {
      ...appeal,
      studentId: effectiveStudentId,
      studentName: resolvedStudentName,
      classId: resolvedClassId,
      sheetId: matchedSheet?.id || appeal.sheetId,
      reason: cleanReason,
      id: `APPL_${Date.now()}`,
      requestedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      status: "PENDING"
    };
    setGradeAppeals(prev => {
      const next = [newAppeal, ...prev];
      localStorage.setItem("unihub_grade_appeals", JSON.stringify(next));
      return next;
    });
  };

  const resolveGradeAppeal = (appealId: string, status: "UPDATED" | "REJECTED", newGrade?: string, response?: string) => {
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TRAINING_DEPT || currentUser.role === UserRole.TEACHER;
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to resolve grade appeal");
      return;
    }
    const appeal = gradeAppeals.find(a => a.id === appealId);
    if (!appeal) return;

    if (currentUser.role === UserRole.TEACHER) {
      const sheet = subjectGradeSheets.find(s => s.id === appeal.sheetId || s.subjectCode === appeal.subjectCode);
      if (!sheet || !sheet.teacherId) {
        console.warn("Cannot resolve appeal: associated subject grade sheet or teacher not found");
        return;
      }
      const tid = sheet.teacherId.toLowerCase();
      const match = (currentUser.email && tid === currentUser.email.toLowerCase()) ||
                    (currentUser.id && tid === currentUser.id.toLowerCase()) ||
                    (currentUser.username && tid === currentUser.username.toLowerCase()) ||
                    (currentUser.targetId && tid === currentUser.targetId.toLowerCase());
      if (!match) {
        console.warn("Unauthorized attempt to resolve another teacher's grade appeal");
        return;
      }
    }

    let targetSemesterId = "HOCKY_2_2025_2026";
    let targetStudentId = "";
    let targetSubjectCode = "";

    setGradeAppeals(prev => {
      const next = prev.map(a => {
        if (a.id === appealId) {
          targetSemesterId = a.semesterId || targetSemesterId;
          targetStudentId = a.studentId;
          targetSubjectCode = a.subjectCode;
          return {
            ...a,
            status,
            newGrade: newGrade || a.newGrade,
            response: response || a.response,
            resolvedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
          };
        }
        return a;
      });
      localStorage.setItem("unihub_grade_appeals", JSON.stringify(next));
      saveToFirestore("unihub_grade_appeals", next);
      return next;
    });

    if (status === "UPDATED" && newGrade) {
      const parsedNum = parseFloat(newGrade.trim());
      if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 10) {
        setSubjectGradeSheets(prevSheets => {
          const nextSheets = prevSheets.map(sheet => {
            if (sheet.subjectCode === targetSubjectCode || (targetSubjectCode && sheet.subjectName.toLowerCase().includes(targetSubjectCode.toLowerCase()))) {
              const updatedGrades = sheet.grades.map(g => {
                if (g.studentId === targetStudentId) {
                  const tb10 = Math.max(0, Math.min(10, Math.round(parsedNum * 10) / 10));
                  const passMin = gradingRules?.passScoreMin10 ?? 4.0;
                  const tb4 = tb10 >= 8.5 ? 4.0 : tb10 >= 7.0 ? 3.0 : tb10 >= 5.5 ? 2.0 : tb10 >= passMin ? 1.0 : 0;
                  const letter = tb10 >= 8.5 ? "A" : tb10 >= 7.0 ? "B" : tb10 >= 5.5 ? "C" : tb10 >= passMin ? "D" : "F";
                  const rank = tb10 >= 9.0 ? "Xuất sắc" : tb10 >= 8.0 ? "Giỏi" : tb10 >= 6.5 ? "Khá" : tb10 >= 5.0 ? "Trung bình" : "Yếu";
                  return {
                    ...g,
                    tb10: tb10,
                    tb4: tb4,
                    diemChu: letter,
                    xepLoai: rank
                  };
                }
                return g;
              });
              return { ...sheet, grades: updatedGrades };
            }
            return sheet;
          });
          localStorage.setItem("unihub_subject_grade_sheets", JSON.stringify(nextSheets));
          saveToFirestore("unihub_subject_grade_sheets", nextSheets);
          return nextSheets;
        });

        // Auto-recalculate semester GPA & Academic Standing
        aggregateSubjectGradesToSemesterGpa(targetSemesterId);
      }
    }
  };

  // Keep only lightweight session/UI preferences in localStorage. Business data is
  // loaded from Firestore to avoid stale browser cache overriding the database.
  useEffect(() => {
    const cachedCustomClasses = localStorage.getItem("unihub_custom_classes");
    if (cachedCustomClasses) {
      try {
        const parsed = JSON.parse(cachedCustomClasses);
        if (Array.isArray(parsed)) setCustomClasses(parsed);
      } catch {}
    }
  }, []);

  // Clean up any insecure impersonate query parameter from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("impersonate")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("impersonate");
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }
  }, []);

  const cacheCollection = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T[]>>, sorter?: (items: T[]) => T[]) => {
    return onSnapshot(
      collection(db, key),
      (snap) => {
        const list = snap.docs.map(d => d.data() as T);
        const normalized = sorter ? sorter(list) : list;
        if (normalized.length > 0) {
          setter(prev => {
            const merged = [...prev];
            normalized.forEach(item => {
              const itemId = (item as any).id || (item as any).studentId || (item as any).username;
              if (itemId) {
                const idx = merged.findIndex(p => 
                  ((p as any).id && (p as any).id === itemId) ||
                  ((p as any).studentId && (p as any).studentId === itemId) ||
                  ((p as any).username && (p as any).username === itemId)
                );
                if (idx >= 0) merged[idx] = item;
                else merged.push(item);
              } else {
                merged.push(item);
              }
            });
            const finalResult = merged.length > 0 ? merged : normalized;
            localStorage.setItem(`unihub_${key}`, JSON.stringify(finalResult));
            return finalResult;
          });
        } else {
          // If snapshot returns empty, preserve existing state to protect local data from getting wiped
          setter(prev => {
            if (prev.length > 0) {
              console.warn(`Firestore snapshot returned empty for ${key}, preserving ${prev.length} existing items in state.`);
              return prev;
            }
            return prev;
          });
        }
      },
      (error) => console.warn(`Firestore listener failed for ${key}:`, error)
    );
  };

  // Realtime Firestore hydration: database is the source of truth for all core modules.
  useEffect(() => {
    const unsubscribers = [
      cacheCollection<UserAccount>("users", setUsers),
      cacheCollection<Student>("students", setStudents),
      cacheCollection<CourseClassAssignment>("teacherAssignments", setTeacherAssignments),
      cacheCollection<SubjectGradeSheet>("subjectGradeSheets", setSubjectGradeSheets),
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
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        let found = users.find(u => 
          (u.email && authUser.email && u.email.toLowerCase() === authUser.email.toLowerCase()) || 
          u.id === authUser.uid
        );
        if (!found && authUser.uid) {
          try {
            const userDocSnap = await getDoc(doc(db, "users", authUser.uid));
            if (userDocSnap.exists()) {
              found = userDocSnap.data() as UserAccount;
            }
          } catch {}
        }
        if (!found && authUser.email) {
          const emailLower = authUser.email.toLowerCase();
          const foundStudent = students.find(s => 
            (s.email && s.email.toLowerCase() === emailLower) ||
            `${s.id.toLowerCase()}@phhg.edu.vn` === emailLower ||
            `${s.id.toLowerCase()}@unihub.edu.vn` === emailLower ||
            `${s.id.toLowerCase()}@hg.edu.vn` === emailLower
          );
          if (foundStudent) {
            found = {
              id: `U_STUD_${foundStudent.id}`,
              username: foundStudent.id,
              name: foundStudent.name,
              role: UserRole.STUDENT,
              targetId: foundStudent.id,
              email: authUser.email
            };
          }
        }
        if (found) {
          const { password, ...safeUser } = found as any;
          setCurrentUser(safeUser as UserAccount);
          localStorage.setItem("unihub_current_user", JSON.stringify(safeUser));
        } else {
          // A6 FIX: Không tự tạo fallback user nếu user không có danh tính trong hệ thống
          // User chưa được cấp phép → sign out
          console.warn("Firebase Auth user không có profile trong hệ thống, đăng xuất:", authUser.email);
          signOut(auth).catch(() => {});
          setCurrentUser(null);
          localStorage.removeItem("unihub_current_user");
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem("unihub_current_user");
      }
    });
    return () => unsubscribe();
  }, [users, students]);

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

  // Load data from Firebase Firestore with Smart Non-Destructive Merge (Never wipe local data)
  const loadFromFirestore = async () => {
    try {
      // Helper: Smart merge list with local storage items
      const smartMerge = <T,>(cloudList: T[], storageKey: string, idResolver: (item: T) => string): T[] => {
        let localList: T[] = [];
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) localList = parsed;
          }
        } catch {}

        const mergedMap = new Map<string, T>();
        // 1. Put local items into map first
        localList.forEach(item => {
          const id = idResolver(item);
          if (id) mergedMap.set(id, item);
        });
        // 2. Overlay cloud items (cloud has latest updates)
        cloudList.forEach(item => {
          const id = idResolver(item);
          if (id) mergedMap.set(id, item);
          else mergedMap.set(`gen_${Math.random()}`, item);
        });

        const result = Array.from(mergedMap.values());
        localStorage.setItem(storageKey, JSON.stringify(result));
        return result;
      };

      // 1. Get Users
      const usersSnap = await getDocs(collection(db, "users"));
      if (!usersSnap.empty) {
        const list: UserAccount[] = [];
        usersSnap.forEach(d => list.push(normalizeUserAccount(d.data() as UserAccount)));
        const merged = smartMerge(list, "unihub_users", u => u.id || u.username || u.email);
        const normalizedMerged = merged.map(normalizeUserAccount);
        setUsers(normalizedMerged);
        localStorage.setItem("unihub_users_backup", JSON.stringify(normalizedMerged));
        localStorage.setItem("unihub_users", JSON.stringify(normalizedMerged));
      }
      
      // 2. Get Students
      const studsSnap = await getDocs(collection(db, "students"));
      if (!studsSnap.empty) {
        const list: Student[] = [];
        studsSnap.forEach(d => list.push(d.data() as Student));
        const merged = smartMerge(list, "unihub_students", s => s.id);
        setStudents(merged);
        localStorage.setItem("unihub_students_backup", JSON.stringify(merged));
      }

      // 3. Get Organizations
      const orgsSnap = await getDocs(collection(db, "organizations"));
      if (!orgsSnap.empty) {
        const list: Organization[] = [];
        orgsSnap.forEach(d => list.push(d.data() as Organization));
        const merged = smartMerge(list, "unihub_organizations", o => o.id);
        setOrganizations(merged);
      }

      // 4. Get Activities
      const actsSnap = await getDocs(collection(db, "activities"));
      if (!actsSnap.empty) {
        const list: ExtracurricularActivity[] = [];
        actsSnap.forEach(d => list.push(d.data() as ExtracurricularActivity));
        const merged = smartMerge(list, "unihub_activities", a => a.id);
        setActivities(merged);
      }

      // 5. Get Attendance
      const attsSnap = await getDocs(collection(db, "attendance"));
      if (!attsSnap.empty) {
        const list: ActivityAttendance[] = [];
        attsSnap.forEach(d => list.push(d.data() as ActivityAttendance));
        const merged = smartMerge(list, "unihub_attendance", a => a.id);
        setAttendance(merged);
      }

      // 6. Get Evidence
      const evsSnap = await getDocs(collection(db, "evidence"));
      if (!evsSnap.empty) {
        const list: EvidenceSubmission[] = [];
        evsSnap.forEach(d => list.push(d.data() as EvidenceSubmission));
        const merged = smartMerge(list, "unihub_evidence", e => e.id);
        setEvidence(merged);
      }

      // 7. Get Results
      const resSnap = await getDocs(collection(db, "results"));
      if (!resSnap.empty) {
        const list: EvaluationResult[] = [];
        resSnap.forEach(d => list.push(d.data() as EvaluationResult));
        const merged = smartMerge(list, "unihub_results", r => `${r.studentId}_${r.periodId}`);
        setResults(merged);
      }

      // 8. Get Daily Attendance
      const daSnap = await getDocs(collection(db, "dailyAttendance"));
      if (!daSnap.empty) {
        const list: DailyAttendanceReport[] = [];
        daSnap.forEach(d => list.push(d.data() as DailyAttendanceReport));
        const merged = smartMerge(list, "unihub_daily_attendance", d => d.id);
        setDailyAttendance(merged);
      }

      // 9. Get Members
      const membersSnap = await getDocs(collection(db, "members"));
      if (!membersSnap.empty) {
        const list: OrganizationMember[] = [];
        membersSnap.forEach(d => list.push(d.data() as OrganizationMember));
        const merged = smartMerge(list, "unihub_members", m => m.id);
        setMembers(merged);
      }

      // 10. Get Announcements
      const annSnap = await getDocs(collection(db, "announcements"));
      if (!annSnap.empty) {
        const list: ClubAnnouncement[] = [];
        annSnap.forEach(d => list.push(d.data() as ClubAnnouncement));
        const merged = smartMerge(list, "unihub_announcements", a => a.id);
        setAnnouncements(merged);
      }

      // 11. Get System Feedbacks
      const sysFeedSnap = await getDocs(collection(db, "systemFeedbacks"));
      if (!sysFeedSnap.empty) {
        const list: SystemFeedback[] = [];
        sysFeedSnap.forEach(d => list.push(d.data() as SystemFeedback));
        const merged = smartMerge(list, "unihub_system_feedbacks", f => f.id);
        setSystemFeedbacks(merged);
      }

      // 12. Get Criteria
      const critSnap = await getDocs(collection(db, "criteria"));
      if (!critSnap.empty) {
        const list: PointCriteria[] = [];
        critSnap.forEach(d => list.push(d.data() as PointCriteria));
        list.sort((a, b) => a.id.localeCompare(b.id));
        const merged = smartMerge(list, "unihub_criteria", c => c.id);
        setCriteria(merged);
      }

      // 13. Get Class Reviews
      const crSnap = await getDocs(collection(db, "classReviews"));
      if (!crSnap.empty) {
        const list: ClassReviewState[] = [];
        crSnap.forEach(d => list.push(d.data() as ClassReviewState));
        const merged = smartMerge(list, "unihub_class_reviews", c => c.classId);
        setClassReviews(merged);
      }

      // 14. Get Faculty Reviews
      const frSnap = await getDocs(collection(db, "facultyReviews"));
      if (!frSnap.empty) {
        const list: FacultyReviewState[] = [];
        frSnap.forEach(d => list.push(d.data() as FacultyReviewState));
        const merged = smartMerge(list, "unihub_faculty_reviews", f => f.facultyId);
        setFacultyReviews(merged);
      }
    } catch (error) {
      console.warn("Could not sync from Firestore (possibly schema rules or empty DB):", error);
    }
  };


  // Helper to remove undefined/null and secret properties before writing to Firestore
  const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): T => {
    if (!obj || typeof obj !== "object") return obj;
    const clean: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      // A1 FIX: Không bao giờ ghi password/plaintext secret vào Firestore
      if (key === "password") return;
      if (obj[key] !== undefined && obj[key] !== null) {
        clean[key] = obj[key];
      }
    });
    return clean as T;
  };

  // Save changes to Firebase Firestore (Safe upsert with merge: true, never delete unlisted docs automatically)
  const saveToFirestore = async (key: string, data: any) => {
    try {
      if (key === "unihub_users" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "users", item.id), sanitizeForFirestore(item), { merge: true });
        }
      } else if (key === "unihub_students" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "students", item.id), sanitizeForFirestore(item), { merge: true });
        }
      } else if (key === "unihub_organizations" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "organizations", item.id), item, { merge: true });
        }
      } else if (key === "unihub_activities" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "activities", item.id), item, { merge: true });
        }
      } else if (key === "unihub_attendance" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "attendance", item.id), item, { merge: true });
        }
      } else if (key === "unihub_evidence" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "evidence", item.id), item, { merge: true });
        }
      } else if (key === "unihub_results" && Array.isArray(data)) {
        for (const item of data) {
          const docId = `${item.studentId}_${item.periodId}`;
          await setDoc(doc(db, "results", docId), item, { merge: true });
        }
      } else if (key === "unihub_daily_attendance" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "dailyAttendance", item.id), item, { merge: true });
        }
      } else if (key === "unihub_members" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "members", item.id), item, { merge: true });
        }
      } else if (key === "unihub_announcements" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "announcements", item.id), item, { merge: true });
        }
      } else if (key === "unihub_schedules" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "schedules", item.id), item, { merge: true });
        }
      } else if (key === "unihub_criteria" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "criteria", item.id), item, { merge: true });
        }
      } else if (key === "unihub_class_reviews" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.classId) await setDoc(doc(db, "classReviews", item.classId), item, { merge: true });
        }
      } else if (key === "unihub_faculty_reviews" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.facultyId) await setDoc(doc(db, "facultyReviews", item.facultyId), item, { merge: true });
        }
      } else if (key === "unihub_feedbacks" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "feedbacks", item.id), item, { merge: true });
        }
      } else if (key === "unihub_group_criteria" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "groupCriteria", item.id), item, { merge: true });
        }
      } else if (key === "unihub_group_attendances" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "groupAttendances", item.id), item, { merge: true });
        }
      } else if (key === "unihub_system_feedbacks" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "systemFeedbacks", item.id), item, { merge: true });
        }
      } else if (key === "unihub_teacher_assignments" && Array.isArray(data)) {
        for (const item of data) {
          if (item?.id) await setDoc(doc(db, "teacherAssignments", item.id), item, { merge: true });
        }
      } else if (key === "unihub_period" && data) {
        await setDoc(doc(db, "settings", "period"), {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.warn(`Firestore upload failed for key ${key}:`, error);
    }
  };

  // Run automatically on boot to check connection and verify baseline state
  useEffect(() => {
    testConnection();
    
    const ensureFirestoreBaseline = async () => {
      try {
        // Check if organizations collection is empty
        const orgsSnapCheck = await getDocs(collection(db, "organizations"));
        if (orgsSnapCheck.empty) {
          console.log("Seeding organizations baseline collection...");
          for (const o of SEED_ORGANIZATIONS) {
            await setDoc(doc(db, "organizations", o.id), o, { merge: true });
          }
        }

        // Check if org user accounts are missing, seed individual org users safely
        console.log("Đồng bộ baseline users chuẩn hóa đuôi @phhg.edu.vn lên Firestore...");
        for (const u of SEED_USERS) {
          await setDoc(doc(db, "users", u.id), u, { merge: true });
        }

        // Tự động quét và chuẩn hóa các tài khoản Firestore còn sót đuôi cũ (@hg.edu.vn, @unihub.edu.vn...)
        try {
          const usersSnapCheck = await getDocs(collection(db, "users"));
          for (const d of usersSnapCheck.docs) {
            const userDoc = d.data() as UserAccount;
            const normalized = normalizeUserAccount(userDoc);
            if (normalized.username !== userDoc.username || normalized.email !== userDoc.email) {
              await setDoc(doc(db, "users", d.id), normalized, { merge: true });
            }
          }
        } catch (e) {
          console.warn("Lỗi chuẩn hóa tài khoản Firestore:", e);
        }

        await loadFromFirestore();
      } catch (err) {
        console.warn("Baseline check completed with notice (ignoring auth/network restrictions):", err);
      }
    };

    ensureFirestoreBaseline();
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

      // Dynamic Daily Attendance: Deduct 2 points for every unexcused absence ("KHÔNG_PHÉP")
      const unexcusedReportCount = dailyAttendance.filter(rep => 
        rep.classId === student.classId && 
        rep.absentees.some(abs => abs.studentId === student.id && abs.type === "KHÔNG_PHÉP")
      ).length;

      // Dynamic classroom tardiness reports from daily attendance and group attendance
      const tardinessCount = dailyAttendance.filter(rep => 
        rep.classId === student.classId && 
        rep.absentees.some(abs => abs.studentId === student.id && abs.reason && /muộn|trễ|tard/i.test(abs.reason))
      ).length + groupAttendances.filter(ga => 
        ga.classId === student.classId && 
        ga.status === "APPROVED" && 
        ga.absentees.some(abs => abs.studentId === student.id && abs.reason && /muộn|trễ|tard/i.test(abs.reason))
      ).length;

      if (tardinessCount > 0) {
        const rule1pt = getRulePoints("TC2", "TC2.1", -2) * tardinessCount;
        violationPoints = Math.max(0, violationPoints + rule1pt);
        logs.push({ criteriaId: "TC2.1", points: rule1pt, reason: `Báo cáo nề nếp lớp: Đi học muộn quá thời gian quy định (${tardinessCount} lần)`, source: "ĐÀO TẠO", timestamp: timestampNow });
      }

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
      const activeMemberships = members.filter(m => m.studentId === student.id && m.status === "ACTIVE");
      if (activeMemberships.length > 0) {
        const activeOrgPt = getRulePoints("TC3", "TC3.3", 10);
        extracurricularPoints += activeOrgPt;
        const orgNames = activeMemberships
          .map(m => organizations.find(o => o.id === m.orgId)?.name || m.orgId)
          .join(", ");
        logs.push({ criteriaId: "TC3.3", points: activeOrgPt, reason: `Là thành viên tích cực: ${orgNames}`, source: "CLB_ATTENDANCE", timestamp: timestampNow });
      }

      // 4. TC4: Ý thức công dân, cộng đồng (Max 15 XP)
      let communityPoints = 0;
      const maxTC4 = criteria.find(c => c.id === "TC4")?.maxScore || 15;

      // Attended events points (categorized dynamically between TC3 and TC4)
      const attendedEvents = attendance.filter(a => a.studentId === student.id && a.attended && a.verified);
      attendedEvents.forEach(att => {
        const act = activities.find(act => act.id === att.activityId);
        if (act) {
          const isCommunityAct = act.criteriaId === "TC4" || act.criteriaId.startsWith("TC4.");
          const scoreIncrement = isCommunityAct
            ? (act.points || getRulePoints("TC4", "TC4.1", 10))
            : (att.role === "BTC" 
                ? getRulePoints("TC3", "TC3.2", 8) 
                : (att.role === "SUPPORTER" ? 6 : getRulePoints("TC3", "TC3.1", 5)));
          if (isCommunityAct) {
            communityPoints += scoreIncrement;
            logs.push({ 
              criteriaId: act.criteriaId, 
              points: scoreIncrement, 
              reason: `Tham gia hoạt động cộng đồng / tình nguyện: "${act.title}"`, 
              source: "CLB_ATTENDANCE", 
              timestamp: timestampNow 
            });
          } else {
            extracurricularPoints += scoreIncrement;
            logs.push({ 
              criteriaId: act.criteriaId, 
              points: scoreIncrement, 
              reason: `Tham gia hoạt động: "${act.title}" (${att.role === "BTC" ? "Ban tổ chức" : (att.role === "SUPPORTER" ? "Ban hỗ trợ" : "Thành viên")})`, 
              source: "CLB_ATTENDANCE", 
              timestamp: timestampNow 
            });
          }
        }
      });
      // Check Approved Evidence Submissions for extracurricular activity (TC3)
      const approvedTC3Evs = evidence.filter(e => e.status === "APPROVED" && e.studentId === student.id && (e.criteriaId === "TC3" || e.criteriaId.startsWith("TC3.")));
      approvedTC3Evs.forEach(ev => {
        extracurricularPoints += ev.pointsRequested;
        logs.push({ 
          criteriaId: ev.criteriaId, 
          points: ev.pointsRequested, 
          reason: `Phê duyệt minh chứng hoạt động: "${ev.activityName}"`, 
          source: "MINH_CHỨNG", 
          timestamp: ev.submittedAt 
        });
      });
      extracurricularPoints = Math.min(maxTC3, extracurricularPoints);
      
      // Check Approved Evidence Submissions for community activity (TC4)
      const approvedTC4Evs = evidence.filter(e => e.status === "APPROVED" && e.studentId === student.id && (e.criteriaId === "TC4" || e.criteriaId.startsWith("TC4.")));
      approvedTC4Evs.forEach(ev => {
        communityPoints += ev.pointsRequested;
        logs.push({ 
          criteriaId: ev.criteriaId, 
          points: ev.pointsRequested, 
          reason: `Phê duyệt minh chứng cộng đồng: "${ev.activityName}"`, 
          source: "MINH_CHỨNG", 
          timestamp: ev.submittedAt 
        });
      });

      // Default class monitor activity (TC4.2): Active class clean duty & self-governance
      const hasCleanDuty = unexcusedReportCount === 0 && tardinessCount === 0;
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
      const isMonitor = users.some(u => u.role === UserRole.CLASS_MONITOR && (u.username === student.id || u.targetId === student.classId));
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

      // Check Approved Evidence Submissions for achievements / awards (TC5)
      const approvedTC5Evs = evidence.filter(e => e.status === "APPROVED" && e.studentId === student.id && (e.criteriaId === "TC5" || e.criteriaId.startsWith("TC5.")));
      approvedTC5Evs.forEach(ev => {
        achievementPoints += ev.pointsRequested;
        logs.push({ 
          criteriaId: ev.criteriaId, 
          points: ev.pointsRequested, 
          reason: `Phê duyệt minh chứng khen thưởng: "${ev.activityName}"`, 
          source: "MINH_CHỨNG", 
          timestamp: ev.submittedAt 
        });
      });

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
    if (!passwordInput || !passwordInput.trim() || !emailInput || !emailInput.trim()) {
      return false;
    }

    const trimmedInput = emailInput.trim();
    const trimmedPass = passwordInput.trim();
    const lowerInput = trimmedInput.toLowerCase();

    // 1. TÌM VÀ ĐỐI CHIẾU TÀI KHOẢN HIỆN HÀNH TRONG HỆ THỐNG
    // Nếu bên cấp tài khoản đã thay đổi tk (username), tài khoản cũ sẽ không còn tồn tại -> Chặn ngay!
    let matchedUser: UserAccount | null = null;
    let matchedStudent: Student | null = null;

    // Tìm trong danh mục sinh viên Phòng Đào tạo (students)
    matchedStudent = students.find(s => {
      if (!s || !s.id) return false;
      const sId = s.id.trim().toLowerCase();
      const sEmail = (s.email || "").trim().toLowerCase();
      if (sId === lowerInput) return true;
      if (sEmail === lowerInput) return true;
      if (lowerInput.endsWith("@phhg.edu.vn") && sId === lowerInput.split("@")[0]) return true;
      return false;
    }) || null;

    // Tìm trong danh sách users hệ thống
    matchedUser = users.find(u => {
      if (!u) return false;
      const uname = (u.username || "").trim().toLowerCase();
      const uemail = (u.email || "").trim().toLowerCase();
      const utarget = (u.targetId || "").trim().toLowerCase();

      // Khớp chính xác username hoặc email hiện hành
      if (uname === lowerInput || uemail === lowerInput) return true;

      // Sinh viên: khớp Mã SV
      if (u.role === UserRole.STUDENT) {
        if (uname === lowerInput || utarget === lowerInput) return true;
        if (lowerInput.endsWith("@phhg.edu.vn") && uname === lowerInput.split("@")[0]) return true;
      }

      // Cán bộ / Đơn vị: cho phép nhập tiền tố email công vụ (ví dụ gõ "daotao" tự hiểu "daotao@phhg.edu.vn")
      if (!lowerInput.includes("@") && u.role !== UserRole.STUDENT) {
        if (uname === `${lowerInput}@phhg.edu.vn` || uemail === `${lowerInput}@phhg.edu.vn`) return true;
        if (uemail.startsWith(`${lowerInput}@`)) return true;
      }

      return false;
    }) || null;

    // NẾU TÀI KHOẢN KHÔNG TỒN TẠI HOẶC ĐÃ BỊ THAY ĐỔI: BỊ CHẶN NGAY!
    if (!matchedUser && !matchedStudent) {
      console.warn("Đăng nhập thất bại: Tài khoản không tồn tại hoặc đã bị thay đổi tên đăng nhập:", trimmedInput);
      return false;
    }

    // 2. KIỂM TRA MẬT KHẨU HIỆN HÀNH (AUTHORITATIVE PASSWORD CHECK)
    // Nếu bên cấp tài khoản đã thay đổi mk (password), mật khẩu cũ sẽ bị từ chối 100%!
    let currentValidPassword = "";
    if ((matchedUser as any)?.password && (matchedUser as any).password.trim()) {
      currentValidPassword = (matchedUser as any).password.trim();
    } else if ((matchedStudent as any)?.password && (matchedStudent as any).password.trim()) {
      currentValidPassword = (matchedStudent as any).password.trim();
    } else if (matchedStudent?.idCard && matchedStudent.idCard.trim()) {
      currentValidPassword = matchedStudent.idCard.trim();
    } else if (matchedUser?.role === UserRole.STUDENT) {
      const stud = students.find(s => s.id.toLowerCase() === (matchedUser!.targetId || matchedUser!.username).toLowerCase());
      currentValidPassword = (stud as any)?.password?.trim() || stud?.idCard?.trim() || "123456";
    } else {
      currentValidPassword = "123456";
    }

    // So khớp mật khẩu: Người dùng nhập mật khẩu cũ => CHẶN NGAY!
    if (trimmedPass !== currentValidPassword) {
      // Trường hợp đặc biệt cho Sinh viên: nếu chưa từng đổi mật khẩu tùy chỉnh, vẫn có thể dùng CCCD
      const isStudentCccd = matchedStudent && matchedStudent.idCard && matchedStudent.idCard.trim() === trimmedPass;
      if (!isStudentCccd) {
        console.warn("Đăng nhập thất bại: Sai mật khẩu hiện hành cho tài khoản:", trimmedInput);
        return false;
      }
    }

    // 3. THÔNG TIN XÁC THỰC HỢP LỆ -> ĐỒNG BỘ VÀ TẠO PHIÊN
    let targetEmail = "";
    if (matchedStudent) {
      targetEmail = matchedStudent.email && matchedStudent.email.includes("@")
        ? matchedStudent.email
        : `${matchedStudent.id.toLowerCase()}@phhg.edu.vn`;
    } else if (matchedUser) {
      targetEmail = matchedUser.email && matchedUser.email.includes("@")
        ? matchedUser.email
        : (matchedUser.username.includes("@") ? matchedUser.username : `${matchedUser.username}@phhg.edu.vn`);
    }

    // Đồng bộ Firebase Auth trong nền (bảo đảm môi trường Firebase vẫn có thông tin đăng nhập)
    let authCred: any = null;
    try {
      authCred = await signInWithEmailAndPassword(auth, targetEmail, trimmedPass);
    } catch (err: any) {
      const errorCode = err?.code || "";
      if (
        errorCode === "auth/invalid-credential" || 
        errorCode === "auth/user-not-found" || 
        errorCode === "auth/wrong-password"
      ) {
        try {
          authCred = await createUserWithEmailAndPassword(auth, targetEmail, trimmedPass);
        } catch {}
      }
    }

    // Xây dựng profile người dùng
    let userDoc: UserAccount;
    if (matchedUser) {
      userDoc = {
        ...matchedUser,
        email: targetEmail
      };
    } else {
      userDoc = {
        id: `U_STUD_${matchedStudent!.id}`,
        username: matchedStudent!.id,
        name: matchedStudent!.name,
        role: UserRole.STUDENT,
        targetId: matchedStudent!.id,
        email: targetEmail
      };
      setUsers(prev => {
        const updated = [...prev.filter(u => u.id !== userDoc.id), userDoc];
        saveToStorage("unihub_users", updated);
        return updated;
      });
    }

    if (authCred?.user?.uid) {
      setDoc(doc(db, "users", authCred.user.uid), userDoc, { merge: true }).catch(() => {});
    }

    const { password: _, ...safeUser } = userDoc as any;
    setCurrentUser(safeUser as UserAccount);
    localStorage.setItem("unihub_current_user", JSON.stringify(safeUser));
    return true;
  };



  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Signout error", err);
    }
    setCurrentUser(null);
    // B1 FIX: Xóa các cache nhạy cảm khi logout để tránh data leakage
    localStorage.removeItem("unihub_current_user");
    localStorage.removeItem("unihub_announcements");
    localStorage.removeItem("unihub_activities");
  };

  const updatePeriodStatus = (status: "ACTIVE" | "LOCKED") => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to update period status");
      return;
    }
    const updated = { ...period, status };
    setPeriod(updated);
    saveToStorage("unihub_period", updated);
  };

  // Student Actions
  const registerForActivity = (activityId: string, studentId: string) => {
    if (!currentUser) return;
    const effectiveStudentId = currentUser.role === UserRole.ADMIN
      ? (studentId || currentUser.targetId || currentUser.username)
      : (currentUser.targetId || currentUser.username);

    if (currentUser.role !== UserRole.ADMIN && studentId && effectiveStudentId !== studentId) {
      console.warn("Unauthorized attempt to register another student for activity");
      return;
    }

    const activityObj = activities.find(act => act.id === activityId);
    if (!activityObj) return;

    const today = new Date().toISOString().split("T")[0];
    if (activityObj.registrationOpen === false || activityObj.status === "COMPLETED" || (activityObj.expiryDate && activityObj.expiryDate < today)) {
      alert("Đăng ký thất bại: Hoạt động đã đóng đăng ký, đã hết hạn hoặc đã kết thúc!");
      return;
    }

    const alreadyRegistered = attendance.some(a => a.activityId === activityId && a.studentId === effectiveStudentId);
    if (alreadyRegistered) return;

    const studentObj = students.find(s => s.id === effectiveStudentId);
    if (!studentObj) return;

    // Check registration limit
    if (activityObj.maxParticipants !== undefined && activityObj.maxParticipants > 0) {
      const currentCount = attendance.filter(a => a.activityId === activityId).length;
      if (currentCount >= activityObj.maxParticipants) {
        alert("Đăng ký thất bại: Hoạt động đã đạt số lượng người tham gia tối đa!");
        return;
      }
    }

    const newAttendee: ActivityAttendance = {
      id: `AT_NEW_${Date.now()}`,
      activityId,
      studentId: effectiveStudentId,
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
    if (!currentUser) return;
    const effectiveStudentId = currentUser.role === UserRole.ADMIN
      ? (data.studentId || currentUser.targetId || currentUser.username)
      : (currentUser.targetId || currentUser.username);

    if (currentUser.role !== UserRole.ADMIN && data.studentId && effectiveStudentId !== data.studentId) {
      console.warn("Unauthorized attempt to submit evidence for another student");
      return;
    }

    if (!effectiveStudentId) {
      console.warn("Cannot submit evidence without a valid student identity");
      return;
    }

    const studentObj = students.find(s => s.id === effectiveStudentId);
    const resolvedClassId = studentObj?.classId || data.classId || "";
    const resolvedStudentName = studentObj?.name || data.studentName || currentUser.name || "Sinh viên";

    const cleanActivityName = (data.activityName || "").trim();
    const cleanCriteriaId = (data.criteriaId || "").trim();
    if (!cleanActivityName || !cleanCriteriaId) {
      console.warn("Evidence submission requires valid activityName and criteriaId");
      return;
    }

    const rawUrl = (data.proofUrl || "").trim();
    if (/^(javascript|vbscript):/i.test(rawUrl) || rawUrl.startsWith("//")) {
      console.warn("Rejected unsafe proofUrl:", rawUrl);
      return;
    }

    const boundedPoints = Math.max(0, Math.min(100, Number(data.pointsRequested) || 0));
    const maxAllowedPoints = cleanCriteriaId.startsWith("TC4") ? 15 : cleanCriteriaId.startsWith("TC5") ? 10 : cleanCriteriaId.startsWith("TC1") ? 20 : cleanCriteriaId.startsWith("TC2") ? 25 : 30;
    const safePoints = Math.max(1, Math.min(maxAllowedPoints, Math.round(boundedPoints) || 5));

    const newEvidence: EvidenceSubmission = {
      ...data,
      activityName: cleanActivityName,
      criteriaId: cleanCriteriaId,
      studentId: effectiveStudentId,
      studentName: resolvedStudentName,
      classId: resolvedClassId,
      pointsRequested: safePoints,
      proofUrl: rawUrl,
      id: `EV_NEW_${Date.now()}`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "PENDING"
    };

    const updated = [...evidence, newEvidence];
    setEvidence(updated);
    saveToStorage("unihub_evidence", updated);
  };

  const joinOrganizationRequest = (studentId: string, orgId: string, details?: Partial<OrganizationMember>) => {
    if (!currentUser) return;
    const effectiveStudentId = currentUser.role === UserRole.ADMIN
      ? (studentId || currentUser.targetId || currentUser.username)
      : (currentUser.targetId || currentUser.username);

    if (currentUser.role !== UserRole.ADMIN && studentId && effectiveStudentId !== studentId) {
      console.warn("Unauthorized attempt to join organization for another student");
      return;
    }

    const studentObj = students.find(s => s.id === effectiveStudentId);
    if (!studentObj) return;

    const targetOrg = organizations.find(o => o.id === orgId);
    if (!targetOrg) {
      console.warn("Attempt to join non-existent organization:", orgId);
      return;
    }

    const alreadyExists = members.some(m => m.studentId === effectiveStudentId && m.orgId === orgId && (m.status === "PENDING" || m.status === "ACTIVE"));
    if (alreadyExists) {
      console.warn("Member request already exists or active");
      return;
    }

    const safeDetails = { ...(details || {}) };
    if (currentUser.role !== UserRole.ADMIN) {
      delete (safeDetails as any).status;
      delete (safeDetails as any).role;
      delete (safeDetails as any).id;
      delete (safeDetails as any).orgId;
      delete (safeDetails as any).studentId;
      delete (safeDetails as any).studentName;
    }

    const pendingMember: OrganizationMember = {
      ...safeDetails,
      id: `M_NEW_${Date.now()}`,
      studentId: effectiveStudentId,
      classId: studentObj.classId,
      orgId,
      role: (currentUser.role === UserRole.ADMIN && details?.role) ? details.role : "THÀNH VIÊN",
      joinedDate: new Date().toISOString().split("T")[0],
      term: period.academicYear,
      status: (currentUser.role === UserRole.ADMIN && details?.status) ? details.status : "PENDING",
      studentName: (currentUser.role === UserRole.ADMIN && safeDetails.studentName) ? safeDetails.studentName : studentObj.name,
    };

    const updated = [...members, pendingMember];
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const updateStudentProfile = (studentId: string, name: string, avatar: string, password?: string, additionalFields?: Partial<Student>) => {
    // Check permission: only the student themselves, Admin, or their Class Adviser can update student profile
    const currentStud = students.find(s => s.id === studentId);
    const isSelf = !!currentUser && (
      currentUser.targetId === studentId ||
      currentUser.username === studentId ||
      currentUser.id === studentId
    );
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const isAdviserOfClass = currentUser?.role === UserRole.ADVISER &&
      !!currentUser.targetId &&
      !!currentStud &&
      normalizeClassId(currentStud.classId) === normalizeClassId(currentUser.targetId);

    if (
      !currentUser ||
      (!isAdmin && !isSelf && !isAdviserOfClass)
    ) {
      console.warn("Cảnh báo bảo mật: Không có quyền cập nhật hồ sơ của sinh viên khác!", studentId);
      return;
    }

    const trimmedNewPass = (isAdmin || isSelf) && password && password.trim() ? password.trim() : undefined;

    // Strip protected academic & administrative fields if not Admin
    const safeFields: Partial<Student> = { ...(additionalFields || {}) };
    delete (safeFields as any).id;
    if (currentUser.role !== UserRole.ADMIN) {
      delete safeFields.gpa;
      delete safeFields.gpa10;
      delete safeFields.creditsEarned;
      delete safeFields.learningWarning;
      delete safeFields.learningStatus;
      delete safeFields.academicGrade;
      delete safeFields.subjectGrades;
      delete safeFields.academicDataByPeriod;
      delete safeFields.classId;
      delete safeFields.facultyId;
      delete safeFields.learningDataLocked;
      delete safeFields.groupName;
    }

    // 1. Update students array
    const cleanName = (name || "").trim() || currentStud?.name || "Sinh viên";
    const effectiveName = (!isAdmin && isAdviserOfClass) ? (currentStud?.name || "Sinh viên") : cleanName;
    let cleanAvatar = (!isAdmin && isAdviserOfClass) ? (currentStud?.avatar || "") : (avatar || "").trim();
    if (/^(javascript|vbscript):/i.test(cleanAvatar) || cleanAvatar.startsWith("//")) {
      cleanAvatar = currentStud?.avatar || "";
    }
    if (/^data:text\/html/i.test(cleanAvatar)) {
      cleanAvatar = currentStud?.avatar || "";
    }

    const updatedStudents = students.map(s => {
      if (s.id === studentId) {
        return { 
          ...s, 
          ...safeFields, 
          name: effectiveName, 
          avatar: cleanAvatar
        };
      }
      return s;
    });
    setStudents(updatedStudents);
    saveToStorage("unihub_students", updatedStudents);
    const targetStud = updatedStudents.find(s => s.id === studentId);
    if (targetStud) {
      setDoc(doc(db, "students", studentId), sanitizeForFirestore(targetStud), { merge: true }).catch(() => {});
    }

    // 2. Update Firebase Auth password if requested
    if (trimmedNewPass) {
      try {
        const currentAuthUser = auth.currentUser;
        if (currentAuthUser) {
          import("firebase/auth").then(({ updatePassword: fbUpdatePassword }) => {
            fbUpdatePassword(currentAuthUser, trimmedNewPass).catch(err => {
              console.warn("Lỗi đổi mật khẩu Firebase Auth:", err);
            });
          });
        }
      } catch (err) {
        console.warn("Lỗi đổi mật khẩu:", err);
      }
    }

    // 3. Update users array
    const updatedUsers = users.map(u => {
      if (u.targetId === studentId || u.username === studentId || u.email === studentId || u.id === studentId) {
        return { 
          ...u, 
          name
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    saveToStorage("unihub_users", updatedUsers);
    const targetUser = updatedUsers.find(u => u.targetId === studentId || u.username === studentId || u.id === studentId);
    if (targetUser) {
      setDoc(doc(db, "users", targetUser.id), sanitizeForFirestore(targetUser), { merge: true }).catch(() => {});
    }

    // 4. Keep current user in sync (no password)
    if (currentUser && (currentUser.targetId === studentId || currentUser.username === studentId || currentUser.id === studentId)) {
      const { password: _pw, ...cleanCur } = currentUser as any;
      const updatedCur = { ...cleanCur, name };
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
  const getEffectiveUserOrgId = (u: UserAccount | null): string | undefined => {
    if (!u) return undefined;
    if (u.role === UserRole.YOUTH_UNION) return "DOANTN";
    if (u.role === UserRole.STUDENT_UNION) return "HOISV";
    return u.targetId;
  };

  const createActivity = async (activity: Omit<ExtracurricularActivity, "id" | "status" | "orgName">): Promise<string> => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY)) {
      throw new Error("Không có quyền tạo hoạt động phong trào.");
    }
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || activity.orgId !== effectiveOrgId)) {
      throw new Error("Không thể tạo hoạt động cho tổ chức khác.");
    }

    const org = organizations.find(o => o.id === activity.orgId);
    let resolvedOrgName = org?.name;
    if (!resolvedOrgName) {
      if (activity.orgId === "DOANTN") resolvedOrgName = "BCH Đoàn TNCS Phân hiệu Hà Giang";
      else if (activity.orgId === "HOISV") resolvedOrgName = "BCH Hội Sinh viên Phân hiệu Hà Giang";
      else if (activity.orgId === "DOAN_HOI") resolvedOrgName = "Đoàn - Hội Sinh viên Phân hiệu";
      else resolvedOrgName = "Ban Tổ chức";
    }

    const cleanTitle = (activity.title || "").trim();
    if (!cleanTitle) {
      throw new Error("Tiêu đề hoạt động không được để trống.");
    }
    const safePoints = Math.max(1, Math.min(30, Math.round(Number(activity.points) || 5)));

    const cleanAct = sanitizeForFirestore({
      ...activity,
      title: cleanTitle,
      points: safePoints,
      id: `ACT_NEW_${Date.now()}`,
      orgName: resolvedOrgName,
      status: "UPCOMING" as const
    });

    try {
      await setDoc(doc(db, "activities", cleanAct.id), cleanAct, { merge: true });
    } catch (error) {
      console.error("Lỗi lưu hoạt động Firestore:", error);
      throw new Error("Hoạt động chưa được lưu lên CSDL. Sinh viên sẽ chưa thấy sự kiện này. Vui lòng kiểm tra quyền tài khoản Đoàn/Hội hoặc kết nối mạng rồi thử lại.");
    }

    setActivities(prev => {
      const updated = [...prev.filter(a => a.id !== cleanAct.id), cleanAct as ExtracurricularActivity];
      localStorage.setItem("unihub_activities", JSON.stringify(updated));
      return updated;
    });

    return cleanAct.id;
  };

  const deleteActivity = (activityId: string) => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY)) {
      console.warn("Unauthorized attempt to delete activity");
      return;
    }
    const act = activities.find(a => a.id === activityId);
    if (!act) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || act.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to delete activity of another organization");
      return;
    }
    const updated = activities.filter(a => a.id !== activityId);
    setActivities(updated);
    saveToStorage("unihub_activities", updated);
    deleteDoc(doc(db, "activities", activityId)).catch(e => console.warn("Lỗi xóa hoạt động Firestore:", e));

    const updatedAttendance = attendance.filter(att => att.activityId !== activityId);
    if (updatedAttendance.length !== attendance.length) {
      setAttendance(updatedAttendance);
      saveToStorage("unihub_attendance", updatedAttendance);
    }
  };

  const updateActivityStatus = (activityId: string, status: "UPCOMING" | "ONGOING" | "COMPLETED") => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY)) {
      console.warn("Unauthorized attempt to update activity status");
      return;
    }
    const act = activities.find(a => a.id === activityId);
    if (!act) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || act.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to update activity status of another organization");
      return;
    }
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
  const createAnnouncement = async (announcement: Omit<ClubAnnouncement, "id" | "orgName" | "createdAt">): Promise<string> => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      throw new Error("Không có quyền tạo thông báo CLB/Đoàn/Hội.");
    }
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || announcement.orgId !== effectiveOrgId)) {
      throw new Error("Không thể tạo thông báo cho tổ chức khác.");
    }
    const cleanTitle = (announcement.title || "").trim();
    if (!cleanTitle) {
      throw new Error("Tiêu đề thông báo không được để trống.");
    }
    const cleanContent = (announcement.content || "").trim();
    if (!cleanContent) {
      throw new Error("Nội dung thông báo không được để trống.");
    }
    const org = organizations.find(o => o.id === announcement.orgId);
    let resolvedOrgName = org?.name;
    if (!resolvedOrgName) {
      if (announcement.orgId === "DOANTN") resolvedOrgName = "BCH Đoàn TNCS Phân hiệu Hà Giang";
      else if (announcement.orgId === "HOISV") resolvedOrgName = "BCH Hội Sinh viên Phân hiệu Hà Giang";
      else if (announcement.orgId === "DOAN_HOI") resolvedOrgName = "Đoàn - Hội Sinh viên Phân hiệu";
      else resolvedOrgName = "Chi hội";
    }

    const cleanAnn = sanitizeForFirestore({
      ...announcement,
      title: cleanTitle,
      content: cleanContent,
      id: `ANN_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`}`,
      orgName: resolvedOrgName,
      createdAt: new Date().toISOString().split("T")[0]
    });

    try {
      await setDoc(doc(db, "announcements", cleanAnn.id), cleanAnn, { merge: true });
    } catch (error) {
      console.error("Lỗi lưu thông báo Firestore:", error);
      throw new Error("Thông báo chưa được lưu lên CSDL. Sinh viên sẽ chưa thấy bản tin này. Vui lòng kiểm tra quyền tài khoản Đoàn/Hội hoặc kết nối mạng rồi thử lại.");
    }

    setAnnouncements(prev => {
      const updated = [cleanAnn as ClubAnnouncement, ...prev.filter(a => a.id !== cleanAnn.id)];
      localStorage.setItem("unihub_announcements", JSON.stringify(updated));
      return updated;
    });

    return cleanAnn.id;
  };

  const deleteAnnouncement = (id: string) => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to delete announcement");
      return;
    }
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || ann.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to delete announcement of another organization");
      return;
    }
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    saveToStorage("unihub_announcements", updated);
    deleteDoc(doc(db, "announcements", id)).catch(e => console.warn("Lỗi xóa thông báo Firestore:", e));
  };

  const addMemberManual = (member: Omit<OrganizationMember, "id" | "joinedDate" | "term" | "status">) => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to add organization member");
      return;
    }
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || member.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to add member to another organization");
      return;
    }
    const cleanStudentId = (member.studentId || "").trim();
    if (!cleanStudentId) return;
    const targetStudent = students.find(s => s.id === cleanStudentId);
    if (!targetStudent) {
      console.warn("Cannot add member: student not found in students directory");
      return;
    }
    const isCleanDuplicate = members.some(m => m.orgId === member.orgId && m.studentId === cleanStudentId);
    const isDuplicate = members.some(m => m.orgId === member.orgId && m.studentId === member.studentId);
    if (isDuplicate) {
      console.warn("Student is already a member of this organization");
      return;
    }
    if (isCleanDuplicate) {
      console.warn("Student is already a member of this organization");
      return;
    }
    const newMember: OrganizationMember = {
      ...member,
      studentId: cleanStudentId,
      studentName: member.studentName?.trim() || targetStudent.name,
      classId: member.classId?.trim() || targetStudent.classId,
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
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to delete organization member");
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || member.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to delete member of another organization");
      return;
    }
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const updateMemberDetails = (memberId: string, details: Partial<OrganizationMember>) => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to update organization member");
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || member.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to update member of another organization");
      return;
    }

    const safeDetails = { ...details };
    delete safeDetails.id;
    delete safeDetails.orgId;
    delete safeDetails.studentId;
    if (currentUser.role !== UserRole.ADMIN) {
      delete safeDetails.role;
      delete safeDetails.status;
    }

    const updated = members.map(m => {
      if (m.id === memberId) {
        return { ...m, ...safeDetails };
      }
      return m;
    });
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const importMembersExcel = (membersToImport: OrganizationMember[]) => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to import organization members");
      return;
    }
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && !effectiveOrgId) {
      console.warn("Unauthorized attempt to import organization members without assigned org");
      return;
    }
    const validMembers = currentUser.role === UserRole.ADMIN
      ? membersToImport
      : membersToImport.filter(m => m.orgId === effectiveOrgId);

    const cleanMembers = validMembers.map(m => {
      const targetOrg = (currentUser.role === UserRole.ADMIN && m.orgId) ? m.orgId : effectiveOrgId!;
      return {
        ...m,
        id: m.id || `M_IMP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orgId: targetOrg,
        role: m.role || "THÀNH VIÊN",
        status: (m.status === "ACTIVE" || m.status === "PENDING") ? m.status : "ACTIVE",
        joinedDate: m.joinedDate || new Date().toISOString().split("T")[0],
        term: m.term || period.academicYear
      };
    });

    const existingKeys = new Set(members.map(m => `${m.orgId}_${m.studentId}`));
    const deduplicatedMembers: OrganizationMember[] = [];
    cleanMembers.forEach(m => {
      const key = `${m.orgId}_${m.studentId}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        deduplicatedMembers.push(m);
      }
    });

    const updated = [...members, ...deduplicatedMembers];
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const approveMemberRequest = (memberId: string) => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to approve organization member");
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || member.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to approve member of another organization");
      return;
    }
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
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to reject organization member");
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || member.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to reject member of another organization");
      return;
    }
    const updated = members.filter(m => m.id !== memberId);
    setMembers(updated);
    saveToStorage("unihub_members", updated);
  };

  const assignMemberRole = (memberId: string, role: "CHỦ NHIỆM" | "BAN CHẤP HÀNH" | "ỦY VIÊN" | "THÀNH VIÊN") => {
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN)) {
      console.warn("Unauthorized attempt to assign member role");
      return;
    }
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || member.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to assign role in another organization");
      return;
    }
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
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY)) {
      console.warn("Unauthorized attempt to update attendance");
      return;
    }
    const att = attendance.find(a => a.id === attendanceId);
    if (!att) return;
    const act = activities.find(a => a.id === att.activityId);
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || (act && act.orgId !== effectiveOrgId))) {
      console.warn("Unauthorized attempt to update attendance of another organization");
      return;
    }
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
    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY)) {
      console.warn("Unauthorized attempt to bulk add attendance");
      return;
    }
    const currentAct = activities.find(a => a.id === activityId);
    if (!currentAct) return;
    const effectiveOrgId = getEffectiveUserOrgId(currentUser);
    if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || currentAct.orgId !== effectiveOrgId)) {
      console.warn("Unauthorized attempt to add attendance to another organization's activity");
      return;
    }

    // Filter out duplicate and non-existent studentIds
    const studentMap = new Map(students.map(s => [s.id, s]));
    const cleanIds = Array.from(new Set(studentIds)).filter(id => 
      studentMap.has(id) && !attendance.some(att => att.activityId === activityId && att.studentId === id)
    );
    
    const newRecords: ActivityAttendance[] = cleanIds.map(sid => {
      const sObj = studentMap.get(sid)!;
      return {
        id: `AT_BLK_${Date.now()}_${sid}`,
        activityId,
        studentId: sid,
        studentName: sObj.name,
        classId: sObj.classId,
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
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to import academic data");
      return;
    }
    const updated = students.map(s => {
      const item = excelData.find(item => item.id === s.id);
      if (item) {
        const currentAcademicData = s.academicDataByPeriod || {};
        const safeGpa = typeof item.gpa === "number" ? Math.max(0, Math.min(4, Math.round(item.gpa * 100) / 100)) : item.gpa;
        const safeGpa10 = typeof item.gpa10 === "number" ? Math.max(0, Math.min(10, Math.round(item.gpa10 * 10) / 10)) : item.gpa10;
        const safeCredits = typeof item.creditsEarned === "number" ? Math.max(0, Math.round(item.creditsEarned)) : item.creditsEarned;
        const newSemesterData = {
          gpa: safeGpa,
          gpa10: safeGpa10,
          creditsEarned: safeCredits,
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
            gpa: safeGpa,
            gpa10: safeGpa10,
            creditsEarned: safeCredits,
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
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to toggle learning data lock");
      return;
    }
    const isAllLocked = students.length > 0 && students.every(s => s.learningDataLocked);
    const nextLockState = !isAllLocked;
    const updated = students.map(s => ({ ...s, learningDataLocked: nextLockState }));
    setStudents(updated);
    saveToStorage("unihub_students", updated);
  };

  // BCS / Class Actions
  const approveClassScores = (classId: string) => {
    if (!currentUser || !classId) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && currentUser.targetId === classId) ||
      (currentUser.role === UserRole.ADVISER && currentUser.targetId === classId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to approve class scores");
      return;
    }

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
    if (!currentUser || !classId) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.FACULTY && currentUser.targetId && students.some(s => s.classId === classId && s.facultyId === currentUser.targetId)) ||
      (currentUser.role === UserRole.ADVISER && currentUser.targetId === classId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to approve adviser scores");
      return;
    }

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
    if (!currentUser) return;
    if (isNaN(points) || !isFinite(points)) return;
    const cleanReason = (reason || "").trim();
    const cleanCategory = (criteriaCategory || "").trim();
    if (!cleanReason || !cleanCategory) {
      console.warn("Reason and category are required for adviser adjustment");
      return;
    }
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.ADVISER && currentUser.targetId === targetStudent.classId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to submit adviser adjustment");
      return;
    }
    // Adjust result's logs and save
    const updatedResults = results.map(res => {
      if (res.studentId === studentId && (!period?.id || res.periodId === period.id)) {
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
    if (!currentUser || !facultyId) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.FACULTY && currentUser.targetId === facultyId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to lock faculty data");
      return;
    }

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
    if (!currentUser) return;
    const isAuthorized = [
      UserRole.ADMIN,
      UserRole.ADVISER,
      UserRole.CLASS_MONITOR,
      UserRole.FACULTY,
      UserRole.YOUTH_UNION,
      UserRole.STUDENT_UNION
    ].includes(currentUser.role);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to review evidence");
      return;
    }

    const targetEv = evidence.find(e => e.id === subId);
    if (!targetEv) return;
    const targetStudent = students.find(s => s.id === targetEv.studentId);
    if (currentUser.role === UserRole.CLASS_MONITOR) {
      if (currentUser.isGroupLeader) {
        console.warn("Group leader cannot review evidence");
        return;
      }
      if (!targetStudent || !currentUser.targetId || targetStudent.classId !== currentUser.targetId) {
        console.warn("Cannot review evidence outside assigned class");
        return;
      }
    }
    if (currentUser.role === UserRole.ADVISER) {
      if (!targetStudent || !currentUser.targetId || targetStudent.classId !== currentUser.targetId) {
        console.warn("Cannot review evidence outside assigned class");
        return;
      }
    }
    if (currentUser.role === UserRole.FACULTY) {
      if (!targetStudent || !currentUser.targetId || targetStudent.facultyId !== currentUser.targetId) {
        console.warn("Cannot review evidence outside assigned faculty");
        return;
      }
    }
    if (currentUser.role === UserRole.YOUTH_UNION || currentUser.role === UserRole.STUDENT_UNION) {
      if (targetEv.criteriaId && targetEv.criteriaId.startsWith("TC1")) {
        console.warn("Youth Union or Student Union cannot evaluate academic criteria evidence");
        return;
      }
    }

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
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to update criteria score");
      return;
    }
    if (!criteriaId || !ruleId) {
      console.warn("Invalid criteriaId or ruleId");
      return;
    }
    const targetCriteria = criteria.find(c => c.id === criteriaId);
    if (!targetCriteria) {
      console.warn("Criteria not found:", criteriaId);
      return;
    }
    const targetRule = targetCriteria.rules.find(r => r.id === ruleId);
    if (!targetRule) {
      console.warn("Rule not found:", ruleId);
      return;
    }
    if (isNaN(newPoints) || !isFinite(newPoints)) {
      console.warn("Invalid points passed to updateCriteriaScore");
      return;
    }
    const clampedPoints = Math.max(0, Math.min(100, Math.round(newPoints)));
    const safePoints = Math.min(targetCriteria.maxPoints || 100, clampedPoints);
    const updated = criteria.map(c => {
      if (c.id === criteriaId) {
        return {
          ...c,
          rules: c.rules.map(r => {
            if (r.id === ruleId) {
              return { ...r, points: safePoints };
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
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to bulk update criteria");
      return;
    }
    if (!Array.isArray(newCriteria) || newCriteria.length === 0) {
      console.warn("Invalid criteria array passed to bulkUpdateCriteria");
      return;
    }
    setCriteria(newCriteria);
    saveToStorage("unihub_criteria", newCriteria);
  };

  const resetToSeeds = () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to reset database");
      return;
    }
    // A11 FIX: signOut Firebase Auth trước để tránh race condition
    signOut(auth).catch(() => {});
    setCurrentUser(null);
    
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
    setCustomClasses([]);
    setTeacherAssignments(SEED_TEACHER_ASSIGNMENTS);
    setSubjectGradeSheets(SEED_SUBJECT_GRADES);
    setGradeAppeals([]);
    setUnlockRequests([]);
    // Không tự set currentUser = seed user nữa. Người dùng phải đăng nhập lại.
  };

  // Dedicated Safe Data Restore handler (Restores entire database from JSON or Auto-Shield)
  const restoreAllDataBackup = async (backupData: any) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error("Chỉ Quản trị viên hệ thống (Admin) mới có quyền khôi phục CSDL.");
    }
    if (!backupData) return;

    if (Array.isArray(backupData.students) && backupData.students.length > 0) {
      setStudents(backupData.students);
      saveToStorage("unihub_students", backupData.students);
      localStorage.setItem("unihub_students_backup", JSON.stringify(backupData.students));
    }
    if (Array.isArray(backupData.users) && backupData.users.length > 0) {
      setUsers(backupData.users);
      saveToStorage("unihub_users", backupData.users);
      localStorage.setItem("unihub_users_backup", JSON.stringify(backupData.users));
    }
    if (Array.isArray(backupData.teacherAssignments)) {
      setTeacherAssignments(backupData.teacherAssignments);
      saveToStorage("unihub_teacher_assignments", backupData.teacherAssignments);
    }
    if (Array.isArray(backupData.subjectGradeSheets)) {
      setSubjectGradeSheets(backupData.subjectGradeSheets);
      saveToStorage("unihub_subject_grade_sheets", backupData.subjectGradeSheets);
    }
    if (Array.isArray(backupData.schedules)) {
      setSchedules(backupData.schedules);
      saveToStorage("unihub_schedules", backupData.schedules);
    }
    if (Array.isArray(backupData.organizations)) {
      setOrganizations(backupData.organizations);
      saveToStorage("unihub_organizations", backupData.organizations);
    }
    if (Array.isArray(backupData.activities)) {
      setActivities(backupData.activities);
      saveToStorage("unihub_activities", backupData.activities);
    }
    if (Array.isArray(backupData.criteria)) {
      setCriteria(backupData.criteria);
      saveToStorage("unihub_criteria", backupData.criteria);
    }
    if (Array.isArray(backupData.classReviews)) {
      setClassReviews(backupData.classReviews);
      saveToStorage("unihub_class_reviews", backupData.classReviews);
    }
    if (Array.isArray(backupData.facultyReviews)) {
      setFacultyReviews(backupData.facultyReviews);
      saveToStorage("unihub_faculty_reviews", backupData.facultyReviews);
    }
    if (Array.isArray(backupData.results)) {
      setResults(backupData.results);
      saveToStorage("unihub_results", backupData.results);
    }
    if (Array.isArray(backupData.evidence)) {
      setEvidence(backupData.evidence);
      saveToStorage("unihub_evidence", backupData.evidence);
    }
    if (Array.isArray(backupData.members)) {
      setMembers(backupData.members);
      saveToStorage("unihub_members", backupData.members);
    }
    if (Array.isArray(backupData.attendance)) {
      setAttendance(backupData.attendance);
      saveToStorage("unihub_attendance", backupData.attendance);
    }
    if (Array.isArray(backupData.dailyAttendance)) {
      setDailyAttendance(backupData.dailyAttendance);
      saveToStorage("unihub_daily_attendance", backupData.dailyAttendance);
    }
    if (Array.isArray(backupData.groupAttendances)) {
      setGroupAttendances(backupData.groupAttendances);
      saveToStorage("unihub_group_attendances", backupData.groupAttendances);
    }
    if (Array.isArray(backupData.announcements)) {
      setAnnouncements(backupData.announcements);
      saveToStorage("unihub_announcements", backupData.announcements);
    }
    if (backupData.gradingRules) {
      setGradingRules(backupData.gradingRules);
      localStorage.setItem("unihub_grading_rules", JSON.stringify(backupData.gradingRules));
    }
    if (backupData.period) {
      setPeriod(backupData.period);
      saveToStorage("unihub_period", backupData.period);
    }
  };

  const saveGroupSettings = (
    classId: string, 
    assignments: { [studentId: string]: string }, 
    leaders: { [groupName: string]: { studentId: string; username?: string; password?: string } }
  ) => {
    if (!currentUser || !classId) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.ADVISER && currentUser.targetId === classId) ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && currentUser.targetId === classId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to save group settings");
      return;
    }
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
      const cleanGroupName = (groupName || "").trim();
      if (!cleanGroupName || !leaderInfo || !leaderInfo.studentId) return;
      const studentObj = students.find(s => s.id === leaderInfo.studentId);
      if (!studentObj || studentObj.classId !== classId) return;

      const rawUsername = (leaderInfo.username || `totruong_${leaderInfo.studentId}`).trim();
      const safeUsername = rawUsername.includes("@") ? rawUsername.split("@")[0] : rawUsername;
      const safeEmail = `${safeUsername}@phhg.edu.vn`;
      
      updatedUsers.push({
        id: `U_GL_${leaderInfo.studentId}`,
        username: safeUsername,
        name: studentObj.name,
        role: UserRole.CLASS_MONITOR,
        email: safeEmail,
        targetId: leaderInfo.studentId,
        isGroupLeader: true,
        groupInCharge: cleanGroupName
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
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.ADVISER ||
      currentUser.role === UserRole.CLASS_MONITOR ||
      currentUser.isGroupLeader;
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to report group attendance");
      return;
    }

    if (currentUser.isGroupLeader) {
      const glStudent = students.find(s => s.id === currentUser.targetId);
      if (glStudent && reportData.classId && reportData.classId !== glStudent.classId && normalizeClassId(reportData.classId) !== normalizeClassId(glStudent.classId)) {
        console.warn("Group leader cannot report attendance for another class");
        return;
      }
      if (currentUser.groupInCharge && reportData.groupName && reportData.groupName !== currentUser.groupInCharge) {
        console.warn("Group leader cannot report attendance for another group");
        return;
      }
    } else if (currentUser.role === UserRole.ADVISER || currentUser.role === UserRole.CLASS_MONITOR) {
      if (currentUser.targetId && reportData.classId && reportData.classId !== currentUser.targetId && normalizeClassId(reportData.classId) !== normalizeClassId(currentUser.targetId)) {
        console.warn("Cannot report group attendance for another class");
        return;
      }
    }

    const groupStudents = students.filter(s => s.classId === reportData.classId && s.groupName === reportData.groupName);
    const groupStudentIds = new Set(groupStudents.map(s => s.id));
    students.filter(s => normalizeClassId(s.classId) === normalizeClassId(reportData.classId) && s.groupName === reportData.groupName).forEach(s => groupStudentIds.add(s.id));
    const seenAbsentIds = new Set<string>();
    const sanitizedAbsentees = (reportData.absentees || []).filter(a => {
      if (!a.studentId || !groupStudentIds.has(a.studentId) || seenAbsentIds.has(a.studentId)) return false;
      seenAbsentIds.add(a.studentId);
      return true;
    });

    const totalStudents = groupStudentIds.size;
    const absentCount = sanitizedAbsentees.length;
    const presentCount = Math.max(0, totalStudents - absentCount);

    const report: GroupAttendanceReport = {
      ...reportData,
      id: `GR_ATT_${Date.now()}`,
      totalStudents,
      presentCount,
      absentCount,
      absentees: sanitizedAbsentees,
      status: "PENDING",
      reportedAt: new Date().toISOString().replace("T", " ").substring(0, 19)
    };

    const filtered = groupAttendances.filter(ga => !(ga.classId === reportData.classId && ga.groupName === reportData.groupName && ga.date === reportData.date));
    const updated = [report, ...filtered];
    setGroupAttendances(updated);
    saveToStorage("unihub_group_attendances", updated);
  };

  const approveGroupAttendance = (reportId: string, reviewerName: string) => {
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.ADVISER ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to approve group attendance");
      return;
    }

    const targetReport = groupAttendances.find(ga => ga.id === reportId);
    if (!targetReport) return;
    if (currentUser.role !== UserRole.ADMIN) {
      if (!currentUser.targetId) {
        console.warn("Unauthorized attempt by unassigned user to approve group attendance");
        return;
      }
      if (currentUser.targetId && targetReport.classId !== currentUser.targetId) {
        console.warn("Unauthorized attempt to approve group attendance for another class");
        return;
      }
    }

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
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.ADVISER ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to reject group attendance");
      return;
    }

    const targetReport = groupAttendances.find(ga => ga.id === reportId);
    if (!targetReport) return;
    if (currentUser.role !== UserRole.ADMIN) {
      if (!currentUser.targetId) {
        console.warn("Unauthorized attempt by unassigned user to reject group attendance");
        return;
      }
      if (currentUser.targetId && targetReport.classId !== currentUser.targetId) {
        console.warn("Unauthorized attempt to reject group attendance for another class");
        return;
      }
    }

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
    if (!currentUser) return;
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    if (currentUser.isGroupLeader) {
      if (currentUser.targetId === studentId) {
        console.warn("Group leader cannot grade themselves");
        return;
      }
      const glStudent = students.find(s => s.id === currentUser.targetId);
      if (!glStudent || targetStudent.classId !== glStudent.classId) {
        console.warn("Group leader cannot grade student in another class");
        return;
      }
      if (!currentUser.groupInCharge || targetStudent.groupName !== currentUser.groupInCharge) {
        console.warn("Group leader cannot grade student in another group");
        return;
      }
    } else {
      const isAuthorized = currentUser.role === UserRole.ADMIN ||
        (currentUser.role === UserRole.ADVISER && currentUser.targetId === targetStudent.classId) ||
        (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && currentUser.targetId === targetStudent.classId);
      if (!isAuthorized) {
        console.warn("Unauthorized attempt to submit group leader score");
        return;
      }
    }

    const safeStudy = Math.max(0, Math.min(20, Math.round(Number(scores.studyPoints) || 0)));
    const safeViolation = Math.max(0, Math.min(25, Math.round(Number(scores.violationPoints) || 0)));
    const safeExtra = Math.max(0, Math.min(30, Math.round(Number(scores.extracurricularPoints) || 0)));
    const safeComm = Math.max(0, Math.min(15, Math.round(Number(scores.communityPoints) || 0)));
    const safeAchieve = Math.max(0, Math.min(10, Math.round(Number(scores.achievementPoints) || 0)));
    const rawTotal = safeStudy + safeViolation + safeExtra + safeComm + safeAchieve;
    const safeTotal = Math.max(0, Math.min(100, rawTotal));

    const updatedResults = results.map(r => {
      if (r.studentId === studentId && r.periodId === period.id) {
        return {
          ...r,
          groupLeaderScore: {
            studyPoints: safeStudy,
            violationPoints: safeViolation,
            extracurricularPoints: safeExtra,
            communityPoints: safeComm,
            achievementPoints: safeAchieve,
            totalPoints: safeTotal,
            comment: (scores.comment || "").trim().substring(0, 500),
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
    if (!currentUser) return;
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    const normTarget = normalizeClassId(currentUser.targetId);
    const normClass = normalizeClassId(targetStudent.classId);
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.ADVISER && (currentUser.targetId === targetStudent.classId || normTarget === normClass)) ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && (currentUser.targetId === targetStudent.classId || normTarget === normClass));
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to apply group leader score");
      return;
    }

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
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && currentUser.targetId === classId) ||
      (currentUser.role === UserRole.ADVISER && currentUser.targetId === classId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to aggregate group attendance");
      return;
    }

    const approvedReports = groupAttendances.filter(ga => ga.classId === classId && ga.date === date && ga.status === "APPROVED");
    if (approvedReports.length === 0) {
      alert("Không có báo cáo chuyên cần cấp Tổ nào đã được duyệt cho ngày này!");
      return;
    }

    const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.id));
    const allAbsentees: { studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[] = [];
    const seenStudentIds = new Set<string>();

    approvedReports.forEach(r => {
      r.absentees.forEach(abs => {
        if (classStudentIds.has(abs.studentId) && !seenStudentIds.has(abs.studentId)) {
          seenStudentIds.add(abs.studentId);
          allAbsentees.push(abs);
        }
      });
    });

    const totalStuds = classStudentIds.size;
    const absCount = allAbsentees.length;
    const presCount = Math.max(0, totalStuds - absCount);

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
    if (!currentUser || !classId) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.ADVISER && currentUser.targetId && currentUser.targetId === classId) ||
      (currentUser.role === UserRole.CLASS_MONITOR && currentUser.targetId && currentUser.targetId === classId);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to send group reminder");
      return;
    }

    const cleanMessage = (message || "").trim();
    if (!cleanMessage) return;

    const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.id));
    const validTargetIds = Array.from(new Set(targetStudentIds.filter(sid => classStudentIds.has(sid))));
    if (validTargetIds.length === 0) return;

    const newFeedbacks = validTargetIds.map(sid => ({
      id: `FB_REMIND_${sid}_${Date.now()}_${Math.random()}`,
      fromRole: currentUser.role,
      fromName: currentUser.name || "Ban Cán sự Lớp",
      toClassId: classId,
      studentId: sid,
      comment: cleanMessage,
      createdAt: new Date().toISOString().split("T")[0],
      resolved: false
    }));

    const updated = [...newFeedbacks, ...feedbacks];
    setFeedbacks(updated);
    saveToStorage("unihub_feedbacks", updated);
  };

  const importScheduleData = (slots: ScheduleSlot[]) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to import schedule data");
      return;
    }
    const validSlots = (slots || []).filter(s => s && typeof s.classId === "string" && s.classId.trim() && typeof s.subjectName === "string" && s.subjectName.trim()).map(s => ({
      ...s,
      classId: normalizeClassId(s.classId.trim()),
      subjectCode: (s.subjectCode || "").trim(),
      subjectName: (s.subjectName || "").trim()
    }));
    setSchedules(validSlots);
    saveToStorage("unihub_schedules", validSlots);
  };

  const deleteScheduleSlot = (id: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to delete schedule slot");
      return;
    }
    const cleanId = (id || "").trim();
    if (!cleanId) return;
    const updated = schedules.filter(s => s.id !== cleanId);
    setSchedules(updated);
    saveToStorage("unihub_schedules", updated);
  };

  const clearSchedules = () => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to clear schedules");
      return;
    }
    setSchedules([]);
    saveToStorage("unihub_schedules", []);
  };

  const reportDailyAttendance = (
    classId: string, 
    date: string, 
    absentees: { studentId: string; studentName: string; type: "PHÉP" | "KHÔNG_PHÉP"; reason?: string }[], 
    reportedBy: string
  ) => {
    if (!currentUser) return;
    const normTarget = normalizeClassId(currentUser.targetId);
    const normClass = normalizeClassId(classId);
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && (currentUser.targetId === classId || normTarget === normClass)) ||
      (currentUser.role === UserRole.ADVISER && (currentUser.targetId === classId || normTarget === normClass));
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to report daily attendance");
      return;
    }

    const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.id));
    students.filter(s => normalizeClassId(s.classId) === normClass).forEach(s => classStudentIds.add(s.id));
    const seenAbsentIds = new Set<string>();
    const sanitizedAbsentees = (absentees || []).filter(a => {
      if (!a.studentId || !classStudentIds.has(a.studentId) || seenAbsentIds.has(a.studentId)) return false;
      seenAbsentIds.add(a.studentId);
      return true;
    });

    const totalStuds = classStudentIds.size;
    const absCount = sanitizedAbsentees.length;
    const presCount = Math.max(0, totalStuds - absCount);

    const report: DailyAttendanceReport = {
      id: `DAR_${Date.now()}`,
      classId,
      date,
      totalStudents: totalStuds,
      presentCount: presCount,
      absentCount: absCount,
      absentees: sanitizedAbsentees,
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
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.FACULTY ||
      currentUser.role === UserRole.ADVISER ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to send feedback");
      return;
    }
    if (currentUser.role === UserRole.ADVISER || currentUser.role === UserRole.CLASS_MONITOR) {
      if (!toClassId || !currentUser.targetId || currentUser.targetId !== toClassId) {
        console.warn("Unauthorized attempt to send feedback to another class");
        return;
      }
    }
    if (currentUser.role === UserRole.FACULTY) {
      if (!currentUser.targetId) {
        console.warn("Unauthorized attempt by unassigned faculty to send feedback");
        return;
      }
      const isFacultyClass = students.some(s => s.classId === toClassId && s.facultyId === currentUser.targetId);
      if (!isFacultyClass) {
        console.warn("Unauthorized attempt by faculty to send feedback to another faculty's class");
        return;
      }
    }

    if (studentId) {
      const targetStudent = students.find(s => s.id === studentId);
      if (!targetStudent) {
        console.warn("Target student not found");
        return;
      }
      if (targetStudent && targetStudent.classId !== toClassId) {
        console.warn("Target student does not belong to specified class");
        return;
      }
    }

    const cleanComment = (comment || "").trim();
    if (!cleanComment) return;

    const newFeedback: ScoreFeedback = {
      id: `FB_${Date.now()}`,
      fromRole: currentUser.role,
      fromName: currentUser.name || fromName,
      toClassId,
      studentId,
      comment: cleanComment,
      createdAt: new Date().toISOString().split("T")[0],
      resolved: false
    };

    const updated = [newFeedback, ...feedbacks];
    setFeedbacks(updated);
    saveToStorage("unihub_feedbacks", updated);
  };

  const resolveFeedback = (feedbackId: string) => {
    if (!currentUser) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.ADVISER ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader);
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to resolve feedback");
      return;
    }

    const targetFb = feedbacks.find(fb => fb.id === feedbackId);
    if (!targetFb) return;

    if (currentUser.role !== UserRole.ADMIN) {
      if (!currentUser.targetId) {
        console.warn("Unauthorized attempt by unassigned user to resolve feedback");
        return;
      }
      if (currentUser.targetId && targetFb.toClassId && targetFb.toClassId !== currentUser.targetId) {
        console.warn("Unauthorized attempt to resolve feedback for another class");
        return;
      }
    }

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
    const cleanCat = (category || "").trim();
    const cleanTitle = (title || "").trim().substring(0, 200);
    const cleanContent = (content || "").trim().substring(0, 5000);
    if (!cleanTitle || !cleanContent) return;

    const fbId = "SF_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const feedback: SystemFeedback = {
      id: fbId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: cleanCat,
      title: cleanTitle,
      content: cleanContent,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, "systemFeedbacks", fbId), feedback);
    } catch (err) {
      console.warn("Lỗi lưu systemFeedbacks Firestore:", err);
    }
    const updated = [feedback, ...systemFeedbacks];
    setSystemFeedbacks(updated);
    localStorage.setItem("unihub_system_feedbacks", JSON.stringify(updated));
  };

  const importGroupCriteria = (criteriaList: GroupEvaluationCriteria[]) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.ADVISER && currentUser.role !== UserRole.CLASS_MONITOR)) {
      console.warn("Unauthorized attempt to import group criteria");
      return;
    }
    setGroupCriteria(criteriaList);
    saveToStorage("unihub_group_criteria", criteriaList);
  };

  const approveFacultyScores = (classId: string, comment: string) => {
    if (!currentUser || !classId) return;
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.FACULTY && currentUser.targetId && students.some(s => s.classId === classId && s.facultyId === currentUser.targetId));
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to approve faculty scores");
      return;
    }

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
    if (!currentUser || currentUser.role !== UserRole.ADMIN || !classId) {
      console.warn("Unauthorized attempt to approve admin scores");
      return;
    }

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

    const classStudentIds = students.filter(s => s.classId === classId).map(s => s.id);
    const updatedResults = results.map(res => {
      if (classStudentIds.includes(res.studentId)) {
        return {
          ...res,
          status: "APPROVED_ADMIN" as const
        };
      }
      return res;
    });
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);
  };

  const createClubWithAccount = (club: Organization, account: UserAccount) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to create club with account");
      return;
    }
    if (!club.id?.trim() || !club.name?.trim() || !account.username?.trim()) {
      console.warn("Invalid club or account details");
      return;
    }

    const normUsername = account.username.trim().toLowerCase();
    const existingUser = users.find(u => u.username.toLowerCase() === normUsername && u.id !== account.id);
    if (existingUser) {
      alert(`Tên đăng nhập "${account.username}" đã tồn tại trên hệ thống! Vui lòng chọn tên đăng nhập khác.`);
      return;
    }

    const cleanClub = sanitizeForFirestore(club);
    const cleanAccount = sanitizeForFirestore({ ...account, targetId: club.id });

    setOrganizations(prev => {
      const exists = prev.some(o => o.id === cleanClub.id);
      const updated = exists ? prev.map(o => o.id === cleanClub.id ? { ...o, ...cleanClub } : o) : [...prev, cleanClub];
      localStorage.setItem("unihub_organizations", JSON.stringify(updated));
      return updated;
    });

    setUsers(prev => {
      const exists = prev.some(u => u.id === cleanAccount.id || (u.targetId && u.targetId.toLowerCase() === cleanClub.id.toLowerCase()));
      const updated = exists 
        ? prev.map(u => (u.id === cleanAccount.id || (u.targetId && u.targetId.toLowerCase() === cleanClub.id.toLowerCase())) ? { ...u, ...cleanAccount } : u) 
        : [...prev, cleanAccount];
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      return updated;
    });

    setDoc(doc(db, "organizations", cleanClub.id), cleanClub, { merge: true }).catch(e => console.warn("Lỗi lưu club Firestore:", e));
    setDoc(doc(db, "users", cleanAccount.id), cleanAccount, { merge: true }).catch(e => console.warn("Lỗi lưu user liên kết Firestore:", e));
  };

  const updateClubAndAccount = (clubId: string, updatedClub: Partial<Organization>, updatedAccount: Partial<UserAccount>) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to update club and account");
      return;
    }
    const cleanClub = sanitizeForFirestore(updatedClub);
    const cleanAccount = sanitizeForFirestore({ ...updatedAccount, targetId: clubId });

    setOrganizations(prev => {
      const updated = prev.map(o => o.id === clubId ? { ...o, ...cleanClub } : o);
      localStorage.setItem("unihub_organizations", JSON.stringify(updated));
      return updated;
    });

    const existingUser = users.find(u => isOrgRole(u.role) && (u.targetId === clubId || u.targetId?.toLowerCase() === clubId.toLowerCase() || u.username === cleanAccount.username));
    const userDocId = existingUser ? existingUser.id : (cleanAccount.id || `U_ORG_GEN_${clubId}`);

    setUsers(prev => {
      const updated = prev.map(u => {
        if (isOrgRole(u.role) && (u.targetId === clubId || u.targetId?.toLowerCase() === clubId.toLowerCase() || u.username === cleanAccount.username || u.id === userDocId)) {
          return { ...u, ...cleanAccount, targetId: clubId, id: userDocId };
        }
        return u;
      });
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      return updated;
    });

    setDoc(doc(db, "organizations", clubId), cleanClub, { merge: true }).catch(e => console.warn("Lỗi cập nhật club Firestore:", e));
    setDoc(doc(db, "users", userDocId), { ...cleanAccount, targetId: clubId, id: userDocId }, { merge: true }).catch(e => console.warn("Lỗi cập nhật user Firestore:", e));
  };

  const deleteClubAndAccount = (clubId: string) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to delete club and account");
      return;
    }
    const clubIdClean = (clubId || "").trim().toLowerCase();
    if (!clubIdClean) return;
    const protectedOrgs = ["doantn", "hoisv", "doan_hoi"];
    if (protectedOrgs.includes(clubIdClean)) {
      alert("Không thể xóa tổ chức Đoàn - Hội mặc định của Phân hiệu!");
      return;
    }
    const orgToDelete = organizations.find(o => o.id.toLowerCase() === clubIdClean);

    // 1. Remove organization from state, cache, and Firestore
    setOrganizations(prev => {
      const updated = prev.filter(o => o.id.toLowerCase() !== clubIdClean);
      localStorage.setItem("unihub_organizations", JSON.stringify(updated));
      return updated;
    });

    deleteDoc(doc(db, "organizations", clubId)).catch(e => console.warn("Lỗi xóa organization Firestore:", e));
    if (orgToDelete && orgToDelete.id !== clubId) {
      deleteDoc(doc(db, "organizations", orgToDelete.id)).catch(e => console.warn("Lỗi xóa organization Firestore:", e));
    }

    // 2. Find ALL associated user accounts matching targetId, username, email, or name
    const assocUsers = users.filter(u => {
      if (!isOrgRole(u.role)) return false;
      const targetMatch = u.targetId && u.targetId.trim().toLowerCase() === clubIdClean;
      const userMatch = u.username && u.username.toLowerCase().includes(clubIdClean);
      const emailMatch = u.email && u.email.toLowerCase().includes(clubIdClean);
      const nameMatch = orgToDelete && u.name && u.name.trim().toLowerCase() === orgToDelete.name.trim().toLowerCase();
      return targetMatch || userMatch || emailMatch || nameMatch;
    });

    const assocUserIds = assocUsers.map(u => u.id);

    // 3. Remove all associated user accounts from state, cache, and Firestore
    setUsers(prev => {
      const updated = prev.filter(u => !assocUserIds.includes(u.id));
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      return updated;
    });

    assocUserIds.forEach(uId => {
      deleteDoc(doc(db, "users", uId)).catch(e => console.warn("Lỗi xóa user liên kết Firestore:", e));
    });

    // 4. Clean up club's activities and their attendances
    const clubActIds = activities.filter(a => a.orgId.toLowerCase() === clubIdClean).map(a => a.id);
    setActivities(prev => {
      const updated = prev.filter(a => a.orgId.toLowerCase() !== clubIdClean);
      localStorage.setItem("unihub_activities", JSON.stringify(updated));
      return updated;
    });
    setAttendance(prev => {
      const updated = prev.filter(att => !clubActIds.includes(att.activityId));
      localStorage.setItem("unihub_attendance", JSON.stringify(updated));
      return updated;
    });

    // 5. Clean up announcements
    setAnnouncements(prev => {
      const updated = prev.filter(ann => ann.orgId.toLowerCase() !== clubIdClean);
      localStorage.setItem("unihub_announcements", JSON.stringify(updated));
      return updated;
    });

    // 6. Clean up members
    setMembers(prev => {
      const updated = prev.filter(m => m.orgId.toLowerCase() !== clubIdClean);
      localStorage.setItem("unihub_members", JSON.stringify(updated));
      return updated;
    });
  };

  const createUserAccount = (account: UserAccount) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to create user account");
      return;
    }
    if (!account.username?.trim()) return;
    const normUsername = account.username.trim().toLowerCase();
    const existingWithSameUsername = users.find(u => u.username.toLowerCase() === normUsername && u.id !== account.id);
    if (existingWithSameUsername) {
      alert(`Tên đăng nhập "${account.username}" đã tồn tại trên hệ thống! Vui lòng chọn tên đăng nhập khác.`);
      return;
    }
    const clean = sanitizeForFirestore(account);
    setUsers(prev => {
      const exists = prev.some(u => u.id === clean.id);
      const updated = exists ? prev.map(u => u.id === clean.id ? { ...u, ...clean } : u) : [...prev, clean];
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      return updated;
    });
    setDoc(doc(db, "users", clean.id), clean, { merge: true }).catch(e => console.warn("Lỗi lưu user Firestore:", e));
  };

  const updateUserAccount = (userId: string, updatedAccount: Partial<UserAccount>) => {
    if (!currentUser) return;
    if (!userId || !userId.trim()) return;
    const existingTarget = users.find(u => u.id === userId);
    if (!existingTarget) return;
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== userId) {
      console.warn("Unauthorized attempt to update user account");
      return;
    }
    const safeAccount = { ...updatedAccount };
    if (safeAccount.username) {
      const normUsername = safeAccount.username.trim().toLowerCase();
      const existingWithSameUsername = users.find(u => u.username.toLowerCase() === normUsername && u.id !== userId);
      if (existingWithSameUsername) {
        alert(`Tên đăng nhập "${safeAccount.username}" đã tồn tại trên hệ thống! Vui lòng chọn tên đăng nhập khác.`);
        return;
      }
    }
    if (currentUser.role !== UserRole.ADMIN) {
      delete safeAccount.role;
      delete safeAccount.targetId;
      delete safeAccount.isGroupLeader;
      delete safeAccount.groupInCharge;
      delete safeAccount.monitorTitle;
      delete (safeAccount as any).id;
      delete (safeAccount as any).username;
    } else {
      if (userId === currentUser.id && safeAccount.role && safeAccount.role !== UserRole.ADMIN) {
        alert("Không thể tự hạ quyền tài khoản quản trị viên đang đăng nhập!");
        return;
      }
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.username === "admin" && safeAccount.role && safeAccount.role !== UserRole.ADMIN) {
        alert("Không thể thay đổi vai trò của tài khoản quản trị viên hệ thống mặc định!");
        return;
      }
      const otherRootAdmins = ["cthssv@phhg.edu.vn", "cthssv@hg.edu.vn", "pcthssv@hg.edu.vn", "admin@phhg.edu.vn", "superadmin"];
      if (targetUser && otherRootAdmins.includes(targetUser.username.toLowerCase()) && safeAccount.role && safeAccount.role !== UserRole.ADMIN) {
        alert("Không thể thay đổi vai trò của tài khoản quản trị viên hệ thống mặc định!");
        return;
      }
    }

    const clean = sanitizeForFirestore(safeAccount);
    setUsers(prev => {
      const updated = prev.map(u => u.id === userId ? { ...u, ...clean } : u);
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      return updated;
    });
    setDoc(doc(db, "users", userId), clean, { merge: true }).catch(e => console.warn("Lỗi cập nhật user Firestore:", e));
  };

  const deleteUserAccount = (userId: string) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to delete user account");
      return;
    }
    if (!userId || !userId.trim()) return;
    if (userId === currentUser.id) {
      alert("Không thể tự xóa tài khoản quản trị viên đang đăng nhập!");
      return;
    }
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    if (userToDelete?.username === "admin") {
      alert("Không thể xóa tài khoản quản trị viên hệ thống mặc định!");
      return;
    }
    const otherRootAdmins = ["cthssv@phhg.edu.vn", "cthssv@hg.edu.vn", "pcthssv@hg.edu.vn", "admin@phhg.edu.vn", "superadmin"];
    if (userToDelete && otherRootAdmins.includes(userToDelete.username.toLowerCase())) {
      alert("Không thể xóa tài khoản quản trị viên hệ thống mặc định!");
      return;
    }
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== userId);
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      return updated;
    });
    deleteDoc(doc(db, "users", userId)).catch(e => console.warn("Lỗi xóa user Firestore:", e));

    if (userToDelete && isOrgRole(userToDelete.role) && userToDelete.targetId) {
      const orgId = userToDelete.targetId.toLowerCase();
      setOrganizations(prev => {
        const updated = prev.filter(o => o.id.toLowerCase() !== orgId);
        localStorage.setItem("unihub_organizations", JSON.stringify(updated));
        return updated;
      });
      deleteDoc(doc(db, "organizations", userToDelete.targetId)).catch(e => console.warn("Lỗi xóa organization liên kết Firestore:", e));

      const orgActIds = activities.filter(a => a.orgId.toLowerCase() === orgId).map(a => a.id);
      setActivities(prev => {
        const updated = prev.filter(a => a.orgId.toLowerCase() !== orgId);
        localStorage.setItem("unihub_activities", JSON.stringify(updated));
        return updated;
      });
      setAttendance(prev => {
        const updated = prev.filter(att => !orgActIds.includes(att.activityId));
        localStorage.setItem("unihub_attendance", JSON.stringify(updated));
        return updated;
      });
      setAnnouncements(prev => {
        const updated = prev.filter(ann => ann.orgId.toLowerCase() !== orgId);
        localStorage.setItem("unihub_announcements", JSON.stringify(updated));
        return updated;
      });
      setMembers(prev => {
        const updated = prev.filter(m => m.orgId.toLowerCase() !== orgId);
        localStorage.setItem("unihub_members", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const normalizeAllAccounts = () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      console.warn("Unauthorized attempt to normalize accounts");
      return;
    }
    const updated = users.map(normalizeUserAccount);
    setUsers(updated);
    try {
      localStorage.setItem("unihub_users", JSON.stringify(updated));
      localStorage.setItem("unihub_users_backup", JSON.stringify(updated));
    } catch {}
    updated.forEach(u => {
      setDoc(doc(db, "users", u.id), sanitizeForFirestore(u), { merge: true }).catch(() => {});
    });
    if (currentUser) {
      const updatedCurrent = normalizeUserAccount(currentUser);
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem("unihub_current_user", JSON.stringify(updatedCurrent));
      } catch {}
    }
  };

  const importNewClassesExcel = (studentsToImport: Student[], usersToImport: UserAccount[]) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to import new classes");
      return;
    }
    const combinedStudents = [...students];
    studentsToImport.forEach(newStud => {
      const cleanId = (newStud.id || "").trim();
      if (!cleanId) return;
      const cleanStud = { ...newStud, id: cleanId };
      const existingIdx = combinedStudents.findIndex(s => s.id === cleanId);
      if (existingIdx !== -1) {
        combinedStudents[existingIdx] = { ...combinedStudents[existingIdx], ...cleanStud };
      } else {
        combinedStudents.push(cleanStud);
      }
    });

    const combinedUsers = [...users];
    usersToImport.forEach(newUser => {
      // Security: clamp role to STUDENT or CLASS_MONITOR; never allow importing administrative accounts
      const safeRole = (newUser.role === UserRole.CLASS_MONITOR) ? UserRole.CLASS_MONITOR : UserRole.STUDENT;
      const cleanUser: UserAccount = {
        ...newUser,
        role: safeRole
      };

      const existingIdx = combinedUsers.findIndex(u => 
        (u.username && cleanUser.username && u.username.toLowerCase() === cleanUser.username.toLowerCase()) || 
        (u.email && cleanUser.email && u.email.toLowerCase() === cleanUser.email.toLowerCase())
      );
      if (existingIdx !== -1) {
        const existing = combinedUsers[existingIdx];
        // Protect privileged roles and organizational accounts from being hijacked or modified by class Excel import
        if (existing.role !== UserRole.STUDENT && existing.role !== UserRole.CLASS_MONITOR) {
          console.warn(`Skipping overwrite of privileged/organizational account: ${existing.username}`);
          return;
        }
        combinedUsers[existingIdx] = { ...existing, ...cleanUser, role: safeRole };
      } else {
        combinedUsers.push(cleanUser);
      }
    });

    setStudents(combinedStudents);
    setUsers(combinedUsers);
    saveToStorage("unihub_students", combinedStudents);
    saveToStorage("unihub_users", combinedUsers);
  };

  const addNewClass = (className: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to add class");
      return;
    }
    if (!className.trim()) return;
    const normalized = className.trim();
    if (!customClasses.includes(normalized)) {
      const updated = [...customClasses, normalized];
      setCustomClasses(updated);
      localStorage.setItem("unihub_custom_classes", JSON.stringify(updated));
    }
  };

  const renameClass = (oldClassId: string, newClassId: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to rename class");
      return;
    }
    if (!oldClassId.trim() || !newClassId.trim()) return;
    const oldNorm = normalizeClassId(oldClassId);
    const newNorm = normalizeClassId(newClassId);
    if (oldNorm === newNorm) return;

    const updatedCustom = customClasses.map(c => normalizeClassId(c) === oldNorm ? newNorm : c);
    if (!updatedCustom.includes(newNorm)) updatedCustom.push(newNorm);
    setCustomClasses(updatedCustom);
    localStorage.setItem("unihub_custom_classes", JSON.stringify(updatedCustom));

    const updatedStudents = students.map(s => normalizeClassId(s.classId) === oldNorm ? { ...s, classId: newNorm } : s);
    setStudents(updatedStudents);
    saveToStorage("unihub_students", updatedStudents);

    const updatedSchedules = schedules.map(sch => normalizeClassId(sch.classId) === oldNorm ? { ...sch, classId: newNorm, className: newNorm } : sch);
    setSchedules(updatedSchedules);
    saveToStorage("unihub_schedules", updatedSchedules);

    const updatedAssignments = teacherAssignments.map(ta => normalizeClassId(ta.classId) === oldNorm ? { ...ta, classId: newNorm } : ta);
    setTeacherAssignments(updatedAssignments);
    saveToStorage("unihub_teacher_assignments", updatedAssignments);

    const updatedGradeSheets = subjectGradeSheets.map(sg => normalizeClassId(sg.classId) === oldNorm ? { ...sg, classId: newNorm } : sg);
    setSubjectGradeSheets(updatedGradeSheets);
    saveToStorage("unihub_subject_grade_sheets", updatedGradeSheets);

    const updatedUsers = users.map(u => {
      if ((u.role === UserRole.CLASS_MONITOR || u.role === UserRole.ADVISER) && normalizeClassId(u.targetId) === oldNorm) {
        return { ...u, targetId: newNorm };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem("unihub_users", JSON.stringify(updatedUsers));

    const updatedClassReviews = classReviews.map(cr => normalizeClassId(cr.classId) === oldNorm ? { ...cr, classId: newNorm } : cr);
    setClassReviews(updatedClassReviews);
    saveToStorage("unihub_class_reviews", updatedClassReviews);

    const updatedDailyAttendance = dailyAttendance.map(da => normalizeClassId(da.classId) === oldNorm ? { ...da, classId: newNorm } : da);
    setDailyAttendance(updatedDailyAttendance);
    saveToStorage("unihub_daily_attendance", updatedDailyAttendance);

    const updatedGroupAttendances = groupAttendances.map(ga => normalizeClassId(ga.classId) === oldNorm ? { ...ga, classId: newNorm } : ga);
    setGroupAttendances(updatedGroupAttendances);
    saveToStorage("unihub_group_attendances", updatedGroupAttendances);

    const updatedEvidence = evidence.map(ev => normalizeClassId(ev.classId) === oldNorm ? { ...ev, classId: newNorm } : ev);
    setEvidence(updatedEvidence);
    saveToStorage("unihub_evidence", updatedEvidence);

    const updatedFeedbacks = feedbacks.map(fb => normalizeClassId(fb.toClassId) === oldNorm ? { ...fb, toClassId: newNorm } : fb);
    setFeedbacks(updatedFeedbacks);
    saveToStorage("unihub_feedbacks", updatedFeedbacks);

    const updatedUnlockRequests = unlockRequests.map(ur => normalizeClassId(ur.classId) === oldNorm ? { ...ur, classId: newNorm } : ur);
    setUnlockRequests(updatedUnlockRequests);
    localStorage.setItem("unihub_unlock_requests", JSON.stringify(updatedUnlockRequests));

    const updatedGradeAppeals = gradeAppeals.map(ga => normalizeClassId(ga.classId) === oldNorm ? { ...ga, classId: newNorm } : ga);
    setGradeAppeals(updatedGradeAppeals);
    localStorage.setItem("unihub_grade_appeals", JSON.stringify(updatedGradeAppeals));
  };

  const deleteClass = (classId: string) => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT)) {
      console.warn("Unauthorized attempt to delete class");
      return;
    }
    if (!classId.trim()) return;
    const norm = normalizeClassId(classId);

    const updatedCustom = customClasses.filter(c => normalizeClassId(c) !== norm);
    setCustomClasses(updatedCustom);
    localStorage.setItem("unihub_custom_classes", JSON.stringify(updatedCustom));

    const deletedStudentIds = new Set(students.filter(s => normalizeClassId(s.classId) === norm).map(s => s.id));
    const updatedStudents = students.filter(s => normalizeClassId(s.classId) !== norm);
    setStudents(updatedStudents);
    saveToStorage("unihub_students", updatedStudents);

    const updatedResults = results.filter(r => !deletedStudentIds.has(r.studentId));
    setResults(updatedResults);
    saveToStorage("unihub_results", updatedResults);

    const updatedSchedules = schedules.filter(sch => normalizeClassId(sch.classId) !== norm);
    setSchedules(updatedSchedules);
    saveToStorage("unihub_schedules", updatedSchedules);

    const updatedAssignments = teacherAssignments.filter(ta => normalizeClassId(ta.classId) !== norm);
    setTeacherAssignments(updatedAssignments);
    saveToStorage("unihub_teacher_assignments", updatedAssignments);

    const updatedGradeSheets = subjectGradeSheets.filter(sg => normalizeClassId(sg.classId) !== norm);
    setSubjectGradeSheets(updatedGradeSheets);
    saveToStorage("unihub_subject_grade_sheets", updatedGradeSheets);

    const updatedUsers = users.map(u => {
      if ((u.role === UserRole.CLASS_MONITOR || u.role === UserRole.ADVISER) && normalizeClassId(u.targetId) === norm) {
        return { ...u, targetId: "" };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem("unihub_users", JSON.stringify(updatedUsers));

    const updatedClassReviews = classReviews.filter(cr => normalizeClassId(cr.classId) !== norm);
    setClassReviews(updatedClassReviews);
    saveToStorage("unihub_class_reviews", updatedClassReviews);

    const updatedDailyAttendance = dailyAttendance.filter(da => normalizeClassId(da.classId) !== norm);
    setDailyAttendance(updatedDailyAttendance);
    saveToStorage("unihub_daily_attendance", updatedDailyAttendance);

    const updatedGroupAttendances = groupAttendances.filter(ga => normalizeClassId(ga.classId) !== norm);
    setGroupAttendances(updatedGroupAttendances);
    saveToStorage("unihub_group_attendances", updatedGroupAttendances);

    const updatedFeedbacks = feedbacks.filter(fb => normalizeClassId(fb.toClassId) !== norm);
    setFeedbacks(updatedFeedbacks);
    saveToStorage("unihub_feedbacks", updatedFeedbacks);

    const updatedUnlockRequests = unlockRequests.filter(ur => normalizeClassId(ur.classId) !== norm);
    setUnlockRequests(updatedUnlockRequests);
    localStorage.setItem("unihub_unlock_requests", JSON.stringify(updatedUnlockRequests));

    const updatedGradeAppeals = gradeAppeals.filter(ga => normalizeClassId(ga.classId) !== norm);
    setGradeAppeals(updatedGradeAppeals);
    localStorage.setItem("unihub_grade_appeals", JSON.stringify(updatedGradeAppeals));

    const updatedEvidence = evidence.filter(ev => normalizeClassId(ev.classId) !== norm && !deletedStudentIds.has(ev.studentId));
    setEvidence(updatedEvidence);
    saveToStorage("unihub_evidence", updatedEvidence);
  };

  const bulkApproveScores = (classId: string, studentIds: string[], role: UserRole) => {
    if (!currentUser || !classId) return;
    const normTarget = normalizeClassId(currentUser.targetId);
    const normClass = normalizeClassId(classId);
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && (currentUser.targetId === classId || normTarget === normClass)) ||
      (currentUser.role === UserRole.ADVISER && (currentUser.targetId === classId || normTarget === normClass));
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to bulk approve scores");
      return;
    }

    const effectiveRole = currentUser.role === UserRole.ADMIN ? role : currentUser.role;
    const classStudentIds = students.filter(s => s.classId === classId || normalizeClassId(s.classId) === normClass).map(s => s.id);
    const validStudentIds = studentIds.filter(sid => classStudentIds.includes(sid));

    const updatedResults = results.map(res => {
      if (validStudentIds.includes(res.studentId)) {
        let newStatus = res.status;
        if (effectiveRole === UserRole.CLASS_MONITOR) {
          newStatus = "APPROVED_CLASS" as const;
        } else if (effectiveRole === UserRole.ADVISER) {
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
    if (!currentUser) return;
    if (isNaN(points) || !isFinite(points)) return;
    const cleanReason = (reason || "").trim();
    const cleanCategory = (category || "").trim();
    if (!cleanReason || !cleanCategory) {
      console.warn("Reason and category are required for score adjustment");
      return;
    }
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;
    const normTarget = normalizeClassId(currentUser.targetId);
    const normClass = normalizeClassId(targetStudent.classId);
    const isAuthorized = currentUser.role === UserRole.ADMIN ||
      (currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && (currentUser.targetId === targetStudent.classId || normTarget === normClass)) ||
      (currentUser.role === UserRole.ADVISER && (currentUser.targetId === targetStudent.classId || normTarget === normClass));
    if (!isAuthorized) {
      console.warn("Unauthorized attempt to adjust score");
      return;
    }
    const updatedResults = results.map(res => {
      if (res.studentId === studentId && (!period?.id || res.periodId === period.id)) {
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

        const adjusterSource = currentUser.role === UserRole.ADVISER ? "GV_ĐIỀU_CHỈNH" : currentUser.role === UserRole.ADMIN ? "ADMIN" : "BCS_DUYỆT";
        const updatedLogs = [
          ...res.logs,
          {
            criteriaId: "ADJUST_MANUAL",
            points,
            reason: `Hiệu chỉnh [${category}]: ${reason}`,
            source: adjusterSource as any,
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
      renameClass,
      deleteClass,
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
      normalizeAllAccounts,
      
      saveGroupSettings,
      reportGroupAttendance,
      approveGroupAttendance,
      rejectGroupAttendance,
      submitGroupLeaderScore,
      applyGroupLeaderScore,
      aggregateGroupAttendancesToDaily,
      sendGroupReminder,

      teacherAssignments,
      subjectGradeSheets,
      unlockRequests,
      gradeAppeals,
      gradeAuditLogs,
      gradingRules,
      saveTeacherAssignments,
      importTeacherAssignmentsExcel,
      saveSubjectGradeSheet,
      submitSubjectGradeSheet,
      requestGradeUnlock,
      approveUnlockRequest,
      rejectUnlockRequest,
      submitGradeAppeal,
      resolveGradeAppeal,
      addGradeAuditLog,
      updateGradingRules,
      aggregateSubjectGradesToSemesterGpa,
      restoreAllDataBackup
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
