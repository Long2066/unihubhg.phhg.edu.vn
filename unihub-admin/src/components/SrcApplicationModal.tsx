import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  FileText, 
  User, 
  BookOpen, 
  Award, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Check, 
  XCircle,
  Sparkles
} from "lucide-react";
import { SrcClubApplication } from "../types";

interface SrcApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "APPLY" | "VIEW_STUDENT" | "REVIEW_ORGANIZER";
  initialData?: Partial<SrcClubApplication>;
  studentDefaults?: {
    name: string;
    studentId: string;
    classId: string;
    email?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    major?: string;
    faculty?: string;
  };
  onSubmit?: (data: SrcClubApplication) => void;
  onApprove?: (note?: string) => void;
  onReject?: (reason: string) => void;
  rejectReason?: string;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status?: "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";
}

const RESEARCH_FIELD_OPTIONS = [
  "Tự nhiên",
  "Xã hội Nhân văn",
  "Giáo dục",
  "Kĩ thuật",
  "MT cơ sở"
];

const SKILL_OPTIONS = [
  "Tin học văn phòng",
  "Thiết kế/Truyền thông",
  "Thuyết trình",
  "Xử lý số liệu",
  "Sử dụng AI",
  "Tổ chức sự kiện",
  "Viết học thuật",
  "Ngoại ngữ"
];

const SUBGROUP_OPTIONS = [
  "Nghiên cứu khoa học & học thuật",
  "Truyền thông - Thiết kế",
  "Tổ chức workshop/sự kiện",
  "AI - Công nghệ - Dữ liệu",
  "Khởi nghiệp/Đổi mới sáng tạo",
  "Chưa xác định, mong được CLB định hướng"
];

const COMMITMENTS = [
  "Tuân thủ Điều lệ/Quy chế hoạt động, nội quy và sự phân công hợp lý của Câu lạc bộ;",
  "Tham gia các hoạt động với tinh thần tự nguyện, chủ động, hợp tác và có trách nhiệm;",
  "Tôn trọng giảng viên, Ban Chủ nhiệm, thành viên CLB và các cá nhân/đơn vị phối hợp;",
  "Bảo đảm trung thực học thuật; trích dẫn nguồn đầy đủ, không đạo văn, không làm sai lệch dữ liệu nghiên cứu;",
  "Sử dụng AI và công nghệ một cách có trách nhiệm, có kiểm chứng và phù hợp với yêu cầu học thuật;",
  "Không tự ý sử dụng thông tin nội bộ, dữ liệu nghiên cứu hoặc hình ảnh/tài liệu của CLB cho mục đích không phù hợp;",
  "Cung cấp thông tin đăng ký trung thực và chịu trách nhiệm về nội dung đã kê khai."
];

