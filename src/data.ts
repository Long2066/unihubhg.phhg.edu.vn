import { 
  UserAccount, 
  UserRole, 
  Student, 
  Organization, 
  OrganizationMember, 
  ExtracurricularActivity, 
  ActivityAttendance, 
  EvidenceSubmission, 
  PointCriteria,
  ClassReviewState,
  FacultyReviewState,
  EvaluationResult,
  EvaluationPeriod,
  DailyAttendanceReport,
  ScheduleSlot
} from "./types";

export const SEED_PERIOD: EvaluationPeriod = {
  id: "HOCKY_2_2025_2026",
  academicYear: "2025-2026",
  semester: "Học kỳ II",
  startDate: "2026-01-15",
  endDate: "2026-06-30",
  status: "ACTIVE"
};

export const SEED_USERS: UserAccount[] = [
  {
    id: "U_ST01",
    username: "DTG245140202053",
    name: "Nguyễn Văn An",
    role: UserRole.STUDENT,
    email: "DTG245140202053",
    targetId: "DTG245140202053"
  },
  {
    id: "U_ORG01",
    username: "clbnckh@hg.edu.vn",
    name: "CLB Sáng tạo Công nghệ UniTech",
    role: UserRole.ORGANIZER,
    email: "clbnckh@hg.edu.vn",
    targetId: "UNITECH"
  },
  {
    id: "U_ORG02",
    username: "doantnphhg@hg.edu.vn",
    name: "BCH Đoàn TNCS Phân hiệu Hà Giang",
    role: UserRole.ORGANIZER,
    email: "doantnphhg@hg.edu.vn",
    targetId: "DOANTN"
  },
  {
    id: "U_ORG03",
    username: "hsvphhg@hg.edu.vn",
    name: "BCH Hội Sinh viên Phân hiệu Hà Giang",
    role: UserRole.ORGANIZER,
    email: "hsvphhg@hg.edu.vn",
    targetId: "HOISV"
  },
  {
    id: "U_TD01",
    username: "dtphhg@hg.edu.vn",
    name: "Trần Thị Mai",
    role: UserRole.TRAINING_DEPT,
    email: "dtphhg@hg.edu.vn"
  },
  {
    id: "U_CM01",
    username: "cblk2gdtha@hg.edu.vn",
    name: "Lâm Minh Triết",
    role: UserRole.CLASS_MONITOR,
    email: "cblk2gdtha@hg.edu.vn",
    targetId: "K20-CNTT"
  },
  {
    id: "U_ADV01",
    username: "gvcnk2gdtha@hg.edu.vn",
    name: "Hoàng Minh Đức",
    role: UserRole.ADVISER,
    email: "gvcnk2gdtha@hg.edu.vn",
    targetId: "K20-CNTT"
  },
  {
    id: "U_FAC01",
    username: "khoasp@hg.edu.vn",
    name: "Khoa Sư phạm",
    role: UserRole.FACULTY,
    email: "khoasp@hg.edu.vn",
    targetId: "K-CNTT"
  },
  {
    id: "U_ADM01",
    username: "pcthssvhg.edu.vn",
    name: "Phòng Công tác HSSV (Admin)",
    role: UserRole.ADMIN,
    email: "pcthssvhg.edu.vn"
  }
];

