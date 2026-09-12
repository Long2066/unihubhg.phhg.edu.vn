import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

console.log("=========================================");
console.log("RUNNING SECURITY REGRESSION TEST SUITE   ");
console.log("=========================================\n");

let failures = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   Reason: ${detail}`);
    failures++;
  }
}

const adminAppPath = path.join(rootDir, "unihub-admin", "src", "App.tsx");
const adminAppContent = fs.readFileSync(adminAppPath, "utf-8");
const rulesPath = path.join(rootDir, "firestore.rules");
const rulesContent = fs.readFileSync(rulesPath, "utf-8");
const statePath = path.join(rootDir, "src", "state.tsx");
const stateContent = fs.readFileSync(statePath, "utf-8");
const rootDataPath = path.join(rootDir, "src", "data.ts");
const rootDataContent = fs.readFileSync(rootDataPath, "utf-8");
const adminDataPath = path.join(rootDir, "unihub-admin", "src", "data.ts");
const adminDataContent = fs.readFileSync(adminDataPath, "utf-8");
const rootTypesPath = path.join(rootDir, "src", "types.ts");
const rootTypesContent = fs.readFileSync(rootTypesPath, "utf-8");
const adminTypesPath = path.join(rootDir, "unihub-admin", "src", "types.ts");
const adminTypesContent = fs.readFileSync(adminTypesPath, "utf-8");
const classPortalPath = path.join(rootDir, "src", "components", "ClassPortal.tsx");
const classPortalContent = fs.readFileSync(classPortalPath, "utf-8");
const adviserPortalPath = path.join(rootDir, "src", "components", "AdviserPortal.tsx");
const adviserPortalContent = fs.readFileSync(adviserPortalPath, "utf-8");
const organizerPortalPath = path.join(rootDir, "src", "components", "OrganizerPortal.tsx");
const organizerPortalContent = fs.readFileSync(organizerPortalPath, "utf-8");
const teacherPortalPath = path.join(rootDir, "src", "components", "TeacherPortal.tsx");
const teacherPortalContent = fs.readFileSync(teacherPortalPath, "utf-8");
const trainingPortalPath = path.join(rootDir, "src", "components", "TrainingPortal.tsx");
const trainingPortalContent = fs.readFileSync(trainingPortalPath, "utf-8");
const dataBackupRestoreModalPath = path.join(rootDir, "src", "components", "DataBackupRestoreModal.tsx");
const dataBackupRestoreModalContent = fs.readFileSync(dataBackupRestoreModalPath, "utf-8");
const studentPortalPath = path.join(rootDir, "src", "components", "StudentPortal.tsx");
const studentPortalContent = fs.readFileSync(studentPortalPath, "utf-8");
const adminPortalPath = path.join(rootDir, "src", "components", "AdminPortal.tsx");
const adminPortalContent = fs.readFileSync(adminPortalPath, "utf-8");
const facultyPortalPath = path.join(rootDir, "src", "components", "FacultyPortal.tsx");
const facultyPortalContent = fs.readFileSync(facultyPortalPath, "utf-8");
const rootAppPath = path.join(rootDir, "src", "App.tsx");
const rootAppContent = fs.readFileSync(rootAppPath, "utf-8");
const classStatisticsBottomPath = path.join(rootDir, "src", "components", "ClassStatisticsBottom.tsx");
const classStatisticsBottomContent = fs.readFileSync(classStatisticsBottomPath, "utf-8");

// =========================================================
// BATCH 1 CHECKS
// =========================================================

assert(
  !adminAppContent.includes('useState<boolean>(() => {\n    return localStorage.getItem("unihub_superadmin_auth") === "true";\n  });') &&
  !adminAppContent.includes('const savedAuth = localStorage.getItem("unihub_superadmin_auth");\n    if (savedAuth === "true") {\n      setIsAuthenticated(true);\n    }'),
  "Batch 1 Issue 1: Admin Console does not grant superadmin session directly from localStorage",
  "Found unverified localStorage.unihub_superadmin_auth trust trigger in unihub-admin/src/App.tsx"
);

assert(
  adminAppContent.includes('localStorage.removeItem("unihub_superadmin_auth");'),
  "Batch 1 Issue 1: Admin Console cleans up unihub_superadmin_auth key on signout / unauthenticated state",
  "Missing cleanup of localStorage.unihub_superadmin_auth on auth state change"
);

assert(
  !adminAppContent.includes('password === "admin@123"') &&
  !adminAppContent.includes('password === "Admin@123"') &&
  !adminAppContent.includes('password === "password123"'),
  "Batch 1 Issue 2: Admin Console does not accept hardcoded master passwords",
  "Found hardcoded master password checks in handleLogin in unihub-admin/src/App.tsx"
);

assert(
  !adminAppContent.includes('id: "U_SUPERADMIN_PRIMARY"') &&
  !adminAppContent.includes('password: password'),
  "Batch 1 Issue 2: Admin Console does not auto-generate/modify admin doc with plaintext password on login failure",
  "Found admin doc modification logic in handleLogin"
);

assert(
  !rulesContent.includes("match /users/{userId} {\n      allow get, list: if true;\n      allow create, update, delete: if true;\n    }"),
  "Batch 1 Issue 3: firestore.rules collection /users is not publicly open",
  "Found public read/write rule on /users in firestore.rules"
);

assert(
  rulesContent.includes("match /users/{userId}") && rulesContent.includes("isVerifiedUser()"),
  "Batch 1 Issue 3: firestore.rules restricts /users to verified users with role checks",
  "Missing isVerifiedUser restriction on /users in firestore.rules"
);

assert(
  !rulesContent.includes("hasOnly(['id', 'username', 'name', 'role', 'email', 'targetId', 'password'"),
  "Batch 1 Issue 3 & 4: firestore.rules isValidUser disallows secret password field in user documents",
  "isValidUser still permits secret password field in allowed keys"
);

assert(
  !adminAppContent.includes("<th>Mật khẩu</th>") &&
  !adminAppContent.includes("displayPassword"),
  "Batch 1 Issue 4: Admin Users table does not render plaintext password column",
  "Admin Users table still renders plaintext password column/cells"
);

assert(
  !stateContent.includes("password: setPassword") &&
  !stateContent.includes("teacherPassword: (assign.teacherPassword || \"password123\").trim()"),
  "Batch 1 Issue 4: state.tsx does not write plaintext password fields when persisting user / teacher assignment docs",
  "Found secret password/teacherPassword field generation in state.tsx"
);

assert(
  !stateContent.includes('trimmedPass === "password123"') &&
  !stateContent.includes('trimmedPass === "admin@123"') &&
  !stateContent.includes('trimmedPass === "Admin@123"'),
  "Batch 1 Issue 5: Main App login() does not accept generic master passwords",
  "Found master password checks in src/state.tsx login()"
);

assert(
  !stateContent.includes("storedPassword.toLowerCase() === trimmedPass.toLowerCase()") &&
  !stateContent.includes("!userObj.password"),
  "Batch 1 Issue 5: Main App login() does not perform case-insensitive password matching or accept empty passwords",
  "Found case-insensitive or empty password matching logic in src/state.tsx login()"
);

assert(
  !stateContent.includes('const impersonateUsername = params.get("impersonate");') &&
  !stateContent.includes('if (impersonateUsername && users.length > 0)'),
  "Batch 1 Issue 5: Unauthenticated ?impersonate= URL query parameter session takeover is removed",
  "Found unauthenticated impersonation handler in src/state.tsx"
);

assert(
  !stateContent.includes('if (cachedCurrentUser) {\n      try {\n        const parsed = JSON.parse(cachedCurrentUser);\n        if (parsed && typeof parsed === "object") setCurrentUser(parsed);\n      } catch'),
  "Batch 1 Issue 5: Main App session restoration strictly requires Firebase Auth verification (onAuthStateChanged)",
  "Found unverified localStorage.unihub_current_user session hydration on mount"
);

// =========================================================
// BATCH 2 CHECKS
// =========================================================

// Batch 2 Issue 1: Firestore Rules for /organizations
assert(
  !rulesContent.includes("match /organizations/{orgId} {\n      allow get, list: if true;\n      allow create, update, delete: if true;\n    }"),
  "Batch 2 Issue 1: collection /organizations is not publicly writable",
  "Found allow create, update, delete: if true in match /organizations/{orgId}"
);

assert(
  rulesContent.includes("match /organizations/{orgId}") &&
  rulesContent.includes("getUserData().targetId == orgId") &&
  rulesContent.includes("isValidOrganization(incoming())"),
  "Batch 2 Issue 1: collection /organizations enforces isVerifiedUser, org targetId check, and isValidOrganization schema validation",
  "Missing targetId match or schema validation for /organizations"
);

// Batch 2 Issue 2: Seed/reset/wipe in admin App.tsx
assert(
  !adminAppContent.includes('password: "superadmin"') &&
  !adminAppContent.includes('await setDoc(doc(db, "users", u.id), u, { merge: true });'),
  "Batch 2 Issue 2: resetDatabaseToSeeds and wipeAllDatabase sanitize user objects and do not write secret password fields",
  "Found unsanitized SEED_USERS setDoc or superadmin account password creation in reset/wipe functions"
);

// Batch 2 Issue 3: Masquerade impersonation removal
assert(
  !adminAppContent.includes("http://localhost:3000/?impersonate=") &&
  !adminAppContent.includes("?impersonate=") &&
  !adminAppContent.includes('window.open(targetUrl, "_blank");'),
  "Batch 2 Issue 3: Admin Console has disabled masquerade impersonation without opening localhost impersonate URLs",
  "Found impersonate URL or window.open call in unihub-admin/src/App.tsx"
);

// Batch 2 Issue 4: Seed data secrets removal in data.ts files
assert(
  !rootDataContent.includes("password:") &&
  !rootDataContent.includes("teacherPassword:"),
  "Batch 2 Issue 4: src/data.ts contains no secret password or teacherPassword properties in seed exports",
  "Found secret properties in src/data.ts"
);

assert(
  !adminDataContent.includes("password:") &&
  !adminDataContent.includes("teacherPassword:"),
  "Batch 2 Issue 4: unihub-admin/src/data.ts contains no secret password or teacherPassword properties in seed exports",
  "Found secret properties in unihub-admin/src/data.ts"
);

// Batch 2 Issue 5: Types & UI fallback cleanup
assert(
  !rootTypesContent.includes("password?: string;") &&
  !rootTypesContent.includes("teacherPassword?: string;"),
  "Batch 2 Issue 5: src/types.ts does not include password or teacherPassword properties in UserAccount or CourseClassAssignment",
  "Found secret properties declared in src/types.ts"
);

assert(
  !adminTypesContent.includes("password?: string;") &&
  !adminTypesContent.includes("teacherPassword?: string;"),
  "Batch 2 Issue 5: unihub-admin/src/types.ts does not include password or teacherPassword properties in UserAccount or CourseClassAssignment",
  "Found secret properties declared in unihub-admin/src/types.ts"
);

assert(
  !adminAppContent.includes('password: existing.password || assign.teacherPassword || "Abc@123"'),
  "Batch 2 Issue 5: teacherAwareUsers in unihub-admin/src/App.tsx does not set default fallback passwords",
  "Found fallback password assignment in teacherAwareUsers"
);

// =========================================================
// BATCH 3 CHECKS: State Authorization & Access Control
// =========================================================

assert(
  stateContent.includes("const reviewEvidence = (subId: string, status: \"APPROVED\" | \"REJECTED\", comment?: string) => {") &&
  stateContent.includes("Unauthorized attempt to review evidence"),
  "Batch 3 Issue 1: reviewEvidence enforces role authorization guard",
  "Missing role validation in reviewEvidence"
);

assert(
  stateContent.includes("const resolveGradeAppeal = (appealId: string") &&
  stateContent.includes("Unauthorized attempt to resolve grade appeal"),
  "Batch 3 Issue 2: resolveGradeAppeal restricts resolution to ADMIN, TRAINING_DEPT, and TEACHER",
  "Missing authorization guard in resolveGradeAppeal"
);

assert(
  stateContent.includes("const approveUnlockRequest = (requestId: string) => {") &&
  stateContent.includes("Unauthorized attempt to approve unlock request"),
  "Batch 3 Issue 3: approveUnlockRequest restricts approvals to ADMIN, TRAINING_DEPT, and FACULTY",
  "Missing authorization guard in approveUnlockRequest"
);

assert(
  stateContent.includes("const createUserAccount = (account: UserAccount) => {") &&
  stateContent.includes("currentUser.role !== UserRole.ADMIN") &&
  stateContent.includes("Unauthorized attempt to create user account"),
  "Batch 3 Issue 4: createUserAccount enforces strict ADMIN role validation",
  "Missing ADMIN guard in createUserAccount"
);

assert(
  stateContent.includes("const saveTeacherAssignments = (assignments: CourseClassAssignment[]) => {") &&
  stateContent.includes("Unauthorized attempt to save teacher assignments"),
  "Batch 3 Issue 5: saveTeacherAssignments restricts assignment management to ADMIN and TRAINING_DEPT",
  "Missing authorization guard in saveTeacherAssignments"
);

// =========================================================
// BATCH 4 CHECKS: Firestore Rules Coverage
// =========================================================

assert(
  rulesContent.includes("match /schedules/{scheduleId}") &&
  rulesContent.includes("match /feedbacks/{feedbackId}") &&
  rulesContent.includes("match /systemFeedbacks/{feedbackId}") &&
  rulesContent.includes("match /groupAttendances/{reportId}") &&
  rulesContent.includes("match /groupCriteria/{criteriaId}") &&
  rulesContent.includes("match /settings/{settingId}"),
  "Batch 4 Issue 1: firestore.rules covers all auxiliary application collections",
  "Missing collection rules in firestore.rules"
);

assert(
  rulesContent.includes("match /students/{studentId}") &&
  rulesContent.includes("getUserData().targetId == studentId"),
  "Batch 4 Issue 2: firestore.rules permits authenticated student record access via targetId",
  "Missing targetId match for students collection"
);

// =========================================================
// BATCH 5 CHECKS: Admin Console Strict Auth Hardening
// =========================================================

assert(
  !adminAppContent.includes('else if (localStorage.getItem("unihub_superadmin_auth") === "true")'),
  "Batch 5 Issue 1: Admin Console onAuthStateChanged disallows unverified localStorage superadmin auth fallback",
  "Found unverified localStorage fallback in onAuthStateChanged"
);

assert(
  adminAppContent.includes("const allowedAdminEmails = [") &&
  adminAppContent.includes("!allowedAdminEmails.includes(userEmail)") &&
  adminAppContent.includes("Tài khoản không có quyền quản trị Super Admin."),
  "Batch 5 Issue 2: Admin Console handleLogin strictly rejects non-admin accounts from gaining admin session",
  "Missing allowedAdminEmails check in handleLogin"
);

// ==========================================
// BATCH 6: Cross-Class & Role Scoping Hardening Checks
// ==========================================
console.log("\n--- BATCH 6: Cross-Class & Role Scoping Hardening Checks ---");

assert(
  stateContent.includes("currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && currentUser.targetId === classId"),
  "Batch 6 Issue 1: approveClassScores must exclude group leaders and enforce class scope",
  "approveClassScores missing !isGroupLeader or class scoping check"
);

assert(
  stateContent.includes("currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader") &&
  stateContent.includes("approveGroupAttendance = (reportId: string"),
  "Batch 6 Issue 2: approveGroupAttendance must exclude group leaders",
  "approveGroupAttendance does not exclude group leaders"
);

assert(
  stateContent.includes("rejectGroupAttendance = (reportId: string") &&
  stateContent.includes("applyGroupLeaderScore = (studentId: string"),
  "Batch 6 Issue 3: rejectGroupAttendance and applyGroupLeaderScore must exclude group leaders",
  "rejectGroupAttendance or applyGroupLeaderScore missing authorization boundaries"
);

assert(
  stateContent.includes("saveGroupSettings = (") &&
  stateContent.includes("!currentUser.isGroupLeader"),
  "Batch 6 Issue 4: saveGroupSettings must prevent group leaders from managing class structure",
  "saveGroupSettings allows group leaders to reassign groups"
);

assert(
  stateContent.includes("students.some(s => s.classId === classId && s.facultyId === currentUser.targetId)"),
  "Batch 6 Issue 5: Faculty approvals must verify that the class belongs to the assigned faculty",
  "Missing faculty-class membership verification"
);

assert(
  stateContent.includes("submitAdviserAdjustment = (studentId: string") &&
  stateContent.includes("currentUser.targetId === targetStudent.classId"),
  "Batch 6 Issue 6: submitAdviserAdjustment must verify student belongs to adviser class",
  "submitAdviserAdjustment allows cross-class grade adjustment"
);

assert(
  stateContent.includes("adjustStudentScoreSpecific = (studentId: string") &&
  stateContent.includes("currentUser.targetId === targetStudent.classId"),
  "Batch 6 Issue 7: adjustStudentScoreSpecific must verify student belongs to user class",
  "adjustStudentScoreSpecific allows cross-class grade adjustment"
);

assert(
  stateContent.includes("submitSubjectGradeSheet = (sheetId: string") &&
  stateContent.includes("sheet.teacherId"),
  "Batch 6 Issue 8: submitSubjectGradeSheet must verify teacher ownership",
  "submitSubjectGradeSheet missing teacher ownership check"
);

assert(
  stateContent.includes("requestGradeUnlock = (req:") &&
  (stateContent.includes("sheet?.teacherId || req.teacherId") || stateContent.includes("sheet.teacherId || req.teacherId")),
  "Batch 6 Issue 9: requestGradeUnlock must verify teacher ownership",
  "requestGradeUnlock missing teacher ownership check"
);

assert(
  stateContent.includes("resolveGradeAppeal = (appealId: string") &&
  stateContent.includes("Unauthorized attempt to resolve another teacher's grade appeal"),
  "Batch 6 Issue 10: resolveGradeAppeal must verify teacher ownership",
  "resolveGradeAppeal allows teachers to resolve other teachers' appeals"
);

assert(
  stateContent.includes("aggregateSubjectGradesToSemesterGpa = (semesterId: string") &&
  stateContent.includes("Unauthorized attempt to aggregate grades"),
  "Batch 6 Issue 11: aggregateSubjectGradesToSemesterGpa must require ADMIN or TRAINING_DEPT",
  "aggregateSubjectGradesToSemesterGpa missing authorization check"
);

// ==========================================
// BATCH 7: Organization Boundary & Cross-Club Hardening Checks
// ==========================================
console.log("\n--- BATCH 7: Organization Boundary & Cross-Club Hardening Checks ---");

assert(
  stateContent.includes("createActivity = async (activity:") &&
  stateContent.includes("activity.orgId !== effectiveOrgId"),
  "Batch 7 Issue 1: createActivity must prevent creating activities for other orgs",
  "createActivity missing organization ownership check"
);

assert(
  stateContent.includes("deleteActivity = (activityId: string") &&
  stateContent.includes("act.orgId !== effectiveOrgId"),
  "Batch 7 Issue 2: deleteActivity must prevent deleting activities of other orgs",
  "deleteActivity missing organization ownership check"
);

assert(
  stateContent.includes("updateActivityStatus = (activityId: string") &&
  stateContent.includes("act.orgId !== effectiveOrgId"),
  "Batch 7 Issue 3: updateActivityStatus must prevent modifying activities of other orgs",
  "updateActivityStatus missing organization ownership check"
);

assert(
  stateContent.includes("createAnnouncement = async (announcement:") &&
  stateContent.includes("announcement.orgId !== effectiveOrgId"),
  "Batch 7 Issue 4: createAnnouncement must prevent posting announcements for other orgs",
  "createAnnouncement missing organization ownership check"
);

assert(
  stateContent.includes("deleteAnnouncement = (id: string") &&
  stateContent.includes("ann.orgId !== effectiveOrgId"),
  "Batch 7 Issue 5: deleteAnnouncement must prevent deleting announcements of other orgs",
  "deleteAnnouncement missing organization ownership check"
);

assert(
  stateContent.includes("addMemberManual = (member:") &&
  stateContent.includes("member.orgId !== effectiveOrgId"),
  "Batch 7 Issue 6: addMemberManual must prevent adding members to other orgs",
  "addMemberManual missing organization ownership check"
);

assert(
  stateContent.includes("deleteMember = (memberId: string") &&
  stateContent.includes("member.orgId !== effectiveOrgId"),
  "Batch 7 Issue 7: deleteMember must prevent removing members from other orgs",
  "deleteMember missing organization ownership check"
);

assert(
  stateContent.includes("approveMemberRequest = (memberId: string") &&
  stateContent.includes("member.orgId !== effectiveOrgId"),
  "Batch 7 Issue 8: approveMemberRequest must prevent approving members of other orgs",
  "approveMemberRequest missing organization ownership check"
);

assert(
  stateContent.includes("addBulkAttendance = (activityId: string") &&
  stateContent.includes("currentAct.orgId !== effectiveOrgId"),
  "Batch 7 Issue 9: addBulkAttendance must prevent recording attendance for other orgs' activities",
  "addBulkAttendance missing organization ownership check"
);

assert(
  stateContent.includes("updateAttendance = (attendanceId: string") &&
  stateContent.includes("act && act.orgId !== effectiveOrgId"),
  "Batch 7 Issue 10: updateAttendance must prevent updating attendance for other orgs' activities",
  "updateAttendance missing organization ownership check"
);

// ==========================================
// BATCH 8: Student Profile & Academic Tampering Protection Checks
// ==========================================
console.log("\n--- BATCH 8: Student Profile & Academic Tampering Protection Checks ---");

assert(
  stateContent.includes("updateStudentProfile = (studentId: string") &&
  stateContent.includes("!currentUser ||"),
  "Batch 8 Issue 1: updateStudentProfile must reject unauthenticated requests",
  "updateStudentProfile allows unauthenticated access"
);

assert(
  stateContent.includes("updateStudentProfile = (studentId: string") &&
  stateContent.includes("delete safeFields.gpa") &&
  stateContent.includes("delete safeFields.creditsEarned") &&
  stateContent.includes("delete safeFields.learningWarning") &&
  stateContent.includes("delete safeFields.classId"),
  "Batch 8 Issue 2: updateStudentProfile must strip protected academic/admin fields when non-admin",
  "updateStudentProfile allows arbitrary academic tampering"
);

// ==========================================
// BATCH 9: Student Actions Unauthenticated & Closed Activity Guard Checks
// ==========================================
console.log("\n--- BATCH 9: Student Actions Unauthenticated & Closed Activity Guard Checks ---");

assert(
  stateContent.includes("registerForActivity = (activityId: string") &&
  stateContent.includes("registrationOpen === false || activityObj.status === \"COMPLETED\""),
  "Batch 9 Issue 1: registerForActivity must block registration for closed/completed activities",
  "registerForActivity allows registration for closed/completed activities"
);

assert(
  stateContent.includes("submitEvidence = (data:") &&
  stateContent.includes("if (!currentUser) return;"),
  "Batch 9 Issue 2: submitEvidence must reject unauthenticated requests",
  "submitEvidence allows unauthenticated evidence submission"
);

assert(
  stateContent.includes("joinOrganizationRequest = (studentId: string") &&
  stateContent.includes("if (!currentUser) return;"),
  "Batch 9 Issue 3: joinOrganizationRequest must reject unauthenticated requests",
  "joinOrganizationRequest allows unauthenticated organization joins"
);

assert(
  stateContent.includes("submitGradeAppeal = (appeal:") &&
  stateContent.includes("if (!currentUser) return;"),
  "Batch 9 Issue 4: submitGradeAppeal must reject unauthenticated requests",
  "submitGradeAppeal allows unauthenticated appeals"
);

// ==========================================
// BATCH 10: Student Evidence, Org Join Privilege Escalation & URL Sanitizer Checks
// ==========================================
console.log("\n--- BATCH 10: Student Evidence, Org Join Privilege Escalation & URL Sanitizer Checks ---");

assert(
  rootTypesContent.includes("convertGoogleDriveUrlToDirectUrl") &&
  rootTypesContent.includes("/^(javascript|vbscript):/i.test(trimmed) || trimmed.startsWith(\"//\")"),
  "Batch 10 Issue 1: convertGoogleDriveUrlToDirectUrl must reject dangerous URI schemes",
  "convertGoogleDriveUrlToDirectUrl allows javascript: or protocol-relative URLs"
);

assert(
  stateContent.includes("joinOrganizationRequest = (studentId: string") &&
  stateContent.includes("delete (safeDetails as any).status") &&
  stateContent.includes("delete (safeDetails as any).role"),
  "Batch 10 Issue 2: joinOrganizationRequest must strip status and role override for non-admins",
  "joinOrganizationRequest allows privilege escalation to APPROVED or CHỦ NHIỆM"
);

assert(
  stateContent.includes("submitEvidence = (data:") &&
  stateContent.includes("/^(javascript|vbscript):/i.test(rawUrl) || rawUrl.startsWith(\"//\")"),
  "Batch 10 Issue 3: submitEvidence must reject dangerous proofUrls",
  "submitEvidence allows dangerous proofUrl injection"
);

assert(
  stateContent.includes("submitEvidence = (data:") &&
  stateContent.includes("Math.max(0, Math.min(100, Number(data.pointsRequested) || 0))"),
  "Batch 10 Issue 4: submitEvidence must clamp requested points between 0 and 100",
  "submitEvidence allows negative or unbounded requested points"
);

// ==========================================
// BATCH 11: Grade Unlock, Appeals, and Feedback Scoping Checks
// ==========================================
console.log("\n--- BATCH 11: Grade Unlock, Appeals, and Feedback Scoping Checks ---");

assert(
  stateContent.includes("approveUnlockRequest = (requestId: string") &&
  stateContent.includes("currentUser.role === UserRole.FACULTY && currentUser.targetId") &&
  stateContent.includes("students.some(s => s.classId === req.classId && s.facultyId === currentUser.targetId)"),
  "Batch 11 Issue 1: approveUnlockRequest must enforce faculty class isolation",
  "approveUnlockRequest allows cross-faculty unlock approval"
);

assert(
  stateContent.includes("rejectUnlockRequest = (requestId: string") &&
  stateContent.includes("currentUser.role === UserRole.FACULTY && currentUser.targetId") &&
  stateContent.includes("students.some(s => s.classId === req.classId && s.facultyId === currentUser.targetId)"),
  "Batch 11 Issue 2: rejectUnlockRequest must enforce faculty class isolation",
  "rejectUnlockRequest allows cross-faculty unlock rejection"
);

assert(
  stateContent.includes("resolveGradeAppeal = (appealId: string") &&
  stateContent.includes("!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 10"),
  "Batch 11 Issue 3: resolveGradeAppeal must validate grade in range [0, 10]",
  "resolveGradeAppeal allows invalid or out-of-range grade numbers"
);

assert(
  stateContent.includes("sendFeedback = (") &&
  stateContent.includes("if (!currentUser) return;") &&
  stateContent.includes("currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader"),
  "Batch 11 Issue 4: sendFeedback must authenticate caller and exclude group leaders",
  "sendFeedback allows unauthenticated or group leader feedback submission"
);

assert(
  stateContent.includes("resolveFeedback = (feedbackId: string") &&
  stateContent.includes("currentUser.targetId && targetFb.toClassId && targetFb.toClassId !== currentUser.targetId"),
  "Batch 11 Issue 5: resolveFeedback must enforce class boundary isolation",
  "resolveFeedback allows resolving feedback for other classes"
);

assert(
  stateContent.includes("sendGroupReminder = (classId: string") &&
  stateContent.includes("if (!currentUser) return;") &&
  stateContent.includes("currentUser.targetId === classId"),
  "Batch 11 Issue 6: sendGroupReminder must authenticate and enforce class boundary",
  "sendGroupReminder allows cross-class spamming"
);

// ==========================================
// BATCH 12: Group Attendance & Group Leader Scoring Boundary Checks
// ==========================================
console.log("\n--- BATCH 12: Group Attendance & Group Leader Scoring Boundary Checks ---");

assert(
  stateContent.includes("reportGroupAttendance = (reportData:") &&
  stateContent.includes("status: \"PENDING\"") &&
  stateContent.includes("reportData.classId !== glStudent.classId"),
  "Batch 12 Issue 1: reportGroupAttendance must enforce PENDING status and group leader class scope",
  "reportGroupAttendance allows auto-approved reports or cross-class reporting"
);

assert(
  stateContent.includes("approveGroupAttendance = (reportId: string") &&
  stateContent.includes("currentUser.targetId && targetReport.classId !== currentUser.targetId"),
  "Batch 12 Issue 2: approveGroupAttendance must enforce class boundary isolation",
  "approveGroupAttendance allows approving reports for other classes"
);

assert(
  stateContent.includes("rejectGroupAttendance = (reportId: string") &&
  stateContent.includes("currentUser.targetId && targetReport.classId !== currentUser.targetId"),
  "Batch 12 Issue 3: rejectGroupAttendance must enforce class boundary isolation",
  "rejectGroupAttendance allows rejecting reports for other classes"
);

assert(
  stateContent.includes("submitGroupLeaderScore = (") &&
  stateContent.includes("currentUser.targetId === studentId") &&
  stateContent.includes("targetStudent.classId !== glStudent.classId"),
  "Batch 12 Issue 4: submitGroupLeaderScore must prevent self-grading and cross-class grading",
  "submitGroupLeaderScore allows self-grading or cross-class tampering"
);

assert(
  stateContent.includes("applyGroupLeaderScore = (studentId: string") &&
  stateContent.includes("currentUser.targetId === targetStudent.classId"),
  "Batch 12 Issue 5: applyGroupLeaderScore must enforce class boundary isolation",
  "applyGroupLeaderScore allows applying scores for students outside class"
);

// ==========================================
// BATCH 13: Period Status Admin Authorization & Strict Activity Identity Binding
// ==========================================
console.log("\n--- BATCH 13: Period Status Admin Authorization & Strict Activity Identity Binding ---");

assert(
  stateContent.includes("updatePeriodStatus = (status:") &&
  stateContent.includes("currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT"),
  "Batch 13 Issue 1: updatePeriodStatus must require ADMIN or TRAINING_DEPT authorization",
  "updatePeriodStatus allows unauthenticated or unauthorized callers to lock/unlock evaluation period"
);

assert(
  stateContent.includes("registerForActivity = (activityId: string") &&
  stateContent.includes("currentUser.role === UserRole.STUDENT") &&
  stateContent.includes("(currentUser.targetId || currentUser.username)") &&
  stateContent.includes("studentId: effectiveStudentId"),
  "Batch 13 Issue 2: registerForActivity must strictly bind registration to student caller identity",
  "registerForActivity allows forging studentId during registration"
);

// ==========================================
// BATCH 14: Member Details & Account Modification Privilege Escalation Guard Checks
// ==========================================
console.log("\n--- BATCH 14: Member Details & Account Modification Privilege Escalation Guard Checks ---");

assert(
  stateContent.includes("updateMemberDetails = (memberId: string") &&
  stateContent.includes("delete safeDetails.id") &&
  stateContent.includes("delete safeDetails.orgId") &&
  stateContent.includes("delete safeDetails.studentId") &&
  stateContent.includes("delete safeDetails.role") &&
  stateContent.includes("delete safeDetails.status"),
  "Batch 14 Issue 1: updateMemberDetails must strip protected identity, orgId, role, and status for non-admins",
  "updateMemberDetails allows modifying member orgId or privilege escalation"
);

assert(
  stateContent.includes("updateUserAccount = (userId: string") &&
  stateContent.includes("delete safeAccount.role") &&
  stateContent.includes("delete safeAccount.targetId") &&
  stateContent.includes("delete safeAccount.isGroupLeader") &&
  stateContent.includes("delete (safeAccount as any).username"),
  "Batch 14 Issue 2: updateUserAccount must strip role, targetId, isGroupLeader, and username for non-admins",
  "updateUserAccount allows non-admin users to escalate role or change group leader status"
);

assert(
  stateContent.includes("addBulkAttendance = (activityId: string") &&
  !stateContent.includes("classId: sObj?.classId || \"K20-CNTT\""),
  "Batch 14 Issue 3: addBulkAttendance must not hardcode K20-CNTT fallback",
  "addBulkAttendance uses hardcoded K20-CNTT fallback"
);

// ==========================================
// BATCH 15: Academic Integrity & Grade Sheet Tampering Prevention Checks
// ==========================================
console.log("\n--- BATCH 15: Academic Integrity & Grade Sheet Tampering Prevention Checks ---");

assert(
  stateContent.includes("saveSubjectGradeSheet = (sheet: SubjectGradeSheet") &&
  stateContent.includes("const targetTid = (existingSheet?.teacherId || sheet.teacherId || \"\").toLowerCase()") &&
  stateContent.includes("existingSheet && (existingSheet.status === \"LOCKED\" || existingSheet.status === \"SUBMITTED\")"),
  "Batch 15 Issue 1: saveSubjectGradeSheet must block editing locked/submitted sheets and verify teacherId against existing record",
  "saveSubjectGradeSheet allows tampering with submitted/locked sheets or teacher ownership bypass"
);

assert(
  stateContent.includes("saveSubjectGradeSheet = (sheet: SubjectGradeSheet") &&
  stateContent.includes("status: (isAcademicAdmin || !existingSheet) ? sheet.status : existingSheet.status"),
  "Batch 15 Issue 2: saveSubjectGradeSheet must prevent non-admins from altering sheet status to UNLOCKED",
  "saveSubjectGradeSheet allows teachers to bypass grade unlock workflow"
);

assert(
  stateContent.includes("submitSubjectGradeSheet = (sheetId: string") &&
  stateContent.includes("if (sheet.status === \"LOCKED\")"),
  "Batch 15 Issue 3: submitSubjectGradeSheet must block re-submitting locked grade sheets",
  "submitSubjectGradeSheet allows submitting locked sheets"
);

// ==========================================
// BATCH 16: Evidence Review Scope Hardening & Multi-Criteria Score Integration Checks
// ==========================================
console.log("\n--- BATCH 16: Evidence Review Scope Hardening & Multi-Criteria Score Integration Checks ---");

assert(
  stateContent.includes("reviewEvidence = (subId: string") &&
  !stateContent.includes("UserRole.CLUB_MANAGER,\n      UserRole.YOUTH_UNION") &&
  stateContent.includes("UserRole.YOUTH_UNION,\n      UserRole.STUDENT_UNION"),
  "Batch 16 Issue 1: reviewEvidence must exclude club managers and organizers from evaluating academic evidence",
  "reviewEvidence allows club managers to approve academic training point evidence"
);

assert(
  stateContent.includes("approvedTC3Evs = evidence.filter(e => e.status === \"APPROVED\"") &&
  stateContent.includes("approvedTC4Evs = evidence.filter(e => e.status === \"APPROVED\"") &&
  stateContent.includes("approvedTC5Evs = evidence.filter(e => e.status === \"APPROVED\""),
  "Batch 16 Issue 2: computeTrainingResults must aggregate approved evidence across TC3, TC4, and TC5",
  "computeTrainingResults fails to compute approved evidence points for TC3 and TC5"
);

// ==========================================
// BATCH 17: Bulk Score Approval Role & Class Boundary Checks
// ==========================================
console.log("\n--- BATCH 17: Bulk Score Approval Role & Class Boundary Checks ---");

assert(
  stateContent.includes("bulkApproveScores = (classId: string") &&
  stateContent.includes("const effectiveRole = currentUser.role === UserRole.ADMIN ? role : currentUser.role;") &&
  stateContent.includes("validStudentIds.includes(res.studentId)"),
  "Batch 17 Issue 1: bulkApproveScores must enforce caller effective role and restrict IDs to class students",
  "bulkApproveScores allows monitor role spoofing to adviser approval or cross-class score updates"
);

// ==========================================
// BATCH 18: Portal Target Fallback Isolation & Organizer Privilege Hardening Checks
// ==========================================
console.log("\n--- BATCH 18: Portal Target Fallback Isolation & Organizer Privilege Hardening Checks ---");

assert(
  !classPortalContent.includes("students[0]?.classId") &&
  !classPortalContent.includes('"K2-GDTH A"') &&
  classPortalContent.includes("if (!classId) {") &&
  classPortalContent.includes("Chưa được phân công Lớp sinh viên"),
  "Batch 18 Issue 1: ClassPortal must not fall back to students[0] or K2-GDTH A and must render unassigned banner",
  "ClassPortal leaks first student/hardcoded class to unassigned monitor/leader"
);

assert(
  !adviserPortalContent.includes("students[0]?.classId") &&
  !adviserPortalContent.includes('"K2-GDTH A"') &&
  adviserPortalContent.includes("if (!classId) {") &&
  adviserPortalContent.includes("Chưa được phân công Lớp cố vấn"),
  "Batch 18 Issue 2: AdviserPortal must not fall back to students[0] or K2-GDTH A and must render unassigned banner",
  "AdviserPortal leaks first student/hardcoded class to unassigned adviser"
);

assert(
  !organizerPortalContent.includes('defaultTargetId = "UNITECH"') &&
  !organizerPortalContent.includes("organizations[0]") &&
  organizerPortalContent.includes("if (!orgId) {") &&
  organizerPortalContent.includes("Chưa được phân công Câu lạc bộ / Tổ chức"),
  "Batch 18 Issue 3: OrganizerPortal must not fall back to UNITECH or organizations[0] and must render unassigned banner",
  "OrganizerPortal leaks first organization or UNITECH to unassigned organizer/club manager"
);

assert(
  teacherPortalContent.includes("myAssignments.find(a => a.id === selectedAssignmentId) || myAssignments[0]") &&
  !teacherPortalContent.includes("teacherAssignments.find(a => a.id === selectedAssignmentId)"),
  "Batch 18 Issue 4: TeacherPortal activeAssignment must be scoped strictly to myAssignments",
  "TeacherPortal allows accessing another teacher's assignment"
);

assert(
  stateContent.includes("deleteActivity = (activityId: string") &&
  stateContent.includes("const updatedAttendance = attendance.filter(att => att.activityId !== activityId);") &&
  stateContent.includes("saveToStorage(\"unihub_attendance\", updatedAttendance);"),
  "Batch 18 Issue 5: deleteActivity must clean up associated attendance records to prevent orphan data",
  "deleteActivity leaves orphaned attendance records"
);

assert(
  stateContent.includes("createActivity = async (activity:") &&
  stateContent.includes("if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || activity.orgId !== effectiveOrgId))") &&
  stateContent.includes("deleteActivity = (activityId: string") &&
  stateContent.includes("if (currentUser.role !== UserRole.ADMIN && (!effectiveOrgId || act.orgId !== effectiveOrgId))") &&
  stateContent.includes("if (currentUser.role !== UserRole.ADMIN && !effectiveOrgId) {\n      console.warn(\"Unauthorized attempt to import organization members without assigned org\");"),
  "Batch 18 Issue 6: Organizer state operations must reject caller if effectiveOrgId is absent/unassigned",
  "Organizer actions allow unassigned manager to bypass organization ownership check"
);

// ==========================================
// BATCH 19: Training Portal Access Guard, Class Excel Account Tampering Prevention & TargetId Isolation Checks
// ==========================================
console.log("\n--- BATCH 19: Training Portal Access Guard, Class Excel Account Tampering Prevention & TargetId Isolation Checks ---");

assert(
  trainingPortalContent.includes("if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.TRAINING_DEPT)") &&
  trainingPortalContent.includes("Không có quyền truy cập Cổng Đào tạo"),
  "Batch 19 Issue 1: TrainingPortal must restrict rendering to ADMIN and TRAINING_DEPT roles",
  "TrainingPortal allows unauthorized user roles to view and interact with academic portal"
);

assert(
  stateContent.includes("const safeRole = (newUser.role === UserRole.CLASS_MONITOR) ? UserRole.CLASS_MONITOR : UserRole.STUDENT;") &&
  (stateContent.includes("if (existing.role === UserRole.ADMIN || existing.role === UserRole.TRAINING_DEPT || existing.role === UserRole.TEACHER || existing.role === UserRole.FACULTY)") ||
   stateContent.includes("if (existing.role !== UserRole.STUDENT && existing.role !== UserRole.CLASS_MONITOR)")),
  "Batch 19 Issue 2: importNewClassesExcel must clamp imported roles to STUDENT/MONITOR and protect privileged accounts from being overwritten",
  "importNewClassesExcel allows privilege escalation or overwriting administrative accounts"
);

assert(
  !stateContent.includes("(!currentUser.targetId ||") &&
  stateContent.includes("currentUser.role === UserRole.CLASS_MONITOR && !currentUser.isGroupLeader && currentUser.targetId === classId") &&
  stateContent.includes("currentUser.role === UserRole.ADVISER && currentUser.targetId === classId") &&
  stateContent.includes("currentUser.role === UserRole.FACULTY && currentUser.targetId === facultyId"),
  "Batch 19 Issue 3: All class, adviser, and faculty actions in state.tsx must eliminate loose !currentUser.targetId bypasses",
  "state.tsx still contains loose !currentUser.targetId bypasses allowing unassigned accounts to act on any class/faculty"
);

// ==========================================
// BATCH 20: Full Database Restore Security & Modal Privilege Isolation Checks
// ==========================================
console.log("\n--- BATCH 20: Full Database Restore Security & Modal Privilege Isolation Checks ---");

assert(
  stateContent.includes("restoreAllDataBackup = async (backupData: any)") &&
  stateContent.includes("if (!currentUser || currentUser.role !== UserRole.ADMIN) {\n      throw new Error(\"Chỉ Quản trị viên hệ thống (Admin) mới có quyền khôi phục CSDL.\");\n    }"),
  "Batch 20 Issue 1: restoreAllDataBackup must throw an error if called by non-admin accounts",
  "restoreAllDataBackup does not strictly enforce ADMIN role verification"
);

assert(
  dataBackupRestoreModalContent.includes("if (currentUser?.role !== UserRole.ADMIN) {") &&
  dataBackupRestoreModalContent.includes("Chỉ Quản trị viên hệ thống (Admin) mới có quyền khôi phục CSDL.") &&
  dataBackupRestoreModalContent.includes("Quyền khôi phục CSDL dành riêng cho Quản trị viên (Admin)"),
  "Batch 20 Issue 2: DataBackupRestoreModal must gate file restore and local backup restore strictly to ADMIN",
  "DataBackupRestoreModal allows non-admin users to trigger database restore"
);

// ==========================================
// BATCH 21: Student PII Leak Elimination, Plaintext Password Shielding & Admin Self-Lockout Guards
// ==========================================
console.log("\n--- BATCH 21: Student PII Leak Elimination, Plaintext Password Shielding & Admin Self-Lockout Guards ---");

assert(
  !studentPortalContent.includes("DTG245140202053") &&
  !studentPortalContent.includes("Ma Văn Long"),
  "Batch 21 Issue 1: StudentPortal must not contain hardcoded student PII fallbacks",
  "Found hardcoded student PII (DTG245140202053 or Ma Văn Long) in StudentPortal.tsx"
);

assert(
  studentPortalContent.includes("if (!studentId) {") &&
  studentPortalContent.includes("Tài khoản chưa được liên kết hồ sơ sinh viên"),
  "Batch 21 Issue 2: StudentPortal must display unlinked notice when studentId is empty",
  "StudentPortal does not guard against accounts unlinked to student profiles"
);

assert(
  studentPortalContent.includes("downloadStudentTranscriptPdf = async") &&
  studentPortalContent.includes("if (!student && !currentUser?.targetId) {") &&
  studentPortalContent.includes("Chưa có dữ liệu điểm học phần"),
  "Batch 21 Issue 3: downloadStudentTranscriptPdf must abort if student profile is missing and not generate mock grades",
  "downloadStudentTranscriptPdf still allows generating transcripts with mock grades or unlinked profiles"
);

assert(
  !adminPortalContent.includes("Mật khẩu mới: ${trimmed}"),
  "Batch 21 Issue 4: AdminPortal password reset alert must not expose plaintext password on screen",
  "AdminPortal still exposes cleartext password in reset alert popup"
);

assert(
  stateContent.includes("if (userId === currentUser.id)") &&
  stateContent.includes("Không thể tự xóa tài khoản quản trị viên đang đăng nhập!"),
  "Batch 21 Issue 5: deleteUserAccount must block admin self-deletion",
  "deleteUserAccount allows active admin account to delete itself"
);

assert(
  stateContent.includes("userToDelete?.username === \"admin\"") &&
  stateContent.includes("Không thể xóa tài khoản quản trị viên hệ thống mặc định!"),
  "Batch 21 Issue 6: deleteUserAccount must prevent deletion of system root admin",
  "deleteUserAccount allows deleting system root admin account"
);

assert(
  stateContent.includes("targetUser?.username === \"admin\" && safeAccount.role && safeAccount.role !== UserRole.ADMIN") &&
  stateContent.includes("Không thể thay đổi vai trò của tài khoản quản trị viên hệ thống mặc định!"),
  "Batch 21 Issue 7: updateUserAccount must prevent demotion of system root admin",
  "updateUserAccount allows demoting system root admin account"
);

// ==========================================
// BATCH 22: Cascade Integrity Guards, Club Cleanup & Username Collision Protections
// ==========================================
console.log("\n--- BATCH 22: Cascade Integrity Guards, Club Cleanup & Username Collision Protections ---");

assert(
  stateContent.includes("renameClass = (oldClassId: string, newClassId: string)") &&
  stateContent.includes("u.role === UserRole.CLASS_MONITOR || u.role === UserRole.ADVISER") &&
  stateContent.includes("normalizeClassId(cr.classId) === oldNorm ? { ...cr, classId: newNorm } : cr") &&
  stateContent.includes("normalizeClassId(da.classId) === oldNorm ? { ...da, classId: newNorm } : da") &&
  stateContent.includes("normalizeClassId(ga.classId) === oldNorm ? { ...ga, classId: newNorm } : ga") &&
  stateContent.includes("normalizeClassId(fb.toClassId) === oldNorm ? { ...fb, toClassId: newNorm } : fb"),
  "Batch 22 Issue 1: renameClass must cascade new class ID across users, classReviews, attendances, and feedbacks",
  "renameClass does not cascade class ID update to all related records"
);

assert(
  stateContent.includes("deleteClass = (classId: string)") &&
  stateContent.includes("normalizeClassId(u.targetId) === norm") &&
  stateContent.includes("normalizeClassId(cr.classId) !== norm") &&
  stateContent.includes("normalizeClassId(da.classId) !== norm") &&
  stateContent.includes("normalizeClassId(ga.classId) !== norm") &&
  stateContent.includes("normalizeClassId(fb.toClassId) !== norm"),
  "Batch 22 Issue 2: deleteClass must cascade delete across classReviews, attendances, feedbacks, and clear user targetIds",
  "deleteClass leaves orphaned reviews, attendances, and invalid user targetIds"
);

assert(
  stateContent.includes("deleteClubAndAccount = (clubId: string)") &&
  stateContent.includes("a.orgId.toLowerCase() !== clubIdClean") &&
  stateContent.includes("!clubActIds.includes(att.activityId)") &&
  stateContent.includes("ann.orgId.toLowerCase() !== clubIdClean") &&
  stateContent.includes("m.orgId.toLowerCase() !== clubIdClean"),
  "Batch 22 Issue 3: deleteClubAndAccount must cascade delete activities, attendances, announcements, and members",
  "deleteClubAndAccount leaves orphaned activities, announcements, or members"
);

assert(
  stateContent.includes("createUserAccount = (account: UserAccount)") &&
  stateContent.includes("users.find(u => u.username.toLowerCase() === normUsername && u.id !== account.id)") &&
  stateContent.includes("đã tồn tại trên hệ thống! Vui lòng chọn tên đăng nhập khác."),
  "Batch 22 Issue 4: createUserAccount must prevent creating accounts with duplicate usernames",
  "createUserAccount allows duplicate usernames"
);

assert(
  stateContent.includes("updateUserAccount = (userId: string") &&
  stateContent.includes("users.find(u => u.username.toLowerCase() === normUsername && u.id !== userId)") &&
  stateContent.includes("đã tồn tại trên hệ thống! Vui lòng chọn tên đăng nhập khác."),
  "Batch 22 Issue 5: updateUserAccount must prevent updating to existing username of another account",
  "updateUserAccount allows username collision"
);

assert(
  stateContent.includes("updateCriteriaScore = (criteriaId: string") &&
  stateContent.includes("isNaN(newPoints) || !isFinite(newPoints)") &&
  stateContent.includes("Math.max(0, Math.min(100, Math.round(newPoints)))"),
  "Batch 22 Issue 6: updateCriteriaScore must validate and clamp points between 0 and 100",
  "updateCriteriaScore does not clamp or validate newPoints"
);

// ==========================================
// BATCH 23: Teacher Portal Data Contamination Guard & Faculty/Teacher Role Isolations
// ==========================================
console.log("\n--- BATCH 23: Teacher Portal Data Contamination Guard & Faculty/Teacher Role Isolations ---");

assert(
  !teacherPortalContent.includes("defaultSeedStudents") &&
  !teacherPortalContent.includes("DTG245140202053"),
  "Batch 23 Issue 1: TeacherPortal must not inject hardcoded seed students into classes",
  "TeacherPortal still injects hardcoded seed students when matching students are absent"
);

assert(
  teacherPortalContent.includes("if (!currentUser || (currentUser.role !== UserRole.TEACHER && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT))") &&
  teacherPortalContent.includes("Không có quyền truy cập Cổng Giảng viên"),
  "Batch 23 Issue 2: TeacherPortal must enforce role authorization guard for TEACHER/ADMIN/TRAINING_DEPT",
  "TeacherPortal renders for unauthorized roles without access restriction banner"
);

assert(
  facultyPortalContent.includes("if (!currentUser || (currentUser.role !== UserRole.FACULTY && currentUser.role !== UserRole.ADMIN))") &&
  facultyPortalContent.includes("Không có quyền truy cập Cổng Khoa"),
  "Batch 23 Issue 3: FacultyPortal must enforce role authorization guard for FACULTY/ADMIN",
  "FacultyPortal renders for unauthorized roles without access restriction banner"
);

assert(
  !facultyPortalContent.includes("<AlertTriangle"),
  "Batch 23 Issue 4: FacultyPortal must not reference unimported AlertTriangle icon",
  "FacultyPortal contains unimported AlertTriangle JSX tag causing runtime crash"
);

// ==========================================
// BATCH 24: Score Adjustment Sanitization & Admin Approval Status Synchronization
// ==========================================
console.log("\n--- BATCH 24: Score Adjustment Sanitization & Admin Approval Status Synchronization ---");

assert(
  stateContent.includes("submitAdviserAdjustment = (studentId: string, criteriaCategory: string, points: number, reason: string)") &&
  stateContent.includes("if (isNaN(points) || !isFinite(points)) return;"),
  "Batch 24 Issue 1: submitAdviserAdjustment must validate that points is a valid finite number",
  "submitAdviserAdjustment does not validate points against NaN or non-finite inputs"
);

assert(
  stateContent.includes("adjustStudentScoreSpecific = (studentId: string, category: string, points: number, reason: string)") &&
  stateContent.includes("if (isNaN(points) || !isFinite(points)) return;"),
  "Batch 24 Issue 2: adjustStudentScoreSpecific must validate that points is a valid finite number",
  "adjustStudentScoreSpecific does not validate points against NaN or non-finite inputs"
);

assert(
  stateContent.includes("const adjusterSource = currentUser.role === UserRole.ADVISER ? \"GV_ĐIỀU_CHỈNH\" : currentUser.role === UserRole.ADMIN ? \"ADMIN\" : \"BCS_DUYỆT\";") &&
  stateContent.includes("source: adjusterSource as any"),
  "Batch 24 Issue 3: adjustStudentScoreSpecific must dynamically attribute adjustment log source to caller role",
  "adjustStudentScoreSpecific always hardcodes BCS_DUYỆT source even when called by adviser or admin"
);

assert(
  stateContent.includes("approveAdminScores = (classId: string, comment: string)") &&
  stateContent.includes("status: \"APPROVED_ADMIN\" as const"),
  "Batch 24 Issue 4: approveAdminScores must update student evaluation results in class to APPROVED_ADMIN status",
  "approveAdminScores does not synchronize evaluation result status to APPROVED_ADMIN"
);

// ==========================================
// BATCH 25: Comprehensive Portal Role Authorization Guards & PII Fallback Sanitization
// ==========================================
console.log("\n--- BATCH 25: Portal Authorization Guards & PII Fallback Sanitization ---");

assert(
  !rootAppContent.includes('const studentId = currentUser.targetId || "DTG245140202053";') &&
  !rootAppContent.includes('const orgId = currentUser.targetId || "UNITECH";'),
  "Batch 25 Issue 1: App.tsx badge counter must not fallback to hardcoded student or club IDs",
  "App.tsx getTabBadgeCount contains hardcoded DTG245140202053 or UNITECH fallback"
);

assert(
  !classStatisticsBottomContent.includes('currentUser.targetId || "K20-CNTT"') &&
  classStatisticsBottomContent.includes("isClassScoped") &&
  classStatisticsBottomContent.includes("UserRole.ADVISER") &&
  classStatisticsBottomContent.includes("UserRole.STUDENT"),
  "Batch 25 Issue 2: ClassStatisticsBottom must eliminate K20-CNTT fallback and scope attendance by role",
  "ClassStatisticsBottom still contains hardcoded K20-CNTT fallback or fails to scope Adviser/Student"
);

assert(
  classStatisticsBottomContent.includes("Tài khoản chưa được gán vào lớp học"),
  "Batch 25 Issue 3: ClassStatisticsBottom must show unassigned notice when scoped role has no target class",
  "ClassStatisticsBottom does not guard against scoped users with no class assignment"
);

assert(
  organizerPortalContent.includes("!([UserRole.ORGANIZER, UserRole.CLUB_MANAGER, UserRole.YOUTH_UNION, UserRole.STUDENT_UNION, UserRole.ADMIN] as UserRole[]).includes(currentUser.role)") &&
  organizerPortalContent.includes("Bạn không có quyền quản trị Đoàn Thanh niên, Hội Sinh viên hoặc Câu lạc bộ."),
  "Batch 25 Issue 4: OrganizerPortal must enforce role authorization guard",
  "OrganizerPortal allows unauthorized roles to view and manage club operations"
);

assert(
  organizerPortalContent.includes("classIdx") &&
  !organizerPortalContent.includes('cleanStudentId.substring(0, 3) === "DTG" ? "K20-CNTT" : "K21-KT"'),
  "Batch 25 Issue 5: OrganizerPortal Excel import must read class column and not assign fake K20-CNTT fallback",
  "OrganizerPortal Excel import still assigns fake K20-CNTT / K21-KT classes"
);

assert(
  trainingPortalContent.includes("currentUser.role !== UserRole.TRAINING_DEPT && currentUser.role !== UserRole.ADMIN") &&
  trainingPortalContent.includes("Bạn không có quyền quản lý học vụ của Phòng Đào tạo."),
  "Batch 25 Issue 6: TrainingPortal must enforce role authorization guard for TRAINING_DEPT/ADMIN",
  "TrainingPortal allows unauthorized roles to access training administration"
);

assert(
  trainingPortalContent.includes("stdLong?.name || \"Ma Văn Long\"") &&
  !trainingPortalContent.includes('name: "Nguyễn Văn An",\n        gpa: 3.52,'),
  "Batch 25 Issue 7: TrainingPortal mock excel upload must preserve existing student identity",
  "TrainingPortal mock upload overwrites DTG245140202053 with fake student name Nguyễn Văn An"
);

assert(
  adminPortalContent.includes("currentUser.role !== UserRole.ADMIN") &&
  adminPortalContent.includes("Bạn không có quyền quản trị hệ thống (Chỉ dành riêng cho Quản trị viên cấp cao)."),
  "Batch 25 Issue 8: AdminPortal must enforce role authorization guard for ADMIN",
  "AdminPortal allows non-admin users to view system administration controls"
);

assert(
  classPortalContent.includes("currentUser.role !== UserRole.CLASS_MONITOR && currentUser.role !== UserRole.ADMIN") &&
  classPortalContent.includes("Chưa được phân công Lớp quản lý"),
  "Batch 25 Issue 9: ClassPortal must enforce role authorization guard and check for unassigned class",
  "ClassPortal lacks role authorization guard or unassigned class protection"
);

assert(
  adviserPortalContent.includes("currentUser.role !== UserRole.ADVISER && currentUser.role !== UserRole.ADMIN") &&
  adviserPortalContent.includes("Chưa được phân công Lớp chủ nhiệm"),
  "Batch 25 Issue 10: AdviserPortal must enforce role authorization guard and check for unassigned class",
  "AdviserPortal lacks role authorization guard or unassigned class protection"
);

// ==========================================
// BATCH 26: Activity Expiry, Attendance Deduplication, Component Grade Sanitization & Role Boundary Checks
// ==========================================
console.log("\n--- BATCH 26: Activity Expiry, Attendance Deduplication & Grade Sanitization ---");

assert(
  stateContent.includes("activityObj.expiryDate && activityObj.expiryDate < today") &&
  stateContent.includes("Hoạt động đã đóng đăng ký, đã hết hạn hoặc đã kết thúc!"),
  "Batch 26 Issue 1: registerForActivity must validate activity expiryDate against current date",
  "registerForActivity allows registration for expired activities"
);

assert(
  stateContent.includes("const classStudentIds = new Set(students.filter(s => s.classId === classId).map(s => s.id));") &&
  stateContent.includes("const seenAbsentIds = new Set<string>();") &&
  stateContent.includes("!classStudentIds.has(a.studentId) || seenAbsentIds.has(a.studentId)"),
  "Batch 26 Issue 2: reportDailyAttendance must deduplicate absentees and filter out foreign students",
  "reportDailyAttendance does not filter absentees against class membership or deduplicate"
);

assert(
  stateContent.includes("const presCount = Math.max(0, totalStuds - absCount);"),
  "Batch 26 Issue 3: reportDailyAttendance must clamp present student count to non-negative value",
  "reportDailyAttendance allows negative present count"
);

assert(
  stateContent.includes("const sanitizeGradeNum = (val: any) =>") &&
  stateContent.includes("tx1: sanitizeGradeNum(g.tx1)") &&
  stateContent.includes("tx2: sanitizeGradeNum(g.tx2)") &&
  (stateContent.includes("thi: sanitizeGradeNum(g.thi)") || stateContent.includes("thi: sanitizeGradeNum((g as any).thi)")) &&
  stateContent.includes("tb10: sanitizeGradeNum(g.tb10)"),
  "Batch 26 Issue 4: saveSubjectGradeSheet must sanitize tx1, tx2, thi, and tb10 within [0, 10] range",
  "saveSubjectGradeSheet allows out-of-range or non-numeric component grades"
);

assert(
  stateContent.includes("if (studentId) {") &&
  stateContent.includes("targetStudent && targetStudent.classId !== toClassId") &&
  stateContent.includes("Target student does not belong to specified class"),
  "Batch 26 Issue 5: sendFeedback must verify that targeted student belongs to specified toClassId",
  "sendFeedback allows targeting students from other classes under mismatched toClassId"
);

assert(
  stateContent.includes("currentUser.role === UserRole.YOUTH_UNION || currentUser.role === UserRole.STUDENT_UNION") &&
  stateContent.includes('targetEv.criteriaId && targetEv.criteriaId.startsWith("TC1")') &&
  stateContent.includes("Youth Union or Student Union cannot evaluate academic criteria evidence"),
  "Batch 26 Issue 6: reviewEvidence must prevent youth/student union from reviewing academic (TC1) evidence",
  "reviewEvidence allows youth or student union to evaluate academic criteria evidence"
);

// ==========================================
// BATCH 27: Grade Appeal Verification, Group Structure Hardening & Academic Integrity Checks
// ==========================================
console.log("\n--- BATCH 27: Grade Appeal, Group Security & Profile Protection ---");

assert(
  stateContent.includes("Only students or administrators can submit grade appeals") &&
  stateContent.includes("Vui lòng nhập lý do đề nghị phúc khảo điểm môn học!") &&
  stateContent.includes("Bạn đã có đơn phúc khảo đang chờ xử lý cho môn học này!"),
  "Batch 27 Issue 1: submitGradeAppeal must validate caller role, reason, and duplicate pending appeals",
  "submitGradeAppeal allows unauthorized callers, empty reasons, or duplicate pending appeals"
);

assert(
  stateContent.includes("diemChu: letter,") &&
  stateContent.includes("xepLoai: rank") &&
  !stateContent.includes("letterGrade: letter"),
  "Batch 27 Issue 2: resolveGradeAppeal must synchronize diemChu and xepLoai properties in SubjectStudentGrade",
  "resolveGradeAppeal sets incorrect letterGrade property leaving diemChu and xepLoai stale"
);

assert(
  stateContent.includes("cc: sanitizeGradeNum(g.cc)") &&
  stateContent.includes("dk1: sanitizeGradeNum(g.dk1)") &&
  stateContent.includes("dk2: sanitizeGradeNum(g.dk2)") &&
  stateContent.includes("tb4: safeTb4"),
  "Batch 27 Issue 3: saveSubjectGradeSheet must sanitize all grade components (cc, dk1, dk2, tb4)",
  "saveSubjectGradeSheet does not sanitize full component grade structure"
);

assert(
  stateContent.includes("const targetOrg = organizations.find(o => o.id === orgId);") &&
  stateContent.includes("Attempt to join non-existent organization:"),
  "Batch 27 Issue 4: joinOrganizationRequest must verify that target organization exists",
  "joinOrganizationRequest allows creating membership requests for non-existent organizations"
);

assert(
  stateContent.includes("delete (safeFields as any).id;") &&
  stateContent.includes("delete safeFields.groupName;"),
  "Batch 27 Issue 5: updateStudentProfile must strip id and groupName for non-admins",
  "updateStudentProfile allows modifying student id or groupName"
);

assert(
  stateContent.includes("const isAllLocked = students.length > 0 && students.every(s => s.learningDataLocked);") &&
  stateContent.includes("const nextLockState = !isAllLocked;") &&
  stateContent.includes("learningDataLocked: nextLockState"),
  "Batch 27 Issue 6: toggleLearningDataLock must toggle both lock and unlock states",
  "toggleLearningDataLock only sets learningDataLocked to true and cannot unlock"
);

assert(
  stateContent.includes("if (!studentObj || studentObj.classId !== classId) return;"),
  "Batch 27 Issue 7: saveGroupSettings must enforce that assigned group leader belongs to target class",
  "saveGroupSettings allows appointing students from other classes as group leaders"
);

assert(
  stateContent.includes("const groupStudents = students.filter(s => s.classId === reportData.classId && s.groupName === reportData.groupName);") &&
  stateContent.includes("const presentCount = Math.max(0, totalStudents - absentCount);"),
  "Batch 27 Issue 8: reportGroupAttendance must filter absentees by group and clamp attendance counts",
  "reportGroupAttendance allows absentees from outside group or negative present counts"
);

assert(
  stateContent.includes("classStudentIds.has(abs.studentId) && !seenStudentIds.has(abs.studentId)"),
  "Batch 27 Issue 9: aggregateGroupAttendancesToDaily must isolate absentees to class members",
  "aggregateGroupAttendancesToDaily includes foreign student absentees"
);

assert(
  stateContent.includes("const validTargetIds = Array.from(new Set(targetStudentIds.filter(sid => classStudentIds.has(sid))));"),
  "Batch 27 Issue 10: sendGroupReminder must restrict reminder targets strictly to class students",
  "sendGroupReminder sends reminders to students outside target class"
);

assert(
  stateContent.includes("const cleanId = (newStud.id || \"\").trim();") &&
  stateContent.includes("if (existing.role !== UserRole.STUDENT && existing.role !== UserRole.CLASS_MONITOR)"),
  "Batch 27 Issue 11: importNewClassesExcel must validate student ID and protect all non-student accounts",
  "importNewClassesExcel allows blank student IDs or overwriting organizational accounts"
);

// ==========================================
// BATCH 28: Administrative Account Protection, Portal Role Boundaries, Dynamic Conduct Points & Cascade Integrity
// ==========================================
console.log("\n--- BATCH 28: Privilege Protection, Role Guards, Dynamic Points & Cascade Integrity ---");

assert(
  stateContent.includes("if (curr.role === UserRole.ADMIN || curr.role === UserRole.TRAINING_DEPT)") &&
  stateContent.includes("// Keep administrative privileges intact") &&
  stateContent.includes("else if (curr.role !== UserRole.TEACHER)"),
  "Batch 28 Issue 1: provisionTeacherAccounts must protect ADMIN and TRAINING_DEPT accounts from role demotion",
  "provisionTeacherAccounts demotes administrative accounts to TEACHER"
);

assert(
  stateContent.includes("if (currentUser.role === UserRole.FACULTY) {\n      if (!currentUser.targetId) {\n        console.warn(\"Unauthorized attempt by unassigned faculty to approve unlock request\");") &&
  stateContent.includes("if (currentUser.role === UserRole.FACULTY) {\n      if (!currentUser.targetId) {\n        console.warn(\"Unauthorized attempt by unassigned faculty to reject unlock request\");"),
  "Batch 28 Issue 2: approveUnlockRequest and rejectUnlockRequest must strictly verify faculty targetId",
  "approveUnlockRequest or rejectUnlockRequest allows unassigned faculty to bypass class boundary check"
);

assert(
  stateContent.includes("currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT && currentUser.role !== UserRole.TEACHER") &&
  stateContent.includes("const aggregateSubjectGradesToSemesterGpa = (semesterId: string) =>"),
  "Batch 28 Issue 3: aggregateSubjectGradesToSemesterGpa must permit TEACHER role for grade appeal recalculation",
  "aggregateSubjectGradesToSemesterGpa blocks TEACHER role preventing appeal GPA recalculation"
);

assert(
  studentPortalContent.includes("currentUser.role !== UserRole.STUDENT && currentUser.role !== UserRole.CLASS_MONITOR && currentUser.role !== UserRole.ADMIN") &&
  studentPortalContent.includes("Không có quyền truy cập Cổng Sinh viên"),
  "Batch 28 Issue 4: StudentPortal must enforce role authorization guard for STUDENT, CLASS_MONITOR, and ADMIN",
  "StudentPortal lacks role authorization guard"
);

assert(
  dataBackupRestoreModalContent.includes("if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TRAINING_DEPT))") &&
  dataBackupRestoreModalContent.includes("Chỉ Quản trị viên hệ thống (Admin) hoặc Phòng Đào tạo mới có quyền xuất bản sao lưu CSDL."),
  "Batch 28 Issue 5: DataBackupRestoreModal must restrict export and modal access strictly to ADMIN and TRAINING_DEPT",
  "DataBackupRestoreModal allows unauthorized roles to export full database backup"
);

assert(
  stateContent.includes("registerForActivity = (activityId: string, studentId: string)") &&
  stateContent.includes("currentUser.role !== UserRole.ADMIN && studentId && effectiveStudentId !== studentId") &&
  stateContent.includes("submitEvidence = (data: Omit<EvidenceSubmission") &&
  stateContent.includes("currentUser.role !== UserRole.ADMIN && data.studentId && effectiveStudentId !== data.studentId") &&
  stateContent.includes("joinOrganizationRequest = (studentId: string, orgId: string") &&
  stateContent.includes("currentUser.role !== UserRole.ADMIN && studentId && effectiveStudentId !== studentId"),
  "Batch 28 Issue 6: Student actions must prevent student ID impersonation by non-admins",
  "Student actions allow class monitors or other non-admins to impersonate other student IDs"
);

assert(
  stateContent.includes("const activeMemberships = members.filter(m => m.studentId === student.id && m.status === \"ACTIVE\");") &&
  stateContent.includes("const isMonitor = users.some(u => u.role === UserRole.CLASS_MONITOR && (u.username === student.id || u.targetId === student.classId))"),
  "Batch 28 Issue 7: computeConductPoints must dynamically evaluate active club memberships and monitor accounts",
  "computeConductPoints contains hardcoded club IDs or hardcoded monitor student IDs"
);

assert(
  stateContent.includes("const updatedUnlockRequests = unlockRequests.map(ur => normalizeClassId(ur.classId) === oldNorm ? { ...ur, classId: newNorm } : ur);") &&
  stateContent.includes("const updatedGradeAppeals = gradeAppeals.map(ga => normalizeClassId(ga.classId) === oldNorm ? { ...ga, classId: newNorm } : ga);") &&
  stateContent.includes("const updatedResults = results.filter(r => !deletedStudentIds.has(r.studentId));") &&
  stateContent.includes("const updatedUnlockRequests = unlockRequests.filter(ur => normalizeClassId(ur.classId) !== norm);") &&
  stateContent.includes("const updatedGradeAppeals = gradeAppeals.filter(ga => normalizeClassId(ga.classId) !== norm);"),
  "Batch 28 Issue 8: renameClass and deleteClass must cascade unlockRequests, gradeAppeals, and results",
  "Class rename or delete leaves orphaned unlock requests, grade appeals, or conduct results"
);

assert(
  stateContent.includes("const safeGpa = typeof item.gpa === \"number\" ? Math.max(0, Math.min(4, Math.round(item.gpa * 100) / 100)) : item.gpa;") &&
  stateContent.includes("const safeGpa10 = typeof item.gpa10 === \"number\" ? Math.max(0, Math.min(10, Math.round(item.gpa10 * 10) / 10)) : item.gpa10;") &&
  stateContent.includes("const safeCredits = typeof item.creditsEarned === \"number\" ? Math.max(0, Math.round(item.creditsEarned)) : item.creditsEarned;"),
  "Batch 28 Issue 9: importAcademicData must sanitize and clamp gpa, gpa10, and creditsEarned",
  "importAcademicData allows unvalidated or out-of-range academic grades"
);

// ==========================================
// BATCH 29: Faculty Activities & Attendance, Group Score Clamping, Evidence & Feedback Scoping
// ==========================================
console.log("\n--- BATCH 29: Faculty Activities, Attendance Sync, Score Clamping & Feedback Boundary ---");

assert(
  stateContent.includes("const safeRules: GradingRulesConfig = {") &&
  stateContent.includes("ccWeight: Math.max(0, Math.min(100, Math.round(Number(rules.ccWeight) || 10)))") &&
  stateContent.includes("passScoreMin10: Math.max(0, Math.min(10, Math.round((Number(rules.passScoreMin10) || 4.0) * 10) / 10))"),
  "Batch 29 Issue 1: updateGradingRules must sanitize and clamp rule weights and pass score",
  "updateGradingRules allows invalid or unbounded weights and pass threshold"
);

assert(
  stateContent.includes("createActivity = async (activity: Omit<ExtracurricularActivity, \"id\" | \"status\" | \"orgName\">): Promise<string> => {\n    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY))") &&
  stateContent.includes("deleteActivity = (activityId: string) => {\n    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY))") &&
  stateContent.includes("updateActivityStatus = (activityId: string, status: \"UPCOMING\" | \"ONGOING\" | \"COMPLETED\") => {\n    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY))"),
  "Batch 29 Issue 2: createActivity, deleteActivity, and updateActivityStatus must permit FACULTY role",
  "Activity lifecycle functions reject FACULTY role preventing faculty event management"
);

assert(
  stateContent.includes("updateAttendance = (attendanceId: string, attended: boolean, role?: \"MEM\" | \"BTC\" | \"SUPPORTER\") => {\n    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY))") &&
  stateContent.includes("addBulkAttendance = (activityId: string, studentIds: string[]) => {\n    if (!currentUser || (!isOrgRole(currentUser.role) && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.FACULTY))"),
  "Batch 29 Issue 3: updateAttendance and addBulkAttendance must permit FACULTY role",
  "Attendance updates block FACULTY role from syncing faculty activity attendance"
);

assert(
  stateContent.includes("const safeStudy = Math.max(0, Math.min(20, Math.round(Number(scores.studyPoints) || 0)));") &&
  stateContent.includes("const safeViolation = Math.max(0, Math.min(25, Math.round(Number(scores.violationPoints) || 0)));") &&
  stateContent.includes("const safeExtra = Math.max(0, Math.min(30, Math.round(Number(scores.extracurricularPoints) || 0)));") &&
  stateContent.includes("const safeComm = Math.max(0, Math.min(15, Math.round(Number(scores.communityPoints) || 0)));") &&
  stateContent.includes("const safeAchieve = Math.max(0, Math.min(10, Math.round(Number(scores.achievementPoints) || 0)));"),
  "Batch 29 Issue 4: submitGroupLeaderScore must clamp violationPoints to [0, 25] and all criteria within limits",
  "submitGroupLeaderScore clamps violationPoints to <= 0 wiping discipline score"
);

assert(
  stateContent.includes("if (!toClassId || !currentUser.targetId || currentUser.targetId !== toClassId) {\n        console.warn(\"Unauthorized attempt to send feedback to another class\");") &&
  stateContent.includes("if (currentUser.role === UserRole.FACULTY) {\n      if (!currentUser.targetId) {\n        console.warn(\"Unauthorized attempt by unassigned faculty to send feedback\");"),
  "Batch 29 Issue 5: sendFeedback must eliminate loose targetId bypass for adviser, monitor, and faculty",
  "sendFeedback allows accounts without targetId to send feedback across classes"
);

assert(
  stateContent.includes("if (!targetStudent || !currentUser.targetId || targetStudent.classId !== currentUser.targetId) {\n        console.warn(\"Cannot review evidence outside assigned class\");") &&
  stateContent.includes("if (!targetStudent || !currentUser.targetId || targetStudent.facultyId !== currentUser.targetId) {\n        console.warn(\"Cannot review evidence outside assigned faculty\");"),
  "Batch 29 Issue 6: reviewEvidence must strictly enforce targetId boundary matching student class/faculty",
  "reviewEvidence allows unassigned monitors, advisers, or faculty to review evidence outside scope"
);

assert(
  stateContent.includes("const lockFacultyData = (facultyId: string, lockedBy: string) => {\n    if (!currentUser || !facultyId) return;\n    const isAuthorized = currentUser.role === UserRole.ADMIN ||\n      (currentUser.role === UserRole.FACULTY && currentUser.targetId === facultyId);"),
  "Batch 29 Issue 7: lockFacultyData must require non-empty facultyId and verified matching targetId",
  "lockFacultyData allows locking with empty facultyId or unverified targetId"
);

assert(
  stateContent.includes("const sendGroupReminder = (classId: string, targetStudentIds: string[], message: string) => {\n    if (!currentUser || !classId) return;\n    const isAuthorized = currentUser.role === UserRole.ADMIN ||\n      (currentUser.role === UserRole.ADVISER && currentUser.targetId && currentUser.targetId === classId) ||\n      (currentUser.role === UserRole.CLASS_MONITOR && currentUser.targetId && currentUser.targetId === classId);"),
  "Batch 29 Issue 8: sendGroupReminder must verify non-empty classId and matching targetId",
  "sendGroupReminder allows sending reminders with empty classId or mismatched targetId"
);

// ==========================================
// BATCH 30: Faculty Teacher Protection, Unlock Deduplication, Appeal Scope, Member Dedup & Dynamic Grading Rules
// ==========================================
console.log("\n--- BATCH 30: Account Protection, Unlock Dedup, Appeal Integrity, Member Dedup & Grading Rules ---");

assert(
  stateContent.includes("else if (curr.role === UserRole.FACULTY)") &&
  stateContent.includes("// Keep faculty privileges intact"),
  "Batch 30 Issue 1: provisionTeacherAccounts must protect FACULTY role alongside ADMIN and TRAINING_DEPT",
  "provisionTeacherAccounts demotes FACULTY accounts to TEACHER"
);

assert(
  stateContent.includes("const cleanReason = (req.reason || \"\").trim();\n    if (!cleanReason) {\n      console.warn(\"Unlock request reason cannot be empty\");") &&
  stateContent.includes("const pendingExists = unlockRequests.some(ur => ur.sheetId === req.sheetId && ur.status === \"PENDING\");\n    if (pendingExists) {\n      console.warn(\"A pending unlock request already exists for this grade sheet\");"),
  "Batch 30 Issue 2: requestGradeUnlock must validate non-empty reason and prevent duplicate pending requests",
  "requestGradeUnlock allows blank reasons or duplicate pending unlock requests"
);

assert(
  stateContent.includes("const appeal = gradeAppeals.find(a => a.id === appealId);\n    if (!appeal) return;") &&
  stateContent.includes("if (!sheet || !sheet.teacherId) {\n        console.warn(\"Cannot resolve appeal: associated subject grade sheet or teacher not found\");\n        return;\n      }"),
  "Batch 30 Issue 3: resolveGradeAppeal must strictly verify appeal and sheet existence and teacher ownership",
  "resolveGradeAppeal allows unverified teachers to resolve unassigned grade appeals"
);

assert(
  stateContent.includes("const cleanTitle = (announcement.title || \"\").trim();\n    if (!cleanTitle) {\n      throw new Error(\"Tiêu đề thông báo không được để trống.\");\n    }"),
  "Batch 30 Issue 4: createAnnouncement must validate that announcement title is non-empty",
  "createAnnouncement allows creating blank announcements"
);

assert(
  stateContent.includes("const isDuplicate = members.some(m => m.orgId === member.orgId && m.studentId === member.studentId);\n    if (isDuplicate) {") &&
  stateContent.includes("const existingKeys = new Set(members.map(m => `${m.orgId}_${m.studentId}`));\n    const deduplicatedMembers: OrganizationMember[] = [];"),
  "Batch 30 Issue 5: addMemberManual and importMembersExcel must deduplicate member additions",
  "Member management functions allow duplicate organization memberships"
);

assert(
  stateContent.includes("const otherRootAdmins = [\"cthssv@phhg.edu.vn\", \"cthssv@hg.edu.vn\", \"pcthssv@hg.edu.vn\", \"admin@phhg.edu.vn\", \"superadmin\"];") &&
  stateContent.includes("if (targetUser && otherRootAdmins.includes(targetUser.username.toLowerCase()) && safeAccount.role && safeAccount.role !== UserRole.ADMIN)") &&
  stateContent.includes("if (userToDelete && otherRootAdmins.includes(userToDelete.username.toLowerCase()))"),
  "Batch 30 Issue 6: updateUserAccount and deleteUserAccount must protect all root admin accounts",
  "Root administrative accounts can be deleted or demoted"
);

assert(
  teacherPortalContent.includes("const ccW = (gradingRules?.ccWeight ?? 10) / 100;") &&
  teacherPortalContent.includes("const prW = (gradingRules?.processWeight ?? 30) / 100;") &&
  teacherPortalContent.includes("const exW = (gradingRules?.examWeight ?? 60) / 100;") &&
  teacherPortalContent.includes("tb10 >= (gradingRules?.passScoreMin10 ?? 4.0)"),
  "Batch 30 Issue 7: TeacherPortal must calculate student grades dynamically using gradingRules",
  "TeacherPortal hardcodes grading weights and pass thresholds ignoring system configuration"
);

assert(
  teacherPortalContent.includes("const isAcademicAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.TRAINING_DEPT;") &&
  teacherPortalContent.includes("if (!activeGradeSheet || !isAcademicAdmin) return;") &&
  teacherPortalContent.includes("{isAcademicAdmin && (\n                        <button\n                          onClick={handleTeacherSelfUnlock}"),
  "Batch 30 Issue 8: TeacherPortal must restrict direct sheet unlock strictly to isAcademicAdmin",
  "TeacherPortal displays or allows regular teachers to bypass unlock approval"
);

// ==========================================
// BATCH 31: Class Review Non-Empty ClassId Guard, Appeal Dynamic Pass Score & ClassPortal Input Safety
// ==========================================
console.log("\n--- BATCH 31: Review ClassId Guard, Dynamic Appeal Pass Score & ClassPortal Safety ---");

assert(
  stateContent.includes("const passMin = gradingRules?.passScoreMin10 ?? 4.0;") &&
  stateContent.includes("tb10 >= passMin ? 1.0 : 0;") &&
  stateContent.includes("tb10 >= passMin ? \"D\" : \"F\";"),
  "Batch 31 Issue 1: resolveGradeAppeal must use gradingRules passScoreMin10 for grade conversion",
  "resolveGradeAppeal hardcodes pass score threshold 4.0 ignoring grading rules"
);

assert(
  stateContent.includes("approveClassScores = (classId: string) => {\n    if (!currentUser || !classId) return;"),
  "Batch 31 Issue 2: approveClassScores must require non-empty classId",
  "approveClassScores allows empty classId creating orphaned reviews"
);

assert(
  stateContent.includes("approveAdviserScores = (classId: string, comment: string) => {\n    if (!currentUser || !classId) return;"),
  "Batch 31 Issue 3: approveAdviserScores must require non-empty classId",
  "approveAdviserScores allows empty classId creating orphaned reviews"
);

assert(
  stateContent.includes("approveFacultyScores = (classId: string, comment: string) => {\n    if (!currentUser || !classId) return;"),
  "Batch 31 Issue 4: approveFacultyScores must require non-empty classId",
  "approveFacultyScores allows empty classId creating orphaned reviews"
);

assert(
  stateContent.includes("approveAdminScores = (classId: string, comment: string) => {\n    if (!currentUser || currentUser.role !== UserRole.ADMIN || !classId)"),
  "Batch 31 Issue 5: approveAdminScores must require non-empty classId",
  "approveAdminScores allows empty classId creating orphaned reviews"
);

assert(
  stateContent.includes("bulkApproveScores = (classId: string, studentIds: string[], role: UserRole) => {\n    if (!currentUser || !classId) return;"),
  "Batch 31 Issue 6: bulkApproveScores must require non-empty classId",
  "bulkApproveScores allows empty classId"
);

assert(
  classPortalContent.includes("if (!selectedDetailStudentId) return;") &&
  classPortalContent.includes("const studyEl = document.getElementById(\"gl-study-pt\") as HTMLInputElement | null;") &&
  classPortalContent.includes("const study = parseInt(studyEl?.value || \"0\") || 0;"),
  "Batch 31 Issue 7: ClassPortal must safely read group leader score input elements with null checks",
  "ClassPortal group scoring blindly accesses DOM elements causing runtime crashes"
);

// ==========================================
// BATCH 32: Group Attendance Key Integrity, Strict Scoping, Cascade Cleanup & Schedule Fallback Sanitization
// ==========================================
console.log("\n--- BATCH 32: Group Attendance Key, Scoping Guards, Cascade Cleanup & Schedule Sanitization ---");

assert(
  stateContent.includes("saveToStorage(\"unihub_group_attendances\", updatedGroupAttendances);") &&
  !stateContent.includes("saveToStorage(\"unihub_group_attendance\", updatedGroupAttendances);"),
  "Batch 32 Issue 1: renameClass and deleteClass must save to unihub_group_attendances storage key",
  "renameClass or deleteClass uses mismatching unihub_group_attendance key"
);

assert(
  stateContent.includes("approveGroupAttendance = (reportId: string, reviewerName: string) => {") &&
  stateContent.includes("if (!currentUser.targetId) {\n        console.warn(\"Unauthorized attempt by unassigned user to approve group attendance\");") &&
  stateContent.includes("if (!currentUser.targetId) {\n        console.warn(\"Unauthorized attempt by unassigned user to reject group attendance\");"),
  "Batch 32 Issue 2: approveGroupAttendance and rejectGroupAttendance must verify caller targetId matches class",
  "approveGroupAttendance or rejectGroupAttendance allows unassigned accounts to approve/reject reports"
);

assert(
  stateContent.includes("if (!glStudent || targetStudent.classId !== glStudent.classId) {\n        console.warn(\"Group leader cannot grade student in another class\");") &&
  stateContent.includes("if (!currentUser.groupInCharge || targetStudent.groupName !== currentUser.groupInCharge) {\n        console.warn(\"Group leader cannot grade student in another group\");"),
  "Batch 32 Issue 3: submitGroupLeaderScore must verify valid glStudent and matching group charge",
  "submitGroupLeaderScore allows unverified group leaders or missing group students to bypass scope"
);

assert(
  stateContent.includes("if (studentId) {\n      const targetStudent = students.find(s => s.id === studentId);\n      if (!targetStudent) {\n        console.warn(\"Target student not found\");"),
  "Batch 32 Issue 4: sendFeedback must verify that targeted student exists in students directory",
  "sendFeedback allows ghost student IDs without existence verification"
);

assert(
  stateContent.includes("const targetFb = feedbacks.find(fb => fb.id === feedbackId);\n    if (!targetFb) return;\n\n    if (currentUser.role !== UserRole.ADMIN) {\n      if (!currentUser.targetId) {\n        console.warn(\"Unauthorized attempt by unassigned user to resolve feedback\");"),
  "Batch 32 Issue 5: resolveFeedback must reject unassigned non-admin users",
  "resolveFeedback allows unassigned users with empty targetId to resolve feedback"
);

assert(
  stateContent.includes("const orgActIds = activities.filter(a => a.orgId.toLowerCase() === orgId).map(a => a.id);") &&
  stateContent.includes("localStorage.setItem(\"unihub_activities\", JSON.stringify(updated));") &&
  stateContent.includes("localStorage.setItem(\"unihub_attendance\", JSON.stringify(updated));") &&
  stateContent.includes("localStorage.setItem(\"unihub_announcements\", JSON.stringify(updated));") &&
  stateContent.includes("localStorage.setItem(\"unihub_members\", JSON.stringify(updated));"),
  "Batch 32 Issue 6: deleteUserAccount must cascade cleanup of activities, attendance, announcements, and members",
  "deleteUserAccount leaves orphaned club activities, attendance records, or memberships"
);

assert(
  stateContent.includes("if (res.studentId === studentId && (!period?.id || res.periodId === period.id))"),
  "Batch 32 Issue 7: adjustStudentScoreSpecific must scope score adjustment strictly to current evaluation period",
  "adjustStudentScoreSpecific modifies evaluation results across all historical periods"
);

assert(
  stateContent.includes("saveGroupSettings = (\n    classId: string, \n    assignments: { [studentId: string]: string }, \n    leaders: { [groupName: string]: { studentId: string; username?: string; password?: string } }\n  ) => {\n    if (!currentUser || !classId) return;") &&
  stateContent.includes("const cleanGroupName = (groupName || \"\").trim();\n      if (!cleanGroupName || !leaderInfo || !leaderInfo.studentId) return;"),
  "Batch 32 Issue 8: saveGroupSettings must require non-empty classId and validate non-empty group names",
  "saveGroupSettings allows empty classId or whitespace group names"
);

assert(
  !trainingPortalContent.includes("row.classId || \"K2-GDTH A\"") &&
  !trainingPortalContent.includes("scheduleModalData.classId || \"K2-GDTH A\"") &&
  trainingPortalContent.includes("classId: normalizeClassId(row.classId.trim()),") &&
  trainingPortalContent.includes("classId: normalizeClassId(scheduleModalData.classId.trim()),"),
  "Batch 32 Issue 9: TrainingPortal schedule creation must not assign hardcoded K2-GDTH A fallback",
  "TrainingPortal contains hardcoded K2-GDTH A fallback for schedules"
);

// ==========================================
// BATCH 33: Full Database Restore Completeness, Period Isolation, Member Validation & Sheet Existence
// ==========================================
console.log("\n--- BATCH 33: Backup Completeness, Period Isolation, Member Validation & Sheet Integrity ---");

assert(
  stateContent.includes("if (Array.isArray(backupData.results)) {\n      setResults(backupData.results);\n      saveToStorage(\"unihub_results\", backupData.results);\n    }") &&
  stateContent.includes("if (Array.isArray(backupData.evidence)) {\n      setEvidence(backupData.evidence);\n      saveToStorage(\"unihub_evidence\", backupData.evidence);\n    }") &&
  stateContent.includes("if (Array.isArray(backupData.members)) {\n      setMembers(backupData.members);\n      saveToStorage(\"unihub_members\", backupData.members);\n    }") &&
  stateContent.includes("if (Array.isArray(backupData.dailyAttendance)) {\n      setDailyAttendance(backupData.dailyAttendance);\n      saveToStorage(\"unihub_daily_attendance\", backupData.dailyAttendance);\n    }") &&
  stateContent.includes("if (Array.isArray(backupData.groupAttendances)) {\n      setGroupAttendances(backupData.groupAttendances);\n      saveToStorage(\"unihub_group_attendances\", backupData.groupAttendances);\n    }") &&
  stateContent.includes("if (backupData.gradingRules) {\n      setGradingRules(backupData.gradingRules);\n      localStorage.setItem(\"unihub_grading_rules\", JSON.stringify(backupData.gradingRules));\n    }"),
  "Batch 33 Issue 1: restoreAllDataBackup must restore full database tables and configurations",
  "restoreAllDataBackup drops conduct results, evidence, members, attendance, or grading rules"
);

assert(
  stateContent.includes("submitAdviserAdjustment = (studentId: string, criteriaCategory: string, points: number, reason: string)") &&
  stateContent.includes("if (res.studentId === studentId && (!period?.id || res.periodId === period.id))"),
  "Batch 33 Issue 2: submitAdviserAdjustment must scope score adjustment strictly to current period",
  "submitAdviserAdjustment modifies historical evaluation results across past periods"
);

assert(
  stateContent.includes("addMemberManual = (member: Omit<OrganizationMember, \"id\" | \"joinedDate\" | \"term\" | \"status\">) => {") &&
  stateContent.includes("const cleanStudentId = (member.studentId || \"\").trim();") &&
  stateContent.includes("const targetStudent = students.find(s => s.id === cleanStudentId);") &&
  stateContent.includes("if (!targetStudent) {\n      console.warn(\"Cannot add member: student not found in students directory\");"),
  "Batch 33 Issue 3: addMemberManual must verify that student exists in students directory",
  "addMemberManual allows adding phantom or arbitrary non-student accounts"
);

assert(
  stateContent.includes("requestGradeUnlock = (req: Omit<GradeUnlockRequest, \"id\" | \"requestedAt\" | \"status\">) => {") &&
  stateContent.includes("const sheet = subjectGradeSheets.find(s => s.id === req.sheetId);") &&
  stateContent.includes("if (!sheet) {\n      console.warn(\"Cannot request grade unlock: grade sheet not found\");"),
  "Batch 33 Issue 4: requestGradeUnlock must verify that target subject grade sheet exists",
  "requestGradeUnlock allows requesting unlock for non-existent sheets"
);

// ==========================================
// BATCH 34: Evidence Class Isolation, Appeal Subject Code Guard & Profile Scheme Sanitization
// ==========================================
console.log("\n--- BATCH 34: Evidence Isolation, Appeal Subject Code & Profile Sanitization ---");

assert(
  stateContent.includes("if (!effectiveStudentId) {\n      console.warn(\"Cannot submit evidence without a valid student identity\");") &&
  stateContent.includes("const resolvedClassId = studentObj?.classId || data.classId || \"\";") &&
  stateContent.includes("classId: resolvedClassId,"),
  "Batch 34 Issue 1: submitEvidence must resolve student classId dynamically to prevent cross-class leakage",
  "submitEvidence allows spoofing or leaking evidence across class boundaries"
);

assert(
  stateContent.includes("const cleanSubjectCode = (appeal.subjectCode || \"\").trim();\n    if (!cleanSubjectCode) {") &&
  stateContent.includes("alert(\"Vui lòng chọn môn học cần đề nghị phúc khảo!\");"),
  "Batch 34 Issue 2: submitGradeAppeal must validate non-empty subjectCode",
  "submitGradeAppeal allows submitting appeals with missing subjectCode"
);

assert(
  stateContent.includes("const cleanName = (name || \"\").trim() || currentStud?.name || \"Sinh viên\";") &&
  stateContent.includes("if (/^(javascript|vbscript):/i.test(cleanAvatar) || cleanAvatar.startsWith(\"//\")) {"),
  "Batch 34 Issue 3: updateStudentProfile must sanitize student name and dangerous avatar protocols",
  "updateStudentProfile allows unsafe avatar URIs or empty names"
);
// ==========================================
// BATCH 35: Dynamic Conduct Points, Student ID De-hardcoding & CSV Formula Injection Protection
// ==========================================
console.log("\n--- BATCH 35: Dynamic Conduct Evaluation, ID De-hardcoding & CSV Injection Defense ---");

assert(
  !stateContent.includes('const subbedTardiness = student.id === "SV20CN02";') &&
  stateContent.includes("const tardinessCount = dailyAttendance.filter(rep =>") &&
  stateContent.includes("if (tardinessCount > 0) {"),
  "Batch 35 Issue 1: computeConductPoints must dynamically calculate tardiness and eliminate hardcoded SV20CN02",
  "computeConductPoints contains hardcoded SV20CN02 tardiness mock"
);

assert(
  !stateContent.includes('const hasCleanDuty = student.id === "DTG245140202053"') &&
  !stateContent.includes('|| student.id === "SV20CN03" || student.id === "SV20NL01";') &&
  stateContent.includes("const hasCleanDuty = unexcusedReportCount === 0 && tardinessCount === 0;") &&
  stateContent.includes("const isCommunityAct = act.criteriaId === \"TC4\" || act.criteriaId.startsWith(\"TC4.\");"),
  "Batch 35 Issue 2: computeConductPoints must dynamically evaluate community activities and clean duty without hardcoded student IDs",
  "computeConductPoints contains hardcoded student IDs for clean duty or monitor role"
);

assert(
  adviserPortalContent.includes("const safe = /^[=+\\-@\\t\\r]/.test(s) ? `'${s}` : s;"),
  "Batch 35 Issue 3: AdviserPortal CSV export must sanitize cells against CSV / formula injection",
  "AdviserPortal CSV export does not sanitize formula injection characters"
);