export const SrcApplicationModal: React.FC<SrcApplicationModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  studentDefaults,
  onSubmit,
  onApprove,
  onReject,
  rejectReason,
  reviewNote,
  reviewedAt,
  reviewedBy,
  status
}) => {
  const isReadOnly = mode === "VIEW_STUDENT" || mode === "REVIEW_ORGANIZER";

  // Form states
  const [fullName, setFullName] = useState(initialData?.fullName || studentDefaults?.name || "");
  const [dob, setDob] = useState(initialData?.dob || studentDefaults?.dob || "2006-01-01");
  const [gender, setGender] = useState(initialData?.gender || studentDefaults?.gender || "Nam");
  const [studentId] = useState(initialData?.studentId || studentDefaults?.studentId || "");
  const [academicYear, setAcademicYear] = useState(initialData?.academicYear || "K2");
  const [classId, setClassId] = useState(initialData?.classId || studentDefaults?.classId || "");
  const [major, setMajor] = useState(initialData?.major || studentDefaults?.major || "Giáo dục Tiểu học");
  const [faculty, setFaculty] = useState(initialData?.faculty || studentDefaults?.faculty || "Khoa Giáo dục Tiểu học & Mầm non");
  const [phone, setPhone] = useState(initialData?.phone || studentDefaults?.phone || "");
  const [email, setEmail] = useState(initialData?.email || studentDefaults?.email || "");
  const [zalo, setZalo] = useState(initialData?.zalo || "");

  // Part II
  const [researchFields, setResearchFields] = useState<string[]>(initialData?.researchFields || []);
  const [otherResearchField, setOtherResearchField] = useState(initialData?.otherResearchField || "");
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [otherSkill, setOtherSkill] = useState(initialData?.otherSkill || "");
  const [academicExperience, setAcademicExperience] = useState(initialData?.academicExperience || "");

  // Part III
  const [joinReason, setJoinReason] = useState(initialData?.joinReason || "");
  const [desiredSubgroup, setDesiredSubgroup] = useState<string[]>(initialData?.desiredSubgroup || []);
  const [firstYearGoal, setFirstYearGoal] = useState(initialData?.firstYearGoal || "");

  // Part IV & V
  const [agreedTerms, setAgreedTerms] = useState(initialData?.agreedTerms || false);

  // Organizer review action states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [inputRejectReason, setInputRejectReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [inputApproveNote, setInputApproveNote] = useState("");

  if (!isOpen) return null;

  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (isReadOnly) return;
    if (list.includes(item)) {
      setter(list.filter(x => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!fullName.trim() || !dob || !phone.trim() || !email.trim()) {
      alert("Vui lòng điền đầy đủ thông tin cá nhân bắt buộc (*)");
      return;
    }

    const phoneRegex = /^[0-9+() -]{8,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      alert("Số điện thoại không hợp lệ (8 - 15 ký tự số)!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Địa chỉ Email không đúng định dạng!");
      return;
    }

    if (!joinReason.trim()) {
      alert("Vui lòng nêu rõ lý do mong muốn gia nhập CLB SRC (*)");
      return;
    }

    if (!firstYearGoal.trim()) {
      alert("Vui lòng nêu mục tiêu cá nhân trong 01 năm đầu tham gia CLB (*)");
      return;
    }

    if (!agreedTerms) {
      alert("Bạn cần tích chọn xác nhận đồng ý với các cam kết và quy định bảo vệ thông tin!");
      return;
    }

    const data: SrcClubApplication = {
      fullName: fullName.trim(),
      dob,
      gender,
      studentId,
      academicYear: academicYear.trim(),
      classId: classId.trim(),
      major: major.trim(),
      faculty: faculty.trim(),
      phone: phone.trim(),
      email: email.trim(),
      zalo: zalo.trim(),
      researchFields,
      otherResearchField: otherResearchField.trim(),
      skills,
      otherSkill: otherSkill.trim(),
      academicExperience: academicExperience.trim(),
      joinReason: joinReason.trim(),
      desiredSubgroup,
      firstYearGoal: firstYearGoal.trim(),
      agreedTerms: true,
      submittedAt: new Date().toISOString()
    };

    onSubmit?.(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center font-black text-amber-300">
              SRC
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">
                {mode === "APPLY" ? "NỘP ĐƠN GIA NHẬP TRỰC TUYẾN" : mode === "REVIEW_ORGANIZER" ? "XÉT DUYỆT ĐƠN GIA NHẬP CLB" : "HỒ SƠ ĐƠN GIA NHẬP ĐÃ NỘP"}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Đơn Xin Gia Nhập CLB Nghiên Cứu Khoa Học (SRC)
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Callout if Reviewed or Pending */}
        {status === "REJECTED" && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-3 text-xs text-rose-900 shrink-0">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold uppercase text-[11px] text-rose-800 tracking-wider">
                Kết quả xét duyệt: Không được phê duyệt
              </span>
              <p className="text-slate-700 leading-relaxed">
                Người xét duyệt: <strong className="text-slate-900">{reviewedBy || "Ban Chủ nhiệm CLB"}</strong>
                {reviewedAt && ` • Ngày: ${new Date(reviewedAt).toLocaleDateString("vi-VN")}`}
              </p>
              <div className="p-2.5 bg-white/80 rounded-lg border border-rose-200 text-rose-950 font-medium">
                <strong>Lý do từ chối:</strong> {rejectReason || "Chưa đạt tiêu chí xét duyệt đợt này."}
              </div>
            </div>
          </div>
        )}

        {status === "ACTIVE" && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center gap-3 text-xs text-emerald-900 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-800">
                Đơn đăng ký đã được phê duyệt chính thức!
              </span>
              {reviewNote && <p className="text-emerald-700 mt-0.5">Lời nhắn: {reviewNote}</p>}
            </div>
          </div>
        )}

        {status === "PENDING" && mode === "VIEW_STUDENT" && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3 text-xs text-amber-900 shrink-0">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-amber-800">
                Đơn xin gia nhập đang chờ Ban Chủ nhiệm CLB thẩm định
              </span>
              <p className="text-amber-700 mt-0.5">Bạn sẽ nhận được thông báo phản hồi và kết quả ngay tại đây khi có quyết định.</p>
            </div>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50/50">
          
          {/* Official Document Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 border-b border-slate-100 pb-4 gap-2">
              <div className="font-bold uppercase tracking-wide text-slate-800 text-center sm:text-left">
                PHÂN HIỆU ĐHTN TẠI HÀ GIANG<br />
                <span className="text-blue-700 font-extrabold">CLB NGHIÊN CỨU KHOA HỌC (SRC)</span>
              </div>
              <div className="font-bold uppercase tracking-wide text-slate-800 text-center sm:text-right">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                <span className="text-[10px] lowercase italic font-medium">Độc lập - Tự do - Hạnh phúc</span>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                ĐƠN XIN GIA NHẬP
              </h2>
              <h3 className="text-xs sm:text-sm font-extrabold text-blue-700 uppercase tracking-wider">
                CÂU LẠC BỘ NGHIÊN CỨU KHOA HỌC - SRC
              </h3>
              <p className="text-xs text-slate-500 mt-1 italic">
                Kính gửi: Ban Chủ nhiệm Câu lạc bộ Nghiên cứu khoa học (SRC) - Phân hiệu ĐHTN tại Hà Giang
              </p>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 text-justify leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-150">
              Tôi làm đơn này với nguyện vọng được gia nhập Câu lạc bộ Nghiên cứu khoa học (SRC), tham gia các hoạt động học thuật, nghiên cứu khoa học, đổi mới sáng tạo và các chương trình do Câu lạc bộ tổ chức. Tôi xin cung cấp các thông tin sau:
            </p>
          </div>

          <form id="src-app-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* I. THÔNG TIN CÁ NHÂN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-blue-900 font-black text-xs sm:text-sm uppercase tracking-wide">
                <User size={16} className="text-blue-600" />
                <span>I. THÔNG TIN CÁ NHÂN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    disabled={isReadOnly}
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-medium focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày, tháng, năm sinh <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    disabled={isReadOnly}
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-mono focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã sinh viên <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    disabled
                    value={studentId}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khóa đào tạo <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    placeholder="e.g. K20 hoặc K2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-medium focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lớp sinh hoạt <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    placeholder="e.g. K2 GDTH A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-medium focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngành/Chuyên ngành đào tạo <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={major}
                    onChange={e => setMajor(e.target.value)}
                    placeholder="e.g. Sư phạm Giáo dục Tiểu học"
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-medium focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Đơn vị/Khoa/Bộ môn
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={faculty}
                    onChange={e => setFaculty(e.target.value)}
                    placeholder="Khoa Giáo dục Tiểu học & Mầm non"
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-medium focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="tel" 
                    disabled={isReadOnly}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="098xxxxxxx"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white font-mono focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ Email <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    disabled={isReadOnly}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@phhg.edu.vn"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Zalo (nếu có)
                  </label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={zalo}
                    onChange={e => setZalo(e.target.value)}
                    placeholder="Số điện thoại hoặc link Zalo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-250 bg-white focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* II. LĨNH VỰC QUAN TÂM VÀ NĂNG LỰC */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-blue-900 font-black text-xs sm:text-sm uppercase tracking-wide">
                <BookOpen size={16} className="text-blue-600" />
                <span>II. LĨNH VỰC QUAN TÂM VÀ NĂNG LỰC CÁ NHÂN</span>
              </div>

              {/* 1. Lĩnh vực nghiên cứu */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Lĩnh vực nghiên cứu quan tâm (có thể chọn nhiều):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {RESEARCH_FIELD_OPTIONS.map(rf => (
                    <label 
                      key={rf} 
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        researchFields.includes(rf) 
                          ? "bg-blue-50/80 border-blue-300 text-blue-900 font-bold shadow-xs" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      } ${isReadOnly ? "cursor-default" : ""}`}
                    >
                      <input 
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={researchFields.includes(rf)}
                        onChange={() => toggleArrayItem(researchFields, rf, setResearchFields)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{rf}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-1">
                  <input 
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Lĩnh vực khác nếu có (e.g. Tâm lý học, Du lịch, Quản trị...)"
                    value={otherResearchField}
                    onChange={e => setOtherResearchField(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-250 bg-white placeholder:text-slate-400 focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* 2. Kỹ năng/sở trường */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  2. Kỹ năng / sở trường hiện có:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SKILL_OPTIONS.map(sk => (
                    <label 
                      key={sk} 
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        skills.includes(sk) 
                          ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold shadow-xs" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      } ${isReadOnly ? "cursor-default" : ""}`}
                    >
                      <input 
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={skills.includes(sk)}
                        onChange={() => toggleArrayItem(skills, sk, setSkills)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{sk}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-1">
                  <input 
                    type="text"
                    disabled={isReadOnly}
                    placeholder="Kỹ năng khác (nếu có)..."
                    value={otherSkill}
                    onChange={e => setOtherSkill(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-250 bg-white placeholder:text-slate-400 focus:border-blue-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* 3. Kinh nghiệm NCKH */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  3. Kinh nghiệm nghiên cứu khoa học / hoạt động học thuật (nếu có):
                </label>
                <textarea 
                  rows={3}
                  disabled={isReadOnly}
                  placeholder="Ghi rõ đề tài, hội thảo, bài viết học thuật đã tham gia hoặc ghi 'Chưa có kinh nghiệm, mong muốn học hỏi'..."
                  value={academicExperience}
                  onChange={e => setAcademicExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-250 bg-white placeholder:text-slate-400 focus:border-blue-500 disabled:bg-slate-100 leading-relaxed"
                />
              </div>
            </div>

            {/* III. NGUYỆN VỌNG KHI THAM GIA CLB */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-blue-900 font-black text-xs sm:text-sm uppercase tracking-wide">
                <Award size={16} className="text-blue-600" />
                <span>III. NGUYỆN VỌNG KHI THAM GIA CLB</span>
              </div>

              {/* 1. Lý do gia nhập */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  1. Lý do mong muốn gia nhập SRC <span className="text-rose-500">*</span>:
                </label>
                <textarea 
                  rows={3}
                  disabled={isReadOnly}
                  required
                  placeholder="Tại sao bạn muốn tham gia CLB NCKH (SRC)? Bạn mong muốn phát triển những gì tại CLB?"
                  value={joinReason}
                  onChange={e => setJoinReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-250 bg-white placeholder:text-slate-400 focus:border-blue-500 disabled:bg-slate-100 leading-relaxed"
                />
              </div>

              {/* 2. Nhóm hoạt động */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  2. Mong muốn được tham gia / hỗ trợ ở nhóm hoạt động:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUBGROUP_OPTIONS.map(grp => (
                    <label 
                      key={grp} 
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        desiredSubgroup.includes(grp) 
                          ? "bg-violet-50/80 border-violet-300 text-violet-900 font-bold shadow-xs" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      } ${isReadOnly ? "cursor-default" : ""}`}
                    >
                      <input 
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={desiredSubgroup.includes(grp)}
                        onChange={() => toggleArrayItem(desiredSubgroup, grp, setDesiredSubgroup)}
                        className="rounded text-violet-600 focus:ring-violet-500"
                      />
                      <span>{grp}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Mục tiêu cá nhân */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  3. Mục tiêu cá nhân trong 01 năm đầu tham gia CLB <span className="text-rose-500">*</span>:
                </label>
                <textarea 
                  rows={3}
                  disabled={isReadOnly}
                  required
                  placeholder="Ví dụ: Hoàn thành 01 đề tài NCKH sinh viên, đạt giải NCKH cấp trường, nâng cao kỹ năng thuyết trình & viết bài báo..."
                  value={firstYearGoal}
                  onChange={e => setFirstYearGoal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-250 bg-white placeholder:text-slate-400 focus:border-blue-500 disabled:bg-slate-100 leading-relaxed"
                />
              </div>
            </div>

            {/* IV. CAM KẾT CỦA NGƯỜI ĐĂNG KÝ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-blue-900 font-black text-xs sm:text-sm uppercase tracking-wide">
                <ShieldCheck size={16} className="text-blue-600" />
                <span>IV. CAM KẾT CỦA NGƯỜI ĐĂNG KÝ</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-150">
                {COMMITMENTS.map((com, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-blue-700 shrink-0">{idx + 1}.</span>
                    <span>{com}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* V. ĐỒNG Ý VỀ THÔNG TIN CÁ NHÂN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-blue-900 font-black text-xs sm:text-sm uppercase tracking-wide">
                <FileText size={16} className="text-blue-600" />
                <span>V. ĐỒNG Ý VỀ THÔNG TIN CÁ NHÂN</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 text-justify">
                Tôi đồng ý để Câu lạc bộ thu thập và sử dụng các thông tin tôi cung cấp trong đơn này nhằm phục vụ quản lý thành viên, liên hệ, tổ chức hoạt động, tổng hợp danh sách và thực hiện các nhiệm vụ liên quan đến hoạt động của CLB. Thông tin chỉ được sử dụng trong phạm vi cần thiết và được bảo vệ theo quy định hiện hành; việc chia sẻ cho bên thứ ba chỉ thực hiện khi có căn cứ phù hợp hoặc sự đồng ý của tôi, trừ trường hợp pháp luật có quy định khác.
              </p>

              <label className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs font-bold text-amber-950 cursor-pointer">
                <input 
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  required
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Tôi đã đọc, hiểu và đồng ý hoàn toàn với các nội dung cam kết trên.</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
                <div>
                  Ký bởi: <strong className="text-slate-900">{fullName || studentDefaults?.name || "Người làm đơn"}</strong>
                </div>
                <div className="font-mono text-[11px]">
                  Thời gian: {initialData?.submittedAt ? new Date(initialData.submittedAt).toLocaleString("vi-VN") : new Date().toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {mode === "APPLY" && "Đơn sẽ được chuyển tới Ban Chủ nhiệm SRC thẩm định."}
            {mode === "VIEW_STUDENT" && "Hồ sơ của bạn được lưu trữ đồng bộ trên hệ thống."}
            {mode === "REVIEW_ORGANIZER" && "Xem xét kỹ hồ sơ trước khi đưa ra quyết định."}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Đóng
            </button>

            {/* APPLY Mode Button */}
            {mode === "APPLY" && (
              <button
                type="submit"
                form="src-app-form"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Send size={14} />
                <span>Ký & Gửi đơn đăng ký SRC</span>
              </button>
            )}

            {/* REVIEW_ORGANIZER Mode Buttons */}
            {mode === "REVIEW_ORGANIZER" && status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Không duyệt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check size={14} />
                  <span>Duyệt kết nạp</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reject Dialog */}
        {showRejectModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <AlertCircle size={18} />
                <span>Từ chối đơn xin gia nhập</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vui lòng nhập lý do từ chối để hệ thống phản hồi minh bạch lại cho sinh viên <strong>{fullName}</strong>:
              </p>
              <textarea
                rows={3}
                required
                value={inputRejectReason}
                onChange={e => setInputRejectReason(e.target.value)}
                placeholder="Ví dụ: Chưa đạt tiêu chí vòng hồ sơ, số lượng thành viên đợt này đã đủ..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!inputRejectReason.trim()) {
                      alert("Vui lòng nhập lý do từ chối!");
                      return;
                    }
                    onReject?.(inputRejectReason.trim());
                    setShowRejectModal(false);
                    onClose();
                  }}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Xác nhận không duyệt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Dialog */}
        {showApproveModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-sm">
                <CheckCircle2 size={18} />
                <span>Phê duyệt đơn xin gia nhập CLB SRC</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn chuẩn bị kết nạp sinh viên <strong>{fullName}</strong> ({studentId} - {classId}) trở thành thành viên chính thức của CLB.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Lời nhắn chào mừng / Hướng dẫn sinh hoạt (tùy chọn):
                </label>
                <input
                  type="text"
                  value={inputApproveNote}
                  onChange={e => setInputApproveNote(e.target.value)}
                  placeholder="Chào mừng bạn đến với mái nhà SRC!"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    onApprove?.(inputApproveNote.trim());
                    setShowApproveModal(false);
                    onClose();
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Xác nhận kết nạp
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
