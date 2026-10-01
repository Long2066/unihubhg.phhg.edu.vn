import React, { useState } from "react";
import { useUniHub } from "../state";
import { SemesterItem } from "../types";
import { Calendar, Plus, Trash2, X, Check, Sparkles, AlertCircle } from "lucide-react";

interface AddSemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (semester: SemesterItem) => void;
}

const PRESET_TERMS = [
  { label: "Học kỳ I", code: "1" },
  { label: "Học kỳ II", code: "2" },
  { label: "Học kỳ Hè (Phụ)", code: "HE" },
  { label: "Học kỳ III", code: "3" }
];

const PRESET_YEARS = [
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028",
  "2028-2029"
];

export const AddSemesterModal: React.FC<AddSemesterModalProps> = ({
  isOpen,
  onClose,
  onCreated
}) => {
  const { customSemesters, addCustomSemester, deleteCustomSemester } = useUniHub();

  const [termType, setTermType] = useState<string>("Học kỳ I");
  const [customTermName, setCustomTermName] = useState<string>("");
  const [yearType, setYearType] = useState<string>("2026-2027");
  const [customYearName, setCustomYearName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  if (!isOpen) return null;

  const resolvedTerm = termType === "OTHER" ? customTermName.trim() : termType;
  const resolvedYear = yearType === "OTHER" ? customYearName.trim() : yearType;

  // Compute preview Name
  const previewName = resolvedTerm && resolvedYear
    ? `${resolvedTerm} - ${resolvedYear}`
    : resolvedTerm || resolvedYear || "Chưa nhập đủ thông tin";

  // Compute preview ID
  const computeId = (): string => {
    let termCode = "CUSTOM";
    const foundPreset = PRESET_TERMS.find(t => t.label === resolvedTerm);
    if (foundPreset) {
      termCode = foundPreset.code;
    } else if (resolvedTerm) {
      const ascii = resolvedTerm
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      termCode = ascii || "CUSTOM";
    }

    const cleanYear = resolvedYear.replace(/[^0-9]/g, "_").replace(/^_+|_+$/g, "");
    return `HOCKY_${termCode}_${cleanYear || "NEW"}`;
  };

  const previewId = computeId();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!resolvedTerm) {
      setErrorMessage("Vui lòng chọn hoặc nhập tên học kỳ.");
      return;
    }
    if (!resolvedYear) {
      setErrorMessage("Vui lòng chọn hoặc nhập năm học.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newSemester = await addCustomSemester(previewName, previewId, {
        term: resolvedTerm,
        academicYear: resolvedYear
      });

      setSuccessMessage(`Đã thêm thành công: ${previewName}`);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onCreated) {
          onCreated(newSemester);
        }
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Không thể tạo học kỳ. Vui lòng thử lại.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học kỳ "${name}" khỏi hệ thống không?`)) {
      try {
        await deleteCustomSemester(id);
      } catch (err: any) {
        alert("Lỗi khi xóa học kỳ: " + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-tight">Thêm Học Kỳ Mới</h3>
              <p className="text-[11px] text-slate-500 font-medium">Tùy biến học kỳ & năm học, đồng bộ trực tiếp lên Firebase Cloud</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Term Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1. Chọn hoặc nhập Học Kỳ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_TERMS.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setTermType(t.label);
                      setCustomTermName("");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                      termType === t.label
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTermType("OTHER")}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                    termType === "OTHER"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Tên học kỳ khác...
                </button>
                {termType === "OTHER" && (
                  <input
                    type="text"
                    value={customTermName}
                    onChange={(e) => setCustomTermName(e.target.value)}
                    placeholder="VD: Học kỳ Dự bị, HK 4..."
                    className="flex-1 py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Academic Year Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                2. Chọn hoặc nhập Năm Học
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_YEARS.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setYearType(y);
                      setCustomYearName("");
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      yearType === y
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {y}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setYearType("OTHER")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    yearType === "OTHER"
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Năm học khác...
                </button>
              </div>
              {yearType === "OTHER" && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customYearName}
                    onChange={(e) => setCustomYearName(e.target.value)}
                    placeholder="VD: 2029-2030"
                    className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                <Sparkles size={12} />
                <span>Xem trước thông tin học kỳ</span>
              </div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="text-sm font-bold text-slate-900">{previewName}</div>
                <div className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  ID: {previewId}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !resolvedTerm || !resolvedYear}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Lưu & Áp Dụng Ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* List of custom semesters already added */}
          {customSemesters && customSemesters.length > 0 && (
            <div className="pt-4 border-t border-slate-150 space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Học kỳ tùy chỉnh đã lưu ({customSemesters.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {customSemesters.map(s => (
                  <div 
                    key={s.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{s.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">ID: {s.id}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onCreated && (
                        <button
                          type="button"
                          onClick={() => {
                            onCreated(s);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Chọn kỳ này
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa học kỳ này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
