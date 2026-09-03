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

console.log("\n=========================================");
if (failures === 0) {
  console.log("🎉 ALL BATCH 1 & BATCH 2 SECURITY REGRESSION TESTS PASSED!");
  console.log("=========================================\n");
  process.exit(0);
} else {
  console.error(`💥 ${failures} SECURITY REGRESSION TEST(S) FAILED.`);
  console.log("=========================================\n");
  process.exit(1);
}
