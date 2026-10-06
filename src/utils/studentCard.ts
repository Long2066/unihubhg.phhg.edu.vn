import type { Student } from "../types";

export const STUDENT_CARD_TEMPLATE = "/the-sinh-vien-template.png";
export const STUDENT_CARD_DEFAULT_AVATAR = "/student-card-default-avatar.jpg";
export const STUDENT_VERIFICATION_PATH = "/xac-thuc-sinh-vien";

const FACULTY_NAMES: Record<string, string> = {
  "K-GDTH": "Khoa Sư phạm",
  "GDTH": "Khoa Sư phạm",
  "KHOA SƯ PHẠM": "Khoa Sư phạm",
  "KHOA SU PHAM": "Khoa Sư phạm",
  "K-KHLN": "Khoa Khoa học Liên ngành",
  "KHLN": "Khoa Khoa học Liên ngành",
  "KHOA KHLN": "Khoa Khoa học Liên ngành",
  "KHOA LIÊN NGÀNH": "Khoa Khoa học Liên ngành",
  "KHOA LIEN NGANH": "Khoa Khoa học Liên ngành",
  "KHOA KHOA HỌC LIÊN NGÀNH": "Khoa Khoa học Liên ngành",
  "KHOA KHOA HOC LIEN NGANH": "Khoa Khoa học Liên ngành",
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
  if (!value) return "";
  return FACULTY_NAMES[value.toUpperCase()] || value;
};

export const getStudentCardCourse = (student: Partial<Student>, cardClass = "") => {
  const classId = safeTrim(cardClass || student.classId);
  return safeTrim(student.academicYears) || safeTrim(student.trainingCourse) || (classId.startsWith("K2-") ? "2024 - 2028" : "");
};

export const getStudentMajor = (student: Partial<Student>): string => {
  const explicit = safeTrim(student.trainingMajor) || safeTrim(student.specialization);
  if (explicit && !/^khoa\s+sư\s+phạm$/i.test(explicit) && !/^sư\s+phạm$/i.test(explicit)) {
    return explicit;
  }

  const classId = safeTrim(student.classId).toUpperCase();
  const facultyId = safeTrim(student.facultyInCharge || student.facultyId).toUpperCase();
  const id = safeTrim(student.id || (student as any)?.code).toUpperCase();

  if (classId.includes("GDTH") || facultyId === "K-GDTH" || id.startsWith("GDTH") || id.startsWith("DTG")) {
    return "Giáo dục Tiểu học";
  }
  if (classId.includes("GDMN") || classId.includes("MN") || facultyId === "K-MN") {
    return "Giáo dục Mầm non";
  }
  if (classId.includes("CNTT") || facultyId === "K-CNTT" || classId.includes("TIN")) {
    return "Công nghệ Thông tin";
  }
  if (classId.includes("TA") || classId.includes("SPTA") || facultyId === "K-TA" || classId.includes("ANH")) {
    return "Sư phạm Tiếng Anh";
  }
  if (classId.includes("DULICH") || classId.includes("QTDL") || facultyId === "K-KINHTE" || classId.includes("KTDL")) {
    return "Quản trị Dịch vụ Du lịch & Lữ hành";
  }
  if (classId.includes("NNTQ") || classId.includes("TRUNG")) {
    return "Ngôn ngữ Trung Quốc";
  }
  if (classId.includes("LUAT")) {
    return "Luật Kinh tế";
  }
  if (classId.includes("QLDD")) {
    return "Quản lý Đất đai";
  }

  return "Giáo dục Tiểu học";
};

