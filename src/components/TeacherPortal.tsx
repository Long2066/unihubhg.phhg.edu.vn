import React, { useState, useMemo } from "react";
import { useUniHub } from "../state";
import { 
  CourseClassAssignment, 
  SubjectGradeSheet, 
  SubjectStudentGrade, 
  SEMESTER_LIST 
} from "../types";
import { 
  BookOpen, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Save, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  BarChart3, 
  User, 
  GraduationCap, 
  Printer, 
  FileCheck, 
  HelpCircle, 
  Sparkles, 
  RefreshCw,
  Clock,
  Send,
  Calendar,
  Plus
} from "lucide-react";
import * as XLSX from "xlsx";

export const TeacherPortal: React.FC = () => {
  const { 
    currentUser, 
    teacherAssignments, 
    subjectGradeSheets, 
    saveSubjectGradeSheet, 
    submitSubjectGradeSheet, 
    requestGradeUnlock,
    students,
    addGradeAuditLog,
    gradeAppeals,
    resolveGradeAppeal
  } = useUniHub();

  const [selectedSemester, setSelectedSemester] = useState<string>("HOCKY_2_2025_2026");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePortalTab, setActivePortalTab] = useState<"GRADES" | "APPEALS">("GRADES");
  
  // Modal states
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [showDistributionPrintModal, setShowDistributionPrintModal] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>("");
  const [unlockSuccessMsg, setUnlockSuccessMsg] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");
  
  // Filter assignments for current teacher & selected semester
  const myAssignments = useMemo(() => {
    if (!currentUser) return [];
    return teacherAssignments.filter(a => {
      const matchTeacher = a.teacherId === currentUser.email || a.teacherId === currentUser.username || a.teacherId === currentUser.id || currentUser.role === "ADMIN" || currentUser.role === "TRAINING_DEPT";
      const matchSem = a.semesterId === selectedSemester;
      return matchTeacher && matchSem;
    });
  }, [teacherAssignments, currentUser, selectedSemester]);

  // Set default selected assignment when semester or assignments change
  React.useEffect(() => {
    if (myAssignments.length > 0 && !myAssignments.find(a => a.id === selectedAssignmentId)) {
      setSelectedAssignmentId(myAssignments[0].id);
    }
  }, [myAssignments, selectedAssignmentId]);

  const activeAssignment = useMemo(() => {
    return teacherAssignments.find(a => a.id === selectedAssignmentId) || myAssignments[0];
  }, [teacherAssignments, selectedAssignmentId, myAssignments]);

  // Find or initialize subject grade sheet
  const activeGradeSheet = useMemo(() => {
    if (!activeAssignment) return null;
    const existing = subjectGradeSheets.find(s => 
      s.semesterId === activeAssignment.semesterId &&
      s.classId === activeAssignment.classId &&
      s.subjectCode === activeAssignment.subjectCode
    );
    if (existing) return existing;

    // Build initial list from class students if not exists
    const classStudents = students.filter(s => s.classId === activeAssignment.classId || activeAssignment.classId.includes(s.classId) || s.classId.includes(activeAssignment.classId));
    const rawList = classStudents.length > 0 ? classStudents : [
      { id: "DTG2357140202099", name: "Hoàng Hải Nam", gender: "Nam", dob: "2006-01-01", classId: activeAssignment.classId },
      { id: "DTG245140202002", name: "Đỗ Thị Huyền Anh", gender: "Nữ", dob: "2006-03-15", classId: activeAssignment.classId },
      { id: "DTG245140202004", name: "Hứa Hải Anh", gender: "Nam", dob: "2006-04-10", classId: activeAssignment.classId },
      { id: "DTG245140202007", name: "Hoàng Thị Ngọc Ánh", gender: "Nữ", dob: "2006-08-22", classId: activeAssignment.classId },
      { id: "DTG245140202053", name: "Ma Văn Long", gender: "Nam", dob: "2006-05-20", classId: activeAssignment.classId }
    ];

    const initialGrades: SubjectStudentGrade[] = rawList.map((s: any, idx: number) => {
      const realId = String(s.id || s.studentId || `STUDENT_${idx + 1}`).trim();
      const realName = String(s.name || s.studentName || `Sinh viên ${idx + 1}`).trim();
      return {
        studentId: realId,
        studentName: realName,
        gender: s.gender || "Nam",
        dob: s.dob || "2006-01-01",
        classId: s.classId || activeAssignment.classId,
        cc: "",
        tx1: "",
        tx2: "",
        dk1: "",
        dk2: "",
        exam: "",
        tb10: "",
        tb4: "",
        diemChu: "",
        xepLoai: ""
      };
    });

    return {
      id: `GRADE_${activeAssignment.semesterId}_${activeAssignment.classId}_${activeAssignment.subjectCode}`,
      semesterId: activeAssignment.semesterId,
      classId: activeAssignment.classId,
      subjectCode: activeAssignment.subjectCode,
      subjectName: activeAssignment.subjectName,
      credits: activeAssignment.credits,
      teacherId: currentUser?.email || "teacher",
      teacherName: currentUser?.name || "Giảng viên",
      status: "DRAFT" as const,
      grades: initialGrades,
      updatedAt: new Date().toISOString().split("T")[0]
    };
  }, [activeAssignment, subjectGradeSheets, students, currentUser]);

  const [currentGrades, setCurrentGrades] = useState<SubjectStudentGrade[]>([]);

  React.useEffect(() => {
    if (activeGradeSheet && Array.isArray(activeGradeSheet.grades)) {
      // Normalize grades array: guarantee every row has a non-empty, unique studentId!
      const normalized = activeGradeSheet.grades.map((g: any, idx: number) => {
        const fallbackId = `SV_${Date.now()}_${idx + 1}`;
        return {
          ...g,
          studentId: String(g.studentId || g.id || fallbackId).trim(),
          studentName: String(g.studentName || g.name || `Sinh viên ${idx + 1}`).trim()
        };
      });
      setCurrentGrades(normalized);
    }
  }, [activeGradeSheet]);

  // Helper auto calculator
  const calculateSingleRow = (grade: SubjectStudentGrade): SubjectStudentGrade => {
    const cc = parseFloat(String(grade.cc)) || 0;
    const tx1 = parseFloat(String(grade.tx1)) || 0;
    const tx2 = parseFloat(String(grade.tx2)) || 0;
    const dk1 = parseFloat(String(grade.dk1)) || 0;
    const dk2 = parseFloat(String(grade.dk2)) || 0;
    const exam = parseFloat(String(grade.exam)) || 0;

    const hasCc = grade.cc !== "" && grade.cc !== undefined && grade.cc !== "-";
    const hasExam = grade.exam !== "" && grade.exam !== undefined && grade.exam !== "-";

    if (!hasCc && !hasExam) {
      return grade;
    }

    // Process weighted average
    const processScore = (tx1 + (tx2 || tx1)) / (tx2 ? 2 : 1);
    const midScore = (dk1 + (dk2 || dk1)) / (dk2 ? 2 : 1);
    const processMidAvg = (processScore + midScore) / 2;

    const rawTb10 = (cc * 0.1) + (processMidAvg * 0.3) + (exam * 0.6);
    const tb10 = Math.round(rawTb10 * 10) / 10;

    let tb4 = 0;
    let diemChu = "F";
    let xepLoai = "Kém";

    if (tb10 >= 9.0) { tb4 = 4.0; diemChu = "A+"; xepLoai = "Xuất sắc"; }
    else if (tb10 >= 8.5) { tb4 = 3.8; diemChu = "A"; xepLoai = "Giỏi"; }
    else if (tb10 >= 8.0) { tb4 = 3.5; diemChu = "A-"; xepLoai = "Giỏi"; }
    else if (tb10 >= 7.5) { tb4 = 3.2; diemChu = "B+"; xepLoai = "Khá"; }
    else if (tb10 >= 7.0) { tb4 = 3.0; diemChu = "B"; xepLoai = "Khá"; }
    else if (tb10 >= 6.5) { tb4 = 2.5; diemChu = "C+"; xepLoai = "Trung bình"; }
    else if (tb10 >= 5.5) { tb4 = 2.0; diemChu = "C"; xepLoai = "Trung bình"; }
    else if (tb10 >= 5.0) { tb4 = 1.5; diemChu = "D+"; xepLoai = "Trung bình"; }
    else if (tb10 >= 4.0) { tb4 = 1.0; diemChu = "D"; xepLoai = "Yếu"; }
    else { tb4 = 0.0; diemChu = "F"; xepLoai = "Kém"; }

    return {
      ...grade,
      tb10: tb10.toFixed(1),
      tb4: tb4.toFixed(1),
      diemChu,
      xepLoai
    };
  };

  const handleAddNewStudentToSheet = () => {
    if (isLocked || !activeAssignment) return;
    const newStudentId = `DTG_${Date.now().toString().slice(-6)}`;
    const newStudent: SubjectStudentGrade = {
      studentId: newStudentId,
      studentName: `Sinh viên mới`,
      gender: "Nam",
      dob: "2006-01-01",
      classId: activeAssignment.classId,
      cc: "",
      tx1: "",
      tx2: "",
      dk1: "",
      dk2: "",
      exam: "",
      tb10: "",
      tb4: "",
      diemChu: "",
      xepLoai: ""
    };
    setCurrentGrades(prev => [...prev, newStudent]);
  };

  const handleCellChange = (targetStudentId: string, field: keyof SubjectStudentGrade, value: any) => {
    if (activeGradeSheet?.status === "SUBMITTED" || activeGradeSheet?.status === "LOCKED") return;
    
    setCurrentGrades(prev => {
      return prev.map(g => {
        // Strict matching on targetStudentId guarantees editing 1 row ONLY updates that 1 row!
        if (g.studentId === targetStudentId) {
          const updated = { ...g, [field]: value };
          return calculateSingleRow(updated);
        }
        return g;
      });
    });
  };

  const handleSaveDraft = () => {
    if (!activeGradeSheet || !activeAssignment) return;
    const updatedSheet: SubjectGradeSheet = {
      ...activeGradeSheet,
      status: "DRAFT",
      grades: currentGrades,
      updatedAt: new Date().toISOString().split("T")[0]
    };
    saveSubjectGradeSheet(updatedSheet);
    addGradeAuditLog({
      semesterId: activeAssignment.semesterId,
      classId: activeAssignment.classId,
      subjectCode: activeAssignment.subjectCode,
      subjectName: activeAssignment.subjectName,
      action: "LƯU_NHÁP",
      userEmail: currentUser?.email || "teacher",
      userName: currentUser?.name || "Giảng viên",
      userRole: "TEACHER",
      reason: "Giảng viên lưu nháp bảng điểm online"
    });
    setSaveSuccessMsg("Đã lưu nháp bảng điểm thành công!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleSubmitFinal = () => {
    if (!activeGradeSheet || !activeAssignment) return;
    if (window.confirm("Bạn có chắc chắn muốn CHỐT và NỘP bảng điểm này cho Phòng Đào tạo? Sau khi nộp, bảng điểm sẽ được khóa.")) {
      const updatedSheet: SubjectGradeSheet = {
        ...activeGradeSheet,
        status: "SUBMITTED",
        submittedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
        grades: currentGrades,
        updatedAt: new Date().toISOString().split("T")[0]
      };
      saveSubjectGradeSheet(updatedSheet);
      submitSubjectGradeSheet(updatedSheet.id);
      addGradeAuditLog({
        semesterId: activeAssignment.semesterId,
        classId: activeAssignment.classId,
        subjectCode: activeAssignment.subjectCode,
        subjectName: activeAssignment.subjectName,
        action: "CHỐT_NỘP",
        userEmail: currentUser?.email || "teacher",
        userName: currentUser?.name || "Giảng viên",
        userRole: "TEACHER",
        reason: "Giảng viên chốt nộp bảng điểm chính thức"
      });
      setSaveSuccessMsg("Đã nộp và khóa bảng điểm chính thức thành công!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    }
  };

  const handleExportTemplate = () => {
    if (!activeAssignment) return;
    
    // Prepare Excel headers conforming to standard PHHG template
    const headerRows = [
      ["THÔNG TIN CHUNG", "", "", "", "", "", "", "", "", "", "", `ĐIỂM HỌC TẬP ${activeAssignment.semesterName || "HỌC KỲ II 2025-2026"}`],
      ["", "", "", "", "", "", "", "", "", "", "", activeAssignment.subjectName],
      ["", "", "", "", "", "", "", "", "", "", "", `Số tín chỉ: ${activeAssignment.credits} | Mã học phần: ${activeAssignment.subjectCode}`],
      ["STT", "Mã sinh viên", "Họ và tên", "Giới tính", "Ngày sinh", "Nơi sinh", "Dân tộc", "Số CCCD/CMND", "Ngày cấp CCCD/CMND", "Nơi cấp CCCD/CMND", "Lớp", "CC", "TX 1", "TX2", "ĐK 1", "ĐK 2", "Thi", "TB", "TB*", "Điểm chữ", "Xếp loại"]
    ];

    const dataRows = currentGrades.map((g, idx) => [
      idx + 1,
      g.studentId,
      g.studentName,
      g.gender || "Nam",
      g.dob || "2006-01-01",
      "Hà Giang",
      "Kinh",
      "001206001000",
      "2022-10-15",
      "Cục Cảnh sát QLHC",
      g.classId || activeAssignment.classId,
      g.cc || "",
      g.tx1 || "",
      g.tx2 || "",
      g.dk1 || "",
      g.dk2 || "",
      g.exam || "",
      g.tb10 || "",
      g.tb4 || "",
      g.diemChu || "",
      g.xepLoai || ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeAssignment.classId);
    XLSX.writeFile(wb, `Danh_sach_diem_hoc_phan_${activeAssignment.subjectCode}_${activeAssignment.classId}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row containing "Mã sinh viên"
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          if (jsonData[i] && jsonData[i].some(cell => String(cell).includes("Mã sinh viên") || String(cell).includes("STT"))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          alert("File Excel không đúng định dạng mẫu điểm học phần (Không tìm thấy dòng tiêu đề 'Mã sinh viên')!");
          return;
        }

        const importedRows: SubjectStudentGrade[] = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[1]) continue; // Skip empty student code

          const rawCc = row[11] !== undefined ? row[11] : "";
          const rawTx1 = row[12] !== undefined ? row[12] : "";
          const rawTx2 = row[13] !== undefined ? row[13] : "";
          const rawDk1 = row[14] !== undefined ? row[14] : "";
          const rawDk2 = row[15] !== undefined ? row[15] : "";
          const rawExam = row[16] !== undefined ? row[16] : "";

          const draftItem: SubjectStudentGrade = {
            studentId: String(row[1]).trim(),
            studentName: String(row[2] || "").trim(),
            gender: String(row[3] || "Nam").trim(),
            dob: String(row[4] || "2006-01-01").trim(),
            classId: String(row[10] || activeAssignment?.classId || "").trim(),
            cc: rawCc,
            tx1: rawTx1,
            tx2: rawTx2,
            dk1: rawDk1,
            dk2: rawDk2,
            exam: rawExam,
            tb10: row[17] || "",
            tb4: row[18] || "",
            diemChu: row[19] || "",
            xepLoai: row[20] || ""
          };

          importedRows.push(calculateSingleRow(draftItem));
        }

        if (importedRows.length > 0) {
          setCurrentGrades(importedRows);
          alert(`Nạp thành công ${importedRows.length} sinh viên từ file Excel! Vui lòng kiểm tra và bấm "Lưu nháp" hoặc "Chốt nộp điểm".`);
        } else {
          alert("Không tìm thấy dữ liệu điểm sinh viên hợp lệ trong file!");
        }
      } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi đọc file Excel!");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSendUnlockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockReason.trim() || !activeAssignment || !activeGradeSheet) return;

    requestGradeUnlock({
      sheetId: activeGradeSheet.id,
      semesterId: activeAssignment.semesterId,
      classId: activeAssignment.classId,
      subjectCode: activeAssignment.subjectCode,
      subjectName: activeAssignment.subjectName,
      teacherId: currentUser?.email || "teacher",
      teacherName: currentUser?.name || "Giảng viên",
      reason: unlockReason
    });

    setUnlockSuccessMsg("Đã gửi yêu cầu mở khóa sửa điểm tới Phòng Đào tạo!");
    setTimeout(() => {
      setShowUnlockModal(false);
      setUnlockReason("");
      setUnlockSuccessMsg("");
    }, 2000);
  };

  // Grade analytics breakdown
  const stats = useMemo(() => {
    let xuatSac = 0, gioi = 0, kha = 0, trungBinh = 0, yeu = 0, kem = 0, dat = 0;
    currentGrades.forEach(g => {
      if (g.xepLoai === "Xuất sắc") xuatSac++;
      else if (g.xepLoai === "Giỏi") gioi++;
      else if (g.xepLoai === "Khá") kha++;
      else if (g.xepLoai === "Trung bình") trungBinh++;
      else if (g.xepLoai === "Yếu") yeu++;
      else if (g.xepLoai === "Kém") kem++;
      else if (g.xepLoai === "Đạt") dat++;
    });
    return { xuatSac, gioi, kha, trungBinh, yeu, kem, dat, total: currentGrades.length };
  }, [currentGrades]);

  const filteredGrades = useMemo(() => {
    if (!searchQuery.trim()) return currentGrades;
    const q = searchQuery.toLowerCase().trim();
    return currentGrades.filter(g => 
      g.studentName.toLowerCase().includes(q) || 
      g.studentId.toLowerCase().includes(q)
    );
  }, [currentGrades, searchQuery]);

  const isLocked = activeGradeSheet?.status === "SUBMITTED" || activeGradeSheet?.status === "LOCKED";

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-850 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-blue-200 mb-2 border border-white/10">
              <Sparkles size={14} className="text-amber-300" />
              <span>Cổng Thông tin Giảng viên Bộ môn</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <GraduationCap className="text-blue-400" size={32} />
              Quản lý & Nạp Điểm Học Phần
            </h1>
            <p className="text-blue-100/80 text-xs mt-1 max-w-2xl">
              Nhập điểm chuyên cần, giữa kỳ, thi kết thúc môn, nạp/xuất file Excel mẫu chuẩn theo quy chế nhà trường.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Semester selector */}
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/15 flex items-center gap-2">
              <Calendar size={15} className="text-blue-300 ml-2" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer border-none py-1 pr-2"
              >
                {SEMESTER_LIST.map(sem => (
                  <option key={sem.id} value={sem.id} className="text-slate-900 font-semibold">{sem.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Class selector on left, Gradebook on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Assigned Classes List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <BookOpen size={15} className="text-blue-600" />
                <span>Lớp Học Phần Phân Công ({myAssignments.length})</span>
              </h3>
            </div>

            {myAssignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                <AlertCircle size={24} className="mx-auto text-amber-500" />
                <p>Chưa có lớp học phần nào được phân công trong học kỳ này.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myAssignments.map((assignment) => {
                  const sheet = subjectGradeSheets.find(s => 
                    s.semesterId === assignment.semesterId &&
                    s.classId === assignment.classId &&
                    s.subjectCode === assignment.subjectCode
                  );
                  const isCurrent = assignment.id === selectedAssignmentId;
                  const isSheetLocked = sheet?.status === "SUBMITTED" || sheet?.status === "LOCKED";

                  return (
                    <div
                      key={assignment.id}
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isCurrent
                          ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/10"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 font-mono bg-blue-100/60 px-2 py-0.5 rounded">
                          {assignment.subjectCode} • {assignment.credits} TC
                        </span>
                        {isSheetLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Lock size={10} /> Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Unlock size={10} /> Mở nạp
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-slate-800 mt-2 line-clamp-2">
                        {assignment.subjectName}
                      </h4>
                      
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-100">
                        <span>Lớp: <strong className="text-slate-700">{assignment.classId}</strong></span>
                        <span className="text-[10px] text-slate-400">GV: {assignment.teacherName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Analytics Card */}
          {activeAssignment && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase text-blue-300 tracking-wider flex items-center gap-1.5">
                <BarChart3 size={15} />
                <span>Thống kê phổ điểm ({stats.total} SV)</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-emerald-300">Xuất sắc & Giỏi</div>
                  <div className="text-lg font-black text-white">{stats.xuatSac + stats.gioi} <span className="text-[10px] font-normal text-slate-300">({Math.round(((stats.xuatSac+stats.gioi)/stats.total||0)*100)}%)</span></div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-cyan-300">Khá</div>
                  <div className="text-lg font-black text-white">{stats.kha} <span className="text-[10px] font-normal text-slate-300">({Math.round((stats.kha/stats.total||0)*100)}%)</span></div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-amber-300">Trung bình</div>
                  <div className="text-lg font-black text-white">{stats.trungBinh} <span className="text-[10px] font-normal text-slate-300">({Math.round((stats.trungBinh/stats.total||0)*100)}%)</span></div>
                </div>
                <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                  <div className="text-[10px] text-rose-300">Yếu & Kém</div>
                  <div className="text-lg font-black text-white">{stats.yeu + stats.kem} <span className="text-[10px] font-normal text-slate-300">({Math.round(((stats.yeu+stats.kem)/stats.total||0)*100)}%)</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Gradebook Content */}
        <div className="lg:col-span-3 space-y-4">
          {activeAssignment ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              
              {/* Action Toolbar */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md font-mono">
                      {activeAssignment.subjectCode}
                    </span>
                    <h2 className="text-base font-black text-slate-800">
                      {activeAssignment.subjectName} ({activeAssignment.credits} tín chỉ)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lớp niên chế: <strong className="text-slate-700 font-mono">{activeAssignment.classId}</strong> | Trạng thái:{" "}
                    <span className={`font-bold ${isLocked ? "text-amber-700" : "text-emerald-600"}`}>
                      {isLocked ? "ĐÃ KHÓA BẢNG ĐIỂM" : "ĐANG CHO PHÉP NHẬP ĐIỂM"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportTemplate}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download size={13} />
                    <span>Xuất file Excel</span>
                  </button>

                  <button
                    onClick={() => setShowDistributionPrintModal(true)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-250 text-indigo-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer size={13} />
                    <span>Báo cáo & In PDF A4</span>
                  </button>

                  {!isLocked && (
                    <>
                      <button
                        onClick={handleAddNewStudentToSheet}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Thêm thủ công 1 dòng sinh viên mới vào lớp"
                      >
                        <Plus size={13} />
                        <span>Thêm sinh viên</span>
                      </button>

                      <label className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-250 text-blue-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                        <Upload size={13} />
                        <span>Nạp file Excel</span>
                        <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
                      </label>
                    </>
                  )}

                  {!isLocked ? (
                    <>
                      <button
                        onClick={handleSaveDraft}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save size={13} />
                        <span>Lưu nháp</span>
                      </button>

                      <button
                        onClick={handleSubmitFinal}
                        className="px-3.5 py-1.5 bg-blue-650 hover:bg-blue-750 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileCheck size={13} />
                        <span>Chốt & Nộp điểm</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowUnlockModal(true)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Unlock size={13} />
                      <span>Gửi yêu cầu sửa điểm</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo Mã sinh viên hoặc Tên sinh viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Hiển thị <strong className="text-slate-800">{filteredGrades.length}</strong> / {currentGrades.length} sinh viên
                </div>
              </div>

              {/* Gradebook Interactive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="p-3 text-center w-12 border-r border-slate-200">STT</th>
                      <th className="p-3 w-36 border-r border-slate-200 font-mono">Mã SV</th>
                      <th className="p-3 w-48 border-r border-slate-200">Họ và tên</th>
                      <th className="p-3 text-center w-24 border-r border-slate-200 font-mono">Chuyên cần</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono">TX 1</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono">TX 2</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono">ĐK 1</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono">ĐK 2</th>
                      <th className="p-3 text-center w-24 border-r border-slate-200 font-mono bg-blue-50/50">Thi HK</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono font-black text-slate-900 bg-slate-200/50">TB (10)</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono font-black text-slate-900 bg-slate-200/50">TB (4)</th>
                      <th className="p-3 text-center w-20 border-r border-slate-200 font-mono">Điểm chữ</th>
                      <th className="p-3 text-center w-28">XẾP LOẠI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredGrades.map((g, idx) => {
                      return (
                        <tr key={g.studentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 text-center font-mono text-slate-400 border-r border-slate-100">{idx + 1}</td>
                          
                          {/* Mã SV */}
                          <td className="p-1 border-r border-slate-100">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.studentId ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "studentId", e.target.value)}
                              className={`w-32 px-2 py-1 rounded font-mono font-bold border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-700" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-900"
                              }`}
                            />
                          </td>

                          {/* Họ và tên */}
                          <td className="p-1 border-r border-slate-100">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.studentName ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "studentName", e.target.value)}
                              className={`w-44 px-2 py-1 rounded font-bold border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-700" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-900"
                              }`}
                            />
                          </td>
                          
                          {/* Chuyên cần */}
                          <td className="p-1.5 border-r border-slate-100 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.cc ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "cc", e.target.value)}
                              className={`w-14 text-center py-1 rounded font-mono font-bold border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-600" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              }`}
                            />
                          </td>

                          {/* TX1 */}
                          <td className="p-1.5 border-r border-slate-100 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.tx1 ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "tx1", e.target.value)}
                              className={`w-12 text-center py-1 rounded font-mono border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-600" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              }`}
                            />
                          </td>

                          {/* TX2 */}
                          <td className="p-1.5 border-r border-slate-100 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.tx2 ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "tx2", e.target.value)}
                              className={`w-12 text-center py-1 rounded font-mono border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-600" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              }`}
                            />
                          </td>

                          {/* ĐK1 */}
                          <td className="p-1.5 border-r border-slate-100 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.dk1 ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "dk1", e.target.value)}
                              className={`w-12 text-center py-1 rounded font-mono border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-600" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              }`}
                            />
                          </td>

                          {/* ĐK2 */}
                          <td className="p-1.5 border-r border-slate-100 text-center">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.dk2 ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "dk2", e.target.value)}
                              className={`w-12 text-center py-1 rounded font-mono border text-xs focus:outline-none ${
                                isLocked ? "bg-slate-50 border-slate-100 text-slate-600" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                              }`}
                            />
                          </td>

                          {/* Thi HK */}
                          <td className="p-1.5 border-r border-slate-100 text-center bg-blue-50/30">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={g.exam ?? ""}
                              onChange={(e) => handleCellChange(g.studentId, "exam", e.target.value)}
                              className={`w-14 text-center py-1 rounded font-mono font-black text-blue-900 border text-xs focus:outline-none ${
                                isLocked ? "bg-blue-50/50 border-blue-100" : "border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                              }`}
                            />
                          </td>

                          {/* TB (10) */}
                          <td className="p-2 text-center font-mono font-black text-slate-900 bg-slate-100/50 border-r border-slate-100">
                            {g.tb10 || "-"}
                          </td>

                          {/* TB (4) */}
                          <td className="p-2 text-center font-mono font-bold text-slate-700 bg-slate-100/50 border-r border-slate-100">
                            {g.tb4 || "-"}
                          </td>

                          {/* Điểm chữ */}
                          <td className="p-2 text-center font-mono font-black text-blue-700 border-r border-slate-100">
                            {g.diemChu || "-"}
                          </td>

                          {/* XẾP LOẠI (Color Badge) */}
                          <td className="p-2 text-center font-sans">
                            {g.xepLoai ? (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border shadow-2xs ${
                                g.xepLoai === "Xuất sắc"
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : g.xepLoai === "Giỏi"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : g.xepLoai === "Khá"
                                  ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                                  : g.xepLoai === "Trung bình"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : g.xepLoai === "Yếu"
                                  ? "bg-orange-100 text-orange-800 border-orange-200"
                                  : g.xepLoai === "Đạt"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-rose-100 text-rose-800 border-rose-200"
                              }`}>
                                {g.xepLoai}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <FileSpreadsheet size={48} className="mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">Vui lòng chọn 1 Lớp học phần bên trái</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Chọn lớp học phần để xem danh sách sinh viên, thực hiện nhập điểm online hoặc xuất/nạp file Excel mẫu.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Request Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Unlock className="text-amber-500" size={18} />
                Gửi yêu cầu mở khóa sửa điểm
              </h3>
              <button onClick={() => setShowUnlockModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            {unlockSuccessMsg ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl text-center">
                {unlockSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSendUnlockRequest} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Bảng điểm môn <strong className="text-slate-800">{activeAssignment?.subjectName}</strong> ({activeAssignment?.classId}) đã được chốt nộp. Vui lòng nhập lý do để gửi Phòng Đào tạo duyệt mở khóa:
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lý do điều chỉnh điểm (*)</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="VD: Cập nhật kết quả phúc khảo bài thi kết thúc học phần của sinh viên..."
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowUnlockModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>Gửi yêu cầu</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Printable Grade Distribution Modal (A4 Standard) */}
      {showDistributionPrintModal && activeAssignment && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 overflow-y-auto p-4 flex items-center justify-center font-sans">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 border border-slate-200 my-8 text-left">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="text-indigo-600" size={20} />
                <h3 className="text-base font-bold text-slate-800">Báo Cáo Phổ Điểm & Bảng Tổng Kết Học Phần (A4)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} />
                  <span>In bản A4 / Tải PDF</span>
                </button>
                <button
                  onClick={() => setShowDistributionPrintModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="p-6 bg-white border border-slate-300 rounded-xl space-y-6 text-slate-900 shadow-xs">
              {/* Letterhead Header */}
              <div className="text-center space-y-1 border-b border-slate-200 pb-4 font-serif">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-600">ĐẠI HỌC THÁI NGUYÊN</div>
                <div className="text-sm font-black uppercase text-blue-900">PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI TỈNH HÀ GIANG</div>
                <div className="text-xs font-bold text-slate-500">KHOA / BỘ MÔN CHUYÊN MÔN</div>
                <div className="pt-2 text-base font-black text-slate-900 tracking-wider">BÁO CÁO PHỔ ĐIỂM & BẢNG TỔNG KẾT MÔN HỌC</div>
                <div className="text-xs font-sans text-slate-600 italic">Môn học: {activeAssignment.subjectName} ({activeAssignment.subjectCode}) - Lớp: {activeAssignment.classId}</div>
              </div>

              {/* Assignment Summary Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>Giảng viên giảng dạy: <strong className="font-bold">{activeAssignment.teacherName}</strong></div>
                <div>Số tín chỉ học phần: <strong className="font-bold font-mono">{activeAssignment.credits} TC</strong></div>
                <div>Lớp học phần: <strong className="font-bold font-mono">{activeAssignment.classId}</strong></div>
                <div>Tổng số sinh viên: <strong className="font-bold font-mono">{stats.total} SV</strong></div>
              </div>

              {/* Distribution Stats Breakdown */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-700">Tóm tắt phân bố phổ điểm học phần:</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="bg-purple-50 p-2 rounded border border-purple-200">
                    <div className="text-[10px] text-purple-700 font-bold">Xuất sắc</div>
                    <div className="text-base font-black text-purple-900">{stats.xuatSac} <span className="text-[10px] font-normal text-slate-500">({Math.round((stats.xuatSac/stats.total||0)*100)}%)</span></div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <div className="text-[10px] text-blue-700 font-bold">Giỏi</div>
                    <div className="text-base font-black text-blue-900">{stats.gioi} <span className="text-[10px] font-normal text-slate-500">({Math.round((stats.gioi/stats.total||0)*100)}%)</span></div>
                  </div>
                  <div className="bg-cyan-50 p-2 rounded border border-cyan-200">
                    <div className="text-[10px] text-cyan-700 font-bold">Khá</div>
                    <div className="text-base font-black text-cyan-900">{stats.kha} <span className="text-[10px] font-normal text-slate-500">({Math.round((stats.kha/stats.total||0)*100)}%)</span></div>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                    <div className="text-[10px] text-amber-700 font-bold">Trung bình & Yếu</div>
                    <div className="text-base font-black text-amber-900">{stats.trungBinh + stats.yeu + stats.kem} <span className="text-[10px] font-normal text-slate-500">({Math.round(((stats.trungBinh+stats.yeu+stats.kem)/stats.total||0)*100)}%)</span></div>
                  </div>
                </div>
              </div>

              {/* Student Gradebook Table snippet */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 text-center w-10">STT</th>
                      <th className="p-2 border-r border-slate-300 w-32 font-mono">Mã SV</th>
                      <th className="p-2 border-r border-slate-300">Họ và tên</th>
                      <th className="p-2 border-r border-slate-300 text-center font-mono">CC</th>
                      <th className="p-2 border-r border-slate-300 text-center font-mono">Thi</th>
                      <th className="p-2 border-r border-slate-300 text-center font-mono">TB (10)</th>
                      <th className="p-2 border-r border-slate-300 text-center font-mono">Điểm chữ</th>
                      <th className="p-2 text-center w-24">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentGrades.map((g, idx) => (
                      <tr key={g.studentId}>
                        <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold">{g.studentId}</td>
                        <td className="p-2 border-r border-slate-200 font-bold">{g.studentName}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{g.cc || "-"}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-blue-700">{g.exam || "-"}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-black">{g.tb10 || "-"}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-blue-800">{g.diemChu || "-"}</td>
                        <td className="p-2 text-center font-bold">{g.xepLoai || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature Block */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs font-serif">
                <div className="text-center space-y-1">
                  <div className="font-bold uppercase">XÁC NHẬN CỦA TRƯỞNG BỘ MÔN</div>
                  <div className="h-14"></div>
                  <div className="font-bold text-slate-500">(Ký & ghi rõ họ tên)</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="italic text-[11px]">Hà Giang, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                  <div className="font-bold uppercase">GIẢNG VIÊN GIẢNG DẠY</div>
                  <div className="h-14"></div>
                  <div className="font-bold text-blue-900">{activeAssignment.teacherName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
