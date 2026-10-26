import React, { useState, useMemo } from "react";
import { useUniHub, normalizeClassId } from "../state";
import { SEED_STUDENTS } from "../data";
import { 
  UserRole, 
  CongressCampaign, 
  ClassCongress, 
  BallotBox, 
  CongressCandidate, 
  CongressAppointment, 
  CongressAppointmentRole, 
  BallotBoxType 
} from "../types";
import { 
  Vote, 
  ShieldCheck, 
  Users, 
  Award, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Send, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Sparkles, 
  Search, 
  Filter, 
  RefreshCw, 
  Flag,
  UserCheck,
  Building,
  GraduationCap,
  Inbox,
  CheckCheck,
  FileCheck
} from "lucide-react";

const APPOINTMENT_ROLE_LABELS: Record<string, string> = {
  BI_THU_CHI_DOAN: "Bí thư Chi đoàn",
  PHO_BI_THU_CHI_DOAN: "Phó Bí thư Chi đoàn",
  UY_VIEN_BCH_CHI_DOAN: "Ủy viên BCH Chi đoàn",
  CHI_HOI_TRUONG: "Chi hội trưởng",
  CHI_HOI_PHO: "Chi hội phó",
  UY_VIEN_BCH_CHI_HOI: "Ủy viên BCH Chi hội",
  LOP_TRUONG: "Lớp trưởng",
  LOP_PHO_HOC_TAP: "Lớp phó Học tập",
  LOP_PHO_DOI_SONG_PHONG_TRAO: "Lớp phó Đời sống & Phong trào"
};

