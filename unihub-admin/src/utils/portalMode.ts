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

    // 1. Cổng Admin tối cao
    if (host.includes("unihub-admin") || port === "4002") {
      return "ADMIN";
    }

    // 2. Cổng Cán bộ & Tổ chức
    if (
      host.includes("unihubhg-ad") || 
      host.includes("canbo") || 
      port === "4001"
    ) {
      return "STAFF";
    }

    // 3. Cổng Sinh viên
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
 * - Sinh viên, Ban cán sự lớp, Tổ trưởng
 * - Admin tối cao (Master Bypass): được phép vào cả 3 cổng để thanh tra & cứu hộ
 */
export const isRoleAllowedInStudentPortal = (role?: UserRole | string): boolean => {
  if (!role) return false;
  if (role === UserRole.ADMIN) return true; // Đặc quyền Admin tối cao
  return role === UserRole.STUDENT || role === UserRole.CLASS_MONITOR || role === UserRole.GROUP_LEADER;
};

/**
 * Roles permitted in Staff & Organization Portal stream (unihubhg-ad.vercel.app)
 * - Các phòng ban, khoa, giảng viên, CVHT, Đoàn - Hội - CLB
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