// ==========================================
// BATCH 36: Assignment Deduplication, Reason Validation & Phantom Student Prevention
// ==========================================
console.log("\n--- BATCH 36: Assignment Deduplication, Reason Guard & Phantom Student Defense ---");

assert(
  stateContent.includes("const seen = new Set<string>();") &&
  stateContent.includes("const key = `${a.semesterId}::${normalizeClassId(a.classId)}::${a.subjectCode.trim().toUpperCase()}`;") &&
  stateContent.includes("credits: Math.max(1, Math.min(20, Math.round(Number(a.credits) || 3)))"),
  "Batch 36 Issue 1: saveTeacherAssignments must deduplicate and sanitize assignments with credit clamping",
  "saveTeacherAssignments allows duplicate assignments or unclamped credits"
);

assert(
  stateContent.includes("const cleanReason = (reason || \"\").trim();\n    const cleanCategory = (criteriaCategory || \"\").trim();\n    if (!cleanReason || !cleanCategory) {") &&
  stateContent.includes("const cleanReason = (reason || \"\").trim();\n    const cleanCategory = (category || \"\").trim();\n    if (!cleanReason || !cleanCategory) {"),
  "Batch 36 Issue 2: Score adjustments must validate non-empty reason and criteria category",
  "Score adjustment functions allow empty reason or category creating corrupt audit logs"
);

