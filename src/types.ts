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
  
  // New fields from training excel template
  gender?: string;         // Giới tính
  dob?: string;            // Ngày sinh
  pob?: string;            // Nơi sinh
  ethnicity?: string;      // Dân tộc
  idCard?: string;         // Số CCCD/CMND
  idCardDate?: string;     // Ngày cấp
  idCardPlace?: string;    // Nơi cấp
  subjects?: string;       // Học phần
  subjectGrades?: string;  // Điểm học phần
  gpa10?: number;          // Điểm hệ 10
  academicGrade?: string;  // Xếp loại học tập
  notes?: string;          // Ghi chú
  updatedAt?: string;      // Ngày cập nhật

  // 44 columns extension
  religion?: string;           // Tôn giáo
  nationality?: string;        // Quốc tịch
  bhyt?: string;               // Mã BHYT
  priorityObject?: string;     // Đối tượng ưu tiên
  priorityArea?: string;       // Khu vực ưu tiên
  phone?: string;              // Số điện thoại
  permanentAddress?: string;   // Địa chỉ thường trú
  permanentProvince?: string;  // Tỉnh/TP thường trú
  permanentWard?: string;      // Xã/Phường thường trú
  temporaryAddress?: string;   // Địa chỉ tạm trú
  
  // Gia đình
  fatherName?: string;         // Họ tên cha
  fatherJob?: string;          // Nghề nghiệp cha
  fatherPhone?: string;        // SĐT cha
  motherName?: string;         // Họ tên mẹ
  motherJob?: string;          // Nghề nghiệp mẹ
  motherPhone?: string;        // SĐT mẹ

  // Học tập & Quản lý vụ
  trainingSystem?: string;     // Hệ đào tạo
  trainingCourse?: string;     // Khóa đào tạo
  trainingMajor?: string;      // Ngành đào tạo
  specialization?: string;     // Chuyên ngành
  facultyInCharge?: string;    // Khoa/Đơn vị quản lý
  academicYears?: string;      // Niên khóa
  adviser?: string;            // Cố vấn học tập
  registeredSubjectsCount?: number; // Số học phần đã đăng ký
  creditClassesList?: string;  // Danh sách lớp tín chỉ
  enrollmentNotes?: string;    // Ghi chú đăng ký học
  accumulatedCredits?: number; // Tín chỉ đã tích lũy
  
  // Tài chính
  totalTuition?: number;       // Tổng học phí phải nộp
  paidTuition?: number;        // Học phí đã nộp
  debtTuition?: number;        // Học phí còn nợ
  paymentStatus?: string;      // Trạng thái thanh toán
}

export interface FieldMeta {
  key: keyof Student;
  label: string;
  category: "personal" | "family" | "education" | "finance" | "other";
  type: "text" | "number" | "select" | "date";
  options?: string[];
  readOnly?: boolean;
}

