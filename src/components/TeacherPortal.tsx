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

type TeacherExcelCellValue = string | number | null | undefined;

type TeacherExcelCell = {
  col: number;
  value?: TeacherExcelCellValue;
  formula?: string;
  style: number;
};

type TeacherExcelRow = {
  rowNumber: number;
  cells: TeacherExcelCell[];
  height?: number;
};

const TEACHER_EXCEL_COL_COUNT = 17;

const TEACHER_EXCEL_STYLE = {
  normal: 0,
  name: 1,
  center: 2,
  date: 3,
  header: 4,
  title: 5,
  branchTitle: 6,
  topBlank: 7,
  signature: 8,
  dateRight: 9,
  summary: 10
} as const;

const TEACHER_EXCEL_HEADERS = [
  "STT",
  "Mã sinh viên",
  "Họ và tên",
  "Giới tính",
  "Ngày sinh",
  "CC",
  "TX 1",
  "TX2",
  "ĐK 1",
  "ĐK 2",
  "Thi",
  "TB",
  "TB*",
  "Điểm chữ",
  "Xếp loại",
  "Ghi chú",
  "Ngày\r\ncập nhật"
];

const makeCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
};

const CRC32_TABLE = makeCrc32Table();

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const encodeUtf8 = (value: string) => new TextEncoder().encode(value);

const concatUint8Arrays = (parts: Uint8Array[]) => {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach(part => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
};

const getDosDateTime = (date = new Date()) => {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
};

const createStoredZip = (entries: { name: string; content: string | Uint8Array }[]) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { dosTime, dosDate } = getDosDateTime();

  entries.forEach(entry => {
    const nameBytes = encodeUtf8(entry.name);
    const data = typeof entry.content === "string" ? encodeUtf8(entry.content) : entry.content;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return concatUint8Arrays([...localParts, centralDirectory, endRecord]);
};

const escapeXml = (value: TeacherExcelCellValue) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&apos;");

const escapeXmlText = (value: TeacherExcelCellValue) => escapeXml(value).replace(/\r/g, "&#13;");

const columnName = (col: number) => {
  let name = "";
  let current = col;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
};

const cellRef = (row: number, col: number) => `${columnName(col)}${row}`;

const serializeCell = (row: number, cell: TeacherExcelCell) => {
  const ref = cellRef(row, cell.col);
  const style = ` s=\"${cell.style}\"`;
  const value = cell.value;
  const formula = cell.formula;

  if (formula) {
    const isStringResult = typeof value === "string" && !/^-?\d+(\.\d+)?$/.test(value.trim());
    const typeAttr = isStringResult ? ' t="str"' : "";
    const valTag = (value !== undefined && value !== null && value !== "") ? `<v>${escapeXmlText(value)}</v>` : "";
    return `<c r=\"${ref}\"${style}${typeAttr}><f>${escapeXml(formula)}</f>${valTag}</c>`;
  }

  if (value === undefined || value === null || value === "") {
    return `<c r=\"${ref}\"${style}/>`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r=\"${ref}\"${style}><v>${value}</v></c>`;
  }

  const text = String(value);
  const preserve = /^\s|\s$|\r|\n| {2,}/.test(text) ? ' xml:space="preserve"' : "";
  return `<c r=\"${ref}\"${style} t=\"inlineStr\"><is><t${preserve}>${escapeXmlText(text)}</t></is></c>`;
};

const createStyledTeacherSheetXml = (
  rows: TeacherExcelRow[],
  merges: string[],
  lastRow: number,
  subjectCode: string,
  classId: string
) => {
  const rowXml = rows
    .sort((a, b) => a.rowNumber - b.rowNumber)
    .map(row => {
      const height = row.height ? ` ht=\"${row.height}\" customHeight=\"1\"` : "";
      const cells = row.cells
        .sort((a, b) => a.col - b.col)
        .map(cell => serializeCell(row.rowNumber, cell))
        .join("");
      return `<row r=\"${row.rowNumber}\" spans=\"1:${TEACHER_EXCEL_COL_COUNT}\"${height}>${cells}</row>`;
    })
    .join("");

  const mergeXml = merges.length
    ? `<mergeCells count=\"${merges.length}\">${merges.map(ref => `<mergeCell ref=\"${ref}\"/>`).join("")}</mergeCells>`
    : "";

  const safeSubjectCode = sanitizeFilePart(subjectCode || "HP");
  const safeClassId = sanitizeFilePart(classId || "Lop");
  const footerText = `Danh_sach_diem_hoc_phan_${safeSubjectCode}_${safeClassId}`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
  <dimension ref="A1:Q${lastRow}"/>
  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane xSplit="5" ySplit="2" topLeftCell="F3" activePane="bottomRight" state="frozen"/><selection pane="topRight" activeCell="F1" sqref="F1"/><selection pane="bottomLeft" activeCell="A3" sqref="A3"/><selection pane="bottomRight" activeCell="F3" sqref="F3"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="13.2" x14ac:dyDescent="0.25"/>
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/>
    <col min="2" max="2" width="18" customWidth="1"/>
    <col min="3" max="3" width="28" customWidth="1"/>
    <col min="4" max="4" width="8" customWidth="1"/>
    <col min="5" max="5" width="14" customWidth="1"/>
    <col min="6" max="13" width="6" customWidth="1"/>
    <col min="14" max="14" width="10" customWidth="1"/>
    <col min="15" max="15" width="12" customWidth="1"/>
    <col min="16" max="16" width="12" customWidth="1"/>
    <col min="17" max="17" width="15" customWidth="1"/>
  </cols>
  <sheetData>${rowXml}</sheetData>
  ${mergeXml}
  <dataValidations count="1">
    <dataValidation type="decimal" operator="between" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="Lỗi nhập điểm" error="Điểm số nhập vào phải là số từ 0.0 đến 10.0!" sqref="F3:K${lastRow}">
      <formula1>0</formula1>
      <formula2>10</formula2>
    </dataValidation>
  </dataValidations>
  <pageMargins left="0.98425" right="0.19685" top="0.98425" bottom="0.7874" header="0.3937" footer="0.3937"/>
  <pageSetup paperSize="9" orientation="landscape" scale="85"/>
  <headerFooter>
    <oddFooter>&amp;C${escapeXml(footerText)}</oddFooter>
  </headerFooter>
</worksheet>`;
};

const createTeacherExcelStylesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
  <fonts count="2" x14ac:knownFonts="1"><font><sz val="10"/><color rgb="FF000000"/><name val="Times New Roman"/><family val="1"/><charset val="163"/></font><font><b/><sz val="10"/><color rgb="FF000000"/><name val="Times New Roman"/><family val="1"/><charset val="163"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="4"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color indexed="64"/></left><right style="thin"><color indexed="64"/></right><top style="thin"><color indexed="64"/></top><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color indexed="64"/></bottom><diagonal/></border><border><left/><right/><top style="thin"><color indexed="64"/></top><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="11">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

const createTeacherWorkbookEntries = (sheetName: string, sheetXml: string) => {
  const safeSheetName = escapeXml(sheetName);
  const createdAt = new Date().toISOString();

  return [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`
    },
    {
      name: "docProps/app.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>UniHub HG</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>${safeSheetName}</vt:lpstr></vt:vector></TitlesOfParts><Company>PHHG</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>`
    },
    {
      name: "docProps/core.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>UniHub HG</dc:creator><cp:lastModifiedBy>UniHub HG</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified></cp:coreProperties>`
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr/><bookViews><workbookView workbookViewId="0"/></bookViews><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029"/></workbook>`
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
    },
    { name: "xl/styles.xml", content: createTeacherExcelStylesXml() },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml }
  ];
};