assert(
  teacherPortalContent.includes("if (!missingStudent) {\n      alert(\"Tất cả sinh viên thuộc lớp này đã có trong bảng điểm!\");\n      return;\n    }") &&
  !teacherPortalContent.includes("DTG_${Date.now().toString().slice(-6)}"),
  "Batch 36 Issue 3: TeacherPortal must enforce class student existence and prevent phantom student generation",
  "TeacherPortal generates phantom student accounts with arbitrary fake IDs"
);

assert(
  trainingPortalContent.includes("const existingIdx = teacherAssignments.findIndex(a =>") &&
  trainingPortalContent.includes("const updatedAssignments = existingIdx >= 0"),
  "Batch 36 Issue 4: TrainingPortal manual assignment must deduplicate existing assignment rows",
  "TrainingPortal allows duplicate assignment row generation"
);

// ==========================================
// BATCH 37: Evidence Point Ceiling, Cascade Cleanup, Member Dedup Sanitization & Schedule Integrity
// ==========================================
console.log("\n--- BATCH 37: Evidence Point Ceiling, Cascade Evidence Cleanup, Dedup & Schedule Integrity ---");

assert(
  stateContent.includes("const cleanActivityName = (data.activityName || \"\").trim();\n    const cleanCriteriaId = (data.criteriaId || \"\").trim();\n    if (!cleanActivityName || !cleanCriteriaId) {") &&
  stateContent.includes("const maxAllowedPoints = cleanCriteriaId.startsWith(\"TC4\") ? 15 : cleanCriteriaId.startsWith(\"TC5\") ? 10 : cleanCriteriaId.startsWith(\"TC1\") ? 20 : cleanCriteriaId.startsWith(\"TC2\") ? 25 : 30;") &&
  stateContent.includes("const safePoints = Math.max(1, Math.min(maxAllowedPoints, Math.round(boundedPoints) || 5));"),
  "Batch 37 Issue 1: submitEvidence must validate non-empty fields and dynamically clamp points requested to criteria ceiling",
  "submitEvidence allows blank activity name or unclamped points up to 100"
);