export const SEED_CRITERIA: PointCriteria[] = [
  {
    id: "TC1",
    category: "Ý thức học tập",
    maxScore: 20,
    description: "Đánh giá kết quả học tập GPA, đăng ký đủ số tín chỉ và chấp hành học vụ.",
    rules: [
      { id: "TC1.1", name: "Học tập đạt loại Xuất sắc (GPA >= 3.6)", points: 20, description: "Cộng 20 điểm rèn luyện", type: "GPA" },
      { id: "TC1.2", name: "Học tập đạt loại Giỏi (3.2 <= GPA < 3.6)", points: 18, description: "Cộng 18 điểm rèn luyện", type: "GPA" },
      { id: "TC1.3", name: "Học tập đạt loại Khá (2.5 <= GPA < 3.2)", points: 15, description: "Cộng 15 điểm rèn luyện", type: "GPA" },
      { id: "TC1.4", name: "Học tập đạt loại Trung bình (2.0 <= GPA < 2.5)", points: 10, description: "Cộng 10 điểm rèn luyện", type: "GPA" },
      { id: "TC1.5", name: "Bị cảnh báo học vụ", points: -5, description: "Trừ 5 điểm rèn luyện", type: "WARNING" }
    ]
  },
  {
    id: "TC2",
    category: "Ý thức chấp hành nội quy",
    maxScore: 25,
    description: "Khởi điểm 25 điểm. Trừ điểm đối với các trường hợp vi phạm quy chế.",
    rules: [
      { id: "TC2.1", name: "Đi học muộn hoặc không nghiêm túc", points: -2, description: "Báo cáo chấp hành nề nếp lớp học", type: "MANUAL" },
      { id: "TC2.2", name: "Sử dụng tài liệu trái phép trong kiểm tra", points: -10, description: "Cảnh cáo cấp khoa", type: "WARNING" },
      { id: "TC2.3", name: "Không tham gia bảo hiểm y tế bắt buộc", points: -5, description: "Trừ điểm vi phạm chính sách", type: "MANUAL" }
    ]
  },
  {
    id: "TC3",
    category: "Tham gia hoạt động chính trị, CLB",
    maxScore: 30,
    description: "Điểm cộng từ việc tham gia hoạt động Đoàn - Hội, sinh hoạt chuyên đề, hội thảo và câu lạc bộ.",
    rules: [
      { id: "TC3.1", name: "Tham gia đầy đủ 1 hoạt động cấp trường/khoa", points: 5, description: "Ghi nhận từ điểm danh hoạt động", type: "ACTIVITY_MEMBER" },
      { id: "TC3.2", name: "Làm Ban tổ chức hoạt động rèn luyện", points: 8, description: "Nhiệm vụ đóng góp tổ chức", type: "ACTIVITY_LEADER" },
      { id: "TC3.3", name: "Thành viên tích cực của CLB chính thức", points: 10, description: "Chủ nhiệm CLB phê duyệt hoạt động tối thiểu 80%", type: "ACTIVITY_MEMBER" }
    ]
  },
  {
    id: "TC4",
    category: "Ý thức công dân, cộng đồng",
    maxScore: 15,
    description: "Tham gia các phong trào tình nguyện, hiến máu, hỗ trợ giữ gìn an ninh trật tự, vệ sinh ký túc xá.",
    rules: [
      { id: "TC4.1", name: "Hiếu máu nhân đạo / Tình nguyện hỗ trợ", points: 10, description: "Có quyết định hoặc giấy xác nhận", type: "EXCEPTION" },
      { id: "TC4.2", name: "Tham gia trực tuần, trực nhật nề nếp lớp học tốt", points: 5, description: "Ban cán sự lớp xác nhận", type: "CLASS_MEETING" }
    ]
  },
  {
    id: "TC5",
    category: "Chức vụ, khen thưởng, thành tích",
    maxScore: 10,
    description: "Thành tích đặc biệt, chức vụ trong lớp, Đoàn, Hội, CLB hoặc đạt giải thưởng nghiên cứu khoa học, thể thao.",
    rules: [
      { id: "TC5.1", name: "Ban cán sự lớp (Lớp trưởng, Bí thư)", points: 10, description: "Đảm bảo tốt nhiệm vụ thời gian học kỳ", type: "MANUAL" },
      { id: "TC5.2", name: "Ủy viên BCH Đoàn / Bản chủ nhiệm CLB", points: 8, description: "Tham gia đóng góp hạt nhân phong trào", type: "MANUAL" },
      { id: "TC5.3", name: "Khen thưởng đặc biệt cấp phân hiệu trở lên", points: 10, description: "Giấy khen hoặc quyết định", type: "EXCEPTION" }
    ]
  }
];

