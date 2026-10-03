import { UserRole } from "../types";

export interface TabRouteConfig {
  slug: string;
  title: string;
}

export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  [UserRole.STUDENT]: "/sinh-vien",
  [UserRole.GROUP_LEADER]: "/sinh-vien",
  [UserRole.CLASS_MONITOR]: "/ban-can-su",
  [UserRole.ADVISER]: "/co-van",
  [UserRole.FACULTY]: "/khoa",
  [UserRole.TEACHER]: "/giang-vien",
  [UserRole.TRAINING_DEPT]: "/dao-tao",
  [UserRole.ADMIN]: "/quan-tri",
  [UserRole.ORGANIZER]: "/to-chuc",
  [UserRole.CLUB_MANAGER]: "/to-chuc",
  [UserRole.YOUTH_UNION]: "/to-chuc",
  [UserRole.STUDENT_UNION]: "/to-chuc"
};

export const TAB_ROUTE_MAP: Record<string, TabRouteConfig> = {
  // STUDENT / GROUP_LEADER
  TRANG_CHU: { slug: "trang-chu", title: "Trang chủ" },
  THE_SINH_VIEN: { slug: "the-sinh-vien", title: "Thẻ sinh viên điện tử" },
  DIEM: { slug: "diem-so", title: "Kết quả học tập & Điểm rèn luyện" },
  DANG_KY_TIN_CHI: { slug: "dang-ky-tin-chi", title: "Đăng ký tín chỉ" },
  THOI_KHOA_BIEU: { slug: "thoi-khoa-bieu", title: "Thời khóa biểu tuần" },
  HOATDONG: { slug: "hoat-dong", title: "Sự kiện & Ngoại khóa" },
  CLB: { slug: "cau-lac-bo", title: "Không gian Câu lạc bộ" },
  MINHCHUNG: { slug: "minh-chung", title: "Minh chứng cộng điểm" },
  GIAM_SAT_SI_SO: { slug: "si-so", title: "Giám sát sĩ số" },

  // TRAINING_DEPT
  OVERVIEW: { slug: "tong-quan", title: "Tổng quan đào tạo" },
  IMPORT: { slug: "diem-hoc-ky", title: "Nạp & Tổng hợp điểm HK" },
  TEACHER_ASSIGNMENTS: { slug: "phan-cong-giang-day", title: "Phân công giảng dạy" },
  UNLOCK_REQUESTS: { slug: "mo-khoa-diem", title: "Duyệt mở khóa điểm" },
  GRADE_APPEALS: { slug: "phuc-khao", title: "Xử lý đơn phúc khảo" },
  IMPORT_CLASSES: { slug: "danh-sach-lop", title: "Nạp danh sách SV lớp mới" },
  LIST: { slug: "hoc-vu-sinh-vien", title: "Danh sách học vụ sinh viên" },
  XET_HOC_BONG: { slug: "xet-hoc-bong", title: "Xét học bổng khuyến khích" },

  // TEACHER
  TEACHER_GRADES: { slug: "nhap-diem", title: "Nhập & Nạp điểm học phần" },

  // ORGANIZER / CLB / DOAN / HOI
  DS_THANHVIEN: { slug: "thanh-vien", title: "Danh sách thành viên" },
  TAO_HOATDONG: { slug: "khai-bao-hoat-dong", title: "Khai báo hoạt động" },
  TAO_THONGBAO: { slug: "thong-bao", title: "Bảng thông báo" },
  QUANLY_DIEMDANH: { slug: "diem-danh", title: "Sổ điểm danh & Event" },
  EXT_SRC: { slug: "src", title: "CLB NCKH SRC" },

  // CLASS_MONITOR
  BCS_DIEMDANH: { slug: "diem-danh", title: "Giám sát sĩ số & Điểm danh" },
  BCS_DUYET_TO: { slug: "phe-duyet-to", title: "Phê duyệt Tổ" },
  BCS_THONG_KE: { slug: "thong-ke", title: "Thống kê chuyên cần" },
  BCS_CHIA_TO: { slug: "phan-to", title: "Phân Tổ & Cấp quyền" },
  BCS_XETDUYET: { slug: "xet-duyet", title: "Xét duyệt ĐRL & Minh chứng" },

  // ADVISER
  ADVISER_DUYETDEM: { slug: "xet-duyet", title: "Thống kê & Xét duyệt lớp" },
  ADVISER_MINHCHUNG: { slug: "minh-chung", title: "Minh chứng của lớp" },
  ADVISER_NOTIFICATIONS: { slug: "thong-bao", title: "Nhật ký sĩ số & Thư từ" },

  // FACULTY
  STAT: { slug: "theo-doi", title: "Theo dõi rèn luyện khoa" },
  LOCKS: { slug: "khoa-du-lieu", title: "Khóa dữ liệu & Ký duyệt" },
  EVENTS: { slug: "su-kien", title: "Phát động sự kiện & Cộng điểm" },

  // ADMIN
  CONFIG: { slug: "quy-che", title: "Cấu hình quy chế điểm" },
  PERIOD: { slug: "dot-danh-gia", title: "Quản lý đợt đánh giá" },
  STATIONS: { slug: "he-thong", title: "Động cơ hệ thống" },
  CLUBS: { slug: "cau-lac-bo", title: "Quản lý tài khoản CLB" }
};

