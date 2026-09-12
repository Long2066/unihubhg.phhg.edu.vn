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

console.log("\n=========================================");
if (failures === 0) {
  console.log("🎉 ALL BATCH 1 - 27 SECURITY & INTEGRITY REGRESSION TESTS PASSED (141 CHECKS)!");
  console.log("=========================================\n");
  process.exit(0);
} else {
  console.error(`💥 ${failures} SECURITY REGRESSION TEST(S) FAILED.`);
  console.log("=========================================\n");
  process.exit(1);
}