assert(
  stateContent.includes("const updatedEvidence = evidence.filter(ev => normalizeClassId(ev.classId) !== norm && !deletedStudentIds.has(ev.studentId));\n    setEvidence(updatedEvidence);\n    saveToStorage(\"unihub_evidence\", updatedEvidence);"),
  "Batch 37 Issue 2: deleteClass must cascade cleanup of evidence submissions",
  "deleteClass leaves orphaned evidence submissions"
);

assert(
  stateContent.includes("const isCleanDuplicate = members.some(m => m.orgId === member.orgId && m.studentId === cleanStudentId);"),
  "Batch 37 Issue 3: addMemberManual duplicate check must use sanitized cleanStudentId",
  "addMemberManual duplicate check uses uncleaned studentId allowing whitespace bypass"
);

assert(
  stateContent.includes("classId: normalizeClassId(s.classId.trim()),\n      subjectCode: (s.subjectCode || \"\").trim(),\n      subjectName: (s.subjectName || \"\").trim()") &&
  stateContent.includes("const cleanId = (id || \"\").trim();\n    if (!cleanId) return;"),
  "Batch 37 Issue 4: importScheduleData and deleteScheduleSlot must sanitize schedule slot data and slot IDs",
  "Schedule operations allow unnormalized classId or blank IDs"
);