export const SEED_STUDENTS: Student[] = [
  {
    id: "DTG245140202053",
    name: "Nguyễn Văn An",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    email: "DTG245140202053",
    gpa: 3.42,
    creditsEarned: 18,
    learningWarning: false,
    learningStatus: "Bình thường",
    learningDataLocked: true,
    gender: "Nam",
    dob: "2006-05-14",
    pob: "Vị Xuyên, Hà Giang",
    ethnicity: "Kinh",
    idCard: "001206009876",
    idCardDate: "2022-04-12",
    idCardPlace: "Cục Cảnh sát QLHC về TTXH",
    subjects: "Lập trình Web, Cơ sở dữ liệu, Thiết kế UI/UX",
    subjectGrades: "8.5, 9.0, 7.5, -, -, -, -, -",
    gpa10: 8.55,
    academicGrade: "Giỏi",
    notes: "Ủy viên BCH Đoàn Phân hiệu năng nổ.",
    updatedAt: "2026-06-02"
  },
  {
    id: "SV20CN02",
    name: "Phan Thị Bình",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    email: "binhpt@unihub.edu.vn",
    gpa: 2.15,
    creditsEarned: 15,
    learningWarning: false,
    learningStatus: "Bình thường",
    learningDataLocked: true,
    gender: "Nữ",
    dob: "2006-08-22",
    pob: "Yên Minh, Hà Giang",
    ethnicity: "Tày",
    idCard: "001206005544",
    idCardDate: "2022-09-18",
    idCardPlace: "Cục Cảnh sát QLHC về TTXH",
    subjects: "Lập trình Web, Cơ sở dữ liệu, Thiết kế UI/UX",
    subjectGrades: "5.5, 6.0, 6.5, -, -, -, -, -",
    gpa10: 6.0,
    academicGrade: "Trung bình",
    notes: "",
    updatedAt: "2026-06-02"
  },
  {
    id: "SV20CN03",
    name: "Lâm Minh Triết",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    email: "trietlm@unihub.edu.vn",
    gpa: 3.82,
    creditsEarned: 20,
    learningWarning: false,
    learningStatus: "Bình thường",
    learningDataLocked: true,
    gender: "Nam",
    dob: "2006-11-02",
    pob: "Đồng Văn, Hà Giang",
    ethnicity: "H'Mông",
    idCard: "001206004455",
    idCardDate: "2022-05-10",
    idCardPlace: "Cục Cảnh sát QLHC về TTXH",
    subjects: "Lập trình Web, Cơ sở dữ liệu, Cấu trúc dữ liệu",
    subjectGrades: "9.5, 9.8, 9.0, -, -, -, -, -",
    gpa10: 9.43,
    academicGrade: "Xuất sắc",
    notes: "Đạt thành tích Xuất sắc học kỳ.",
    updatedAt: "2026-06-02"
  },
  {
    id: "SV20CN04",
    name: "Vũ Đăng Khoa",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    email: "khoavd@unihub.edu.vn",
    gpa: 1.48,
    creditsEarned: 11,
    learningWarning: true,
    learningStatus: "Bị cảnh báo",
    learningDataLocked: true,
    gender: "Nam",
    dob: "2006-03-01",
    pob: "Bắc Quang, Hà Giang",
    ethnicity: "Kinh",
    idCard: "001206001122",
    idCardDate: "2021-12-05",
    idCardPlace: "Công an tỉnh Hà Giang",
    subjects: "Cơ sở dữ liệu, Toán rời rạc",
    subjectGrades: "4.0, 5.0, -, -, -, -, -, -",
    gpa10: 4.5,
    academicGrade: "Yếu",
    notes: "Nợ môn Cơ sở dữ liệu.",
    updatedAt: "2026-06-02"
  },
  {
    id: "SV20CN05",
    name: "Trần Bảo Ngọc",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    email: "ngoctb@unihub.edu.vn",
    gpa: 2.95,
    creditsEarned: 17,
    learningWarning: false,
    learningStatus: "Bình thường",
    learningDataLocked: true
  },
  {
    id: "SV20NL01",
    name: "Nông Văn Mạnh",
    classId: "K20-TA",
    facultyId: "K-TA",
    email: "manhnv@unihub.edu.vn",
    gpa: 3.10,
    creditsEarned: 19,
    learningWarning: false,
    learningStatus: "Bình thường",
    learningDataLocked: true
  }
];

export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: "UNITECH",
    name: "CLB Sáng tạo Công nghệ UniTech",
    type: "CLB",
    leaderName: "Lâm Minh Triết",
    field: "Công nghệ thông tin & Lập trình ứng dụng",
    level: "TRUONG"
  },
  {
    id: "DOANTN",
    name: "BCH Đoàn TNCS Phân hiệu Hà Giang",
    type: "DOAN",
    leaderName: "Hoàng Minh Đức",
    field: "Công tác chính trị học sinh sinh viên",
    level: "TRUONG"
  },
  {
    id: "HOISV",
    name: "BCH Hội Sinh viên Phân hiệu Hà Giang",
    type: "HOI",
    leaderName: "Nguyễn Lê Thảo Chi",
    field: "Hỗ trợ học tập, đời sống sinh viên",
    level: "TRUONG"
  },
  {
    id: "DOAN_HOI",
    name: "BCH Đoàn - Hội Sinh viên Phân hiệu",
    type: "DOAN",
    leaderName: "Ban Chấp Hành Phối Hợp",
    field: "Hoạt động Đoàn - Hội liên tịch",
    level: "TRUONG"
  },
  {
    id: "TINHNX",
    name: "CLB Tình nguyện Giọt hồng Hà Giang",
    type: "CLB",
    leaderName: "Trần Bảo Ngọc",
    field: "Tình nguyện & Nhân đạo xã hội",
    level: "TRUONG"
  }
];