const sanitizeExcelSheetName = (value: string) => {
  const cleaned = (value || "BangDiem")
    .replace(/[\\/?*\[\]:]/g, "")
    .replace(/[^\p{L}\p{N}_ -]/gu, "")
    .trim();
  return (cleaned || "BangDiem").slice(0, 31);
};

const sanitizeFilePart = (value: string) => (value || "Bang_diem")
  .replace(/[\\/:*?\"<>|]+/g, "_")
  .replace(/\s+/g, "_")
  .replace(/_+/g, "_")
  .replace(/^_|_$/g, "");

type TeacherPdfStats = {
  xuatSac: number;
  gioi: number;
  kha: number;
  trungBinh: number;
  yeu: number;
  kem: number;
  dat: number;
  total: number;
};

type PdfMakeInstance = {
  vfs?: Record<string, string>;
  fonts?: Record<string, unknown>;
  createPdf: (definition: unknown) => { download: (fileName?: string) => void };
};

const pdfValue = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const pdfPercent = (count: number, total: number) => total ? Math.round((count / total) * 100) : 0;

const configurePdfMake = async () => {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const vfsFontsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake = ((pdfMakeModule as any).default || pdfMakeModule) as PdfMakeInstance;
  const vfsSource = (vfsFontsModule as any).default || vfsFontsModule;
  pdfMake.vfs = vfsSource.pdfMake?.vfs || vfsSource.vfs || pdfMake.vfs;
  pdfMake.fonts = {
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf"
    }
  };
  return pdfMake;
};

const createStatisticCard = (
  title: string,
  count: number,
  total: number,
  colors: { fill: string; border: string; text: string }
) => ({
  table: {
    widths: ["*"],
    body: [
      [{ text: title, style: "statLabel", color: colors.text, alignment: "center", border: [false, false, false, false] }],
      [{
        text: [
          { text: String(count), style: "statNumber", color: colors.text },
          { text: `  (${pdfPercent(count, total)}%)`, style: "statPercent" }
        ],
        alignment: "center",
        border: [false, false, false, false]
      }]
    ]
  },
  fillColor: colors.fill,
  layout: {
    hLineColor: () => colors.border,
    vLineColor: () => colors.border,
    hLineWidth: () => 0.6,
    vLineWidth: () => 0.6,
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 5,
    paddingBottom: () => 5
  },
  margin: [0, 0, 0, 0]
});

const downloadTeacherGradeReportPdf = async (
  assignment: CourseClassAssignment,
  grades: SubjectStudentGrade[],
  stats: TeacherPdfStats
) => {
  const pdfMake = await configurePdfMake();
  const now = new Date();
  const weakCount = stats.trungBinh + stats.yeu + stats.kem;
  const fileName = `Bao_cao_pho_diem_${sanitizeFilePart(assignment.subjectCode)}_${sanitizeFilePart(assignment.classId)}.pdf`;

  const tableBody = [
    [
      { text: "STT", style: "tableHeader", alignment: "center" },
      { text: "MÃ SV", style: "tableHeader" },
      { text: "HỌ VÀ TÊN", style: "tableHeader" },
      { text: "CC", style: "tableHeader", alignment: "center" },
      { text: "THI", style: "tableHeader", alignment: "center" },
      { text: "TB (10)", style: "tableHeader", alignment: "center" },
      { text: "ĐIỂM CHỮ", style: "tableHeader", alignment: "center" },
      { text: "XẾP LOẠI", style: "tableHeader", alignment: "center" }
    ],
    ...(grades.length ? grades : [{ studentId: "", studentName: "Chưa có dữ liệu sinh viên", classId: assignment.classId } as SubjectStudentGrade]).map((grade, index) => [
      { text: grades.length ? String(index + 1) : "-", style: "mutedMono", alignment: "center" },
      { text: pdfValue(grade.studentId), style: "bodyMonoStrong" },
      { text: pdfValue(grade.studentName), style: "bodyStrong" },
      { text: pdfValue(grade.cc), style: "bodyMono", alignment: "center" },
      { text: pdfValue(grade.exam), style: "blueMonoStrong", alignment: "center" },
      { text: pdfValue(grade.tb10), style: "bodyMonoStrong", alignment: "center" },
      { text: pdfValue(grade.diemChu), style: "blueMonoStrong", alignment: "center" },
      { text: pdfValue(grade.xepLoai), style: "bodyStrong", alignment: "center" }
    ])
  ];

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [28, 30, 28, 34],
    defaultStyle: {
      font: "Roboto",
      fontSize: 8.5,
      color: "#0f172a",
      lineHeight: 1.12
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `UniHub - ${assignment.subjectCode} - ${assignment.classId}`, alignment: "left", color: "#94a3b8", fontSize: 7 },
        { text: `${currentPage}/${pageCount}`, alignment: "right", color: "#94a3b8", fontSize: 7 }
      ],
      margin: [28, 0, 28, 0]
    }),
    content: [
      { text: "ĐẠI HỌC THÁI NGUYÊN", style: "schoolLine" },
      { text: "PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI TỈNH HÀ GIANG", style: "branchLine" },
      { text: "KHOA / BỘ MÔN CHUYÊN MÔN", style: "facultyLine" },
      { text: "BÁO CÁO PHỔ ĐIỂM & BẢNG TỔNG KẾT MÔN HỌC", style: "reportTitle" },
      { text: `Môn học: ${assignment.subjectName} (${assignment.subjectCode}) - Lớp: ${assignment.classId}`, style: "subtitle" },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 0.6, lineColor: "#e2e8f0" }],
        margin: [0, 10, 0, 12]
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: [{ text: "Giảng viên giảng dạy: " }, { text: assignment.teacherName, bold: true }] },
              { text: [{ text: "Lớp học phần: " }, { text: assignment.classId, bold: true, fontSize: 8.2 }], margin: [0, 10, 0, 0] }
            ]
          },
          {
            width: "50%",
            stack: [
              { text: [{ text: "Số tín chỉ học phần: " }, { text: `${assignment.credits} TC`, bold: true }] },
              { text: [{ text: "Tổng số sinh viên: " }, { text: `${stats.total} SV`, bold: true }], margin: [0, 10, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 14]
      },
      {
        table: {
          widths: ["*"],
          body: [[
            {
              border: [false, false, false, false],
              fillColor: "#f8fafc",
              stack: [
                { text: "TÓM TẮT PHÂN BỐ PHỔ ĐIỂM HỌC PHẦN:", style: "sectionTitle", margin: [0, 0, 0, 8] },
                {
                  columns: [
                    createStatisticCard("Xuất sắc", stats.xuatSac, stats.total, { fill: "#faf5ff", border: "#e9d5ff", text: "#7e22ce" }),
                    createStatisticCard("Giỏi", stats.gioi, stats.total, { fill: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" }),
                    createStatisticCard("Khá", stats.kha, stats.total, { fill: "#ecfeff", border: "#a5f3fc", text: "#0e7490" }),
                    createStatisticCard("Trung bình & Yếu", weakCount, stats.total, { fill: "#fffbeb", border: "#fde68a", text: "#b45309" })
                  ],
                  columnGap: 6
                }
              ]
            }
          ]]
        },
        layout: {
          hLineColor: () => "#dbe4ef",
          vLineColor: () => "#dbe4ef",
          hLineWidth: () => 0.7,
          vLineWidth: () => 0.7,
          paddingLeft: () => 12,
          paddingRight: () => 12,
          paddingTop: () => 11,
          paddingBottom: () => 11
        },
        margin: [0, 0, 0, 14]
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: [24, 72, "*", 30, 34, 42, 52, 58],
          body: tableBody
        },
        layout: {
          fillColor: (rowIndex: number) => {
            if (rowIndex === 0) return "#f1f5f9";
            return rowIndex % 2 === 0 ? "#f8fafc" : null;
          },
          hLineColor: () => "#cbd5e1",
          vLineColor: () => "#dbe4ef",
          hLineWidth: (i: number) => i === 0 || i === tableBody.length ? 0.7 : 0.45,
          vLineWidth: () => 0.45,
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 5,
          paddingBottom: () => 5
        }
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 0.6, lineColor: "#e2e8f0" }],
        margin: [0, 18, 0, 10]
      },
      {
        columns: [
          {
            width: "42%",
            stack: [
              { text: "XÁC NHẬN CỦA TRƯỞNG BỘ MÔN", style: "signatureTitle" },
              { text: "\n\n\n\n", fontSize: 10 },
              { text: "(Ký & ghi rõ họ tên)", style: "signatureHint" }
            ],
            alignment: "center"
          },
          { width: "16%", text: "" },
          {
            width: "42%",
            stack: [
              { text: `Hà Giang, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`, italics: true, fontSize: 8.2, margin: [0, 0, 0, 5] },
              { text: "GIẢNG VIÊN GIẢNG DẠY", style: "signatureTitle" },
              { text: "\n\n\n", fontSize: 10 },
              { text: assignment.teacherName, style: "teacherSignature" }
            ],
            alignment: "center"
          }
        ],
        margin: [0, 0, 0, 0]
      }
    ],
    styles: {
      schoolLine: { alignment: "center", fontSize: 10, bold: true, color: "#475569", margin: [0, 0, 0, 2] },
      branchLine: { alignment: "center", fontSize: 11.5, bold: true, color: "#1e3a8a", margin: [0, 0, 0, 2] },
      facultyLine: { alignment: "center", fontSize: 9.5, bold: true, color: "#64748b", margin: [0, 0, 0, 10] },
      reportTitle: { alignment: "center", fontSize: 13.5, bold: true, color: "#0f172a", margin: [0, 0, 0, 5] },
      subtitle: { alignment: "center", fontSize: 8.4, italics: true, color: "#475569" },
      sectionTitle: { fontSize: 8.8, bold: true, color: "#334155" },
      statLabel: { fontSize: 7.2, bold: true },
      statNumber: { fontSize: 12.5, bold: true },
      statPercent: { fontSize: 7.2, color: "#64748b" },
      tableHeader: { fontSize: 7, bold: true, color: "#334155" },
      bodyStrong: { fontSize: 7.7, bold: true, color: "#0f172a" },
      bodyMono: { fontSize: 7.5, color: "#0f172a" },
      bodyMonoStrong: { fontSize: 7.5, bold: true, color: "#0f172a" },
      blueMonoStrong: { fontSize: 7.5, bold: true, color: "#1d4ed8" },
      mutedMono: { fontSize: 7.2, color: "#64748b" },
      signatureTitle: { fontSize: 8.6, bold: true, color: "#0f172a" },
      signatureHint: { fontSize: 7.8, bold: true, color: "#64748b" },
      teacherSignature: { fontSize: 8.8, bold: true, color: "#1e3a8a" }
    }
  };

  pdfMake.createPdf(docDefinition).download(fileName);
};