export const STUDENT_FIELDS_META: FieldMeta[] = [
  { key: "id", label: "Mã sinh viên", category: "personal", type: "text", readOnly: true },
  { key: "name", label: "Họ và tên", category: "personal", type: "text" },
  { key: "gender", label: "Giới tính", category: "personal", type: "select", options: ["Nam", "Nữ", "Khác"] },
  { key: "dob", label: "Ngày sinh", category: "personal", type: "date" },
  { key: "pob", label: "Nơi sinh", category: "personal", type: "text" },
  { key: "ethnicity", label: "Dân tộc", category: "personal", type: "text" },
  { key: "religion", label: "Tôn giáo", category: "personal", type: "text" },
  { key: "nationality", label: "Quốc tịch", category: "personal", type: "text" },
  { key: "idCard", label: "Số CCCD/CMND", category: "personal", type: "text" },
  { key: "idCardDate", label: "Ngày cấp CCCD/CMND", category: "personal", type: "date" },
  { key: "idCardPlace", label: "Nơi cấp CCCD/CMND", category: "personal", type: "text" },
  { key: "bhyt", label: "Mã BHYT", category: "personal", type: "text" },
  { key: "priorityObject", label: "Đối tượng ưu tiên", category: "personal", type: "text" },
  { key: "priorityArea", label: "Khu vực ưu tiên", category: "personal", type: "text" },
  { key: "email", label: "Email", category: "personal", type: "text" },
  { key: "phone", label: "Số điện thoại", category: "personal", type: "text" },
  { key: "permanentAddress", label: "Địa chỉ thường trú", category: "personal", type: "text" },
  { key: "permanentProvince", label: "Tỉnh/TP thường trú", category: "personal", type: "text" },
  { key: "permanentWard", label: "Xã/Phường thường trú", category: "personal", type: "text" },
  { key: "temporaryAddress", label: "Địa chỉ tạm trú", category: "personal", type: "text" },
  
  // Gia đình
  { key: "fatherName", label: "Họ tên cha", category: "family", type: "text" },
  { key: "fatherJob", label: "Nghề nghiệp cha", category: "family", type: "text" },
  { key: "fatherPhone", label: "SĐT cha", category: "family", type: "text" },
  { key: "motherName", label: "Họ tên mẹ", category: "family", type: "text" },
  { key: "motherJob", label: "Nghề nghiệp mẹ", category: "family", type: "text" },
  { key: "motherPhone", label: "SĐT mẹ", category: "family", type: "text" },
  
  // Đào tạo / Học vụ
  { key: "classId", label: "Lớp", category: "education", type: "text", readOnly: true },
  { key: "trainingSystem", label: "Hệ đào tạo", category: "education", type: "text" },
  { key: "trainingCourse", label: "Khóa đào tạo", category: "education", type: "text" },
  { key: "trainingMajor", label: "Ngành đào tạo", category: "education", type: "text" },
  { key: "specialization", label: "Chuyên ngành", category: "education", type: "text" },
  { key: "facultyInCharge", label: "Khoa/Đơn vị quản lý", category: "education", type: "text" },
  { key: "academicYears", label: "Niên khóa", category: "education", type: "text" },
  { key: "adviser", label: "Cố vấn học tập", category: "education", type: "text" },
  { key: "registeredSubjectsCount", label: "Số học phần đã đăng ký", category: "education", type: "number" },
  { key: "creditClassesList", label: "Danh sách lớp tín chỉ", category: "education", type: "text" },
  { key: "enrollmentNotes", label: "Ghi chú đăng ký học", category: "education", type: "text" },
  { key: "accumulatedCredits", label: "Tín chỉ đã tích lũy", category: "education", type: "number" },
  
  // Tài chính
  { key: "totalTuition", label: "Tổng học phí phải nộp", category: "finance", type: "number" },
  { key: "paidTuition", label: "Học phí đã nộp", category: "finance", type: "number" },
  { key: "debtTuition", label: "Học phí còn nợ", category: "finance", type: "number" },
  { key: "paymentStatus", label: "Trạng thái thanh toán", category: "finance", type: "text" },
  
  // Khác
  { key: "notes", label: "Ghi chú", category: "other", type: "text" },
  { key: "updatedAt", label: "Ngày cập nhật", category: "other", type: "text", readOnly: true }
];

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

export interface ScheduleSlot {
  id: string;            // Mã định danh duy nhất (UUID)
  classId: string;       // Lớp áp dụng (e.g. "K20-CNTT", "K2-GDTH-A")
  className?: string;    // Tên lớp (e.g. "K2 GDTH A")
  subjectName: string;   // Tên học phần (e.g. "CSTN&XH")
  subjectCode?: string;  // Mã học phần (e.g. "HKO4587520")
  credits?: number;      // Số tín chỉ (e.g. 2)
  teacherName: string;   // Tên giảng viên
  dayOfWeek: number;     // Thứ trong tuần (2: Thứ Hai, ..., 8: Chủ Nhật)
  session?: string;      // Buổi (Sáng/Chiều)
  periodStart: number;   // Tiết bắt đầu (e.g. 1)
  periodEnd: number;     // Tiết kết thúc (e.g. 3)
  room: string;          // Phòng học (e.g. "102B")
  semester: string;      // Học kỳ (e.g. "II")
  academicYear?: string; // Năm học (e.g. "2025-2026")
  studyMode?: string;    // Hình thức học (e.g. "Trực tiếp", "Online")
  colorHex?: string;     // Màu sắc đại diện hiển thị trên lịch tuần
}