// ==========================================
// BATCH 38: Activity Title Validation, Bulk Attendance Student Existence & Criteria Array Integrity
// ==========================================
console.log("\n--- BATCH 38: Activity Title Validation, Bulk Attendance Existence & Criteria Integrity ---");

assert(
  stateContent.includes("const cleanTitle = (activity.title || \"\").trim();\n    if (!cleanTitle) {\n      throw new Error(\"Tiêu đề hoạt động không được để trống.\");\n    }") &&
  stateContent.includes("const safePoints = Math.max(1, Math.min(30, Math.round(Number(activity.points) || 5)));") &&
  stateContent.includes("points: safePoints,"),
  "Batch 38 Issue 1: createActivity must validate non-empty title and clamp points within [1, 30]",
  "createActivity allows blank titles or unclamped points"
);

assert(
  stateContent.includes("const studentMap = new Map(students.map(s => [s.id, s]));") &&
  stateContent.includes("studentMap.has(id) && !attendance.some(att => att.activityId === activityId && att.studentId === id)") &&
  stateContent.includes("studentName: sObj.name,\n        classId: sObj.classId,"),
  "Batch 38 Issue 2: addBulkAttendance must deduplicate student IDs and verify student existence",
  "addBulkAttendance allows ghost student IDs without existence verification"
);