const excelDateSerial = (value?: string | number) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  const vietnamese = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  let date: Date | null = null;

  if (iso) {
    date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  } else if (vietnamese) {
    date = new Date(Date.UTC(Number(vietnamese[3]), Number(vietnamese[2]) - 1, Number(vietnamese[1])));
  } else {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      date = new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.floor((date.getTime() - Date.UTC(1899, 11, 30)) / 86400000);
};

const scoreOrBlank = (value: number | string | undefined, blankValue: string = "") => {
  if (value === undefined || value === null || value === "") return blankValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : String(value);
};

const formatSemesterForExcelTitle = (assignment: CourseClassAssignment) => {
  const raw = assignment.semesterName || "";
  const semesterMatch = raw.match(/Học\s*k[ỳìi]\s*([IVX]+)\s*[-–]\s*(\d{4})\s*[-–]\s*(\d{4})/i);
  if (semesterMatch) {
    return `HỌC KÌ ${semesterMatch[1].toUpperCase()}, NĂM HỌC ${semesterMatch[2]} - ${semesterMatch[3]}`;
  }

  const idMatch = assignment.semesterId.match(/HOCKY_(\d)_(\d{4})_(\d{4})/i);
  if (idMatch) {
    const semesterRoman = idMatch[1] === "1" ? "I" : "II";
    return `HỌC KÌ ${semesterRoman}, NĂM HỌC ${idMatch[2]} - ${idMatch[3]}`;
  }

  return (raw || "HỌC KÌ II, NĂM HỌC 2025 - 2026")
    .toLocaleUpperCase("vi-VN")
    .replace(/KỲ/g, "KÌ");
};

