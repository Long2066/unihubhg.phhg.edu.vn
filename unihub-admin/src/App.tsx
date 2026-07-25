import React, { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from "firebase/firestore";
import { db, auth, firebaseConfig } from "./firebase";
import { 
  getAuth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { 
  UserAccount, 
  UserRole, 
  Student, 
  Organization, 
  OrganizationMember, 
  ExtracurricularActivity, 
  ActivityAttendance, 
  EvidenceSubmission, 
  EvaluationResult, 
  PointCriteria,
  DailyAttendanceReport,
  ScheduleSlot,
  SystemFeedback,
  ThemeConfig
} from "./types";
import { 
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
  SEED_PERIOD 
} from "./data";
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  Cpu, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RefreshCw, 
  AlertTriangle,
  Info,
  Shield,
  FileCheck,
  TrendingUp,
  Download,
  BookOpen,
  Mail,
  Image,
  Palette
} from "lucide-react";
import * as XLSX from "xlsx";

type ActiveTab = "DASHBOARD" | "USERS" | "DATABASE" | "RULES" | "TOOLS" | "FEEDBACK" | "THEME";

const compressAndReadFile = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8, isCircularClip: boolean = false, forceJpeg: boolean = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (isCircularClip) {
          // Force square for circular clip
          const size = Math.min(width, height, maxWidth);
          width = size;
          height = size;
        } else {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          if (isCircularClip) {
            // Apply circular clip path
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // Draw image covering the square canvas area
            const imgSize = Math.min(img.width, img.height);
            const sx = (img.width - imgSize) / 2;
            const sy = (img.height - imgSize) / 2;
            ctx.drawImage(img, sx, sy, imgSize, imgSize, 0, 0, width, height);
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }
          // Force PNG for circular clip to preserve transparency, force JPEG for background
          let mimeType = "image/jpeg";
          if (isCircularClip) {
            mimeType = "image/png";
          } else if (!forceJpeg && file.type === "image/png") {
            mimeType = "image/png";
          }
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error("Không thể đọc tệp ảnh."));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("unihub_superadmin_auth") === "true";
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Sidebar navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>("DASHBOARD");

  // Interface custom theme state
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    loginBgUrl: "",
    logoUrl: "",
    loginTitle: "CỔNG THÔNG TIN UNIHUBHG",
    loginSubtitle: "Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang - Tra cứu ngay thông tin của bạn",
    bgOverlayOpacity: 0.75
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setStatusMessage("Đang nén và xử lý ảnh logo...");
    try {
      const base64 = await compressAndReadFile(file, 256, 256, 0.85, true);
      setThemeConfig(prev => ({ ...prev, logoUrl: base64 }));
    } catch (err: any) {
      alert("Lỗi khi xử lý ảnh logo: " + err.message);
    } finally {
      setLogoUploading(false);
      setStatusMessage("");
      if (e.target) e.target.value = ""; // Reset value so file change is always triggered
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBgUploading(true);
    setStatusMessage("Đang nén và tối ưu hóa danh sách ảnh nền...");
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        // Compress background to Full HD (1920x1080) and quality 0.85 JPEG for maximum sharpness.
        // This ensures the image keeps its crystal-clear original sharpness, with each image taking ~100KB-150KB.
        const base64 = await compressAndReadFile(file, 1920, 1080, 0.85, false, true);
        newUrls.push(base64);
      }
      setThemeConfig(prev => {
        const currentList = prev.loginBgUrls && prev.loginBgUrls.length > 0 
          ? prev.loginBgUrls 
          : (prev.loginBgUrl ? [prev.loginBgUrl] : []);
        const updatedList = [...currentList, ...newUrls].slice(0, 8); // Max 8 images to prevent large documents
        return { 
          ...prev, 
          loginBgUrls: updatedList,
          loginBgUrl: updatedList[0] || ""
        };
      });
    } catch (err: any) {
      alert("Lỗi khi xử lý ảnh nền: " + err.message);
    } finally {
      setBgUploading(false);
      setStatusMessage("");
      if (e.target) e.target.value = ""; // Reset value so file change is always triggered
    }
  };

  const addBgUrlToList = (newUrl: string) => {
    if (!newUrl) return;
    setThemeConfig(prev => {
      const currentList = prev.loginBgUrls && prev.loginBgUrls.length > 0 
        ? prev.loginBgUrls 
        : (prev.loginBgUrl ? [prev.loginBgUrl] : []);
      if (currentList.includes(newUrl)) return prev;
      const updatedList = [...currentList, newUrl].slice(0, 8);
      return {
        ...prev,
        loginBgUrls: updatedList,
        loginBgUrl: updatedList[0] || ""
      };
    });
  };

  const removeBgImage = (indexToRemove: number) => {
    setThemeConfig(prev => {
      const currentList = prev.loginBgUrls || [];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        loginBgUrls: updated,
        loginBgUrl: updated[0] || ""
      };
    });
  };

  // Real-time Firestore Collections state
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activities, setActivities] = useState<ExtracurricularActivity[]>([]);
  const [attendance, setAttendance] = useState<ActivityAttendance[]>([]);
  const [evidence, setEvidence] = useState<EvidenceSubmission[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [criteria, setCriteria] = useState<PointCriteria[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendanceReport[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [systemFeedbacks, setSystemFeedbacks] = useState<SystemFeedback[]>([]);

  // Feedback tab search & filters state
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackRoleFilter, setFeedbackRoleFilter] = useState("ALL");
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState("ALL");
  const [feedbackBulkConfirmText, setFeedbackBulkConfirmText] = useState("");
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // System status and loading
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Sub-state for lists (Search/Filters)
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [dbSelectedCollection, setDbSelectedCollection] = useState<string>("students");
  const [dbSearch, setDbSearch] = useState("");

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    email: "",
    role: UserRole.STUDENT,
    password: "",
    targetId: "",
    monitorTitle: "Lớp trưởng"
  });

  const [showDbEditModal, setShowDbEditModal] = useState(false);
  const [dbEditTarget, setDbEditTarget] = useState<any>(null);

  // Listen to Auth State to keep session active
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser && (authUser.email?.toLowerCase() === "superadmin@unihub.edu.vn" || authUser.email?.toLowerCase() === "pcthssv@hg.edu.vn")) {
        setIsAuthenticated(true);
        localStorage.setItem("unihub_superadmin_auth", "true");
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("unihub_superadmin_auth");
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync database in real-time
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    setStatusMessage("Đang đồng bộ dữ liệu từ Firestore...");

    const unsubscribes = [
      onSnapshot(collection(db, "users"), (snap) => {
        const list: UserAccount[] = [];
        snap.forEach(d => list.push(d.data() as UserAccount));
        setUsers(list);
      }, (err) => {
        console.error("Users sync error", err);
        setIsFirebaseConnected(false);
      }),

      onSnapshot(collection(db, "students"), (snap) => {
        const list: Student[] = [];
        snap.forEach(d => list.push(d.data() as Student));
        setStudents(list);
      }),

      onSnapshot(collection(db, "organizations"), (snap) => {
        const list: Organization[] = [];
        snap.forEach(d => list.push(d.data() as Organization));
        setOrganizations(list);
      }),

      onSnapshot(collection(db, "activities"), (snap) => {
        const list: ExtracurricularActivity[] = [];
        snap.forEach(d => list.push(d.data() as ExtracurricularActivity));
        setActivities(list);
      }),

      onSnapshot(collection(db, "attendance"), (snap) => {
        const list: ActivityAttendance[] = [];
        snap.forEach(d => list.push(d.data() as ActivityAttendance));
        setAttendance(list);
      }),

      onSnapshot(collection(db, "evidence"), (snap) => {
        const list: EvidenceSubmission[] = [];
        snap.forEach(d => list.push(d.data() as EvidenceSubmission));
        setEvidence(list);
      }),

      onSnapshot(collection(db, "results"), (snap) => {
        const list: EvaluationResult[] = [];
        snap.forEach(d => list.push(d.data() as EvaluationResult));
        setResults(list);
      }),

      onSnapshot(collection(db, "criteria"), (snap) => {
        const list: PointCriteria[] = [];
        snap.forEach(d => list.push(d.data() as PointCriteria));
        setCriteria(list.sort((a,b) => a.id.localeCompare(b.id)));
      }),

      onSnapshot(collection(db, "dailyAttendance"), (snap) => {
        const list: DailyAttendanceReport[] = [];
        snap.forEach(d => list.push(d.data() as DailyAttendanceReport));
        setDailyAttendance(list);
      }),

      onSnapshot(collection(db, "schedules"), (snap) => {
        const list: ScheduleSlot[] = [];
        snap.forEach(d => list.push(d.data() as ScheduleSlot));
        setSchedules(list);
      }),

      onSnapshot(collection(db, "members"), (snap) => {
        const list: OrganizationMember[] = [];
        snap.forEach(d => list.push(d.data() as OrganizationMember));
        setMembers(list);
      }),

      onSnapshot(collection(db, "systemFeedbacks"), (snap) => {
        const list: SystemFeedback[] = [];
        snap.forEach(d => list.push(d.data() as SystemFeedback));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSystemFeedbacks(list);
      }),

      onSnapshot(doc(db, "systemConfig", "theme"), (docSnap) => {
        if (docSnap.exists()) {
          setThemeConfig(prev => ({ ...prev, ...docSnap.data() }));
        }
      })
    ];

    setLoading(false);
    setIsFirebaseConnected(true);
    setStatusMessage("");

    // Cleanup listeners on unmount
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim();
    const password = loginPassword;
    setLoginError("");

    if (!email || !password) {
      setLoginError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sync admin doc under their Auth UID key in Firestore for rules check
      if (email === "superadmin@unihub.edu.vn" && userCredential.user) {
        const uid = userCredential.user.uid;
        const adminDoc: UserAccount = {
          id: uid,
          username: "superadmin",
          name: "Super Admin",
          role: UserRole.ADMIN,
          email: "superadmin@unihub.edu.vn",
          password: password
        };
        await setDoc(doc(db, "users", uid), adminDoc);
        
        // Clean up duplicate documents (e.g. U_SUPERADMIN, superadmin) in database
        try {
          const snap = await getDocs(collection(db, "users"));
          for (const d of snap.docs) {
            const userData = d.data();
            if (userData.email === "superadmin@unihub.edu.vn" && d.id !== uid) {
              await deleteDoc(doc(db, "users", d.id));
            }
          }
        } catch (cleanupErr) {
          console.warn("Failed to clean up duplicate superadmin docs:", cleanupErr);
        }
      }
      // Auth state listener will set isAuthenticated
    } catch (err: any) {
      console.log("Admin sign-in failed, checking for superadmin creation...", err.code || err.message);
      
      if (err.code === "auth/operation-not-allowed") {
        setLoginError("Lỗi: Phương thức đăng nhập bằng Email/Password chưa được kích hoạt trong Firebase Console của bạn. Vui lòng vào Build -> Authentication -> Sign-in method và BẬT 'Email/Password' lên.");
        return;
      }

      if (email === "superadmin@unihub.edu.vn") {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          const uid = userCred.user.uid;
          
          const newAdminDoc: UserAccount = {
            id: uid,
            username: "superadmin",
            name: "Super Admin",
            role: UserRole.ADMIN,
            email: "superadmin@unihub.edu.vn",
            password: password
          };
          await setDoc(doc(db, "users", uid), newAdminDoc);
          
          // Clean up duplicate documents
          try {
            const snap = await getDocs(collection(db, "users"));
            for (const d of snap.docs) {
              const userData = d.data();
              if (userData.email === "superadmin@unihub.edu.vn" && d.id !== uid) {
                await deleteDoc(doc(db, "users", d.id));
              }
            }
          } catch (cleanupErr) {
            console.warn("Failed to clean up duplicate superadmin docs:", cleanupErr);
          }
          return;
        } catch (regErr: any) {
          console.error("Superadmin auto-registration failed:", regErr);
          if (regErr.code === "auth/operation-not-allowed") {
            setLoginError("Lỗi: Phương thức đăng nhập bằng Email/Password chưa được kích hoạt trong Firebase Console của bạn. Vui lòng vào Build -> Authentication -> Sign-in method và BẬT 'Email/Password' lên.");
          } else if (regErr.code === "auth/email-already-in-use") {
            setLoginError("Mật khẩu Super Admin không chính xác! (Tài khoản superadmin@unihub.edu.vn đã tồn tại trên Firebase Authentication). Nếu quên mật khẩu, vui lòng vào Firebase Console -> Authentication -> Users xóa người dùng này và thử đăng nhập lại với mật khẩu mới.");
          } else {
            setLoginError("Đăng nhập thất bại: " + regErr.message);
          }
          return;
        }
      }
      
      setLoginError("Tài khoản hoặc mật khẩu quản trị không chính xác!");
    }
  };

  const handleSaveThemeConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatusMessage("Đang lưu cấu hình giao diện...");
    try {
      await setDoc(doc(db, "systemConfig", "theme"), themeConfig);
      alert("Đã lưu cấu hình Ảnh & Giao diện thành công!");
    } catch (err: any) {
      console.error("Save theme config error", err);
      alert("Lỗi khi lưu cấu hình giao diện: " + err.message);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error", err);
    }
    setIsAuthenticated(false);
    localStorage.removeItem("unihub_superadmin_auth");
  };

  // User management actions
  const openUserModal = (user: UserAccount | null) => {
    setSelectedUser(user);
    if (user) {
      setUserForm({
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        password: user.password || "password123",
        targetId: user.targetId || "",
        monitorTitle: user.monitorTitle || "Lớp trưởng"
      });
    } else {
      setUserForm({
        name: "",
        username: "",
        email: "",
        role: UserRole.STUDENT,
        password: "",
        targetId: "",
        monitorTitle: "Lớp trưởng"
      });
    }
    setShowUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = selectedUser ? selectedUser.id : `U_GEN_${Date.now()}`;
      
      // Setup fallback email and password safely
      let targetEmail = (userForm.email || "").trim();
      if (!targetEmail) {
        const username = (userForm.username || "").trim();
        targetEmail = username.includes("@") ? username : `${username}@unihub.edu.vn`;
      }
      const targetPassword = userForm.password || "password123";

      let targetDocId = id;
      const userData: UserAccount = {
        id: selectedUser ? selectedUser.id : id,
        name: userForm.name,
        username: userForm.username,
        email: targetEmail,
        role: userForm.role,
        password: targetPassword
      };

      if (userForm.targetId && userForm.targetId.trim()) {
        userData.targetId = userForm.targetId.trim();
      }
      if (userForm.role === UserRole.CLASS_MONITOR) {
        userData.monitorTitle = userForm.monitorTitle;
      }

      // If creating a new user, create their Firebase Auth credentials using temporary app
      if (!selectedUser) {
        try {
          const tempAppName = `TempApp_${Date.now()}`;
          const tempApp = initializeApp(firebaseConfig, tempAppName);
          const tempAuth = getAuth(tempApp);
          
          const userCred = await createUserWithEmailAndPassword(tempAuth, targetEmail, targetPassword);
          if (userCred.user) {
            targetDocId = userCred.user.uid;
            userData.id = targetDocId; // update ID inside doc
          }
          await deleteApp(tempApp);
        } catch (authErr: any) {
          console.warn("Firebase Auth user creation warning (might already exist):", authErr);
        }
      }

      await setDoc(doc(db, "users", targetDocId), userData);
      setShowUserModal(false);
      setTimeout(() => {
        alert("Đã lưu thông tin tài khoản thành công!");
      }, 50);
    } catch (err) {
      alert("Lỗi khi lưu tài khoản: " + err);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
        alert("Đã xóa tài khoản thành công.");
      } catch (err) {
        alert("Lỗi khi xóa tài khoản: " + err);
      }
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thư góp ý này vĩnh viễn không?")) {
      try {
        await deleteDoc(doc(db, "systemFeedbacks", id));
        alert("Đã xóa thư góp ý thành công.");
      } catch (err) {
        alert("Lỗi khi xóa góp ý: " + err);
      }
    }
  };

  const handleBulkDeleteFeedback = async () => {
    if (feedbackBulkConfirmText !== "CONFIRM") {
      alert("Vui lòng nhập chính xác chữ 'CONFIRM' để xác nhận xóa hàng loạt!");
      return;
    }
    try {
      setLoading(true);
      setStatusMessage("Đang xóa hàng loạt thư góp ý...");
      const snap = await getDocs(collection(db, "systemFeedbacks"));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "systemFeedbacks", d.id)));
      await Promise.all(deletePromises);
      alert(`Đã xóa hàng loạt thành công ${snap.size} thư góp ý vĩnh viễn.`);
      setFeedbackBulkConfirmText("");
      setShowBulkConfirmModal(false);
    } catch (err) {
      alert("Lỗi khi xóa hàng loạt: " + err);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // Masquerade: Open main application port 3000 with impersonation parameter
  const impersonate = (username: string) => {
    const targetUrl = `http://localhost:3000/?impersonate=${encodeURIComponent(username)}`;
    window.open(targetUrl, "_blank");
  };

  const translateRole = (role: UserRole, user?: any) => {
    switch (role) {
      case UserRole.STUDENT: return "Sinh viên";
      case UserRole.GROUP_LEADER: return "Tổ trưởng";
      case UserRole.CLASS_MONITOR: 
        if (user?.isGroupLeader) return `Tổ trưởng (${user.groupInCharge || 'Tổ'})`;
        return user?.monitorTitle || "Lớp trưởng (BCS)";
      case UserRole.ADVISER: return "Giảng viên Cố vấn (GVCN)";
      case UserRole.ORGANIZER: return "CLB / Đoàn / Hội";
      case UserRole.FACULTY: return "Văn phòng Khoa";
      case UserRole.TRAINING_DEPT: return "Phòng Đào tạo";
      case UserRole.ADMIN: return "Phòng CTHSSV (Admin)";
      default: return role;
    }
  };

  // Point criteria rules override
  const updateRulePoints = async (critId: string, ruleId: string, newPoints: number) => {
    const critObj = criteria.find(c => c.id === critId);
    if (!critObj) return;

    const updatedRules = critObj.rules.map(r => {
      if (r.id === ruleId) {
        return { ...r, points: newPoints };
      }
      return r;
    });

    const updatedCrit = {
      ...critObj,
      rules: updatedRules
    };

    try {
      await setDoc(doc(db, "criteria", critId), updatedCrit);
      alert(`Đã cập nhật quy tắc ${ruleId} thành ${newPoints} điểm.`);
    } catch (err) {
      alert("Lỗi khi lưu quy chế: " + err);
    }
  };

  // Recalculate Evaluation Results for all students based on currently loaded criteria
  const runScoreRecalculation = async () => {
    if (students.length === 0) return;
    setStatusMessage("Đang tính toán lại điểm rèn luyện toàn trường...");
    setLoading(true);

    const getRulePoints = (cid: string, rid: string, defaultPoints: number): number => {
      const critObj = criteria.find(c => c.id === cid);
      const ruleObj = critObj?.rules.find(r => r.id === rid);
      return ruleObj !== undefined ? ruleObj.points : defaultPoints;
    };

    try {
      for (const student of students) {
        const logs: EvaluationResult["logs"] = [];
        const timestampNow = new Date().toISOString().split("T")[0];

        // 1. TC1: Học tập (Max 20)
        let studyPoints = 0;
        const semId = "HOCKY_2_2025_2026";
        const periodData = student.academicDataByPeriod?.[semId] || {};
        const studentGpa = periodData.gpa ?? student.gpa;
        const hasWarning = periodData.learningWarning ?? student.learningWarning;

        if (studentGpa !== undefined) {
          if (studentGpa >= 3.6) {
            const pt = getRulePoints("TC1", "TC1.1", 20);
            studyPoints = pt;
            logs.push({ criteriaId: "TC1.1", points: pt, reason: `GPA học tập đạt loại Xuất sắc (${studentGpa})`, source: "ĐÀO TẠO", timestamp: timestampNow });
          } else if (studentGpa >= 3.2) {
            const pt = getRulePoints("TC1", "TC1.2", 18);
            studyPoints = pt;
            logs.push({ criteriaId: "TC1.2", points: pt, reason: `GPA học tập đạt loại Giỏi (${studentGpa})`, source: "ĐÀO TẠO", timestamp: timestampNow });
          } else if (studentGpa >= 2.5) {
            const pt = getRulePoints("TC1", "TC1.3", 15);
            studyPoints = pt;
            logs.push({ criteriaId: "TC1.3", points: pt, reason: `GPA học tập đạt loại Khá (${studentGpa})`, source: "ĐÀO TẠO", timestamp: timestampNow });
          } else if (studentGpa >= 2.0) {
            const pt = getRulePoints("TC1", "TC1.4", 10);
            studyPoints = pt;
            logs.push({ criteriaId: "TC1.4", points: pt, reason: `GPA học tập đạt loại Trung bình (${studentGpa})`, source: "ĐÀO TẠO", timestamp: timestampNow });
          }
        }
        if (hasWarning) {
          const pt = getRulePoints("TC1", "TC1.5", -5);
          studyPoints = Math.max(0, studyPoints + pt);
          logs.push({ criteriaId: "TC1.5", points: pt, reason: "Bị cảnh báo tình trạng học tập", source: "ĐÀO TẠO", timestamp: timestampNow });
        }

        // 2. TC2: Nội quy (Base 25, subtract violations)
        let violationPoints = 25;
        if (studentGpa !== undefined && studentGpa < 1.5) {
          const pt = getRulePoints("TC2", "TC2.2", -10);
          violationPoints = Math.max(0, violationPoints + pt);
          logs.push({ criteriaId: "TC2.2", points: pt, reason: "Vi phạm quy chế nợ nhiều học phần hoặc cảnh báo học lực thấp", source: "ĐÀO TẠO", timestamp: timestampNow });
        }
        if (student.id === "SV20CN02") {
          const pt = getRulePoints("TC2", "TC2.1", -2);
          violationPoints = Math.max(0, violationPoints + pt);
          logs.push({ criteriaId: "TC2.1", points: pt, reason: "Báo cáo nề nếp lớp: Đi học muộn quá quy định", source: "ĐÀO TẠO", timestamp: timestampNow });
        }

        // 3. TC3: Hoạt động (Max 30)
        let extracurricularPoints = 0;
        const isCLBMember = members.some(m => m.studentId === student.id && m.status === "ACTIVE");
        if (isCLBMember) {
          const pt = getRulePoints("TC3", "TC3.3", 10);
          extracurricularPoints += pt;
          logs.push({ criteriaId: "TC3.3", points: pt, reason: "Là thành viên câu lạc bộ chính thức tích cực", source: "CLB_ATTENDANCE", timestamp: timestampNow });
        }
        const attendedEvents = attendance.filter(a => a.studentId === student.id && a.attended && a.verified);
        attendedEvents.forEach(att => {
          const act = activities.find(act => act.id === att.activityId);
          if (act) {
            const pt = att.role === "BTC" ? getRulePoints("TC3", "TC3.2", 8) : getRulePoints("TC3", "TC3.1", 5);
            extracurricularPoints += pt;
            logs.push({ criteriaId: act.criteriaId, points: pt, reason: `Đã tham gia hoạt động: "${act.title}"`, source: "CLB_ATTENDANCE", timestamp: timestampNow });
          }
        });
        extracurricularPoints = Math.min(30, extracurricularPoints);

        // 4. TC4: Cộng đồng (Max 15)
        let communityPoints = 0;
        const approvedEvs = evidence.filter(e => e.studentId === student.id && e.status === "APPROVED");
        approvedEvs.forEach(ev => {
          communityPoints += ev.pointsRequested;
          logs.push({ criteriaId: ev.criteriaId, points: ev.pointsRequested, reason: `Phê duyệt minh chứng: "${ev.activityName}"`, source: "MINH_CHỨNG", timestamp: ev.submittedAt });
        });
        const hasCleanDuty = student.id === "DTG245140202053" || student.id === "SV20CN02" || student.id === "SV20CN03";
        if (hasCleanDuty) {
          const pt = getRulePoints("TC4", "TC4.2", 5);
          communityPoints += pt;
          logs.push({ criteriaId: "TC4.2", points: pt, reason: "Hoàn thành tốt trực tuần tự quản nề nếp lớp học", source: "BCS_DUYỆT", timestamp: timestampNow });
        }
        communityPoints = Math.min(15, communityPoints);

        // 5. TC5: Chức vụ, thành tích (Max 10)
        let achievementPoints = 0;
        const isMonitor = student.id === "SV20CN03" || student.id === "SV20NL01";
        if (isMonitor) {
          const pt = getRulePoints("TC5", "TC5.1", 10);
          achievementPoints += pt;
          logs.push({ criteriaId: "TC5.1", points: pt, reason: "Đảm nhiệm Ban cán sự Lớp trưởng hoàn thành xuất sắc", source: "BCS_DUYỆT", timestamp: timestampNow });
        }
        achievementPoints = Math.min(10, achievementPoints);

        const totalPoints = studyPoints + violationPoints + extracurricularPoints + communityPoints + achievementPoints;
        let grade: EvaluationResult["grade"] = "TRUNG BÌNH";
        if (totalPoints >= 90) grade = "XUẤT SẮC";
        else if (totalPoints >= 80) grade = "TỐT";
        else if (totalPoints >= 70) grade = "KHÁ";
        else if (totalPoints >= 50) grade = "TRUNG BÌNH";
        else if (totalPoints >= 30) grade = "YẾU";
        else grade = "KÉM";

        const docId = `${student.id}_HOCKY_2_2025_2026`;
        const resultData: EvaluationResult = {
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          facultyId: student.facultyId,
          periodId: "HOCKY_2_2025_2026",
          studyPoints,
          violationPoints,
          extracurricularPoints,
          communityPoints,
          achievementPoints,
          totalPoints,
          grade,
          status: "AUTO",
          logs
        };

        await setDoc(doc(db, "results", docId), resultData);
      }
      setLoading(false);
      setStatusMessage("");
      alert("Đã chạy lại động cơ tính điểm và cập nhật điểm rèn luyện toàn bộ sinh viên!");
    } catch (err) {
      setLoading(false);
      setStatusMessage("");
      alert("Lỗi khi tính toán lại: " + err);
    }
  };

  // Systems & Dev Core Actions: Reset database to original seed arrays
  const resetDatabaseToSeeds = async () => {
    if (!confirm("Cảnh báo! Thao tác này sẽ xóa sạch dữ liệu hiện tại trong cơ sở dữ liệu và nạp lại dữ liệu mẫu gốc. Bạn có muốn tiếp tục không?")) {
      return;
    }

    setLoading(true);
    setStatusMessage("Đang xóa và nạp lại dữ liệu mẫu...");

    try {
      // Helper to clear collection
      const clearCollection = async (colName: string) => {
        const snap = await getDocs(collection(db, colName));
        for (const docObj of snap.docs) {
          await deleteDoc(doc(db, colName, docObj.id));
        }
      };

      await clearCollection("users");
      await clearCollection("students");
      await clearCollection("organizations");
      await clearCollection("criteria");
      await clearCollection("activities");
      await clearCollection("attendance");
      await clearCollection("evidence");
      await clearCollection("results");
      await clearCollection("dailyAttendance");
      await clearCollection("schedules");
      await clearCollection("members");

      // Write Seeds
      for (const u of SEED_USERS) await setDoc(doc(db, "users", u.id), u);
      for (const s of SEED_STUDENTS) await setDoc(doc(db, "students", s.id), s);
      for (const o of SEED_ORGANIZATIONS) await setDoc(doc(db, "organizations", o.id), o);
      for (const c of SEED_CRITERIA) await setDoc(doc(db, "criteria", c.id), c);
      for (const a of SEED_ACTIVITIES) await setDoc(doc(db, "activities", a.id), a);
      for (const att of SEED_ATTENDANCE) await setDoc(doc(db, "attendance", att.id), att);
      for (const ev of SEED_EVIDENCE) await setDoc(doc(db, "evidence", ev.id), ev);
      for (const r of SEED_RESULTS) {
        const docId = `${r.studentId}_${r.periodId}`;
        await setDoc(doc(db, "results", docId), r);
      }
      for (const da of SEED_DAILY_ATTENDANCE) await setDoc(doc(db, "dailyAttendance", da.id), da);
      for (const sc of SEED_SCHEDULES) await setDoc(doc(db, "schedules", sc.id), sc);
      for (const m of SEED_MEMBERS) await setDoc(doc(db, "members", m.id), m);

      // Add default super admin to seed list in firestore if not exists
      const superadminAccount: UserAccount = {
        id: "U_SUPERADMIN",
        name: "Nhà phát triển (Super Admin)",
        username: "superadmin@unihub.edu.vn",
        email: "superadmin@unihub.edu.vn",
        role: UserRole.ADMIN, // Or SUPER_ADMIN
        password: "superadmin"
      };
      await setDoc(doc(db, "users", "U_SUPERADMIN"), superadminAccount);

      alert("Khôi phục dữ liệu hệ thống (Reset to Seeds) hoàn tất thành công!");
    } catch (err) {
      alert("Lỗi trong quá trình khôi phục: " + err);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const wipeAllDatabase = async () => {
    if (!confirm("CẢNH BÁO NGUY HIỂM! Thao tác này sẽ xóa sạch toàn bộ cơ sở dữ liệu và không thể hoàn tác. Dữ liệu sẽ trống hoàn toàn. Bạn chắc chắn muốn thực hiện?")) {
      return;
    }

    setLoading(true);
    setStatusMessage("Đang dọn sạch cơ sở dữ liệu...");

    try {
      const clearCollection = async (colName: string) => {
        const snap = await getDocs(collection(db, colName));
        for (const docObj of snap.docs) {
          await deleteDoc(doc(db, colName, docObj.id));
        }
      };

      await clearCollection("users");
      await clearCollection("students");
      await clearCollection("organizations");
      await clearCollection("criteria");
      await clearCollection("activities");
      await clearCollection("attendance");
      await clearCollection("evidence");
      await clearCollection("results");
      await clearCollection("dailyAttendance");
      await clearCollection("schedules");
      await clearCollection("members");

      // Always restore the superadmin account so you can log back in
      const superadminAccount: UserAccount = {
        id: "U_SUPERADMIN",
        name: "Nhà phát triển (Super Admin)",
        username: "superadmin@unihub.edu.vn",
        email: "superadmin@unihub.edu.vn",
        role: UserRole.ADMIN,
        password: "superadmin"
      };
      await setDoc(doc(db, "users", "U_SUPERADMIN"), superadminAccount);

      alert("Đã xóa sạch cơ sở dữ liệu (Wipe database) thành công! Các bảng hiện trống rỗng.");
    } catch (err) {
      alert("Lỗi khi xóa dữ liệu: " + err);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // Database actions: Approve / Reject evidence submission directly
  const reviewEvidenceDirect = async (id: string, status: "APPROVED" | "REJECTED") => {
    const evObj = evidence.find(e => e.id === id);
    if (!evObj) return;

    const updatedEv = {
      ...evObj,
      status,
      reviewedBy: "Super Admin",
      reviewComment: status === "APPROVED" ? "Phê duyệt trực tiếp từ trang quản trị Super Admin" : "Từ chối trực tiếp từ trang quản trị Super Admin"
    };

    try {
      await setDoc(doc(db, "evidence", id), updatedEv);
      alert(`Đã cập nhật trạng thái minh chứng thành công.`);
    } catch (err) {
      alert("Lỗi khi cập nhật minh chứng: " + err);
    }
  };

  // Raw Database Editor actions
  const startDbRowEdit = (row: any) => {
    setDbEditTarget(row);
    setShowDbEditModal(true);
  };

  const saveDbRowEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbEditTarget || !dbEditTarget.id) {
      alert("Không tìm thấy ID thực thể hợp lệ.");
      return;
    }

    try {
      let collName = dbSelectedCollection;
      let docId = dbEditTarget.id;
      if (collName === "results") {
        docId = `${dbEditTarget.studentId}_${dbEditTarget.periodId}`;
      }

      await setDoc(doc(db, collName, docId), dbEditTarget);
      setShowDbEditModal(false);
      setTimeout(() => {
        alert("Đã cập nhật bản ghi dữ liệu thành công!");
      }, 50);
    } catch (err) {
      alert("Lỗi khi cập nhật bản ghi: " + err);
    }
  };

  const deleteDbRowDirect = async (rowId: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bản ghi có ID "${rowId}" này không?`)) {
      try {
        await deleteDoc(doc(db, dbSelectedCollection, rowId));
        alert("Đã xóa bản ghi thành công.");
      } catch (err) {
        alert("Lỗi khi xóa bản ghi: " + err);
      }
    }
  };

  // Export current table to Excel file
  const exportTableToExcel = () => {
    let dataToExport: any[] = [];
    if (dbSelectedCollection === "students") dataToExport = students;
    else if (dbSelectedCollection === "results") dataToExport = results;
    else if (dbSelectedCollection === "activities") dataToExport = activities;
    else if (dbSelectedCollection === "evidence") dataToExport = evidence;
    else if (dbSelectedCollection === "members") dataToExport = members;
    else if (dbSelectedCollection === "schedules") dataToExport = schedules;

    if (dataToExport.length === 0) {
      alert("Bảng hiện không có dữ liệu để xuất.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, dbSelectedCollection);
    XLSX.writeFile(wb, `unihub_${dbSelectedCollection}_export.xlsx`);
  };

  // Memoized lists (search filters)
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.username.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const filteredDbRows = useMemo(() => {
    let targetList: any[] = [];
    if (dbSelectedCollection === "students") targetList = students;
    else if (dbSelectedCollection === "results") targetList = results;
    else if (dbSelectedCollection === "activities") targetList = activities;
    else if (dbSelectedCollection === "evidence") targetList = evidence;
    else if (dbSelectedCollection === "members") targetList = members;
    else if (dbSelectedCollection === "schedules") targetList = schedules;

    return targetList.filter(row => {
      const rowStr = JSON.stringify(row).toLowerCase();
      return rowStr.includes(dbSearch.toLowerCase());
    });
  }, [dbSelectedCollection, students, results, activities, evidence, members, schedules, dbSearch]);

  // Statistics calculation for Dashboard Tab
  const statsSummary = useMemo(() => {
    const totalStudents = students.length;
    const totalClubs = organizations.filter(o => o.type === "CLB").length;
    const totalActivities = activities.length;
    const pendingEvidence = evidence.filter(e => e.status === "PENDING").length;

    // Approvals distribution helper
    let excellent = 0;
    let good = 0;
    let ratherGood = 0;
    let average = 0;
    let weak = 0;
    let poor = 0;

    results.forEach(r => {
      if (r.grade === "XUẤT SẮC") excellent++;
      else if (r.grade === "TỐT") good++;
      else if (r.grade === "KHÁ") ratherGood++;
      else if (r.grade === "TRUNG BÌNH") average++;
      else if (r.grade === "YẾU") weak++;
      else if (r.grade === "KÉM") poor++;
    });

    // Class approval progress metrics
    const totalClasses = Array.from(new Set(students.map(s => s.classId))).filter(Boolean);
    let lockedClasses = 0;
    let adviserApproved = 0;
    let monitorApproved = 0;

    totalClasses.forEach(cId => {
      const classResults = results.filter(r => r.classId === cId);
      if (classResults.length === 0) return;
      
      const allLocked = classResults.every(r => r.status === "LOCKED");
      const adviserApp = classResults.some(r => r.status === "APPROVED_ADVISER");
      const monitorApp = classResults.some(r => r.status === "APPROVED_CLASS");

      if (allLocked) lockedClasses++;
      else if (adviserApp) adviserApproved++;
      else if (monitorApp) monitorApproved++;
    });

    return {
      totalStudents,
      totalClubs,
      totalActivities,
      pendingEvidence,
      gradeDistribution: { excellent, good, ratherGood, average, weak, poor },
      approvalProgress: {
        total: totalClasses.length,
        locked: lockedClasses,
        adviser: adviserApproved,
        monitor: monitorApproved,
        auto: totalClasses.length - lockedClasses - adviserApproved - monitorApproved
      }
    };
  }, [students, organizations, activities, evidence, results]);

  // If not authenticated, render beautiful Glassmorphic Login page
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form className="login-card" onSubmit={handleLogin}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center", 
              width: "64px", 
              height: "64px", 
              borderRadius: "16px", 
              background: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              marginBottom: "16px",
              color: "#00F0FF"
            }}>
              <Shield size={32} />
            </div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: 800, color: "#fff" }}>UniHub Admin Console</h2>
            <p style={{ margin: "0", fontSize: "13px", color: "var(--text-muted)" }}>Nhập thông tin xác thực tối cao để tiếp quản hệ thống.</p>
          </div>

          {loginError && (
            <div style={{ 
              background: "rgba(239, 68, 68, 0.1)", 
              border: "1px solid var(--danger)", 
              color: "#FFAAAA", 
              padding: "12px", 
              borderRadius: "8px", 
              fontSize: "13px", 
              marginBottom: "20px",
              textAlign: "center" 
            }}>
              <AlertTriangle size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />
              {loginError}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9CA3AF", marginBottom: "8px", textTransform: "uppercase" }}>Tài khoản Email</label>
            <input 
              type="email" 
              className="input-dark" 
              placeholder="superadmin@unihub.edu.vn" 
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#9CA3AF", marginBottom: "8px", textTransform: "uppercase" }}>Mật khẩu tối cao</label>
            <input 
              type="password" 
              className="input-dark" 
              placeholder="••••••••" 
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-neon-cyan" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            Tiếp Quản Hệ Thống
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <Shield size={24} style={{ color: "var(--accent-cyan)" }} />
          <span>UNIHUB CORE</span>
        </div>

        <div className="sidebar-menu">
          <div 
            className={`sidebar-item ${activeTab === "DASHBOARD" ? "active" : ""}`}
            onClick={() => setActiveTab("DASHBOARD")}
          >
            <LayoutDashboard size={18} />
            <span>Tổng quan hệ thống</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === "USERS" ? "active" : ""}`}
            onClick={() => setActiveTab("USERS")}
          >
            <Users size={18} />
            <span>Tài khoản & Phân quyền</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === "DATABASE" ? "active" : ""}`}
            onClick={() => setActiveTab("DATABASE")}
          >
            <Database size={18} />
            <span>Khám phá dữ liệu thô</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === "RULES" ? "active" : ""}`}
            onClick={() => setActiveTab("RULES")}
          >
            <Settings size={18} />
            <span>Quy chế chấm điểm</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === "TOOLS" ? "active" : ""}`}
            onClick={() => setActiveTab("TOOLS")}
          >
            <Cpu size={18} />
            <span>Công cụ Hạt nhân</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === "FEEDBACK" ? "active" : ""}`}
            onClick={() => setActiveTab("FEEDBACK")}
          >
            <Mail size={18} />
            <span>Hòm thư góp ý</span>
          </div>

          <div 
            className={`sidebar-item ${activeTab === "THEME" ? "active" : ""}`}
            onClick={() => setActiveTab("THEME")}
          >
            <Image size={18} />
            <span>Ảnh giao diện</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-normal)", paddingTop: "16px" }}>
          {statusMessage && (
            <div style={{ fontSize: "11px", color: "var(--accent-cyan)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <RefreshCw size={12} className="animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isFirebaseConnected ? "var(--success)" : "var(--danger)" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{isFirebaseConnected ? "Firestore: Live" : "Firestore: Offline"}</span>
            </div>
          </div>

          <button className="btn-solid-danger" onClick={handleLogout} style={{ width: "100%", justifyContent: "center" }}>
            <LogOut size={16} />
            <span>Đăng xuất Admin</span>
          </button>
        </div>
      </div>

      {/* 2. Main Area */}
      <div className="main-content">
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", color: "var(--accent-cyan)" }}>
            <RefreshCw className="animate-spin" />
            <span>Đang truy xuất thông tin...</span>
          </div>
        )}

        {/* ================= TAB: DASHBOARD ================= */}
        {activeTab === "DASHBOARD" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <h1 style={{ margin: "0 0 8px 0", fontSize: "28px", fontWeight: 800 }}>Bảng điều khiển tối cao</h1>
              <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Thống kê sức khỏe dữ liệu, tổng số sinh viên, và tiến độ xét duyệt điểm rèn luyện toàn phân hiệu Hà Giang.</p>
            </div>

            {/* KPI Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-cyan)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Tổng số Sinh viên</span>
                <h3 style={{ margin: "12px 0 0 0", fontSize: "32px", fontWeight: 800, color: "#fff" }}>{statsSummary.totalStudents}</h3>
              </div>
              <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-purple)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Tổng số Câu lạc bộ</span>
                <h3 style={{ margin: "12px 0 0 0", fontSize: "32px", fontWeight: 800, color: "#fff" }}>{statsSummary.totalClubs}</h3>
              </div>
              <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-orange)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Hoạt động phong trào</span>
                <h3 style={{ margin: "12px 0 0 0", fontSize: "32px", fontWeight: 800, color: "#fff" }}>{statsSummary.totalActivities}</h3>
              </div>
              <div className="glass-card" style={{ borderLeft: "4px solid var(--success)" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Minh chứng chờ duyệt</span>
                <h3 style={{ margin: "12px 0 0 0", fontSize: "32px", fontWeight: 800, color: "var(--success)" }}>{statsSummary.pendingEvidence}</h3>
              </div>
            </div>

            {/* Visual Charts & Approval progress */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
              {/* Chart: Grade Distribution */}
              <div className="glass-card">
                <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={18} className="text-cyan-400" />
                  Phân bố xếp loại Điểm rèn luyện
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Xuất sắc (>= 90đ)", count: statsSummary.gradeDistribution.excellent, color: "var(--accent-cyan)", percent: results.length ? (statsSummary.gradeDistribution.excellent / results.length) * 100 : 0 },
                    { label: "Tốt (80đ - 89đ)", count: statsSummary.gradeDistribution.good, color: "var(--accent-purple)", percent: results.length ? (statsSummary.gradeDistribution.good / results.length) * 100 : 0 },
                    { label: "Khá (70đ - 79đ)", count: statsSummary.gradeDistribution.ratherGood, color: "var(--success)", percent: results.length ? (statsSummary.gradeDistribution.ratherGood / results.length) * 100 : 0 },
                    { label: "Trung bình (50đ - 69đ)", count: statsSummary.gradeDistribution.average, color: "var(--warning)", percent: results.length ? (statsSummary.gradeDistribution.average / results.length) * 100 : 0 },
                    { label: "Yếu / Kém (< 50đ)", count: statsSummary.gradeDistribution.weak + statsSummary.gradeDistribution.poor, color: "var(--danger)", percent: results.length ? ((statsSummary.gradeDistribution.weak + statsSummary.gradeDistribution.poor) / results.length) * 100 : 0 },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#E5E7EB" }}>{item.label}</span>
                        <strong style={{ color: "#fff" }}>{item.count} SV ({item.percent.toFixed(1)}%)</strong>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${item.percent}%`, height: "100%", background: item.color, borderRadius: "4px" }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress: Class approvals progress */}
              <div className="glass-card">
                <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileCheck size={18} className="text-cyan-400" />
                  Tiến độ chốt duyệt của các Lớp học
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ fontSize: "36px", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: 'monospace' }}>
                      {statsSummary.approvalProgress.locked} / {statsSummary.approvalProgress.total}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                      Lớp đã hoàn thành **Khóa sổ/Ký số** hoàn toàn và đã đồng bộ về Cổng Đào Tạo.
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-normal)", paddingTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>Chờ Khoa ký duyệt & khóa sổ:</span>
                      <strong className="text-amber-400">{statsSummary.approvalProgress.adviser} lớp</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>Đang chờ Cố vấn duyệt (Monitor đã chốt):</span>
                      <strong className="text-purple-400">{statsSummary.approvalProgress.monitor} lớp</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span>Chưa chốt tự đánh giá (Đang mở):</span>
                      <strong className="text-cyan-400">{statsSummary.approvalProgress.auto} lớp</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: USERS ================= */}
        {activeTab === "USERS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 800 }}>Tài khoản & Phân quyền</h1>
                <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Quản lý thông tin đăng nhập, phân bổ quyền cho các cán bộ quản lý và tính năng Giả lập đăng nhập.</p>
              </div>
              <button className="btn-neon-cyan" onClick={() => openUserModal(null)}>
                <Plus size={16} />
                Tạo tài khoản mới
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", background: "rgba(15,22,38,0.4)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-normal)" }}>
              <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "14px", color: "var(--text-muted)" }} />
                <input 
                  type="text" 
                  className="input-dark" 
                  style={{ paddingLeft: "36px" }}
                  placeholder="Tìm theo họ tên hoặc tài khoản..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <div style={{ width: "200px" }}>
                <select 
                  className="select-dark"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value={UserRole.STUDENT}>Sinh viên</option>
                  <option value={UserRole.CLASS_MONITOR}>Lớp trưởng (BCS)</option>
                  <option value={UserRole.ADVISER}>Giáo viên chủ nhiệm (GVCN)</option>
                  <option value={UserRole.ORGANIZER}>CLB / Đoàn Hội</option>
                  <option value={UserRole.FACULTY}>Khoa đào tạo</option>
                  <option value={UserRole.TRAINING_DEPT}>Phòng Đào tạo</option>
                  <option value={UserRole.ADMIN}>Phòng CTHSSV (Admin)</option>
                </select>
              </div>
            </div>

            {/* Users list table */}
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Email / Tài khoản</th>
                    <th>Vai trò</th>
                    <th>Mã liên kết (Target ID)</th>
                    <th>Mật khẩu</th>
                    <th style={{ textAlign: "right" }}>Thao tác điều khiển</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700, color: "#fff" }}>{u.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{u.username}</td>
                      <td>
                        <span className={`badge ${
                          u.role === UserRole.ADMIN ? "badge-danger" :
                          u.role === UserRole.TRAINING_DEPT ? "badge-purple" :
                          u.role === UserRole.ADVISER ? "badge-warning" :
                          u.role === UserRole.FACULTY ? "badge-cyan" : "badge-active"
                        }`}>
                          {translateRole(u.role)}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: "var(--accent-cyan)" }}>{u.targetId || "—"}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: "11px" }}>{u.password || "••••••••"}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button 
                            className="btn-neon-purple" 
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => impersonate(u.username)}
                            title="Đăng nhập giả lập dưới tài khoản này tại cổng 3000"
                          >
                            Giả lập (Masquerade)
                          </button>
                          <button 
                            className="btn-neon-cyan" 
                            style={{ padding: "4px 8px" }}
                            onClick={() => openUserModal(u)}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            className="btn-solid-danger" 
                            style={{ padding: "4px 8px" }}
                            onClick={() => deleteUser(u.id, u.name)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB: DATABASE EXPLORER ================= */}
        {activeTab === "DATABASE" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 800 }}>Khám phá cơ sở dữ liệu thô</h1>
                <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Trình duyệt và cập nhật dữ liệu trực tiếp trong các bộ sưu tập Firestore của UniHub.</p>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn-neon-purple" onClick={exportTableToExcel}>
                  <Download size={16} />
                  Xuất dữ liệu Excel
                </button>
              </div>
            </div>

            {/* Select Table Grid and Search Bar */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", background: "rgba(15,22,38,0.4)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-normal)" }}>
              <div style={{ width: "260px" }}>
                <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Chọn Bảng Dữ Liệu</label>
                <select 
                  className="select-dark"
                  value={dbSelectedCollection}
                  onChange={(e) => {
                    setDbSelectedCollection(e.target.value);
                    setDbSearch("");
                  }}
                >
                  <option value="students">Sinh viên (Students)</option>
                  <option value="results">Điểm rèn luyện (Results)</option>
                  <option value="activities">Hoạt động ngoại khóa (Activities)</option>
                  <option value="evidence">Minh chứng (Evidence Submissions)</option>
                  <option value="members">Thành viên CLB (Members)</option>
                  <option value="schedules">Thời khóa biểu (Schedules)</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: "240px" }}>
                <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Bộ Lọc Tìm Kiếm</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  <input 
                    type="text" 
                    className="input-dark" 
                    style={{ paddingLeft: "36px", paddingTop: "8px", paddingBottom: "8px" }}
                    placeholder="Tìm nhanh mọi dữ liệu trong dòng..."
                    value={dbSearch}
                    onChange={(e) => setDbSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Render selected Table */}
            <div className="custom-table-container">
              <table className="custom-table">
                {/* 1. Table Students */}
                {dbSelectedCollection === "students" && (
                  <>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ và tên</th>
                        <th>Lớp</th>
                        <th>Khoa</th>
                        <th>Giới tính</th>
                        <th>Ngày sinh</th>
                        <th>GPA</th>
                        <th>Nợ HP</th>
                        <th>Cảnh báo</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredDbRows as Student[]).map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace', color: "var(--accent-cyan)" }}>{row.id}</td>
                          <td style={{ color: "#fff", fontWeight: 700 }}>{row.name}</td>
                          <td>{row.classId}</td>
                          <td>{row.facultyId}</td>
                          <td>{row.gender || "—"}</td>
                          <td>{row.dob || "—"}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.gpa ?? "—"}</td>
                          <td style={{ color: row.debtTuition ? "var(--danger)" : "var(--success)", fontFamily: 'monospace' }}>
                            {row.debtTuition ? `${row.debtTuition.toLocaleString()}đ` : "0đ"}
                          </td>
                          <td>
                            {row.learningWarning ? (
                              <span className="badge badge-danger">Bị cảnh báo</span>
                            ) : (
                              <span className="badge badge-active">Bình thường</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => startDbRowEdit(row)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => deleteDbRowDirect(row.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 2. Table Results */}
                {dbSelectedCollection === "results" && (
                  <>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ tên</th>
                        <th>Lớp</th>
                        <th>Học tập (TC1)</th>
                        <th>Nội quy (TC2)</th>
                        <th>Tham gia (TC3)</th>
                        <th>Cộng đồng (TC4)</th>
                        <th>Chức vụ (TC5)</th>
                        <th style={{ fontWeight: 700 }}>Tổng Điểm</th>
                        <th>Xếp loại</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredDbRows as EvaluationResult[]).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{row.studentId}</td>
                          <td style={{ color: "#fff" }}>{row.studentName}</td>
                          <td>{row.classId}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.studyPoints}đ</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.violationPoints}đ</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.extracurricularPoints}đ</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.communityPoints}đ</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.achievementPoints}đ</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 900, color: "var(--accent-cyan)", fontSize: "14px" }}>{row.totalPoints}đ</td>
                          <td>
                            <span className={`badge ${
                              row.grade === "XUẤT SẮC" ? "badge-cyan" :
                              row.grade === "TỐT" ? "badge-purple" :
                              row.grade === "KHÁ" ? "badge-active" :
                              row.grade === "TRUNG BÌNH" ? "badge-warning" : "badge-danger"
                            }`}>
                              {row.grade}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => startDbRowEdit(row)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => deleteDbRowDirect(`${row.studentId}_${row.periodId}`)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 3. Table Activities */}
                {dbSelectedCollection === "activities" && (
                  <>
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Tên hoạt động</th>
                        <th>Đơn vị tổ chức</th>
                        <th>Tiêu chí ĐRL</th>
                        <th>Điểm cộng</th>
                        <th>Thời gian</th>
                        <th>Địa điểm</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredDbRows as ExtracurricularActivity[]).map(row => (
                        <tr key={row.id}>
                          <td style={{ fontFamily: 'monospace' }}>{row.id}</td>
                          <td style={{ color: "#fff", fontWeight: 700 }}>{row.title}</td>
                          <td>{row.orgName || row.orgId}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.criteriaId}</td>
                          <td style={{ fontFamily: 'monospace', color: "var(--success)", fontWeight: 700 }}>+{row.points}đ</td>
                          <td>{row.dateTime}</td>
                          <td>{row.location}</td>
                          <td>
                            <span className={`badge ${
                              row.status === "COMPLETED" ? "badge-active" :
                              row.status === "ONGOING" ? "badge-warning" : "badge-cyan"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => startDbRowEdit(row)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => deleteDbRowDirect(row.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 4. Table Evidence Submissions */}
                {dbSelectedCollection === "evidence" && (
                  <>
                    <thead>
                      <tr>
                        <th>Tên sinh viên</th>
                        <th>Lớp</th>
                        <th>Tiêu chí</th>
                        <th>Tên hoạt động</th>
                        <th>Mô tả chi tiết</th>
                        <th>Điểm yêu cầu</th>
                        <th>Giấy xác nhận</th>
                        <th>Ngày nộp</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "right" }}>Thao tác phê duyệt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredDbRows as EvidenceSubmission[]).map(row => (
                        <tr key={row.id}>
                          <td style={{ color: "#fff", fontWeight: 700 }}>{row.studentName}</td>
                          <td>{row.classId}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.criteriaId}</td>
                          <td style={{ fontWeight: 600 }}>{row.activityName}</td>
                          <td style={{ fontSize: "11px", maxWidth: "200px" }}>{row.description}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, color: "var(--accent-cyan)" }}>+{row.pointsRequested}đ</td>
                          <td style={{ fontFamily: 'monospace', fontSize: "11px" }}>{row.proofUrl}</td>
                          <td>{row.submittedAt}</td>
                          <td>
                            <span className={`badge ${
                              row.status === "APPROVED" ? "badge-active" :
                              row.status === "REJECTED" ? "badge-danger" : "badge-warning"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              {row.status === "PENDING" && (
                                <>
                                  <button className="btn-neon-cyan" style={{ padding: "4px 8px", background: "rgba(16, 185, 129, 0.1)", borderColor: "var(--success)", color: "var(--success)" }} onClick={() => reviewEvidenceDirect(row.id, "APPROVED")}>
                                    Duyệt
                                  </button>
                                  <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => reviewEvidenceDirect(row.id, "REJECTED")}>
                                    Từ chối
                                  </button>
                                </>
                              )}
                              <button className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => startDbRowEdit(row)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => deleteDbRowDirect(row.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 5. Table Club Members */}
                {dbSelectedCollection === "members" && (
                  <>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Tên lớp</th>
                        <th>Mã tổ chức</th>
                        <th>Chức vụ</th>
                        <th>Ngày gia nhập</th>
                        <th>Nhiệm kỳ</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredDbRows as OrganizationMember[]).map(row => (
                        <tr key={row.id}>
                          <td style={{ fontFamily: 'monospace' }}>{row.studentId}</td>
                          <td>{row.classId}</td>
                          <td style={{ fontFamily: 'monospace', color: "var(--accent-purple)" }}>{row.orgId}</td>
                          <td style={{ fontWeight: 700 }}>{row.role}</td>
                          <td>{row.joinedDate}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.term}</td>
                          <td>
                            <span className={`badge ${
                              row.status === "ACTIVE" ? "badge-active" : "badge-warning"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => startDbRowEdit(row)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => deleteDbRowDirect(row.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* 6. Table Schedules */}
                {dbSelectedCollection === "schedules" && (
                  <>
                    <thead>
                      <tr>
                        <th>Lớp</th>
                        <th>Học phần</th>
                        <th>Giảng viên</th>
                        <th>Thứ</th>
                        <th>Tiết bắt đầu</th>
                        <th>Tiết kết thúc</th>
                        <th>Phòng học</th>
                        <th>Hình thức học</th>
                        <th style={{ textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredDbRows as ScheduleSlot[]).map(row => (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 700 }}>{row.classId}</td>
                          <td style={{ color: "#fff", fontWeight: 700 }}>{row.subjectName}</td>
                          <td>{row.teacherName}</td>
                          <td style={{ fontFamily: 'monospace' }}>Thứ {row.dayOfWeek}</td>
                          <td style={{ fontFamily: 'monospace' }}>Tiết {row.periodStart}</td>
                          <td style={{ fontFamily: 'monospace' }}>Tiết {row.periodEnd}</td>
                          <td style={{ fontFamily: 'monospace', color: "var(--accent-cyan)" }}>{row.room}</td>
                          <td>{row.studyMode || "Trực tiếp"}</td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => startDbRowEdit(row)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-solid-danger" style={{ padding: "4px 8px" }} onClick={() => deleteDbRowDirect(row.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB: RULES ENGINE ================= */}
        {activeTab === "RULES" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 800 }}>Cấu hình quy chế chấm ĐRL</h1>
                <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Điều chỉnh trực tiếp khung trọng số điểm, hệ thống tự động tính lại điểm rèn luyện thời gian thực.</p>
              </div>

              <button className="btn-neon-purple" onClick={runScoreRecalculation}>
                <RefreshCw size={16} />
                Tính toán lại điểm toàn trường
              </button>
            </div>

            {/* List point criteria categories */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {criteria.map((crit) => (
                <div key={crit.id} className="glass-card">
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-normal)", paddingBottom: "12px", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: "var(--accent-cyan)" }}>
                        {crit.id}: {crit.category}
                      </h3>
                      <p style={{ margin: "0", fontSize: "12px", color: "var(--text-muted)" }}>{crit.description}</p>
                    </div>
                    <span className="badge badge-purple" style={{ height: "fit-content" }}>Điểm tối đa: {crit.maxScore}đ</span>
                  </div>

                  {/* Rules items list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {crit.rules.map((rule) => (
                      <div key={rule.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                        <div>
                          <strong style={{ display: "block", fontSize: "13px", color: "#E5E7EB", fontFamily: 'monospace' }}>{rule.id}: {rule.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{rule.description}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <input 
                            type="number" 
                            className="input-dark" 
                            style={{ width: "80px", textAlign: "center", padding: "6px" }}
                            defaultValue={rule.points}
                            onBlur={(e) => updateRulePoints(crit.id, rule.id, Number(e.target.value))}
                          />
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", width: "30px" }}>Điểm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: TOOLS (SYSTEM) ================= */}
        {activeTab === "TOOLS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 800 }}>Công cụ hạt nhân</h1>
              <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Các công cụ chuyên sâu dành cho nhà phát triển hệ thống và xử lý cơ sở dữ liệu khẩn cấp.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              {/* Reset to Seeds Card */}
              <div className="glass-card" style={{ borderTop: "4px solid var(--accent-purple)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700, color: "var(--accent-purple)" }}>Khôi phục Dữ liệu mẫu (Reset to Seeds)</h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Xóa sạch toàn bộ các bản ghi trong tất cả các bộ sưu tập Firestore (Sinh viên, Điểm rèn luyện, Tài khoản...) và ghi đè lại dữ liệu mẫu gốc từ tệp `data.ts`.
                  </p>
                </div>
                <button className="btn-neon-purple" onClick={resetDatabaseToSeeds} style={{ alignSelf: "flex-start" }}>
                  Chạy hạt nhân Reset to Seeds
                </button>
              </div>

              {/* Wipe Out Database Card */}
              <div className="glass-card" style={{ borderTop: "4px solid var(--danger)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700, color: "var(--danger)" }}>Xóa sạch dữ liệu (Wipe Database)</h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Dọn dẹp trống toàn bộ cơ sở dữ liệu để đưa ứng dụng vào hoạt động thực tế. Tài khoản Super Admin mặc định vẫn sẽ được tạo lại để tránh mất quyền đăng nhập.
                  </p>
                </div>
                <button className="btn-solid-danger" onClick={wipeAllDatabase} style={{ alignSelf: "flex-start" }}>
                  Hủy diệt toàn bộ dữ liệu thô
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: FEEDBACK (SYSTEM) ================= */}
        {activeTab === "FEEDBACK" && (() => {
          // Compute filtered feedbacks inside an IIFE to keep it isolated
          const filteredFeedbacks = systemFeedbacks.filter(fb => {
            const matchesSearch = 
              fb.title.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
              fb.content.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
              fb.userName.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
              fb.userId.toLowerCase().includes(feedbackSearch.toLowerCase());
            
            const matchesRole = feedbackRoleFilter === "ALL" || fb.userRole === feedbackRoleFilter;
            const matchesCategory = feedbackCategoryFilter === "ALL" || fb.category === feedbackCategoryFilter;
            
            return matchesSearch && matchesRole && matchesCategory;
          });

          // Category stats breakdown
          const bugCount = systemFeedbacks.filter(f => f.category === "Báo lỗi").length;
          const uiCount = systemFeedbacks.filter(f => f.category === "Giao diện").length;
          const featureCount = systemFeedbacks.filter(f => f.category === "Tính năng").length;
          const otherCount = systemFeedbacks.filter(f => f.category === "Khác").length;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 800 }}>Hòm thư góp ý hệ thống</h1>
                  <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>Xem và quản lý các đóng góp ý kiến để hoàn thiện tính năng của hệ thống UniHub.</p>
                </div>
                {systemFeedbacks.length > 0 && (
                  <button 
                    className="btn-solid-danger" 
                    onClick={() => setShowBulkConfirmModal(true)}
                    style={{ fontSize: "12px", padding: "10px 16px" }}
                  >
                    Xóa sạch hòm thư ({systemFeedbacks.length})
                  </button>
                )}
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Tổng số góp ý</span>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-cyan)" }}>{systemFeedbacks.length} thư</span>
                </div>
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "4px", borderLeft: "3px solid var(--danger)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Báo lỗi hệ thống (Bug)</span>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--danger)" }}>{bugCount} thư</span>
                </div>
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "4px", borderLeft: "3px solid var(--accent-purple)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Đề xuất tính năng</span>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-purple)" }}>{featureCount} thư</span>
                </div>
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "4px", borderLeft: "3px solid #3b82f6" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Cải tiến giao diện</span>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#3b82f6" }}>{uiCount} thư</span>
                </div>
              </div>

              {/* Filter controls */}
              <div className="glass-card" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", padding: "16px" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mã SV, tiêu đề..."
                    className="input-dark"
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Phân loại</span>
                    <select
                      className="select-dark"
                      value={feedbackCategoryFilter}
                      onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                      style={{ minWidth: "140px" }}
                    >
                      <option value="ALL">Tất cả phân loại</option>
                      <option value="Giao diện">Giao diện (UI/UX)</option>
                      <option value="Tính năng">Tính năng mới</option>
                      <option value="Báo lỗi">Báo lỗi (Bug)</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Vai trò</span>
                    <select
                      className="select-dark"
                      value={feedbackRoleFilter}
                      onChange={(e) => setFeedbackRoleFilter(e.target.value)}
                      style={{ minWidth: "160px" }}
                    >
                      <option value="ALL">Tất cả vai trò</option>
                      <option value={UserRole.STUDENT}>Sinh viên</option>
                      <option value={UserRole.CLASS_MONITOR}>Ban cán sự</option>
                      <option value={UserRole.ADVISER}>Cố vấn (GVCN)</option>
                      <option value={UserRole.FACULTY}>Văn phòng Khoa</option>
                      <option value={UserRole.TRAINING_DEPT}>Phòng Đào tạo</option>
                      <option value={UserRole.ORGANIZER}>CLB / Đoàn Hội</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feedbacks Grid */}
              {filteredFeedbacks.length === 0 ? (
                <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                  <span>Không tìm thấy thư góp ý nào phù hợp với bộ lọc hiện tại.</span>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                  {filteredFeedbacks.map((fb) => {
                    const badgeBg = fb.category === "Báo lỗi" ? "rgba(239, 68, 68, 0.15)" :
                                    fb.category === "Tính năng" ? "rgba(168, 85, 247, 0.15)" :
                                    fb.category === "Giao diện" ? "rgba(59, 130, 246, 0.15)" : "rgba(148, 163, 184, 0.15)";
                    const badgeText = fb.category === "Báo lỗi" ? "var(--danger)" :
                                      fb.category === "Tính năng" ? "var(--accent-purple)" :
                                      fb.category === "Giao diện" ? "var(--accent-cyan)" : "var(--text-muted)";

                    const roleText = fb.userRole === UserRole.STUDENT ? "Sinh viên" :
                                     fb.userRole === UserRole.CLASS_MONITOR ? "Ban cán sự" :
                                     fb.userRole === UserRole.ADVISER ? "Cố vấn (GVCN)" :
                                     fb.userRole === UserRole.FACULTY ? "Khoa" :
                                     fb.userRole === UserRole.TRAINING_DEPT ? "Phòng Đào tạo" :
                                     fb.userRole === UserRole.ORGANIZER ? "CLB / Đoàn Hội" : "Admin";

                    return (
                      <div key={fb.id} className="glass-card animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px", position: "relative" }}>
                        
                        {/* Header of Card */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ 
                              fontSize: "10px", 
                              fontWeight: 900, 
                              textTransform: "uppercase", 
                              padding: "4px 10px", 
                              borderRadius: "6px", 
                              background: badgeBg, 
                              color: badgeText, 
                              border: `1px solid ${badgeText}33` 
                            }}>
                              {fb.category}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              {new Date(fb.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <button 
                            className="btn-solid-danger" 
                            style={{ padding: "6px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)" }}
                            onClick={() => handleDeleteFeedback(fb.id)}
                            title="Xóa thư này"
                          >
                            <Trash2 size={14} style={{ color: "var(--danger)" }} />
                          </button>
                        </div>

                        {/* Title & Content */}
                        <div style={{ borderBottom: "1px solid var(--border-normal)", paddingBottom: "14px" }}>
                          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 800, color: "var(--text-bright)" }}>{fb.title}</h3>
                          <p style={{ margin: "0", fontSize: "13px", color: "var(--text-bright)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {fb.content}
                          </p>
                        </div>

                        {/* Sender Info Footer */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={{ color: "var(--text-bright)", fontWeight: 700 }}>{fb.userName}</span>
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--text-muted)" }}></span>
                            <span style={{ fontFamily: "monospace" }}>{fb.userId}</span>
                          </div>
                          <div>
                            <span style={{ 
                              fontSize: "10px", 
                              fontWeight: 800, 
                              padding: "3px 8px", 
                              background: "rgba(255,255,255,0.05)", 
                              borderRadius: "4px", 
                              color: "var(--text-muted)", 
                              border: "1px solid var(--border-normal)" 
                            }}>
                              {roleText}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB: THEME CUSTOMIZATION ================= */}
        {activeTab === "THEME" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "28px", fontWeight: 800 }}>Cấu hình ảnh & giao diện</h1>
              <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "14px" }}>
                Thay đổi logo, hình nền đăng nhập, và tiêu đề hiển thị ở dự án UniHub chính.
              </p>
            </div>

            <form onSubmit={handleSaveThemeConfig} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
              {/* Left Column: Form settings */}
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h3 style={{ margin: "0 0 8px 0", borderBottom: "1px solid var(--border-normal)", paddingBottom: "10px", fontSize: "18px", color: "var(--accent-cyan)" }}>
                  Thông số cấu hình
                </h3>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600 }}>
                    Tiêu đề Cổng thông tin (Login Title)
                  </label>
                  <input 
                    type="text" 
                    className="input-dark" 
                    value={themeConfig.loginTitle || ""} 
                    onChange={(e) => setThemeConfig({ ...themeConfig, loginTitle: e.target.value })}
                    placeholder="e.g. CỔNG THÔNG TIN UNIHUBHG"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600 }}>
                    Dòng mô tả (Login Subtitle)
                  </label>
                  <textarea 
                    className="input-dark" 
                    style={{ minHeight: "60px", resize: "vertical", fontFamily: "inherit" }}
                    value={themeConfig.loginSubtitle || ""} 
                    onChange={(e) => setThemeConfig({ ...themeConfig, loginSubtitle: e.target.value })}
                    placeholder="Nhập dòng chữ chào mừng phía dưới tiêu đề..."
                  />
                </div>

                {/* Logo Customization section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--border-normal)", paddingBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", color: "#fff", fontWeight: 700 }}>
                    1. Logo hệ thống (Logo Image)
                  </label>
                  <p style={{ margin: "0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Tải ảnh lên trực tiếp từ máy tính của bạn (tự động nén và tối ưu hóa):
                  </p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "12px", border: "1px dashed var(--accent-cyan)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
                      {themeConfig.logoUrl ? (
                        <img src={themeConfig.logoUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Mặc định</span>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input 
                        type="file" 
                        id="logo-file-input" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        style={{ display: "none" }} 
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <label 
                          htmlFor="logo-file-input" 
                          className="btn-neon-cyan" 
                          style={{ cursor: "pointer", fontSize: "12px", padding: "8px 14px", display: "inline-flex" }}
                        >
                          Tải ảnh lên...
                        </label>
                        {themeConfig.logoUrl && (
                          <button 
                            type="button" 
                            className="btn-solid-danger" 
                            style={{ padding: "8px 12px", fontSize: "12px" }}
                            onClick={() => setThemeConfig({ ...themeConfig, logoUrl: "" })}
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Hỗ trợ JPG, PNG. Khuyên dùng ảnh vuông nền trong suốt.</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>Hoặc sử dụng Link URL:</label>
                    <input 
                      type="text" 
                      className="input-dark" 
                      style={{ fontSize: "12px", padding: "8px" }}
                      value={themeConfig.logoUrl || ""} 
                      onChange={(e) => setThemeConfig({ ...themeConfig, logoUrl: e.target.value })}
                      placeholder="e.g. https://domain.com/logo.png (Để trống để dùng logo mặc định)"
                    />
                  </div>
                </div>

                {/* Background images gallery section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border-normal)", paddingBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ display: "block", fontSize: "14px", color: "#fff", fontWeight: 700 }}>
                      2. Danh sách ảnh nền (Slider / Carousel)
                    </label>
                    <span style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: 600 }}>
                      {(themeConfig.loginBgUrls?.length || (themeConfig.loginBgUrl ? 1 : 0))} / 8 ảnh
                    </span>
                  </div>
                  <p style={{ margin: "0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Tải lên nhiều ảnh từ máy tính để tự động chạy slide chuyển ảnh. Hỗ trợ tự động căn chỉnh (fit) hoàn hảo trên Android, iOS, Windows, macOS.
                  </p>

                  {/* Image Grid / Gallery */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "10px", marginTop: "6px" }}>
                    {(themeConfig.loginBgUrls && themeConfig.loginBgUrls.length > 0 
                      ? themeConfig.loginBgUrls 
                      : (themeConfig.loginBgUrl ? [themeConfig.loginBgUrl] : [])
                    ).map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "100%", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-normal)", background: "#000" }}>
                        <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => removeBgImage(idx)}
                          style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(225, 29, 72, 0.9)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}
                          title="Xóa ảnh này"
                        >
                          ✕
                        </button>
                        <span style={{ position: "absolute", bottom: "2px", left: "4px", fontSize: "9px", background: "rgba(0,0,0,0.6)", padding: "1px 4px", borderRadius: "4px", color: "#fff" }}>
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                    <input 
                      type="file" 
                      id="bg-file-input" 
                      accept="image/*" 
                      multiple
                      onChange={handleBgUpload} 
                      style={{ display: "none" }} 
                    />
                    <label 
                      htmlFor="bg-file-input" 
                      className="btn-neon-cyan" 
                      style={{ cursor: "pointer", fontSize: "12px", padding: "8px 14px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                    >
                      <Image size={14} />
                      <span>Tải thêm ảnh từ máy tính (chọn 1 hoặc nhiều)...</span>
                    </label>
                    
                    {((themeConfig.loginBgUrls && themeConfig.loginBgUrls.length > 0) || themeConfig.loginBgUrl) && (
                      <button
                        type="button"
                        className="btn-solid-danger"
                        style={{ padding: "8px 14px", fontSize: "12px" }}
                        onClick={() => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa tất cả ảnh nền hiện tại để tải ảnh mới nhẹ hơn không?")) {
                            setThemeConfig({ ...themeConfig, loginBgUrl: "", loginBgUrls: [] });
                          }
                        }}
                      >
                        Xóa tất cả ảnh nền
                      </button>
                    )}
                  </div>
                </div>

                {/* Slider Interval timing setting */}
                <div style={{ borderBottom: "1px solid var(--border-normal)", paddingBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                      Thời gian chuyển slide ảnh tự động (giây)
                    </label>
                    <span style={{ fontSize: "13px", color: "var(--accent-cyan)", fontWeight: 800 }}>
                      {themeConfig.bgTransitionInterval || 5} giây / ảnh
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="15" 
                    step="1"
                    style={{ width: "100%", accentColor: "var(--accent-cyan)" }}
                    value={themeConfig.bgTransitionInterval || 5} 
                    onChange={(e) => setThemeConfig({ ...themeConfig, bgTransitionInterval: parseInt(e.target.value, 10) })}
                  />
                  <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "var(--text-muted)" }}>
                    Ảnh nền sẽ tự động trượt chuyển động sang trái sau khoảng thời gian này.
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                      Độ mờ lớp phủ nền (Background Overlay Opacity)
                    </label>
                    <span style={{ fontSize: "12px", color: "var(--accent-cyan)", fontWeight: 700 }}>
                      {Math.round((themeConfig.bgOverlayOpacity ?? 0.75) * 100)}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    style={{ width: "100%", accentColor: "var(--accent-cyan)" }}
                    value={themeConfig.bgOverlayOpacity ?? 0.75} 
                    onChange={(e) => setThemeConfig({ ...themeConfig, bgOverlayOpacity: parseFloat(e.target.value) })}
                  />
                </div>

                <div style={{ marginTop: "12px" }}>
                  <button type="submit" className="btn-neon-cyan" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
                    <Check size={18} />
                    <span>Lưu cấu hình giao diện</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Presets & Live Preview */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Presets Card */}
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ margin: "0", fontSize: "16px", color: "var(--accent-cyan)", fontWeight: 700 }}>
                    Hình nền mẫu gợi ý (Presets)
                  </h3>
                  <p style={{ margin: "0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Nhấn chọn nhanh một trong các hình nền chất lượng cao dưới đây để áp dụng làm hình nền:
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {[
                      { name: "Phân hiệu HG Campus", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop" },
                      { name: "Khuôn viên Đại học", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop" },
                      { name: "Thư viện tri thức", url: "https://images.unsplash.com/photo-1507842237319-9871f54972e7?q=80&w=1000&auto=format&fit=crop" },
                      { name: "Gradient trừu tượng", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" },
                      { name: "Thiên nhiên Hà Giang", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop" },
                      { name: "Reset mặc định", url: "" }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn-neon-purple"
                        style={{ padding: "8px", fontSize: "11px", justifyContent: "center" }}
                        onClick={() => {
                          if (p.url) {
                            addBgUrlToList(p.url);
                          } else {
                            setThemeConfig({ ...themeConfig, loginBgUrl: "", loginBgUrls: [] });
                          }
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mini Preview Box */}
                <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h3 style={{ margin: "0", fontSize: "16px", color: "var(--accent-cyan)", fontWeight: 700 }}>
                    Xem trước nhanh (Live Preview)
                  </h3>
                  <div 
                    style={{ 
                      height: "220px", 
                      borderRadius: "12px", 
                      border: "1px solid var(--border-normal)", 
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundImage: themeConfig.loginBgUrl ? `url(${themeConfig.loginBgUrl})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: themeConfig.loginBgUrl ? "transparent" : "#080c14",
                      transition: "all 0.3s ease"
                    }}
                  >
                    {/* Simulated Overlay */}
                    {themeConfig.loginBgUrl && (
                      <div 
                        style={{ 
                          position: "absolute", 
                          inset: 0, 
                          backgroundColor: "#020617", 
                          opacity: themeConfig.bgOverlayOpacity ?? 0.75,
                          zIndex: 1
                        }} 
                      />
                    )}

                    {/* Simulated login card content */}
                    <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "16px", color: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid rgba(255,255,255,0.4)" }}>
                          {themeConfig.logoUrl ? (
                            <img src={themeConfig.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                          ) : (
                            <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#0c529c", margin: "auto" }}></div>
                          )}
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--accent-cyan)" }}>TNU HGC</span>
                      </div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: 900 }}>
                        {themeConfig.loginTitle || "CỔNG THÔNG TIN UNIHUBHG"}
                      </h4>
                      <p style={{ margin: "0", fontSize: "9px", color: "#94a3b8", maxWidth: "260px" }}>
                        {themeConfig.loginSubtitle || "Chào mừng bạn đến với Phân hiệu ĐHTN tại Hà Giang..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ================= MODAL: USER DETAILS (ADD/EDIT) ================= */}
      {showUserModal && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={saveUser}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}</h3>
              <button type="button" className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => setShowUserModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Họ và tên</label>
                <input 
                  type="text" 
                  className="input-dark" 
                  value={userForm.name} 
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Tên tài khoản (Email đăng nhập)</label>
                <input 
                  type="text" 
                  className="input-dark" 
                  value={userForm.username} 
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Vai trò người dùng</label>
                  <select 
                    className="select-dark"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  >
                    <option value={UserRole.STUDENT}>Sinh viên</option>
                    <option value={UserRole.GROUP_LEADER}>Tổ trưởng</option>
                    <option value={UserRole.CLASS_MONITOR}>Lớp trưởng (BCS)</option>
                    <option value={UserRole.ADVISER}>Giảng viên Cố vấn (GVCN)</option>
                    <option value={UserRole.ORGANIZER}>CLB / Đoàn / Hội</option>
                    <option value={UserRole.FACULTY}>Văn phòng Khoa</option>
                    <option value={UserRole.TRAINING_DEPT}>Phòng Đào tạo</option>
                    <option value={UserRole.ADMIN}>Phòng CTHSSV (Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Mật khẩu đăng nhập</label>
                  <input 
                    type="text" 
                    className="input-dark" 
                    value={userForm.password} 
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} 
                    placeholder="Bắt buộc nhập..."
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Mã liên kết (Mã SV / Mã Lớp / Mã CLB nếu có)</label>
                <input 
                  type="text" 
                  className="input-dark" 
                  value={userForm.targetId} 
                  onChange={(e) => setUserForm({ ...userForm, targetId: e.target.value })} 
                />
              </div>

              {userForm.role === UserRole.CLASS_MONITOR && (
                <div style={{ marginTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Chức danh Ban cán sự</label>
                  <select 
                    className="select-dark"
                    value={userForm.monitorTitle || "Lớp trưởng"}
                    onChange={(e) => setUserForm({ ...userForm, monitorTitle: e.target.value })}
                  >
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Bí thư Đoàn">Bí thư Đoàn</option>
                    <option value="Ban cán sự (Khác)">Ban cán sự (Khác)</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px", borderTop: "1px solid var(--border-normal)", paddingTop: "16px" }}>
              <button type="button" className="btn-solid-danger" style={{ padding: "8px 16px" }} onClick={() => setShowUserModal(false)}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-neon-cyan">
                Lưu tài khoản
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: DYNAMIC RAW DATABASE ROW EDITOR ================= */}
      {showDbEditModal && dbEditTarget && (
        <div className="modal-overlay">
          <form className="modal-container" onSubmit={saveDbRowEdit}>
            <div className="modal-header">
              <h3 className="modal-title">Sửa bản ghi dữ liệu thô: {dbEditTarget.id || dbEditTarget.studentId}</h3>
              <button type="button" className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => setShowDbEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "50vh", overflowY: "auto", paddingRight: "8px" }}>
              {Object.keys(dbEditTarget).map((key) => {
                if (key === "id" || key === "logs") {
                  return (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>{key} (Chỉ đọc)</label>
                      <input type="text" className="input-dark" value={key === "logs" ? "[Nhật ký cộng điểm rèn luyện]" : dbEditTarget[key]} readOnly style={{ opacity: 0.6 }} />
                    </div>
                  );
                }

                const valType = typeof dbEditTarget[key];
                if (valType === "object" && dbEditTarget[key] !== null) {
                  return null; // Skip deep nested objects for simplicity
                }

                return (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>{key}</label>
                    {valType === "boolean" ? (
                      <select 
                        className="select-dark"
                        value={String(dbEditTarget[key])}
                        onChange={(e) => setDbEditTarget({ ...dbEditTarget, [key]: e.target.value === "true" })}
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input 
                        type={valType === "number" ? "number" : "text"} 
                        className="input-dark" 
                        value={dbEditTarget[key] ?? ""} 
                        onChange={(e) => setDbEditTarget({ ...dbEditTarget, [key]: valType === "number" ? Number(e.target.value) : e.target.value })} 
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px", borderTop: "1px solid var(--border-normal)", paddingTop: "16px" }}>
              <button type="button" className="btn-solid-danger" style={{ padding: "8px 16px" }} onClick={() => setShowDbEditModal(false)}>
                Hủy bỏ
              </button>
              <button type="submit" className="btn-neon-cyan">
                Cập nhật bản ghi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: BULK DELETE FEEDBACK CONFIRMATION ================= */}
      {showBulkConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-container" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--danger)" }}>⚠️ CẢNH BÁO: Xóa hàng loạt</h3>
              <button type="button" className="btn-neon-cyan" style={{ padding: "4px 8px" }} onClick={() => setShowBulkConfirmModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <p style={{ margin: "0", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Hành động này sẽ **XÓA VĨNH VIỄN** tất cả các thư góp ý hiện có trên Firestore. Hành động này không thể hoàn tác!
              </p>
              
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase" }}>
                  Vui lòng nhập <strong style={{ color: "var(--danger)" }}>CONFIRM</strong> để xác nhận:
                </label>
                <input 
                  type="text" 
                  className="input-dark" 
                  placeholder="Gõ CONFIRM..."
                  value={feedbackBulkConfirmText} 
                  onChange={(e) => setFeedbackBulkConfirmText(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px", borderTop: "1px solid var(--border-normal)", paddingTop: "16px" }}>
              <button type="button" className="btn-neon-cyan" style={{ padding: "8px 16px" }} onClick={() => setShowBulkConfirmModal(false)}>
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="btn-solid-danger" 
                onClick={handleBulkDeleteFeedback}
                disabled={feedbackBulkConfirmText !== "CONFIRM"}
              >
                Xác nhận hủy diệt hòm thư
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
