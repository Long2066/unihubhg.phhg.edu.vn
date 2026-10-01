import React from "react";
import { AlertTriangle, BadgeCheck, Clock3, IdCard, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { SEED_STUDENTS } from "../data";
import { getCachedAvatar, rememberAvatar, useUniHub } from "../state";
import type { Student } from "../types";
import {
  STUDENT_CARD_DEFAULT_AVATAR,
  formatFacultyName,
  getStudentCardCourse,
  getStudentCardValidity,
  getStudentMajor,
  getStudentVerificationCode,
  formatStudentCardName
} from "../utils/studentCard";

const norm = (value?: unknown) => String(value || "").trim().toLowerCase();

const mergeStudents = (liveStudents: Student[]) => {
  const map = new Map<string, Student>();
  [...SEED_STUDENTS, ...liveStudents].forEach(student => {
    const key = norm(student.id || (student as any).code);
    if (!key) return;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...student } : student);
  });
  return Array.from(map.values());
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean }> = ({ 
  label, 
  value, 
  mono,
  highlight 
}) => (
  <div className="flex items-center justify-between py-2.5 px-4 sm:py-3 sm:px-5 gap-3">
    <dt className="text-xs sm:text-sm font-medium text-slate-500 shrink-0">{label}</dt>
    <dd className={`text-xs sm:text-sm font-bold text-right break-words ${highlight ? "text-blue-700" : "text-slate-900"} ${mono ? "font-mono tabular-nums" : ""}`}>
      {value || "Chưa cập nhật"}
    </dd>
  </div>
);

const StatusBadge: React.FC<{ label: string; tone: "success" | "danger" | "info" }> = ({ label, tone }) => {
  const classes = tone === "success"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : tone === "danger"
    ? "bg-rose-50 text-rose-700 ring-rose-200"
    : "bg-sky-50 text-sky-700 ring-sky-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ${classes}`}>
      {label}
    </span>
  );
};

