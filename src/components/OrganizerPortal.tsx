import React, { useState, useEffect } from "react";
import { useUniHub } from "../state";
import { motion } from "motion/react";
import { 
  Users, 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Check, 
  X, 
  Shield, 
  Settings, 
  UserPlus, 
  Trash2, 
  UserCheck, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft,
  Menu,
  Megaphone,
  Clock,
  Briefcase,
  FileText,
  User,
  Search,
  Filter,
  CheckCircle2,
  Edit3
} from "lucide-react";
import { OrganizationMember, ExtracurricularActivity } from "../types";

export const OrganizerPortal: React.FC = () => {
  const { 
    currentUser, 
    organizations, 
    members, 
    activities, 
    attendance, 
    students, 
    criteria,
    announcements,
    approveMemberRequest, 
    rejectMemberRequest, 
    assignMemberRole, 
    createActivity, 
    updateActivityStatus, 
    updateAttendance, 
    addBulkAttendance,
    createAnnouncement,
    deleteAnnouncement,
    addMemberManual,
    deleteMember,
    updateMemberDetails,
    importMembersExcel,
    activePortletTab,
    setActivePortletTab
  } = useUniHub();

  const activeSubTab = (activePortletTab as "DS_THANHVIEN" | "THEM_HUY_THANHVIEN" | "TAO_HOATDONG" | "TAO_THONGBAO" | "QUANLY_DIEMDANH") || "DS_THANHVIEN";
  const setActiveSubTab = (tab: "DS_THANHVIEN" | "THEM_HUY_THANHVIEN" | "TAO_HOATDONG" | "TAO_THONGBAO" | "QUANLY_DIEMDANH") => {
    setActivePortletTab(tab);
  };

  const orgId = currentUser?.targetId || "UNITECH";
  
  // Find current organization
  const org = organizations.find(o => o.id === orgId) || organizations[0];
  const orgMembers = members.filter(m => m.orgId === org.id);
  const orgActivities = activities.filter(a => a.orgId === org.id);
  const orgAnnouncements = announcements.filter(a => a.orgId === org.id);

  // Dynamic criteria mapping
  const activityCriteriaRules = criteria.flatMap(c => 
    c.rules.filter(r => r.type === "ACTIVITY_MEMBER" || r.type === "ACTIVITY_LEADER" || r.type === "EXCEPTION").map(r => ({
      criteriaId: r.id,
      categoryName: c.category,
      name: r.name,
      points: r.points
    }))
  );

  // Collapsible sidebar state (Requirement 2: thu gọn sidebar về 1 nút / dòng icon bên trái)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // State for showing the manual add member form inside Members List tab
  const [showAddManualForm, setShowAddManualForm] = useState(false);

  useEffect(() => {
    if (activePortletTab === "THEM_HUY_THANHVIEN") {
      setActivePortletTab("DS_THANHVIEN");
      setShowAddManualForm(true);
    }
  }, [activePortletTab, setActivePortletTab]);

  // Bulk check-in states (Requirement 1: điểm danh hàng loạt bằng cách check chọn nhiều sinh viên)
  const [selectedBulkMemberIds, setSelectedBulkMemberIds] = useState<string[]>([]);
  const [selectedAttIds, setSelectedAttIds] = useState<string[]>([]);
  const [bulkMemberSearch, setBulkMemberSearch] = useState("");

  // Selection states
  const [selectedActId, setSelectedActId] = useState<string | null>(orgActivities[0]?.id || null);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [isEditingMember, setIsEditingMember] = useState(false);

  // Auto select the latest created activity when the pool of organization activities updates
  const orgActivitiesKey = orgActivities.map(a => a.id).join(",");
  useEffect(() => {
    if (orgActivities.length > 0) {
      if (!selectedActId || !orgActivities.some(a => a.id === selectedActId)) {
        // Find the newest activity added (placed at the end of the list)
        setSelectedActId(orgActivities[orgActivities.length - 1].id);
      }
    } else {
      setSelectedActId(null);
    }
  }, [orgActivitiesKey, selectedActId]);

  // Filtering for activities
  const [activityTimeFilter, setActivityTimeFilter] = useState<"ALL" | "WEEK" | "MONTH" | "TERM">("ALL");

  // Search filter for members
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Form States for adding manual member
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualClass, setManualClass] = useState("");
  const [manualGender, setManualGender] = useState("Nam");
  const [manualDob, setManualDob] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualEthnicity, setManualEthnicity] = useState("Kinh");
  const [manualMajor, setManualMajor] = useState("Công nghệ thông tin");
  const [manualRole, setManualRole] = useState<"THÀNH VIÊN" | "ỦY VIÊN" | "BAN CHẤP HÀNH" | "CHỦ NHIỆM">("THÀNH VIÊN");
  const [manualAttachment, setManualAttachment] = useState("");

  // Edit member details Form States
  const [editGender, setEditGender] = useState("Nam");
  const [editDob, setEditDob] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEthnicity, setEditEthnicity] = useState("Kinh");
  const [editMajor, setEditMajor] = useState("");
  const [editAttachment, setEditAttachment] = useState("");
  const [editRole, setEditRole] = useState<"THÀNH VIÊN" | "ỦY VIÊN" | "BAN CHẤP HÀNH" | "CHỦ NHIỆM">("THÀNH VIÊN");

  // Form State for new activity (with Expiry Date)
  const [actTitle, setActTitle] = useState("");
  const [actCriteria, setActCriteria] = useState("TC3.1");
  const [actPoints, setActPoints] = useState(5);
  const [actDate, setActDate] = useState("");
  const [actLoc, setActLoc] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actExpiryDate, setActExpiryDate] = useState(""); // Expiry display duration date

  // Form State for CLB Announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annExpiryDate, setAnnExpiryDate] = useState(""); // Expiry display duration date for announcement

  // Import Excel XML/CSV States
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<OrganizationMember[]>([]);

  // Roll-call Quick Add student input
  const [bulkInput, setBulkInput] = useState("");

  // Theme styles based on organization types (CLB, Youth Union DOAN, Student Association HOI)
  const isDoan = org.type === "DOAN";
  const isHoi = org.type === "HOI";

  const themeBgActive = isDoan 
    ? "bg-rose-600 text-white shadow-md shadow-rose-100/50" 
    : (isHoi 
      ? "bg-sky-600 text-white shadow-md shadow-sky-100/50" 
      : "bg-purple-600 text-white shadow-md shadow-purple-100/50"
    );

  const themeBgHover = isDoan 
    ? "hover:bg-rose-50 hover:text-rose-600" 
    : (isHoi 
      ? "hover:bg-sky-50 hover:text-sky-600" 
      : "hover:bg-purple-50 hover:text-purple-600"
    );

  const themeBorderActive = isDoan 
    ? "border-rose-500 text-rose-700" 
    : (isHoi 
      ? "border-sky-500 text-sky-700" 
      : "border-purple-500 text-purple-700"
    );

  const themeBgBadge = isDoan ? "bg-rose-50 text-rose-700 border-rose-200" : (isHoi ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-purple-50 text-purple-700 border-purple-200");
  const themeTextLabel = isDoan ? "ĐOÀN THANH NIÊN PHÂN HIỆU" : (isHoi ? "HỘI SINH VIÊN VIỆT NAM" : "CÂU LẠC BỘ PHONG TRÀO");
  const themeTextPrimary = isDoan ? "text-rose-600" : (isHoi ? "text-sky-600" : "text-purple-600");

  // Filter activities by weekly, monthly, quarterly
  const filterActivitiesByMilestone = (act: ExtracurricularActivity) => {
    // Standard timestamp checks
    if (activityTimeFilter === "ALL") return true;
    
    const now = new Date();
    const actDateObj = new Date(act.dateTime.substring(0, 10));
    const diffTime = Math.abs(now.getTime() - actDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (activityTimeFilter === "WEEK") {
      return diffDays <= 7;
    }
    if (activityTimeFilter === "MONTH") {
      return diffDays <= 30;
    }
    if (activityTimeFilter === "TERM") {
      return diffDays <= 120; // Approximately 1 semester
    }
    return true;
  };

  // Filtered lists
  const filteredActivities = orgActivities.filter(filterActivitiesByMilestone);
  
  const pendingMembers = orgMembers.filter(m => m.status === "PENDING");
  const activeMembersArr = orgMembers.filter(m => {
    if (m.status !== "ACTIVE") return false;
    if (!memberSearchQuery.trim()) return true;
    const sObj = students.find(s => s.id === m.studentId);
    const searchLow = memberSearchQuery.toLowerCase();
    return (
      m.studentId.toLowerCase().includes(searchLow) ||
      (m.studentName && m.studentName.toLowerCase().includes(searchLow)) ||
      (sObj && sObj.name.toLowerCase().includes(searchLow)) ||
      m.classId.toLowerCase().includes(searchLow)
    );
  });

  // Action handlers
  const handleAddNewManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId || !manualName || !manualClass) {
      alert("Vui lòng nhập đầy đủ Mã SV, Họ tên và Lớp.");
      return;
    }

    addMemberManual({
      studentId: manualStudentId,
      studentName: manualName,
      classId: manualClass,
      orgId: org.id,
      role: manualRole,
      gender: manualGender,
      dob: manualDob,
      phone: manualPhone,
      email: manualEmail,
      ethnicity: manualEthnicity,
      major: manualMajor,
      facultyInCharge: "Khoa CNTT - Điện tử viễn thông",
      attachmentUrl: manualAttachment || "https://unihub.edu.vn/attachments/empty-profile.pdf"
    });

    // Reset inputs
    setManualStudentId("");
    setManualName("");
    setManualClass("");
    setManualDob("");
    setManualPhone("");
    setManualEmail("");
    setManualAttachment("");
    alert("Thêm thành viên thủ công thành công!");
    setActiveSubTab("DS_THANHVIEN");
  };

  // Open edit member
  const handleOpenEditMember = (m: OrganizationMember) => {
    const sObj = students.find(s => s.id === m.studentId);
    setSelectedMember(m);
    setEditGender(m.gender || "Nam");
    setEditDob(m.dob || "");
    setEditPhone(m.phone || "");
    setEditEmail(m.email || m.studentId.toLowerCase() + "@unihub.edu.vn");
    setEditEthnicity(m.ethnicity || "Kinh");
    setEditMajor(m.major || "Khoa học máy tính");
    setEditAttachment(m.attachmentUrl || "");
    setEditRole(m.role);
    setIsEditingMember(true);
  };

  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    updateMemberDetails(selectedMember.id, {
      gender: editGender,
      dob: editDob,
      phone: editPhone,
      email: editEmail,
      ethnicity: editEthnicity,
      major: editMajor,
      attachmentUrl: editAttachment,
      role: editRole,
      studentName: selectedMember.studentName // Preserve
    });

    // Sync role with general assign role as well
    assignMemberRole(selectedMember.id, editRole);

    alert("Cập nhật thông tin thành viên thành công!");
    setIsEditingMember(false);
    setSelectedMember(null);
  };

  // Export to Excel Standard (BOM-XLS Styled)
  const handleExportMembers = () => {
    if (orgMembers.length === 0) {
      alert("Danh sách thành viên trống.");
      return;
    }

    const headers = [
      "STT",
      "Mã sinh viên",
      "Họ và tên",
      "Giới tính",
      "Ngày sinh",
      "Dân tộc",
      "Email",
      "Số điện thoại",
      "Địa chỉ thường trú",
      "Chuyên ngành",
      "Chức danh nhiệm kỳ",
      "Ngày gia nhập",
      "Tệp đính kèm học sinh"
    ];

    const rows = orgMembers.map((m, idx) => {
      const sObj = students.find(s => s.id === m.studentId);
      return [
        idx + 1,
        m.studentId,
        m.studentName || sObj?.name || "",
        m.gender || "Nam",
        m.dob || "",
        m.ethnicity || "Kinh",
        m.email || "",
        m.phone || "",
        m.permanentAddress || "Hà Giang",
        m.major || "An toàn thông tin",
        m.role,
        m.joinedDate,
        m.attachmentUrl || ""
      ];
    });

    // Generate a highly formatted HTML structure compatible with Microsoft Excel
    // styling matches: Times New Roman, cỡ 12, borders, padding and centering alignments.
    const xlsContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Danh sách thành viên</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    tr {
      height: 24px;
    }
    th {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: bold;
      border: 1px solid #000000;
      background-color: #DDEBF7;
      text-align: center;
      vertical-align: middle;
      padding: 6px;
    }
    td {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      border: 1px solid #000000;
      vertical-align: middle;
      padding: 6px;
      mso-number-format: "\\@"; /* Text format to keep leading zeroes */
    }
    .text-center {
      text-align: center;
    }
    .text-left {
      text-align: left;
    }
    .title-cell {
      border: none !important;
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      font-family: 'Times New Roman', Times, serif;
      height: 35px;
    }
    .subtitle-cell {
      border: none !important;
      text-align: center;
      font-size: 11pt;
      font-style: italic;
      font-family: 'Times New Roman', Times, serif;
      height: 25px;
    }
  </style>
</head>
<body>
  <table>
    <!-- Elegant Header Header -->
    <tr>
      <td colspan="${headers.length}" class="title-cell" style="border: none !important;">
        DANH SÁCH THÀNH VIÊN CHI HỘI
      </td>
    </tr>
    <tr>
      <td colspan="${headers.length}" class="subtitle-cell" style="border: none !important;">
        Bộ phận quản lý: ${org.name.toUpperCase()} — Ngày xuất dữ liệu: ${new Date().toLocaleDateString('vi-VN')}
      </td>
    </tr>
    <tr style="height: 15px;">
      <td colspan="${headers.length}" style="border: none !important;"></td>
    </tr>
    
    <!-- Header Labels -->
    <tr style="height: 28px;">
      ${headers.map(h => `<th>${h}</th>`).join("")}
    </tr>
    
    <!-- Member listing rows styled with proper padding & text alignment -->
    ${rows.map(r => `
      <tr>
        <td class="text-center">${r[0]}</td>
        <td class="text-center">${r[1]}</td>
        <td class="text-left">${r[2]}</td>
        <td class="text-center">${r[3]}</td>
        <td class="text-center">${r[4]}</td>
        <td class="text-center">${r[5]}</td>
        <td class="text-left">${r[6]}</td>
        <td class="text-center">${r[7]}</td>
        <td class="text-left">${r[8]}</td>
        <td class="text-left">${r[9]}</td>
        <td class="text-center" style="font-weight: bold;">${r[10]}</td>
        <td class="text-center">${r[11]}</td>
        <td class="text-left">${r[12]}</td>
      </tr>
    `).join("")}
  </table>
</body>
</html>
    `;

    // Save with the .xls extension to invoke genuine Excel compatibility with custom formatting
    const blob = new Blob([xlsContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DANH_SACH_THANH_VIEN_${org.id.toUpperCase()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import standard Excel (Dual compatibility: both formatted HTML .xls and standard CSV/semicolon/comma files)
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const imported: OrganizationMember[] = [];

      // Case 1: Check if the file is our exported HTML/XLS spreadsheet
      if (text.includes("<table") || text.includes("<tr")) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");
          const trs = Array.from(doc.querySelectorAll("tr"));
          
          let dataStartIndex = -1;
          for (let i = 0; i < trs.length; i++) {
            if (trs[i].querySelector("th")) {
              dataStartIndex = i + 1; // Data starts below headings
              break;
            }
          }

          if (dataStartIndex === -1) {
            for (let i = 0; i < trs.length; i++) {
              if (trs[i].querySelectorAll("td").length >= 11) {
                dataStartIndex = i;
                break;
              }
            }
          }

          if (dataStartIndex !== -1) {
            for (let i = dataStartIndex; i < trs.length; i++) {
              const tds = Array.from(trs[i].querySelectorAll("td"));
              if (tds.length < 3) continue;

              const cells = tds.map(td => td.textContent?.trim() || "");
              const csvStudentId = cells[1];
              const csvStudentName = cells[2];
              
              if (csvStudentId) {
                const csvClassId = csvStudentId.substring(0, 3) === "DTG" ? "K20-CNTT" : "K21-KT";
                imported.push({
                  id: `M_IMP_${Date.now()}_${i}`,
                  studentId: csvStudentId,
                  studentName: csvStudentName || "Học sinh nhập",
                  classId: csvClassId,
                  orgId: org.id,
                  role: (cells[10] as any) || "THÀNH VIÊN",
                  joinedDate: cells[11] || new Date().toISOString().split("T")[0],
                  term: "2025-2026",
                  status: "ACTIVE",
                  gender: cells[3] || "Nam",
                  dob: cells[4] || "",
                  ethnicity: cells[5] || "Kinh",
                  email: cells[6] || "",
                  phone: cells[7] || "",
                  permanentAddress: cells[8] || "",
                  major: cells[9] || "",
                  attachmentUrl: cells[12] || ""
                });
              }
            }
          }
        } catch (err) {
          console.error("Lỗi parse file HTML/XLS: ", err);
        }
      }

      // Case 2: Parse as standard CSV format if HTML parsing returned no entries
      if (imported.length === 0) {
        const lines = text.split(/\r?\n/);
        if (lines.length > 1) {
          // Detect whether comma ',' or semicolon ';' is the delimiter
          let delimiter = ",";
          if (lines[0].includes(";")) {
            delimiter = ";";
          }

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            let cells: string[] = [];
            if (delimiter === ",") {
              const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
              cells = matches.map(c => c.replace(/^"|"$/g, '').trim());
            } else {
              const matches = line.match(/(".*?"|[^";\s]+)(?=\s*;|\s*$)/g) || line.split(";");
              cells = matches.map(c => c.replace(/^"|"$/g, '').trim());
            }

            if (cells.length < 3) continue;

            const csvStudentId = cells[1];
            const csvStudentName = cells[2];
            
            if (csvStudentId) {
              const csvClassId = csvStudentId.substring(0, 3) === "DTG" ? "K20-CNTT" : "K21-KT";
              imported.push({
                id: `M_IMP_${Date.now()}_${i}`,
                studentId: csvStudentId,
                studentName: csvStudentName || "Học sinh nhập",
                classId: csvClassId,
                orgId: org.id,
                role: (cells[10] as any) || "THÀNH VIÊN",
                joinedDate: cells[11] || new Date().toISOString().split("T")[0],
                term: "2025-2026",
                status: "ACTIVE",
                gender: cells[3] || "Nam",
                dob: cells[4] || "",
                ethnicity: cells[5] || "Kinh",
                email: cells[6] || "",
                phone: cells[7] || "",
                permanentAddress: cells[8] || "",
                major: cells[9] || "",
                attachmentUrl: cells[12] || ""
              });
            }
          }
        }
      }

      if (imported.length > 0) {
        setImportedData(imported);
        setImportStatus(`Đã kiểm định thành công ${imported.length} thành viên khả tế. Nhấp 'Xác nhận lưu' bên dưới.`);
      } else {
        setImportStatus("Mẫu không đúng chuẩn (Vui lòng kiểm tra lại cột Mã SV và định dạng dữ liệu).");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleSaveImported = () => {
    if (importedData.length === 0) return;
    importMembersExcel(importedData);
    setImportedData([]);
    setImportStatus(null);
    alert("Đã thêm thành công danh sách thành viên từ file Excel vào hệ thống!");
    setActiveSubTab("DS_THANHVIEN");
  };

  // Create Activity handler
  const handleAddNewActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle || !actDate || !actLoc) {
      alert("Vui lòng hoàn điền đầy đủ Tên hoạt động, Ngày giờ và Địa điểm!");
      return;
    }

    createActivity({
      title: actTitle,
      orgId: org.id,
      criteriaId: actCriteria,
      points: Number(actPoints),
      dateTime: actDate,
      location: actLoc,
      description: actDesc,
      registrationOpen: true,
      expiryDate: actExpiryDate || undefined
    } as any);

    setActTitle("");
    setActDate("");
    setActLoc("");
    setActDesc("");
    setActExpiryDate("");
    alert("Tạo hoạt động mới thành công! Đăng ký sẵn sàng tích hợp trong mục điểm danh.");
    setActivityTimeFilter("ALL");
    setActiveSubTab("QUANLY_DIEMDANH");
  };

  // Create Club Announcement handler
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      alert("Vui lòng điền đủ Tiêu đề và Nội dung thông báo!");
      return;
    }

    createAnnouncement({
      orgId: org.id,
      title: annTitle,
      content: annContent,
      expiryDate: annExpiryDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0] // default 1 week
    });

    setAnnTitle("");
    setAnnContent("");
    setAnnExpiryDate("");
    alert("Đăng tải thông báo CLB thành công! Đồng bộ tức thì giao diện sinh viên.");
    setActiveSubTab("QUANLY_DIEMDANH");
  };

  const handleBulkAttendanceAdd = () => {
    if (!selectedActId) return;
    if (!bulkInput.trim()) {
      alert("Hãy chọn Sinh viên từ danh sách.");
      return;
    }
    
    const studentIds = bulkInput.split(",").map(id => id.trim().toUpperCase());
    addBulkAttendance(selectedActId, studentIds);
    setBulkInput("");
    alert(`Đã hoàn tất điểm danh danh sách sinh viên!`);
  };

  const handleImportClubMembersToAttendance = () => {
    if (!selectedActId) return;
    
    // Find all club members who are not in currentAttendance for this activity
    const unregisteredMemberIds = orgMembers
      .map(m => m.studentId)
      .filter(sid => !currentAttendance.some(att => att.studentId === sid));
    
    if (unregisteredMemberIds.length === 0) {
      alert("Tất cả thành viên của CLB đều đã có trong danh sách đăng ký rèn luyện!");
      return;
    }
    
    addBulkAttendance(selectedActId, unregisteredMemberIds);
    alert(`Đã nộp danh sách từ CLB sang điểm danh! Đã bổ sung nhanh ${unregisteredMemberIds.length} thành viên.`);
  };

  const selectedAct = activities.find(a => a.id === selectedActId);
  const currentAttendance = attendance.filter(att => att.activityId === selectedActId);
  const liveMatchRule = selectedAct ? criteria.flatMap(c => c.rules).find(r => r.id === selectedAct.criteriaId) : null;
  const realActPoints = selectedAct ? (liveMatchRule ? liveMatchRule.points : selectedAct.points) : 0;

  return (
    <div className="space-y-6" id="organizer-portal-container">
      {/* Banner info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${themeBgBadge}`}>
            {themeTextLabel}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">{org.name}</h2>
          <p className="text-xs text-slate-500 mt-1 italic">
            Lĩnh vực hoạt động: {org.field} | Đại diện CLB: {org.leaderName}
          </p>
        </div>

        <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 divide-x divide-slate-200">
          <div className="px-2 text-center">
            <div className="text-sm font-black text-slate-800">{orgMembers.length}</div>
            <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Tổng nhân số</div>
          </div>
          <div className="px-3 text-center">
            <div className={`text-sm font-black ${themeTextPrimary}`}>{pendingMembers.length}</div>
            <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap font-sans">Đang chờ duyệt</div>
          </div>
          <div className="px-3 text-center">
            <div className="text-sm font-black text-emerald-600">{orgActivities.length}</div>
            <div className="text-[10px] text-slate-400 font-bold whitespace-nowrap">Đang mở</div>
          </div>
        </div>
      </div>

      {/* Workspace Display Area (Using full-width layout since we have the primary left navigation sidebar menu) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs min-h-[500px] flex flex-col justify-between transition-all duration-300 w-full">
          
          <motion.div 
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {/* SUBTAB 1: MEMBERS LIST (With custom attachments, deletions and details updates) */}
            {activeSubTab === "DS_THANHVIEN" && (
              <div className="space-y-6">
                
                {/* Pending applications */}
                {pendingMembers.length > 0 && (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-xl border flex items-center gap-2 ${themeBgBadge}`}>
                      <AlertCircle size={15} />
                      <span className="text-xs font-bold leading-none">Bạn có {pendingMembers.length} yêu cầu đăng ký gia nhập sinh viên cần duyệt gấp:</span>
                    </div>

                    <div className="border rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/10">
                      {pendingMembers.map(m => (
                        <div key={m.id} className="p-3.5 flex justify-between items-center text-xs">
                          <div>
                            <h5 className="font-extrabold text-slate-900">{m.studentName || "Sinh viên đăng ký"}</h5>
                            <p className="text-[10px] text-slate-450 font-mono">Mã số Sổ: {m.studentId} • Lớp sinh hoạt: {m.classId}</p>
                          </div>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => rejectMemberRequest(m.id)}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-all"
                            >
                              Từ chối
                            </button>
                            <button 
                              onClick={() => approveMemberRequest(m.id)}
                              className={`px-3 py-1.5 text-[10px] font-bold text-white rounded-lg cursor-pointer transition-all flex items-center gap-0.5 ${themeBgActive}`}
                            >
                              <Check size={11} />
                              <span>Đồng ý</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Header list search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Hồ sơ danh sách thành viên chi hội</h3>
                    <p className="text-[10px] text-slate-400">Chọn thành viên bất kỳ để cập nhật hồ sơ, điểm đính kèm hoặc khai trừ</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                    {/* Search Field */}
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Tìm theo Tên, Mã SV, Lớp..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-250 focus:outline-none text-slate-800 bg-slate-50/20"
                      />
                    </div>

                    {/* Consolidated Export / Import / Thêm thủ công Actions (Requirement 4 & Requirement 1) */}
                    <div className="flex items-center gap-1.5 justify-end">
                      {/* Manual Add Trigger Button */}
                      <button 
                        onClick={() => setShowAddManualForm(!showAddManualForm)}
                        className={`px-3 py-1.5 border rounded-xl font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-xs ${showAddManualForm ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300"}`}
                        title="Thêm thành viên thủ công trực tiếp"
                      >
                        <UserPlus size={12} />
                        <span>{showAddManualForm ? "Đóng bảng thêm" : "Thêm thủ công"}</span>
                      </button>

                      {/* Export Button */}
                      <button 
                        onClick={handleExportMembers}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-xl font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Download size={12} />
                        <span>Export</span>
                      </button>

                      {/* Import Hidden Input & Stylish Label */}
                      <input 
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleCSVImport}
                        className="hidden"
                        id="excel-importer-file-direct"
                      />
                      <label 
                        htmlFor="excel-importer-file-direct"
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-xl font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Upload size={12} />
                        <span>Import</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Manual Add Member Collapsible Form inside Members List (Requirement 1) */}
                {showAddManualForm && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    className="p-5 bg-slate-50/55 border border-slate-200 rounded-2xl shadow-sm space-y-4 max-w-2xl overflow-hidden"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="text-xs font-black uppercase text-purple-700 flex items-center gap-1.5">
                          <UserPlus size={14} className="text-purple-600" />
                          <span>Thêm thành viên thủ công mới</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Mã SV và thông tin sẽ đồng bộ hoàn tất thông tin lên tài khoản sinh viên chi hội.</p>
                      </div>
                      <button 
                        onClick={() => setShowAddManualForm(false)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Đóng bảng"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <form onSubmit={(e) => {
                      handleAddNewManual(e);
                      setShowAddManualForm(false);
                    }} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Mã số sinh viên (Bắt buộc)</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. DTG245140202053"
                            value={manualStudentId}
                            onChange={(e) => setManualStudentId(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Họ tên sinh viên (Bắt buộc)</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Nguyễn Văn Thắng"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Lớp sinh hoạt (Mặc định)</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. K20-CNTT"
                            value={manualClass}
                            onChange={(e) => setManualClass(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Giới tính</label>
                          <select 
                            value={manualGender}
                            onChange={(e) => setManualGender(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Ngày sinh</label>
                          <input 
                            type="date"
                            value={manualDob}
                            onChange={(e) => setManualDob(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Số điện thoại liên lạc</label>
                          <input 
                            type="tel"
                            placeholder="e.g 0912345678"
                            value={manualPhone}
                            onChange={(e) => setManualPhone(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Địa chỉ Email riêng</label>
                          <input 
                            type="email"
                            placeholder="e.g thangnv.dtg@unihub.edu.vn"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Chuyên ngành học</label>
                          <input 
                            type="text"
                            value={manualMajor}
                            onChange={(e) => setManualMajor(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Dân tộc</label>
                          <input 
                            type="text"
                            value={manualEthnicity}
                            onChange={(e) => setManualEthnicity(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Chức vị nhiệm kỳ</label>
                          <select 
                            value={manualRole}
                            onChange={(e) => setManualRole(e.target.value as any)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                          >
                            <option value="THÀNH VIÊN">Thành viên thường trực</option>
                            <option value="ỦY VIÊN">Ủy viên ban chấp hành</option>
                            <option value="BAN CHẤP HÀNH">Phó bí thư / Phó CN</option>
                            <option value="CHỦ NHIỆM">Chủ nhiệm tối cao</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Tệp bản sao / Đơn đính kèm</label>
                        <input 
                          type="text"
                          placeholder="e.g https://drive.google.com/file/d/abcdefgh_cv.pdf"
                          value={manualAttachment}
                          onChange={(e) => setManualAttachment(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2 text-xs">
                        <button 
                          type="button"
                          onClick={() => setShowAddManualForm(false)}
                          className="px-3.5 py-2 border rounded-xl hover:bg-slate-100 text-slate-600 font-bold cursor-pointer transition-colors"
                        >
                          Hủy bỏ
                        </button>
                        <button 
                          type="submit"
                          className={`px-4 py-2 text-white font-black rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${themeBgActive}`}
                        >
                          <UserPlus size={13} />
                          <span>Thêm cố định nhân sự</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Import verified previews in-place */}
                {importStatus && (
                  <div className="p-3.5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/10 space-y-2.5 animate-fade-in shadow-xs">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <p className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-indigo-600 animate-pulse" />
                        <span>{importStatus}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        {importedData.length > 0 && (
                          <button 
                            onClick={handleSaveImported}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            Xác nhận lưu danh sách
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setImportStatus(null);
                            setImportedData([]);
                          }}
                          className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members list items */}
                {activeMembersArr.length === 0 ? (
                  <div className="p-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                    Không tìm thấy thành viên hoạt động nào khớp với từ ngữ chọn.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMembersArr.map(m => {
                      const sObj = students.find(s => s.id === m.studentId);
                      return (
                        <div 
                          key={m.id} 
                          className="bg-white border border-slate-150 p-4 rounded-xl hover:shadow-xs hover:border-slate-350 transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-3 items-start flex-1 min-w-0">
                              {/* Student Avatar (Requirement 3: Ảnh đại diện sv) */}
                              <div className="h-11 w-11 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0 select-none flex items-center justify-center">
                                {sObj?.avatar ? (
                                  <img 
                                    src={sObj.avatar} 
                                    alt={sObj.name} 
                                    className="h-full w-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 h-full w-full flex items-center justify-center font-black text-xs font-mono uppercase">
                                    {(m.studentName || sObj?.name || "SV").slice(0, 2)}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1 min-w-0 flex-1">
                                <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono select-none">
                                  {m.role}
                                </span>
                                <h4 className="text-xs font-black text-slate-900 pt-1 truncate">{m.studentName || sObj?.name || "Sinh viên"}</h4>
                                <p className="text-[10px] text-slate-450 font-mono truncate">{m.studentId} • Lớp: {m.classId}</p>
                                {m.major && <p className="text-[9px] text-indigo-500 font-sans truncate">Chuyên ngành: {m.major}</p>}
                              </div>
                            </div>

                            {/* Options action buttons */}
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleOpenEditMember(m)}
                                className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer text-[9px] font-bold flex items-center gap-1"
                                title="Chỉnh sửa chi tiết hồ sơ thành viên"
                              >
                                <Edit3 size={11} />
                                <span>Xem & Sửa</span>
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Bạn có chắc chắn muốn xóa thành viên ${m.studentName || m.studentId} ra khỏi CLB?`)) {
                                    deleteMember(m.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-100 rounded-xl cursor-pointer"
                                title="Khai trừ khỏi CLB"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Member contact & attachments details */}
                          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                            <div>
                              <span className="font-semibold block text-slate-400">Giới tính / Ngày sinh:</span>
                              <span>{m.gender || "Chưa chọn"} • {m.dob || "Chưa ghi nhận"}</span>
                            </div>
                            <div>
                              <span className="font-semibold block text-slate-400">Số điện thoại:</span>
                              <span>{m.phone || "Có bảo mật"}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold block text-slate-400">Tệp tờ trình / Đính kèm:</span>
                              {m.attachmentUrl ? (
                                <a 
                                  href={m.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-indigo-500 underline font-mono truncate block"
                                >
                                  {m.attachmentUrl}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Chưa đăng đính kèm</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: ADD MEMBER MANUAL (Cho phép thêm thành viên thủ công với tất cả hồ sơ chuẩn) */}
            {activeSubTab === "THEM_HUY_THANHVIEN" && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 uppercase mb-1">Thêm thành viên thủ công vào chi hội</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Nhập đầy đủ thông tin để định nghĩa thành viên. Sinh viên sau khi thêm sẽ có tài khoản tự động đồng bộ trên hệ thống.</p>
                </div>

                <form onSubmit={handleAddNewManual} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã số sinh viên (Bắt buộc)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. DTG245140202053"
                        value={manualStudentId}
                        onChange={(e) => setManualStudentId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Họ tên sinh viên (Bắt buộc)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Nguyễn Văn Thắng"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Lớp sinh hoạt (Mặc định)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. K20-CNTT"
                        value={manualClass}
                        onChange={(e) => setManualClass(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Giới tính</label>
                      <select 
                        value={manualGender}
                        onChange={(e) => setManualGender(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày sinh</label>
                      <input 
                        type="date"
                        value={manualDob}
                        onChange={(e) => setManualDob(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Số điện thoại liên lạc</label>
                      <input 
                        type="tel"
                        placeholder="e.g 0912345678"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Địa chỉ Email riêng</label>
                      <input 
                        type="email"
                        placeholder="e.g thangnv.dtg@unihub.edu.vn"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Chuyên ngành học</label>
                      <input 
                        type="text"
                        value={manualMajor}
                        onChange={(e) => setManualMajor(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Dân tộc</label>
                      <input 
                        type="text"
                        value={manualEthnicity}
                        onChange={(e) => setManualEthnicity(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Chức vị nhiệm kỳ</label>
                      <select 
                        value={manualRole}
                        onChange={(e) => setManualRole(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-bold"
                      >
                        <option value="THÀNH VIÊN">Thành viên thường trực</option>
                        <option value="ỦY VIÊN">Ủy viên ban chấp hành</option>
                        <option value="BAN CHẤP HÀNH">Phó bí thư / Phó CN</option>
                        <option value="CHỦ NHIỆM">Chủ nhiệm tối cao</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Đường dẫn tệp đính kèm học sinh (Đơn xin gia nhập, CV, Hồ sơ lý lịch)</label>
                    <input 
                      type="text"
                      placeholder="e.g https://drive.google.com/file/d/abcdefgh_cv.pdf"
                      value={manualAttachment}
                      onChange={(e) => setManualAttachment(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-mono"
                    />
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit"
                      className={`px-4 py-2 hover:cursor-pointer text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors ${themeBgActive}`}
                    >
                      <UserPlus size={14} />
                      <span>Thêm cố định nhân sự</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SUBTAB 4: CREATE ACTIVITY (With custom display duration) */}
            {activeSubTab === "TAO_HOATDONG" && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 uppercase mb-1">Khai báo hoạt động và mốc sinh hoạt tiêu chí mới</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Bổ sung hoạt động sắp diễn ra để sinh viên đăng ký tham gia. Hoạt động có cài đặt thời hạn hiển thị tùy chọn, sau khi đến hạn sẽ tự động biến mất khỏi hệ thống.</p>
                </div>

                <form onSubmit={handleAddNewActivity} className="space-y-3.5 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tên hoạt động hành chính (Bắt buộc)</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Diễn đàn thanh niên phát triển nghiên cứu khoa học chuyên ban..."
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Xác lập rổ tiêu chí rèn luyện</label>
                      <select 
                        value={actCriteria} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setActCriteria(val);
                          const target = activityCriteriaRules.find(r => r.criteriaId === val);
                          if (target) setActPoints(target.points);
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        {activityCriteriaRules.map(r => (
                          <option key={r.criteriaId} value={r.criteriaId}>
                            {r.criteriaId}: {r.name} (+{r.points}đ)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Điểm rèn luyện cộng tương ứng</label>
                      <input 
                        type="number"
                        required
                        value={actPoints}
                        onChange={(e) => setActPoints(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Thời gian hành sự (Ngày Giờ)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. 2026-06-25 09:00"
                        value={actDate}
                        onChange={(e) => setActDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Địa điểm thực tế</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Hội trường A - Tầng 2"
                        value={actLoc}
                        onChange={(e) => setActLoc(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Customizable Display Duration Expiry (Requirement 4: Có thời hạn hiển thị tùy chỉnh, hết thời hạn tự auto biến) */}
                  <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                    <label className="block text-[11px] font-bold text-indigo-950 mb-1 flex items-center gap-1">
                      <Clock size={12} className="text-indigo-600" />
                      <span>Thời hạn hiển thị trên cổng sinh viên * (Ngày hết hạn)</span>
                    </label>
                    <input 
                      type="date"
                      required
                      value={actExpiryDate}
                      onChange={(e) => setActExpiryDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block leading-relaxed">
                      Lưu ý: Sau ngày này, hoạt động sẽ tự động rút và ẩn khỏi danh bạ tab hiển thị đăng ký của sinh viên.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Sơ lược mô tả nội dung</label>
                    <textarea 
                      rows={2}
                      placeholder="Mô tả tóm tắt nội dung chính cần phổ biến..."
                      value={actDesc}
                      onChange={(e) => setActDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                    />
                  </div>

                  <button 
                    type="submit"
                    className={`px-4 py-2 hover:cursor-pointer text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-sm ${themeBgActive}`}
                  >
                    <PlusCircle size={14} />
                    <span>Thiết lập hoạt động</span>
                  </button>
                </form>
              </div>
            )}

            {/* SUBTAB 5: CREATE ANNOUNCEMENT (Requirement 4: tạo thông báo CLB mới, có thời hạn tùy chỉnh hiển thị) */}
            {activeSubTab === "TAO_THONGBAO" && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <h3 className="text-sm font-bold text-slate-850 uppercase mb-1">Tạo thông báo CLB mới phát sóng sinh viên</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Đăng tải các chỉ thị hành động hoặc hoạt động chi đoàn. Độc lập thời hạn tự động dọn dẹp hệ thống khi hết ngày hiển thị.</p>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-3.5 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tiêu đề thông cáo hoặc tin nhắn bảng tin</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Thông báo đóng quỹ phong trào hoặc Lịch tổng kết chương trình..."
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nội dung văn bản thông báo chính thức</label>
                    <textarea 
                      rows={4}
                      required
                      placeholder="Ghi rõ chi tiết văn cảnh, thời hạn nộp chứng từ và quyền lợi liên quan..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                    />
                  </div>

                  {/* Customizable display duration date */}
                  <div className="p-3 bg-purple-50/40 rounded-xl border border-purple-100">
                    <label className="block text-[11px] font-bold text-purple-950 mb-1 flex items-center gap-1">
                      <Clock size={12} className="text-purple-600" />
                      <span>Ngày hết hạn phát sóng để tự động gỡ thông báo *</span>
                    </label>
                    <input 
                      type="date"
                      required
                      value={annExpiryDate}
                      onChange={(e) => setAnnExpiryDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-purple-200"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Khi quá ngày hết hạn thiết lập, bản tin thông báo này sẽ auto ẩn khỏi bảng cổng tin tức chi tiết của Sinh viên.
                    </span>
                  </div>

                  <button 
                    type="submit"
                    className={`px-4 py-2 hover:cursor-pointer text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-sm ${themeBgActive}`}
                  >
                    <Megaphone size={14} />
                    <span>Đăng bảng phát sóng tin</span>
                  </button>
                </form>

                {/* Displaying active announcements list for deletion */}
                {orgAnnouncements.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông báo đang có hiệu lực sinh hoạt ({orgAnnouncements.length})</h4>
                    <div className="space-y-2">
                      {orgAnnouncements.map(item => (
                        <div key={item.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-start text-xs">
                          <div>
                            <span className="text-[9px] font-mono text-slate-400">Hiệu lực đến: {item.expiryDate}</span>
                            <h5 className="font-extrabold text-slate-900 mt-0.5">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 mt-1 font-sans line-clamp-2">{item.content}</p>
                          </div>
                          <button 
                            onClick={() => deleteAnnouncement(item.id)}
                            className="p-1 px-2.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 text-[9px] font-bold rounded cursor-pointer transition-all"
                          >
                            Xóa gỡ
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* SUBTAB 6: ACTIVITIES & ATTENDANCE MANAGEMENT (Requirement 5: Quản lý hoạt động theo tuần/tháng/kì, quản lý và điểm danh) */}
            {activeSubTab === "QUANLY_DIEMDANH" && (
              <div className="space-y-6">
                
                {/* Header milestone filtering selectors */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sổ quản lý sự kiện & Điểm danh trực tiếp</h3>
                    <p className="text-[10px] text-slate-400">Lọc sự kiện theo Tuần/Tháng/Kỳ ngoại khóa và tích hợp điểm danh có mặt</p>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setActivityTimeFilter("ALL")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityTimeFilter === "ALL" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      Tất cả ({orgActivities.length})
                    </button>
                    <button 
                      onClick={() => setActivityTimeFilter("WEEK")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityTimeFilter === "WEEK" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      Bản Tuần
                    </button>
                    <button 
                      onClick={() => setActivityTimeFilter("MONTH")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityTimeFilter === "MONTH" ? "bg-white text-sky-700 shadow-xs" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      Bản Tháng
                    </button>
                    <button 
                      onClick={() => setActivityTimeFilter("TERM")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${activityTimeFilter === "TERM" ? "bg-white text-purple-700 shadow-xs" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      Bản Kỳ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Left: Activities Filtered list */}
                  <div className="md:col-span-4 bg-slate-50/40 p-3 rounded-2xl border border-slate-150 space-y-2">
                    <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase ml-1 block">Lĩnh chọn sự vụ</span>
                    
                    {filteredActivities.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-[10px]">
                        Không có hoạt động nào khớp mốc này.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-96 overflow-y-auto">
                        {filteredActivities.map(act => (
                          <div 
                            key={act.id}
                            onClick={() => setSelectedActId(act.id)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${selectedActId === act.id ? themeBgBadge + " border-l-4 border-l-indigo-600 font-extrabold" : "bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-350"}`}
                          >
                            <h5 className="font-bold line-clamp-1">{act.title}</h5>
                            <p className="text-[9px] text-slate-450 mt-1 flex items-center gap-1">
                              <Calendar size={10} /> {act.dateTime}
                            </p>
                            <span className={`text-[8.5px] font-sans inline-block mt-1 font-bold ${act.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600 animate-pulse"}`}>
                              {act.status === "COMPLETED" ? "✓ ĐÃ CHỐT SỔ" : "⏳ THEO DÕI NỔP"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Active attendance work area (Sự vụ chi phối & Checklist) */}
                  <div className="md:col-span-8 bg-white border border-slate-150 p-4 rounded-2xl space-y-4">
                    {selectedAct ? (
                      <div className="space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                          <h4 className="text-xs font-black text-slate-900 leading-tight">{selectedAct.title}</h4>
                          <div className="flex gap-4 text-[10px] text-slate-500 mt-1">
                            <span>Địa điểm: <strong className="text-slate-850 font-bold">{selectedAct.location}</strong></span>
                            <span>Chuẩn mốc: <strong className="text-emerald-600">+{realActPoints}đ</strong></span>
                          </div>
                        </div>

                        {/* Import quick add student */}
                        {selectedAct.status !== "COMPLETED" && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Duyệt nạp danh sách điểm danh</span>
                              <p className="text-[10px] text-slate-500 mt-0.5">Sử dụng tính năng nạp nhanh toàn bộ thành viên từ CLB hoặc bổ sung lẻ tẻ từng trường hợp quên đăng ký.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center pt-1 border-t border-slate-100">
                              <button
                                onClick={handleImportClubMembersToAttendance}
                                className={`px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-[11px] font-black rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-sm shrink-0`}
                                title="Lấy tất cả thành viên của CLB sang danh sách để điểm danh"
                              >
                                <Users size={12} />
                                <span>Lấy danh sách từ Ban CLB sang điểm danh (+{orgMembers.filter(m => !currentAttendance.some(att => att.studentId === m.studentId)).length})</span>
                              </button>

                              <div className="flex items-center gap-2 flex-grow sm:max-w-md w-full">
                                <select 
                                  value={bulkInput}
                                  onChange={(e) => setBulkInput(e.target.value)}
                                  className="flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs"
                                >
                                  <option value="">-- Thêm lẻ Sinh viên ngoài CLB --</option>
                                  {students.filter(s => !currentAttendance.some(att => att.studentId === s.id)).map(st => (
                                    <option key={st.id} value={st.id}>{st.name} ({st.id}) - {st.classId}</option>
                                  ))}
                                </select>
                                <button 
                                  onClick={handleBulkAttendanceAdd}
                                  className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 hover:brightness-105 active:scale-95 ${themeBgActive}`}
                                >
                                  Thêm
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attendance list checklist checkboxes */}
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                            <div className="flex items-center gap-2">
                              {selectedAct.status !== "COMPLETED" && currentAttendance.length > 0 && (
                                <input 
                                  type="checkbox"
                                  checked={selectedAttIds.length === currentAttendance.length && currentAttendance.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAttIds(currentAttendance.map(att => att.id));
                                    } else {
                                      setSelectedAttIds([]);
                                    }
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                                />
                              )}
                              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider font-sans">
                                Chọn nhiều ({selectedAttIds.length}/{currentAttendance.length} sinh viên)
                              </span>
                            </div>

                            {selectedAttIds.length > 0 && selectedAct.status !== "COMPLETED" && (
                              <button 
                                onClick={() => {
                                  // Mark all selected ids as attended
                                  selectedAttIds.forEach(id => {
                                    updateAttendance(id, true);
                                  });
                                  setSelectedAttIds([]);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-all animate-pulse"
                              >
                                <CheckCircle2 size={11} />
                                <span>Điểm danh có mặt hàng loạt ({selectedAttIds.length})</span>
                              </button>
                            )}
                          </div>

                          {currentAttendance.length === 0 ? (
                            <div className="p-8 border border-dashed rounded-xl text-center text-slate-400 text-xs">
                              Chưa có sinh viên nào đăng ký mốc hoạt động này. Hãy nạp nhanh bằng khu chọn lọc phía trên.
                            </div>
                          ) : (
                            <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto bg-white">
                              {currentAttendance.map(att => {
                                const sObj = students.find(s => s.id === att.studentId);
                                return (
                                  <div key={att.id} className="p-2.5 flex justify-between items-center bg-white hover:bg-slate-50/40 transition-all text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {/* Row Multi-select Checkbox */}
                                      {selectedAct.status !== "COMPLETED" && (
                                        <input 
                                          type="checkbox"
                                          checked={selectedAttIds.includes(att.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedAttIds([...selectedAttIds, att.id]);
                                            } else {
                                              setSelectedAttIds(selectedAttIds.filter(id => id !== att.id));
                                            }
                                          }}
                                          className="h-3.5 w-3.5 rounded border-slate-350 accent-indigo-600 cursor-pointer shrink-0"
                                        />
                                      )}

                                      {/* Student Avatar (Requirement 3: Ảnh đại diện sv) */}
                                      <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 bg-slate-50 shrink-0 select-none flex items-center justify-center">
                                        {sObj?.avatar ? (
                                          <img 
                                            src={sObj.avatar} 
                                            alt={sObj.name} 
                                            className="h-full w-full object-cover" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 h-full w-full flex items-center justify-center font-extrabold text-[10px] font-mono">
                                            {(att.studentName || "SV").slice(0, 2)}
                                          </div>
                                        )}
                                      </div>

                                      <div className="truncate min-w-0">
                                        <h5 className="font-extrabold text-slate-800 truncate">{att.studentName}</h5>
                                        <p className="text-[9px] text-slate-400 font-mono truncate">{att.studentId} • Lớp: {att.classId}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-slate-450 leading-none">Vị trí:</span>
                                        <select 
                                          value={att.role}
                                          onChange={(e) => updateAttendance(att.id, att.attended, e.target.value as any)}
                                          className="text-[10px] py-0.5 border border-slate-200 rounded text-slate-850 bg-slate-50"
                                          disabled={selectedAct.status === "COMPLETED"}
                                        >
                                          <option value="MEM">Thành viên</option>
                                          <option value="BTC">Ban tổ chức (+{realActPoints + 2}đ)</option>
                                          <option value="SUPPORTER">Hỗ trợ cộng sự</option>
                                        </select>
                                      </div>

                                      {/* Checklist checkbox (Requirement 5: điểm danh trực tiếp) */}
                                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                        <input 
                                          type="checkbox"
                                          checked={att.attended}
                                          onChange={(e) => updateAttendance(att.id, e.target.checked)}
                                          disabled={selectedAct.status === "COMPLETED"}
                                          className="h-3.5 w-3.5 rounded border-slate-350 cursor-pointer"
                                        />
                                        <span className="text-[9px] font-black text-slate-600 leading-none">{att.attended ? "MẶT" : "VẮNG"}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Final check-out actions to post evaluation points */}
                        {selectedAct.status !== "COMPLETED" && (
                          <div className="pt-3 border-t text-right">
                            <button 
                              onClick={() => {
                                if (confirm("Bạn có tin chắc muốn CHỐT DANH SÁCH? Điểm rèn luyện của sinh viên được tích Có mặt sẽ tự động cập nhật vào bảng điểm của Kỳ.")) {
                                  updateActivityStatus(selectedAct.id, "COMPLETED");
                                }
                              }}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                            >
                              Chốt sổ & Cấp điểm rèn luyện tự động
                            </button>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="p-12 border border-dashed rounded-xl text-center text-slate-400 text-xs">
                        Vui lòng lựa chọn hoạt động cụ thể ở cột bên trái để quản lý danh sách hoặc thực hành điểm danh.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </motion.div>

          <div className="bg-slate-50 p-4 border-t border-slate-100 shrink-0 text-center rounded-b-xl mt-6">
            <span className="text-[9px] text-slate-400 font-mono">
              PHÂN HỆ QUẢN LÝ BCN SỔ CLB SINH VIÊN UNIHUB © 2026 • Độc quyền tự hóa dữ liệu đầu cuối
            </span>
          </div>

        </div>

      {/* MEMBER DETAILS EDIT MODAL */}
      {isEditingMember && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex justify-between items-center bg-indigo-50/50 px-6 py-4 border-b border-indigo-100">
              <h3 className="text-xs font-black text-indigo-950 flex items-center gap-2">
                <User size={15} />
                <span>Chi tiết & Chỉnh sửa hồ sơ: {selectedMember.studentName}</span>
              </h3>
              <button 
                onClick={() => { setIsEditingMember(false); setSelectedMember(null); }} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mã sinh viên</label>
                  <input 
                    type="text" 
                    disabled 
                    value={selectedMember.studentId} 
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Lớp sinh hoạt</label>
                  <input 
                    type="text" 
                    disabled 
                    value={selectedMember.classId} 
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-100 text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Giới tính</label>
                  <select 
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày sinh</label>
                  <input 
                    type="text" 
                    placeholder="YYYY-MM-DD"
                    value={editDob} 
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dân tộc</label>
                  <input 
                    type="text" 
                    value={editEthnicity} 
                    onChange={(e) => setEditEthnicity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chuyên ngành</label>
                  <input 
                    type="text" 
                    value={editMajor} 
                    onChange={(e) => setEditMajor(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chức vị nhiệm kỳ</label>
                  <select 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                  >
                    <option value="THÀNH VIÊN">Thành viên thường trực</option>
                    <option value="ỦY VIÊN">Ủy viên ban chấp hành</option>
                    <option value="BAN CHẤP HÀNH">Phó bí thư / Phó CN</option>
                    <option value="CHỦ NHIỆM">Chủ nhiệm tối cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Tệp đính kèm thành viên (Đơn xin học, CV, Hồ sơ năng lực)</label>
                <input 
                  type="text" 
                  value={editAttachment} 
                  onChange={(e) => setEditAttachment(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => { setIsEditingMember(false); setSelectedMember(null); }}
                  className="px-4 py-2 border border-slate-250 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className={`px-4 py-2 text-white rounded-xl font-black text-xs cursor-pointer ${themeBgActive}`}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