export const SEED_MEMBERS: OrganizationMember[] = [
  // Nguyễn Văn An (DTG245140202053) inside UNITECH
  {
    id: "M_01",
    studentId: "DTG245140202053",
    classId: "K20-CNTT",
    orgId: "UNITECH",
    role: "THÀNH VIÊN",
    joinedDate: "2025-09-10",
    term: "2025-2026",
    status: "ACTIVE"
  },
  // Nguyễn Văn An (DTG245140202053) inside DOANTN (BCH Đoàn Phân hiệu)
  {
    id: "M_05",
    studentId: "DTG245140202053",
    classId: "K20-CNTT",
    orgId: "DOANTN",
    role: "ỦY VIÊN",
    joinedDate: "2025-09-15",
    term: "2025-2026",
    status: "ACTIVE"
  },
  // Lâm Minh Triết (SV20CN03) inside UNITECH
  {
    id: "M_02",
    studentId: "SV20CN03",
    classId: "K20-CNTT",
    orgId: "UNITECH",
    role: "CHỦ NHIỆM",
    joinedDate: "2025-09-10",
    term: "2025-2026",
    status: "ACTIVE"
  },
  // Đăng Khoa inside UNITECH (Pending)
  {
    id: "M_03",
    studentId: "SV20CN04",
    classId: "K20-CNTT",
    orgId: "UNITECH",
    role: "THÀNH VIÊN",
    joinedDate: "2026-02-20",
    term: "2025-2026",
    status: "PENDING"
  },
  // Trần Bảo Ngọc (SV20CN05) inside Giọt hồng CLB
  {
    id: "M_04",
    studentId: "SV20CN05",
    classId: "K20-CNTT",
    orgId: "TINHNX",
    role: "CHỦ NHIỆM",
    joinedDate: "2025-09-12",
    term: "2025-2026",
    status: "ACTIVE"
  }
];

export const SEED_ACTIVITIES: ExtracurricularActivity[] = [
  {
    id: "ACT_01",
    title: "Hackathon Sáng Tạo Trẻ UniHub 2026",
    orgId: "UNITECH",
    orgName: "CLB Sáng tạo Công nghệ UniTech",
    criteriaId: "TC3.1",
    points: 5,
    dateTime: "2026-03-12 08:30",
    location: "Hội trường lớn Tòa nhà A",
    description: "Sân chơi lập trình giải quyết các bài toán chuyển đổi số cho tỉnh Hà Giang.",
    registrationOpen: false,
    status: "COMPLETED"
  },
  {
    id: "ACT_02",
    title: "Hiến máu tình nguyện 'Giọt hồng biên cương' 2026",
    orgId: "TINHNX",
    orgName: "CLB Tình nguyện Giọt hồng Hà Giang",
    criteriaId: "TC4.1",
    points: 10,
    dateTime: "2026-04-18 07:00",
    location: "Sảnh trung tâm Phân hiệu",
    description: "Chương trình hiến máu nhân đạo kết hợp khám sức khỏe miễn phí cho sinh viên.",
    registrationOpen: false,
    status: "COMPLETED"
  },
  {
    id: "ACT_03",
    title: "Hội thảo 'AI & Tương lai nghề nghiệp ngành Công nghệ'",
    orgId: "UNITECH",
    orgName: "CLB Sáng tạo Công nghệ UniTech",
    criteriaId: "TC3.1",
    points: 5,
    dateTime: "2026-05-25 14:00",
    location: "Phòng Seminar nhà B",
    description: "Nhận định xu hướng ứng dụng Gemini và AI thế hệ mới trong phát triển phần mềm.",
    registrationOpen: true,
    status: "UPCOMING"
  },
  {
    id: "ACT_04",
    title: "Hội nghị Học tập Nghị quyết và Diễn đàn Sinh viên 5 Tốt",
    orgId: "DOANTN",
    orgName: "BCH Đoàn TNCS Phân hiệu Hà Giang",
    criteriaId: "TC3.1",
    points: 5,
    dateTime: "2026-06-05 08:30",
    location: "Hội trường Hoa Ban",
    description: "Triển khai học tập chính trị chuyên đề và tôn vinh phong trào 'Sinh viên 5 Tốt' cấp phân hiệu.",
    registrationOpen: true,
    status: "UPCOMING"
  },
  {
    id: "ACT_05",
    title: "Chiến dịch tình nguyện Mùa hè xanh - Sức trẻ Biên cương",
    orgId: "DOANTN",
    orgName: "BCH Đoàn TNCS Phân hiệu Hà Giang",
    criteriaId: "TC4.1",
    points: 10,
    dateTime: "2026-07-01 07:00",
    location: "Huyện Hoàng Su Phì, Hà Giang",
    description: "Tổ chức chuyển giao công nghệ, hỗ trợ dạy học vùng cao và tôn tạo cảnh quan văn học nề nếp bản làng.",
    registrationOpen: true,
    status: "UPCOMING"
  },
  {
    id: "ACT_06",
    title: "Ngày hội Sức trẻ Hoạt động thể thao và Vũ điệu Sinh viên",
    orgId: "DOANTN",
    orgName: "BCH Đoàn TNCS Phân hiệu Hà Giang",
    criteriaId: "TC3.1",
    points: 5,
    dateTime: "2026-05-15 16:00",
    location: "Sân vận động Trung tâm",
    description: "Cuộc thi kéo co, bóng chuyền và trình diễn dân vũ chào mừng Hội nghị Khoa học trẻ.",
    registrationOpen: false,
    status: "COMPLETED"
  }
];