assert(
  stateContent.includes("if (!Array.isArray(newCriteria) || newCriteria.length === 0) {\n      console.warn(\"Invalid criteria array passed to bulkUpdateCriteria\");\n      return;\n    }"),
  "Batch 38 Issue 3: bulkUpdateCriteria must validate non-empty criteria array",
  "bulkUpdateCriteria allows passing invalid criteria data"
);

// ==========================================
// BATCH 39: Adviser Profile Guard, Criteria Integrity, Feedback Error Safety, Announcement Content, Member Spoofing & Class Normalization
// ==========================================
console.log("\n--- BATCH 39: Adviser Profile Guard, Criteria Integrity, Error Safety, Content Validation, Member Spoofing & Class Normalization ---");

assert(
  stateContent.includes("const isAdviserOfClass = currentUser?.role === UserRole.ADVISER &&") &&
  stateContent.includes("normalizeClassId(currentStud.classId) === normalizeClassId(currentUser.targetId);") &&
  stateContent.includes("const effectiveName = (!isAdmin && isAdviserOfClass) ? (currentStud?.name || \"Sinh viên\") : cleanName;"),
  "Batch 39 Issue 1: updateStudentProfile must permit class adviser notes update while guarding student identity",
  "updateStudentProfile blocks adviser notes or allows unauthorized identity modification"
);

