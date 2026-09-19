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
  getStudentVerificationCode
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

const FieldRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
    <dd className={`mt-1 text-sm font-semibold leading-snug text-slate-900 ${mono ? "font-mono tabular-nums" : ""}`}>
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
    <span className={`inline-flex min-h-[32px] items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${classes}`}>
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
  const isVerified = Boolean(student && requestedId && requestedCode && requestedCode === expectedCode);

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
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Đã xác thực từ UniHub
              </div>
              <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
                THÔNG TIN XÁC THỰC SINH VIÊN
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Dữ liệu lấy trực tiếp từ hồ sơ sinh viên. Ảnh hiển thị là ảnh đại diện hiện hành của người được quét.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mã xác thực</p>
              <p className="mt-1 text-right font-mono text-2xl font-bold tabular-nums text-slate-900">{expectedCode}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-900/5">
              <img src={avatar} alt={`Ảnh sinh viên ${student.name}`} className="h-full w-full object-cover object-center" />
            </div>
            <div className="mt-4 space-y-3">
              <h2 className="text-xl font-bold leading-tight text-slate-900">{student.name}</h2>
              <p className="font-mono text-sm font-semibold tabular-nums text-slate-500">{student.id}</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={validity.studentStatus} tone={validity.isExpired ? "danger" : "success"} />
                <StatusBadge label={validity.cardStatus} tone={validity.isExpired ? "danger" : "success"} />
              </div>
            </div>
          </aside>

          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight text-slate-900">Hồ sơ xác thực</h2>
                <p className="mt-1 text-sm text-slate-500">Thông tin dùng để đối chiếu thẻ sinh viên điện tử.</p>
              </div>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <FieldRow label="Họ và tên" value={student.name} />
              <FieldRow label="MSSV" value={student.id} mono />
              <FieldRow label="Lớp" value={cardClass} />
              <FieldRow label="Khoa" value={faculty} />
              <FieldRow label="Ngành" value={major} />
              <FieldRow label="Khóa học" value={course} mono />
              <FieldRow label="Trạng thái sinh viên" value={validity.studentStatus} />
              <FieldRow label="Trạng thái thẻ" value={validity.cardStatus} />
              <FieldRow label="Hiệu lực đến" value={validity.expiryDisplay} mono />
              <FieldRow label="Mã xác thực" value={expectedCode} mono />
              <FieldRow label="Cập nhật lúc" value={updatedAt} mono />
            </dl>

            <footer className="mt-5 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold leading-relaxed text-white shadow-sm">
              Đại học Thái Nguyên – Phân hiệu tại ĐHTN tại Hà Giang
            </footer>
          </div>
        </section>

        <div className="rounded-3xl bg-white p-4 text-sm leading-relaxed text-slate-500 shadow-sm ring-1 ring-slate-900/5 sm:p-5">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p>Ảnh và thông tin có thể thay đổi khi sinh viên cập nhật hồ sơ. Quét lại QR để lấy dữ liệu mới nhất.</p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Clock3 className="h-4 w-4" />
            Phiên xác thực sinh tại thời điểm mở trang
          </div>
        </div>
      </div>
    </main>
  );
};