export const SEED_ATTENDANCE: ActivityAttendance[] = [
  // Hackathon attendees
  {
    id: "AT_01",
    activityId: "ACT_01",
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    registeredAt: "2026-03-05",
    role: "MEM",
    attended: true,
    verified: true
  },
  {
    id: "AT_02",
    activityId: "ACT_01",
    studentId: "SV20CN03",
    studentName: "Lâm Minh Triết",
    classId: "K20-CNTT",
    registeredAt: "2026-03-05",
    role: "BTC", // Ban tổ chức
    attended: true,
    verified: true
  },
  {
    id: "AT_03",
    activityId: "ACT_01",
    studentId: "SV20CN02",
    studentName: "Phan Thị Bình",
    classId: "K20-CNTT",
    registeredAt: "2026-03-06",
    role: "MEM",
    attended: true,
    verified: true
  },
  // Hiến máu attendees
  {
    id: "AT_04",
    activityId: "ACT_02",
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    registeredAt: "2026-04-10",
    role: "MEM",
    attended: true,
    verified: true
  },
  {
    id: "AT_05",
    activityId: "ACT_02",
    studentId: "SV20CN05",
    studentName: "Trần Bảo Ngọc",
    classId: "K20-CNTT",
    registeredAt: "2026-04-10",
    role: "BTC",
    attended: true,
    verified: true
  },
  // Upcoming attendees
  {
    id: "AT_06",
    activityId: "ACT_03",
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    registeredAt: "2026-05-20",
    role: "MEM",
    attended: false,
    verified: false
  },
  // Đoàn - Hội registrations
  {
    id: "AT_07",
    activityId: "ACT_04",
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    registeredAt: "2026-05-21",
    role: "MEM",
    attended: false,
    verified: false
  },
  {
    id: "AT_08",
    activityId: "ACT_04",
    studentId: "SV20CN02",
    studentName: "Phan Thị Bình",
    classId: "K20-CNTT",
    registeredAt: "2026-05-21",
    role: "MEM",
    attended: false,
    verified: false
  },
  {
    id: "AT_09",
    activityId: "ACT_06",
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    registeredAt: "2026-05-12",
    role: "MEM",
    attended: true,
    verified: true
  },
  {
    id: "AT_10",
    activityId: "ACT_06",
    studentId: "SV20CN03",
    studentName: "Lâm Minh Triết",
    classId: "K20-CNTT",
    registeredAt: "2026-05-12",
    role: "BTC",
    attended: true,
    verified: true
  }
];

