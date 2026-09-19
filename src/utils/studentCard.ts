import type { Student } from "../types";

export const STUDENT_CARD_TEMPLATE = "/the-sinh-vien-template.png";
export const STUDENT_CARD_DEFAULT_AVATAR = "/student-card-default-avatar.jpg";
export const STUDENT_VERIFICATION_PATH = "/xac-thuc-sinh-vien";

const FACULTY_NAMES: Record<string, string> = {
  "K-GDTH": "Khoa Sư phạm",
  "K-CNTT": "Khoa Công nghệ Thông tin",
  "K-KINHTE": "Khoa Kinh tế & Du lịch",
  "K-TA": "Khoa Ngoại ngữ",
  "K-MN": "Khoa Giáo dục Mầm non"
};

const safeTrim = (value?: unknown) => (value == null ? "" : String(value).trim());

export const formatStudentDob = (rawDob?: string) => {
  const value = safeTrim(rawDob);
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

export const formatFacultyName = (rawFaculty?: string) => {
  const value = safeTrim(rawFaculty);
  return FACULTY_NAMES[value] || value;
};

export const getStudentCardCourse = (student: Partial<Student>, cardClass = "") => {
  const classId = safeTrim(cardClass || student.classId);
  return safeTrim(student.academicYears) || safeTrim(student.trainingCourse) || (classId.startsWith("K2-") ? "2024 - 2028" : "");
};

export const getStudentMajor = (student: Partial<Student>) => (
  safeTrim(student.trainingMajor) ||
  safeTrim(student.specialization) ||
  formatFacultyName(safeTrim(student.facultyInCharge) || safeTrim(student.facultyId)) ||
  "Chưa cập nhật"
);

export const getAdmissionYear = (student: Partial<Student>, fallbackId = "") => {
  const academicYears = safeTrim(student.academicYears);
  const academicYearMatch = academicYears.match(/\b(20\d{2})\b/);
  if (academicYearMatch) return parseInt(academicYearMatch[1], 10);

  const trainingCourse = safeTrim(student.trainingCourse);
  const trainingYearMatch = trainingCourse.match(/\b(20\d{2})\b/);
  if (trainingYearMatch) return parseInt(trainingYearMatch[1], 10);

  const trainingKMatch = trainingCourse.match(/K(\d{1,2})/i);
  if (trainingKMatch) {
    const kNum = parseInt(trainingKMatch[1], 10);
    return kNum > 50 ? 1900 + kNum : 2000 + kNum;
  }

  const classId = safeTrim(student.classId);
  const classKMatch = classId.match(/K(\d{2})/i);
  if (classKMatch) return 2000 + parseInt(classKMatch[1], 10);
  if (classId.startsWith("K2-")) return 2024;

  const idStr = safeTrim(student.id || fallbackId);
  const idMatch = idStr.match(/(?:DTG|SV|K)?(\d{2})\d{4,}/i) || idStr.match(/[A-Z]{2,4}(\d{2})/i);
  if (idMatch) {
    const num = parseInt(idMatch[1], 10);
    if (num >= 15 && num <= 40) return 2000 + num;
  }

  return 2024;
};

export const getStudentCardValidity = (student: Partial<Student>, fallbackId = "") => {
  const admissionYear = getAdmissionYear(student, fallbackId);
  const startYear = admissionYear + 1;
  const expiryYear = startYear + 6;
  const expiryDate = new Date(expiryYear, 0, 31, 23, 59, 59, 999);
  const isExpired = Date.now() > expiryDate.getTime();

  return {
    admissionYear,
    startYear,
    expiryYear,
    startDateStr: `01/${String(startYear).slice(-2)}`,
    expiryDateStr: `01/${String(expiryYear).slice(-2)}`,
    expiryDisplay: `31/01/${expiryYear}`,
    studentStatus: isExpired ? "ĐÃ RA TRƯỜNG" : "ĐANG HỌC",
    cardStatus: isExpired ? "HẾT HIỆU LỰC" : "CÒN HIỆU LỰC",
    isExpired
  };
};

export const getStudentVerificationCode = (studentId?: string) => {
  const id = safeTrim(studentId);
  const digits = id.match(/\d/g)?.join("") || "";
  if (digits) return digits.length >= 2 ? digits.slice(-2) : digits.padStart(2, "0");
  return id.slice(-2).toUpperCase();
};

export const getStudentVerificationUrl = (studentId: string, origin?: string) => {
  const id = safeTrim(studentId);
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const params = new URLSearchParams({ mssv: id, code: getStudentVerificationCode(id) });
  return `${base}${STUDENT_VERIFICATION_PATH}?${params.toString()}`;
};
