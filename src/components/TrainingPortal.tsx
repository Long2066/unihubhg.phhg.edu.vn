import React, { useState } from "react";
import { useUniHub } from "../state";
import { UserRole, Student, UserAccount, ScheduleSlot, STUDENT_FIELDS_META } from "../types";
import * as XLSX from "xlsx";
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
  ArrowLeft
} from "lucide-react";

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
    addNewClass
  } = useUniHub();

  const activeTab = (activePortletTab as "IMPORT" | "IMPORT_CLASSES" | "LIST" | "THOI_KHOA_BIEU") || "IMPORT";
  const setActiveTab = (tab: "IMPORT" | "IMPORT_CLASSES" | "LIST" | "THOI_KHOA_BIEU") => {
    setActivePortletTab(tab);
  };
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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

  // Timetable State
  const [schedulePreviewData, setSchedulePreviewData] = useState<ScheduleSlot[]>([]);
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [selectedScheduleClass, setSelectedScheduleClass] = useState("");

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
      const grades = s.subjectGrades ? s.subjectGrades.split(",").map(g => g.trim()) : [];
      const gradeCols = Array.from({ length: 8 }, (_, i) => {
        const val = grades[i] || "-";
        return val === "" ? "-" : val;
      });

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
        s.gpa10 || (s.gpa ? s.gpa * 2.5 : 8.0),
        s.gpa || 3.2,
        s.academicGrade || (s.gpa && s.gpa >= 3.6 ? "Xuất sắc" : s.gpa && s.gpa >= 3.2 ? "Giỏi" : "Khá"),
        s.notes || "",
        s.updatedAt || new Date().toISOString().split("T")[0]
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
          const id = row[colIdx.id]?.toString().trim();
          if (!id) continue;

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
            gender: colIdx.gender !== -1 && row[colIdx.gender] ? row[colIdx.gender]?.toString().trim() : "Nam",
            dob: colIdx.dob !== -1 && row[colIdx.dob] ? row[colIdx.dob]?.toString().trim() : "2006-01-01",
            pob: colIdx.pob !== -1 && row[colIdx.pob] ? row[colIdx.pob]?.toString().trim() : "Hà Giang",
            ethnicity: colIdx.ethnicity !== -1 && row[colIdx.ethnicity] ? row[colIdx.ethnicity]?.toString().trim() : "Kinh",
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
    importAcademicData(previewData);
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

  const handleExportClassStudentsExcel = (targetClassId: string) => {
    const classStudents = students.filter(s => s.classId === targetClassId);
    const headers = [
      "STT", "Mã sinh viên", "Họ và tên", "Giới tính", "Ngày sinh", "Nơi sinh", "Dân tộc", "Tôn giáo", "Quốc tịch", "Số CCCD/CMND",
      "Ngày cấp CCCD/CMND", "Nơi cấp CCCD/CMND", "Mã BHYT", "Đối tượng ưu tiên", "Khu vực ưu tiên", "Email", "Số điện thoại", "Địa chỉ thường trú", "Tỉnh/TP thường trú", "Xã/Phường thường trú",
      "Địa chỉ tạm trú", "Họ tên cha", "Nghề nghiệp cha", "SĐT cha", "Họ tên mẹ", "Nghề nghiệp mẹ", "SĐT mẹ", "Hệ đào tạo", "Khóa đào tạo", "Ngành đào tạo",
      "Chuyên ngành", "Khoa/Đơn vị quản lý", "Niên khóa", "Cố vấn học tập", "Số học phần đã đăng ký", "Danh sách lớp tín chỉ", "Ghi chú đăng ký học", "Tín chỉ đã tích lũy", "Tổng học phí phải nộp", "Học phí đã nộp",
      "Học phí còn nợ", "Trạng thái thanh toán", "Ghi chú", "Ngày cập nhật"
    ];

    const rows = classStudents.map((s, idx) => {
      return [
        idx + 1,
        s.id,
        s.name,
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
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `Thong_tin_sinh_vien_Lop_${targetClassId}.xlsx`);
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

          const id = row[colIdx.id]?.toString().trim();
          if (!id) continue;

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

  const handleExportScheduleTemplate = () => {
    // 1. Create Catalog Data from distinct subjects
    const subjectsMap = new Map<string, { code: string; credits: number; teacher: string }>();
    schedules.forEach(s => {
      if (!subjectsMap.has(s.subjectName)) {
        subjectsMap.set(s.subjectName, {
          code: s.subjectCode || "",
          credits: s.credits || 2,
          teacher: s.teacherName
        });
      }
    });

    const catalogData = Array.from(subjectsMap.entries()).map(([name, info]) => [
      name,
      info.code,
      info.credits,
      info.teacher
    ]);

    if (catalogData.length === 0) {
      catalogData.push(
        ["CSTN&XH", "HKO4587520", 2, "TRẦN THANH BÌNH"],
        ["ĐẠO ĐỨC", "7ELP202088", 2, "NGUYỄN MINH NGUYỆT"],
        ["TIẾNG ANH", "FHDGY452", 3, "THANH HÀ"],
        ["MỸ THUẬT", "258SJDUH", 2, "ĐÀM KIÊN"],
        ["ÂM NHẠC", "DHHSJ202", 2, "THANH THỦY"],
        ["TOÁN", "NNHB1203", 4, "HOÀNG ANH"],
        ["KĨ NĂNG SỐNG", "SSNHG258", 2, "THƯ THẢO"],
        ["TIẾNG VIỆT", "220MNHJK", 4, "THANH DUNG"],
        ["THỂ CHẤT", "002MNJHU", 3, "HÙNG HOÀNG"]
      );
    }

    // 2. Create Schedule Data
    const scheduleData = schedules.length > 0 
      ? schedules.map(s => [
          s.classId,
          s.className || s.classId,
          s.dayOfWeek === 8 ? "Chủ Nhật" : `Thứ ${s.dayOfWeek}`,
          s.session || "Sáng",
          s.subjectName,
          `${s.periodStart}-${s.periodEnd}`,
          s.room,
          s.semester,
          s.academicYear || "2025-2026",
          s.studyMode || "Trực tiếp"
        ])
      : [
          ["K2GDTHA", "K2 GDTH A", "Thứ 2", "Sáng", "CSTN&XH", "1-3", "102B", "II", "2025-2026", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 2", "Sáng", "ĐẠO ĐỨC", "4-5", "102B", "II", "2025-2026", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 3", "Sáng", "TIẾNG ANH", "1-2", "102B", "II", "2025-2027", "Online"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 3", "Sáng", "MỸ THUẬT", "3-5", "102B", "II", "2025-2028", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 4", "Sáng", "ÂM NHẠC", "1-2", "102B", "II", "2025-2029", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 4", "Sáng", "TOÁN", "3-4", "102B", "II", "2025-2030", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 5", "Sáng", "KĨ NĂNG SỐNG", "1-3", "102B", "II", "2025-2031", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 5", "Sáng", "TIẾNG VIỆT", "4-5", "102B", "II", "2025-2032", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 6", "Sáng", "ĐẠO ĐỨC", "1-2", "102B", "II", "2025-2033", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 6", "Sáng", "TOÁN", "4-5", "102B", "II", "2025-2034", "Trực tiếp"],
          ["K2GDTHA", "K2 GDTH A", "Thứ 7", "Chiều", "THỂ CHẤT", "1-5", "Sân trường", "II", "2025-2035", "Trực tiếp"]
        ];

    const workbook = XLSX.utils.book_new();

    // Sheet 1: DANH_MỤC
    const catalogHeaders = ["Tên học phần", "Mã học phần", "Số tín chỉ", "Giảng viên"];
    const catalogSheet = XLSX.utils.aoa_to_sheet([catalogHeaders, ...catalogData]);
    XLSX.utils.book_append_sheet(workbook, catalogSheet, "DANH_MỤC");

    // Sheet 2: THỜI_KHÓA_BIỂU
    const scheduleHeaders = [
      "Mã lớp",
      "Tên lớp",
      "Thứ",
      "Buổi",
      "Môn học",
      "Tiết",
      "Phòng học",
      "Học kỳ",
      "Năm học",
      "Hình thức học"
    ];
    const scheduleSheet = XLSX.utils.aoa_to_sheet([scheduleHeaders, ...scheduleData]);
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, "THỜI_KHÓA_BIỂU");

    XLSX.writeFile(workbook, "Mau_Thoi_khoa_bieu_Phan_hieu.xlsx");
  };

  const handleImportScheduleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        
        // 1. Read sheet "DANH_MỤC"
        const catalogSheet = workbook.Sheets["DANH_MỤC"];
        if (!catalogSheet) {
          alert("Không tìm thấy trang dữ liệu 'DANH_MỤC' trong file Excel!");
          return;
        }
        const rawCatalog = XLSX.utils.sheet_to_json<any[]>(catalogSheet, { header: 1 });
        const catalogHeaders = rawCatalog[0] as string[];
        if (!catalogHeaders || catalogHeaders.length === 0) {
          alert("Trang 'DANH_MỤC' không hợp lệ hoặc rỗng!");
          return;
        }

        const catColIdx = {
          subjectName: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "tên học phần"),
          subjectCode: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "mã học phần"),
          credits: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "số tín chỉ"),
          teacherName: catalogHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "giảng viên")
        };

        const catalogMap = new Map<string, { code: string; credits: number; teacher: string }>();
        for (let i = 1; i < rawCatalog.length; i++) {
          const row = rawCatalog[i];
          if (!row || row.length === 0) continue;
          const subjectName = row[catColIdx.subjectName]?.toString().trim();
          if (!subjectName) continue;

          const subjectCode = catColIdx.subjectCode !== -1 && row[catColIdx.subjectCode] ? row[catColIdx.subjectCode]?.toString().trim() : "";
          const creditsVal = catColIdx.credits !== -1 ? Number(row[catColIdx.credits]) : NaN;
          const credits = isNaN(creditsVal) ? 2 : creditsVal;
          const teacherName = catColIdx.teacherName !== -1 && row[catColIdx.teacherName] ? row[catColIdx.teacherName]?.toString().trim() : "Chưa phân công";

          catalogMap.set(subjectName.toLowerCase(), {
            code: subjectCode,
            credits: credits,
            teacher: teacherName
          });
        }

        // 2. Read sheet "THỜI_KHÓA_BIỂU"
        const scheduleSheet = workbook.Sheets["THỜI_KHÓA_BIỂU"] || workbook.Sheets[workbook.SheetNames[0]];
        if (!scheduleSheet) {
          alert("Không tìm thấy trang dữ liệu 'THỜI_KHÓA_BIỂU' trong file Excel!");
          return;
        }
        const rawSchedule = XLSX.utils.sheet_to_json<any[]>(scheduleSheet, { header: 1 });
        const scheduleHeaders = rawSchedule[0] as string[];
        if (!scheduleHeaders || scheduleHeaders.length === 0) {
          alert("Trang 'THỜI_KHÓA_BIỂU' không hợp lệ hoặc rỗng!");
          return;
        }

        const schedColIdx = {
          classId: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "mã lớp"),
          className: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "tên lớp"),
          dayOfWeek: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "thứ"),
          session: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "buổi"),
          subjectName: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "môn học"),
          period: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "tiết"),
          room: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "phòng học"),
          semester: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "học kỳ"),
          academicYear: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "năm học"),
          studyMode: scheduleHeaders.findIndex(h => h?.toString().trim().toLowerCase() === "hình thức học")
        };

        if (schedColIdx.classId === -1 || schedColIdx.subjectName === -1) {
          alert("Không tìm thấy các cột bắt buộc ('Mã lớp', 'Môn học') trong trang 'THỜI_KHÓA_BIỂU'!");
          return;
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
        
        for (let i = 1; i < rawSchedule.length; i++) {
          const row = rawSchedule[i];
          if (!row || row.length === 0) continue;
          
          const classId = row[schedColIdx.classId]?.toString().trim();
          const rawSubjectName = row[schedColIdx.subjectName]?.toString().trim();
          if (!classId || !rawSubjectName) continue;

          const className = schedColIdx.className !== -1 && row[schedColIdx.className] ? row[schedColIdx.className]?.toString().trim() : "";
          const dayOfWeek = parseDayOfWeek(row[schedColIdx.dayOfWeek]);
          const session = schedColIdx.session !== -1 && row[schedColIdx.session] ? row[schedColIdx.session]?.toString().trim() : "Sáng";
          const room = schedColIdx.room !== -1 && row[schedColIdx.room] ? row[schedColIdx.room]?.toString().trim() : "Phòng học";
          const semester = schedColIdx.semester !== -1 && row[schedColIdx.semester] ? row[schedColIdx.semester]?.toString().trim() : "II";
          const academicYear = schedColIdx.academicYear !== -1 && row[schedColIdx.academicYear] ? row[schedColIdx.academicYear]?.toString().trim() : "2025-2026";
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

          updates.push({
            id: `SCH_IMPORT_${i}_${Date.now()}`,
            classId,
            className,
            subjectName: rawSubjectName,
            subjectCode: meta.code,
            credits: meta.credits,
            teacherName: meta.teacher,
            dayOfWeek,
            session,
            periodStart,
            periodEnd,
            room,
            semester,
            academicYear,
            studyMode,
            colorHex: fallbackColors[i % fallbackColors.length]
          });
        }

        if (updates.length === 0) {
          alert("Không tìm thấy dữ liệu thời khóa biểu nào trong tệp!");
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

  const startEdit = (studentId: string) => {
    const s = students.find(item => item.id === studentId);
    if (s) {
      setSelectedStudentId(studentId);
      setEditGpa(s.gpa || 3.0);
      setEditCredits(s.creditsEarned || 15);
      setEditWarning(!!s.learningWarning);
      setEditStatus(s.learningStatus || "Bình thường");
      setEditGender(s.gender || "Nam");
      setEditDob(s.dob || "2006-01-01");
      setEditPob(s.pob || "Hà Giang");
      setEditEthnicity(s.ethnicity || "Kinh");
      setEditIdCard(s.idCard || "");
      setEditIdCardDate(s.idCardDate || "");
      setEditIdCardPlace(s.idCardPlace || "");
      setEditSubjects(s.subjects || "");
      setEditSubjectGrades(s.subjectGrades || "");
      setEditGpa10(s.gpa10 || 8.0);
      setEditAcademicGrade(s.academicGrade || "Khá");
      setEditNotes(s.notes || "");
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
      }]);
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

      <div className="w-full">
        
        {/* Action Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[460px] flex flex-col justify-between">
          
          {/* TAB 1: CSV / EXCEL MOCK IMPORTER */}
          {activeTab === "IMPORT" && (
            <div className="space-y-6 text-left">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Đồng quy dữ liệu điểm GPA</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">Phòng Đào tạo tải lên mẫu file chứa thông tin GPA học kỳ nhằm tự động cộng hoặc khấu trừ rèn luyện hệ thống.</p>
              </div>

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
                              <td className="p-2 font-bold">{row.id}</td>
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
                      ...students.map(s => s.classId),
                      ...customClasses
                    ])).filter(Boolean).sort().map(clsId => {
                      const classStudents = students.filter(s => s.classId === clsId);
                      // Calculate completeness indicator
                      const completedCount = classStudents.filter(s => s.phone && s.dob && s.gender).length;
                      
                      return (
                        <div
                          key={clsId}
                          onClick={() => setSelectedClassId(clsId)}
                          className="bg-white hover:bg-slate-50/50 border border-slate-150 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded text-[9px] font-mono font-bold uppercase">LỚP HỌC</span>
                              <span className="text-[10px] text-slate-400 font-mono">{classStudents.length} SV</span>
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
                            {classStudents.filter(s => s.phone && s.dob && s.gender).length} / {classStudents.length} SV
                          </strong>
                        </div>
                      </div>

                      {/* Students table */}
                      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                        <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                          <h4 className="text-xs font-extrabold text-slate-750 uppercase tracking-wider">Danh sách Sinh viên Lớp {selectedClassId}</h4>
                          <span className="text-[10px] text-slate-400 leading-none font-medium">Bầm "Sửa nhanh" để điền trực tiếp thông tin</span>
                        </div>

                        {classStudents.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs font-medium">
                            Lớp chưa có sinh viên nào. Vui lòng nạp tệp Excel danh sách sinh viên!
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
                                {classStudents.map((s, idx) => {
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
                                      <td className="p-3 font-bold font-mono text-slate-900">{s.id}</td>
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
                {students.map(s => (
                  <div key={s.id} className="p-3 bg-white flex justify-between items-center flex-wrap gap-2 text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-900">{s.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono">MSSV: {s.id} | Lớp: {s.classId} | Khoa: {s.facultyId}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-medium">Số GPA</div>
                        <div className="text-xs font-bold text-slate-800 font-mono">{s.gpa?.toFixed(2) || "Chưa nhập"}</div>
                      </div>
                      <div className="text-center bg-slate-50 px-3 py-1.5 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-medium font-mono">Tác vụ phụ</div>
                        <div className="text-xs font-bold text-slate-800 font-mono">{s.creditsEarned || 0} TC</div>
                      </div>
                      <button 
                        onClick={() => startEdit(s.id)}
                        className="p-1 px-2.5 rounded bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold hover:cursor-pointer transition-colors"
                      >
                        Sửa nhanh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: THOI_KHOA_BIEU */}
          {activeTab === "THOI_KHOA_BIEU" && (() => {
            const availableScheduleClasses = Array.from(new Set([
              ...students.map(s => s.classId),
              ...schedules.map(s => s.classId)
            ])).filter(Boolean).sort();

            // Set default class if empty
            if (!selectedScheduleClass && availableScheduleClasses.length > 0) {
              setSelectedScheduleClass(availableScheduleClasses[0]);
            }

            const classSchedules = schedules.filter(s => s.classId === selectedScheduleClass);

            return (
              <div className="space-y-6 text-left animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Quản lý Thời khóa biểu Phân hiệu</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Xuất file mẫu thời khóa biểu hiện tại, chỉnh sửa các ca học, sau đó tải lên (import) tệp tin Excel để đồng bộ toàn bộ lịch học của sinh viên.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <button 
                      onClick={handleExportScheduleTemplate}
                      className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Xuất File Excel Mẫu (Template)</span>
                    </button>
                  </div>
                  
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">Chọn lớp xem lịch biểu:</span>
                    <select 
                      value={selectedScheduleClass}
                      onChange={(e) => setSelectedScheduleClass(e.target.value)}
                      className="text-xs p-1.5 border rounded-lg bg-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
                    >
                      {availableScheduleClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {classSchedules.length === 0 ? (
                    <div className="p-6 text-center text-slate-450 italic border border-dashed rounded-lg text-xs">
                      Chưa có dữ liệu thời khóa biểu cho lớp này.
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
                              <td className="p-2 text-slate-500 font-mono text-[10.5px]">{slot.academicYear || "2025-2026"}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${slot.studyMode === "Online" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                  {slot.studyMode || "Trực tiếp"}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <button 
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn xóa ca học ${slot.subjectName} không?`)) {
                                      deleteScheduleSlot(slot.id);
                                    }
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Xóa ca học"
                                >
                                  <Trash2 size={13} />
                                </button>
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

    </div>
  );
};
