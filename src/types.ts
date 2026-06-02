/**
 * Types & Interfaces for UniHub Rèn Luyện
 */

export enum UserRole {
  STUDENT = "STUDENT",                 // Sinh viên
  ORGANIZER = "ORGANIZER",             // CLB / Đoàn / Hội
  TRAINING_DEPT = "TRAINING_DEPT",     // Phòng Đào tạo
  CLASS_MONITOR = "CLASS_MONITOR",     // Ban cán sự Lớp (BCS)
  ADVISER = "ADVISER",                 // Giáo viên chủ nhiệm (GVCN)
  FACULTY = "FACULTY",                 // Văn phòng Khoa
  ADMIN = "ADMIN"                      // CTHSSV / Admin Hệ thống
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  targetId?: string; // Links to Student ID, Organization ID, Class ID, or Faculty ID if applicable
  password?: string;
}

export interface EvaluationPeriod {
  id: string;
  academicYear: string; // e.g., "2025-2026"
  semester: string;     // e.g., "Học kỳ II"
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "LOCKED";
}

export interface PointCriteria {
  id: string;
  category: string; // e.g. "Ý thức học tập", "Hoạt động Đoàn CLB"
  maxScore: number;
  description: string;
  rules: {
    id: string;
    name: string;
    points: number;
    description: string;
    type: "GPA" | "WARNING" | "ACTIVITY_MEMBER" | "ACTIVITY_LEADER" | "EXCEPTION" | "MANUAL" | "CLASS_MEETING";
  }[];
}

export interface Student {
  id: string;           // Mã sinh viên - e.g. "SV20CN01"
  name: string;
  classId: string;      // e.g. "K20-CNTT"
  facultyId: string;    // e.g. "K-CNTT"
  email: string;
  avatar?: string;
  gpa?: number;
  creditsEarned?: number;
  learningWarning?: boolean;
  learningStatus?: string; // "Bình thường", "Bị cảnh báo", "Đình chỉ"
  learningDataLocked?: boolean; // Tín chỉ GPA đã khóa từ phòng đào tạo
}

export interface Organization {
  id: string;           // Code - e.g. "UNITECH"
  name: string;
  type: "CLB" | "DOAN" | "HOI";
  leaderName: string;
  field: string;        // Lĩnh vực hoạt động
  level: "TRUONG" | "KHOA";
}

export interface OrganizationMember {
  id: string;
  studentId: string;
  classId: string;
  orgId: string;
  role: "CHỦ NHIỆM" | "BAN CHẤP HÀNH" | "ỦY VIÊN" | "THÀNH VIÊN";
  joinedDate: string;
  term: string; // Nhiệm kỳ: e.g. "2025-2026"
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  
  // Custom club membership attachment fields
  gender?: string;
  dob?: string;
  ethnicity?: string;
  email?: string;
  phone?: string;
  permanentAddress?: string;
  temporaryAddress?: string;
  major?: string;
  facultyInCharge?: string;
  studentName?: string;
  attachmentUrl?: string;
}

export interface ExtracurricularActivity {
  id: string;
  title: string;
  orgId: string; // Đơn vị tổ chức
  orgName: string;
  criteriaId: string; // Tiêu chí cộng điểm: e.g. "TC3.1"
  points: number;
  dateTime: string;
  location: string;
  description: string;
  registrationOpen: boolean;
  status: "UPCOMING" | "ONGOING" | "COMPLETED"; // Completed means attendance list has been verified
  imageUrl?: string;
}

export interface ActivityAttendance {
  id: string;
  activityId: string;
  studentId: string;
  studentName: string;
  classId: string;
  registeredAt: string;
  role: "MEM" | "BTC" | "SUPPORTER"; // Thành viên, Ban tổ chức, Hỗ trợ
  attended: boolean;
  verified: boolean; // Chốt danh sách có mặt hay chưa
}

export interface EvidenceSubmission {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  criteriaId: string; // e.g. "TC4.1"
  activityName: string; // Hoạt động ngoài hệ thống
  description: string;
  pointsRequested: number;
  proofUrl: string; // For mock, a text or simulated image
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewComment?: string;
}

export interface ClassReviewState {
  classId: string;
  representativeApproved: boolean; // BCS Lớp đã duyệt
  adviserApproved: boolean;        // GVCN đã duyệt
  facultyApproved?: boolean;       // KHOA đã duyệt
  adminApproved?: boolean;         // PCTHSSV/Phân hiệu đã duyệt
  adviserComment?: string;
  facultyComment?: string;
  adminComment?: string;
  representativeApprovedAt?: string;
  adviserApprovedAt?: string;
  facultyApprovedAt?: string;
  adminApprovedAt?: string;
}

export interface DailyAttendanceReport {
  id: string;
  classId: string;
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  absentees: {
    studentId: string;
    studentName: string;
    type: "PHÉP" | "KHÔNG_PHÉP";
    reason?: string;
  }[];
  reportedBy: string;
  reportedAt: string;
}

export interface ScoreFeedback {
  id: string;
  fromRole: UserRole;
  fromName: string;
  toClassId: string;
  studentId?: string;
  comment: string;
  createdAt: string;
  resolved: boolean;
}

export interface GroupEvaluationCriteria {
  id: string;
  name: string;
  minExcellentPercent: number; // Tỉ lệ Xuất sắc/Tốt tối thiểu
  maxWeakPercent: number;      // Tỉ lệ Yếu/Kém tối đa
  description: string;
}

export interface FacultyReviewState {
  facultyId: string;
  locked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface EvaluationResult {
  studentId: string;
  studentName: string;
  classId: string;
  facultyId: string;
  periodId: string;
  
  // Scores breakdowns
  studyPoints: number;        // TC1: Ý thức học tập (Max 20)
  violationPoints: number;    // TC2: Ý thức nội quy (Max 25 - starts at 25, subtract violations)
  extracurricularPoints: number; // TC3: Tham gia CLB/hoạt động (Max 30)
  communityPoints: number;    // TC4: Hoạt động xã hội, lớp (Max 15)
  achievementPoints: number;  // TC5: Chức vụ, khen thưởng (Max 10)
  
  totalPoints: number;        // Tổng điểm rèn luyện (Max 100)
  grade: "XUẤT SẮC" | "TỐT" | "KHÁ" | "TRUNG BÌNH" | "YẾU" | "KÉM";
  
  status: "AUTO" | "PENDING_CLASS" | "APPROVED_CLASS" | "APPROVED_ADVISER" | "LOCKED";
  adviserNotes?: string;
  
  // Traceability logs explaining how points are formulated
  logs: {
    criteriaId: string;
    points: number;
    reason: string;
    source: string; // "ĐÀO TẠO", "CLB_ATTENDANCE", "MINH_CHỨNG", "BCS_DUYỆT", "GV_ĐIỀU_CHỈNH"
    timestamp: string;
  }[];
}

export interface ClubAnnouncement {
  id: string;
  orgId: string;
  orgName: string;
  title: string;
  content: string;
  createdAt: string;
  expiryDate: string; // Customizable expiry date
  activityId?: string;
  imageUrl?: string;
}
