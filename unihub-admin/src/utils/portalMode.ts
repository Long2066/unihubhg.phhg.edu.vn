import { UserRole } from "../types";

export type PortalMode = "STUDENT" | "STAFF";

export const STAFF_PORTAL_URL = "https://unihub-admin.vercel.app";
export const STUDENT_PORTAL_URL = "https://unihubhg.vercel.app";

/**
 * Detect current portal stream:
 * - "STAFF" on unihub-admin.vercel.app, unihubhg-ad.vercel.app, port 4001, or VITE_PORTAL_MODE="STAFF"
 * - "STUDENT" on unihubhg.vercel.app, unihubhg.phhg.edu.vn, port 4000, or default
 */
export const getPortalMode = (): PortalMode => {
  const envMode = (import.meta as any)?.env?.VITE_PORTAL_MODE;
  if (envMode === "STAFF") return "STAFF";
  if (envMode === "STUDENT") return "STUDENT";

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const port = window.location.port;
    if (
      host.includes("unihub-admin") ||
      host.includes("unihubhg-ad") || 
      host.includes("admin-") || 
      host.includes("canbo") || 
      port === "4001"
    ) {
      return "STAFF";
    }
  }

  return "STUDENT";
};

export const isStaffPortal = (): boolean => getPortalMode() === "STAFF";
export const isStudentPortal = (): boolean => getPortalMode() === "STUDENT";

/**
 * Roles permitted in Student Portal stream
 * - Sinh viên & Ban cán sự lớp
 * - Admin tối cao (Master Bypass): được phép vào cả 2 cổng để thanh tra & cứu hộ
 */
export const isRoleAllowedInStudentPortal = (role?: UserRole | string): boolean => {
  if (!role) return false;
  if (role === UserRole.ADMIN) return true; // Đặc quyền Admin tối cao
  return role === UserRole.STUDENT || role === UserRole.CLASS_MONITOR;
};

/**
 * Roles permitted in Staff & Organization Portal stream
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