const EmptyState: React.FC<{ title: string; message: string; danger?: boolean }> = ({ title, message, danger }) => (
  <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/5 sm:p-8">
    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-slate-900/5 ${danger ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"}`}>
      {danger ? <AlertTriangle className="h-7 w-7" /> : <IdCard className="h-7 w-7" />}
    </div>
    <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{title}</h1>
    <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>
    <button
      type="button"
      onClick={() => window.location.assign("/")}
      className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
    >
      <RefreshCw className="h-4 w-4" />
      Về UniHub
    </button>
  </div>
);

export const StudentVerificationPage: React.FC = () => {
  const { students } = useUniHub();
  const [updatedAt] = React.useState(() => new Date().toLocaleString("vi-VN", { hour12: false }));
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const requestedId = (params.get("mssv") || params.get("id") || "").trim();
  const requestedCode = (params.get("code") || "").trim();
  const studentList = React.useMemo(() => mergeStudents(students), [students]);
  const student = studentList.find(item => {
    const code = norm((item as any).code);
    const id = norm(item.id);
    const emailPrefix = norm(item.email?.split("@")[0]);
    const key = norm(requestedId);
    return id === key || code === key || emailPrefix === key;
  });

  React.useEffect(() => {
    if (student?.avatar) rememberAvatar(student.avatar, student.id, (student as any).code, student.email);
  }, [student?.avatar, student?.email, student?.id]);

  const expectedCode = getStudentVerificationCode(student?.id || requestedId);
  const isVerified = Boolean(student && requestedId && requestedCode && requestedCode.toUpperCase() === expectedCode.toUpperCase());

  if (!requestedId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
        <EmptyState title="Thiếu mã sinh viên" message="Liên kết xác thực cần có MSSV trên QR của thẻ sinh viên điện tử." />
      </main>
    );
  }

  if (!student || !isVerified) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
        <EmptyState
          danger
          title="Không xác thực được thẻ"
          message="MSSV hoặc mã xác thực không khớp dữ liệu hệ thống. Vui lòng quét lại QR trên thẻ sinh viên điện tử."
        />
      </main>
    );
  }

  const cardClass = student.classId || "Chưa cập nhật";
  const faculty = formatFacultyName(student.facultyInCharge || student.facultyId) || "Chưa cập nhật";
  const major = getStudentMajor(student);
  const course = getStudentCardCourse(student, cardClass) || "Chưa cập nhật";
  const validity = getStudentCardValidity(student, student.id);
  const avatar = student.avatar || getCachedAvatar(student.id, (student as any).code, student.email) || STUDENT_CARD_DEFAULT_AVATAR;

  return (
    <main className="min-h-screen bg-slate-100/70 py-6 px-3 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-4">
        {/* Header verification pill */}
        <header className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs ring-1 ring-slate-900/5 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold ring-1 ring-emerald-300/60 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>HỆ THỐNG XÁC THỰC ĐIỆN TỬ CHÍNH THỨC</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            THÔNG TIN XÁC THỰC SINH VIÊN
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Trích xuất trực tiếp từ Cơ sở dữ liệu đào tạo UniHub Phân hiệu Hà Giang
          </p>
        </header>

        {/* Profile Card (Compact & Responsive on Mobile & Desktop) */}
        <section className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs ring-1 ring-slate-900/5">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-900/10 shadow-xs shrink-0">
              <img 
                src={avatar} 
                alt={`Ảnh sinh viên ${student.name}`} 
                className="w-full h-full object-cover object-center" 
              />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hồ sơ sinh viên</span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase truncate leading-snug">
                {formatStudentCardName(student.name)}
              </h2>
              <div className="inline-block font-mono text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {student.id}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <StatusBadge label={validity.studentStatus} tone={validity.isExpired ? "danger" : "success"} />
                <StatusBadge label={validity.cardStatus} tone={validity.isExpired ? "danger" : "success"} />
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Verification Spec Sheet (Structured, hairline divided, zero jumping lines!) */}
        <section className="rounded-2xl bg-white shadow-xs ring-1 ring-slate-900/5 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hồ sơ xác thực</span>
            </div>
            <span className="text-[11px] font-bold font-mono text-slate-600 bg-white px-2 py-0.5 rounded-md ring-1 ring-slate-200">
              Mã xác thực: {expectedCode}
            </span>
          </div>

          <dl className="divide-y divide-slate-100">
            <InfoRow label="Họ và tên" value={formatStudentCardName(student.name)} />
            <InfoRow label="MSSV" value={student.id} mono />
            <InfoRow label="Lớp" value={cardClass} />
            <InfoRow label="Khoa" value={faculty} />
            <InfoRow label="Ngành" value={major} highlight />
            <InfoRow label="Khóa học" value={course} mono />
            <InfoRow label="Trạng thái sinh viên" value={validity.studentStatus} />
            <InfoRow label="Trạng thái thẻ" value={validity.cardStatus} />
            <InfoRow label="Hiệu lực đến" value={validity.expiryDisplay} mono />
            <InfoRow label="Mã xác thực" value={expectedCode} mono />
            <InfoRow label="Cập nhật lúc" value={updatedAt} mono />
          </dl>

          <footer className="w-full bg-slate-900 py-3.5 px-4 text-center text-xs sm:text-sm font-bold text-white tracking-wide">
            Phân hiệu ĐHTN tại Hà Giang
          </footer>
        </section>

        {/* Note / Disclaimer */}
        <div className="rounded-2xl bg-white p-3.5 sm:p-4 text-xs leading-relaxed text-slate-500 shadow-xs ring-1 ring-slate-900/5">
          <div className="flex items-start gap-2.5">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>Dữ liệu đối chiếu bảo mật trực tiếp theo thời gian thực. Mọi thông tin thay đổi từ Phòng Đào tạo sẽ tự động cập nhật khi quét lại mã QR.</p>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <Clock3 className="h-3.5 w-3.5 shrink-0" />
            <span>Phiên xác thực số {expectedCode} khởi tạo tại thời điểm quét</span>
          </div>
        </div>
      </div>
    </main>
  );
};