export const CongressPortal: React.FC = () => {
  const { 
    currentUser, 
    students, 
    users, 
    congressCampaigns, 
    classCongresses,
    saveCongressCampaign,
    lockAndDistributeCampaign,
    saveClassCongress,
    assignClassSecretary,
    submitCandidatesForApproval,
    reviewCandidates,
    openCongressBallotBox,
    closeCongressBallotBox,
    castCongressVote,
    appointCongressRoles,
    signCongressMinutes,
    submitCongressToAdmin,
    submitCongressMinutes,
    receiveCongressMinutesByAdviser,
    receiveCongressMinutesByYouthUnion,
    approveCongressFinal,
    setCongressYouthUnionPermission
  } = useUniHub();

  // Xác định vai trò sinh viên / BCS
  const isStudentOrMonitor = currentUser?.role === UserRole.STUDENT || currentUser?.role === UserRole.CLASS_MONITOR;

  // Xác định chính xác hồ sơ sinh viên (ưu tiên database, fallback SEED)
  const myStudentObj = useMemo(() => {
    if (!currentUser) return undefined;
    const allKnown = (students && students.length > 0) ? students : SEED_STUDENTS;
    return allKnown.find(s => 
      (currentUser.targetId && s.id.toLowerCase() === currentUser.targetId.toLowerCase()) ||
      (currentUser.username && (s.id.toLowerCase() === currentUser.username.toLowerCase() || (s.email && s.email.toLowerCase() === currentUser.username.toLowerCase()))) ||
      (currentUser.email && s.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [currentUser, students]);

  // Lớp chính thức mà người dùng thuộc về (khóa cứng theo tài khoản, không cho phép sai lệch)
  const myOfficialClassId = useMemo(() => {
    if (isStudentOrMonitor) {
      const cls = myStudentObj?.classId || (currentUser as any)?.classId || currentUser?.classSecretaryForClassId || "";
      return normalizeClassId(cls);
    }
    if (currentUser?.role === UserRole.ADVISER) {
      return normalizeClassId(currentUser.targetId || (currentUser as any)?.classId || "");
    }
    return "";
  }, [isStudentOrMonitor, myStudentObj, currentUser]);

  // Bộ lọc / chọn lớp đang xem (Sinh viên bị khóa cứng vào lớp của mình)
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (isStudentOrMonitor && myOfficialClassId) return myOfficialClassId;
    if (currentUser?.role === UserRole.ADVISER && myOfficialClassId) return myOfficialClassId;
    return "K2-GDTH A";
  });

  // Tự động đồng bộ khóa cứng lớp cho Sinh viên
  React.useEffect(() => {
    if (isStudentOrMonitor && myOfficialClassId && selectedClassId !== myOfficialClassId) {
      setSelectedClassId(myOfficialClassId);
    }
  }, [isStudentOrMonitor, myOfficialClassId, selectedClassId]);

  // Chiến dịch đang hoạt động
  const activeCampaign = useMemo(() => {
    return congressCampaigns.find(c => c.status !== "DRAFT") || congressCampaigns[0];
  }, [congressCampaigns]);

  // Danh sách đại hội của lớp được chọn
  const currentCongress = useMemo(() => {
    if (!selectedClassId) return undefined;
    return classCongresses.find(
      cc => normalizeClassId(cc.classId) === normalizeClassId(selectedClassId)
    );
  }, [classCongresses, selectedClassId]);

  // Kiểm tra tư cách cử tri: Phải là sinh viên thuộc chính xác Chi đoàn này
  const isEligibleVoter = useMemo(() => {
    if (!currentUser || !currentCongress) return false;
    if (!isStudentOrMonitor) return false;
    const voterClass = normalizeClassId(myStudentObj?.classId || (currentUser as any)?.classId || "");
    const congressClass = normalizeClassId(currentCongress.classId);
    return Boolean(voterClass && voterClass === congressClass);
  }, [currentUser, currentCongress, isStudentOrMonitor, myStudentObj]);

  // Kiểm tra quyền Bí thư Chi đoàn
  const isClassSecretary = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;

    // Thu thập tất cả các mã định danh của user hiện tại
    const userKeys = [
      currentUser.targetId,
      currentUser.username,
      currentUser.id,
      currentUser.email,
      myStudentObj?.id,
      (myStudentObj as any)?.code,
      myStudentObj?.email,
      (currentUser as any)?.studentId,
      (currentUser as any)?.code
    ].map(k => (k || "").trim().toLowerCase()).filter(Boolean);

    // 1. Kiểm tra trực tiếp trên đại hội lớp đang chọn
    if (currentCongress) {
      const normCurrentClass = normalizeClassId(currentCongress.classId);
      const secClass = currentUser.classSecretaryForClassId ? normalizeClassId(currentUser.classSecretaryForClassId) : "";
      const secId = (currentCongress.secretaryStudentId || "").trim().toLowerCase();
      const isDesignatedSecretary = Boolean(secId && userKeys.includes(secId));
      const hasSecretaryFlag = Boolean(
        ((currentUser as any)?.isClassSecretary && normalizeClassId((currentUser as any)?.classSecretaryForClassId || "") === normCurrentClass) ||
        (myStudentObj?.isClassSecretary && normalizeClassId(myStudentObj?.classSecretaryForClassId || "") === normCurrentClass)
      );
      if ((secClass && secClass === normCurrentClass) || isDesignatedSecretary || hasSecretaryFlag) {
        return true;
      }
    }

    // 2. Kiểm tra nếu user là Bí thư trong bất kỳ đại hội nào
    return classCongresses.some(cc => {
      const s = (cc.secretaryStudentId || "").trim().toLowerCase();
      return Boolean(s && userKeys.includes(s));
    });
  }, [currentUser, currentCongress, myStudentObj, classCongresses]);

  // Thông tin sinh viên giữ vai trò Bí thư Chi đoàn
  const currentSecretaryStudent = useMemo(() => {
    if (!currentCongress?.secretaryStudentId) return undefined;
    const allKnown = (students && students.length > 0) ? students : SEED_STUDENTS;
    return allKnown.find(s => s.id.toLowerCase() === currentCongress.secretaryStudentId?.toLowerCase());
  }, [currentCongress, students]);

  // Kiểm tra quyền Cố vấn học tập (CVHT)
  const isAdviser = useMemo(() => {
    if (!currentUser || !currentCongress) return false;
    const normCurrentClass = normalizeClassId(currentCongress.classId);
    const advTarget = currentUser.targetId ? normalizeClassId(currentUser.targetId) : "";
    return (
      (currentUser.role === UserRole.ADVISER && advTarget === normCurrentClass) ||
      currentUser.role === UserRole.ADMIN
    );
  }, [currentUser, currentCongress]);

  // Kiểm tra quyền Admin / BCH Đoàn Phân hiệu
  const isAdminOrYouthUnion = useMemo(() => {
    return (
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.YOUTH_UNION
    );
  }, [currentUser]);

  // Tab điều hướng chính
  type MainTab = "VOTE" | "SECRETARY" | "ADVISER" | "CAMPAIGN_ADMIN" | "MINUTES";
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    if (isAdminOrYouthUnion) return "CAMPAIGN_ADMIN";
    if (isAdviser && !isClassSecretary) return "ADVISER";
    if (isClassSecretary) return "SECRETARY";
    return "VOTE";
  });

  // Sinh viên lớp hiện tại
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const norm = normalizeClassId(selectedClassId);
    return students.filter(s => normalizeClassId(s.classId) === norm);
  }, [students, selectedClassId]);

  // Thống kê cử tri & tỷ lệ 2/3
  const voterStats = useMemo(() => {
    const totalStudents = classStudents.length || 1;
    const votedCount = currentCongress?.voterIds?.length || 0;
    const ratio = (votedCount / totalStudents) * 100;
    const isTwoThirds = ratio >= 66.666;
    return {
      total: totalStudents,
      voted: votedCount,
      ratio: ratio.toFixed(1),
      isTwoThirds
    };
  }, [classStudents, currentCongress]);

  // --- STATE TƯƠNG TÁC BỎ PHIẾU CỦA SINH VIÊN ---
  const [selectedVotes, setSelectedVotes] = useState<{ [boxId: string]: string[] }>({});
  const [votingConfirmModal, setVotingConfirmModal] = useState<{ box: BallotBox; selectedIds: string[] } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // --- STATE TƯƠNG TÁC CHỈ ĐỊNH BÍ THƯ CHI ĐOÀN ---
  const [selectedSecStudentId, setSelectedSecStudentId] = useState<string>("");
  const [isAssigningSec, setIsAssigningSec] = useState<boolean>(false);

  React.useEffect(() => {
    if (currentCongress?.secretaryStudentId) {
      setSelectedSecStudentId(currentCongress.secretaryStudentId);
    } else {
      setSelectedSecStudentId("");
    }
  }, [currentCongress?.secretaryStudentId, currentCongress?.id]);

  // Tự động chuyển tab sang SECRETARY nếu user là Bí thư Chi đoàn khi truy cập trang
  const hasAutoSwitchedTabRef = React.useRef(false);
  React.useEffect(() => {
    if (!hasAutoSwitchedTabRef.current && isClassSecretary && activeTab === "VOTE") {
      setActiveTab("SECRETARY");
      hasAutoSwitchedTabRef.current = true;
    }
  }, [isClassSecretary, activeTab]);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const currentVoterId = currentUser?.targetId || currentUser?.username || "";

  // Hash kiểm tra đã bầu
  const hasVotedForBox = (box: BallotBox) => {
    if (!currentCongress || !currentVoterId) return false;
    const rawHash = `${currentCongress.campaignId}_${currentCongress.classId}_${box.id}_${currentVoterId.trim().toUpperCase()}`;
    let utf8Hash = "";
    try {
      utf8Hash = btoa(encodeURIComponent(rawHash));
    } catch {
      utf8Hash = btoa(rawHash);
    }
    const legacyHash = (() => {
      try { return btoa(rawHash); } catch { return ""; }
    })();
    return (box.votes || []).some(v => v.voterHash === utf8Hash || (legacyHash && v.voterHash === legacyHash));
  };

  const handleToggleCandidate = (boxId: string, candidateId: string, maxVotes: number) => {
    const currentList = selectedVotes[boxId] || [];
    if (currentList.includes(candidateId)) {
      setSelectedVotes({
        ...selectedVotes,
        [boxId]: currentList.filter(id => id !== candidateId)
      });
    } else {
      if (currentList.length >= maxVotes) {
        showToast("error", `Hòm phiếu này chỉ được chọn tối đa ${maxVotes} ứng viên.`);
        return;
      }
      setSelectedVotes({
        ...selectedVotes,
        [boxId]: [...currentList, candidateId]
      });
    }
  };

  const handleConfirmVote = async () => {
    if (!votingConfirmModal || !currentCongress) return;
    const { box, selectedIds } = votingConfirmModal;
    const res = await castCongressVote(currentCongress.id, box.id, currentVoterId, selectedIds);
    if (res.success) {
      showToast("success", res.message);
      setSelectedVotes(prev => ({ ...prev, [box.id]: [] }));
      setVotingConfirmModal(null);
    } else {
      showToast("error", res.message);
    }
  };

  // --- STATE QUẢN TRỊ CHI ĐOÀN (BÍ THƯ) ---
  const [candidateModal, setCandidateModal] = useState<{ boxType: BallotBoxType } | null>(null);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateForm, setCandidateForm] = useState<{ studentId: string; manifesto: string }>({
    studentId: "",
    manifesto: ""
  });

  const filteredNominationStudents = useMemo(() => {
    if (!classStudents) return [];
    const currentBox = candidateModal ? currentCongress?.ballotBoxes.find(b => b.type === candidateModal.boxType) : null;
    const existingCandidateIds = new Set(currentBox?.candidates.map(c => c.studentId) || []);

    const term = candidateSearch.trim().toLowerCase();
    const normalizedTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return classStudents.map(student => ({
      ...student,
      isAlreadyNominated: existingCandidateIds.has(student.id)
    })).filter(student => {
      if (!term) return true;
      const normalizedName = (student.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const studentId = (student.id || "").toLowerCase();
      return normalizedName.includes(normalizedTerm) || studentId.includes(term);
    });
  }, [classStudents, candidateModal, currentCongress, candidateSearch]);

  const handleAddCandidate = async () => {
    if (!candidateModal || !currentCongress || !candidateForm.studentId) return;
    const student = classStudents.find(s => s.id === candidateForm.studentId);
    if (!student) return;

    const boxIdx = currentCongress.ballotBoxes.findIndex(b => b.type === candidateModal.boxType);
    if (boxIdx < 0) return;

    const box = currentCongress.ballotBoxes[boxIdx];
    if (box.candidates.some(c => c.studentId === student.id)) {
      showToast("error", "Sinh viên này đã có trong danh sách ứng viên.");
      return;
    }

    const newCand: CongressCandidate = {
      id: `CAND_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      studentId: student.id,
      studentName: student.name,
      classId: currentCongress.classId,
      ballotType: candidateModal.boxType,
      manifesto: candidateForm.manifesto.trim() || "Tích cực rèn luyện, hoàn thành tốt nhiệm vụ được giao.",
      status: "DRAFT"
    };

    const nextBoxes = [...currentCongress.ballotBoxes];
    nextBoxes[boxIdx] = {
      ...box,
      candidates: [...box.candidates, newCand]
    };

    await saveClassCongress({
      ...currentCongress,
      status: "CANDIDATE_DRAFT",
      ballotBoxes: nextBoxes
    });

    showToast("success", `Đã thêm ứng viên ${student.name} vào ${box.title}.`);
    setCandidateModal(null);
    setCandidateSearch("");
    setCandidateForm({ studentId: "", manifesto: "" });
  };

  const handleRemoveCandidate = async (boxType: BallotBoxType, candidateId: string) => {
    if (!currentCongress) return;
    const boxIdx = currentCongress.ballotBoxes.findIndex(b => b.type === boxType);
    if (boxIdx < 0) return;

    const box = currentCongress.ballotBoxes[boxIdx];
    const nextBoxes = [...currentCongress.ballotBoxes];
    nextBoxes[boxIdx] = {
      ...box,
      candidates: box.candidates.filter(c => c.id !== candidateId)
    };

    await saveClassCongress({
      ...currentCongress,
      ballotBoxes: nextBoxes
    });
    showToast("success", "Đã xóa ứng viên khỏi danh sách.");
  };

  const handleUpdateSeats = async (boxType: BallotBoxType, seats: number) => {
    if (!currentCongress || seats < 1) return;
    const boxIdx = currentCongress.ballotBoxes.findIndex(b => b.type === boxType);
    if (boxIdx < 0) return;

    const box = currentCongress.ballotBoxes[boxIdx];
    const nextBoxes = [...currentCongress.ballotBoxes];
    nextBoxes[boxIdx] = {
      ...box,
      maxWinners: seats,
      maxVotesPerBallot: seats
    };

    let patchSeats = {};
    if (boxType === "BCH_CHI_DOAN") patchSeats = { bchChiDoanSeats: seats };
    else if (boxType === "BCH_CHI_HOI") patchSeats = { bchChiHoiSeats: seats };
    else if (boxType === "BAN_CAN_SU") patchSeats = { banCanSuSeats: seats };

    await saveClassCongress({
      ...currentCongress,
      ...patchSeats,
      ballotBoxes: nextBoxes
    });
    showToast("success", `Đã cập nhật số lượng cần bầu thành ${seats}.`);
  };

  const handleSubmitCandidatesToAdviser = async () => {
    if (!currentCongress) return;
    // Kiểm tra từng hòm có đủ ứng viên >= số ghế không
    for (const box of currentCongress.ballotBoxes) {
      if (box.candidates.length < box.maxWinners) {
        showToast("error", `Hòm "${box.title}" có ${box.candidates.length} ứng viên, chưa đủ số ghế cần bầu (${box.maxWinners}). Vui lòng bổ sung thêm.`);
        return;
      }
    }
    await submitCandidatesForApproval(currentCongress.id);
    showToast("success", "Đã gửi danh sách ứng viên 3 hòm phiếu lên Cố vấn học tập phê duyệt.");
  };

  // --- STATE DUYỆT & BỔ NHIỆM (CVHT) ---
  const [rejectModal, setRejectModal] = useState<{ boxType: BallotBoxType } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [appointmentsState, setAppointmentsState] = useState<{ [role: string]: string }>({});

  // Tự động đồng bộ các chức danh đã được bổ nhiệm từ trước
  React.useEffect(() => {
    if (currentCongress?.appointments && currentCongress.appointments.length > 0) {
      const initial: { [role: string]: string } = {};
      currentCongress.appointments.forEach(app => {
        initial[app.role] = app.studentId;
      });
      setAppointmentsState(initial);
    } else {
      setAppointmentsState({});
    }
  }, [currentCongress?.id, currentCongress?.appointments]);

  // Lấy danh sách ứng viên theo từng hòm phiếu kèm số phiếu và trạng thái trúng cử (>50% và trong số ghế)
  const getBoxCandidatesWithStatus = (boxType: BallotBoxType) => {
    const box = currentCongress?.ballotBoxes.find(b => b.type === boxType);
    if (!box) return [];
    const candVoteCounts: { [candId: string]: number } = {};
    box.candidates.forEach(c => { candVoteCounts[c.id] = 0; });
    (box.votes || []).forEach(v => {
      (v.selectedCandidateIds || []).forEach(cId => {
        if (candVoteCounts[cId] !== undefined) candVoteCounts[cId]++;
      });
    });
    const sorted = [...box.candidates].sort((a, b) => (candVoteCounts[b.id] || 0) - (candVoteCounts[a.id] || 0));
    const totalBoxVotes = box.votes ? box.votes.length : 0;
    return sorted.map((cand, idx) => {
      const votes = candVoteCounts[cand.id] || 0;
      const isElected = idx < box.maxWinners && totalBoxVotes > 0 && votes > (totalBoxVotes / 2);
      return { ...cand, votes, isElected };
    });
  };

  // Tên hiển thị người ký chuẩn xác (không hardcode)
  const secretaryDisplayName = useMemo(() => {
    if (currentSecretaryStudent?.name) return currentSecretaryStudent.name;
    if (currentCongress?.secretaryStudentId) {
      const s = students.find(item => item.id.toLowerCase() === currentCongress.secretaryStudentId?.toLowerCase());
      if (s?.name) return s.name;
      return currentCongress.secretaryStudentId;
    }
    return "Chưa chỉ định Bí thư";
  }, [currentSecretaryStudent, currentCongress?.secretaryStudentId, students]);

  const adviserDisplayName = useMemo(() => {
    if (currentCongress?.minutesSignedBy) return currentCongress.minutesSignedBy;
    const norm = normalizeClassId(currentCongress?.classId || "");
    const advUser = users.find(u => u.role === UserRole.ADVISER && normalizeClassId(u.targetId || "") === norm);
    if (advUser?.name) return advUser.name;
    if (currentUser?.role === UserRole.ADVISER && currentUser.name) return currentUser.name;
    return "Cố vấn học tập";
  }, [currentCongress?.minutesSignedBy, currentCongress?.classId, users, currentUser]);

  const renderAppointmentOptions = (boxType: BallotBoxType) => {
    const cands = getBoxCandidatesWithStatus(boxType);
    const elected = cands.filter(c => c.isElected);
    const otherCands = cands.filter(c => !c.isElected);
    const candIds = new Set(cands.map(c => c.studentId));
    const otherStudents = classStudents.filter(s => !candIds.has(s.id));
    return (
      <>
        <option value="">-- Chọn nhân sự bổ nhiệm --</option>
        {elected.length > 0 && (
          <optgroup label="⭐ Ứng viên trúng cử (>50% phiếu)">
            {elected.map(c => (
              <option key={c.studentId} value={c.studentId}>
                ★ {c.studentName} ({c.studentId}) - {c.votes} phiếu [Trúng cử]
              </option>
            ))}
          </optgroup>
        )}
        {otherCands.length > 0 && (
          <optgroup label="Ứng viên khác">
            {otherCands.map(c => (
              <option key={c.studentId} value={c.studentId}>
                {c.studentName} ({c.studentId}) - {c.votes} phiếu
              </option>
            ))}
          </optgroup>
        )}
        {otherStudents.length > 0 && (
          <optgroup label="Đoàn viên / Sinh viên lớp">
            {otherStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </optgroup>
        )}
      </>
    );
  };

  const handleApproveAllCandidates = async () => {
    if (!currentCongress) return;
    await reviewCandidates(currentCongress.id, "ALL", "APPROVE");
    showToast("success", "Đã phê duyệt toàn bộ danh sách ứng viên 3 hòm phiếu.");
  };

  const handleRejectCandidatesBox = async () => {
    if (!rejectModal || !currentCongress) return;
    await reviewCandidates(currentCongress.id, rejectModal.boxType, "REJECT", rejectReason.trim() || "Cần điều chỉnh cơ cấu nhân sự.");
    showToast("success", "Đã trả lại danh sách ứng viên kèm ý kiến nhận xét.");
    setRejectModal(null);
    setRejectReason("");
  };

  const handleSaveAppointments = async () => {
    if (!currentCongress) return;
    const newAppointments: CongressAppointment[] = [];
    const now = new Date().toISOString();

    Object.entries(appointmentsState).forEach(([roleKey, studentId]) => {
      if (studentId) {
        const student = students.find(s => s.id === studentId);
        newAppointments.push({
          id: `APP_${Date.now()}_${roleKey}`,
          studentId,
          studentName: student?.name,
          role: roleKey as CongressAppointmentRole,
          appointedBy: currentUser?.name || "Cố vấn học tập",
          appointedAt: now,
          source: "ELECTION_RESULT"
        });
      }
    });

    if (newAppointments.length === 0) {
      showToast("error", "Vui lòng chọn ít nhất 1 nhân sự để bổ nhiệm.");
      return;
    }

    await appointCongressRoles(currentCongress.id, newAppointments);
    showToast("success", "Đã lưu quyết định bổ nhiệm chức danh thành công.");
  };

  // --- XUẤT BIÊN BẢN ---
  const handlePrintMinutes = () => {
    window.print();
  };

  // --- THANH THÔNG TIN & GÁN QUYỀN BÍ THƯ CHI ĐOÀN DÙNG CHUNG CHO CVHT VÀ BÍ THƯ ---
  const renderSecretaryAssignmentBar = () => {
    if (!currentCongress) return null;
    const isSelectionChanged = Boolean(selectedSecStudentId && selectedSecStudentId !== (currentCongress.secretaryStudentId || ""));

    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bí thư Chi đoàn lớp hiện tại</span>
            <span className="font-bold text-slate-900 text-sm">
              {currentSecretaryStudent ? `${currentSecretaryStudent.name} (${currentSecretaryStudent.id})` : (currentCongress.secretaryStudentId || "Chưa chỉ định Bí thư")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Nếu là Admin hoặc CVHT: Dropdown chỉ định Bí thư kèm NÚT XÁC NHẬN CHỈ ĐỊNH */}
          {(isAdminOrYouthUnion || isAdviser) && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">Chỉ định Bí thư:</span>
                <select
                  value={selectedSecStudentId}
                  onChange={(e) => setSelectedSecStudentId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-h-[40px] flex-1 sm:w-64"
                >
                  <option value="" disabled>-- Chọn sinh viên làm Bí thư --</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              {isSelectionChanged ? (
                <button
                  type="button"
                  disabled={!selectedSecStudentId || isAssigningSec}
                  onClick={async () => {
                    if (!selectedSecStudentId || !currentCongress) return;
                    setIsAssigningSec(true);
                    try {
                      await assignClassSecretary(selectedSecStudentId, currentCongress.classId);
                      const targetStud = classStudents.find(s => s.id === selectedSecStudentId);
                      showToast("success", `Đã lưu chỉ định đồng chí ${targetStud?.name || selectedSecStudentId} làm Bí thư Chi đoàn ${currentCongress.classId}.`);
                    } catch (err) {
                      showToast("error", "Lỗi khi lưu chỉ định Bí thư.");
                    } finally {
                      setIsAssigningSec(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400/50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <CheckCircle size={15} />
                  <span>{isAssigningSec ? "Đang lưu..." : "Lưu thay đổi Bí thư"}</span>
                </button>
              ) : currentCongress.secretaryStudentId ? (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-bold flex items-center gap-1.5 min-h-[40px] shadow-2xs">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                  <span>Đã chỉ định chính thức</span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!selectedSecStudentId || isAssigningSec}
                  onClick={async () => {
                    if (!selectedSecStudentId || !currentCongress) return;
                    setIsAssigningSec(true);
                    try {
                      await assignClassSecretary(selectedSecStudentId, currentCongress.classId);
                      const targetStud = classStudents.find(s => s.id === selectedSecStudentId);
                      showToast("success", `Đã xác nhận chỉ định đồng chí ${targetStud?.name || selectedSecStudentId} làm Bí thư Chi đoàn ${currentCongress.classId}.`);
                    } catch (err) {
                      showToast("error", "Lỗi khi lưu chỉ định Bí thư.");
                    } finally {
                      setIsAssigningSec(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:pointer-events-none"
                >
                  <CheckCircle size={15} />
                  <span>{isAssigningSec ? "Đang lưu..." : "Xác nhận chỉ định"}</span>
                </button>
              )}
            </div>
          )}

          {/* Nếu là sinh viên lớp này nhưng chưa có quyền Bí thư: Nút nhận vai trò Bí thư */}
          {isStudentOrMonitor && !isClassSecretary && (
            <button
              onClick={async () => {
                const sId = myStudentObj?.id || currentUser?.targetId || currentUser?.username || "";
                if (sId) {
                  await assignClassSecretary(sId, currentCongress.classId);
                  showToast("success", `Đã kích hoạt quyền Bí thư Chi đoàn ${currentCongress.classId} cho bạn.`);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <ShieldCheck size={14} />
              <span>Kích hoạt quyền Bí thư của tôi</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-fade-in ${
          feedbackToast.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {feedbackToast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* TOP HEADER: CHIẾN DỊCH VÀ CHỌN CHI ĐOÀN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-50/60 to-blue-50/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10">
                <Flag size={12} />
                Chiến dịch Đoàn Phân hiệu
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-700 font-mono">
                {activeCampaign?.academicYear || "2026-2027"}
              </span>
              {currentCongress && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                  currentCongress.status === "VOTING" 
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10 animate-pulse"
                    : currentCongress.status === "APPROVED"
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/10"
                }`}>
                  Trạng thái: {currentCongress.status}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {currentCongress?.title || "Không Gian Đại Hội Chi Đoàn Cấp Phân Hiệu"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Bầu cử 3 hòm phiếu: Ban Chấp hành Chi đoàn, Ban Chấp hành Chi hội Sinh viên & Ban cán sự lớp
            </p>
          </div>

          {/* PHÂN QUYỀN CHỌN LỚP: SINH VIÊN BỊ KHÓA CỨNG VÀO LỚP CỦA MÌNH */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {isStudentOrMonitor ? (
              <div className="bg-indigo-50/80 px-4 py-2.5 rounded-2xl border border-indigo-200/80 flex items-center gap-3 min-h-[44px]">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-indigo-700 block font-bold uppercase tracking-wider">Chi đoàn lớp của bạn</span>
                  <span className="text-xs font-black text-indigo-950 font-mono tracking-tight">
                    {myOfficialClassId || <span className="text-rose-600 font-semibold">Chưa được xếp lớp</span>}
                  </span>
                </div>
              </div>
            ) : currentUser?.role === UserRole.ADVISER ? (
              <div className="bg-slate-50 p-2 rounded-2xl ring-1 ring-slate-900/5 flex items-center gap-2 min-h-[44px]">
                <Users size={16} className="text-slate-400 ml-2" />
                <div className="text-left pr-3">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Lớp phụ trách</span>
                  <span className="text-xs font-bold text-slate-900 font-mono">{myOfficialClassId || selectedClassId}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-2 rounded-2xl ring-1 ring-slate-900/5 flex items-center gap-2 min-h-[44px]">
                <Users size={16} className="text-slate-400 ml-2" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Chi đoàn lớp</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-4"
                  >
                    {Array.from(new Set(students.map(s => normalizeClassId(s.classId)).filter(Boolean))).map(cId => (
                      <option key={cId} value={cId}>{cId}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quick info vai trò */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-indigo-50/50 border border-indigo-150/60 text-indigo-900 text-xs flex items-center gap-2 min-h-[44px]">
              <Award size={15} className="text-indigo-600 shrink-0" />
              <div className="text-left">
                <span className="font-bold block leading-none">
                  {isClassSecretary ? "Bí thư Chi đoàn" : isAdviser ? "Cố vấn học tập" : isAdminOrYouthUnion ? "Đoàn Phân hiệu / Admin" : "Cử tri Chi đoàn"}
                </span>
                <span className="text-[10px] text-indigo-700/80">
                  {currentUser?.name || "Người dùng"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BANNER THẨM QUYỀN CẤP PHÉP & MỞ/ĐÓNG CỦA ĐOÀN THANH NIÊN */}
        {currentCongress && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            {!currentCongress.isYouthUnionApproved ? (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100/90 text-amber-700 shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                        Chưa được Đoàn Phân hiệu cấp phép mở Đại hội
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-800">
                        CHỜ ĐTN CẤP PHÉP
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                      Theo Điều lệ Đoàn, Đại hội Chi đoàn cần quyết định cấp phép từ BCH Đoàn TNCS Hồ Chí Minh Phân hiệu để Bí thư được mở hòm phiếu và cử tri được bỏ phiếu.
                    </p>
                  </div>
                </div>
                {isAdminOrYouthUnion && (
                  <button
                    onClick={async () => {
                      await setCongressYouthUnionPermission(currentCongress.id, "OPEN");
                      showToast("success", `Đoàn Phân hiệu đã phê duyệt cấp phép & Mở Đại hội cho Chi đoàn ${currentCongress.classId}!`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-1.5 shrink-0 min-h-[44px] cursor-pointer"
                  >
                    <Unlock size={15} />
                    <span>Cấp Phép & Mở Đại Hội</span>
                  </button>
                )}
              </div>
            ) : currentCongress.isYouthUnionClosed ? (
              <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-100/90 text-rose-700 shrink-0 mt-0.5">
                    <Lock size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900">
                        Đại hội đã được Đoàn Phân hiệu đóng / khóa
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/70 text-rose-800">
                        ĐÃ KHÓA / ĐÓNG
                      </span>
                    </div>
                    <p className="text-xs text-rose-800/90 mt-0.5 leading-relaxed">
                      BCH Đoàn TNCS Hồ Chí Minh Phân hiệu đã đóng phiên Đại hội của Chi đoàn {currentCongress.classId} {currentCongress.youthUnionClosedAt ? `vào lúc ${new Date(currentCongress.youthUnionClosedAt).toLocaleString("vi-VN")}` : ""}.
                    </p>
                  </div>
                </div>
                {isAdminOrYouthUnion && (
                  <button
                    onClick={async () => {
                      await setCongressYouthUnionPermission(currentCongress.id, "OPEN");
                      showToast("success", `Đã mở lại Đại hội cho Chi đoàn ${currentCongress.classId}!`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-1.5 shrink-0 min-h-[44px] cursor-pointer"
                  >
                    <Unlock size={15} />
                    <span>Mở Lại Đại Hội</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100/90 text-emerald-700 shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                        Đã được BCH Đoàn Phân hiệu cấp phép mở Đại hội
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-800">
                        ✓ ĐANG MỞ
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5">
                      Cấp phép bởi: <strong>{currentCongress.youthUnionApprovedBy || "BCH Đoàn Phân hiệu"}</strong> {currentCongress.youthUnionApprovedAt ? `• ${new Date(currentCongress.youthUnionApprovedAt).toLocaleString("vi-VN")}` : ""}. Chi đoàn đủ thẩm quyền tiến hành bỏ phiếu.
                    </p>
                  </div>
                </div>
                {isAdminOrYouthUnion && (
                  <button
                    onClick={async () => {
                      if (confirm(`Xác nhận ĐÓNG / KHÓA phiên Đại hội của Chi đoàn "${currentCongress.classId}"? Hòm phiếu sẽ lập tức dừng nhận phiếu.`)) {
                        await setCongressYouthUnionPermission(currentCongress.id, "CLOSE");
                        showToast("success", `Đã đóng phiên Đại hội của Chi đoàn ${currentCongress.classId}!`);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold active:scale-98 transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
                  >
                    <Lock size={14} />
                    <span>Đóng / Khóa Đại Hội</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* CẢNH BÁO MỀM 2/3 CỬ TRI & THANH TIẾN ĐỘ */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-900/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Sĩ số cử tri lớp</span>
              <span className="text-lg font-black text-slate-900 tabular-nums font-mono">{voterStats.total}</span>
              <span className="text-xs text-slate-400 ml-1">sinh viên</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 shadow-2xs">
              <Users size={18} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-900/5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Đã bỏ phiếu</span>
              <span className="text-lg font-black text-emerald-600 tabular-nums font-mono">{voterStats.voted}</span>
              <span className="text-xs text-slate-400 ml-1">cử tri ({voterStats.ratio}%)</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Vote size={18} />
            </div>
          </div>

          <div className={`rounded-2xl p-4 ring-1 flex items-center gap-3 ${
            voterStats.isTwoThirds 
              ? "bg-emerald-50/60 ring-emerald-600/10 text-emerald-900" 
              : "bg-amber-50/70 ring-amber-600/10 text-amber-900"
          }`}>
            {voterStats.isTwoThirds ? (
              <CheckCircle size={22} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={22} className="text-amber-600 shrink-0" />
            )}
            <div className="text-left text-xs leading-snug">
              <span className="font-bold block">
                {voterStats.isTwoThirds ? "Đạt chuẩn 2/3 cử tri tham gia" : "Chưa đạt 2/3 tổng số cử tri"}
              </span>
              <span className="text-[11px] opacity-85">
                {voterStats.isTwoThirds 
                  ? "Hợp lệ theo quy định đại hội." 
                  : "Hệ thống không chặn quy trình, ghi nhận biên bản để CVHT phê duyệt tiếp tục."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS ĐIỀU HƯỚNG THEO VAI TRÒ */}
      <div className="flex border-b border-slate-200/80 bg-white p-1.5 rounded-2xl gap-1 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab("VOTE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer whitespace-nowrap ${
            activeTab === "VOTE" 
              ? "bg-indigo-600 text-white shadow-xs" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Vote size={16} />
          <span>Bỏ Phiếu 3 Hòm Phiếu</span>
        </button>

        {(isClassSecretary || isAdminOrYouthUnion) && (
          <button
            onClick={() => setActiveTab("SECRETARY")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer whitespace-nowrap ${
              activeTab === "SECRETARY" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Điều Hành Bầu Cử (Bí Thư)</span>
          </button>
        )}

        {(isAdviser || isAdminOrYouthUnion) && (
          <button
            onClick={() => setActiveTab("ADVISER")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer whitespace-nowrap ${
              activeTab === "ADVISER" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UserCheck size={16} />
            <span>Xét Duyệt & Bổ Nhiệm (CVHT)</span>
          </button>
        )}

        {isAdminOrYouthUnion && (
          <button
            onClick={() => setActiveTab("CAMPAIGN_ADMIN")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer whitespace-nowrap ${
              activeTab === "CAMPAIGN_ADMIN" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building size={16} />
            <span>Tiến Độ Toàn Phân Hiệu</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("MINUTES")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer whitespace-nowrap ${
            activeTab === "MINUTES" 
              ? "bg-indigo-600 text-white shadow-xs" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <FileText size={16} />
          <span>Biên Bản & Quyết Định</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. TAB BỎ PHIẾU 3 HÒM PHIẾU (CHO SINH VIÊN VÀ CỬ TRI) */}
      {/* ========================================================= */}
      {activeTab === "VOTE" && currentCongress && (
        <div className="space-y-6 animate-fade-in">
          {/* BANNER ĐIỀU HÀNH BẦU CỬ CỦA BÍ THƯ CHI ĐOÀN */}
          {(isClassSecretary || isAdminOrYouthUnion) && (
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
                    <ShieldCheck size={12} />
                    ⭐ Thẩm Quyền Bí Thư Chi Đoàn
                  </span>
                  <span className="text-xs text-indigo-200 font-semibold">
                    Chi đoàn {currentCongress.classId}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Bảng Điều Hành Khóa & Mở Hòm Phiếu Bầu Cử
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5 max-w-2xl leading-relaxed">
                  Quyền khóa và mở cho phép bầu cử thuộc về Bí thư Chi đoàn (GVCN chỉ phê duyệt đề án nhân sự và bổ nhiệm). Bạn có thể mở/khóa toàn bộ hoặc điều hành riêng từng hòm phiếu.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {(currentCongress.status === "CANDIDATE_APPROVED" || currentCongress.ballotBoxes.some(b => b.status === "APPROVED" || b.status === "CLOSED")) && (
                  <button
                    onClick={async () => {
                      await openCongressBallotBox(currentCongress.id);
                      showToast("success", "Bí thư Chi đoàn đã mở tất cả hòm phiếu cho cử tri bắt đầu bỏ phiếu.");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Unlock size={15} />
                    <span>Mở Tất Cả Hòm Phiếu</span>
                  </button>
                )}

                {currentCongress.status === "VOTING" && (
                  <button
                    onClick={async () => {
                      await closeCongressBallotBox(currentCongress.id);
                      showToast("success", "Bí thư Chi đoàn đã khóa hòm phiếu & chuyển sang kiểm phiếu.");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Lock size={15} />
                    <span>Khóa Hòm Phiếu & Kiểm Phiếu</span>
                  </button>
                )}

                {currentCongress.status === "COUNTED" && (
                  <button
                    onClick={async () => {
                      await openCongressBallotBox(currentCongress.id);
                      showToast("success", "Bí thư Chi đoàn đã mở lại hòm phiếu bầu cử.");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Unlock size={15} />
                    <span>Mở Lại Bầu Cử</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("SECRETARY")}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 shadow-xs active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Edit3 size={14} />
                  <span>Cấu Hình Nhân Sự</span>
                </button>
              </div>
            </div>
          )}

          {/* BANNER THÔNG TIN PHÂN ĐỊNH THẨM QUYỀN DÀNH CHO GVCN (CỐ VẤN HỌC TẬP) */}
          {isAdviser && !isClassSecretary && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Vai trò: Cố vấn học tập (GVCN)
                  </span>
                  <span className="text-slate-500">
                    Quyền khóa và mở cho phép bầu cử thuộc về Bí thư Chi đoàn điều hành Đại hội. Thầy/Cô thực hiện duyệt danh sách ứng viên và bổ nhiệm chức danh sau khi có kết quả kiểm phiếu.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("ADVISER")}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 min-h-[40px] cursor-pointer flex items-center gap-1.5"
              >
                <span>Vào Duyệt & Bổ Nhiệm CVHT</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          {/* BANNER THÔNG BÁO TIẾN ĐỘ THEO TRẠNG THÁI */}
          {currentCongress.status === "CANDIDATE_APPROVED" && (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Đề án nhân sự đã được CVHT phê chuẩn!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Danh sách ứng viên 3 hòm phiếu đã sẵn sàng. Bí thư Chi đoàn thực hiện mở hòm phiếu để toàn thể cử tri trong Chi đoàn tiến hành bỏ phiếu bầu cử.
                  </p>
                </div>
              </div>
              {(isClassSecretary || isAdminOrYouthUnion) && (
                <button
                  onClick={async () => {
                    await openCongressBallotBox(currentCongress.id);
                    showToast("success", "Bí thư Chi đoàn đã mở hòm phiếu bầu cử cho toàn bộ Chi đoàn!");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md whitespace-nowrap min-h-[44px] cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Unlock size={16} />
                  <span>Mở Hòm Phiếu Bầu Cử Ngay</span>
                </button>
              )}
            </div>
          )}

          {currentCongress.status === "VOTING" && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Vote size={18} />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <span>Hòm phiếu đang mở bỏ phiếu</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </span>
                  <span className="text-slate-500">
                    Đã có <strong className="text-emerald-700 font-mono">{currentCongress.voterIds?.length || 0} cử tri</strong> tham gia. Bí thư Chi đoàn có quyền khóa hòm phiếu khi đại hội kết thúc phần bỏ phiếu.
                  </span>
                </div>
              </div>
              {(isClassSecretary || isAdminOrYouthUnion) && (
                <button
                  onClick={async () => {
                    await closeCongressBallotBox(currentCongress.id);
                    showToast("success", "Bí thư Chi đoàn đã khóa hòm phiếu & chuyển sang kiểm phiếu.");
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-xs whitespace-nowrap min-h-[40px] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Lock size={14} />
                  <span>Khóa Bầu Cử & Kiểm Phiếu</span>
                </button>
              )}
            </div>
          )}


          {currentCongress.status !== "VOTING" && currentCongress.status !== "COUNTED" && currentCongress.status !== "APPOINTED" && currentCongress.status !== "APPROVED" && currentCongress.status !== "CANDIDATE_APPROVED" && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Giai đoạn: Bí thư Chi đoàn lập danh sách & đề xuất nhân sự bầu cử
                  </h4>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    Bí thư Chi đoàn đang thực hiện đề xuất danh sách ứng cử viên 3 hòm phiếu (BCH Chi đoàn, BCH Chi hội, Ban cán sự) và gửi Cố vấn học tập (CVHT) phê duyệt. Quyền khóa và mở hòm phiếu bầu cử thuộc về Bí thư Chi đoàn sau khi CVHT phê chuẩn.
                  </p>
                </div>
              </div>
              {(isClassSecretary || isAdminOrYouthUnion) && (
                <button
                  onClick={() => setActiveTab("SECRETARY")}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-xs whitespace-nowrap min-h-[44px] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <UserCheck size={15} />
                  <span>Vào Điều Hành & Đề Xuất Ngay</span>
                </button>
              )}
              {isAdviser && !isClassSecretary && (
                <button
                  onClick={() => setActiveTab("ADVISER")}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-xs whitespace-nowrap min-h-[44px] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <UserCheck size={15} />
                  <span>Vào Xét Duyệt CVHT</span>
                </button>
              )}
            </div>
          )}

          {/* CẢNH BÁO KHI CHƯA ĐƯỢC ĐTN CẤP PHÉP HOẶC ĐÃ ĐÓNG */}
          {(!currentCongress.isYouthUnionApproved || currentCongress.isYouthUnionClosed) && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-3">
              <AlertCircle size={36} className="text-amber-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {currentCongress.isYouthUnionClosed 
                  ? "Phiên Đại Hội Đang Tạm Khóa Bởi Đoàn Phân Hiệu" 
                  : "Đại Hội Chi Đoàn Chưa Được Cấp Phép Mở Bỏ Phiếu"}
              </h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                {currentCongress.isYouthUnionClosed 
                  ? "BCH Đoàn TNCS Hồ Chí Minh Phân hiệu đã đóng phiên Đại hội của Chi đoàn. Cử tri không thể bỏ phiếu trong thời gian này." 
                  : "Theo quy định, Đại hội Chi đoàn cần quyết định cấp phép chính thức từ BCH Đoàn TNCS Hồ Chí Minh Phân hiệu. Cử tri vui lòng quay lại khi có thông báo mở bỏ phiếu."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {currentCongress.ballotBoxes.map((box) => {
              const voted = hasVotedForBox(box);
              const selectedList = selectedVotes[box.id] || [];
              const isOpen = box.status === "OPEN";

              return (
                <div key={box.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    {/* Header box */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          box.type === "BCH_CHI_DOAN" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10" :
                          box.type === "BCH_CHI_HOI" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10" :
                          "bg-purple-50 text-purple-700 ring-1 ring-purple-600/10"
                        }`}>
                          {box.type === "BCH_CHI_DOAN" ? "BCH Chi đoàn" : box.type === "BCH_CHI_HOI" ? "BCH Chi hội" : "Ban cán sự lớp"}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isOpen ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10" :
                          box.status === "CLOSED" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10" :
                          box.status === "APPROVED" ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {isOpen ? "Đang mở" : box.status === "CLOSED" ? "Đã khóa" : box.status === "APPROVED" ? "Đã duyệt" : box.status}
                        </span>
                      </div>

                      {/* Nút Khóa / Mở từng hòm độc lập cho Bí thư Chi đoàn */}
                      {(isClassSecretary || isAdminOrYouthUnion) && (
                        <div>
                          {isOpen ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                closeCongressBallotBox(currentCongress.id, box.id);
                                showToast("success", `Bí thư đã khóa hòm phiếu ${box.title}.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Bí thư Chi đoàn khóa hòm này"
                            >
                              <Lock size={11} />
                              <span>Khóa hòm</span>
                            </button>
                          ) : (currentCongress.status === "CANDIDATE_APPROVED" || currentCongress.status === "VOTING" || currentCongress.status === "COUNTED" || box.status === "APPROVED" || box.status === "CLOSED") ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCongressBallotBox(currentCongress.id, box.id);
                                showToast("success", `Bí thư đã mở hòm phiếu ${box.title} cho cử tri.`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Bí thư Chi đoàn mở hòm này"
                            >
                              <Unlock size={11} />
                              <span>Mở hòm</span>
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-3 leading-snug">
                      {box.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Cần bầu: <strong className="text-slate-900 font-mono">{box.maxWinners}</strong> đồng chí | Chọn tối đa: <strong className="text-slate-900 font-mono">{box.maxVotesPerBallot}</strong> ứng viên
                    </p>

                    {/* Danh sách ứng viên */}
                    <div className="mt-4 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                        <span>Danh sách ứng cử viên ({box.candidates.length})</span>
                        <span className="font-mono text-indigo-600 font-bold">
                          Đã chọn: {selectedList.length}/{box.maxVotesPerBallot}
                        </span>
                      </div>

                      {box.candidates.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl ring-1 ring-slate-900/5">
                          Chưa có ứng viên nào
                        </div>
                      ) : (
                        box.candidates.map((cand) => {
                          const isChecked = selectedList.includes(cand.id);
                          return (
                            <div 
                              key={cand.id}
                              onClick={() => {
                                if (!isEligibleVoter) {
                                  showToast("error", `Bạn không phải đoàn viên/sinh viên thuộc Chi đoàn ${currentCongress.classId}. Bạn không có quyền bỏ phiếu!`);
                                  return;
                                }
                                if (isOpen && !voted) {
                                  handleToggleCandidate(box.id, cand.id, box.maxVotesPerBallot);
                                }
                              }}
                              className={`p-3 rounded-2xl border transition-all text-left flex items-start gap-3 select-none ${
                                !isEligibleVoter || !isOpen || voted ? "opacity-90 cursor-default" : "cursor-pointer"
                              } ${
                                isChecked 
                                  ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-500/20" 
                                  : "bg-white hover:bg-slate-50 border-slate-200/70"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                                isChecked 
                                  ? "bg-indigo-600 border-indigo-600 text-white" 
                                  : "bg-white border-slate-300"
                              }`}>
                                {isChecked && <Check size={14} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-900 block truncate">
                                  {cand.studentName || cand.studentId}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono block">
                                  Mã SV: {cand.studentId}
                                </span>
                                {cand.manifesto && (
                                  <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2">
                                    "{cand.manifesto}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Footer Action Bỏ phiếu */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {!isEligibleVoter ? (
                      <div className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px]">
                        <Lock size={15} />
                        <span>Chỉ cử tri Chi đoàn {currentCongress.classId} mới có quyền bỏ phiếu</span>
                      </div>
                    ) : voted ? (
                      <div className="w-full py-2.5 px-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <span>Đã hoàn thành bỏ phiếu (Phiếu ẩn danh)</span>
                      </div>
                    ) : isOpen ? (
                      <button
                        onClick={() => {
                          if (selectedList.length === 0) {
                            showToast("error", "Vui lòng chọn ít nhất 1 ứng viên trước khi bỏ phiếu.");
                            return;
                          }
                          setVotingConfirmModal({ box, selectedIds: selectedList });
                        }}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                      >
                        <Vote size={16} />
                        <span>Xác Nhận Bỏ Phiếu ({selectedList.length}/{box.maxVotesPerBallot})</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 px-3 bg-slate-100 rounded-xl text-slate-500 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px]">
                        <Lock size={15} />
                        <span>Hòm phiếu hiện đang khóa</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE NẾU LỚP CHƯA CÓ PHIÊN ĐẠI HỘI */}
      {!currentCongress && (
        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200/80 shadow-xs text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Vote size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Chi đoàn {selectedClassId || "này"} chưa có phiên Đại hội
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Chiến dịch Đại hội cấp Phân hiệu hiện chưa phân bổ hoặc Chi đoàn chưa khởi tạo phiên Đại hội. Vui lòng quay lại sau hoặc liên hệ Cố vấn học tập / Bí thư Chi đoàn.
            </p>
          </div>
          {isAdminOrYouthUnion && (
            <div className="pt-2">
              <button
                onClick={() => setActiveTab("CAMPAIGN_ADMIN")}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all inline-flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <span>Xem và phát chiến dịch tới các Chi đoàn</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL XÁC NHẬN BỎ PHIẾU BÍ MẬT */}
      {votingConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Vote size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Xác nhận bỏ phiếu bầu cử</h3>
                <p className="text-xs text-slate-500">{votingConfirmModal.box.title}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-900/5 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Danh sách ứng viên bạn đã chọn:</span>
              <ul className="space-y-1 text-slate-800">
                {votingConfirmModal.selectedIds.map(candId => {
                  const c = votingConfirmModal.box.candidates.find(item => item.id === candId);
                  return (
                    <li key={candId} className="flex items-center gap-2 font-medium">
                      <Check size={14} className="text-emerald-600" />
                      <span>{c?.studentName || c?.studentId}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
              ⚠️ Phiếu bầu là hoàn toàn <strong>ẩn danh</strong> và <strong>không thể chỉnh sửa</strong> sau khi xác nhận.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setVotingConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all min-h-[44px] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmVote}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all min-h-[44px] cursor-pointer"
              >
                Đồng Ý Gửi Phiếu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB ĐIỀU HÀNH BẦU CỬ & QUẢN TRỊ (BÍ THƯ CHI ĐOÀN) */}
      {/* ========================================================= */}
      {activeTab === "SECRETARY" && currentCongress && (
        (!isClassSecretary && !isAdminOrYouthUnion) ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-3 animate-fade-in">
            <ShieldCheck size={36} className="text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              Khu Vực Thao Tác Dành Riêng Cho Bí Thư Chi Đoàn
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Theo Điều lệ Đoàn, quyền khóa và mở cho phép bầu cử và điều hành đề xuất nhân sự thuộc về Bí thư Chi đoàn. Với vai trò Cố vấn học tập (GVCN), Thầy/Cô vui lòng chuyển sang tab Xét Duyệt & Bổ Nhiệm.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveTab("ADVISER")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer min-h-[44px]"
              >
                Chuyển Sang Tab Xét Duyệt & Bổ Nhiệm (CVHT)
              </button>
            </div>
          </div>
        ) : (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Banner Bí thư Chi đoàn */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                ⭐ Thẩm Quyền Bí thư Chi đoàn • Điều Hành Bầu Cử & Đề Xuất Nhân Sự
              </span>
              <h2 className="text-lg font-bold text-white">
                Điều Hành Bầu Cử & Đề Xuất Nhân Sự Đại Hội {currentCongress.classId}
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">
                Quyền hạn Bí thư Chi đoàn: Chuẩn bị nhân sự 3 hòm phiếu gửi CVHT duyệt; TOÀN QUYỀN KHÓA VÀ MỞ HÒM PHIẾU BẦU CỬ cho cử tri trong đại hội.
              </p>
            </div>

            {/* Quick Action Button theo trạng thái */}
            <div className="flex flex-wrap gap-2">
              {currentCongress.status === "CANDIDATE_DRAFT" || currentCongress.status === "RECEIVED" ? (
                <button
                  onClick={handleSubmitCandidatesToAdviser}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Send size={15} />
                  <span>Gửi CVHT Duyệt Ứng Viên</span>
                </button>
              ) : currentCongress.status === "CANDIDATE_APPROVED" ? (
                <button
                  onClick={async () => {
                    await openCongressBallotBox(currentCongress.id);
                    showToast("success", "Bí thư Chi đoàn đã mở tất cả hòm phiếu bầu cử cho cử tri.");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Unlock size={15} />
                  <span>Mở Hòm Phiếu Bầu Cử</span>
                </button>
              ) : currentCongress.status === "VOTING" ? (
                <button
                  onClick={async () => {
                    await closeCongressBallotBox(currentCongress.id);
                    showToast("success", "Bí thư Chi đoàn đã khóa hòm phiếu & chuyển sang kiểm phiếu.");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Lock size={15} />
                  <span>Khóa Hòm Phiếu & Kiểm Phiếu</span>
                </button>
              ) : currentCongress.status === "COUNTED" ? (
                <button
                  onClick={async () => {
                    await openCongressBallotBox(currentCongress.id);
                    showToast("success", "Bí thư Chi đoàn đã mở lại hòm phiếu bầu cử.");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Unlock size={15} />
                  <span>Mở Lại Hòm Phiếu Bầu Cử</span>
                </button>
              ) : (currentCongress.status === "MINUTES_SIGNED" || currentCongress.status === "APPOINTED" || currentCongress.status === "COUNTED" || currentCongress.status === "SUBMITTED") ? (
                <button
                  onClick={async () => {
                    await submitCongressMinutes(currentCongress.id);
                    showToast("success", "Đã gửi biên bản Đại hội tới Cố vấn học tập (GVCN) và Đoàn Phân hiệu!");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Send size={15} />
                  <span>{currentCongress.submittedAt ? "Gửi Lại Biên Bản Cho GVCN & ĐTN" : "Gửi Biên Bản Cho GVCN & ĐTN"}</span>
                </button>
              ) : null}

              {/* Nút mở lại soạn thảo để đề xuất nhân sự nếu cần */}
              {(currentCongress.status === "VOTING" || currentCongress.status === "CANDIDATE_APPROVED" || currentCongress.status === "COUNTED") && (
                <button
                  onClick={async () => {
                    const nextBoxes = currentCongress.ballotBoxes.map(b => ({ ...b, status: "DRAFT" as const }));
                    await saveClassCongress({
                      ...currentCongress,
                      status: "CANDIDATE_DRAFT",
                      ballotBoxes: nextBoxes
                    });
                    showToast("success", "Đã mở lại giai đoạn Đề xuất nhân sự cho Bí thư Chi đoàn.");
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/20 shadow-xs active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Edit3 size={14} />
                  <span>Mở Lại Đề Xuất Nhân Sự</span>
                </button>
              )}
            </div>
          </div>

          {/* TRẠNG THÁI TIẾP NHẬN BIÊN BẢN CỦA GVCN VÀ ĐOÀN PHÂN HIỆU */}
          {currentCongress.submittedAt && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  Tiến trình tiếp nhận hồ sơ Đại hội
                </span>
                <p className="text-xs text-slate-700">
                  Biên bản đã gửi lúc <strong>{new Date(currentCongress.submittedAt).toLocaleString("vi-VN")}</strong>. Đang chờ 2 đầu nhận phê duyệt:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                  currentCongress.adviserReceived 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  <GraduationCap size={14} />
                  <span>GVCN: {currentCongress.adviserReceived ? `✓ Đã tiếp nhận` : `⏳ Chờ nhận`}</span>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                  currentCongress.youthUnionReceived 
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  <ShieldCheck size={14} />
                  <span>ĐTN: {currentCongress.youthUnionReceived ? `✓ Đã tiếp nhận` : `⏳ Chờ nhận`}</span>
                </div>
              </div>
            </div>
          )}

          {/* THANH THÔNG TIN & GÁN QUYỀN BÍ THƯ CHI ĐOÀN */}
          {renderSecretaryAssignmentBar()}

          {/* QUẢN TRỊ 3 HÒM PHIẾU ĐỀ XUẤT NHÂN SỰ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {currentCongress.ballotBoxes.map((box) => (
              <div key={box.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hòm phiếu</span>
                      <h4 className="text-sm font-bold text-slate-900">{box.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        box.status === "OPEN" ? "bg-emerald-100 text-emerald-800" :
                        box.status === "CLOSED" ? "bg-rose-100 text-rose-800" :
                        box.status === "APPROVED" ? "bg-indigo-100 text-indigo-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {box.status === "OPEN" ? "Đang mở" : box.status === "CLOSED" ? "Đã khóa" : box.status === "APPROVED" ? "Đã duyệt" : box.status}
                      </span>
                      {box.status === "OPEN" ? (
                        <button
                          type="button"
                          onClick={() => {
                            closeCongressBallotBox(currentCongress.id, box.id);
                            showToast("success", `Đã khóa hòm phiếu ${box.title}.`);
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Khóa riêng hòm này"
                        >
                          <Lock size={11} />
                          <span>Khóa</span>
                        </button>
                      ) : (currentCongress.status === "CANDIDATE_APPROVED" || currentCongress.status === "VOTING" || currentCongress.status === "COUNTED" || box.status === "APPROVED" || box.status === "CLOSED") ? (
                        <button
                          type="button"
                          onClick={() => {
                            openCongressBallotBox(currentCongress.id, box.id);
                            showToast("success", `Đã mở hòm phiếu ${box.title} cho cử tri.`);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Mở riêng hòm này"
                        >
                          <Unlock size={11} />
                          <span>Mở</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Thiết lập số ghế cần bầu */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-900/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Số lượng cần bầu:</span>
                      <span className="text-[10px] text-slate-500">Bí thư tùy chỉnh số ghế</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateSeats(box.type, Math.max(1, box.maxWinners - 1))}
                        disabled={box.status !== "DRAFT" && box.status !== "WAITING_APPROVAL"}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm font-bold text-slate-900 w-6 text-center">
                        {box.maxWinners}
                      </span>
                      <button
                        onClick={() => handleUpdateSeats(box.type, box.maxWinners + 1)}
                        disabled={box.status !== "DRAFT" && box.status !== "WAITING_APPROVAL"}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cảnh báo nếu số ghế > 50% sĩ số lớp */}
                  {box.maxWinners > (classStudents.length * 0.5) && (
                    <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Số lượng bầu lớn hơn 50% sĩ số lớp. Hệ thống cảnh báo mềm nhưng không chặn.</span>
                    </div>
                  )}

                  {/* Danh sách ứng viên */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Ứng cử viên đề xuất ({box.candidates.length}/{box.maxWinners})</span>
                      <button
                        onClick={() => {
                          setCandidateSearch("");
                          setCandidateForm({ studentId: "", manifesto: "" });
                          setCandidateModal({ boxType: box.type });
                        }}
                        disabled={box.status === "CLOSED"}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 min-h-[36px] transition-all shadow-2xs"
                      >
                        <Plus size={14} />
                        <span>Đề xuất ứng viên</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {box.candidates.map(cand => (
                        <div key={cand.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-slate-900 block truncate">{cand.studentName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{cand.studentId}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              cand.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                              cand.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                              "bg-slate-200 text-slate-700"
                            }`}>
                              {cand.status}
                            </span>
                            {box.status !== "CLOSED" && (
                              <button
                                onClick={() => handleRemoveCandidate(box.type, cand.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  {box.candidates.length < box.maxWinners ? (
                    <span className="text-rose-600 font-semibold">Cần thêm tối thiểu {box.maxWinners - box.candidates.length} ứng viên nữa để gửi duyệt</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Đã đủ số lượng ứng viên để gửi CVHT duyệt</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      )}

      {/* MODAL THÊM ỨNG VIÊN */}
      {candidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Đề Xuất Ứng Cử Viên Mới ({candidateModal.boxType === "BCH_CHI_DOAN" ? "BCH Chi đoàn" : candidateModal.boxType === "BCH_CHI_HOI" ? "BCH Chi hội" : "Ban cán sự lớp"})
              </h3>
              <button 
                onClick={() => {
                  setCandidateModal(null);
                  setCandidateSearch("");
                  setCandidateForm({ studentId: "", manifesto: "" });
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Chọn sinh viên từ danh sách lớp {currentCongress.classId}:</label>
                
                {/* Thanh tìm kiếm sinh viên */}
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc MSSV..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all min-h-[40px]"
                  />
                  {candidateSearch && (
                    <button
                      type="button"
                      onClick={() => setCandidateSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown danh sách đã lọc */}
                <select
                  value={candidateForm.studentId}
                  onChange={(e) => setCandidateForm({ ...candidateForm, studentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-h-[44px]"
                >
                  <option value="">
                    {filteredNominationStudents.length === 0
                      ? "-- Không tìm thấy sinh viên nào --"
                      : candidateSearch.trim()
                        ? `-- Kết quả tìm kiếm (${filteredNominationStudents.length} sinh viên) --`
                        : "-- Chọn sinh viên ứng cử --"}
                  </option>
                  {filteredNominationStudents.map(s => (
                    <option key={s.id} value={s.id} disabled={s.isAlreadyNominated}>
                      {s.name} ({s.id}){s.isAlreadyNominated ? " - Đã ứng cử" : ""}
                    </option>
                  ))}
                </select>

                {/* Gợi ý chọn nhanh khi gõ tìm kiếm */}
                {candidateSearch.trim() && filteredNominationStudents.length > 0 && !candidateForm.studentId && (
                  <div className="mt-2 max-h-36 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-xl border border-slate-200/70">
                    {filteredNominationStudents.slice(0, 6).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={s.isAlreadyNominated}
                        onClick={() => setCandidateForm({ ...candidateForm, studentId: s.id })}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                          s.isAlreadyNominated
                            ? "opacity-40 cursor-not-allowed bg-slate-100"
                            : "hover:bg-indigo-50/80 bg-white border border-slate-100 cursor-pointer"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold text-slate-900 block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{s.id}</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 shrink-0">
                          {s.isAlreadyNominated ? "Đã có trong DS" : "Chọn"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Xác nhận sinh viên đã chọn */}
                {candidateForm.studentId && (() => {
                  const sel = classStudents.find(s => s.id === candidateForm.studentId);
                  return sel ? (
                    <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle size={15} className="text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-indigo-950 block truncate">{sel.name}</span>
                          <span className="text-[10px] text-indigo-600 font-mono">{sel.id}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCandidateForm({ ...candidateForm, studentId: "" })}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-white cursor-pointer shrink-0"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lời ngỏ / Chương trình hành động:</label>
                <textarea
                  rows={3}
                  value={candidateForm.manifesto}
                  onChange={(e) => setCandidateForm({ ...candidateForm, manifesto: e.target.value })}
                  placeholder="Mục tiêu hành động, phương hướng công tác nếu trúng cử..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setCandidateModal(null);
                  setCandidateSearch("");
                  setCandidateForm({ studentId: "", manifesto: "" });
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px] cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddCandidate}
                disabled={!candidateForm.studentId}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-40 min-h-[44px] cursor-pointer"
              >
                Xác Nhận Đề Xuất Ứng Viên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB XÉT DUYỆT & BỔ NHIỆM (CỐ VẤN HỌC TẬP - CVHT) */}
      {/* ========================================================= */}
      {activeTab === "ADVISER" && currentCongress && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Banner CVHT */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block mb-1">
                Không gian Cố vấn học tập (CVHT / GVCN)
              </span>
              <h2 className="text-lg font-bold text-white">
                Xét Duyệt Đề Án & Bổ Nhiệm Chức Danh Đại Hội {currentCongress.classId}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5 leading-relaxed">
                Thẩm quyền CVHT (GVCN): Phê duyệt danh sách ứng viên, quan sát kiểm phiếu, bổ nhiệm chức danh và ký xác nhận biên bản.
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-950/70 border border-blue-400/30 text-[11px] font-semibold text-amber-300">
                <ShieldCheck size={13} className="text-amber-400 shrink-0" />
                <span>Quy chuẩn: Quyền khóa và mở cho phép cử tri bầu cử thuộc về Bí thư Chi đoàn điều hành Đại hội.</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleApproveAllCandidates}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <CheckCircle size={15} />
                <span>Phê Duyệt Toàn Bộ Ứng Viên</span>
              </button>

              {(currentCongress.status === "CANDIDATE_APPROVED" || currentCongress.status === "WAITING_ADVISER_APPROVAL") && (
                <button
                  onClick={async () => {
                    const nextBoxes = currentCongress.ballotBoxes.map(b => ({ ...b, status: "DRAFT" as const }));
                    await saveClassCongress({
                      ...currentCongress,
                      status: "CANDIDATE_DRAFT",
                      ballotBoxes: nextBoxes
                    });
                    showToast("success", "Đã mở lại trạng thái để Bí thư Chi đoàn đề xuất ứng viên.");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/20 shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <Edit3 size={15} />
                  <span>Mở Lại Đề Xuất Cho Bí Thư</span>
                </button>
              )}
            </div>
          </div>

          {/* THANH THÔNG TIN & GÁN QUYỀN BÍ THƯ CHI ĐOÀN CHO CVHT */}
          {renderSecretaryAssignmentBar()}

          {/* KHỐI TIẾP NHẬN BIÊN BẢN CỦA CVHT */}
          {currentCongress.submittedAt && (
            <div className={`p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              currentCongress.adviserReceived 
                ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950" 
                : "bg-blue-50/80 border-blue-200/80 text-blue-950"
            }`}>
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    currentCongress.adviserReceived 
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                      : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}>
                    {currentCongress.adviserReceived ? "✓ ĐÃ TIẾP NHẬN BIÊN BẢN" : "📥 BIÊN BẢN MỚI TỪ BÍ THƯ"}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Gửi lúc {new Date(currentCongress.submittedAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {currentCongress.adviserReceived 
                    ? `CVHT đã xác nhận tiếp nhận biên bản Đại hội (${currentCongress.adviserReceivedBy || 'Cố vấn học tập'})`
                    : "Bí thư Chi đoàn đã gửi biên bản Đại hội đến Cố vấn học tập & Đoàn Phân hiệu"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentCongress.adviserReceived 
                    ? "Cố vấn học tập tiến hành bổ nhiệm chức danh và ký xác nhận biên bản chính thức để gửi lên BCH Đoàn Phân hiệu phê duyệt cuối."
                    : "Vui lòng bấm nút 'Tiếp nhận biên bản' để xác nhận đã nhận đầy đủ hồ sơ đại hội từ Bí thư Chi đoàn."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!currentCongress.adviserReceived ? (
                  <button
                    onClick={async () => {
                      await receiveCongressMinutesByAdviser(currentCongress.id);
                      showToast("success", "Cố vấn học tập đã xác nhận tiếp nhận biên bản Đại hội!");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <Inbox size={15} />
                    <span>Xác Nhận Tiếp Nhận Biên Bản</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab("MINUTES")}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <FileCheck size={15} />
                    <span>Xem & Ký Xác Nhận Biên Bản</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DUYỆT ỨNG VIÊN CHO TỪNG HÒM */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={18} className="text-indigo-600" />
              <span>Duyệt danh sách ứng cử viên 3 hòm phiếu</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {currentCongress.ballotBoxes.map((box) => (
                <div key={box.id} className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-900/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-900">{box.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        box.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {box.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {box.candidates.map(cand => (
                        <div key={cand.id} className="p-2 rounded-xl bg-white border border-slate-200/70 text-xs">
                          <span className="font-bold text-slate-900 block">{cand.studentName}</span>
                          <p className="text-[11px] text-slate-500 italic mt-0.5">"{cand.manifesto}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      onClick={() => setRejectModal({ boxType: box.type })}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Trả lại
                    </button>
                    <button
                      onClick={() => reviewCandidates(currentCongress.id, box.type, "APPROVE")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Duyệt hòm này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BỔ NHIỆM CHỨC DANH TỪ KẾT QUẢ BẦU CỬ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  <span>Bổ nhiệm chức danh sau khi kiểm phiếu</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  CVHT lựa chọn Bí thư, Phó Bí thư, Lớp trưởng... từ những người có số phiếu cao trúng cử.
                </p>
              </div>

              <button
                onClick={handleSaveAppointments}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <Check size={16} />
                <span>Lưu & Ban Hành Quyết Định</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* BCH Chi đoàn */}
              <div className="p-4 rounded-2xl bg-rose-50/40 ring-1 ring-rose-900/5 space-y-3">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
                  1. Chức danh BCH Chi đoàn
                </span>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Bí thư Chi đoàn:</label>
                    <select
                      value={appointmentsState["BI_THU_CHI_DOAN"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, BI_THU_CHI_DOAN: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BCH_CHI_DOAN")}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Phó Bí thư Chi đoàn:</label>
                    <select
                      value={appointmentsState["PHO_BI_THU_CHI_DOAN"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, PHO_BI_THU_CHI_DOAN: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BCH_CHI_DOAN")}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Ủy viên BCH Chi đoàn:</label>
                    <select
                      value={appointmentsState["UY_VIEN_BCH_CHI_DOAN"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, UY_VIEN_BCH_CHI_DOAN: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BCH_CHI_DOAN")}
                    </select>
                  </div>
                </div>
              </div>

              {/* BCH Chi hội */}
              <div className="p-4 rounded-2xl bg-blue-50/40 ring-1 ring-blue-900/5 space-y-3">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  2. Chức danh BCH Chi hội
                </span>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Chi hội trưởng:</label>
                    <select
                      value={appointmentsState["CHI_HOI_TRUONG"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, CHI_HOI_TRUONG: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BCH_CHI_HOI")}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Chi hội phó:</label>
                    <select
                      value={appointmentsState["CHI_HOI_PHO"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, CHI_HOI_PHO: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BCH_CHI_HOI")}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Ủy viên BCH Chi hội:</label>
                    <select
                      value={appointmentsState["UY_VIEN_BCH_CHI_HOI"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, UY_VIEN_BCH_CHI_HOI: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BCH_CHI_HOI")}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ban cán sự lớp */}
              <div className="p-4 rounded-2xl bg-purple-50/40 ring-1 ring-purple-900/5 space-y-3">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                  3. Chức danh Ban cán sự lớp
                </span>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Lớp trưởng:</label>
                    <select
                      value={appointmentsState["LOP_TRUONG"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, LOP_TRUONG: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BAN_CAN_SU")}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Lớp phó học tập:</label>
                    <select
                      value={appointmentsState["LOP_PHO_HOC_TAP"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, LOP_PHO_HOC_TAP: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BAN_CAN_SU")}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Lớp phó đời sống / phong trào:</label>
                    <select
                      value={appointmentsState["LOP_PHO_DOI_SONG_PHONG_TRAO"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, LOP_PHO_DOI_SONG_PHONG_TRAO: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      {renderAppointmentOptions("BAN_CAN_SU")}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRẢ LẠI DANH SÁCH ỨNG VIÊN KÈM Ý KIẾN */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-900">Trả lại danh sách ứng viên</h3>
            <p className="text-xs text-slate-500">
              Nhập ý kiến chỉ đạo để Bí thư Chi đoàn tiếp thu và hoàn thiện lại danh sách ứng cử viên.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do trả lại hoặc yêu cầu bổ sung nhân sự..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px] cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectCandidatesBox}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs min-h-[44px] cursor-pointer"
              >
                Xác Nhận Trả Lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB TIẾN ĐỘ TOÀN PHÂN HIỆU (ADMIN / ĐOÀN PHÂN HIỆU) */}
      {/* ========================================================= */}
      {activeTab === "CAMPAIGN_ADMIN" && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header Quản lý Chiến dịch */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                BCH Đoàn TNCS Hồ Chí Minh Phân hiệu Hà Giang
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Chiến dịch: {activeCampaign?.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trạng thái: <strong>{activeCampaign?.status}</strong> | Thời gian: {activeCampaign?.startDate} đến {activeCampaign?.endDate}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeCampaign?.status === "DRAFT" || activeCampaign?.status === "LOCKED" ? (
                <button
                  onClick={async () => {
                    const res = await lockAndDistributeCampaign(activeCampaign.id);
                    showToast("success", `Đã phát chiến dịch xuống ${res.createdCount} Chi đoàn!`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Send size={15} />
                  <span>Khóa Cấu Hình & Phát Xuống Chi Đoàn</span>
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const res = await lockAndDistributeCampaign(activeCampaign.id);
                    showToast("success", `Đã đồng bộ cập nhật chiến dịch xuống các Chi đoàn (${res.createdCount} lớp mới).`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <RefreshCw size={15} />
                  <span>Đồng Bộ Danh Sách Chi Đoàn</span>
                </button>
              )}
            </div>
          </div>

          {/* BẢNG TIẾN ĐỘ 28 CHI ĐOÀN */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bảng theo dõi tiến độ & Thẩm quyền Mở / Đóng Đại hội ({classCongresses.length} Chi đoàn)
                </h3>
                <p className="text-[11px] text-slate-500">
                  BCH Đoàn Phân hiệu nắm thẩm quyền cấp phép mở và đóng Đại hội cho từng hoặc toàn bộ Chi đoàn.
                </p>
              </div>

              {isAdminOrYouthUnion && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={async () => {
                      if (confirm(`Xác nhận CẤP PHÉP & MỞ ĐẠI HỘI cho toàn bộ ${classCongresses.length} Chi đoàn?`)) {
                        await setCongressYouthUnionPermission("ALL", "OPEN");
                        showToast("success", `Đoàn Phân hiệu đã cấp phép & mở Đại hội cho toàn bộ ${classCongresses.length} Chi đoàn!`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                  >
                    <Unlock size={13} />
                    <span>Mở Toàn Bộ Chi Đoàn</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm(`Xác nhận ĐÓNG / KHÓA toàn bộ Đại hội các Chi đoàn trong Phân hiệu? Hòm phiếu sẽ lập tức đóng.`)) {
                        await setCongressYouthUnionPermission("ALL", "CLOSE");
                        showToast("success", `Đoàn Phân hiệu đã đóng toàn bộ Đại hội các Chi đoàn!`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                  >
                    <Lock size={13} />
                    <span>Đóng Toàn Bộ Chi Đoàn</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Chi đoàn lớp</th>
                    <th className="p-3">Bí thư phụ trách</th>
                    <th className="p-3">Cấp phép ĐTN</th>
                    <th className="p-3">Tiến độ trạng thái</th>
                    <th className="p-3">Tiếp nhận BB (GVCN / ĐTN)</th>
                    <th className="p-3 text-right">Cử tri tham gia</th>
                    <th className="p-3 text-right">Chuẩn 2/3</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classCongresses.map(cong => {
                    const cStudents = students.filter(s => normalizeClassId(s.classId) === normalizeClassId(cong.classId));
                    const totalS = cStudents.length || 1;
                    const vCount = cong.voterIds.length;
                    const ratio = ((vCount / totalS) * 100).toFixed(1);
                    const meets23 = Number(ratio) >= 66.666;

                    return (
                      <tr key={cong.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{cong.classId}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {cong.secretaryStudentId || <span className="text-slate-400 italic">Chưa phân công</span>}
                        </td>
                        <td className="p-3">
                          {!cong.isYouthUnionApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock size={11} /> Chờ cấp phép
                            </span>
                          ) : cong.isYouthUnionClosed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <Lock size={11} /> Đã đóng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <ShieldCheck size={11} /> Đang mở
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cong.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                            cong.status === "SUBMITTED" ? "bg-blue-100 text-blue-800" :
                            cong.status === "VOTING" ? "bg-purple-100 text-purple-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {cong.status}
                          </span>
                        </td>
                        <td className="p-3 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-semibold w-10">GVCN:</span>
                            {cong.minutesSignedAt ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Đã ký
                              </span>
                            ) : cong.adviserReceived ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                ✓ Đã nhận
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">Chờ nhận</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-semibold w-10">ĐTN:</span>
                            {cong.status === "APPROVED" ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Chuẩn y
                              </span>
                            ) : cong.youthUnionReceived ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                ✓ Đã nhận
                              </span>
                            ) : cong.submittedAt ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                📥 Chờ nhận
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">Chưa gửi</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                          {vCount}/{totalS} ({ratio}%)
                        </td>
                        <td className="p-3 text-right">
                          {meets23 ? (
                            <span className="text-emerald-600 font-bold">✓ Đạt</span>
                          ) : (
                            <span className="text-amber-600 font-medium">⚠️ Chưa đạt</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {isAdminOrYouthUnion && (
                            (!cong.isYouthUnionApproved || cong.isYouthUnionClosed) ? (
                              <button
                                onClick={async () => {
                                  await setCongressYouthUnionPermission(cong.id, "OPEN");
                                  showToast("success", `Đoàn Phân hiệu đã cấp phép & mở Đại hội Chi đoàn ${cong.classId}!`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="Cấp phép & Mở Đại hội cho Chi đoàn này"
                              >
                                <Unlock size={11} />
                                <span>Mở ĐH</span>
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (confirm(`Xác nhận ĐÓNG Đại hội Chi đoàn "${cong.classId}"?`)) {
                                    await setCongressYouthUnionPermission(cong.id, "CLOSE");
                                    showToast("success", `Đoàn Phân hiệu đã đóng Đại hội Chi đoàn ${cong.classId}!`);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold cursor-pointer inline-flex items-center gap-1"
                                title="Đóng / Khóa Đại hội Chi đoàn này"
                              >
                                <Lock size={11} />
                                <span>Đóng ĐH</span>
                              </button>
                            )
                          )}
                          {isAdminOrYouthUnion && cong.submittedAt && !cong.youthUnionReceived && (
                            <button
                              onClick={async () => {
                                await receiveCongressMinutesByYouthUnion(cong.id);
                                showToast("success", `Đoàn Phân hiệu đã tiếp nhận biên bản Chi đoàn ${cong.classId}!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="Đoàn Phân hiệu tiếp nhận biên bản"
                            >
                              <Inbox size={11} />
                              <span>Nhận BB</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedClassId(cong.classId);
                              setActiveTab("MINUTES");
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                          >
                            Xem biên bản
                          </button>
                          {cong.status === "SUBMITTED" && (
                            <button
                              onClick={() => approveCongressFinal(cong.id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer inline-flex items-center gap-1"
                              title="BCH Đoàn Phân hiệu chuẩn y kết quả Đại hội"
                            >
                              <CheckCheck size={11} />
                              <span>Chuẩn y</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAB BIÊN BẢN ĐẠI HỘI & QUYẾT ĐỊNH (TẤT CẢ MỌI NGƯỜI) */}
      {/* ========================================================= */}
      {activeTab === "MINUTES" && currentCongress && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* LUỒNG GỬI VÀ TIẾP NHẬN BIÊN BẢN (2 ĐẦU NHẬN: GVCN & ĐOÀN THANH NIÊN) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
                  Quy trình gửi & tiếp nhận biên bản
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Biên Bản Đại Hội Chi Đoàn & Phê Duyệt Kết Quả
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bí thư Chi đoàn gửi biên bản đồng thời tới cả 2 đầu nhận: <strong>Cố vấn học tập (GVCN)</strong> và <strong>Đoàn Phân hiệu (ĐTN)</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handlePrintMinutes}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Printer size={15} />
                  <span>In / Xuất PDF</span>
                </button>

                {/* Nút gửi biên bản của Bí thư Chi đoàn */}
                {(isClassSecretary || isAdminOrYouthUnion) && (
                  <button
                    onClick={async () => {
                      await submitCongressMinutes(currentCongress.id);
                      showToast("success", "Đã gửi biên bản Đại hội tới Cố vấn học tập và Đoàn Phân hiệu!");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <Send size={15} />
                    <span>{currentCongress.submittedAt ? "Gửi Lại Bản Mới Cho GVCN & ĐTN" : "Gửi Biên Bản Cho GVCN & ĐTN"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3 Khối theo dõi: Phía Bí thư gửi + Phía GVCN nhận + Phía ĐTN nhận */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* 1. Phía Bí thư Chi đoàn */}
              <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-900/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <UserCheck size={13} className="text-indigo-600" />
                    Bí thư Chi đoàn gửi
                  </span>
                  {currentCongress.submittedAt ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Đã gửi
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      ⏳ Chưa gửi
                    </span>
                  )}
                </div>
                <p className="text-slate-600">
                  {currentCongress.submittedAt ? (
                    <>Gửi bởi: <strong>{currentCongress.submittedBy || "Bí thư Chi đoàn"}</strong> vào lúc {new Date(currentCongress.submittedAt).toLocaleString("vi-VN")}</>
                  ) : (
                    "Bí thư Chi đoàn hoàn tất đại hội rồi bấm gửi biên bản cho GVCN và Đoàn Phân hiệu."
                  )}
                </p>
              </div>

              {/* 2. Đầu nhận 1: GVCN / Cố vấn học tập */}
              <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-900/5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-blue-600" />
                      Đầu nhận: CVHT (GVCN)
                    </span>
                    {currentCongress.minutesSignedAt ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Đã ký duyệt
                      </span>
                    ) : currentCongress.adviserReceived ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        ✓ Đã tiếp nhận
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        ⏳ Chờ tiếp nhận
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">
                    {currentCongress.adviserReceived ? (
                      <>Tiếp nhận bởi: <strong>{currentCongress.adviserReceivedBy || "Cố vấn học tập"}</strong> ({new Date(currentCongress.adviserReceivedAt || "").toLocaleString("vi-VN")})</>
                    ) : (
                      "Cố vấn học tập nhận biên bản để thẩm định kết quả bầu cử và ký xác nhận."
                    )}
                  </p>
                </div>

                {/* Nút hành động cho GVCN */}
                {(isAdviser || isAdminOrYouthUnion) && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {!currentCongress.adviserReceived && (
                      <button
                        onClick={async () => {
                          await receiveCongressMinutesByAdviser(currentCongress.id);
                          showToast("success", "Cố vấn học tập đã xác nhận tiếp nhận biên bản!");
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer min-h-[38px]"
                      >
                        <Inbox size={14} />
                        <span>GVCN Tiếp Nhận Biên Bản</span>
                      </button>
                    )}

                    {!currentCongress.minutesSignedAt && (
                      <button
                        onClick={async () => {
                          if (!currentCongress.adviserReceived) {
                            await receiveCongressMinutesByAdviser(currentCongress.id);
                          }
                          await signCongressMinutes(currentCongress.id, currentUser?.name || "Cố vấn học tập", "Đã xác nhận kết quả bầu cử và danh sách bổ nhiệm chức danh.");
                          showToast("success", "Cố vấn học tập đã ký xác nhận biên bản!");
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer min-h-[38px]"
                      >
                        <FileCheck size={14} />
                        <span>GVCN Ký Xác Nhận Biên Bản</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Đầu nhận 2: Đoàn Thanh niên (Đoàn Phân hiệu) */}
              <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-900/5 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-rose-600" />
                      Đầu nhận: Đoàn Phân hiệu (ĐTN)
                    </span>
                    {currentCongress.status === "APPROVED" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Đã chuẩn y cuối
                      </span>
                    ) : currentCongress.youthUnionReceived ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        ✓ Đã tiếp nhận
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        ⏳ Chờ tiếp nhận
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">
                    {currentCongress.youthUnionReceived ? (
                      <>Tiếp nhận bởi: <strong>{currentCongress.youthUnionReceivedBy || "BCH Đoàn Phân hiệu"}</strong> ({new Date(currentCongress.youthUnionReceivedAt || "").toLocaleString("vi-VN")})</>
                    ) : (
                      "Đoàn TNCS Hồ Chí Minh Phân hiệu tiếp nhận biên bản để ra quyết định công nhận BCH Chi đoàn."
                    )}
                  </p>
                </div>

                {/* Nút hành động cho ĐTN */}
                {isAdminOrYouthUnion && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {!currentCongress.youthUnionReceived && (
                      <button
                        onClick={async () => {
                          await receiveCongressMinutesByYouthUnion(currentCongress.id);
                          showToast("success", "Đoàn Phân hiệu đã xác nhận tiếp nhận biên bản!");
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer min-h-[38px]"
                      >
                        <Inbox size={14} />
                        <span>ĐTN Tiếp Nhận Biên Bản</span>
                      </button>
                    )}

                    {currentCongress.status !== "APPROVED" && (
                      <button
                        onClick={async () => {
                          if (!currentCongress.youthUnionReceived) {
                            await receiveCongressMinutesByYouthUnion(currentCongress.id);
                          }
                          await approveCongressFinal(currentCongress.id);
                          showToast("success", "Đoàn Phân hiệu đã chuẩn y & phê duyệt kết quả Đại hội!");
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer min-h-[38px]"
                      >
                        <CheckCheck size={14} />
                        <span>Đoàn Phân Hiệu Chuẩn Y Cuối</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CSS IN BIÊN BẢN CHUẨN */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #congress-minutes-print-area, #congress-minutes-print-area * {
                visibility: visible !important;
              }
              #congress-minutes-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                background: white !important;
              }
            }
          `}</style>

          {/* MẪU BIÊN BẢN CHUẨN IN */}
          <div id="congress-minutes-print-area" className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-8 max-w-4xl mx-auto">
            {/* Quốc hiệu tiêu ngữ */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">ĐOÀN TNCS HỒ CHÍ MINH - HỘI SINH VIÊN VIỆT NAM</p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">BCH ĐOÀN PHÂN HIỆU ĐẠI HỌC THÁI NGUYÊN TẠI HÀ GIANG</p>
              <p className="text-xs font-semibold text-slate-600">CHI ĐOÀN {currentCongress.classId.toUpperCase()}</p>
              <div className="w-24 h-0.5 bg-slate-300 mx-auto my-2" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 pt-2 uppercase">
                BIÊN BẢN ĐẠI HỘI CHI ĐOÀN - CHI HỘI - BAN CÁN SỰ LỚP
              </h2>
              <p className="text-xs text-slate-500 italic">Nhiệm kỳ 2026 - 2027</p>
            </div>

            {/* Thông tin thời gian địa điểm cử tri */}
            <div className="text-xs text-slate-700 space-y-2 border-y border-slate-100 py-4">
              <p>• Thời gian: {new Date().toLocaleDateString("vi-VN")}</p>
              <p>• Chi đoàn lớp: <strong>{currentCongress.classId}</strong></p>
              <p>• Tổng số đoàn viên/sinh viên: <strong className="font-mono">{voterStats.total}</strong> đồng chí.</p>
              <p>• Số lượng cử tri tham gia bỏ phiếu: <strong className="font-mono">{voterStats.voted}</strong> đồng chí (Đạt tỷ lệ <strong className="font-mono">{voterStats.ratio}%</strong>).</p>
              <p>• Đánh giá quy chuẩn 2/3 cử tri: <strong>{voterStats.isTwoThirds ? "Đạt điều kiện 2/3" : "Chưa đạt 2/3 (Đã được CVHT chấp thuận tiếp tục)"}</strong>.</p>
            </div>

            {/* KẾT QUẢ KIỂM PHIẾU 3 HÒM */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                I. KẾT QUẢ BẦU CỬ 3 HÒM PHIẾU
              </h4>

              {(() => {
                const isVotingActive = currentCongress.status === "VOTING" || currentCongress.ballotBoxes.some(b => b.status === "OPEN" || b.status === "WAITING_APPROVAL" || b.status === "DRAFT");
                if (isVotingActive) {
                  return (
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200/80 text-center space-y-2 my-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                        <Lock size={20} />
                      </div>
                      <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Hòm phiếu đang mở / Chưa khóa sổ kiểm phiếu</h5>
                      <p className="text-xs text-amber-700 max-w-lg mx-auto">
                        Theo quy chế Đại hội Đoàn, hòm phiếu được niêm phong bảo mật trong suốt thời gian cử tri bỏ phiếu. Kết quả kiểm phiếu chi tiết và tỷ lệ trúng cử sẽ được tự động công bố sau khi Ban kiểm phiếu và Bí thư Chi đoàn thực hiện khóa hòm và kiểm phiếu.
                      </p>
                    </div>
                  );
                }

                return currentCongress.ballotBoxes.map((box, bIdx) => {
                  const candVoteCounts: { [candId: string]: number } = {};
                  box.candidates.forEach(c => { candVoteCounts[c.id] = 0; });
                  (box.votes || []).forEach(v => {
                    (v.selectedCandidateIds || []).forEach(cId => {
                      if (candVoteCounts[cId] !== undefined) candVoteCounts[cId]++;
                    });
                  });

                  const sortedCandidates = [...box.candidates].sort((a, b) => (candVoteCounts[b.id] || 0) - (candVoteCounts[a.id] || 0));
                  const totalBoxVotes = box.votes ? box.votes.length : 0;
                  const majorityThreshold = Math.floor(totalBoxVotes / 2) + 1;

                  return (
                    <div key={box.id} className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <p className="font-bold text-slate-800">
                          {bIdx + 1}. {box.title} (Số lượng cần bầu: {box.maxWinners})
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Số phiếu thu về: <strong className="font-mono text-slate-800">{totalBoxVotes}</strong> | Quá bán: <strong className="font-mono text-slate-800">&gt;{totalBoxVotes / 2}</strong> ({majorityThreshold} phiếu)
                        </p>
                      </div>
                      <table className="w-full text-xs text-left border border-slate-200">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2 border-r border-slate-200 w-12 text-center">STT</th>
                            <th className="p-2 border-r border-slate-200">Họ và tên ứng viên</th>
                            <th className="p-2 border-r border-slate-200 w-28">Mã sinh viên</th>
                            <th className="p-2 border-r border-slate-200 w-24 text-right">Số phiếu</th>
                            <th className="p-2 border-r border-slate-200 w-24 text-right">Tỷ lệ %</th>
                            <th className="p-2 w-28 text-center">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sortedCandidates.map((c, idx) => {
                            const votes = candVoteCounts[c.id] || 0;
                            const pct = totalBoxVotes > 0 ? ((votes / totalBoxVotes) * 100).toFixed(1) : "0.0";
                            const isElected = idx < box.maxWinners && totalBoxVotes > 0 && votes > (totalBoxVotes / 2);

                            return (
                              <tr key={c.id}>
                                <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold">{c.studentName}</td>
                                <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{c.studentId}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{votes}</td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono">{pct}%</td>
                                <td className="p-2 text-center font-semibold">
                                  {isElected ? <span className="text-emerald-600 font-bold">Trúng cử</span> : <span className="text-slate-400">Không trúng</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                });
              })()}
            </div>

            {/* QUYẾT ĐỊNH BỔ NHIỆM CHỨC DANH */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                II. DANH SÁCH BỔ NHIỆM CHỨC DANH CHÍNH THỨC
              </h4>

              {currentCongress.appointments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có quyết định bổ nhiệm chức danh nào được lưu.</p>
              ) : (
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Chức danh bổ nhiệm</th>
                      <th className="p-2 border-r border-slate-200">Họ và tên</th>
                      <th className="p-2 border-r border-slate-200">Mã SV</th>
                      <th className="p-2">Người ký bổ nhiệm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentCongress.appointments.map(app => (
                      <tr key={app.id}>
                        <td className="p-2 border-r border-slate-200 font-bold text-indigo-900">
                          {APPOINTMENT_ROLE_LABELS[app.role] || app.role}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-semibold">{app.studentName}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{app.studentId}</td>
                        <td className="p-2 text-slate-600">{app.appointedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* CHỮ KÝ XÁC NHẬN */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800">
              <div className="space-y-12">
                <div>
                  <p className="font-bold uppercase">BÍ THƯ CHI ĐOÀN</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <p className="font-bold text-slate-900">{secretaryDisplayName}</p>
              </div>

              <div className="space-y-12">
                <div>
                  <p className="font-bold uppercase">CỐ VẤN HỌC TẬP</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký và xác nhận biên bản)</p>
                </div>
                <p className="font-bold text-slate-900">{adviserDisplayName}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
