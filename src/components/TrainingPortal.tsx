import React, { useState } from "react";
import { useUniHub, normalizeClassId } from "../state";
import { UserRole, Student, UserAccount, ScheduleSlot, STUDENT_FIELDS_META, SEMESTER_LIST, CourseClassAssignment, GradeAppeal, GradingRulesConfig, parseWeekRange, isWeekInScheduleSlot, isStudentProfileComplete } from "../types";
import { SEED_TEACHER_ASSIGNMENTS } from "../data";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { 
  FileSpreadsheet, 
  Upload, 
  Lock, 
  CheckCircle, 
  Edit, 
  RefreshCw, 
  FileText, 
  Info,
  ChevronDown,
  Users,
  Grid,
  ShieldAlert,
  Key,
  Download,
  Trash2,
  UploadCloud,
  Plus,
  ArrowLeft,
  Bell,
  Sliders,
  AlertTriangle,
  Send,
  Search,
  Calendar,
  X,
  Check,
  Copy
} from "lucide-react";

export const formatStudentId = (id: any) => {
  const str = String(id || "").trim();
  if (!str) return "-";
  if (!str.toUpperCase().startsWith("DTG") && /^\d+$/.test(str)) {
    return `DTG${str}`;
  }
  return str;
};

export const TrainingPortal: React.FC = () => {
  const { 
    students, 
    importAcademicData, 
    toggleLearningDataLock,
    importNewClassesExcel,
    users,
    activePortletTab,
    setActivePortletTab,
    schedules,
    importScheduleData,
    deleteScheduleSlot,
    clearSchedules,
    customClasses,
    addNewClass,
    renameClass,
    deleteClass,
    selectedSemesterId,
    setSelectedSemesterId,
    teacherAssignments,
    saveTeacherAssignments,
    importTeacherAssignmentsExcel,
    unlockRequests,
    approveUnlockRequest,
    rejectUnlockRequest,
    subjectGradeSheets,
    aggregateSubjectGradesToSemesterGpa,
    gradeAppeals,
    resolveGradeAppeal,
    gradingRules,
    updateGradingRules,
    addGradeAuditLog
  } = useUniHub();

  const activeTab = (activePortletTab as "IMPORT" | "TEACHER_ASSIGNMENTS" | "UNLOCK_REQUESTS" | "GRADE_APPEALS" | "IMPORT_CLASSES" | "LIST" | "THOI_KHOA_BIEU") || "IMPORT";
  const setActiveTab = (tab: "IMPORT" | "TEACHER_ASSIGNMENTS" | "UNLOCK_REQUESTS" | "GRADE_APPEALS" | "IMPORT_CLASSES" | "LIST" | "THOI_KHOA_BIEU") => {
    setActivePortletTab(tab);
  };
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [classDetailSearchQuery, setClassDetailSearchQuery] = useState("");
  const [selectedScheduleSemesterId, setSelectedScheduleSemesterId] = useState<string>("HOCKY_2_2025_2026");
  const [selectedScheduleWeek, setSelectedScheduleWeek] = useState<number>(0);
  const [selectedAssignmentClass, setSelectedAssignmentClass] = useState<string>("ALL");

  // State Đổi Tên Lớp
  const [editingRenameClassId, setEditingRenameClassId] = useState<string | null>(null);
  const [renameClassNameInput, setRenameClassNameInput] = useState<string>("");

  // Modal manual edit GPA
  const [editGpa, setEditGpa] = useState(3.0);
  const [editCredits, setEditCredits] = useState(15);
  const [editWarning, setEditWarning] = useState(false);
  const [editStatus, setEditStatus] = useState("Bình thường");

  // New fields for manual edit
  const [editGender, setEditGender] = useState("Nam");
  const [editDob, setEditDob] = useState("2006-01-01");
  const [editPob, setEditPob] = useState("Hà Giang");
  const [editEthnicity, setEditEthnicity] = useState("Kinh");
  const [editIdCard, setEditIdCard] = useState("");
  const [editIdCardDate, setEditIdCardDate] = useState("");
  const [editIdCardPlace, setEditIdCardPlace] = useState("");
  const [editSubjects, setEditSubjects] = useState("");
  const [editSubjectGrades, setEditSubjectGrades] = useState("");
  const [editGpa10, setEditGpa10] = useState(8.0);
  const [editAcademicGrade, setEditAcademicGrade] = useState("Khá");
  const [editNotes, setEditNotes] = useState("");

  // Mock GPA template upload
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Class Import Simulator
  const [showClassPreview, setShowClassPreview] = useState(false);
  const [selectedClassFileLabel, setSelectedClassFileLabel] = useState("");
  const [importedClassStudents, setImportedClassStudents] = useState<Student[]>([]);
  const [importedClassUsers, setImportedClassUsers] = useState<UserAccount[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [showAddClassModal, setShowAddClassModal] = useState(false);

  // Grade Management Mode & Features State
  const [importMode, setImportMode] = useState<"EXCEL_DIRECT" | "AUTO_AGGREGATE">("EXCEL_DIRECT");
  const [aggregationResultMsg, setAggregationResultMsg] = useState<string>("");
  const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string>("");
  
  // Assignment Modal
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState<boolean>(false);
  const [assignForm, setAssignForm] = useState({
    classId: "K20-CNTT",
    subjectCode: "VPS7251",
    subjectName: "Cơ sở Tự nhiên - xã hội",
    credits: 4,
    teacherId: "gv_nguyenvana@phhg.edu.vn",
    teacherName: "ThS. Nguyễn Văn A",
    teacherPassword: "password123"
  });

  // Grading Rules Modal
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [rulesForm, setRulesForm] = useState<GradingRulesConfig>(() => gradingRules);

  // Grade Appeal Resolution Modal
  const [selectedAppealForResponse, setSelectedAppealForResponse] = useState<GradeAppeal | null>(null);
  const [appealResponseText, setAppealResponseText] = useState<string>("");
  const [appealNewGrade, setAppealNewGrade] = useState<string>("");

  // Edit Assignment Modal State
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState<boolean>(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string>("");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [editAssignForm, setEditAssignForm] = useState({
    classId: "",
    subjectCode: "",
    subjectName: "",
    credits: 3,
    teacherId: "",
    teacherName: "",
    teacherPassword: "password123"
  });

  // Handler: Export Sample Excel for Course Assignments (lấy đúng file mẫu Excel làm template)
  const handleExportAssignmentSampleExcel = async () => {
    try {
      const currentSemAssignments = teacherAssignments.filter(a => a.semesterId === selectedSemesterId);
      const seedAssignmentsForSemester = SEED_TEACHER_ASSIGNMENTS.filter(a => a.semesterId === selectedSemesterId);
      const assignmentsToExport = currentSemAssignments.length > 0
        ? currentSemAssignments
        : (seedAssignmentsForSemester.length > 0 ? seedAssignmentsForSemester : SEED_TEACHER_ASSIGNMENTS);

      const currentSemesterObj = SEMESTER_LIST.find(s => s.id === selectedSemesterId);
      const semesterMatch = selectedSemesterId.match(/^HOCKY_(\d+)_(\d{4})_(\d{4})$/);
      const semesterNameUpper = semesterMatch
        ? `HỌC KÌ ${semesterMatch[1] === "1" ? "I" : "II"}, NĂM HỌC ${semesterMatch[2]} - ${semesterMatch[3]}`
        : (currentSemesterObj?.name || "HỌC KÌ II, NĂM HỌC 2025 - 2026")
            .toUpperCase()
            .replace("HỌC KỲ", "HỌC KÌ")
            .replace(" - ", ", NĂM HỌC ");

      const templateResponse = await fetch("/templates/mau_phan_cong_giang_day_hocky_2_2025_2026.xlsx");
      if (!templateResponse.ok) {
        throw new Error("Không tải được file mẫu phân công giảng dạy.");
      }

      const workbook = new ExcelJS.Workbook();
      const templateBuffer = await templateResponse.arrayBuffer();
      await workbook.xlsx.load(templateBuffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error("File mẫu phân công giảng dạy không có worksheet hợp lệ.");
      }

      const now = new Date();
      const dayStr = String(now.getDate()).padStart(2, "0");
      const monthStr = String(now.getMonth() + 1).padStart(2, "0");
      const yearStr = String(now.getFullYear());

      const cloneStyle = (style: any) => style ? JSON.parse(JSON.stringify(style)) : style;
      const baseTemplateDataRows = 4;
      const renderedDataRows = Math.max(assignmentsToExport.length, baseTemplateDataRows);
      const extraRows = Math.max(renderedDataRows - baseTemplateDataRows, 0);

      // Các vùng chữ ký sẽ được đặt lại theo số dòng dữ liệu thực tế.
      ["G9:I9", "G11:H11", "G18:H18"].forEach(range => {
        try {
          worksheet.unMergeCells(range);
        } catch {
          // File mẫu có thể đã thay đổi merge; bỏ qua để không chặn xuất Excel.
        }
      });

      if (extraRows > 0) {
        const sourceRow = worksheet.getRow(7);
        worksheet.spliceRows(8, 0, ...Array.from({ length: extraRows }, () => []));

        for (let offset = 0; offset < extraRows; offset++) {
          const targetRow = worksheet.getRow(8 + offset);
          targetRow.height = sourceRow.height;
          for (let col = 1; col <= 10; col++) {
            targetRow.getCell(col).style = cloneStyle(sourceRow.getCell(col).style);
          }
        }
      }

      worksheet.getCell("D1").value = `BẢNG PHÂN CÔNG GIẢNG VIÊN THAM GIA GIẢNG DẠY CÁC HỌC PHẦN \r\nTẠI CÁC LỚP, ${semesterNameUpper}`;
      worksheet.getCell("H1").value = "Trích xuất từ hệ thống UniHubHG\r\nHệ thống quản lí sinh viên\r\nhttps://unihubhg-phhg.vercel.app/";

      for (let rowIndex = 0; rowIndex < renderedDataRows; rowIndex++) {
        const rowNumber = 4 + rowIndex;
        const assignment = assignmentsToExport[rowIndex];
        const row = worksheet.getRow(rowNumber);

        const teacherUser = assignment ? users.find(u =>
          (u.email && assignment.teacherId && u.email.toLowerCase() === assignment.teacherId.toLowerCase()) ||
          (u.username && assignment.teacherId && u.username.toLowerCase() === assignment.teacherId.toLowerCase()) ||
          (u.name && assignment.teacherName && u.name.trim().toLowerCase() === assignment.teacherName.trim().toLowerCase())
        ) : undefined;

        const teacherPassword = assignment?.teacherPassword || teacherUser?.password || (assignment ? "Abc@123" : "");
        const rowValues = assignment ? [
          rowIndex + 1,
          assignment.semesterId || selectedSemesterId || "HOCKY_2_2025_2026",
          assignment.subjectCode || "",
          assignment.subjectName || "",
          assignment.credits || "",
          assignment.className || assignment.classId || "",
          assignment.teacherId || "",
          assignment.teacherName || "",
          teacherPassword,
          ""
        ] : ["", "", "", "", "", "", "", "", "", ""];

        rowValues.forEach((value, colIndex) => {
          row.getCell(colIndex + 1).value = value;
        });
      }

      const blankRowNumber = 4 + renderedDataRows;
      const dateRowNumber = 5 + renderedDataRows;
      const deptRowNumber = 7 + renderedDataRows;
      const signRowNumber = 14 + renderedDataRows;

      for (let col = 1; col <= 10; col++) {
        worksheet.getRow(blankRowNumber).getCell(col).value = "";
      }

      worksheet.getCell(`G${dateRowNumber}`).value = `Tuyên Quang, ngày ${dayStr}, tháng ${monthStr}, năm ${yearStr}`;
      worksheet.getCell(`G${dateRowNumber}`).alignment = { horizontal: "right", vertical: "middle" };
      worksheet.getCell(`G${deptRowNumber}`).value = "Phòng Đào tạo NCKH & hợp tác Quốc tế";
      worksheet.getCell(`G${signRowNumber}`).value = "Chức danh. Họ và tên";
      worksheet.mergeCells(`G${dateRowNumber}:I${dateRowNumber}`);
      worksheet.mergeCells(`G${deptRowNumber}:H${deptRowNumber}`);
      worksheet.mergeCells(`G${signRowNumber}:H${signRowNumber}`);

      worksheet.getColumn(1).width = 7;
      worksheet.getColumn(2).width = 25;
      worksheet.getColumn(3).width = 18;
      worksheet.getColumn(4).width = 42;
      worksheet.getColumn(5).width = 12;
      worksheet.getColumn(6).width = 18;
      worksheet.getColumn(7).width = 34;
      worksheet.getColumn(8).width = 30;
      worksheet.getColumn(9).width = 22;
      worksheet.getColumn(10).width = 16;

      workbook.creator = "UniHubHG";
      workbook.modified = now;
      worksheet.pageSetup = {
        ...worksheet.pageSetup,
        orientation: "landscape",
        paperSize: 9,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      };

      const outputBuffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([outputBuffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `Mau_Phan_Cong_Giang_Day_${selectedSemesterId || "HOCKY_2_2025_2026"}.xlsx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export assignment Excel template failed:", error);
      alert("Không thể xuất Excel phân công giảng dạy theo file mẫu. Vui lòng kiểm tra lại file mẫu.");
    }
  };

  // Handlers for Editing Assignment
  const handleOpenEditAssignmentModal = (assignment: CourseClassAssignment) => {
    setEditingAssignmentId(assignment.id);
    const existingTeacher = users.find(u => 
      (u.email && u.email.toLowerCase() === assignment.teacherId.toLowerCase()) || 
      (u.username && u.username.toLowerCase() === assignment.teacherId.toLowerCase())
    );
    setEditAssignForm({
      classId: assignment.classId,
      subjectCode: assignment.subjectCode,
      subjectName: assignment.subjectName,
      credits: assignment.credits,
      teacherId: assignment.teacherId,
      teacherName: assignment.teacherName,
      teacherPassword: existingTeacher?.password || "password123"
    });
    setShowEditAssignmentModal(true);
  };

  const handleSaveEditAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignmentId) return;

    const updatedAssignments = teacherAssignments.map(a => {
      if (a.id === editingAssignmentId) {
        return {
          ...a,
          classId: editAssignForm.classId.trim(),
          subjectCode: editAssignForm.subjectCode.trim(),
          subjectName: editAssignForm.subjectName.trim(),
          credits: Number(editAssignForm.credits) || 3,
          teacherId: editAssignForm.teacherId.trim(),
          teacherName: editAssignForm.teacherName.trim(),
          teacherPassword: editAssignForm.teacherPassword.trim()
        };
      }
      return a;
    });

    saveTeacherAssignments(updatedAssignments);

    // Auto sync teacherName to matching schedule slots
    const updatedSchedules = schedules.map(s => {
      if (normalizeClassId(s.classId) === normalizeClassId(editAssignForm.classId) && 
         (s.subjectCode === editAssignForm.subjectCode || s.subjectName === editAssignForm.subjectName)) {
        return {
          ...s,
          teacherName: editAssignForm.teacherName.trim()
        };
      }
      return s;
    });
    importScheduleData(updatedSchedules);

    addGradeAuditLog({
      action: "UPDATE_ASSIGNMENT",
      userEmail: "dtphhg@hg.edu.vn",
      userName: "Phòng Đào tạo",
      userRole: UserRole.TRAINING_DEPT,
      subjectCode: editAssignForm.subjectCode,
      classId: editAssignForm.classId,
      oldValue: "Phân công cũ",
      newValue: `Đổi sang GV: ${editAssignForm.teacherName} (${editAssignForm.teacherId}) - MK: ${editAssignForm.teacherPassword}`
    });

    setShowEditAssignmentModal(false);
    setEditingAssignmentId("");
    alert(`Đã điều chỉnh phân công giảng dạy và cập nhật mật khẩu cho Giảng viên thành công!`);
  };

  // Handlers for Assignment Deletion (Xóa từng giảng viên & Xóa hàng loạt)
  const handleToggleSelectAllAssignments = (semAssignments: CourseClassAssignment[]) => {
    const semIds = semAssignments.map(a => a.id);
    const allSelected = semIds.length > 0 && semIds.every(id => selectedAssignmentIds.includes(id));
    if (allSelected) {
      setSelectedAssignmentIds(prev => prev.filter(id => !semIds.includes(id)));
    } else {
      setSelectedAssignmentIds(prev => Array.from(new Set([...prev, ...semIds])));
    }
  };

  const handleToggleSelectAssignment = (id: string) => {
    setSelectedAssignmentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSingleAssignment = (assignment: CourseClassAssignment) => {
    if (window.confirm(`Xác nhận xóa phân công giảng dạy môn "${assignment.subjectName}" (${assignment.subjectCode}) - Lớp ${assignment.classId} của giảng viên ${assignment.teacherName}?`)) {
      const updated = teacherAssignments.filter(a => a.id !== assignment.id);
      saveTeacherAssignments(updated);
      setSelectedAssignmentIds(prev => prev.filter(id => id !== assignment.id));
    }
  };

  const handleBulkDeleteAssignments = () => {
    if (selectedAssignmentIds.length === 0) return;
    if (window.confirm(`Xác nhận xóa hàng loạt ${selectedAssignmentIds.length} phân công giảng dạy đã chọn?`)) {
      const updated = teacherAssignments.filter(a => !selectedAssignmentIds.includes(a.id));
      saveTeacherAssignments(updated);
      setSelectedAssignmentIds([]);
    }
  };

  // Schedule Management State
  const [schedulePreviewData, setSchedulePreviewData] = useState<any[]>([]);
  const [showSchedulePreview, setShowSchedulePreview] = useState<boolean>(false);
  const [selectedScheduleClass, setSelectedScheduleClass] = useState<string>("");

  // Handler: Import Assignments from Excel (Hỗ trợ file xuất mẫu 10 cột & nhận diện tiêu đề động)
  const handleImportAssignmentExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        let headerIdx = -1;
        // Default mapping based on standard 10-column export template:
        // Col A (0): STT | Col B (1): Mã HK | Col C (2): Mã HP | Col D (3): Tên HP | Col E (4): Số TC
        // Col F (5): Lớp | Col G (6): Email/Mã GV | Col H (7): Họ tên GV | Col I (8): Mật khẩu | Col J (9): Ghi chú
        let colMap = {
          semId: 1,
          subjectCode: 2,
          subjectName: 3,
          credits: 4,
          classId: 5,
          teacherId: 6,
          teacherName: 7,
          teacherPassword: 8
        };

        // Scan the first 15 rows to find the REAL table header row (skipping banner/title rows)
        for (let i = 0; i < Math.min(15, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row)) continue;

          const rowText = row.map(cell => String(cell || "").toLowerCase()).join(" ");

          // Ignore main banner / title rows
          if (rowText.includes("bảng phân công") || rowText.includes("trích xuất từ") || rowText.includes("phân hiệu đhtn")) {
            continue;
          }

          // A valid table header row must contain explicit table header keywords
          const hasSubjectHeader = rowText.includes("mã học phần") || rowText.includes("mã hp") || rowText.includes("mã môn");
          const hasClassHeader = rowText.includes("lớp niên chế") || rowText.includes("lớp học phần") || rowText.includes("lớp");
          const hasTeacherHeader = rowText.includes("giảng viên") || rowText.includes("họ và tên");

          if (hasSubjectHeader || (hasClassHeader && hasTeacherHeader)) {
            headerIdx = i;
            row.forEach((cell: any, cIdx: number) => {
              const val = String(cell || "").trim().toLowerCase();
              // Only evaluate short cell strings as header labels (skip long description text)
              if (val.length > 60) return;

              if (val.includes("mã học kỳ") || val === "mã hk" || val === "học kỳ") {
                colMap.semId = cIdx;
              } else if (val.includes("mã học phần") || val.includes("mã hp") || val.includes("mã môn")) {
                colMap.subjectCode = cIdx;
              } else if (val.includes("tên học phần") || val.includes("tên hp") || val.includes("tên môn")) {
                colMap.subjectName = cIdx;
              } else if (val.includes("tín chỉ") || val.includes("số tc") || val.includes("số tín")) {
                colMap.credits = cIdx;
              } else if (val.includes("lớp niên chế") || val === "lớp" || val.includes("lớp hp")) {
                colMap.classId = cIdx;
              } else if (val.includes("mã / email") || val.includes("email giảng viên") || val.includes("mã giảng viên")) {
                colMap.teacherId = cIdx;
              } else if (val.includes("họ và tên") || val.includes("họ tên")) {
                colMap.teacherName = cIdx;
              } else if (val.includes("mật khẩu")) {
                colMap.teacherPassword = cIdx;
              }
            });
            break;
          }
        }

        const newAssignments: (CourseClassAssignment & { teacherPassword?: string })[] = [];
        const startRow = headerIdx >= 0 ? headerIdx + 1 : 1;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          // Skip signature or department footer rows
          const fullRowText = row.map(c => String(c || "")).join(" ").toLowerCase();
          if (fullRowText.includes("tuyên quang") || fullRowText.includes("phòng đào tạo") || fullRowText.includes("chức danh") || fullRowText.includes("trích xuất từ")) {
            continue;
          }

          const subjectCode = String(row[colMap.subjectCode] || "").trim();
          const classId = String(row[colMap.classId] || "").trim();

          // Ignore rows without mandatory subjectCode or classId
          if (!subjectCode || !classId || subjectCode.toLowerCase().includes("mã học phần") || classId.toLowerCase().includes("lớp")) {
            continue;
          }

          let semId = String(row[colMap.semId] || "").trim();
          if (!semId || semId.match(/^\d+$/)) {
            // If semId is missing or accidentally read STT number, fallback to current selectedSemesterId
            semId = selectedSemesterId || "HOCKY_2_2025_2026";
          }

          const subjectName = String(row[colMap.subjectName] || "").trim();
          const credits = parseInt(String(row[colMap.credits] || "2"), 10) || 2;
          const teacherId = String(row[colMap.teacherId] || "").trim();
          const teacherName = String(row[colMap.teacherName] || "").trim();
          const teacherPassword = String(row[colMap.teacherPassword] || "Abc@123").trim();

          newAssignments.push({
            id: `HP_${semId}_${classId}_${subjectCode}`,
            semesterId: semId,
            classId,
            subjectCode,
            subjectName,
            credits,
            teacherId: teacherId || "teacher",
            teacherName: teacherName || "Giảng viên",
            teacherPassword: teacherPassword || "Abc@123",
            status: "PENDING"
          });
        }

        if (newAssignments.length > 0) {
          importTeacherAssignmentsExcel(newAssignments);
          alert(`Đã nạp thành công ${newAssignments.length} phân công giảng dạy và cấp mật khẩu Giảng viên từ file Excel!`);
        } else {
          alert("Không tìm thấy dữ liệu phân công hợp lệ trong file!");
        }
      } catch (err) {
        console.error("Import assignment Excel error:", err);
        alert("Có lỗi khi đọc file Excel phân công!");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handler: Manual Save Assignment
  const handleSaveManualAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.classId || !assignForm.subjectCode || !assignForm.subjectName) return;

    const newAssignment: CourseClassAssignment & { teacherPassword?: string } = {
      id: `HP_${selectedSemesterId}_${assignForm.classId}_${assignForm.subjectCode}`,
      semesterId: selectedSemesterId,
      classId: assignForm.classId,
      subjectCode: assignForm.subjectCode,
      subjectName: assignForm.subjectName,
      credits: assignForm.credits,
      teacherId: assignForm.teacherId,
      teacherName: assignForm.teacherName,
      teacherPassword: assignForm.teacherPassword,
      status: "PENDING"
    };

    saveTeacherAssignments([...teacherAssignments, newAssignment]);
    setShowAddAssignmentModal(false);
    alert("Đã thêm phân công giảng dạy mới và cấp mật khẩu Giảng viên thành công!");
  };

  // Handler: Deadline Reminders
  const handleSendDeadlineReminders = () => {
    const unsubmitted = teacherAssignments.filter(a => a.semesterId === selectedSemesterId && a.status !== "SUBMITTED" && a.status !== "LOCKED");
    if (unsubmitted.length === 0) {
      alert("Tất cả các lớp học phần trong kỳ đã hoàn thành nộp điểm!");
      return;
    }

    const uniqueTeachers = Array.from(new Set(unsubmitted.map(a => a.teacherName)));
    setReminderSuccessMsg(`Đã tự động gửi thông báo nhắc nhở nạp điểm tới ${uniqueTeachers.length} Giảng viên (${unsubmitted.length} lớp học phần chưa nộp điểm)!`);
    setTimeout(() => setReminderSuccessMsg(""), 5000);
  };

  // Handler: Mode 2 Auto Aggregation
  const handleAutoAggregateFromSubjectTeachers = () => {
    const res = aggregateSubjectGradesToSemesterGpa(selectedSemesterId);
    if (res.updatedCount === 0) {
      setAggregationResultMsg("Chưa có bảng điểm môn học phần nào được Giảng viên chốt nộp trong học kỳ này để gom tổng hợp.");
    } else {
      setAggregationResultMsg(`Hoàn thành tổng hợp tự động! Đã gom điểm & tính GPA cho ${res.updatedCount} sinh viên (${res.warningsCount} sinh viên bị gắn cờ cảnh báo học tập).`);
    }
  };

  // Handler: Save Rules
  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateGradingRules(rulesForm);
    setShowRulesModal(false);
    alert("Đã lưu cấu hình Trọng số & Quy tắc làm tròn điểm thành công!");
  };

  const handleMockExcelUpload = () => {
    const updates = [
      { 
        id: "DTG245140202053", 
        name: "Nguyễn Văn An",
        gpa: 3.52, 
        gpa10: 8.8,
        creditsEarned: 21, 
        learningWarning: false, 
        learningStatus: "Bình thường",
        gender: "Nam",
        dob: "2006-05-14",
        pob: "Vị Xuyên, Hà Giang",
        ethnicity: "Kinh",
        idCard: "001206009876",
        idCardDate: "2022-04-12",
        idCardPlace: "Cục Cảnh sát QLHC về TTXH",
        subjects: "Lập trình Web, Cơ sở dữ liệu, Cấu trúc dữ liệu",
        subjectGrades: "8.5, 9.0, 8.8, -, -, -, -, -",
        academicGrade: "Giỏi",
        notes: "Gương mẫu tham gia phong trào, học tập xuất sắc học kỳ II.",
        updatedAt: new Date().toISOString().split("T")[0]
      },
      { 
        id: "SV20CN02", 
        name: "Phan Thị Bình",
        gpa: 2.85, 
        gpa10: 7.1,
        creditsEarned: 18, 
        learningWarning: false, 
        learningStatus: "Bình thường",
        gender: "Nữ",
        dob: "2006-08-22",
        pob: "Yên Minh, Hà Giang",
        ethnicity: "Tày",
        idCard: "001206005544",
        idCardDate: "2022-09-18",
        idCardPlace: "Cục Cảnh sát QLHC về TTXH",
        subjects: "Lập trình Web, Cơ sở dữ liệu, Thiết kế UI/UX",
        subjectGrades: "7.5, 6.8, 7.0, -, -, -, -, -",
        academicGrade: "Khá",
        notes: "",
        updatedAt: new Date().toISOString().split("T")[0]
      },
      { 
        id: "SV20CN04", 
        name: "Vũ Đăng Khoa",
        gpa: 1.82, 
        gpa10: 4.5,
        creditsEarned: 13, 
        learningWarning: true, 
        learningStatus: "Bị cảnh báo",
        gender: "Nam",
        dob: "2006-03-01",
        pob: "Bắc Quang, Hà Giang",
        ethnicity: "Kinh",
        idCard: "001206001122",
        idCardDate: "2021-12-05",
        idCardPlace: "Công an tỉnh Hà Giang",
        subjects: "Cơ sở dữ liệu, Toán rời rạc",
        subjectGrades: "4.0, 5.0, -, -, -, -, -, -",
        academicGrade: "Yếu",
        notes: "Nợ môn Cơ sở dữ liệu.",
        updatedAt: new Date().toISOString().split("T")[0]
      }
    ];

    setPreviewData(updates);
    setShowPreview(true);
  };

  const handleExportExcel = () => {
    const headers = [
      "STT",
      "Mã sinh viên",
      "Họ và tên",
      "Giới tính",
      "Ngày sinh",
      "Nơi sinh",
      "Dân tộc",
      "Số CCCD/CMND",
      "Ngày cấp CCCD/CMND",
      "Nơi cấp CCCD/CMND",
      "Lớp",
      "Điểm Học phần 1",
      "Điểm Học phần 2",
      "Điểm Học phần 3",
      "Điểm Học phần 4",
      "Điểm Học phần 5",
      "Điểm Học phần 6",
      "Điểm Học phần 7",
      "Điểm Học phần 8",
      "Điểm TB hệ 10",
      "Điểm TB hệ 4",
      "Xếp loại học tập",
      "Ghi chú",
      "Ngày cập nhật"
    ];
    
    const data = students.map((s, idx) => {
      const semData = s.academicDataByPeriod?.[selectedSemesterId] || {};
      const subjectGrades = semData.subjectGrades ?? s.subjectGrades;
      const grades = subjectGrades ? subjectGrades.split(",").map(g => g.trim()) : [];
      const gradeCols = Array.from({ length: 8 }, (_, i) => {
        const val = grades[i] || "-";
        return val === "" ? "-" : val;
      });

      const gpa4 = semData.gpa ?? s.gpa ?? 3.2;
      const gpa10 = semData.gpa10 ?? s.gpa10 ?? (gpa4 * 2.5);
      const academicGrade = semData.academicGrade ?? s.academicGrade ?? (gpa4 >= 3.6 ? "Xuất sắc" : gpa4 >= 3.2 ? "Giỏi" : "Khá");

      return [
        idx + 1,
        s.id,
        s.name,
        s.gender || "Nam",
        s.dob || "2006-01-01",
        s.pob || "Hà Giang",
        s.ethnicity || "Kinh",
        s.idCard || "00120600" + (1000 + idx),
        s.idCardDate || "2022-10-15",
        s.idCardPlace || "Cục Cảnh sát QLHC về TTXH",
        s.classId,
        ...gradeCols,
        gpa10,
        gpa4,
        academicGrade,
        semData.notes ?? s.notes ?? "",
        semData.updatedAt ?? s.updatedAt ?? new Date().toISOString().split("T")[0]
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDiem");
    XLSX.writeFile(workbook, "Danh_sach_diem_Phan_hieu.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        const headers = rawData[0] as string[];
        if (!headers || headers.length === 0) {
          alert("File không hợp lệ hoặc rỗng!");
          return;
        }

        const colIdx = {
          id: headers.findIndex(h => h?.toString().trim().toLowerCase() === "mã sinh viên"),
          name: headers.findIndex(h => h?.toString().trim().toLowerCase() === "họ và tên"),
          gender: headers.findIndex(h => h?.toString().trim().toLowerCase() === "giới tính"),
          dob: headers.findIndex(h => h?.toString().trim().toLowerCase() === "ngày sinh"),
          pob: headers.findIndex(h => h?.toString().trim().toLowerCase() === "nơi sinh"),
          ethnicity: headers.findIndex(h => h?.toString().trim().toLowerCase() === "dân tộc"),
          idCard: headers.findIndex(h => h?.toString().trim().toLowerCase() === "số cccd/cmnd"),
          idCardDate: headers.findIndex(h => h?.toString().trim().toLowerCase() === "ngày cấp cccd/cmnd" || h?.toString().trim().toLowerCase() === "ngày ngày cấp"),
          idCardPlace: headers.findIndex(h => h?.toString().trim().toLowerCase() === "nơi cấp cccd/cmnd" || h?.toString().trim().toLowerCase() === "nơi cấp"),
          classId: headers.findIndex(h => h?.toString().trim().toLowerCase() === "lớp"),
          gpa10: headers.findIndex(h => h?.toString().trim().toLowerCase() === "điểm tb hệ 10"),
          gpa4: headers.findIndex(h => h?.toString().trim().toLowerCase() === "điểm tb hệ 4"),
          academicGrade: headers.findIndex(h => h?.toString().trim().toLowerCase() === "xếp loại học tập"),
          notes: headers.findIndex(h => h?.toString().trim().toLowerCase() === "ghi chú"),
          updatedAt: headers.findIndex(h => h?.toString().trim().toLowerCase() === "ngày cập nhật")
        };

        const gradeColIndexes: number[] = [];
        for (let g = 1; g <= 8; g++) {
          const idx = headers.findIndex(h => h?.toString().trim().toLowerCase() === `điểm học phần ${g}`);
          gradeColIndexes.push(idx);
        }

        if (colIdx.id === -1) {
          alert("Không tìm thấy cột 'Mã sinh viên' trong file Excel!");
          return;
        }

        const updates: any[] = [];
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;
          const rawId = row[colIdx.id]?.toString().trim();
          if (!rawId) continue;
          const id = formatStudentId(rawId);

          const gpa = colIdx.gpa4 !== -1 && row[colIdx.gpa4] !== undefined ? Number(row[colIdx.gpa4]) : 3.0;
          const gpa10 = colIdx.gpa10 !== -1 && row[colIdx.gpa10] !== undefined ? Number(row[colIdx.gpa10]) : 8.0;
          const warning = gpa < 2.0;
          const status = warning ? "Bị cảnh báo" : "Bình thường";

          const rowGrades: string[] = [];
          for (let g = 0; g < 8; g++) {
            const cIdx = gradeColIndexes[g];
            let val = cIdx !== -1 && row[cIdx] !== undefined ? row[cIdx]?.toString().trim() : "-";
            if (!val) val = "-";
            rowGrades.push(val);
          }
          const subjectGradesStr = rowGrades.join(", ");

          updates.push({
            id,
            name: colIdx.name !== -1 && row[colIdx.name] ? row[colIdx.name]?.toString().trim() : undefined,
            gender: colIdx.gender !== -1 && row[colIdx.gender] ? row[colIdx.gender]?.toString().trim() : undefined,
            dob: colIdx.dob !== -1 && row[colIdx.dob] ? row[colIdx.dob]?.toString().trim() : undefined,
            pob: colIdx.pob !== -1 && row[colIdx.pob] ? row[colIdx.pob]?.toString().trim() : undefined,
            ethnicity: colIdx.ethnicity !== -1 && row[colIdx.ethnicity] ? row[colIdx.ethnicity]?.toString().trim() : undefined,
            idCard: colIdx.idCard !== -1 && row[colIdx.idCard] ? row[colIdx.idCard]?.toString().trim() : "",
            idCardDate: colIdx.idCardDate !== -1 && row[colIdx.idCardDate] ? row[colIdx.idCardDate]?.toString().trim() : "",
            idCardPlace: colIdx.idCardPlace !== -1 && row[colIdx.idCardPlace] ? row[colIdx.idCardPlace]?.toString().trim() : "",
            classId: colIdx.classId !== -1 && row[colIdx.classId] ? row[colIdx.classId]?.toString().trim() : undefined,
            subjects: undefined,
            subjectGrades: subjectGradesStr,
            gpa10: gpa10,
            gpa: gpa,
            academicGrade: colIdx.academicGrade !== -1 && row[colIdx.academicGrade] ? row[colIdx.academicGrade]?.toString().trim() : "Khá",
            notes: colIdx.notes !== -1 && row[colIdx.notes] ? row[colIdx.notes]?.toString().trim() : "",
            updatedAt: colIdx.updatedAt !== -1 && row[colIdx.updatedAt] ? row[colIdx.updatedAt]?.toString().trim() : new Date().toISOString().split("T")[0],
            creditsEarned: 18,
            learningWarning: warning,
            learningStatus: status
          });
        }

        if (updates.length === 0) {
          alert("Không tìm thấy dữ liệu sinh viên nào trong tệp!");
          return;
        }

        setPreviewData(updates);
        setShowPreview(true);
      } catch (err) {
        alert("Lỗi khi đọc file Excel: " + err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyImport = () => {
    importAcademicData(previewData, selectedSemesterId);
    setShowPreview(false);
    setPreviewData([]);
    alert("Dữ liệu kết quả học tập từ cổng đào tạo đã được đồng bộ & khóa chính thức thành công!");
  };

  // Class list imports simulator
  const handleLoadClassExcelSimulator = (type: "GDTH" | "SUFAM") => {
    let className = "";
    let classAlias = "";
    let dataList: Student[] = [];
    let userList: UserAccount[] = [];

    if (type === "GDTH") {
      className = "K2-GDTH-A";
      classAlias = "k2gdtha";
      setSelectedClassFileLabel("danh_sach_lop_k2_gdth_a_goc.xlsx");

      dataList = [
        { id: "GDTH001", name: "Nguyễn Thị Hoa", email: "gdth001@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 3.82, creditsEarned: 20, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH002", name: "Phan Văn Minh", email: "gdth002@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 3.25, creditsEarned: 18, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH003", name: "Lệ Thu Thảo", email: "gdth003@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 2.76, creditsEarned: 15, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH045", name: "Bùi Tiến Đạt", email: "gdth045@hg.edu.vn", classId: "K2-GDTH-A", facultyId: "K-GDTH", gpa: 1.45, creditsEarned: 12, learningWarning: true, learningStatus: "Bị cảnh báo" }
      ];

      userList = [
        {
          id: "U_GDTH_M",
          username: "cblk2gdtha@hg.edu.vn",
          password: "password123",
          email: "cblk2gdtha@hg.edu.vn",
          name: "Lớp trưởng K2 GDTH A",
          role: UserRole.CLASS_MONITOR,
          targetId: "K2-GDTH-A"
        }
      ];
    } else {
      className = "K3-GDTH-B";
      classAlias = "k3gdthb";
      setSelectedClassFileLabel("danh_sach_lop_k3_gdth_b_goc.xlsx");

      dataList = [
        { id: "GDTH101", name: "Trần Bảo Long", email: "gdth101@hg.edu.vn", classId: "K3-GDTH-B", facultyId: "K-GDTH", gpa: 3.65, creditsEarned: 20, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH102", name: "Hoàng Mỹ Duyên", email: "gdth102@hg.edu.vn", classId: "K3-GDTH-B", facultyId: "K-GDTH", gpa: 3.12, creditsEarned: 18, learningWarning: false, learningStatus: "Bình thường" },
        { id: "GDTH103", name: "Ngô Quốc Bảo", email: "gdth103@hg.edu.vn", classId: "K3-GDTH-B", facultyId: "K-GDTH", gpa: 2.10, creditsEarned: 14, learningWarning: false, learningStatus: "Bình thường" }
      ];

      userList = [
        {
          id: "U_GDTH3_M",
          username: "cblk3gdthb@hg.edu.vn",
          password: "password123",
          email: "cblk3gdthb@hg.edu.vn",
          name: "Lớp trưởng K3 GDTH B",
          role: UserRole.CLASS_MONITOR,
          targetId: "K3-GDTH-B"
        }
      ];
    }

    setImportedClassStudents(dataList);
    setImportedClassUsers(userList);
    setShowClassPreview(true);
  };

  const handleApplyClassImport = () => {
    importNewClassesExcel(importedClassStudents, importedClassUsers);
    setShowClassPreview(false);
    setImportedClassStudents([]);
    setImportedClassUsers([]);
    alert("Nhập danh mục nhiều lớp & auto-provision tài khoản BCS lớp (cblk2gdtha@hg.edu.vn / password123) thành công!");
  };

  const handleExportClassStudentsExcel = async (targetClassId: string) => {
    const classStudents = students.filter(s => s.classId === targetClassId);
    const headers = [
      "STT", "Mã sinh viên", "Họ và tên", "Giới tính", "Ngày sinh", "Nơi sinh", "Dân tộc", "Tôn giáo", "Quốc tịch", "Số CCCD/CMND",
      "Ngày cấp CCCD/CMND", "Nơi cấp CCCD/CMND", "Mã BHYT", "Đối tượng ưu tiên", "Khu vực ưu tiên", "Email", "Số điện thoại", "Địa chỉ thường trú", "Tỉnh/TP thường trú", "Xã/Phường thường trú",
      "Địa chỉ tạm trú", "Họ tên cha", "Nghề nghiệp cha", "SĐT cha", "Họ tên mẹ", "Nghề nghiệp mẹ", "SĐT mẹ", "Hệ đào tạo", "Khóa đào tạo", "Ngành đào tạo",
      "Chuyên ngành", "Khoa/Đơn vị quản lý", "Niên khóa", "Cố vấn học tập", "Số học phần đã đăng ký", "Danh sách lớp tín chỉ", "Ghi chú đăng ký học", "Tín chỉ đã tích lũy", "Tổng học phí phải nộp", "Học phí đã nộp",
      "Học phí còn nợ", "Trạng thái thanh toán", "Ghi chú", "Ngày cập nhật"
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Lớp ${targetClassId}`);

    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: false
    };

    // Header Row
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Times New Roman", size: 10, bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F1F5F9" }
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "CBD5E1" } },
        left: { style: "thin", color: { argb: "CBD5E1" } },
        bottom: { style: "medium", color: { argb: "94A3B8" } },
        right: { style: "thin", color: { argb: "CBD5E1" } }
      };
    });

    const colWidths = headers.map(h => Math.max(h.length + 3, 10));

    // Data Rows
    classStudents.forEach((s, idx) => {
      const formattedId = formatStudentId(s.id);
      const rowValues = [
        idx + 1,
        formattedId,
        s.name || "",
        s.gender || "",
        s.dob || "",
        s.pob || "",
        s.ethnicity || "",
        s.religion || "",
        s.nationality || "",
        s.idCard || "",
        s.idCardDate || "",
        s.idCardPlace || "",
        s.bhyt || "",
        s.priorityObject || "",
        s.priorityArea || "",
        s.email || "",
        s.phone || "",
        s.permanentAddress || "",
        s.permanentProvince || "",
        s.permanentWard || "",
        s.temporaryAddress || "",
        s.fatherName || "",
        s.fatherJob || "",
        s.fatherPhone || "",
        s.motherName || "",
        s.motherJob || "",
        s.motherPhone || "",
        s.trainingSystem || "",
        s.trainingCourse || "",
        s.trainingMajor || "",
        s.specialization || "",
        s.facultyInCharge || "",
        s.academicYears || "",
        s.adviser || "",
        s.registeredSubjectsCount || 0,
        s.creditClassesList || "",
        s.enrollmentNotes || "",
        s.accumulatedCredits || s.creditsEarned || 0,
        s.totalTuition || 0,
        s.paidTuition || 0,
        s.debtTuition || 0,
        s.paymentStatus || "",
        s.notes || "",
        s.updatedAt || new Date().toISOString().split("T")[0]
      ];

      const row = worksheet.addRow(rowValues);
      row.height = 20;

      rowValues.forEach((val, colIdx) => {
        const valStr = String(val ?? "");
        if (valStr.length + 3 > colWidths[colIdx]) {
          colWidths[colIdx] = Math.min(valStr.length + 3, 40);
        }

        const cell = row.getCell(colIdx + 1);
        cell.font = { name: "Times New Roman", size: 10 };
        cell.alignment = {
          vertical: "middle",
          horizontal: colIdx === 0 || colIdx === 1 || colIdx === 3 || colIdx === 4 || colIdx === 9 || colIdx === 16 ? "center" : "left",
          wrapText: true
        };
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } }
        };
      });
    });

    worksheet.columns.forEach((col, colIdx) => {
      if (colWidths[colIdx]) {
        col.width = colWidths[colIdx];
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Thong_tin_sinh_vien_Lop_${targetClassId}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClassStudentsExcel = (e: React.ChangeEvent<HTMLInputElement>, targetClassId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (rawData.length === 0) {
          alert("Tập tin Excel trống!");
          return;
        }

        const headers = rawData[0] as any[];
        const colIdx = {
          id: headers.findIndex(h => h?.toString().trim().toLowerCase() === "mã sinh viên"),
          name: headers.findIndex(h => h?.toString().trim().toLowerCase() === "họ và tên"),
          idCard: headers.findIndex(h => h?.toString().trim().toLowerCase() === "số cccd/cmnd" || h?.toString().trim().toLowerCase() === "số cccd"),
          classId: headers.findIndex(h => h?.toString().trim().toLowerCase() === "lớp"),
        };

        if (colIdx.id === -1) {
          alert("Không tìm thấy cột 'Mã sinh viên' trong file Excel!");
          return;
        }

        const parsedStudents: Student[] = [];
        const parsedUsers: UserAccount[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const rawId = row[colIdx.id]?.toString().trim();
          if (!rawId) continue;
          const id = formatStudentId(rawId);

          const name = colIdx.name !== -1 && row[colIdx.name] ? row[colIdx.name]?.toString().trim() : "Sinh viên mới";
          const idCard = colIdx.idCard !== -1 && row[colIdx.idCard] ? row[colIdx.idCard]?.toString().trim() : "";
          const classId = colIdx.classId !== -1 && row[colIdx.classId] && row[colIdx.classId]?.toString().trim() ? row[colIdx.classId]?.toString().trim() : targetClassId;

          const newStud: Student = {
            id,
            name,
            classId,
            facultyId: "K-GDTH",
            email: `${id.toLowerCase()}@hg.edu.vn`,
            idCard,
            creditsEarned: 0,
            gpa: 0,
            learningWarning: false,
            learningStatus: "Bình thường",
          };

          headers.forEach((h, colIndex) => {
            const hText = h?.toString().trim().toLowerCase();
            const val = row[colIndex]?.toString().trim();
            if (val === undefined || val === null || val === "") return;

            const metaField = STUDENT_FIELDS_META.find(meta => meta.label.toLowerCase() === hText);
            if (metaField && metaField.key !== "id" && metaField.key !== "name" && metaField.key !== "classId") {
              if (metaField.type === "number") {
                (newStud as any)[metaField.key] = Number(val);
              } else {
                (newStud as any)[metaField.key] = val;
              }
            }
          });

          parsedStudents.push(newStud);

          parsedUsers.push({
            id: `U_STUD_${id}`,
            username: id,
            password: idCard || "password123",
            name: name,
            role: UserRole.STUDENT,
            targetId: id,
            email: newStud.email
          });
        }

        if (parsedStudents.length === 0) {
          alert("Không có dữ liệu sinh viên hợp lệ!");
          return;
        }

        importNewClassesExcel(parsedStudents, parsedUsers);
        alert(`Nạp thành công ${parsedStudents.length} sinh viên cho lớp ${targetClassId} và tự động cấp tài khoản đăng nhập (Mật khẩu là số CCCD)!`);
      } catch (err) {
        alert("Lỗi khi đọc file Excel: " + err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportScheduleTemplate = async (targetClassId?: string) => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Phân hiệu ĐHTN tại Hà Giang";

      const availableScheduleClasses = Array.from(new Set([
        ...students.map(s => normalizeClassId(s.classId)),
        ...customClasses.map(c => normalizeClassId(c))
      ])).filter(Boolean).sort();

      const exportClasses = targetClassId 
        ? [targetClassId] 
        : (availableScheduleClasses.length > 0 ? availableScheduleClasses : ["K2-GDTH A"]);

      // 1. Build DANH_MỤC Catalog Sheet (Pulls REAL data from Teacher Assignments flow)
      const catalogSheet = workbook.addWorksheet("DANH_MỤC");
      catalogSheet.columns = [
        { header: "Tên học phần", key: "name", width: 35 },
        { header: "Mã học phần", key: "code", width: 18 },
        { header: "Số tín chỉ", key: "credits", width: 12 },
        { header: "Giảng viên", key: "teacher", width: 28 }
      ];

      const catHeaderRow = catalogSheet.getRow(1);
      catHeaderRow.font = { name: "Times New Roman", size: 11, bold: true };
      catHeaderRow.alignment = { vertical: "middle", horizontal: "center" };
      catHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };

      const subjectsMap = new Map<string, { code: string; credits: number; teacher: string }>();

      // Helper: resolve teacher username/email to real full name
      const resolveTeacherRealName = (rawName?: string) => {
        if (!rawName || rawName.trim() === "" || rawName.trim() === "Chưa phân công") {
          return "Chưa phân công";
        }
        const clean = rawName.trim();

        // 1. Find exact match in users array by username, email, id, or targetId
        const matchedUser = users.find(u => 
          (u.username && u.username.toLowerCase() === clean.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === clean.toLowerCase()) ||
          (u.id && u.id.toLowerCase() === clean.toLowerCase()) ||
          (u.targetId && u.targetId.toLowerCase() === clean.toLowerCase())
        );

        if (matchedUser && matchedUser.name && matchedUser.name.trim()) {
          return matchedUser.name.trim();
        }

        // 2. If clean is an email (e.g. gv_nguyenminhnguyet@phhg.edu.vn), extract username part and match
        if (clean.includes("@") || clean.startsWith("gv_")) {
          const localPart = clean.split("@")[0].replace(/^(gv_|cb_)/, "");
          const fallbackMatch = users.find(u => 
            (u.username && u.username.toLowerCase().includes(localPart.toLowerCase())) || 
            (u.email && u.email.toLowerCase().includes(localPart.toLowerCase()))
          );
          if (fallbackMatch && fallbackMatch.name) {
            return fallbackMatch.name.trim();
          }
        }

        return clean;
      };

      // Pull actual assignments from teacherAssignments state (or SEED_TEACHER_ASSIGNMENTS fallback)
      const relevantAssignments = teacherAssignments.length > 0 
        ? teacherAssignments 
        : (SEED_TEACHER_ASSIGNMENTS || []);

      relevantAssignments.forEach(a => {
        if (!targetClassId || normalizeClassId(a.classId) === normalizeClassId(targetClassId)) {
          if (!subjectsMap.has(a.subjectName)) {
            subjectsMap.set(a.subjectName, {
              code: a.subjectCode || `HP_${a.subjectName.replace(/\s+/g, "")}`,
              credits: a.credits || 2,
              teacher: resolveTeacherRealName(a.teacherName)
            });
          }
        }
      });

      // Also include subjects from schedules if not already present
      schedules.forEach(s => {
        if (!targetClassId || normalizeClassId(s.classId) === normalizeClassId(targetClassId)) {
          if (!subjectsMap.has(s.subjectName)) {
            subjectsMap.set(s.subjectName, {
              code: s.subjectCode || "",
              credits: s.credits || 2,
              teacher: resolveTeacherRealName(s.teacherName)
            });
          }
        }
      });

      if (subjectsMap.size === 0) {
        subjectsMap.set("Phương pháp dạy học Toán", { code: "GDTH204", credits: 3, teacher: "Cô Hoàng Thị B" });
        subjectsMap.set("Tâm lý học tiểu học", { code: "GDTH205", credits: 2, teacher: "ThS. Trần Thị D" });
        subjectsMap.set("Cơ sở Tự nhiên - xã hội", { code: "VPS7251", credits: 4, teacher: "ThS. Nguyễn Văn A" });
      }

      subjectsMap.forEach((info, name) => {
        const r = catalogSheet.addRow({ name, code: info.code, credits: info.credits, teacher: info.teacher });
        r.font = { name: "Times New Roman", size: 11 };
        r.getCell(3).alignment = { horizontal: "center" };
      });

      catalogSheet.addRow([]);
      const noteRow = catalogSheet.addRow(["Ghi chú: [lấy từ bảng phân công giảng viên bộ môn]"]);
      noteRow.font = { name: "Times New Roman", size: 10, italic: true };

      // 2. Build Per-Class Sheets (Formatted 100% according to Images 2, 3, 4, 5 & 4-week blocks)
      const daysConfig = [
        { day: 2, label: "Thứ Hai" },
        { day: 3, label: "Thứ Ba" },
        { day: 4, label: "Thứ Tư" },
        { day: 5, label: "Thứ Năm" },
        { day: 6, label: "Thứ Sáu" },
        { day: 7, label: "Thứ Bảy" },
        { day: 8, label: "Chủ Nhật" }
      ];

      // Date helper for formatted calendar date (DD/MM/YYYY)
      const getFormattedDateForWeekDay = (weekNum: number, dayOfWeek: number): string => {
        const base = new Date(2026, 7, 10); // Monday August 10, 2026
        const dayOffset = (weekNum - 1) * 7 + (dayOfWeek - 2);
        const targetDate = new Date(base.getTime() + dayOffset * 86400000);
        const dd = String(targetDate.getDate()).padStart(2, "0");
        const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
        const yyyy = targetDate.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };

      exportClasses.forEach(clsId => {
        const sheetName = clsId.slice(0, 31);
        const sheet = workbook.addWorksheet(sheetName);

        // Page Setup matching Attached Image 1 & Image 2 (Landscape, 75%, Left: 3.8cm, Right: 0cm)
        sheet.pageSetup = {
          orientation: "landscape",
          paperSize: 9, // A4
          scale: 75,
          fitToWidth: 1,
          fitToHeight: 0,
          margins: {
            top: 0.75,    // 1.9 cm
            bottom: 0.75, // 1.9 cm
            left: 1.5,    // 3.8 cm
            right: 0,     // 0 cm
            header: 0.31, // 0.8 cm
            footer: 0.31  // 0.8 cm
          }
        };

        sheet.headerFooter = {
          oddFooter: `&C ${clsId}`,
          evenFooter: `&C ${clsId}`
        };

        // 9 Columns A -> I matching Image 5
        sheet.columns = [
          { width: 16 }, // A: Mã lớp
          { width: 16 }, // B: Tên lớp
          { width: 12 }, // C: Thứ
          { width: 16 }, // D: Ngày, tháng, năm
          { width: 10 }, // E: Buổi
          { width: 32 }, // F: Môn học
          { width: 12 }, // G: Tiết
          { width: 20 }, // H: Phòng học
          { width: 16 }  // I: Hình thức học
        ];

        const clsSchedules = schedules.filter(s => normalizeClassId(s.classId) === normalizeClassId(clsId));

        // 4-Week Block grouping: Block 1 (1-4), Block 2 (5-8), Block 3 (9-12), Block 4 (13-16)...
        const totalWeeksInSemester = 16;
        const blocksToExport: { start: number; end: number }[] = [];

        if (selectedScheduleWeek && selectedScheduleWeek > 0) {
          const blockStart = Math.floor((selectedScheduleWeek - 1) / 4) * 4 + 1;
          const blockEnd = Math.min(blockStart + 3, totalWeeksInSemester);
          blocksToExport.push({ start: blockStart, end: blockEnd });
        } else {
          for (let w = 1; w <= totalWeeksInSemester; w += 4) {
            blocksToExport.push({ start: w, end: Math.min(w + 3, totalWeeksInSemester) });
          }
        }

        let currentRow = 1;

        blocksToExport.forEach((block, blockIdx) => {
          if (blockIdx > 0) {
            currentRow += 2; // Spacer between blocks
          }

          // Row 1: Header Titles
          sheet.mergeCells(`A${currentRow}:C${currentRow}`);
          const a1 = sheet.getCell(`A${currentRow}`);
          a1.value = "PHÂN HIỆU ĐHTN TẠI HÀ GIANG\nPHÒNG ĐÀO TẠO NCKH & HTQT";
          a1.font = { name: "Times New Roman", size: 10, bold: true };
          a1.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

          sheet.mergeCells(`D${currentRow}:I${currentRow}`);
          const d1 = sheet.getCell(`D${currentRow}`);
          d1.value = `THỜI KHÓA BIỂU HỌC KÌ II, NĂM HỌC 2025 - 2026\nLỚP ${clsId}`;
          d1.font = { name: "Times New Roman", size: 11, bold: true };
          d1.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          sheet.getRow(currentRow).height = 36;

          currentRow++;

          // Row 2: Subtitle (Block Range e.g. Tuần: 1 - 4, Tuần: 5 - 8)
          sheet.mergeCells(`D${currentRow}:I${currentRow}`);
          const d2 = sheet.getCell(`D${currentRow}`);
          d2.value = `Tuần: ${block.start} - ${block.end}`;
          d2.font = { name: "Times New Roman", size: 10, italic: true };
          d2.alignment = { vertical: "middle", horizontal: "center" };
          sheet.getRow(currentRow).height = 22;

          currentRow++;

          // Build weeks inside this block (e.g. week 1, 2, 3, 4)
          for (let w = block.start; w <= block.end; w++) {
            // Subtitle above each week table: "Tuần: X"
            sheet.mergeCells(`D${currentRow}:I${currentRow}`);
            const wCell = sheet.getCell(`D${currentRow}`);
            wCell.value = `Tuần: ${w}`;
            wCell.font = { name: "Times New Roman", size: 10, bold: true, italic: true };
            wCell.alignment = { vertical: "middle", horizontal: "center" };
            sheet.getRow(currentRow).height = 22;

            currentRow++;

            // Table Header Row
            const headers = ["Mã lớp", "Tên lớp", "Thứ", "Ngày, tháng, năm", "Buổi", "Môn học", "Tiết", "Phòng học", "Hình thức học"];
            const headerRow = sheet.getRow(currentRow);
            headerRow.height = 26;
            headers.forEach((h, colIdx) => {
              const cell = headerRow.getCell(colIdx + 1);
              cell.value = h;
              cell.font = { name: "Times New Roman", size: 11, bold: true };
              cell.alignment = { vertical: "middle", horizontal: "center" };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
              };
            });

            const weekStartRow = currentRow + 1;
            let currentDayRow = weekStartRow;

            daysConfig.forEach(({ day, label }) => {
              const formattedDate = getFormattedDateForWeekDay(w, day);

              // Morning slot
              const morningSlot = clsSchedules.find(s => s.dayOfWeek === day && (!s.session || s.session.trim().toLowerCase() === "sáng") && isWeekInScheduleSlot(s, w));
              const morningRow = sheet.getRow(currentDayRow);
              morningRow.height = 22;
              morningRow.getCell(1).value = clsId;
              morningRow.getCell(2).value = clsId;
              morningRow.getCell(3).value = label;
              morningRow.getCell(4).value = formattedDate;
              morningRow.getCell(5).value = "Sáng";
              morningRow.getCell(6).value = morningSlot?.subjectName || "";
              morningRow.getCell(7).value = morningSlot ? `${morningSlot.periodStart}-${morningSlot.periodEnd}` : "";
              morningRow.getCell(8).value = morningSlot?.room || "";
              morningRow.getCell(9).value = morningSlot?.studyMode || (morningSlot ? "Trực tiếp" : "");

              // Afternoon slot
              const afternoonSlot = clsSchedules.find(s => s.dayOfWeek === day && s.session && s.session.trim().toLowerCase() === "chiều" && isWeekInScheduleSlot(s, w));
              const afternoonRow = sheet.getRow(currentDayRow + 1);
              afternoonRow.height = 22;
              afternoonRow.getCell(1).value = clsId;
              afternoonRow.getCell(2).value = clsId;
              afternoonRow.getCell(3).value = label;
              afternoonRow.getCell(4).value = formattedDate;
              afternoonRow.getCell(5).value = "Chiều";
              afternoonRow.getCell(6).value = afternoonSlot?.subjectName || "";
              afternoonRow.getCell(7).value = afternoonSlot ? `${afternoonSlot.periodStart}-${afternoonSlot.periodEnd}` : "";
              afternoonRow.getCell(8).value = afternoonSlot?.room || "";
              afternoonRow.getCell(9).value = afternoonSlot?.studyMode || (afternoonSlot ? "Trực tiếp" : "");

              // Style cells & borders for these 2 rows
              [currentDayRow, currentDayRow + 1].forEach(rIdx => {
                const rowObj = sheet.getRow(rIdx);
                for (let c = 1; c <= 9; c++) {
                  const cell = rowObj.getCell(c);
                  cell.font = { name: "Times New Roman", size: 10 };
                  cell.alignment = { 
                    vertical: "middle", 
                    horizontal: [1,2,3,4,5,7,9].includes(c) ? "center" : "left", 
                    wrapText: true 
                  };
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                  };
                }
              });

              // Merge Day cell (C) & Date cell (D) for Sáng/Chiều
              sheet.mergeCells(`C${currentDayRow}:C${currentDayRow + 1}`);
              sheet.mergeCells(`D${currentDayRow}:D${currentDayRow + 1}`);

              currentDayRow += 2;
            });

            const weekEndRow = currentDayRow - 1;

            // Merge ClassId (A) & ClassName (B) across all day rows of this week
            sheet.mergeCells(`A${weekStartRow}:A${weekEndRow}`);
            sheet.mergeCells(`B${weekStartRow}:B${weekEndRow}`);

            currentRow = currentDayRow + 1;
          }
        });

        // Signature Footer Block at the end of sheet
        sheet.mergeCells(`G${currentRow + 1}:I${currentRow + 1}`);
        const dateCell = sheet.getCell(`G${currentRow + 1}`);
        dateCell.value = "Tuyên Quang, ngày ... tháng ... năm 2026";
        dateCell.font = { name: "Times New Roman", size: 10, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };

        sheet.mergeCells(`G${currentRow + 3}:I${currentRow + 3}`);
        const signCell = sheet.getCell(`G${currentRow + 3}`);
        signCell.value = "Phòng Đào tạo NCKH & Hợp tác Quốc tế";
        signCell.font = { name: "Times New Roman", size: 11, bold: true };
        signCell.alignment = { vertical: "middle", horizontal: "center" };

        sheet.mergeCells(`G${currentRow + 11}:I${currentRow + 11}`);
        const nameCell = sheet.getCell(`G${currentRow + 11}`);
        nameCell.value = "Danh hiệu. Họ và tên";
        nameCell.font = { name: "Times New Roman", size: 10, italic: true };
        nameCell.alignment = { vertical: "middle", horizontal: "center" };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = targetClassId 
        ? `Mau_Thoi_khoa_bieu_${targetClassId.replace(/\s+/g, "_")}.xlsx`
        : `Mau_Thoi_khoa_bieu_Phan_hieu_Toan_bo.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Lỗi khi tạo file Excel mẫu: " + err);
    }
  };

  const handleImportScheduleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        
        // 1. Read sheet "DANH_MỤC" if present
        const catalogMap = new Map<string, { code: string; credits: number; teacher: string }>();
        const catalogSheet = workbook.Sheets["DANH_MỤC"];
        if (catalogSheet) {
          const rawCatalog = XLSX.utils.sheet_to_json<any[]>(catalogSheet, { header: 1 });
          if (rawCatalog.length > 1) {
            let catHeaderIdx = 0;
            for (let i = 0; i < Math.min(5, rawCatalog.length); i++) {
              if (rawCatalog[i] && rawCatalog[i].some((cell: any) => cell?.toString().trim().toLowerCase().includes("tên học phần"))) {
                catHeaderIdx = i;
                break;
              }
            }
            const catalogHeaders = rawCatalog[catHeaderIdx] as string[];
            if (catalogHeaders && catalogHeaders.length > 0) {
              const catColIdx = {
                subjectName: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase().includes("tên học phần")),
                subjectCode: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase().includes("mã học phần")),
                credits: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase().includes("tín chỉ")),
                teacherName: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase().includes("giảng viên"))
              };

              for (let i = catHeaderIdx + 1; i < rawCatalog.length; i++) {
                const row = rawCatalog[i];
                if (!row || row.length === 0) continue;
                const subjectName = row[catColIdx.subjectName]?.toString().trim();
                if (!subjectName) continue;

                const subjectCode = catColIdx.subjectCode !== -1 && row[catColIdx.subjectCode] ? row[catColIdx.subjectCode]?.toString().trim() : "";
                const creditsVal = catColIdx.credits !== -1 ? Number(row[catColIdx.credits]) : NaN;
                const credits = isNaN(creditsVal) ? 2 : creditsVal;
                const teacherName = catColIdx.teacherName !== -1 && row[catColIdx.teacherName] ? row[catColIdx.teacherName]?.toString().trim() : "Chưa phân công";

                catalogMap.set(subjectName.toLowerCase(), { code: subjectCode, credits, teacher: teacherName });
              }
            }
          }
        }

        const parseDayOfWeek = (val: any): number => {
          if (!val) return 2;
          const str = val.toString().trim().toLowerCase();
          if (str.includes("chủ nhật") || str === "cn" || str.includes("chu nhat")) return 8;
          if (str.includes("hai") || str.includes("2")) return 2;
          if (str.includes("ba") || str.includes("3")) return 3;
          if (str.includes("tư") || str.includes("tu") || str.includes("4")) return 4;
          if (str.includes("năm") || str.includes("nam") || str.includes("5")) return 5;
          if (str.includes("sáu") || str.includes("sau") || str.includes("6")) return 6;
          if (str.includes("bảy") || str.includes("bay") || str.includes("7")) return 7;
          const num = parseInt(str);
          if (!isNaN(num) && num >= 2 && num <= 8) return num;
          return 2;
        };

        const updates: ScheduleSlot[] = [];
        const fallbackColors = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"];
        let itemIndex = 0;

        // 2. Iterate through ALL non-catalog sheets
        const targetSheetNames = workbook.SheetNames.filter(name => name.trim().toUpperCase() !== "DANH_MỤC");

        targetSheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return;

          const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
          if (rawData.length === 0) return;

          let sheetSemester = "II";
          let sheetAcademicYear = "2025-2026";
          let sheetTitleClass = normalizeClassId(sheetName);
          let sheetWeekRange = "1-15";

          // Scan top 4 rows for Title & Subtitle Metadata (Header block of Phân hiệu)
          for (let r = 0; r < Math.min(4, rawData.length); r++) {
            const row = rawData[r];
            if (!row) continue;
            row.forEach((cell: any) => {
              if (!cell) return;
              const cellStr = cell.toString().trim();
              if (cellStr.toUpperCase().includes("THỜI KHÓA BIỂU")) {
                const semMatch = cellStr.match(/HỌC KÌ\s+([I|V|X]+|\d+)/i);
                if (semMatch) sheetSemester = semMatch[1].toUpperCase();
                const yearMatch = cellStr.match(/NĂM HỌC\s+(\d{4}\s*-\s*\d{4})/i);
                if (yearMatch) sheetAcademicYear = yearMatch[1];
                const classMatch = cellStr.match(/LỚP\s+(.+)/i);
                if (classMatch) sheetTitleClass = normalizeClassId(classMatch[1].trim());
              }
              if (cellStr.toLowerCase().includes("tuần:")) {
                const weekMatch = cellStr.match(/Tuần:\s*([\d\s\-,]+)/i);
                if (weekMatch) sheetWeekRange = weekMatch[1].trim();
              }
            });
          }

          // Find header row containing "Môn học" or "Mã lớp"
          let headerIdx = -1;
          for (let r = 0; r < Math.min(10, rawData.length); r++) {
            const row = rawData[r];
            if (row && row.some((cell: any) => {
              const str = cell?.toString().trim().toLowerCase() || "";
              return str.includes("môn học") || str.includes("mã lớp");
            })) {
              headerIdx = r;
              break;
            }
          }

          if (headerIdx === -1) return;

          const headers = rawData[headerIdx] as string[];
          const schedColIdx = {
            classId: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("mã lớp")),
            className: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("tên lớp")),
            dayOfWeek: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("thứ")),
            session: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("buổi")),
            subjectName: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("môn học")),
            period: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("tiết")),
            room: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("phòng")),
            semester: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("học kỳ")),
            weekRange: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("tuần")),
            academicYear: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("năm học")),
            studyMode: headers.findIndex(h => h?.toString().trim().toLowerCase().includes("hình thức"))
          };

          if (schedColIdx.subjectName === -1) return;

          const fallbackClassId = sheetTitleClass || normalizeClassId(sheetName);

          let currentClassId = fallbackClassId;
          let currentClassName = fallbackClassId;
          let currentDayOfWeek = 2;

          for (let i = headerIdx + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const rawSubjectName = schedColIdx.subjectName !== -1 && row[schedColIdx.subjectName] ? row[schedColIdx.subjectName]?.toString().trim() : "";
            if (!rawSubjectName || rawSubjectName.toLowerCase().startsWith("danh hiệu") || rawSubjectName.toLowerCase().startsWith("phòng đào tạo") || rawSubjectName.toLowerCase().startsWith("[tỉnh")) {
              continue; // Skip footer signature rows
            }

            if (schedColIdx.classId !== -1 && row[schedColIdx.classId]) {
              currentClassId = normalizeClassId(row[schedColIdx.classId]?.toString().trim());
            }
            if (schedColIdx.className !== -1 && row[schedColIdx.className]) {
              currentClassName = normalizeClassId(row[schedColIdx.className]?.toString().trim());
            }
            if (schedColIdx.dayOfWeek !== -1 && row[schedColIdx.dayOfWeek]) {
              currentDayOfWeek = parseDayOfWeek(row[schedColIdx.dayOfWeek]);
            }

            const classIdToUse = currentClassId || fallbackClassId;
            const classNameToUse = currentClassName || classIdToUse;

            const session = schedColIdx.session !== -1 && row[schedColIdx.session] ? row[schedColIdx.session]?.toString().trim() : "Sáng";
            const room = schedColIdx.room !== -1 && row[schedColIdx.room] ? row[schedColIdx.room]?.toString().trim() : "Phòng học";
            const semester = schedColIdx.semester !== -1 && row[schedColIdx.semester] ? row[schedColIdx.semester]?.toString().trim() : sheetSemester;
            const weekRange = schedColIdx.weekRange !== -1 && row[schedColIdx.weekRange] ? row[schedColIdx.weekRange]?.toString().trim() : sheetWeekRange;
            const { startWeek, endWeek } = parseWeekRange(weekRange);
            const academicYear = schedColIdx.academicYear !== -1 && row[schedColIdx.academicYear] ? row[schedColIdx.academicYear]?.toString().trim() : sheetAcademicYear;
            const studyMode = schedColIdx.studyMode !== -1 && row[schedColIdx.studyMode] ? row[schedColIdx.studyMode]?.toString().trim() : "Trực tiếp";

            let periodStart = 1;
            let periodEnd = 3;
            if (schedColIdx.period !== -1 && row[schedColIdx.period]) {
              const periodStr = row[schedColIdx.period].toString().trim();
              const periodMatch = periodStr.match(/(\d+)\s*-\s*(\d+)/);
              if (periodMatch) {
                periodStart = parseInt(periodMatch[1]);
                periodEnd = parseInt(periodMatch[2]);
              }
            }

            const lookupKey = rawSubjectName.toLowerCase();
            const meta = catalogMap.get(lookupKey) || {
              code: `HP_${rawSubjectName.replace(/\s+/g, "")}`,
              credits: 2,
              teacher: "Chưa phân công"
            };

            itemIndex++;
            updates.push({
              id: `SCH_IMPORT_${itemIndex}_${Date.now()}`,
              classId: classIdToUse,
              className: classNameToUse,
              subjectName: rawSubjectName,
              subjectCode: meta.code,
              credits: meta.credits,
              teacherName: meta.teacher,
              dayOfWeek: currentDayOfWeek,
              session,
              periodStart,
              periodEnd,
              room,
              semester,
              semesterId: selectedScheduleSemesterId,
              weekRange,
              startWeek,
              endWeek,
              academicYear,
              studyMode,
              colorHex: fallbackColors[itemIndex % fallbackColors.length]
            });
          }
        });

        if (updates.length === 0) {
          alert("Không tìm thấy dữ liệu thời khóa biểu hợp lệ nào trong tệp Excel!");
          return;
        }

        setSchedulePreviewData(updates);
        setShowSchedulePreview(true);
      } catch (err) {
        alert("Lỗi khi đọc file Excel: " + err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyScheduleImport = () => {
    importScheduleData(schedulePreviewData);
    setShowSchedulePreview(false);
    setSchedulePreviewData([]);
    alert("Thời khóa biểu toàn trường đã được đồng bộ & khóa chính thức thành công!");
  };

  // State & Handlers for Manual Schedule Entry & Anti-duplication Engine
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScheduleSlot, setEditingScheduleSlot] = useState<ScheduleSlot | null>(null);
  const [scheduleModalData, setScheduleModalData] = useState<Partial<ScheduleSlot>>({
    classId: "K2-GDTH A",
    className: "K2-GDTH A",
    subjectName: "",
    subjectCode: "",
    credits: 2,
    teacherName: "",
    dayOfWeek: 2,
    session: "Sáng",
    periodStart: 1,
    periodEnd: 3,
    room: "Phòng 201 - Nhà B",
    semester: "II",
    semesterId: "HOCKY_2_2025_2026",
    weekRange: "1-15",
    academicYear: "2025-2026",
    studyMode: "Trực tiếp"
  });
  const [scheduleConflictError, setScheduleConflictError] = useState<string | null>(null);

  const checkScheduleConflict = (
    newSlot: Partial<ScheduleSlot>,
    existingSchedules: ScheduleSlot[],
    excludeId?: string
  ): { hasConflict: boolean; message?: string } => {
    if (!newSlot.dayOfWeek || !newSlot.periodStart || !newSlot.periodEnd || !newSlot.weekRange) {
      return { hasConflict: false };
    }

    const { startWeek: newStartW, endWeek: newEndW } = parseWeekRange(newSlot.weekRange || "1-15");
    const newClassId = normalizeClassId(newSlot.classId || "");
    const newRoom = (newSlot.room || "").trim().toLowerCase();
    const newTeacher = (newSlot.teacherName || "").trim().toLowerCase();

    for (const s of existingSchedules) {
      if (excludeId && s.id === excludeId) continue;
      if (newSlot.semesterId && s.semesterId && newSlot.semesterId !== s.semesterId) continue;

      if (s.dayOfWeek !== Number(newSlot.dayOfWeek)) continue;

      const periodOverlap = (Number(newSlot.periodStart) <= s.periodEnd && s.periodStart <= Number(newSlot.periodEnd));
      if (!periodOverlap) continue;

      const { startWeek: sStartW, endWeek: sEndW } = parseWeekRange(s.weekRange || "1-15");
      const weekOverlap = (newStartW <= sEndW && sStartW <= newEndW);
      if (!weekOverlap) continue;

      const sClassId = normalizeClassId(s.classId);
      const sRoom = (s.room || "").trim().toLowerCase();
      const sTeacher = (s.teacherName || "").trim().toLowerCase();

      if (newClassId && sClassId && newClassId === sClassId) {
        return {
          hasConflict: true,
          message: `⚠️ Trùng lịch Lớp: Lớp ${s.classId} đã có ca học môn '${s.subjectName}' vào Thứ ${s.dayOfWeek === 8 ? "Chủ Nhật" : s.dayOfWeek} (Tiết ${s.periodStart}-${s.periodEnd}), Tuần ${s.weekRange || "1-15"}.`
        };
      }

      if (newRoom && sRoom && newRoom === sRoom) {
        return {
          hasConflict: true,
          message: `⚠️ Trùng lịch Phòng học: Phòng '${s.room}' đã được xếp cho Lớp ${s.classId} học môn '${s.subjectName}' vào Thứ ${s.dayOfWeek === 8 ? "Chủ Nhật" : s.dayOfWeek} (Tiết ${s.periodStart}-${s.periodEnd}), Tuần ${s.weekRange || "1-15"}.`
        };
      }

      if (newTeacher && sTeacher && newTeacher === sTeacher && newTeacher !== "chưa phân công") {
        return {
          hasConflict: true,
          message: `⚠️ Trùng lịch Giảng viên: Giảng viên '${s.teacherName}' đã có lịch dạy Lớp ${s.classId} môn '${s.subjectName}' vào Thứ ${s.dayOfWeek === 8 ? "Chủ Nhật" : s.dayOfWeek} (Tiết ${s.periodStart}-${s.periodEnd}), Tuần ${s.weekRange || "1-15"}.`
        };
      }
    }

    return { hasConflict: false };
  };

  const handleOpenAddScheduleModal = () => {
    handleOpenAddScheduleBatchModal();
  };

  // Batch Excel-like Grid State & Handlers
  const [showScheduleBatchModal, setShowScheduleBatchModal] = useState(false);
  const [batchGridRows, setBatchGridRows] = useState<Array<Partial<ScheduleSlot>>>([]);
  const [batchRowErrors, setBatchRowErrors] = useState<{ [index: number]: string }>({});

  const handleOpenAddScheduleBatchModal = () => {
    const defaultClass = selectedScheduleClass || "K2-GDTH A";
    const defaultSemId = selectedScheduleSemesterId || "HOCKY_2_2025_2026";
    const initialRows: Array<Partial<ScheduleSlot>> = [
      {
        classId: defaultClass,
        className: defaultClass,
        subjectName: "",
        subjectCode: "",
        credits: 2,
        teacherName: "",
        dayOfWeek: 2,
        session: "Sáng",
        periodStart: 1,
        periodEnd: 3,
        room: "Phòng 201 - Nhà B",
        semester: "II",
        semesterId: defaultSemId,
        weekRange: "1-15",
        academicYear: "2025-2026",
        studyMode: "Trực tiếp"
      },
      {
        classId: defaultClass,
        className: defaultClass,
        subjectName: "",
        subjectCode: "",
        credits: 2,
        teacherName: "",
        dayOfWeek: 3,
        session: "Sáng",
        periodStart: 1,
        periodEnd: 3,
        room: "Phòng 201 - Nhà B",
        semester: "II",
        semesterId: defaultSemId,
        weekRange: "1-15",
        academicYear: "2025-2026",
        studyMode: "Trực tiếp"
      },
      {
        classId: defaultClass,
        className: defaultClass,
        subjectName: "",
        subjectCode: "",
        credits: 2,
        teacherName: "",
        dayOfWeek: 4,
        session: "Sáng",
        periodStart: 1,
        periodEnd: 3,
        room: "Phòng 201 - Nhà B",
        semester: "II",
        semesterId: defaultSemId,
        weekRange: "1-15",
        academicYear: "2025-2026",
        studyMode: "Trực tiếp"
      }
    ];

    setBatchGridRows(initialRows);
    setBatchRowErrors({});
    setShowScheduleBatchModal(true);
  };

  const handleAddBatchRow = (count: number = 1) => {
    const defaultClass = selectedScheduleClass || "K2-GDTH A";
    const defaultSemId = selectedScheduleSemesterId || "HOCKY_2_2025_2026";
    const lastRow = batchGridRows[batchGridRows.length - 1];

    const newRows: Array<Partial<ScheduleSlot>> = Array.from({ length: count }, (_, idx) => ({
      classId: lastRow?.classId || defaultClass,
      className: lastRow?.className || defaultClass,
      subjectName: "",
      subjectCode: "",
      credits: lastRow?.credits || 2,
      teacherName: lastRow?.teacherName || "",
      dayOfWeek: lastRow ? (lastRow.dayOfWeek && lastRow.dayOfWeek < 8 ? lastRow.dayOfWeek + 1 : 2) : (2 + (idx % 6)),
      session: lastRow?.session || "Sáng",
      periodStart: lastRow?.periodStart || 1,
      periodEnd: lastRow?.periodEnd || 3,
      room: lastRow?.room || "Phòng học",
      semester: lastRow?.semester || "II",
      semesterId: lastRow?.semesterId || defaultSemId,
      weekRange: lastRow?.weekRange || "1-15",
      academicYear: lastRow?.academicYear || "2025-2026",
      studyMode: lastRow?.studyMode || "Trực tiếp"
    }));

    setBatchGridRows([...batchGridRows, ...newRows]);
  };

  const handleDuplicateBatchRow = (index: number) => {
    const rowToClone = batchGridRows[index];
    if (!rowToClone) return;
    const cloned: Partial<ScheduleSlot> = {
      ...rowToClone,
      dayOfWeek: rowToClone.dayOfWeek && rowToClone.dayOfWeek < 8 ? rowToClone.dayOfWeek + 1 : 2
    };
    const updated = [...batchGridRows];
    updated.splice(index + 1, 0, cloned);
    setBatchGridRows(updated);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchGridRows.length <= 1) {
      alert("Phải giữ lại ít nhất 1 hàng!");
      return;
    }
    const updated = batchGridRows.filter((_, idx) => idx !== index);
    setBatchGridRows(updated);
    const newErrors = { ...batchRowErrors };
    delete newErrors[index];
    setBatchRowErrors(newErrors);
  };

  const handleUpdateBatchRowCell = (index: number, field: keyof ScheduleSlot, value: any) => {
    const updated = [...batchGridRows];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    if (field === "classId") {
      updated[index].className = value;
    }
    setBatchGridRows(updated);
    if (batchRowErrors[index]) {
      const newErrors = { ...batchRowErrors };
      delete newErrors[index];
      setBatchRowErrors(newErrors);
    }
  };

  const handleSaveScheduleBatch = () => {
    const validRowsToSave: ScheduleSlot[] = [];
    const errors: { [index: number]: string } = {};

    batchGridRows.forEach((row, idx) => {
      if (!row.subjectName || !row.subjectName.trim()) {
        return; // skip blank rows
      }

      if (!row.classId || !row.classId.trim()) {
        errors[idx] = "Thiếu tên/mã Lớp học!";
        return;
      }

      const { startWeek, endWeek } = parseWeekRange(row.weekRange || "1-15");
      const slot: ScheduleSlot = {
        id: `SCH_BATCH_${Date.now()}_${idx}`,
        classId: normalizeClassId(row.classId || "K2-GDTH A"),
        className: normalizeClassId(row.className || row.classId || "K2-GDTH A"),
        subjectName: row.subjectName.trim(),
        subjectCode: row.subjectCode?.trim() || `HP_${row.subjectName.trim().replace(/\s+/g, "")}`,
        credits: Number(row.credits) || 2,
        teacherName: row.teacherName?.trim() || "Chưa phân công",
        dayOfWeek: Number(row.dayOfWeek) || 2,
        session: row.session || "Sáng",
        periodStart: Number(row.periodStart) || 1,
        periodEnd: Number(row.periodEnd) || 3,
        room: row.room?.trim() || "Phòng học",
        semester: row.semester || "II",
        semesterId: row.semesterId || selectedScheduleSemesterId || "HOCKY_2_2025_2026",
        weekRange: row.weekRange || "1-15",
        startWeek,
        endWeek,
        academicYear: row.academicYear || "2025-2026",
        studyMode: row.studyMode || "Trực tiếp",
        colorHex: "#4F46E5"
      };

      // Check conflict against existing system schedules
      const sysConflict = checkScheduleConflict(slot, schedules);
      if (sysConflict.hasConflict) {
        errors[idx] = sysConflict.message || "Xung đột lịch học trên hệ thống!";
        return;
      }

      // Check conflict against other rows in the batch list
      const batchConflict = checkScheduleConflict(slot, validRowsToSave);
      if (batchConflict.hasConflict) {
        errors[idx] = `Trùng lịch với một hàng khác trong bảng: ${batchConflict.message}`;
        return;
      }

      validRowsToSave.push(slot);
    });

    if (Object.keys(errors).length > 0) {
      setBatchRowErrors(errors);
      alert(`Phát hiện ${Object.keys(errors).length} hàng bị trùng lặp hoặc thiếu thông tin! Vui lòng kiểm tra các ô màu đỏ trong bảng.`);
      return;
    }

    if (validRowsToSave.length === 0) {
      alert("Vui lòng điền Tên môn học cho ít nhất 1 hàng trong bảng!");
      return;
    }

    importScheduleData([...schedules, ...validRowsToSave]);
    setShowScheduleBatchModal(false);
    setBatchGridRows([]);
    setBatchRowErrors({});
    alert(`Đã lưu thành công ${validRowsToSave.length} ca học mới vào thời khóa biểu!`);
  };

  const handleOpenEditScheduleModal = (slot: ScheduleSlot) => {
    setEditingScheduleSlot(slot);
    setScheduleModalData({ ...slot });
    setScheduleConflictError(null);
    setShowScheduleModal(true);
  };

  const handleSaveScheduleModal = () => {
    if (!scheduleModalData.subjectName?.trim()) {
      alert("Vui lòng nhập Tên môn học!");
      return;
    }
    if (!scheduleModalData.classId?.trim()) {
      alert("Vui lòng chọn hoặc nhập Tên Lớp!");
      return;
    }

    const { startWeek, endWeek } = parseWeekRange(scheduleModalData.weekRange || "1-15");
    const slotToSave: ScheduleSlot = {
      id: editingScheduleSlot ? editingScheduleSlot.id : `SCH_MANUAL_${Date.now()}`,
      classId: normalizeClassId(scheduleModalData.classId || "K2-GDTH A"),
      className: normalizeClassId(scheduleModalData.className || scheduleModalData.classId || "K2-GDTH A"),
      subjectName: scheduleModalData.subjectName.trim(),
      subjectCode: scheduleModalData.subjectCode?.trim() || `HP_${scheduleModalData.subjectName.trim().replace(/\s+/g, "")}`,
      credits: Number(scheduleModalData.credits) || 2,
      teacherName: scheduleModalData.teacherName?.trim() || "Chưa phân công",
      dayOfWeek: Number(scheduleModalData.dayOfWeek) || 2,
      session: scheduleModalData.session || "Sáng",
      periodStart: Number(scheduleModalData.periodStart) || 1,
      periodEnd: Number(scheduleModalData.periodEnd) || 3,
      room: scheduleModalData.room?.trim() || "Phòng học",
      semester: scheduleModalData.semester || "II",
      semesterId: scheduleModalData.semesterId || selectedScheduleSemesterId,
      weekRange: scheduleModalData.weekRange || "1-15",
      startWeek,
      endWeek,
      academicYear: scheduleModalData.academicYear || "2025-2026",
      studyMode: scheduleModalData.studyMode || "Trực tiếp",
      colorHex: editingScheduleSlot?.colorHex || "#4F46E5"
    };

    // Run collision check
    const conflict = checkScheduleConflict(slotToSave, schedules, editingScheduleSlot?.id);
    if (conflict.hasConflict) {
      setScheduleConflictError(conflict.message || "Xung đột lịch học!");
      return;
    }

    if (editingScheduleSlot) {
      const updatedSchedules = schedules.map(s => s.id === editingScheduleSlot.id ? slotToSave : s);
      importScheduleData(updatedSchedules);
    } else {
      importScheduleData([...schedules, slotToSave]);
    }

    setShowScheduleModal(false);
    setEditingScheduleSlot(null);
    setScheduleConflictError(null);
  };

  const handleDeleteScheduleSlot = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ca học này khỏi thời khóa biểu không?")) {
      const updated = schedules.filter(s => s.id !== id);
      importScheduleData(updated);
    }
  };

  const startEdit = (studentId: string) => {
    const s = students.find(item => item.id === studentId);
    if (s) {
      setSelectedStudentId(studentId);
      const semData = s.academicDataByPeriod?.[selectedSemesterId] || {};
      setEditGpa(semData.gpa ?? s.gpa ?? 3.0);
      setEditCredits(semData.creditsEarned ?? s.creditsEarned ?? 15);
      setEditWarning(semData.learningWarning ?? !!s.learningWarning);
      setEditStatus(semData.learningStatus ?? s.learningStatus ?? "Bình thường");
      setEditGender(s.gender || "Nam");
      setEditDob(s.dob || "2006-01-01");
      setEditPob(s.pob || "Hà Giang");
      setEditEthnicity(s.ethnicity || "Kinh");
      setEditIdCard(s.idCard || "");
      setEditIdCardDate(s.idCardDate || "");
      setEditIdCardPlace(s.idCardPlace || "");
      setEditSubjects(semData.subjects ?? s.subjects ?? "");
      setEditSubjectGrades(semData.subjectGrades ?? s.subjectGrades ?? "");
      setEditGpa10(semData.gpa10 ?? s.gpa10 ?? 8.0);
      setEditAcademicGrade(semData.academicGrade ?? s.academicGrade ?? "Khá");
      setEditNotes(semData.notes ?? s.notes ?? "");
    }
  };

  const saveDetails = () => {
    if (selectedStudentId) {
      importAcademicData([{
        id: selectedStudentId,
        gpa: Number(editGpa),
        creditsEarned: Number(editCredits),
        learningWarning: editWarning,
        learningStatus: editStatus,
        gender: editGender,
        dob: editDob,
        pob: editPob,
        ethnicity: editEthnicity,
        idCard: editIdCard,
        idCardDate: editIdCardDate,
        idCardPlace: editIdCardPlace,
        subjects: editSubjects,
        subjectGrades: editSubjectGrades,
        gpa10: Number(editGpa10),
        academicGrade: editAcademicGrade,
        notes: editNotes
      }], selectedSemesterId);
      setSelectedStudentId(null);
      alert("Đã hiệu chỉnh học vụ thành công.");
    }
  };

  return (
    <div className="space-y-6" id="training-portal-container">
      {/* Bio Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 uppercase tracking-wider">
            PHÒNG ĐÀO TẠO & KHẢO THÍ HỌC VỤ
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">Cổng Kiểm Toán & Nạp Cơ Sở Học Vị Phân Hiệu</h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            Nạp, đồng bộ khóa học vụ GPA sinh viên, chốt và khởi tạo nhanh các lớp sinh hoạt, tài khoản Ban cán sự lớp đồng quy.
          </p>
        </div>

        <button 
          onClick={toggleLearningDataLock}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all hover:cursor-pointer shrink-0"
        >
          <Lock size={14} />
          <span>Khóa Sổ Toàn Phân Hiệu</span>
        </button>
      </div>

      <div className="w-full space-y-4">
        {/* Action Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          {/* TAB 1: CSV / EXCEL MOCK IMPORTER & DUAL MODE */}
          {activeTab === "IMPORT" && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Nạp & Tổng hợp Điểm Học thuật Học kỳ</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Chọn chế độ nạp trực tiếp file Excel Điểm HK hoặc Tự động tổng hợp từ Bảng điểm các Giảng viên bộ môn.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setImportMode("EXCEL_DIRECT")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      importMode === "EXCEL_DIRECT" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Chế độ 1: Nạp File Excel
                  </button>
                  <button
                    onClick={() => setImportMode("AUTO_AGGREGATE")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      importMode === "AUTO_AGGREGATE" ? "bg-amber-600 text-white shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Chế độ 2: Tự động gom điểm GV
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Chọn học kì đồng bộ dữ liệu:</label>
                <select
                  value={selectedSemesterId}
                  onChange={(e) => setSelectedSemesterId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {SEMESTER_LIST.map(sem => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name}
                    </option>
                  ))}
                </select>
              </div>

              {importMode === "EXCEL_DIRECT" ? (
                <>
                  {/* Action buttons for Real Excel */}
                  <div className="flex gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-4 py-2 border border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-100/50 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Xuất File Excel Mẫu (Chứa danh sách hiện tại)</span>
                    </button>
                    
                    <label className="px-4 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                      <Upload size={14} />
                      <span>Chọn Tệp Excel Đã Nhập Điểm</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Upload zone */}
                  <div 
                    className="border-2 border-dashed border-amber-250 bg-amber-50/10 hover:bg-amber-50/20 p-8 rounded-2xl text-center cursor-pointer transition-colors"
                    onClick={handleMockExcelUpload}
                  >
                    <FileText size={40} className="mx-auto text-amber-500 mb-3" />
                    <h4 className="text-xs font-black text-slate-800">Nhấp vào đây để mô phỏng tải lên tệp Excel Điểm học thuật học kỳ</h4>
                    <p className="text-[10px] text-slate-450 mt-1 max-w-sm mx-auto">Click để mô phỏng tự động nạp dữ liệu lý lịch và kết quả GPA đầy đủ của 3 sinh viên mẫu.</p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-amber-500 to-indigo-900 text-white rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                      <RefreshCw size={18} className="animate-spin-slow" />
                      <span>TỰ ĐỘNG TỔNG HỢP & QUY ĐỔI ĐIỂM HK TỪ GIẢNG VIÊN BỘ MÔN</span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed max-w-2xl">
                      Hệ thống sẽ gom toàn bộ bảng điểm từ các lớp học phần mà các Giảng viên đã chốt nộp trong học kỳ này, tự động tính toán <strong>GPA Thang 10, GPA Thang 4, Xếp loại Học kỳ, Số tín chỉ tích lũy</strong> và gắn cờ <strong>Cảnh báo Học tập</strong> cho sinh viên.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={handleAutoAggregateFromSubjectTeachers}
                        className="px-6 py-3 bg-white text-slate-900 hover:bg-amber-100 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RefreshCw size={16} className="text-amber-600" />
                        <span>THỰC HIỆN TỔNG HỢP TỰ ĐỘNG NGAY</span>
                      </button>
                    </div>
                  </div>

                  {aggregationResultMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                      <span>{aggregationResultMsg}</span>
                    </div>
                  )}

                  {/* Academic Warning System Card */}
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-black text-rose-900 uppercase flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-rose-600" />
                      <span>Hệ Thống Tự Động Gắn Cờ Cảnh Báo Học Tập (Academic Warning System)</span>
                    </h4>
                    <p className="text-xs text-rose-800">
                      Sinh viên có GPA thang 4 &lt; 1.0 hoặc trượt &gt; 50% số tín chỉ đăng ký trong học kỳ sẽ bị hệ thống tự động gắn cờ cảnh báo (Mức 1 / Mức 2) và gửi thông báo tới Cố vấn học tập (GVCN).
                    </p>
                    <div className="text-xs font-bold text-rose-950 font-mono pt-1">
                      Tổng số Sinh viên bị Cảnh báo Học tập trong kỳ: <strong className="text-rose-700 font-black">{students.filter(s => s.learningWarning).length} sinh viên</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview table */}
              {showPreview && (
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                      <Lock size={12} />
                      XEM TRƯỚC BẢNG ĐỒNG BỘ ĐIỂM HỌC VỤ ({previewData.length} dòng)
                    </span>
                    <button 
                      onClick={handleApplyImport}
                      className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg hover:cursor-pointer shadow-sm transition-all"
                    >
                      Xác nhận & Đồng bộ vào CSDL
                    </button>
                  </div>

                  <div className="border border-slate-200 bg-white rounded-lg overflow-x-auto text-[11.5px] font-mono">
                    <table className="min-w-[1000px] w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Mã SV</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Họ & Tên</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Lớp</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Giới tính</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Ngày sinh</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Quê quán</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Dân tộc</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Số CCCD</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Điểm HP 1-8</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono text-center">Hệ 10</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono text-center">Hệ 4 (GPA)</th>
                          <th className="p-2.5 text-[10px] uppercase tracking-wider font-mono">Xếp loại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {previewData.map(row => {
                          const origin = students.find(s => s.id === row.id);
                          return (
                            <tr key={row.id} className="hover:bg-slate-50/50">
                              <td className="p-2 font-bold">{formatStudentId(row.id)}</td>
                              <td className="p-2 truncate max-w-[120px]">{row.name || origin?.name}</td>
                              <td className="p-2">{row.classId || origin?.classId}</td>
                              <td className="p-2">{row.gender}</td>
                              <td className="p-2 font-sans">{row.dob}</td>
                              <td className="p-2 truncate max-w-[100px]">{row.pob}</td>
                              <td className="p-2">{row.ethnicity}</td>
                              <td className="p-2 font-mono text-[10px]">{row.idCard}</td>
                              <td className="p-2 font-mono text-[11px] text-slate-650" title={row.subjectGrades}>{row.subjectGrades || "-"}</td>
                              <td className="p-2 text-center font-bold">{row.gpa10.toFixed(2)}</td>
                              <td className="p-2 text-center font-bold text-blue-650">
                                {row.gpa.toFixed(2)}
                                {origin?.gpa !== undefined && (
                                  <span className="text-[9px] text-slate-400 block font-normal">
                                    Cũ: {origin.gpa.toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="p-2 font-sans font-bold text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded ${
                                  row.gpa >= 3.6 ? "bg-emerald-50 text-emerald-700" :
                                  row.gpa >= 3.2 ? "bg-blue-50 text-blue-700" :
                                  row.gpa >= 2.5 ? "bg-purple-50 text-purple-700" :
                                  row.gpa >= 2.0 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                  {row.academicGrade || "Khá"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-slate-50 border flex gap-3.5 items-start text-[11px] text-slate-600 leading-relaxed">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cơ chế cộng rèn luyện tự động từ Học lực GPA:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>GPA &ge; 3.6: Loại Xuất sắc, auto cộng tối đa 20 điểm rèn luyện (TC1.1).</li>
                    <li>GPA &ge; 3.2: Loại Giỏi, auto cộng 18 điểm rèn luyện (TC1.2).</li>
                    <li>GPA &ge; 2.5: Loại Khá, cộng 15 điểm rèn luyện (TC1.3).</li>
                    <li>Học lực Cảnh báo học phẩm: Auto phạt trừ 5 điểm rèn luyện (TC1.5).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TEACHER ASSIGNMENTS */}
          {activeTab === "TEACHER_ASSIGNMENTS" && (
            <div className="space-y-6 text-left font-sans">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Kế hoạch Phân công Giảng dạy theo Học kỳ</h3>
                  <p className="text-[11px] text-slate-500">Phòng Đào tạo gán môn học, số tín chỉ và phân công Giảng viên phụ trách cho từng lớp học phần.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {SEMESTER_LIST.map(sem => (
                      <option key={sem.id} value={sem.id}>{sem.name}</option>
                    ))}
                  </select>

                  {/* Dropdown Lọc theo Lớp */}
                  <select
                    value={selectedAssignmentClass}
                    onChange={(e) => setSelectedAssignmentClass(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tất cả các lớp học</option>
                    {Array.from(new Set([
                      ...students.map(s => normalizeClassId(s.classId)),
                      ...customClasses.map(c => normalizeClassId(c)),
                      ...teacherAssignments.map(a => normalizeClassId(a.classId))
                    ])).filter(Boolean).sort().map(cls => (
                      <option key={cls} value={cls}>Lớp {cls}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportAssignmentSampleExcel}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Tải tệp Excel phân công giảng dạy chuẩn mẫu"
                  >
                    <Download size={13} />
                    <span>Xuất Excel Mẫu</span>
                  </button>

                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Upload size={13} />
                    <span>Nạp Excel Phân công</span>
                    <input type="file" accept=".xlsx, .xls" onChange={handleImportAssignmentExcel} className="hidden" />
                  </label>

                  <button
                    onClick={() => setShowAddAssignmentModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus size={13} />
                    <span>Thêm thủ công</span>
                  </button>

                  <button
                    onClick={handleSendDeadlineReminders}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Bell size={13} />
                    <span>Nhắc nhở deadline</span>
                  </button>

                  {selectedAssignmentIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteAssignments}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                      title="Xóa tất cả các phân công giảng dạy đã chọn"
                    >
                      <Trash2 size={13} />
                      <span>Xóa đã chọn ({selectedAssignmentIds.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowRulesModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sliders size={13} />
                    <span>Quy tắc & Trọng số</span>
                  </button>
                </div>
              </div>

              {reminderSuccessMsg && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs">
                  <Bell size={16} className="text-amber-600 shrink-0" />
                  <span>{reminderSuccessMsg}</span>
                </div>
              )}

              {/* Progress Monitor Matrix */}
              {(() => {
                const semAssignments = teacherAssignments.filter(a => a.semesterId === selectedSemesterId);
                const total = semAssignments.length;
                const submittedCount = semAssignments.filter(a => {
                  const s = subjectGradeSheets.find(sheet => sheet.semesterId === a.semesterId && sheet.classId === a.classId && sheet.subjectCode === a.subjectCode);
                  return s?.status === "SUBMITTED" || s?.status === "LOCKED";
                }).length;
                const pendingCount = total - submittedCount;
                const percent = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tổng số lớp môn học</div>
                      <div className="text-xl font-black text-slate-800 mt-1">{total} <span className="text-xs font-normal text-slate-500">lớp</span></div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-900 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-emerald-600">Đã chốt nộp điểm</div>
                      <div className="text-xl font-black mt-1">{submittedCount} <span className="text-xs font-normal text-emerald-700">lớp</span></div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-amber-600">Chưa nộp / Đang lưu nháp</div>
                      <div className="text-xl font-black mt-1">{pendingCount} <span className="text-xs font-normal text-amber-700">lớp</span></div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-indigo-900 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-indigo-600">Tiến độ nộp điểm toàn kỳ</div>
                      <div className="text-xl font-black mt-1">{percent}% <span className="text-xs font-normal text-indigo-700">hoàn thành</span></div>
                    </div>
                  </div>
                );
              })()}

              {/* Assignments Table */}
              {(() => {
                const currentSemAssignments = teacherAssignments.filter(a => {
                  const matchSem = a.semesterId === selectedSemesterId;
                  const matchClass = selectedAssignmentClass === "ALL" || normalizeClassId(a.classId) === normalizeClassId(selectedAssignmentClass);
                  return matchSem && matchClass;
                });
                const isAllSelected = currentSemAssignments.length > 0 && currentSemAssignments.every(a => selectedAssignmentIds.includes(a.id));

                return (
                  <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={() => handleToggleSelectAllAssignments(currentSemAssignments)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title="Chọn / Bỏ chọn tất cả"
                            />
                          </th>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-32 font-mono">Mã HP</th>
                          <th className="p-3">Tên Học Phần</th>
                          <th className="p-3 text-center w-16">Số TC</th>
                          <th className="p-3 w-32">Lớp Niên Chế</th>
                          <th className="p-3">Giảng viên Đảm Nhận</th>
                          <th className="p-3 text-center w-28">Trạng thái Nộp</th>
                          <th className="p-3 text-right w-24">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentSemAssignments.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                              Chưa có phân công nào trong học kỳ này. Bấm "Xuất Excel Mẫu", "Nạp Excel Phân công" hoặc "Thêm thủ công" để tạo mới.
                            </td>
                          </tr>
                        ) : (
                          currentSemAssignments.map((item, idx) => {
                            const sheet = subjectGradeSheets.find(s => s.semesterId === item.semesterId && s.classId === item.classId && s.subjectCode === item.subjectCode);
                            const isSubmitted = sheet?.status === "SUBMITTED" || sheet?.status === "LOCKED";
                            const isDraft = sheet?.status === "DRAFT";
                            const isRowSelected = selectedAssignmentIds.includes(item.id);

                            return (
                              <tr key={item.id} className={`transition-colors ${isRowSelected ? "bg-blue-50/60" : "hover:bg-slate-50/80"}`}>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isRowSelected}
                                    onChange={() => handleToggleSelectAssignment(item.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-3 font-mono font-bold text-blue-700">{item.subjectCode}</td>
                                <td className="p-3 font-bold text-slate-900">{item.subjectName}</td>
                                <td className="p-3 text-center font-mono font-bold text-slate-700">{item.credits}</td>
                                <td className="p-3 font-mono font-bold text-slate-800">{item.classId}</td>
                                <td className="p-3 text-slate-800 font-medium">
                                  {item.teacherName}
                                  <span className="block text-[10px] font-mono text-slate-400">{item.teacherId}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isSubmitted
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : isDraft
                                      ? "bg-blue-50 text-blue-800 border-blue-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}>
                                    {isSubmitted ? "Đã nộp điểm" : isDraft ? "Đang lưu nháp" : "Chưa nộp điểm"}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditAssignmentModal(item)}
                                      className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded-lg border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                      title="Hiệu chỉnh phân công giảng viên thủ công"
                                    >
                                      <Edit size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSingleAssignment(item)}
                                      className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                      title="Xóa phân công giảng dạy này"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: UNLOCK REQUESTS */}
          {activeTab === "UNLOCK_REQUESTS" && (
            <div className="space-y-6 text-left font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Duyệt Yêu cầu Mở Khóa Sửa Điểm từ Giảng Viên</h3>
                <p className="text-[11px] text-slate-500">Phê duyệt hoặc từ chối đơn đề nghị điều chỉnh điểm của Giảng viên sau khi bảng điểm đã chốt nộp.</p>
              </div>

              <div className="space-y-3">
                {unlockRequests.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Hiện chưa có yêu cầu mở khóa sửa điểm nào từ Giảng viên.
                  </div>
                ) : (
                  unlockRequests.map(req => (
                    <div key={req.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded mr-2">
                            {req.subjectCode} - {req.classId}
                          </span>
                          <strong className="text-xs font-bold text-slate-900">{req.subjectName}</strong>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Gửi lúc: {req.requestedAt}</span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div>Giảng viên yêu cầu: <strong className="text-slate-800">{req.teacherName}</strong> ({req.teacherId})</div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 italic">
                          "{req.reason}"
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          req.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          Trạng thái: {req.status === "PENDING" ? "Chờ duyệt" : req.status === "APPROVED" ? "Đã duyệt mở khóa" : "Đã từ chối"}
                        </span>

                        {req.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => rejectUnlockRequest(req.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => approveUnlockRequest(req.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                            >
                              Phê duyệt mở khóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: GRADE APPEALS */}
          {activeTab === "GRADE_APPEALS" && (
            <div className="space-y-6 text-left font-sans">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Xử lý Đơn Phúc Khảo Điểm Học Phần từ Sinh Viên</h3>
                <p className="text-[11px] text-slate-500">Phòng Đào tạo phối hợp với Giảng viên bộ môn kiểm tra bài thi và cập nhật kết quả phúc khảo.</p>
              </div>

              <div className="space-y-3">
                {gradeAppeals.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Chưa có đơn xin phúc khảo điểm nào trong hệ thống.
                  </div>
                ) : (
                  gradeAppeals.map(appeal => (
                    <div key={appeal.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded mr-2">
                            {appeal.subjectCode} - Lớp {appeal.classId}
                          </span>
                          <strong className="text-xs font-bold text-slate-900">{appeal.subjectName}</strong>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Gửi lúc: {appeal.requestedAt}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>Sinh viên: <strong className="text-slate-800">{appeal.studentName}</strong> ({appeal.studentId})</div>
                        <div>Điểm ban đầu: <strong className="text-rose-700 font-mono font-bold">{appeal.originalGrade}</strong></div>
                        <div className="md:col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 italic">
                          Lý do nộp đơn: "{appeal.reason}"
                        </div>
                        {appeal.response && (
                          <div className="md:col-span-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                            Phản hồi: <strong>{appeal.response}</strong> {appeal.newGrade && `(Điểm mới: ${appeal.newGrade})`}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          appeal.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          appeal.status === "UPDATED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          Trạng thái: {appeal.status === "PENDING" ? "Chờ xử lý" : appeal.status === "UPDATED" ? "Đã điều chỉnh điểm" : "Không điều chỉnh"}
                        </span>

                        {appeal.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                resolveGradeAppeal(appeal.id, "REJECTED", undefined, "Phòng Đào tạo và GV bộ môn đã chấm lại bài thi; giữ nguyên kết quả ban đầu.");
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Giữ nguyên điểm
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppealForResponse(appeal);
                                setAppealNewGrade(appeal.originalGrade);
                                setAppealResponseText("Đã kiểm tra lại bài thi và duyệt điều chỉnh điểm học phần.");
                              }}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-2xs"
                            >
                              Cập nhật điểm phúc khảo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXCEL IMPORT CLASS LISTS AND CREATE MONITOR ACCOUNT */}
          {activeTab === "IMPORT_CLASSES" && (
            <div className="space-y-6 text-left">
              {selectedClassId === null ? (
                // LIST VIEW OF ALL CLASSES
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Quản lý Lớp học & Auto Provisioning</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Phòng Đào tạo chọn lớp để xem chi tiết, nạp thêm danh sách Excel (44 cột), xuất dữ liệu lớp. Sinh viên sẽ đăng nhập bằng Mã SV / CCCD để tự động điền các thông tin còn trống.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddClassModal(true)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 animate-fade-in"
                    >
                      <Plus size={14} />
                      <span>Thêm lớp mới</span>
                    </button>
                  </div>

                  {/* Add Class Inline Form/Modal */}
                  {showAddClassModal && (
                    <div className="bg-slate-50 p-4 rounded-xl border flex gap-3 items-end animate-slide-in">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tên lớp mới (vd: K2-GDTH-A)</label>
                        <input
                          type="text"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          placeholder="Nhập tên lớp..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-800 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (newClassName.trim()) {
                            addNewClass(newClassName);
                            setNewClassName("");
                            setShowAddClassModal(false);
                            alert("Đã thêm lớp thành công!");
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Lưu lớp
                      </button>
                      <button
                        onClick={() => setShowAddClassModal(false)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {/* Grid list of classes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from(new Set([
                      ...students.map(s => normalizeClassId(s.classId)),
                      ...customClasses.map(c => normalizeClassId(c))
                    ])).filter(Boolean).sort().map(clsId => {
                      const classStudents = students.filter(s => s.classId === clsId);
                      // Calculate completeness indicator using full strict profile validator
                      const completedCount = classStudents.filter(s => isStudentProfileComplete(s)).length;
                      
                      return (
                        <div
                          key={clsId}
                          onClick={() => setSelectedClassId(clsId)}
                          className="bg-white hover:bg-slate-50/50 border border-slate-200 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md flex flex-col justify-between relative group"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded text-[9px] font-mono font-bold uppercase">LỚP HỌC</span>
                              
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-mono mr-1">{classStudents.length} SV</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingRenameClassId(clsId);
                                    setRenameClassNameInput(clsId);
                                  }}
                                  className="p-1 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 rounded transition-colors"
                                  title="Đổi tên lớp học này"
                                >
                                  <Edit size={12} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Bạn có chắc chắn muốn xóa Lớp "${clsId}" cùng toàn bộ thông tin sinh viên, thời khóa biểu và phân công giảng dạy của lớp này không?`)) {
                                      deleteClass(clsId);
                                      alert(`Đã xóa thành công Lớp ${clsId}!`);
                                    }
                                  }}
                                  className="p-1 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded transition-colors"
                                  title="Xóa lớp học này"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1 truncate">{clsId}</h4>
                            <p className="text-[10px] text-slate-450">
                              Đã hoàn thành hồ sơ: {completedCount}/{classStudents.length} SV
                            </p>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-indigo-650 font-bold">
                            <span>Quản lý & Nhập/Xuất Excel</span>
                            <ChevronDown size={14} className="-rotate-90 text-indigo-650" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // CLASS DETAIL VIEW (IDENTICAL INTERFACE INSIDE EACH CLASS)
                (() => {
                  const classStudents = students.filter(s => s.classId === selectedClassId);
                  const displayClassStudents = classStudents.filter(s => {
                    if (!classDetailSearchQuery.trim()) return true;
                    const q = classDetailSearchQuery.trim().toLowerCase();
                    const formattedId = formatStudentId(s.id).toLowerCase();
                    const rawId = String(s.id || "").toLowerCase();
                    const name = String(s.name || "").toLowerCase();
                    const idCard = String(s.idCard || "").toLowerCase();
                    const phone = String(s.phone || "").toLowerCase();
                    return name.includes(q) || idCard.includes(q) || formattedId.includes(q) || rawId.includes(q) || phone.includes(q);
                  });
                  
                  return (
                    <div className="space-y-4 animate-fade-in">
                      {/* Back header */}
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedClassId(null)}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-650 hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <ArrowLeft size={16} />
                          </button>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">QUẢN LÝ CHI TIẾT LỚP</span>
                            <h3 className="text-sm font-black text-slate-800 uppercase">{selectedClassId}</h3>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {/* Export Button */}
                          <button
                            onClick={() => handleExportClassStudentsExcel(selectedClassId)}
                            className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <Download size={14} />
                            <span>Xuất Excel (44 cột)</span>
                          </button>

                          {/* Import Button */}
                          <div className="relative">
                            <input
                              type="file"
                              accept=".xlsx, .xls"
                              onChange={(e) => handleImportClassStudentsExcel(e, selectedClassId)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              id={`class-excel-upload-${selectedClassId}`}
                            />
                            <label
                              htmlFor={`class-excel-upload-${selectedClassId}`}
                              className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-750 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <Upload size={14} />
                              <span>Nhập Excel sinh viên</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Class Stats Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-white border rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Tổng số sinh viên</span>
                          <strong className="text-xl font-mono text-slate-800">{classStudents.length} SV</strong>
                        </div>
                        <div className="p-4 bg-white border rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Tài khoản Sinh viên</span>
                          <strong className="text-xs text-indigo-700 font-mono mt-1">Username: Mã SV<br />Password: Số CCCD/CMND</strong>
                        </div>
                        <div className="p-4 bg-white border rounded-xl flex flex-col justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Hoàn thành thông tin cá nhân</span>
                          <strong className="text-xl font-mono text-slate-800">
                            {classStudents.filter(s => isStudentProfileComplete(s)).length} / {classStudents.length} SV
                          </strong>
                        </div>
                      </div>

                      {/* Students table */}
                      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                        <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50 flex-wrap gap-3">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-750 uppercase tracking-wider">Danh sách Sinh viên Lớp {selectedClassId}</h4>
                            <span className="text-[10px] text-slate-400 leading-none font-medium">Bấm "Sửa nhanh" để điền trực tiếp thông tin</span>
                          </div>

                          {/* Search Bar */}
                          <div className="relative min-w-[280px]">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input
                              type="text"
                              placeholder="Tìm theo Họ và tên, CCCD, Mã SV..."
                              value={classDetailSearchQuery}
                              onChange={(e) => setClassDetailSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-7 py-1.5 bg-white border border-slate-250 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs text-slate-800 font-medium placeholder:text-slate-400"
                            />
                            {classDetailSearchQuery && (
                              <button
                                onClick={() => setClassDetailSearchQuery("")}
                                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                                title="Xóa từ khóa"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {classStudents.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-medium">
                            Lớp chưa có sinh viên nào. Vui lòng nạp tệp Excel danh sách sinh viên!
                          </div>
                        ) : displayClassStudents.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-medium">
                            Không tìm thấy sinh viên nào phù hợp với từ khóa "{classDetailSearchQuery}".
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-550 border-b border-slate-150 font-bold">
                                  <th className="p-3 font-mono w-12 text-center">STT</th>
                                  <th className="p-3 font-mono">Mã sinh viên</th>
                                  <th className="p-3 font-mono">Họ và tên</th>
                                  <th className="p-3 font-mono text-center">Giới tính</th>
                                  <th className="p-3 font-mono">Số CCCD</th>
                                  <th className="p-3 font-mono">Số điện thoại</th>
                                  <th className="p-3 font-mono">Địa chỉ thường trú</th>
                                  <th className="p-3 font-mono text-center">Trạng thái hồ sơ</th>
                                  <th className="p-3 font-mono text-center">Tác vụ</th>
                                </tr>
                               </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {displayClassStudents.map((s, idx) => {
                                  // Count filled fields out of 44
                                  let filled = 0;
                                  STUDENT_FIELDS_META.forEach(f => {
                                    if (s[f.key] !== undefined && s[f.key] !== null && s[f.key] !== "") {
                                      filled++;
                                    }
                                  });
                                  const completenessPercent = Math.round((filled / 44) * 100);
                                  
                                  return (
                                    <tr key={s.id} className="hover:bg-slate-50/50">
                                      <td className="p-3 font-mono text-center text-slate-400">{idx + 1}</td>
                                      <td className="p-3 font-bold font-mono text-slate-900">{formatStudentId(s.id)}</td>
                                      <td className="p-3 font-semibold text-slate-800">{s.name}</td>
                                      <td className="p-3 text-center">{s.gender || "-"}</td>
                                      <td className="p-3 font-mono">{s.idCard || "-"}</td>
                                      <td className="p-3 font-mono">{s.phone || "-"}</td>
                                      <td className="p-3 truncate max-w-[150px]" title={s.permanentAddress}>{s.permanentAddress || "-"}</td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className={`h-full ${completenessPercent > 80 ? "bg-emerald-500" : completenessPercent > 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                              style={{ width: `${completenessPercent}%` }}
                                            />
                                          </div>
                                          <span className="font-mono text-[9px] font-bold text-slate-500">{completenessPercent}% ({filled}/44)</span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => startEdit(s.id)}
                                          className="p-1 px-2 rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold hover:cursor-pointer transition-colors"
                                        >
                                          Sửa nhanh
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

        {/* TAB 3: MANUAL DATABASE EDIT OR INSPECTION */}
          {activeTab === "LIST" && (
            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Danh mục hồ sơ học lực của sinh viên Phân hiệu</h4>
              
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                {students.map(s => {
                  const semData = s.academicDataByPeriod?.[selectedSemesterId] || {};
                  const studentGpa = semData.gpa ?? s.gpa;
                  const studentCredits = semData.creditsEarned ?? s.creditsEarned;

                  return (
                    <div key={s.id} className="p-3 bg-white flex justify-between items-center flex-wrap gap-2 text-xs">
                      <div>
                        <h5 className="font-extrabold text-slate-900">{s.name}</h5>
                        <p className="text-[10px] text-slate-400 font-mono">MSSV: {formatStudentId(s.id)} | Lớp: {s.classId} | Khoa: {s.facultyId}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg">
                          <div className="text-[10px] text-slate-400 font-medium">Số GPA</div>
                          <div className="text-xs font-bold text-slate-800 font-mono">{studentGpa !== undefined ? studentGpa.toFixed(2) : "Chưa nhập"}</div>
                        </div>
                        <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg">
                          <div className="text-[10px] text-slate-400 font-medium font-mono">Tác vụ phụ</div>
                          <div className="text-xs font-bold text-slate-800 font-mono">{studentCredits || 0} TC</div>
                        </div>
                      <button 
                        onClick={() => startEdit(s.id)}
                        className="p-1 px-2.5 rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold hover:cursor-pointer transition-colors"
                      >
                        Sửa nhanh
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* TAB 4: THOI_KHOA_BIEU */}
          {activeTab === "THOI_KHOA_BIEU" && (() => {
            const availableScheduleClasses = Array.from(new Set([
              ...students.map(s => normalizeClassId(s.classId)),
              ...customClasses.map(c => normalizeClassId(c))
            ])).filter(Boolean).sort();

            // Set default class if empty or invalid
            if ((!selectedScheduleClass || !availableScheduleClasses.includes(selectedScheduleClass)) && availableScheduleClasses.length > 0) {
              setSelectedScheduleClass(availableScheduleClasses[0]);
            }

            const classSchedules = schedules.filter(s => {
              const matchClass = normalizeClassId(s.classId) === selectedScheduleClass;
              const matchSemester = !selectedScheduleSemesterId || s.semesterId === selectedScheduleSemesterId || !s.semesterId;
              const matchWeek = selectedScheduleWeek === 0 || isWeekInScheduleSlot(s, selectedScheduleWeek);
              return matchClass && matchSemester && matchWeek;
            });

            return (
              <div className="space-y-6 text-left animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Quản lý Thời khóa biểu Phân hiệu</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Xuất file mẫu thời khóa biểu hiện tại, chỉnh sửa các ca học, sau đó tải lên (import) tệp tin Excel để đồng bộ toàn bộ lịch học của sinh viên.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <button 
                      onClick={handleOpenAddScheduleModal}
                      className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Điền ca học trực tiếp trên hệ thống có kiểm tra chống trùng lặp"
                    >
                      <Plus size={14} />
                      <span>Thêm Ca Học Mới</span>
                    </button>
                  </div>

                  <div>
                    <button 
                      onClick={() => handleExportScheduleTemplate()}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Xuất file mẫu chứa đầy đủ các Sheet của tất cả các lớp đang có trên hệ thống"
                    >
                      <Download size={14} />
                      <span>Xuất Excel Mẫu (Toàn bộ lớp)</span>
                    </button>
                  </div>

                  {selectedScheduleClass && (
                    <div>
                      <button 
                        onClick={() => handleExportScheduleTemplate(selectedScheduleClass)}
                        className="px-3.5 py-2 bg-emerald-650 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title={`Xuất file mẫu chứa đúng 1 Sheet lịch học của lớp ${selectedScheduleClass}`}
                      >
                        <FileSpreadsheet size={14} />
                        <span>Xuất Excel Lớp {selectedScheduleClass}</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="relative cursor-pointer">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleImportScheduleExcel}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="schedule-excel-upload"
                    />
                    <label 
                      htmlFor="schedule-excel-upload"
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <UploadCloud size={14} />
                      <span>Tải lên Excel Thời khóa biểu</span>
                    </label>
                  </div>

                  {schedules.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ thời khóa biểu hiện tại không?")) {
                          clearSchedules();
                        }
                      }}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ml-auto cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Xóa Toàn Bộ Lịch Học</span>
                    </button>
                  )}
                </div>

                {showSchedulePreview && (
                  <div className="space-y-3.5 bg-amber-50/20 p-4 rounded-xl border border-amber-250/30">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                        <Lock size={12} />
                        XEM TRƯỚC BẢNG LỊCH HỌC SẼ ĐỒNG BỘ ({schedulePreviewData.length} lớp học)
                      </span>
                      <button 
                        onClick={handleApplyScheduleImport}
                        className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-sm transition-all"
                      >
                        Xác nhận & Ghi đè lịch học
                      </button>
                    </div>

                    <div className="border border-slate-200 bg-white rounded-lg overflow-x-auto text-[11.5px] font-mono">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-705 font-bold border-b border-slate-200">
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">STT</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Mã lớp</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Tên lớp</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Học phần</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Mã HP</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Số TC</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Giảng viên</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Thứ</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Buổi</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Tiết đầu</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Tiết cuối</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Phòng</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Học kỳ</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Tuần học</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Năm học</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Hình thức</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {schedulePreviewData.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50/50">
                              <td className="p-2 text-center text-slate-400 font-mono">{index + 1}</td>
                              <td className="p-2 font-bold text-slate-900">{row.classId}</td>
                              <td className="p-2 text-slate-650">{row.className || "N/A"}</td>
                              <td className="p-2 font-medium">{row.subjectName}</td>
                              <td className="p-2 text-[10.5px] font-mono text-slate-500">{row.subjectCode || "N/A"}</td>
                              <td className="p-2 text-center font-bold text-slate-700">{row.credits || 2}</td>
                              <td className="p-2 text-slate-600">{row.teacherName}</td>
                              <td className="p-2 text-center font-bold">Thứ {row.dayOfWeek === 8 ? "Chủ Nhật" : row.dayOfWeek}</td>
                              <td className="p-2 text-center text-indigo-650 font-semibold">{row.session || "Sáng"}</td>
                              <td className="p-2 text-center">{row.periodStart}</td>
                              <td className="p-2 text-center">{row.periodEnd}</td>
                              <td className="p-2 font-bold text-indigo-650">{row.room}</td>
                              <td className="p-2 text-slate-500">{row.semester}</td>
                              <td className="p-2 text-center font-bold text-indigo-700">{row.weekRange || "1-15"}</td>
                              <td className="p-2 text-slate-500 font-mono text-[10.5px]">{row.academicYear || "2025-2026"}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${row.studyMode === "Online" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                  {row.studyMode || "Trực tiếp"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Học kỳ:</span>
                      <select 
                        value={selectedScheduleSemesterId}
                        onChange={(e) => setSelectedScheduleSemesterId(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                      >
                        {SEMESTER_LIST.map(sem => (
                          <option key={sem.id} value={sem.id}>{sem.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Lớp học:</span>
                      <select 
                        value={selectedScheduleClass}
                        onChange={(e) => setSelectedScheduleClass(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700"
                      >
                        {availableScheduleClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Tuần học:</span>
                      <select 
                        value={selectedScheduleWeek}
                        onChange={(e) => setSelectedScheduleWeek(Number(e.target.value))}
                        className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
                      >
                        <option value={0}>Tất cả các tuần (Tuần 1 - 20)</option>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
                          <option key={w} value={w}>Tuần {w}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {classSchedules.length === 0 ? (
                    <div className="p-6 text-center text-slate-450 italic border border-dashed rounded-lg text-xs">
                      Chưa có dữ liệu thời khóa biểu phù hợp với học kỳ, lớp và tuần học đã chọn.
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-x-auto text-[11.5px] font-mono">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-650 font-bold border-b">
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Học phần</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Mã HP</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Số TC</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Giảng viên</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Thứ</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Buổi</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Ca/Tiết</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Phòng học</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Học kỳ</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Tuần học</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Năm học</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono">Hình thức</th>
                            <th className="p-2 text-[10px] uppercase tracking-wider font-mono text-center">Tác vụ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {classSchedules.map(slot => (
                            <tr key={slot.id} className="hover:bg-slate-50/30">
                              <td className="p-2 font-bold text-slate-800">{slot.subjectName}</td>
                              <td className="p-2 text-[10.5px] font-mono text-slate-500">{slot.subjectCode || "N/A"}</td>
                              <td className="p-2 text-center font-bold text-slate-700">{slot.credits || 2}</td>
                              <td className="p-2 text-slate-650">{slot.teacherName}</td>
                              <td className="p-2 text-center font-semibold">Thứ {slot.dayOfWeek === 8 ? "Chủ Nhật" : slot.dayOfWeek}</td>
                              <td className="p-2 text-center text-indigo-650 font-semibold">{slot.session || "Sáng"}</td>
                              <td className="p-2 text-center">Tiết {slot.periodStart} - {slot.periodEnd}</td>
                              <td className="p-2 font-mono text-indigo-700 font-bold">{slot.room}</td>
                              <td className="p-2 text-slate-500">{slot.semester}</td>
                              <td className="p-2 text-center font-bold text-indigo-700">{slot.weekRange || "1-15"}</td>
                              <td className="p-2 text-slate-500 font-mono text-[10.5px]">{slot.academicYear || "2025-2026"}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${slot.studyMode === "Online" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                  {slot.studyMode || "Trực tiếp"}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={() => handleOpenEditScheduleModal(slot)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                    title="Chỉnh sửa ca học"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteScheduleSlot(slot.id)}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                    title="Xóa ca học"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="bg-slate-50 p-3.5 border-t border-slate-100 shrink-0 text-center rounded-b-xl mt-4">
            <span className="text-[9px] text-slate-400 font-mono">
              Công cụ đồng bộ học bạ UniHub liên kết dữ liệu Phân hiệu, bảo mật tài khoản BCS.
            </span>
          </div>

        </div>

      </div>

      {/* MODAL: MANUAL STUDENT EDIT DIALOG */}
      {selectedStudentId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                <Edit size={14} />
                <span>Hiệu chỉnh học vụ: {selectedStudentId}</span>
              </h3>
              <button 
                onClick={() => setSelectedStudentId(null)}
                className="text-slate-450 hover:text-slate-700 text-xs font-bold font-mono uppercase"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 space-y-4 text-left text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">HỌ VÀ TÊN</label>
                  <input 
                    type="text"
                    value={students.find(s => s.id === selectedStudentId)?.name || ""}
                    disabled
                    className="w-full text-xs p-2 border rounded-lg bg-slate-50 text-slate-455 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">MÃ SINH VIÊN</label>
                  <input 
                    type="text"
                    value={selectedStudentId}
                    disabled
                    className="w-full text-xs p-2 border rounded-lg bg-slate-50 text-slate-455 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">GIỚI TÍNH</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">NGÀY SINH</label>
                  <input 
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">DÂN TỘC</label>
                  <input 
                    type="text"
                    value={editEthnicity}
                    onChange={(e) => setEditEthnicity(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">NƠI SINH</label>
                  <input 
                    type="text"
                    value={editPob}
                    onChange={(e) => setEditPob(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">SỐ CCCD/CMND</label>
                  <input 
                    type="text"
                    value={editIdCard}
                    onChange={(e) => setEditIdCard(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">NGÀY CẤP CCCD</label>
                  <input 
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={editIdCardDate}
                    onChange={(e) => setEditIdCardDate(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">NƠI CẤP CCCD</label>
                  <input 
                    type="text"
                    value={editIdCardPlace}
                    onChange={(e) => setEditIdCardPlace(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">HỌC PHẦN ĐĂNG KÝ (CÁCH NHAU BẰNG DẤU PHẨY)</label>
                  <input 
                    type="text"
                    value={editSubjects}
                    onChange={(e) => setEditSubjects(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">ĐIỂM HỌC PHẦN TƯƠNG ỨNG (CÁCH NHAU BẰNG DẤU PHẨY)</label>
                  <input 
                    type="text"
                    placeholder="Ví dụ: 8.5, 9.0, 7.5"
                    value={editSubjectGrades}
                    onChange={(e) => setEditSubjectGrades(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">ĐIỂM TB HỆ 10</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editGpa10}
                    onChange={(e) => setEditGpa10(Number(e.target.value))}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">ĐIỂM GPA HỆ 4</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editGpa}
                    onChange={(e) => setEditGpa(Number(e.target.value))}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">TÍN CHỈ TÍCH LŨY</label>
                  <input 
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">XẾP LOẠI HỌC TẬP</label>
                  <input 
                    type="text"
                    value={editAcademicGrade}
                    onChange={(e) => setEditAcademicGrade(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">TRẠNG THÁI HỌC TẬP</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg bg-white"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Bị cảnh báo">Bị cảnh báo</option>
                    <option value="Đình chỉ học">Đình chỉ học</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-455 block mb-1">GHI CHÚ</label>
                  <input 
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full text-xs p-2 border rounded-lg"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 py-1">
                  <input 
                    type="checkbox"
                    id="chk-warning-learning"
                    checked={editWarning}
                    onChange={(e) => setEditWarning(e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  <label htmlFor="chk-warning-learning" className="text-[11px] font-extrabold text-red-650 cursor-pointer">
                    Cảnh báo kết quả học vụ học kỳ (Trừ 5đ TC1.5)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t shrink-0">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={saveDetails}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Manual Assignment */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-up font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Plus className="text-blue-600" size={18} />
                Thêm Phân Công Giảng Dạy Mới
              </h3>
              <button onClick={() => setShowAddAssignmentModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveManualAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lớp niên chế / hành chính (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: K20-CNTT"
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã học phần (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: VPS7251"
                  value={assignForm.subjectCode}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên học phần (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cơ sở Tự nhiên - xã hội"
                  value={assignForm.subjectName}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số tín chỉ</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={assignForm.credits}
                    onChange={(e) => setAssignForm({ ...assignForm, credits: parseInt(e.target.value, 10) || 2 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã GV / Email</label>
                  <input
                    type="text"
                    value={assignForm.teacherId}
                    onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ tên Giảng viên đảm nhận (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: ThS. Nguyễn Văn A"
                  value={assignForm.teacherName}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu đăng nhập của Giảng viên (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Mật khẩu tài khoản (Mặc định: password123)"
                  value={assignForm.teacherPassword}
                  onChange={(e) => setAssignForm({ ...assignForm, teacherPassword: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAssignmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Thêm Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Assignment (Cây bút hiệu chỉnh thủ công) */}
      {showEditAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-up font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Edit className="text-amber-600" size={18} />
                Hiệu Chỉnh Phân Công Giảng Viên Thủ Công
              </h3>
              <button onClick={() => setShowEditAssignmentModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lớp niên chế / hành chính (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: K20-CNTT"
                  value={editAssignForm.classId}
                  onChange={(e) => setEditAssignForm({ ...editAssignForm, classId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã học phần (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: VPS7251"
                  value={editAssignForm.subjectCode}
                  onChange={(e) => setEditAssignForm({ ...editAssignForm, subjectCode: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên học phần (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cơ sở Tự nhiên - xã hội"
                  value={editAssignForm.subjectName}
                  onChange={(e) => setEditAssignForm({ ...editAssignForm, subjectName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số tín chỉ</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editAssignForm.credits}
                    onChange={(e) => setEditAssignForm({ ...editAssignForm, credits: parseInt(e.target.value, 10) || 2 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã / Email GV (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="gvbm@phhg.edu.vn"
                    value={editAssignForm.teacherId}
                    onChange={(e) => setEditAssignForm({ ...editAssignForm, teacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ tên Giảng viên đảm nhận (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: ThS. Ngô Văn Bình"
                  value={editAssignForm.teacherName}
                  onChange={(e) => setEditAssignForm({ ...editAssignForm, teacherName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu đăng nhập của Giảng viên (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Mật khẩu tài khoản (Mặc định: password123)"
                  value={editAssignForm.teacherPassword}
                  onChange={(e) => setEditAssignForm({ ...editAssignForm, teacherPassword: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-mono text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditAssignmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Grading Rules Config */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-up font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Sliders className="text-slate-800" size={18} />
                Cấu Hình Trọng Số & Quy Tắc Điểm
              </h3>
              <button onClick={() => setShowRulesModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveRules} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trọng số Chuyên cần (% CC)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesForm.ccWeight}
                  onChange={(e) => setRulesForm({ ...rulesForm, ccWeight: parseInt(e.target.value, 10) || 10 })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trọng số Thường xuyên / Quá trình (% TX/ĐK)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesForm.processWeight}
                  onChange={(e) => setRulesForm({ ...rulesForm, processWeight: parseInt(e.target.value, 10) || 30 })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trọng số Thi kết thúc học phần (% Thi)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rulesForm.examWeight}
                  onChange={(e) => setRulesForm({ ...rulesForm, examWeight: parseInt(e.target.value, 10) || 60 })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Làm tròn số thập phân</label>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={rulesForm.roundingDecimals}
                    onChange={(e) => setRulesForm({ ...rulesForm, roundingDecimals: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm tối thiểu Đạt (Thang 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={10}
                    value={rulesForm.passScoreMin10}
                    onChange={(e) => setRulesForm({ ...rulesForm, passScoreMin10: parseFloat(e.target.value) || 4.0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Grade Appeal Response */}
      {selectedAppealForResponse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-scale-up font-sans text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Bell className="text-indigo-600" size={18} />
                Cập nhật Kết Quả Phúc Khảo Điểm
              </h3>
              <button onClick={() => setSelectedAppealForResponse(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              resolveGradeAppeal(selectedAppealForResponse.id, "UPDATED", appealNewGrade, appealResponseText);
              setSelectedAppealForResponse(null);
              alert("Đã cập nhật điểm phúc khảo thành công!");
            }} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div>Sinh viên: <strong className="text-slate-900">{selectedAppealForResponse.studentName}</strong> ({selectedAppealForResponse.studentId})</div>
                <div>Môn học: <strong className="text-blue-700">{selectedAppealForResponse.subjectName}</strong> ({selectedAppealForResponse.subjectCode})</div>
                <div>Điểm cũ: <strong className="text-rose-700 font-mono font-bold">{selectedAppealForResponse.originalGrade}</strong></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Điểm mới sau khi điều chỉnh (*)</label>
                <input
                  type="text"
                  required
                  value={appealNewGrade}
                  onChange={(e) => setAppealNewGrade(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung phản hồi kết quả phúc khảo (*)</label>
                <textarea
                  required
                  rows={3}
                  value={appealResponseText}
                  onChange={(e) => setAppealResponseText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAppealForResponse(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Xác nhận điều chỉnh điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bảng Điền Hàng Loạt Ca Học Dạng Excel */}
      {showScheduleBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-indigo-650" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Bảng Nhập Liệu Thời Khóa Biểu Hàng Loạt (Dạng Excel)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Thao tác nhanh, điền nhiều ca học cùng lúc và tự động đối soát chống trùng lặp lịch.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleBatchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Action Toolbar */}
            <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2 flex-wrap shrink-0">
              <button 
                onClick={() => handleAddBatchRow(1)}
                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <Plus size={14} />
                <span>+ Thêm 1 Hàng</span>
              </button>

              <button 
                onClick={() => handleAddBatchRow(5)}
                className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus size={14} />
                <span>+ Thêm 5 Hàng Trống</span>
              </button>

              <span className="text-[11px] text-slate-500 font-mono ml-auto">
                Tổng số hàng: <strong className="text-indigo-700 font-bold">{batchGridRows.length}</strong> ca học
              </span>
            </div>

            {/* Grid Table Container */}
            <div className="p-4 overflow-auto flex-1 text-xs">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 text-center w-10">STT</th>
                    <th className="p-2 w-32">Lớp học (*)</th>
                    <th className="p-2 w-48">Tên môn học (*)</th>
                    <th className="p-2 w-28">Mã HP</th>
                    <th className="p-2 text-center w-16">Số TC</th>
                    <th className="p-2 w-36">Giảng viên</th>
                    <th className="p-2 text-center w-28">Thứ (*)</th>
                    <th className="p-2 text-center w-24">Buổi</th>
                    <th className="p-2 text-center w-20">Tiết đầu</th>
                    <th className="p-2 text-center w-20">Tiết cuối</th>
                    <th className="p-2 w-36">Phòng học (*)</th>
                    <th className="p-2 text-center w-28">Tuần học (*)</th>
                    <th className="p-2 w-28">Hình thức</th>
                    <th className="p-2 text-center w-20">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batchGridRows.map((row, idx) => {
                    const errorMsg = batchRowErrors[idx];
                    return (
                      <React.Fragment key={idx}>
                        <tr className={`hover:bg-slate-50/80 transition-colors ${errorMsg ? "bg-rose-50/70" : ""}`}>
                          <td className="p-1.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-1.5">
                            <input 
                              type="text" 
                              value={row.classId || ""}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "classId", e.target.value)}
                              placeholder="VD: K2-GDTH A"
                              className="w-full p-1.5 border border-slate-300 rounded font-bold text-indigo-700 outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="text" 
                              value={row.subjectName || ""}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "subjectName", e.target.value)}
                              placeholder="Tên môn học..."
                              className="w-full p-1.5 border border-slate-300 rounded font-medium text-slate-900 outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="text" 
                              value={row.subjectCode || ""}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "subjectCode", e.target.value)}
                              placeholder="VD: GDTH204"
                              className="w-full p-1.5 border border-slate-300 rounded font-mono text-slate-600 outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="number" min={1} max={10}
                              value={row.credits || 2}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "credits", Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-300 rounded text-center font-bold outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="text" 
                              value={row.teacherName || ""}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "teacherName", e.target.value)}
                              placeholder="Tên giảng viên..."
                              className="w-full p-1.5 border border-slate-300 rounded font-medium text-slate-700 outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <select 
                              value={row.dayOfWeek || 2}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "dayOfWeek", Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-300 rounded font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                            >
                              <option value={2}>Thứ 2</option>
                              <option value={3}>Thứ 3</option>
                              <option value={4}>Thứ 4</option>
                              <option value={5}>Thứ 5</option>
                              <option value={6}>Thứ 6</option>
                              <option value={7}>Thứ 7</option>
                              <option value={8}>Chủ Nhật</option>
                            </select>
                          </td>
                          <td className="p-1.5">
                            <select 
                              value={row.session || "Sáng"}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "session", e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-indigo-500 bg-white font-medium"
                            >
                              <option value="Sáng">Sáng</option>
                              <option value="Chiều">Chiều</option>
                              <option value="Tối">Tối</option>
                            </select>
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="number" min={1} max={12}
                              value={row.periodStart || 1}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "periodStart", Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-300 rounded text-center font-bold outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="number" min={1} max={12}
                              value={row.periodEnd || 3}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "periodEnd", Number(e.target.value))}
                              className="w-full p-1.5 border border-slate-300 rounded text-center font-bold outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="text" 
                              value={row.room || ""}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "room", e.target.value)}
                              placeholder="VD: Phòng 201"
                              className="w-full p-1.5 border border-slate-300 rounded font-bold text-indigo-700 outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <input 
                              type="text" 
                              value={row.weekRange || "1-15"}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "weekRange", e.target.value)}
                              placeholder="VD: 1-15"
                              className="w-full p-1.5 border border-slate-300 rounded text-center font-bold text-indigo-700 outline-none focus:border-indigo-500 bg-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <select 
                              value={row.studyMode || "Trực tiếp"}
                              onChange={(e) => handleUpdateBatchRowCell(idx, "studyMode", e.target.value)}
                              className="w-full p-1.5 border border-slate-300 rounded outline-none focus:border-indigo-500 bg-white font-medium"
                            >
                              <option value="Trực tiếp">Trực tiếp</option>
                              <option value="Online">Online</option>
                            </select>
                          </td>
                          <td className="p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleDuplicateBatchRow(idx)}
                                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                                title="Nhân bản (sao chép) dòng này"
                              >
                                <Copy size={13} />
                              </button>
                              <button 
                                onClick={() => handleRemoveBatchRow(idx)}
                                className="p-1 text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                title="Xóa dòng"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {errorMsg && (
                          <tr>
                            <td colSpan={14} className="p-2 bg-rose-100/80 text-rose-800 text-[11px] font-bold border-b border-rose-200">
                              <div className="flex items-center gap-1.5 pl-4">
                                <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                                <span>Hàng {idx + 1}: {errorMsg}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-slate-50 flex justify-between items-center shrink-0">
              <span className="text-[11px] text-slate-500 italic">
                * Lưu ý: Hệ thống sẽ tự động loại bỏ các hàng trống rỗng và kiểm tra trùng lịch (Phòng, Giảng viên, Lớp) trước khi lưu.
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowScheduleBatchModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSaveScheduleBatch}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Kiểm Tra & Lưu Tất Cả Ca Học</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Ca Học Đơn Lẻ */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Chỉnh Sửa Ca Học
              </h4>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {scheduleConflictError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium space-y-1 animate-shake">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertTriangle size={15} />
                  CẢNH BÁO XUNG ĐỘT TRÙNG LỊCH:
                </div>
                <div>{scheduleConflictError}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Lớp học (*):</label>
                <input 
                  type="text" 
                  value={scheduleModalData.classId || ""}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, classId: e.target.value, className: e.target.value })}
                  placeholder="VD: K2-GDTH A"
                  className="w-full p-2 border rounded-lg font-bold text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Học kỳ (*):</label>
                <select 
                  value={scheduleModalData.semesterId || "HOCKY_2_2025_2026"}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, semesterId: e.target.value })}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {SEMESTER_LIST.map(sem => (
                    <option key={sem.id} value={sem.id}>{sem.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên môn học (*):</label>
                <input 
                  type="text" 
                  value={scheduleModalData.subjectName || ""}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, subjectName: e.target.value })}
                  placeholder="VD: Phương pháp dạy học Toán"
                  className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mã học phần:</label>
                <input 
                  type="text" 
                  value={scheduleModalData.subjectCode || ""}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, subjectCode: e.target.value })}
                  placeholder="VD: GDTH204"
                  className="w-full p-2 border rounded-lg font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Số tín chỉ:</label>
                <input 
                  type="number" 
                  min={1} max={10}
                  value={scheduleModalData.credits || 2}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, credits: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giảng viên bộ môn:</label>
                <input 
                  type="text" 
                  value={scheduleModalData.teacherName || ""}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, teacherName: e.target.value })}
                  placeholder="VD: ThS. Nguyễn Văn A"
                  className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phòng học (*):</label>
                <input 
                  type="text" 
                  value={scheduleModalData.room || ""}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, room: e.target.value })}
                  placeholder="VD: Phòng 201 - Nhà B"
                  className="w-full p-2 border rounded-lg font-bold text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Thứ trong tuần (*):</label>
                <select 
                  value={scheduleModalData.dayOfWeek || 2}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, dayOfWeek: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={2}>Thứ Hai</option>
                  <option value={3}>Thứ Ba</option>
                  <option value={4}>Thứ Tư</option>
                  <option value={5}>Thứ Năm</option>
                  <option value={6}>Thứ Sáu</option>
                  <option value={7}>Thứ Bảy</option>
                  <option value={8}>Chủ Nhật</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Buổi học:</label>
                <select 
                  value={scheduleModalData.session || "Sáng"}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, session: e.target.value })}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Sáng">Sáng</option>
                  <option value="Chiều">Chiều</option>
                  <option value="Tối">Tối</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiết bắt đầu:</label>
                <input 
                  type="number" min={1} max={12}
                  value={scheduleModalData.periodStart || 1}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, periodStart: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiết kết thúc:</label>
                <input 
                  type="number" min={1} max={12}
                  value={scheduleModalData.periodEnd || 3}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, periodEnd: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tuần học (*):</label>
                <input 
                  type="text" 
                  value={scheduleModalData.weekRange || "1-15"}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, weekRange: e.target.value })}
                  placeholder="VD: 1-15, 1-9, 10-18"
                  className="w-full p-2 border rounded-lg font-bold text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Hình thức học:</label>
                <select 
                  value={scheduleModalData.studyMode || "Trực tiếp"}
                  onChange={(e) => setScheduleModalData({ ...scheduleModalData, studyMode: e.target.value })}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Trực tiếp">Trực tiếp</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveScheduleModal}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Cập Nhật Ca Học</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đổi Tên Lớp Học */}
      {editingRenameClassId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit size={18} className="text-indigo-600" />
                Đổi Tên Lớp Học
              </h4>
              <button 
                onClick={() => setEditingRenameClassId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên lớp hiện tại:</label>
                <input 
                  type="text" 
                  value={editingRenameClassId}
                  disabled
                  className="w-full p-2 border bg-slate-100 rounded-lg font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên lớp mới (*):</label>
                <input 
                  type="text" 
                  value={renameClassNameInput}
                  onChange={(e) => setRenameClassNameInput(e.target.value)}
                  placeholder="VD: K2-GDTH B"
                  className="w-full p-2 border rounded-lg font-bold text-indigo-700 outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-450 mt-1">
                  * Hệ thống sẽ tự động cập nhật tên lớp mới trên toàn bộ danh sách Sinh viên, Thời khóa biểu và Kế hoạch Phân công Giảng dạy.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button 
                onClick={() => setEditingRenameClassId(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  if (renameClassNameInput.trim() && renameClassNameInput.trim() !== editingRenameClassId) {
                    renameClass(editingRenameClassId, renameClassNameInput.trim());
                    alert(`Đã đổi tên lớp từ "${editingRenameClassId}" thành "${renameClassNameInput.trim()}" thành công!`);
                    setEditingRenameClassId(null);
                  }
                }}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Cập Nhật Tên Lớp</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
