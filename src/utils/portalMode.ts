import { UserRole } from "../types";

export type PortalMode = "STUDENT" | "STAFF" | "ADMIN";

export const STUDENT_PORTAL_URL = "https://unihubhg.vercel.app";
export const STAFF_PORTAL_URL = "https://unihubhg-ad.vercel.app";
export const ADMIN_PORTAL_URL = "https://unihub-admin.vercel.app";

/**
 * Detect current portal stream:
 * - "ADMIN" on unihub-admin.vercel.app, port 4002, or VITE_PORTAL_MODE="ADMIN"
 * - "STAFF" on unihubhg-ad.vercel.app, port 4001, or VITE_PORTAL_MODE="STAFF"
 * - "STUDENT" on unihubhg.vercel.app, unihubhg.phhg.edu.vn, port 4000, or default
 */
export const getPortalMode = (): PortalMode => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const port = window.location.port;
    const search = window.location.search.toLowerCase();

    // Cho phép query param ghi đè để kiểm thử / chuyển hướng an toàn: ?portal=staff hoặc ?portal=student
    if (search.includes("portal=staff") || search.includes("portal=canbo")) return "STAFF";
    if (search.includes("portal=student") || search.includes("portal=sinhvien")) return "STUDENT";
    if (search.includes("portal=admin")) return "ADMIN";

    // 1. Cổng Admin tối cao
    if (host.includes("unihub-admin") || port === "4002") {
      return "ADMIN";
    }

    // 2. Cổng Cán bộ & Tổ chức (unihubhg-ad.vercel.app hoặc preview nhánh cán bộ)
    if (
      host.includes("unihubhg-ad") || 
      host.includes("canbo") || 
      port === "4001"
    ) {
      return "STAFF";
    }

    // 3. Cổng Sinh viên (unihubhg.vercel.app, unihubhg.phhg.edu.vn, port 4000)
    if (host.includes("unihubhg") || host.includes("phhg.edu.vn") || port === "4000") {
      return "STUDENT";
    }
  }

  const envMode = (import.meta as any)?.env?.VITE_PORTAL_MODE;
  if (envMode === "ADMIN") return "ADMIN";
  if (envMode === "STAFF") return "STAFF";
  if (envMode === "STUDENT") return "STUDENT";

  return "STUDENT";
};

export const isStudentPortal = (): boolean => getPortalMode() === "STUDENT";
export const isStaffPortal = (): boolean => getPortalMode() === "STAFF";
export const isAdminPortal = (): boolean => getPortalMode() === "ADMIN";

/**
 * Roles permitted in Student Portal stream (unihubhg.vercel.app)
 * - DÀNH RIÊNG 100% CHO SINH VIÊN (và Tổ trưởng sinh viên)
 * - Admin tối cao (Master Bypass): được phép vào để thanh tra & cứu hộ kỹ thuật
 */
export const isRoleAllowedInStudentPortal = (role?: UserRole | string): boolean => {
  if (!role) return false;
  if (role === UserRole.ADMIN) return true; // Đặc quyền Admin tối cao
  return role === UserRole.STUDENT || role === UserRole.GROUP_LEADER;
};

/**
 * Roles permitted in Staff & Organization Portal stream (unihubhg-ad.vercel.app)
 * - Dành riêng cho toàn bộ cán bộ ngoài sinh viên:
 *   + Phòng Đào tạo, Văn phòng Khoa, Giảng viên bộ môn, Cố vấn học tập (CVHT)
 *   + Ban cán sự lớp (Lớp trưởng, Bí thư)
 *   + Tổ chức phong trào: Đoàn Thanh niên, Hội Sinh viên, Ban chủ nhiệm các CLB
 * - Admin tối cao (Master Bypass)
 */
export const isRoleAllowedInStaffPortal = (role?: UserRole | string): boolean => {
  if (!role) return false;
  return (
    role === UserRole.ADMIN ||
    role === UserRole.TRAINING_DEPT ||
    role === UserRole.FACULTY ||
    role === UserRole.TEACHER ||
    role === UserRole.ADVISER ||
    role === UserRole.CLASS_MONITOR ||
    role === UserRole.YOUTH_UNION ||
    role === UserRole.STUDENT_UNION ||
    role === UserRole.CLUB_MANAGER ||
    role === UserRole.ORGANIZER
  );
};

/**
 * Roles permitted in Super Admin Portal stream (unihub-admin.vercel.app)
 * - Dành riêng cho Super Admin / Phòng CTHSSV
 */
export const isRoleAllowedInAdminPortal = (role?: UserRole | string): boolean => {
  if (!role) return false;
  return role === UserRole.ADMIN;
};