export const SEED_EVIDENCE: EvidenceSubmission[] = [
  {
    id: "EV_01",
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    criteriaId: "TC4.1",
    activityName: "Tuyên truyền hiến máu ngoài Nhà trường",
    description: "Có tham gia hỗ trợ Ban vận động hiến máu Thành phố Hà Giang vận động hiên máu nhân đạo ngày chủ nhật xanh.",
    pointsRequested: 10,
    proofUrl: "giay_khen_tinh_doan_hagiang.jpg",
    submittedAt: "2026-05-18",
    status: "PENDING"
  },
  {
    id: "EV_02",
    studentId: "SV20CN02",
    studentName: "Phan Thị Bình",
    classId: "K20-CNTT",
    criteriaId: "TC4.1",
    activityName: "Chiến dịch Môi trường xanh Khu phố",
    description: "Giấy xác nhận tham gia dọn dẹp môi trường khu phố chống dịch sốt xuất huyết tháng 4.",
    pointsRequested: 5,
    proofUrl: "giay_xac_nhan_phuong_minhkhai.png",
    submittedAt: "2026-05-15",
    status: "APPROVED",
    reviewedBy: "Hoàng Minh Đức",
    reviewComment: "Ghi nhận đóng góp tích cực hỗ trợ địa phương."
  }
];

export const SEED_CLASS_REVIEW: ClassReviewState[] = [
  {
    classId: "K20-CNTT",
    representativeApproved: false,
    adviserApproved: false
  },
  {
    classId: "K20-TA",
    representativeApproved: true,
    representativeApprovedAt: "2026-05-19",
    adviserApproved: true,
    adviserApprovedAt: "2026-05-20",
    adviserComment: "Lớp hoàn thành đánh giá xuất sắc đúng tiến độ."
  }
];

export const SEED_FACULTY_REVIEW: FacultyReviewState[] = [
  {
    facultyId: "K-CNTT",
    locked: false
  },
  {
    facultyId: "K-TA",
    locked: true,
    lockedAt: "2026-05-20",
    lockedBy: "Trưởng khoa Ngoại Ngữ"
  }
];

