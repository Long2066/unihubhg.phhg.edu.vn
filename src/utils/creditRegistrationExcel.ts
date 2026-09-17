import ExcelJS from "exceljs";
import { CourseOffering, CreditEnrollment, Student } from "../types";

/**
 * Áp dụng kiểu dáng Font Times New Roman và border tiêu chuẩn cho cell
 */
const styleCell = (
  cell: ExcelJS.Cell,
  options: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    alignment?: Partial<ExcelJS.Alignment>;
    bgColor?: string;
    fontColor?: string;
    border?: boolean;
  }
) => {
  cell.font = {
    name: "Times New Roman",
    size: options.size || 11,
    bold: !!options.bold,
    italic: !!options.italic,
    color: options.fontColor ? { argb: options.fontColor } : { argb: "FF000000" }
  };

  if (options.alignment) {
    cell.alignment = {
      vertical: "middle",
      ...options.alignment
    };
  } else {
    cell.alignment = { vertical: "middle" };
  }

  if (options.bgColor) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: options.bgColor }
    };
  }

  if (options.border !== false) {
    cell.border = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } }
    };
  }
};

/**
 * Tải File Excel Mẫu danh mục học phần mở đăng ký tín chỉ (Chuẩn Times New Roman)
 */
export const downloadCourseOfferingsTemplate = async (semesterName: string = "Học kỳ II - 2025-2026") => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("DS_HocPhan_DangKy", {
    views: [{ showGridLines: true }]
  });

  // Header cơ quan
  ws.mergeCells("A1:C1");
  ws.getCell("A1").value = "TRƯỜNG ĐẠI HỌC TÂN TRÀO";
  styleCell(ws.getCell("A1"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("D1:G1");
  ws.getCell("D1").value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
  styleCell(ws.getCell("D1"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("A2:C2");
  ws.getCell("A2").value = "PHÂN HIỆU TẠI TỈNH HÀ GIANG";
  styleCell(ws.getCell("A2"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("D2:G2");
  ws.getCell("D2").value = "Độc lập - Tự do - Hạnh phúc";
  styleCell(ws.getCell("D2"), { size: 11, italic: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("A3:C3");
  ws.getCell("A3").value = "PHÒNG ĐÀO TẠO NCKH & HỢP TÁC QUỐC TẾ";
  styleCell(ws.getCell("A3"), { size: 10, italic: true, alignment: { horizontal: "center" }, border: false });

  // Tiêu đề chính
  ws.mergeCells("A5:G5");
  ws.getCell("A5").value = "DANH MỤC HỌC PHẦN MỞ ĐĂNG KÝ HỌC TÍN CHỈ";
  styleCell(ws.getCell("A5"), { size: 15, bold: true, alignment: { horizontal: "center" }, fontColor: "FF1E3A8A", border: false });

  ws.mergeCells("A6:G6");
  ws.getCell("A6").value = `Áp dụng cho: ${semesterName}`;
  styleCell(ws.getCell("A6"), { size: 12, italic: true, alignment: { horizontal: "center" }, border: false });

  // Header Bảng
  const headers = [
    "STT",
    "Mã Học Phần",
    "Tên Học Phần",
    "Số Tín Chỉ",
    "Giảng Viên Phụ Trách",
    "Lớp Áp Dụng (để trống nếu toàn trường)",
    "Ghi Chú"
  ];
  const rowHeader = ws.getRow(8);
  rowHeader.values = headers;
  rowHeader.height = 28;

  rowHeader.eachCell((cell) => {
    styleCell(cell, {
      size: 11,
      bold: true,
      alignment: { horizontal: "center", wrapText: true },
      bgColor: "FFE0E7FF",
      fontColor: "FF1E3A8A"
    });
  });

  // Dữ liệu mẫu
  const sampleData = [
    [1, "VPS7251", "Cơ sở Tự nhiên và Xã hội", 4, "TS. Nguyễn Văn A", "K2-GDTH A, K2-GDTH B", "Môn bắt buộc chuyên ngành"],
    [2, "HKO4587520", "Toán cao cấp A1", 3, "PGS.TS. Trần Thị B", "", "Toàn trường"],
    [3, "VLU7428", "Tiếng Anh chuyên ngành", 3, "ThS. Lê Văn C", "", "Yêu cầu hoàn thành TA cơ bản"],
    [4, "CNTT102", "Lập trình Web nâng cao", 3, "ThS. Hoàng Minh Tuấn", "K20-CNTT", "Thực hành tại Phòng máy 2"],
    [5, "GDTH305", "Phương pháp dạy học Toán tiểu học", 3, "TS. Phạm Thị Mai", "K2-GDTH A", "Có bài tập thực hành"],
    [6, "GDTC101", "Giáo dục thể chất 1", 1, "ThS. Vũ Hùng Cường", "", "Sân thể dục khu A"]
  ];

  sampleData.forEach((rowVals, idx) => {
    const row = ws.getRow(9 + idx);
    row.values = rowVals;
    row.height = 22;
    row.eachCell((cell, colNumber) => {
      styleCell(cell, {
        size: 11,
        alignment: {
          horizontal: colNumber === 1 || colNumber === 4 ? "center" : colNumber === 2 ? "center" : "left"
        },
        bgColor: idx % 2 === 1 ? "FFF8FAFC" : undefined
      });
    });
  });

  // Độ rộng cột
  ws.columns = [
    { width: 7 },   // STT
    { width: 16 },  // Mã HP
    { width: 38 },  // Tên HP
    { width: 12 },  // Số TC
    { width: 28 },  // GV
    { width: 30 },  // Lớp
    { width: 32 }   // Ghi chú
  ];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Mau_DanhMuc_HocPhan_TinChi_${semesterName.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Đọc file Excel danh mục học phần (bỏ qua phần tiêu đề đầu)
 */
export const parseCourseOfferingsExcel = async (
  file: File,
  periodId: string,
  semesterId: string,
  createdBy: string
): Promise<CourseOffering[]> => {
  const wb = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await wb.xlsx.load(buffer);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File Excel không có trang tính hợp lệ.");

  // Tìm dòng header bảng
  let headerRowIndex = 8;
  for (let r = 1; r <= 20; r++) {
    const row = ws.getRow(r);
    const cellA = String(row.getCell(1).value || "").toLowerCase();
    const cellB = String(row.getCell(2).value || "").toLowerCase();
    if (cellA.includes("stt") || cellB.includes("mã") || cellB.includes("học phần")) {
      headerRowIndex = r;
      break;
    }
  }

  const offerings: CourseOffering[] = [];
  const now = new Date().toISOString();

  for (let r = headerRowIndex + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const subjectCode = String(row.getCell(2).value || "").trim();
    const subjectName = String(row.getCell(3).value || "").trim();
    const creditsRaw = Number(row.getCell(4).value) || 0;
    const teacherName = String(row.getCell(5).value || "").trim();
    const targetClassesRaw = String(row.getCell(6).value || "").trim();
    const notes = String(row.getCell(7).value || "").trim();

    if (!subjectCode || !subjectName) continue;

    const credits = Math.max(1, Math.min(20, Math.round(creditsRaw || 3)));
    const targetClasses = targetClassesRaw
      ? targetClassesRaw.split(/[,;\n]/).map(c => c.trim()).filter(Boolean)
      : undefined;

    offerings.push({
      id: `OFFERING_${semesterId}_${subjectCode.toUpperCase()}`,
      periodId,
      semesterId,
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      credits,
      teacherName: teacherName || "Chưa phân công",
      targetClasses: targetClasses && targetClasses.length > 0 ? targetClasses : undefined,
      isActive: true,
      notes: notes || undefined,
      createdBy,
      createdAt: now,
      updatedAt: now
    });
  }

  if (offerings.length === 0) {
    throw new Error("Không tìm thấy dữ liệu học phần hợp lệ từ dòng " + (headerRowIndex + 1));
  }

  return offerings;
};

/**
 * Xuất Báo Cáo Tổng Hợp Sinh Viên Đăng Ký Tín Chỉ (Chuẩn Times New Roman)
 */
export const exportCreditEnrollmentsReport = async ({
  semesterName,
  classFilter,
  students,
  enrollments,
  minCredits = 12
}: {
  semesterName: string;
  classFilter: string;
  students: Student[];
  enrollments: CreditEnrollment[];
  minCredits?: number;
}) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("BaoCao_DangKy_TinChi", {
    views: [{ showGridLines: true }]
  });

  // Tiêu đề cơ quan
  ws.mergeCells("A1:D1");
  ws.getCell("A1").value = "TRƯỜNG ĐẠI HỌC TÂN TRÀO";
  styleCell(ws.getCell("A1"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("E1:H1");
  ws.getCell("E1").value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
  styleCell(ws.getCell("E1"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("A2:D2");
  ws.getCell("A2").value = "PHÂN HIỆU TẠI TỈNH HÀ GIANG";
  styleCell(ws.getCell("A2"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("E2:H2");
  ws.getCell("E2").value = "Độc lập - Tự do - Hạnh phúc";
  styleCell(ws.getCell("E2"), { size: 11, italic: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("A3:D3");
  ws.getCell("A3").value = "PHÒNG ĐÀO TẠO NCKH & HỢP TÁC QUỐC TẾ";
  styleCell(ws.getCell("A3"), { size: 10, italic: true, alignment: { horizontal: "center" }, border: false });

  // Tiêu đề báo cáo
  ws.mergeCells("A5:H5");
  ws.getCell("A5").value = "BÁO CÁO DANH SÁCH SINH VIÊN ĐĂNG KÝ HỌC TÍN CHỈ";
  styleCell(ws.getCell("A5"), { size: 15, bold: true, alignment: { horizontal: "center" }, fontColor: "FF1E3A8A", border: false });

  ws.mergeCells("A6:H6");
  ws.getCell("A6").value = `Áp dụng: ${semesterName} | Lớp: ${classFilter === "ALL" ? "Toàn trường" : classFilter}`;
  styleCell(ws.getCell("A6"), { size: 11, italic: true, alignment: { horizontal: "center" }, border: false });

  // Header bảng
  const headers = [
    "STT",
    "Mã Sinh Viên",
    "Họ và Tên",
    "Lớp Sinh Hoạt",
    "Tổng Tín Chỉ",
    "Chi Tiết Học Phần Đã Đăng Ký",
    "Trạng Thái",
    "Thời Điểm ĐK Đầu Tiên"
  ];
  const rowHeader = ws.getRow(8);
  rowHeader.values = headers;
  rowHeader.height = 28;

  rowHeader.eachCell((cell) => {
    styleCell(cell, {
      size: 11,
      bold: true,
      alignment: { horizontal: "center", wrapText: true },
      bgColor: "FFE0E7FF",
      fontColor: "FF1E3A8A"
    });
  });

  // Gom nhóm đăng ký theo sinh viên
  const studentMap = new Map<string, { student: Student; studentEnrollments: CreditEnrollment[] }>();

  students.forEach(s => {
    if (classFilter !== "ALL" && s.classId !== classFilter) return;
    studentMap.set(s.id, { student: s, studentEnrollments: [] });
  });

  enrollments.forEach(en => {
    if (!en.isActive) return;
    if (studentMap.has(en.studentId)) {
      studentMap.get(en.studentId)!.studentEnrollments.push(en);
    } else {
      if (classFilter === "ALL" || en.classId === classFilter) {
        studentMap.set(en.studentId, {
          student: {
            id: en.studentId,
            name: en.studentName,
            classId: en.classId,
            email: "",
            facultyId: ""
          } as Student,
          studentEnrollments: [en]
        });
      }
    }
  });

  const sortedStudents = Array.from(studentMap.values()).sort((a, b) => {
    const classCompare = (a.student.classId || "").localeCompare(b.student.classId || "");
    if (classCompare !== 0) return classCompare;
    return (a.student.id || "").localeCompare(b.student.id || "");
  });

  let rowIndex = 9;
  let totalRegisteredStudents = 0;
  let totalCreditsAll = 0;

  sortedStudents.forEach((item, idx) => {
    const s = item.student;
    const ens = item.studentEnrollments;
    const totalCredits = ens.reduce((sum, e) => sum + (Number(e.credits) || 0), 0);

    if (totalCredits > 0) {
      totalRegisteredStudents++;
      totalCreditsAll += totalCredits;
    }

    const detailString = ens.length > 0
      ? ens.map(e => `${e.subjectCode}: ${e.subjectName} (${e.credits}TC)`).join("; ")
      : "Chưa đăng ký";

    const isQualified = totalCredits >= minCredits;
    const statusText = totalCredits === 0 
      ? "Chưa đăng ký" 
      : isQualified 
      ? `Đạt chuẩn (${totalCredits} TC)` 
      : `Chưa đủ min (${totalCredits}/${minCredits} TC)`;

    const firstTime = ens.length > 0 && ens[0].registeredAt
      ? new Date(ens[0].registeredAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })
      : "-";

    const row = ws.getRow(rowIndex);
    row.values = [
      idx + 1,
      s.id,
      s.name,
      s.classId,
      totalCredits,
      detailString,
      statusText,
      firstTime
    ];
    row.height = 24;

    row.eachCell((cell, colNumber) => {
      styleCell(cell, {
        size: 11,
        alignment: {
          horizontal: colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 7 || colNumber === 8 ? "center" : "left",
          wrapText: colNumber === 6
        },
        bgColor: idx % 2 === 1 ? "FFF8FAFC" : undefined,
        fontColor: !isQualified && totalCredits > 0 ? "FFDC2626" : undefined,
        bold: colNumber === 5
      });
    });

    rowIndex++;
  });

  // Dòng tổng kết
  const summaryRow = ws.getRow(rowIndex);
  summaryRow.values = [
    "",
    "TỔNG CỘNG",
    `${totalRegisteredStudents} sinh viên đã đăng ký`,
    "",
    totalCreditsAll,
    `Trung bình: ${totalRegisteredStudents > 0 ? (totalCreditsAll / totalRegisteredStudents).toFixed(1) : 0} TC/SV`,
    "",
    ""
  ];
  summaryRow.height = 26;
  summaryRow.eachCell((cell) => {
    styleCell(cell, {
      size: 11,
      bold: true,
      bgColor: "FFE2E8F0",
      fontColor: "FF1E293B"
    });
  });

  // Chữ ký cuối trang
  const signRowIdx = rowIndex + 3;
  ws.getCell(`F${signRowIdx}`).value = "Hà Giang, ngày ..... tháng ..... năm 20...";
  styleCell(ws.getCell(`F${signRowIdx}`), { italic: true, size: 11, alignment: { horizontal: "center" }, border: false });

  const signTitleIdx = signRowIdx + 1;
  ws.getCell(`B${signTitleIdx}`).value = "NGƯỜI LẬP BÁO CÁO";
  styleCell(ws.getCell(`B${signTitleIdx}`), { bold: true, size: 11, alignment: { horizontal: "center" }, border: false });

  ws.getCell(`F${signTitleIdx}`).value = "TRƯỜNG PHÒNG ĐÀO TẠO NCKH & HTQT";
  styleCell(ws.getCell(`F${signTitleIdx}`), { bold: true, size: 11, alignment: { horizontal: "center" }, border: false });

  // Độ rộng cột
  ws.columns = [
    { width: 6 },   // STT
    { width: 16 },  // Mã SV
    { width: 24 },  // Họ tên
    { width: 16 },  // Lớp
    { width: 14 },  // Tổng TC
    { width: 45 },  // Chi tiết HP
    { width: 22 },  // Trạng thái
    { width: 20 }   // Thời điểm ĐK
  ];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeClassName = classFilter === "ALL" ? "ToanTruong" : classFilter.replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `BaoCao_DangKy_TinChi_${safeClassName}_${semesterName.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Xuất Phiếu Đăng Ký Tín Chỉ Cá Nhân Cho Sinh Viên (Chuẩn Times New Roman)
 */
export const exportStudentEnrollmentSlip = async ({
  student,
  semesterName,
  enrollments,
  maxCredits = 24,
  minCredits = 12
}: {
  student: Student;
  semesterName: string;
  enrollments: CreditEnrollment[];
  maxCredits?: number;
  minCredits?: number;
}) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Phieu_DangKy_TinChi", {
    views: [{ showGridLines: true }]
  });

  // Header cơ quan
  ws.mergeCells("A1:C1");
  ws.getCell("A1").value = "TRƯỜNG ĐẠI HỌC TÂN TRÀO";
  styleCell(ws.getCell("A1"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("D1:F1");
  ws.getCell("D1").value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
  styleCell(ws.getCell("D1"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("A2:C2");
  ws.getCell("A2").value = "PHÂN HIỆU TẠI TỈNH HÀ GIANG";
  styleCell(ws.getCell("A2"), { size: 11, bold: true, alignment: { horizontal: "center" }, border: false });

  ws.mergeCells("D2:F2");
  ws.getCell("D2").value = "Độc lập - Tự do - Hạnh phúc";
  styleCell(ws.getCell("D2"), { size: 11, italic: true, alignment: { horizontal: "center" }, border: false });

  // Tiêu đề
  ws.mergeCells("A4:F4");
  ws.getCell("A4").value = "PHIẾU ĐĂNG KÝ HỌC PHẦN THEO HỆ THỐNG TÍN CHỈ";
  styleCell(ws.getCell("A4"), { size: 15, bold: true, alignment: { horizontal: "center" }, fontColor: "FF1E3A8A", border: false });

  ws.mergeCells("A5:F5");
  ws.getCell("A5").value = `${semesterName}`;
  styleCell(ws.getCell("A5"), { size: 12, italic: true, alignment: { horizontal: "center" }, border: false });

  // Thông tin SV
  ws.mergeCells("A7:C7");
  ws.getCell("A7").value = `Họ và tên: ${student.name}`;
  styleCell(ws.getCell("A7"), { size: 11, bold: true, border: false });

  ws.mergeCells("D7:F7");
  ws.getCell("D7").value = `Mã sinh viên: ${student.id}`;
  styleCell(ws.getCell("D7"), { size: 11, bold: true, border: false });

  ws.mergeCells("A8:C8");
  ws.getCell("A8").value = `Lớp sinh hoạt: ${student.classId}`;
  styleCell(ws.getCell("A8"), { size: 11, border: false });

  ws.mergeCells("D8:F8");
  ws.getCell("D8").value = `Khoa quản lý: ${student.facultyId || "Đại học Thái Nguyên"}`;
  styleCell(ws.getCell("D8"), { size: 11, border: false });

  // Bảng môn học
  const headers = ["STT", "Mã Học Phần", "Tên Học Phần", "Số TC", "Giảng Viên Giảng Dạy", "Ngày Giờ Đăng Ký"];
  const headerRow = ws.getRow(10);
  headerRow.values = headers;
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    styleCell(cell, {
      size: 11,
      bold: true,
      alignment: { horizontal: "center" },
      bgColor: "FFE0E7FF",
      fontColor: "FF1E3A8A"
    });
  });

  let rowIndex = 11;
  let totalCredits = 0;
  enrollments.forEach((en, idx) => {
    totalCredits += Number(en.credits) || 0;
    const row = ws.getRow(rowIndex);
    row.values = [
      idx + 1,
      en.subjectCode,
      en.subjectName,
      en.credits,
      en.teacherName,
      new Date(en.registeredAt).toLocaleString("vi-VN")
    ];
    row.height = 22;
    row.eachCell((cell, colNumber) => {
      styleCell(cell, {
        size: 11,
        alignment: {
          horizontal: colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6 ? "center" : "left"
        },
        bgColor: idx % 2 === 1 ? "FFF8FAFC" : undefined
      });
    });
    rowIndex++;
  });

  // Tổng kết
  const summaryRow = ws.getRow(rowIndex);
  summaryRow.values = ["", "TỔNG SỐ TÍN CHỈ:", "", totalCredits, `(Quy định: ${minCredits} - ${maxCredits} TC)`, ""];
  summaryRow.height = 24;
  summaryRow.eachCell((cell) => {
    styleCell(cell, {
      size: 11,
      bold: true,
      bgColor: "FFE2E8F0"
    });
  });

  // Chữ ký
  const signRowIdx = rowIndex + 3;
  ws.getCell(`D${signRowIdx}`).value = `Hà Giang, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`;
  styleCell(ws.getCell(`D${signRowIdx}`), { italic: true, size: 11, alignment: { horizontal: "center" }, border: false });

  const signTitleIdx = signRowIdx + 1;
  ws.getCell(`B${signTitleIdx}`).value = "XÁC NHẬN PHÒNG ĐÀO TẠO";
  styleCell(ws.getCell(`B${signTitleIdx}`), { bold: true, size: 11, alignment: { horizontal: "center" }, border: false });

  ws.getCell(`D${signTitleIdx}`).value = "SINH VIÊN KÝ TÊN";
  styleCell(ws.getCell(`D${signTitleIdx}`), { bold: true, size: 11, alignment: { horizontal: "center" }, border: false });

  ws.columns = [
    { width: 6 },
    { width: 16 },
    { width: 38 },
    { width: 10 },
    { width: 28 },
    { width: 22 }
  ];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PhieuDangKyTinChi_${student.id}_${semesterName.replace(/[^a-zA-Z0-9_-]/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