export const getAdmissionYear = (student: Partial<Student>, fallbackId = "") => {
  const academicYears = safeTrim(student.academicYears);
  const academicYearMatch = academicYears.match(/\b(20\d{2})\b/);
  if (academicYearMatch) {
    const yr = parseInt(academicYearMatch[1], 10);
    if (!isNaN(yr)) return yr;
  }

  const trainingCourse = safeTrim(student.trainingCourse);
  const trainingYearMatch = trainingCourse.match(/\b(20\d{2})\b/);
  if (trainingYearMatch) {
    const yr = parseInt(trainingYearMatch[1], 10);
    if (!isNaN(yr)) return yr;
  }

  const trainingKMatch = trainingCourse.match(/K(\d{1,2})/i);
  if (trainingKMatch) {
    const kNum = parseInt(trainingKMatch[1], 10);
    if (!isNaN(kNum)) return kNum > 50 ? 1900 + kNum : 2000 + kNum;
  }

  const classId = safeTrim(student.classId);
  const classKMatch = classId.match(/K(\d{2})/i);
  if (classKMatch) {
    const kNum = parseInt(classKMatch[1], 10);
    if (!isNaN(kNum)) return 2000 + kNum;
  }
  if (classId.startsWith("K2-")) return 2024;

  const idStr = safeTrim(student.id || fallbackId);
  const idMatch = idStr.match(/(?:DTG|SV|K)?(\d{2})\d{4,}/i) || idStr.match(/[A-Z]{2,4}(\d{2})/i);
  if (idMatch) {
    const num = parseInt(idMatch[1], 10);
    if (!isNaN(num) && num >= 15 && num <= 40) return 2000 + num;
  }

  return 2024;
};

export const getStudentCardValidity = (student: Partial<Student>, fallbackId = "") => {
  let admissionYear = getAdmissionYear(student, fallbackId);
  if (!admissionYear || isNaN(admissionYear)) {
    admissionYear = 2024;
  }
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

export const hasVietnameseAccents = (str?: string): boolean => 
  Boolean(str && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(str));

export const formatStudentCardName = (rawName?: string): string => {
  if (!rawName) return "";
  return String(rawName).normalize("NFC").trim().replace(/\s+/g, " ").toLocaleUpperCase("vi-VN").normalize("NFC");
};

export const resolveTrainingStudent = (
  currentUser?: { targetId?: string; username?: string; email?: string; id?: string; name?: string } | null,
  liveStudents: Student[] = [],
  seedStudents: Student[] = []
): Partial<Student> => {
  if (!currentUser) return {};

  const clean = (val?: unknown) => String(val || "").trim().toLowerCase();
  const cleanId = (val?: unknown) => {
    const s = clean(val);
    return s.includes("@") ? s.split("@")[0] : s;
  };

  const userKeys = Array.from(new Set([
    clean(currentUser.targetId),
    cleanId(currentUser.targetId),
    clean(currentUser.username),
    cleanId(currentUser.username),
    clean(currentUser.email),
    cleanId(currentUser.email),
    clean(currentUser.id),
    cleanId(currentUser.id?.replace(/^u_stud_/i, ""))
  ])).filter(k => k.length > 0);

  const matchFn = (s: Student) => {
    const sKeys = [
      clean(s.id),
      cleanId(s.id),
      clean((s as any).code),
      cleanId((s as any).code),
      clean(s.email),
      cleanId(s.email)
    ].filter(Boolean);
    return userKeys.some(uk => sKeys.includes(uk));
  };

  // 1. Dữ liệu Đào tạo chính thức từ Firestore (ưu tiên cao nhất)
  const trainingMatch = liveStudents.find(matchFn);
  // 2. Dữ liệu cơ sở hạt nhân SEED_STUDENTS
  const seedMatch = seedStudents.find(matchFn);

  // Bảo đảm họ tên chuẩn có đầy đủ dấu tiếng Việt
  let resolvedName = "";
  if (trainingMatch?.name && hasVietnameseAccents(trainingMatch.name)) {
    resolvedName = trainingMatch.name;
  } else if (seedMatch?.name && hasVietnameseAccents(seedMatch.name)) {
    resolvedName = seedMatch.name;
  } else if (currentUser.name && hasVietnameseAccents(currentUser.name)) {
    resolvedName = currentUser.name;
  } else {
    resolvedName = trainingMatch?.name || seedMatch?.name || currentUser.name || "";
  }

  const base: Partial<Student> = {
    ...(seedMatch || {}),
    ...(trainingMatch || {})
  };

  if (resolvedName) {
    base.name = resolvedName.trim();
  }

  return base;
};