// Seed computed training results
export const SEED_RESULTS: EvaluationResult[] = [
  {
    studentId: "DTG245140202053",
    studentName: "Nguyễn Văn An",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    periodId: "HOCKY_2_2025_2026",
    studyPoints: 18, // GPA = 3.42 (TC1.2 +18đ)
    violationPoints: 25, // No violation
    extracurricularPoints: 15, // CLB Unitech Member(+10đ) + Hackathon member attended(+5đ) = 15đ
    communityPoints: 10, // Giấy hiến máu tình nguyện TC4.1(+10đ) = 10đ
    achievementPoints: 0, 
    totalPoints: 68,     // Sum before reviews is 18 + 25 + 15 + 10 = 68
    grade: "KHÁ",
    status: "AUTO",
    logs: [
      { criteriaId: "TC1.2", points: 18, reason: "Phòng Đào tạo: GPA đạt 3.42", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC2.0", points: 25, reason: "Không ghi nhận vi phạm kỷ luật nội quy", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC3.3", points: 10, reason: "Là thành viên chính thức CLB Sáng tạo Công nghệ UniTech", source: "CLB_ATTENDANCE", timestamp: "2026-05-10" },
      { criteriaId: "TC3.1", points: 5, reason: "Đã tham gia Hackathon Sáng Tạo Trẻ UniHub 2026", source: "CLB_ATTENDANCE", timestamp: "2026-05-12" },
      { criteriaId: "TC4.1", points: 10, reason: "Tham gia Hiến máu tình nguyện Giọt hồng biên cương 2026", source: "CLB_ATTENDANCE", timestamp: "2026-04-18" }
    ]
  },
  {
    studentId: "SV20CN02",
    studentName: "Phan Thị Bình",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    periodId: "HOCKY_2_2025_2026",
    studyPoints: 10, // GPA 2.15 -> Trung bình (+10đ)
    violationPoints: 23, // Trực muộn (-2đ) -> 23đ
    extracurricularPoints: 5, // Hackathon Member (+5đ)
    communityPoints: 10, // Trực nhật nề nếp lớp xuất sắc (+5đ) + Minh chứng quận khu phố đã duyệt (+5)
    achievementPoints: 0,
    totalPoints: 48,
    grade: "YẾU",
    status: "AUTO",
    logs: [
      { criteriaId: "TC1.4", points: 10, reason: "Phòng Đào tạo: GPA đạt 2.15", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC2.1", points: -2, reason: "Báo cáo nề nếp: Đi học muộn ngày 14/03", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC3.1", points: 5, reason: "Đã tham gia Hackathon Sáng Tạo Trẻ UniHub 2026", source: "CLB_ATTENDANCE", timestamp: "2026-05-12" },
      { criteriaId: "TC4.2", points: 5, reason: "Ban cán sự lớp xác nhận: Hoàn thành trực nhật nề nếp tốt", source: "BCS_DUYỆT", timestamp: "2026-05-15" },
      { criteriaId: "TC4.1", points: 5, reason: "Duyệt minh chứng ngoại lệ: Chiến dịch Môi trường xanh Khu phố", source: "MINH_CHỨNG", timestamp: "2026-05-16" }
    ]
  },
  {
    studentId: "SV20CN03",
    studentName: "Lâm Minh Triết",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    periodId: "HOCKY_2_2025_2026",
    studyPoints: 20, // GPA 3.82 -> Xuất sắc (+20đ)
    violationPoints: 25, // No violation
    extracurricularPoints: 18, // CLB Unitech Leader (+10đ) + BTC Hackathon (+8đ) = 18đ
    communityPoints: 5, // BCS trực tuần lớp (+5đ)
    achievementPoints: 10, // Lớp trưởng K20-CNTT (+10đ)
    totalPoints: 78,
    grade: "TỐT",
    status: "AUTO",
    logs: [
      { criteriaId: "TC1.1", points: 20, reason: "Phòng Đào tạo: GPA đạt 3.82", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC2.0", points: 25, reason: "Không ghi nhận vi phạm kỷ luật nội quy", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC3.3", points: 10, reason: "Chủ nhiệm CLB Sáng tạo Công nghệ UniTech", source: "CLB_ATTENDANCE", timestamp: "2026-05-10" },
      { criteriaId: "TC3.2", points: 8, reason: "Vai trò Ban tổ chức: Hackathon Sáng Tạo Trẻ UniHub 2026", source: "CLB_ATTENDANCE", timestamp: "2026-05-12" },
      { criteriaId: "TC4.2", points: 5, reason: "Ban cán sự lớp xác nhận: Tự đóng góp giữ vững nề nếp học tập", source: "BCS_DUYỆT", timestamp: "2026-05-15" },
      { criteriaId: "TC5.1", points: 10, reason: "Đảm trách Lớp trưởng điều hành lớp K20-CNTT", source: "BCS_DUYỆT", timestamp: "2026-05-15" }
    ]
  },
  {
    studentId: "SV20CN04",
    studentName: "Vũ Đăng Khoa",
    classId: "K20-CNTT",
    facultyId: "K-CNTT",
    periodId: "HOCKY_2_2025_2026",
    studyPoints: 5,  // GPA 1.48 (Học lực yếu + Trung bình = +10đ - Cảnh báo 5đ = 5đ)
    violationPoints: 15, // Cảnh báo phòng đào tạo hoặc sự cố kiểm tra (-10đ) = 15đ
    extracurricularPoints: 0,
    communityPoints: 0,
    achievementPoints: 0,
    totalPoints: 20,
    grade: "YẾU",
    status: "AUTO",
    logs: [
      { criteriaId: "TC1.5", points: -5, reason: "Phòng Đào tạo: GPA đạt 1.48 kém, có Cảnh báo học vụ", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC2.2", points: -10, reason: "Biên bản nề nếp: Vi phạm nếp kiểm thi khảo sát chất lượng", source: "ĐÀO TẠO", timestamp: "2026-05-19" }
    ]
  },
  {
    studentId: "SV20NL01",
    studentName: "Nông Văn Mạnh",
    classId: "K20-TA",
    facultyId: "K-TA",
    periodId: "HOCKY_2_2025_2026",
    studyPoints: 15, // GPA 3.10 -> Khá (+15đ)
    violationPoints: 25,
    extracurricularPoints: 0,
    communityPoints: 5,
    achievementPoints: 10, // Lớp trưởng K20-TA (+10đ)
    totalPoints: 55,
    grade: "TRUNG BÌNH",
    status: "LOCKED", // Locked under class K20-TA and faculty K-TA
    logs: [
      { criteriaId: "TC1.3", points: 15, reason: "Phòng Đào tạo: GPA đạt 3.10", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC2.0", points: 25, reason: "Không ghi nhận vi phạm kỷ luật nội quy", source: "ĐÀO TẠO", timestamp: "2026-05-19" },
      { criteriaId: "TC4.2", points: 5, reason: "Tự hoàn thành nhiệm vụ quản nề nếp chung lớp", source: "BCS_DUYỆT", timestamp: "2026-05-19" },
      { criteriaId: "TC5.1", points: 10, reason: "Đảm trách Lớp trưởng điều hành lớp K20-TA", source: "BCS_DUYỆT", timestamp: "2026-05-19" }
    ]
  }
];

export const SEED_DAILY_ATTENDANCE: DailyAttendanceReport[] = [
  {
    id: "DAR_1",
    classId: "K20-CNTT",
    date: "2026-05-24",
    totalStudents: 5,
    presentCount: 4,
    absentCount: 1,
    absentees: [
      { studentId: "SV20CN02", studentName: "Phan Thị Bình", type: "PHÉP", reason: "Khám bệnh tại bệnh viện tỉnh" }
    ],
    reportedBy: "Lâm Minh Triết",
    reportedAt: "2026-05-24T07:30:15.000Z"
  },
  {
    id: "DAR_2",
    classId: "K20-CNTT",
    date: "2026-05-23",
    totalStudents: 5,
    presentCount: 3,
    absentCount: 2,
    absentees: [
      { studentId: "SV20CN04", studentName: "Vũ Đăng Khoa", type: "KHÔNG_PHÉP", reason: "Nghỉ học không phép" },
      { studentId: "SV20CN02", studentName: "Phan Thị Bình", type: "KHÔNG_PHÉP", reason: "Đi học muộn không phép" }
    ],
    reportedBy: "Lâm Minh Triết",
    reportedAt: "2026-05-23T07:45:10.000Z"
  },
  {
    id: "DAR_3",
    classId: "K20-TA",
    date: "2026-05-24",
    totalStudents: 1,
    presentCount: 1,
    absentCount: 0,
    absentees: [],
    reportedBy: "Nông Văn Mạnh",
    reportedAt: "2026-05-24T07:15:22.000Z"
  },
  {
    id: "DAR_4",
    classId: "K20-TA",
    date: "2026-05-23",
    totalStudents: 1,
    presentCount: 1,
    absentCount: 0,
    absentees: [],
    reportedBy: "Nông Văn Mạnh",
    reportedAt: "2026-05-23T07:20:01.000Z"
  }
];

export const SEED_SCHEDULES: ScheduleSlot[] = [
  {
    id: "SCH_01",
    classId: "K20-CNTT",
    subjectName: "Lập trình Web",
    teacherName: "ThS. Nguyễn Văn A",
    dayOfWeek: 2,
    periodStart: 1,
    periodEnd: 3,
    room: "Phòng 302 - Nhà A",
    semester: "Học kỳ II, 2025-2026",
    colorHex: "#4F46E5"
  },
  {
    id: "SCH_02",
    classId: "K20-CNTT",
    subjectName: "Cơ sở dữ liệu",
    teacherName: "TS. Hoàng Minh Đức",
    dayOfWeek: 4,
    periodStart: 4,
    periodEnd: 6,
    room: "Phòng 102 - Nhà B",
    semester: "Học kỳ II, 2025-2026",
    colorHex: "#0EA5E9"
  },
  {
    id: "SCH_03",
    classId: "K20-CNTT",
    subjectName: "Cấu trúc dữ liệu",
    teacherName: "ThS. Nông Văn B",
    dayOfWeek: 6,
    periodStart: 1,
    periodEnd: 2,
    room: "Lab 3 - Nhà C",
    semester: "Học kỳ II, 2025-2026",
    colorHex: "#10B981"
  },
  {
    id: "SCH_04",
    classId: "K2-GDTH-A",
    subjectName: "Phương pháp dạy học Toán",
    teacherName: "Cô Hoàng Thị B",
    dayOfWeek: 3,
    periodStart: 1,
    periodEnd: 3,
    room: "Phòng 201 - Nhà B",
    semester: "Học kỳ II, 2025-2026",
    colorHex: "#F59E0B"
  },
  {
    id: "SCH_05",
    classId: "K2-GDTH-A",
    subjectName: "Tâm lý học tiểu học",
    teacherName: "ThS. Trần Thị D",
    dayOfWeek: 5,
    periodStart: 4,
    periodEnd: 6,
    room: "Phòng 105 - Nhà C",
    semester: "Học kỳ II, 2025-2026",
    colorHex: "#EC4899"
  }
];