const createTeacherGradeWorkbookBlob = (
  assignment: CourseClassAssignment,
  grades: SubjectStudentGrade[],
  teacherName: string,
  currentUserName?: string
) => {
  let scoreCount = 0;
  let scoreSum = 0;
  grades.forEach(grade => {
    [grade.cc, grade.tx1, grade.tx2, grade.dk1, grade.dk2, grade.exam].forEach(value => {
      const parsed = parseFloat(String(value));
      if (!Number.isNaN(parsed)) {
        scoreCount++;
        scoreSum += parsed;
      }
    });
  });

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const exportDateText = `Tuyên Quang, ngày ${day} tháng ${month} năm ${year}`;
  const exportDateSerial = excelDateSerial(`${year}-${month}-${day}`);
  const titleBlock = `ĐIỂM HỌC TẬP ${formatSemesterForExcelTitle(assignment)}\r\nLỚP ${assignment.className || assignment.classId}\r\nHọc phần: ${assignment.subjectName}\r\nSố tín chỉ: ${assignment.credits}                Mã học phần: ${assignment.subjectCode}`;

  const rows: TeacherExcelRow[] = [
    {
      rowNumber: 1,
      height: 72.6,
      cells: Array.from({ length: TEACHER_EXCEL_COL_COUNT }, (_, index) => {
        const col = index + 1;
        if (col === 1) return { col, value: "PHÂN HIỆU ĐHTN TẠI HÀ GIANG", style: TEACHER_EXCEL_STYLE.branchTitle };
        if (col >= 2 && col <= 3) return { col, value: "", style: TEACHER_EXCEL_STYLE.branchTitle };
        if (col === 4) return { col, value: titleBlock, style: TEACHER_EXCEL_STYLE.title };
        if (col >= 5 && col <= 12) return { col, value: "", style: TEACHER_EXCEL_STYLE.title };
        return { col, value: "", style: TEACHER_EXCEL_STYLE.topBlank };
      })
    },
    {
      rowNumber: 2,
      height: 26.4,
      cells: TEACHER_EXCEL_HEADERS.map((header, index) => ({
        col: index + 1,
        value: header,
        style: TEACHER_EXCEL_STYLE.header
      }))
    }
  ];

  grades.forEach((grade, index) => {
    const rowNumber = index + 3;
    const dobSerial = excelDateSerial(grade.dob);
    
    // Ensure studentId always retains its DTG prefix (e.g. DTG245140202004)
    let formattedStudentId = String(grade.studentId || "").trim();
    if (formattedStudentId && !formattedStudentId.toUpperCase().startsWith("DTG")) {
      formattedStudentId = `DTG${formattedStudentId}`;
    }

    const values: TeacherExcelCellValue[] = [
      index + 1,
      formattedStudentId,
      grade.studentName,
      grade.gender || "Nam",
      dobSerial ?? (grade.dob || ""),
      scoreOrBlank(grade.cc, "-"),
      scoreOrBlank(grade.tx1),
      scoreOrBlank(grade.tx2),
      scoreOrBlank(grade.dk1),
      scoreOrBlank(grade.dk2),
      scoreOrBlank(grade.exam),
      scoreOrBlank(grade.tb10),
      scoreOrBlank(grade.tb4),
      grade.diemChu || "",
      grade.xepLoai || "",
      grade.notes || "",
      exportDateSerial ?? `${year}-${month}-${day}`
    ];

    const r = rowNumber;
    const formulaTb10 = `ROUND(IF(COUNT(F${r},K${r})>0, F${r}*0.1 + AVERAGE(G${r}:H${r})*0.2 + AVERAGE(I${r}:J${r})*0.2 + K${r}*0.5, 0), 1)`;
    const formulaTb4 = `IF(L${r}>=8.5,4.0,IF(L${r}>=8.0,3.5,IF(L${r}>=7.0,3.0,IF(L${r}>=6.5,2.5,IF(L${r}>=5.5,2.0,IF(L${r}>=5.0,1.5,IF(L${r}>=4.0,1.0,0.0)))))))`;
    const formulaDiemChu = `IF(L${r}>=8.5,"A",IF(L${r}>=7.0,"B",IF(L${r}>=5.5,"C",IF(L${r}>=4.0,"D","F"))))`;
    const formulaXepLoai = `IF(L${r}>=9.0,"Xuất sắc",IF(L${r}>=8.0,"Giỏi",IF(L${r}>=7.0,"Khá",IF(L${r}>=5.0,"Trung bình",IF(L${r}>=4.0,"Yếu","Kém")))))`;

    rows.push({
      rowNumber,
      cells: values.map((value, valueIndex) => {
        const col = valueIndex + 1;
        const style = col === 3
          ? TEACHER_EXCEL_STYLE.name
          : (col === 5 || col === 17) && typeof value === "number"
            ? TEACHER_EXCEL_STYLE.date
            : TEACHER_EXCEL_STYLE.center;

        let formula: string | undefined = undefined;
        if (col === 12) formula = formulaTb10;
        else if (col === 13) formula = formulaTb4;
        else if (col === 14) formula = formulaDiemChu;
        else if (col === 15) formula = formulaXepLoai;

        return { col, value, formula, style };
      })
    });
  });

  const summaryRow = grades.length + 3;
  const dateRow = summaryRow + 2;
  const signatureRow = dateRow + 2;
  const teacherNameRow = signatureRow + 5;
  const summaryText = `Bảng điểm từ CC đến thi có ${scoreCount} con điểm, với tổng điểm = ${Math.round(scoreSum * 10) / 10}`;
  const signerName = teacherName || currentUserName || "Giảng viên";

  rows.push(
    {
      rowNumber: summaryRow,
      height: 26.4,
      cells: Array.from({ length: 15 }, (_, idx) => ({
        col: idx + 2,
        value: idx === 0 ? summaryText : "",
        style: TEACHER_EXCEL_STYLE.summary
      }))
    },
    {
      rowNumber: dateRow,
      cells: Array.from({ length: 7 }, (_, idx) => ({
        col: idx + 11,
        value: idx === 0 ? exportDateText : "",
        style: TEACHER_EXCEL_STYLE.dateRight
      }))
    },
    {
      rowNumber: signatureRow,
      cells: [
        { col: 2, value: "Lãnh đạo Khoa", style: TEACHER_EXCEL_STYLE.signature },
        { col: 3, value: "", style: TEACHER_EXCEL_STYLE.signature },
        { col: 13, value: "Giảng viên", style: TEACHER_EXCEL_STYLE.signature },
        { col: 14, value: "", style: TEACHER_EXCEL_STYLE.signature },
        { col: 15, value: "", style: TEACHER_EXCEL_STYLE.signature },
        { col: 16, value: "", style: TEACHER_EXCEL_STYLE.signature }
      ]
    },
    {
      rowNumber: teacherNameRow,
      height: 15.6,
      cells: [
        { col: 13, value: signerName, style: TEACHER_EXCEL_STYLE.signature },
        { col: 14, value: "", style: TEACHER_EXCEL_STYLE.signature },
        { col: 15, value: "", style: TEACHER_EXCEL_STYLE.signature },
        { col: 16, value: "", style: TEACHER_EXCEL_STYLE.signature }
      ]
    }
  );

  const merges = [
    "A1:C1",
    "D1:L1",
    `B${summaryRow}:P${summaryRow}`,
    `K${dateRow}:Q${dateRow}`,
    `B${signatureRow}:C${signatureRow}`,
    `M${signatureRow}:P${signatureRow}`,
    `M${teacherNameRow}:P${teacherNameRow}`
  ];

  const sheetXml = createStyledTeacherSheetXml(
    rows,
    merges,
    teacherNameRow,
    assignment.subjectCode,
    assignment.classId || assignment.className
  );
  const sheetName = sanitizeExcelSheetName((assignment.className || assignment.classId || "BangDiem").replace(/[^\p{L}\p{N}]/gu, ""));
  const zipBytes = createStoredZip(createTeacherWorkbookEntries(sheetName, sheetXml));
  return new Blob([zipBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
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

  // Helper: Normalize class name strings (ignores spaces, hyphens, case)
  const normalizeClass = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Find or initialize subject grade sheet
  const activeGradeSheet = useMemo(() => {
    if (!activeAssignment) return null;
    const existing = subjectGradeSheets.find(s => 
      s.semesterId === activeAssignment.semesterId &&
      normalizeClass(s.classId) === normalizeClass(activeAssignment.classId) &&
      s.subjectCode === activeAssignment.subjectCode
    );
    if (existing) return existing;

    // Build initial list from class students imported by Training Dept
    const targetNormClass = normalizeClass(activeAssignment.classId);
    const classStudents = students.filter(s => {
      const sNorm = normalizeClass(s.classId || "");
      return sNorm === targetNormClass || targetNormClass.includes(sNorm) || sNorm.includes(targetNormClass);
    });

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
    if (!activeAssignment) return;
    
    const targetNormClass = normalizeClass(activeAssignment.classId);
    const matchingTrainingStudents = students.filter(s => {
      const sNorm = normalizeClass(s.classId || "");
      if (!sNorm || !targetNormClass) return false;
      return sNorm === targetNormClass || targetNormClass.includes(sNorm) || sNorm.includes(targetNormClass);
    });

    let baseGrades: SubjectStudentGrade[] = activeGradeSheet?.grades ? [...activeGradeSheet.grades] : [];

    const defaultSeedStudents = [
      { id: "DTG2357140202099", name: "Hoàng Hải Nam", gender: "Nam", dob: "2006-01-01", classId: activeAssignment.classId },
      { id: "DTG245140202002", name: "Đỗ Thị Huyền Anh", gender: "Nữ", dob: "2006-03-15", classId: activeAssignment.classId },
      { id: "DTG245140202004", name: "Hứa Hải Anh", gender: "Nam", dob: "2006-04-10", classId: activeAssignment.classId },
      { id: "DTG245140202007", name: "Hoàng Thị Ngọc Ánh", gender: "Nữ", dob: "2006-08-22", classId: activeAssignment.classId },
      { id: "DTG245140202053", name: "Ma Văn Long", gender: "Nam", dob: "2006-05-20", classId: activeAssignment.classId }
    ];

    const sourceStudents = matchingTrainingStudents.length > 0 ? matchingTrainingStudents : defaultSeedStudents;

    const cleanId = (str: string) => String(str || "").replace(/^DTG/i, "").toLowerCase();

    if (baseGrades.length === 0) {
      baseGrades = sourceStudents.map((s: any, idx: number) => ({
        studentId: String(s.id || s.studentId || `STUDENT_${idx + 1}`).trim(),
        studentName: String(s.name || s.studentName || `Sinh viên ${idx + 1}`).trim(),
        gender: s.gender || "Nam",
        dob: s.dob || "2006-01-01",
        classId: s.classId || activeAssignment.classId,
        cc: "", tx1: "", tx2: "", dk1: "", dk2: "", exam: "", tb10: "", tb4: "", diemChu: "", xepLoai: ""
      }));
    } else {
      // Auto-merge ANY missing Training Dept students into existing sheet
      sourceStudents.forEach((st: any) => {
        const stId = String(st.id || st.studentId || "").trim();
        const stName = String(st.name || st.studentName || "").trim();
        const exists = baseGrades.some(g => 
          cleanId(g.studentId) === cleanId(stId) ||
          (g.studentName && g.studentName.trim().toLowerCase() === stName.toLowerCase())
        );
        if (!exists) {
          baseGrades.push({
            studentId: stId || `SV_${Date.now()}_${baseGrades.length + 1}`,
            studentName: stName || "Sinh viên mới",
            gender: st.gender || "Nam",
            dob: st.dob || "2006-01-01",
            classId: st.classId || activeAssignment.classId,
            cc: "", tx1: "", tx2: "", dk1: "", dk2: "", exam: "", tb10: "", tb4: "", diemChu: "", xepLoai: ""
          });
        }
      });
    }

    // Normalize studentId AND recalculate all scores according to the current grade scale!
    const normalized = baseGrades.map((g: any, idx: number) => {
      const fallbackId = `SV_${Date.now()}_${idx + 1}`;
      const item = {
        ...g,
        studentId: String(g.studentId || g.id || fallbackId).trim(),
        studentName: String(g.studentName || g.name || `Sinh viên ${idx + 1}`).trim()
      };
      return calculateSingleRow(item);
    });

    setCurrentGrades(normalized);
  }, [activeGradeSheet, activeAssignment, students]);

  // Auto-sync currentGrades to persistent storage so F5/Reload never loses student grades
  React.useEffect(() => {
    if (!activeAssignment || currentGrades.length === 0) return;
    
    const hasAnyScores = currentGrades.some(g => (g.cc && g.cc !== "-") || (g.exam && g.exam !== "-") || g.tx1 || g.tx2 || g.dk1 || g.dk2);
    if (!hasAnyScores) return;

    const sheetToSave: SubjectGradeSheet = {
      id: activeGradeSheet?.id || `GRADE_${activeAssignment.semesterId}_${activeAssignment.classId}_${activeAssignment.subjectCode}`,
      semesterId: activeAssignment.semesterId,
      classId: activeAssignment.classId,
      subjectCode: activeAssignment.subjectCode,
      subjectName: activeAssignment.subjectName,
      credits: activeAssignment.credits,
      teacherId: currentUser?.email || "teacher",
      teacherName: currentUser?.name || "Giảng viên",
      status: activeGradeSheet?.status || "DRAFT",
      grades: currentGrades,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    saveSubjectGradeSheet(sheetToSave);
  }, [currentGrades, activeAssignment]);

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

    if (tb10 >= 9.0) { tb4 = 4.0; diemChu = "A"; xepLoai = "Xuất sắc"; }
    else if (tb10 >= 8.5) { tb4 = 4.0; diemChu = "A"; xepLoai = "Giỏi"; }
    else if (tb10 >= 8.0) { tb4 = 3.5; diemChu = "B"; xepLoai = "Giỏi"; }
    else if (tb10 >= 7.0) { tb4 = 3.0; diemChu = "B"; xepLoai = "Khá"; }
    else if (tb10 >= 6.5) { tb4 = 2.5; diemChu = "C"; xepLoai = "Khá"; }
    else if (tb10 >= 5.5) { tb4 = 2.0; diemChu = "C"; xepLoai = "Trung bình"; }
    else if (tb10 >= 5.0) { tb4 = 1.5; diemChu = "D"; xepLoai = "Trung bình"; }
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

  const handleTeacherSelfUnlock = () => {
    if (!activeGradeSheet) return;
    const updatedSheet: SubjectGradeSheet = {
      ...activeGradeSheet,
      status: "DRAFT",
      updatedAt: new Date().toISOString().split("T")[0]
    };
    saveSubjectGradeSheet(updatedSheet);
    setSaveSuccessMsg("Đã mở lại bảng điểm thành công! Giảng viên có thể tiếp tục nhập và sửa điểm.");
    setTimeout(() => setSaveSuccessMsg(""), 4000);
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

    const teacherName = activeAssignment.teacherName || currentUser?.name || "Giảng viên";
    const workbookBlob = createTeacherGradeWorkbookBlob(
      activeAssignment,
      currentGrades,
      teacherName,
      currentUser?.name
    );
    const fileName = `Danh_sach_diem_hoc_phan_${sanitizeFilePart(activeAssignment.subjectCode)}_${sanitizeFilePart(activeAssignment.classId)}.xlsx`;
    downloadBlob(workbookBlob, fileName);
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

        // Find header row containing "Mã sinh viên" or "Mã SV"
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(12, jsonData.length); i++) {
          if (jsonData[i] && jsonData[i].some(cell => String(cell).includes("Mã sinh viên") || String(cell).includes("Mã SV"))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          alert("File Excel không đúng định dạng mẫu điểm học phần (Không tìm thấy dòng tiêu đề 'Mã sinh viên')!");
          return;
        }

        const headerRow = jsonData[headerRowIndex].map(c => String(c || "").trim());
        const isNewFormat = headerRow.length <= 18 && (headerRow[5] === "CC" || headerRow[5]?.includes("CC"));

        const importedRows: SubjectStudentGrade[] = [];
        const scoreSyntaxWarnings: string[] = [];

        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[1]) continue; 

          const stId = String(row[1]).trim();
          if (!stId || stId.startsWith("Bảng điểm") || stId.startsWith("Lãnh đạo") || stId.startsWith("Giảng viên")) continue;

          let rawCc = "", rawTx1 = "", rawTx2 = "", rawDk1 = "", rawDk2 = "", rawExam = "";
          let gender = "Nam", dob = "2006-01-01";

          if (isNewFormat) {
            gender = String(row[3] || "Nam").trim();
            dob = String(row[4] || "2006-01-01").trim();
            rawCc = row[5] !== undefined ? row[5] : "";
            rawTx1 = row[6] !== undefined ? row[6] : "";
            rawTx2 = row[7] !== undefined ? row[7] : "";
            rawDk1 = row[8] !== undefined ? row[8] : "";
            rawDk2 = row[9] !== undefined ? row[9] : "";
            rawExam = row[10] !== undefined ? row[10] : "";
          } else {
            gender = String(row[3] || "Nam").trim();
            dob = String(row[4] || "2006-01-01").trim();
            rawCc = row[11] !== undefined ? row[11] : "";
            rawTx1 = row[12] !== undefined ? row[12] : "";
            rawTx2 = row[13] !== undefined ? row[13] : "";
            rawDk1 = row[14] !== undefined ? row[14] : "";
            rawDk2 = row[15] !== undefined ? row[15] : "";
            rawExam = row[16] !== undefined ? row[16] : "";
          }

          const studentNameStr = String(row[2] || "").trim() || stId;

          // Check for score syntax errors (e.g. .5.5 or 8.5.5 or > 10 or < 0)
          [
            { val: rawCc, label: "CC" },
            { val: rawTx1, label: "TX1" },
            { val: rawTx2, label: "TX2" },
            { val: rawDk1, label: "ĐK1" },
            { val: rawDk2, label: "ĐK2" },
            { val: rawExam, label: "Thi" }
          ].forEach(item => {
            if (item.val !== undefined && item.val !== null && item.val !== "" && item.val !== "-") {
              const strVal = String(item.val).trim();
              if (/\d+\.\d+\.\d+/.test(strVal) || /^\.\./.test(strVal)) {
                scoreSyntaxWarnings.push(`SV ${studentNameStr} (${stId}): Ô ${item.label} bị thừa/lỗi dấu ("${strVal}")`);
              } else {
                const num = parseFloat(strVal.replace(",", "."));
                if (isNaN(num)) {
                  scoreSyntaxWarnings.push(`SV ${studentNameStr} (${stId}): Ô ${item.label} chứa ký tự lạ ("${strVal}")`);
                } else if (num < 0 || num > 10) {
                  scoreSyntaxWarnings.push(`SV ${studentNameStr} (${stId}): Ô ${item.label} có điểm = ${num} ngoài khoảng 0-10`);
                }
              }
            }
          });

          const draftItem: SubjectStudentGrade = {
            studentId: stId,
            studentName: String(row[2] || "").trim(),
            gender,
            dob,
            classId: activeAssignment?.classId || "",
            cc: rawCc,
            tx1: rawTx1,
            tx2: rawTx2,
            dk1: rawDk1,
            dk2: rawDk2,
            exam: rawExam,
            tb10: "",
            tb4: "",
            diemChu: "",
            xepLoai: ""
          };

          importedRows.push(calculateSingleRow(draftItem));
        }

        if (importedRows.length > 0) {
          setCurrentGrades(importedRows);
          let successMsg = `Nạp thành công ${importedRows.length} sinh viên từ file Excel mẫu! Vui lòng kiểm tra và bấm "Lưu nháp" hoặc "Chốt nộp điểm".`;
          if (scoreSyntaxWarnings.length > 0) {
            successMsg += `\n\n⚠️ PHÁT HIỆN ${scoreSyntaxWarnings.length} CẢNH BÁO LỖI ĐIỂM:\n` + scoreSyntaxWarnings.slice(0, 5).join("\n");
            if (scoreSyntaxWarnings.length > 5) {
              successMsg += `\n...và ${scoreSyntaxWarnings.length - 5} lỗi khác.`;
            }
          }
          alert(successMsg);
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTeacherSelfUnlock}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Giảng viên chủ động mở lại bảng điểm để nhập và chỉnh sửa"
                      >
                        <Unlock size={13} />
                        <span>Mở lại bảng điểm để nhập</span>
                      </button>

                      <button
                        onClick={() => setShowUnlockModal(true)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Send size={13} />
                        <span>Gửi yêu cầu sửa điểm</span>
                      </button>
                    </div>
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

              {/* Gradebook Interactive Table (Sticky Header Scrollable Container) */}
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-200 rounded-xl relative shadow-2xs">
                <table className="w-full text-left text-xs border-separate border-spacing-0 font-sans">
                  <thead className="sticky top-0 z-20 shadow-xs">
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3 text-center w-12 border-r border-b border-slate-200 bg-slate-100">STT</th>
                      <th className="p-3 w-36 border-r border-b border-slate-200 font-mono bg-slate-100">Mã SV</th>
                      <th className="p-3 w-48 border-r border-b border-slate-200 bg-slate-100">Họ và tên</th>
                      <th className="p-3 text-center w-24 border-r border-b border-slate-200 font-mono bg-slate-100">Chuyên cần</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono bg-slate-100">TX 1</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono bg-slate-100">TX 2</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono bg-slate-100">ĐK 1</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono bg-slate-100">ĐK 2</th>
                      <th className="p-3 text-center w-24 border-r border-b border-slate-200 font-mono bg-blue-100/70 text-blue-900">Thi HK</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono font-black text-slate-900 bg-slate-200">TB (10)</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono font-black text-slate-900 bg-slate-200">TB (4)</th>
                      <th className="p-3 text-center w-20 border-r border-b border-slate-200 font-mono bg-slate-100">Điểm chữ</th>
                      <th className="p-3 text-center w-28 border-b border-slate-200 bg-slate-100">XẾP LOẠI</th>
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 p-4 sm:p-6 flex items-center justify-center font-sans print:p-0 print:bg-white print:static print:z-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4 border border-slate-200 text-left print:shadow-none print:border-none print:p-0 print:max-h-none print:w-full">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 print:hidden flex-shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="text-indigo-600" size={18} />
                <h3 className="text-sm font-bold text-slate-800">Báo Cáo Phổ Điểm & Bảng Tổng Kết Học Phần (A4)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!activeAssignment) return;
                    setIsGeneratingPdf(true);
                    try {
                      await downloadTeacherGradeReportPdf(activeAssignment, currentGrades, stats);
                    } catch (err) {
                      console.error("PDF generation failed:", err);
                      alert("Không thể tải file PDF tự động. Vui lòng thử lại hoặc kiểm tra trình duyệt có đang chặn tải xuống không.");
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                  title="Tải trực tiếp file PDF về máy"
                >
                  <Download size={14} />
                  <span>{isGeneratingPdf ? "Đang tạo PDF..." : "Tải file PDF (.pdf)"}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  title="Mở giao diện in bản A4 hoặc Lưu dạng PDF của trình duyệt"
                >
                  <Printer size={14} />
                  <span>In bản A4</span>
                </button>
                <button
                  onClick={() => setShowDistributionPrintModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div id="printable-report-area" className="flex-1 overflow-y-auto max-h-[calc(90vh-100px)] p-6 bg-white border border-slate-300 rounded-xl space-y-4 text-slate-900 shadow-xs print:overflow-visible print:max-h-none print:border-none print:p-0">
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