export const getRouteForTab = (role?: UserRole | string, tabId?: string): string => {
  if (!role || !tabId) return "/";
  const prefix = ROLE_ROUTE_PREFIX[role as UserRole] || "/sinh-vien";
  const conf = TAB_ROUTE_MAP[tabId];
  if (!conf) return prefix;
  return `${prefix}/${conf.slug}`;
};

export const getTabFromPath = (role?: UserRole | string, pathname?: string): string | null => {
  if (!role || !pathname) return null;
  const prefix = ROLE_ROUTE_PREFIX[role as UserRole];
  if (!prefix) return null;

  const cleanPath = pathname.toLowerCase().replace(/\/+$/, "");
  const cleanPrefix = prefix.toLowerCase();

  // Root of role prefix
  if (cleanPath === cleanPrefix || cleanPath === `${cleanPrefix}/trang-chu` || cleanPath === `${cleanPrefix}/tong-quan`) {
    if (role === UserRole.STUDENT || role === UserRole.GROUP_LEADER) return "TRANG_CHU";
    if (role === UserRole.TRAINING_DEPT) return "OVERVIEW";
    if (role === UserRole.TEACHER) return "TEACHER_GRADES";
    if (role === UserRole.CLASS_MONITOR) return "TRANG_CHU";
    if (role === UserRole.ADVISER) return "ADVISER_DUYETDEM";
    if (role === UserRole.FACULTY) return "STAT";
    if (role === UserRole.ADMIN) return "CONFIG";
    return "DS_THANHVIEN";
  }

  if (cleanPath.startsWith(cleanPrefix + "/")) {
    const slug = cleanPath.slice(cleanPrefix.length + 1);
    for (const [tabId, conf] of Object.entries(TAB_ROUTE_MAP)) {
      if (conf.slug === slug) {
        return tabId;
      }
    }
  }

  // Direct short slug fallback
  const rootSlug = cleanPath.replace(/^\/+/, "");
  for (const [tabId, conf] of Object.entries(TAB_ROUTE_MAP)) {
    if (conf.slug === rootSlug) {
      return tabId;
    }
  }

  return null;
};

export const getPageTitle = (tabId?: string): string => {
  const baseTitle = "UniHub - Phân hiệu ĐH Thái Nguyên tại Hà Giang";
  if (!tabId) return baseTitle;
  const conf = TAB_ROUTE_MAP[tabId];
  return conf ? `${conf.title} | UniHub Phân hiệu Hà Giang` : baseTitle;
};