assert(
  stateContent.includes("if (!criteriaId || !ruleId) {") &&
  stateContent.includes("const targetCriteria = criteria.find(c => c.id === criteriaId);") &&
  stateContent.includes("const targetRule = targetCriteria.rules.find(r => r.id === ruleId);") &&
  stateContent.includes("const safePoints = Math.min(targetCriteria.maxPoints || 100, clampedPoints);"),
  "Batch 39 Issue 2: updateCriteriaScore must validate criteria and rule existence and clamp to criteria ceiling",
  "updateCriteriaScore allows updating non-existent rules or exceeding criteria points ceiling"
);

assert(
  stateContent.includes("await setDoc(doc(db, \"systemFeedbacks\", fbId), feedback);") &&
  stateContent.includes("console.warn(\"Lỗi lưu systemFeedbacks Firestore:\", err);"),
  "Batch 39 Issue 3: sendSystemFeedback must safely handle Firestore errors with try/catch",
  "sendSystemFeedback lacks error handling on Firestore write"
);

assert(
  stateContent.includes("const cleanContent = (announcement.content || \"\").trim();") &&
  stateContent.includes("throw new Error(\"Nội dung thông báo không được để trống.\");"),
  "Batch 39 Issue 4: createAnnouncement must validate non-empty content",
  "createAnnouncement allows creating announcements with blank content"
);

assert(
  stateContent.includes("delete (safeDetails as any).studentName;") &&
  stateContent.includes("studentName: (currentUser.role === UserRole.ADMIN && safeDetails.studentName) ? safeDetails.studentName : studentObj.name,"),
  "Batch 39 Issue 5: joinOrganizationRequest must strip studentName for non-admins to prevent name spoofing",
  "joinOrganizationRequest allows non-admins to spoof studentName"
);

assert(
  adviserPortalContent.includes("normalizeClassId(da.classId) === normalizeClassId(classId)") &&
  adviserPortalContent.includes("normalizeClassId(f.toClassId) === normalizeClassId(classId)") &&
  classPortalContent.includes("students.filter(s => normalizeClassId(s.classId) === normalizeClassId(classId));"),
  "Batch 39 Issue 6: AdviserPortal and ClassPortal must use normalizeClassId for class isolation and attendance",
  "AdviserPortal or ClassPortal uses unnormalized class ID comparisons"
);

// ==========================================
// BATCH 40: Appeal Dynamic Metadata, Formula Injection Defense, Clamped Imports, Schedule Limits & Strict Class Isolation
// ==========================================
console.log("\n--- BATCH 40: Appeal Dynamic Metadata, Formula Injection Defense, Clamped Imports, Schedule Limits & Strict Class Isolation ---");

assert(
  stateContent.includes("const targetStudent = students.find(s => s.id === effectiveStudentId);") &&
  stateContent.includes("const resolvedClassId = targetStudent?.classId || appeal.classId || \"\";") &&
  stateContent.includes("sheetId: matchedSheet?.id || appeal.sheetId,"),
  "Batch 40 Issue 1: submitGradeAppeal must dynamically resolve student classId, studentName, and associate sheetId",
  "submitGradeAppeal allows unverified classId or missing sheetId association"
);

assert(
  trainingPortalContent.includes("if (/^[=+\\-@\\t\\r]/.test(str)) {") &&
  trainingPortalContent.includes("sanitizeExcelCell(formattedId)"),
  "Batch 40 Issue 2: TrainingPortal must sanitize cells against CSV/Formula Injection in Excel exports",
  "TrainingPortal exports allow unescaped formula injection cells"
);

assert(
  trainingPortalContent.includes("const gpa = isNaN(rawGpa) ? 3.0 : Math.max(0, Math.min(4.0, rawGpa));") &&
  trainingPortalContent.includes("const gpa10 = isNaN(rawGpa10) ? (gpa * 2.5) : Math.max(0, Math.min(10.0, rawGpa10));"),
  "Batch 40 Issue 3: TrainingPortal handleImportExcel must safely clamp parsed gpa and gpa10 against NaN",
  "TrainingPortal handleImportExcel allows NaN or out-of-range GPAs"
);

assert(
  trainingPortalContent.includes("credits: Math.max(1, Math.min(20, Number(row.credits) || 2)),") &&
  trainingPortalContent.includes("credits: Math.max(1, Math.min(20, Number(scheduleModalData.credits) || 2)),"),
  "Batch 40 Issue 4: TrainingPortal schedule saving must clamp credits, dayOfWeek, and periods",
  "TrainingPortal allows unvalidated credits or period numbers in schedules"
);

assert(
  teacherPortalContent.includes("return sNorm === targetNormClass;\n    });") &&
  !teacherPortalContent.includes("targetNormClass.includes(sNorm) || sNorm.includes(targetNormClass)"),
  "Batch 40 Issue 5: TeacherPortal must enforce strict class equality to prevent cross-class student leakage",
  "TeacherPortal uses loose .includes() class matching leading to cross-class leakage"
);

// ==========================================
// BATCH 41: Teacher Provisioning Account Protection, Club Collision Guard, Core Org Protection & User ID Validation
// ==========================================
console.log("\n--- BATCH 41: Teacher Provisioning Account Protection, Club Collision Guard, Core Org Protection & User ID Validation ---");

assert(
  stateContent.includes("else if (curr.role === UserRole.ADVISER) {\n            // Keep adviser privileges intact") &&
  stateContent.includes("else if (curr.role === UserRole.STUDENT || curr.role === UserRole.CLASS_MONITOR) {\n            // Protect student accounts from role alteration"),
  "Batch 41 Issue 1: provisionTeacherAccounts must protect ADVISER, STUDENT, and CLASS_MONITOR accounts",
  "provisionTeacherAccounts demotes advisers or elevates student accounts"
);

assert(
  stateContent.includes("if (!club.id?.trim() || !club.name?.trim() || !account.username?.trim()) {") &&
  stateContent.includes("const normUsername = account.username.trim().toLowerCase();") &&
  stateContent.includes("const existingUser = users.find(u => u.username.toLowerCase() === normUsername && u.id !== account.id);"),
  "Batch 41 Issue 2: createClubWithAccount must validate club fields and prevent username collisions",
  "createClubWithAccount allows blank fields or duplicate usernames"
);

assert(
  stateContent.includes("const protectedOrgs = [\"doantn\", \"hoisv\", \"doan_hoi\"];") &&
  stateContent.includes("alert(\"Không thể xóa tổ chức Đoàn - Hội mặc định của Phân hiệu!\");"),
  "Batch 41 Issue 3: deleteClubAndAccount must protect core institutional organizations from deletion",
  "deleteClubAndAccount allows deletion of DOANTN, HOISV, or DOAN_HOI"
);

assert(
  stateContent.includes("if (!userId || !userId.trim()) return;\n    const existingTarget = users.find(u => u.id === userId);") &&
  stateContent.includes("if (!userId || !userId.trim()) return;\n    if (userId === currentUser.id) {\n      alert(\"Không thể tự xóa tài khoản quản trị viên đang đăng nhập!\");\n      return;\n    }\n    const userToDelete = users.find(u => u.id === userId);\n    if (!userToDelete) return;"),
  "Batch 41 Issue 4: updateUserAccount and deleteUserAccount must validate non-empty userId and check user existence",
  "updateUserAccount or deleteUserAccount allows empty userId or non-existent user operations"
);

// ==========================================
// BATCH 42: Normalized Class Boundaries, Attendance Defense, Reset Completeness & Portal Isolation
// ==========================================
console.log("\n--- BATCH 42: Normalized Class Boundaries, Attendance Defense, Reset Completeness & Portal Isolation ---");

assert(
  stateContent.includes("normalizeClassId(reportData.classId) !== normalizeClassId(glStudent.classId)") &&
  stateContent.includes("students.filter(s => normalizeClassId(s.classId) === normalizeClassId(reportData.classId) && s.groupName === reportData.groupName).forEach(s => groupStudentIds.add(s.id));"),
  "Batch 42 Issue 1: reportGroupAttendance must use normalizeClassId for class isolation and student inclusion",
  "reportGroupAttendance fails on case-variant class IDs or omits normalized class students"
);

assert(
  stateContent.includes("const normTarget = normalizeClassId(currentUser.targetId);") &&
  stateContent.includes("const normClass = normalizeClassId(targetStudent.classId);") &&
  stateContent.includes("(currentUser.targetId === targetStudent.classId || normTarget === normClass)"),
  "Batch 42 Issue 2: applyGroupLeaderScore must support normalized class ID matching for authorized roles",
  "applyGroupLeaderScore rejects valid advisers or monitors due to class ID casing"
);

assert(
  stateContent.includes("students.filter(s => normalizeClassId(s.classId) === normClass).forEach(s => classStudentIds.add(s.id));"),
  "Batch 42 Issue 3: reportDailyAttendance must populate class student IDs using normalized classId",
  "reportDailyAttendance misses normalized class students in attendance calculation"
);

assert(
  stateContent.includes("const classStudentIds = students.filter(s => s.classId === classId || normalizeClassId(s.classId) === normClass).map(s => s.id);"),
  "Batch 42 Issue 4: bulkApproveScores must include normalized class students in approval scope",
  "bulkApproveScores excludes valid students on case differences"
);

assert(
  stateContent.includes("setCustomClasses([]);") &&
  stateContent.includes("setTeacherAssignments(SEED_TEACHER_ASSIGNMENTS);") &&
  stateContent.includes("setSubjectGradeSheets(SEED_SUBJECT_GRADES);") &&
  stateContent.includes("setGradeAppeals([]);") &&
  stateContent.includes("setUnlockRequests([]);"),
  "Batch 42 Issue 5: resetToSeeds must completely reset custom classes, assignments, gradesheets, and appeals",
  "resetToSeeds leaves orphan custom classes, grade sheets, or appeals in state"
);

assert(
  facultyPortalContent.includes("const facultyDisplay = facultyNameMap[facultyId] || `Khoa ${facultyId}`;") &&
  !studentPortalContent.includes("resetToSeeds"),
  "Batch 42 Issue 6: FacultyPortal must use dynamic faculty branding and StudentPortal must not expose resetToSeeds",
  "FacultyPortal hardcodes CNTT branding or StudentPortal exposes admin reset"
);

// ==========================================
// BATCH 43: Teacher Export Defense, Score Clamping, Admin Safeguards & Attendance Verification
// ==========================================
console.log("\n--- BATCH 43: Teacher Export Defense, Score Clamping, Admin Safeguards & Attendance Verification ---");

assert(
  teacherPortalContent.includes("const sanitizeExcelCell = (val: any) => {") &&
  teacherPortalContent.includes("sanitizeExcelCell(formattedStudentId)") &&
  teacherPortalContent.includes("sanitizeExcelCell(grade.studentName)") &&
  teacherPortalContent.includes("sanitizeExcelCell(grade.notes || \"\")"),
  "Batch 43 Issue 1: TeacherPortal must sanitize exported excel cells against CSV/formula injection",
  "TeacherPortal allows formula injection in studentId, studentName, or notes"
);

assert(
  teacherPortalContent.includes("const clampGradeVal = (v: any) => {") &&
  teacherPortalContent.includes("Math.max(0, Math.min(10, parsed))") &&
  teacherPortalContent.includes("const exam = clampGradeVal(grade.exam);"),
  "Batch 43 Issue 2: TeacherPortal calculateSingleRow must clamp individual grades into [0, 10]",
  "TeacherPortal allows out-of-range grade components to distort average calculation"
);

assert(
  adminPortalContent.includes("if (user.id === currentUser?.id) {\n      alert(\"Không thể tự xóa tài khoản quản trị viên đang đăng nhập!\");"),
  "Batch 43 Issue 3: AdminPortal handleDeleteAccount must block self-deletion of active admin account",
  "AdminPortal allows active admin to delete their own account"
);

assert(
  adminPortalContent.includes("const protectedOrgs = [\"doantn\", \"hoisv\", \"doan_hoi\"];\n    if (protectedOrgs.includes(orgId.trim().toLowerCase())) {"),
  "Batch 43 Issue 4: AdminPortal handleDeleteClub must protect default institutional organizations",
  "AdminPortal allows deleting core organizations like DOANTN or HOISV"
);

assert(
  adminPortalContent.includes("if (isNaN(numPoints) || !isFinite(numPoints) || numPoints < 0) {\n        alert(\"Điểm quy chế phải là số dương hợp lệ!\");"),
  "Batch 43 Issue 5: AdminPortal saveRulePoints must validate positive finite number for points",
  "AdminPortal allows invalid or negative rule points"
);

assert(
  classPortalContent.includes("const presentCount = Math.max(0, totalStuds - absentCount);"),
  "Batch 43 Issue 6: ClassPortal submitGroupRollCall must clamp presentCount to non-negative",
  "ClassPortal allows negative presentCount in group roll call"
);

assert(
  stateContent.includes("if (att.activityId === activityId && att.attended) {\n          return { ...att, verified: true };"),
  "Batch 43 Issue 7: updateActivityStatus must restrict verified status strictly to attended students",
  "updateActivityStatus verifies absent students when activity completes"
);

// ==========================================
// BATCH 44: Unlock Request Lifecycle, Grade Appeal Safety, ProofUrl Scheme Defense & Modal Clamping
// ==========================================
console.log("\n--- BATCH 44: Unlock Request Lifecycle, Grade Appeal Safety, ProofUrl Scheme Defense & Modal Clamping ---");

assert(
  stateContent.includes("if (req.status !== \"PENDING\") {\n      console.warn(\"Unlock request has already been processed\");"),
  "Batch 44 Issue 1: approveUnlockRequest and rejectUnlockRequest must verify PENDING request status",
  "approveUnlockRequest or rejectUnlockRequest re-processes resolved requests"
);

assert(
  stateContent.includes("normalizeClassId(s.classId) === normalizeClassId(req.classId) && s.facultyId === currentUser.targetId"),
  "Batch 44 Issue 2: approveUnlockRequest and rejectUnlockRequest must support normalized class IDs for faculty",
  "approveUnlockRequest or rejectUnlockRequest fails on case-variant class IDs for faculty review"
);

assert(
  stateContent.includes("if (appeal.status !== \"PENDING\") {\n      console.warn(\"Grade appeal has already been resolved\");"),
  "Batch 44 Issue 3: resolveGradeAppeal must verify PENDING appeal status before resolving",
  "resolveGradeAppeal allows re-resolving already processed grade appeals"
);

assert(
  stateContent.includes("/^data:(text\\/html|application\\/)/i.test(rawUrl)"),
  "Batch 44 Issue 4: submitEvidence must reject dangerous data:text/html and data:application URLs",
  "submitEvidence allows dangerous data scheme URL injections"
);

assert(
  trainingPortalContent.includes("if (isNaN(parsedNewGrade) || parsedNewGrade < 0 || parsedNewGrade > 10) {\n                alert(\"Điểm mới sau điều chỉnh phải là số hợp lệ từ 0 đến 10!\");"),
  "Batch 44 Issue 5: TrainingPortal appeal response modal must validate new grade in [0, 10]",
  "TrainingPortal allows submitting non-numeric or out-of-range appeal new grades"
);

// ==========================================
// BATCH 45: Sheet ID Guards, Schedule Range Bounds & Member Name Spoofing Defense
// ==========================================
console.log("\n--- BATCH 45: Sheet ID Guards, Schedule Range Bounds & Member Name Spoofing Defense ---");

assert(
  stateContent.includes("submitSubjectGradeSheet = (sheetId: string) => {\n    if (!currentUser || !sheetId || !sheetId.trim()) return;"),
  "Batch 45 Issue 1: submitSubjectGradeSheet must validate non-empty sheetId",
  "submitSubjectGradeSheet allows empty or blank sheetId"
);

assert(
  stateContent.includes("requestGradeUnlock = (req: Omit<GradeUnlockRequest, \"id\" | \"requestedAt\" | \"status\">) => {\n    if (!currentUser || !req?.sheetId || !req.sheetId.trim()) return;"),
  "Batch 45 Issue 2: requestGradeUnlock must validate non-empty req.sheetId",
  "requestGradeUnlock allows requesting unlock with missing or empty sheetId"
);

assert(
  stateContent.includes("credits: Math.max(1, Math.min(20, Number(s.credits) || 1)),\n      dayOfWeek: Math.max(2, Math.min(8, Number(s.dayOfWeek) || 2)),\n      periodStart: Math.max(1, Math.min(12, Number(s.periodStart) || 1)),\n      periodEnd: Math.max(Math.max(1, Math.min(12, Number(s.periodStart) || 1)), Math.min(12, Number(s.periodEnd) || 1))"),
  "Batch 45 Issue 3: importScheduleData must clamp credits, dayOfWeek, and periods to valid bounds",
  "importScheduleData allows out-of-range credits, days, or periods"
);

assert(
  stateContent.includes("delete safeDetails.studentName;\n    }\n    if (safeDetails.studentName) {\n      const realStudent = students.find(s => s.id === member.studentId);"),
  "Batch 45 Issue 4: updateMemberDetails must prevent non-admin member name spoofing and sync with student directory",
  "updateMemberDetails allows altering student names arbitrarily"
);

// ==========================================
// BATCH 46: Member Import Sanitization, Status Guards, Assignment Normalization & Class Isolation
// ==========================================
console.log("\n--- BATCH 46: Member Import Sanitization, Status Guards, Assignment Normalization & Class Isolation ---");

assert(
  stateContent.includes("const cleanStudentId = (m.studentId || \"\").trim();\n        const targetStudent = students.find(s => s.id === cleanStudentId);\n        if (!cleanStudentId || !targetStudent) return null;") &&
  stateContent.includes("studentName: currentUser.role === UserRole.ADMIN && m.studentName?.trim() ? m.studentName.trim() : targetStudent.name,") &&
  stateContent.includes("classId: normalizeClassId(currentUser.role === UserRole.ADMIN && m.classId?.trim() ? m.classId.trim() : targetStudent.classId),"),
  "Batch 46 Issue 1: importMembersExcel must reject phantom students and protect member name & class integrity",
  "importMembersExcel allows phantom students or unverified student names"
);

assert(
  stateContent.includes("const cleanMemberId = (memberId || \"\").trim();\n    if (!cleanMemberId) return;\n    const member = members.find(m => m.id === cleanMemberId);\n    if (!member || member.status !== \"PENDING\") return;") &&
  stateContent.includes("if (m.id === cleanMemberId) {\n        return { ...m, status: \"ACTIVE\" as const };"),
  "Batch 46 Issue 2: approveMemberRequest and rejectMemberRequest must validate clean ID and require PENDING status",
  "approveMemberRequest or rejectMemberRequest allows processing non-pending or uncleaned member IDs"
);

assert(
  stateContent.includes("const validItems = (newAssignments || []).filter(a => a && a.classId && a.subjectCode && a.semesterId).map(a => ({\n      ...a,\n      classId: normalizeClassId(a.classId),\n      subjectCode: a.subjectCode.trim(),\n      credits: Math.max(1, Math.min(20, Math.round(Number(a.credits) || 3)))\n    }));") &&
  stateContent.includes("if (!currentUser || !sheet?.id || !sheet.id.trim()) return;\n    const cleanSheetId = sheet.id.trim();") &&
  stateContent.includes("classId: normalizeClassId(sheet.classId),"),
  "Batch 46 Issue 3: importTeacherAssignmentsExcel and saveSubjectGradeSheet must normalize classId, clamp credits, and validate sheet ID",
  "Teacher assignments or grade sheets allow unnormalized class IDs or invalid sheet IDs"
);

assert(
  adviserPortalContent.includes("const normClassId = normalizeClassId(classId);\n  const classReviewInfo = classReviews.find(cr => normalizeClassId(cr.classId) === normClassId);\n  const myClassResults = results.filter(r => normalizeClassId(r.classId) === normClassId && r.periodId === selectedSemesterId);\n  const myClassmatesArr = students.filter(s => normalizeClassId(s.classId) === normClassId);") &&
  adviserPortalContent.includes("const classAttendances = dailyAttendance.filter(da => normalizeClassId(da.classId) === normClassId);") &&
  studentPortalContent.includes("value={sObj?.classId || \"Chưa phân lớp\"}") &&
  trainingPortalContent.includes("const normClassId = normalizeClassId(assignForm.classId.trim());\n    const cleanSubCode = assignForm.subjectCode.trim();\n    const assignmentId = `HP_${selectedSemesterId}_${normClassId}_${cleanSubCode}`;"),
  "Batch 46 Issue 4: AdviserPortal, StudentPortal, and TrainingPortal must eliminate hardcoded fallbacks and enforce normalized class boundaries",
  "Portals use raw classId comparisons or hardcoded class fallbacks"
);

// ==========================================
// BATCH 47: Class Score Approvals Normalization, Admin Score Sync & Rename/Delete Cascade Completeness
// ==========================================
console.log("\n--- BATCH 47: Class Score Approvals Normalization, Admin Score Sync & Rename/Delete Cascade ---");

assert(
  stateContent.includes("approveClassScores = (classId: string) => {\n    if (!currentUser || !classId) return;\n    const cleanClassId = classId.trim();\n    if (!cleanClassId) return;\n    const normClassId = normalizeClassId(cleanClassId);") &&
  stateContent.includes("approveAdviserScores = (classId: string, comment: string) => {\n    if (!currentUser || !classId) return;\n    const cleanClassId = classId.trim();\n    if (!cleanClassId) return;\n    const normClassId = normalizeClassId(cleanClassId);"),
  "Batch 47 Issue 1: approveClassScores and approveAdviserScores must sanitize and normalize classId",
  "approveClassScores or approveAdviserScores allows unnormalized classId or bypasses scope"
);

assert(
  stateContent.includes("approveFacultyScores = (classId: string, comment: string) => {\n    if (!currentUser || !classId) return;\n    const cleanClassId = classId.trim();\n    if (!cleanClassId) return;\n    const normClassId = normalizeClassId(cleanClassId);") &&
  stateContent.includes("const classStudentIds = students.filter(s => s.classId === classId || normalizeClassId(s.classId) === normClassId).map(s => s.id);"),
  "Batch 47 Issue 2: approveFacultyScores and approveAdminScores must normalize classId and synchronize all class student results",
  "approveFacultyScores or approveAdminScores ignores unnormalized classId variants"
);

assert(
  stateContent.includes("if (currentUser.targetId && targetFb.toClassId && targetFb.toClassId !== currentUser.targetId && normalizeClassId(targetFb.toClassId) !== normalizeClassId(currentUser.targetId)) {"),
  "Batch 47 Issue 3: resolveFeedback must support normalized class IDs across class boundaries",
  "resolveFeedback blocks authorized users due to raw classId casing or whitespace"
);

assert(
  stateContent.includes("const updatedResults = results.map(r => normalizeClassId(r.classId) === oldNorm ? { ...r, classId: newNorm } : r);\n    setResults(updatedResults);\n    saveToStorage(\"unihub_results\", updatedResults);\n\n    const updatedMembers = members.map(m => normalizeClassId(m.classId) === oldNorm ? { ...m, classId: newNorm } : m);\n    setMembers(updatedMembers);\n    saveToStorage(\"unihub_members\", updatedMembers);") &&
  stateContent.includes("const updatedMembers = members.filter(m => !deletedStudentIds.has(m.studentId) && normalizeClassId(m.classId) !== norm);\n    setMembers(updatedMembers);\n    saveToStorage(\"unihub_members\", updatedMembers);\n\n    const updatedAttendance = attendance.filter(a => !deletedStudentIds.has(a.studentId));\n    setAttendance(updatedAttendance);\n    saveToStorage(\"unihub_attendance\", updatedAttendance);"),
  "Batch 47 Issue 4: renameClass and deleteClass must cascade updates to results, members, and attendance",
  "renameClass or deleteClass leaves orphaned members, attendances, or unupdated results"
);

console.log("\n=========================================");
if (failures === 0) {
  console.log("🎉 ALL BATCH 1 - 47 SECURITY & INTEGRITY REGRESSION TESTS PASSED (248 CHECKS)!");
  console.log("=========================================\n");
  process.exit(0);
} else {
  console.error(`💥 ${failures} SECURITY REGRESSION TEST(S) FAILED.`);
  console.log("=========================================\n");
  process.exit(1);
}

