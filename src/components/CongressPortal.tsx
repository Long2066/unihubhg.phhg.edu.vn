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
  GraduationCap
} from "lucide-react";

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
    approveCongressFinal
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
    if (!currentUser || !currentCongress) return false;
    const normCurrentClass = normalizeClassId(currentCongress.classId);
    const secClass = currentUser.classSecretaryForClassId ? normalizeClassId(currentUser.classSecretaryForClassId) : "";
    const curId = (currentUser.targetId || currentUser.username || "").toLowerCase();
    const secId = (currentCongress.secretaryStudentId || "").toLowerCase();
    return Boolean(
      (secClass && secClass === normCurrentClass) ||
      (secId && secId === curId) ||
      currentUser.role === UserRole.ADMIN
    );
  }, [currentUser, currentCongress]);

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

  const showToast = (type: "success" | "error", message: string) => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const currentVoterId = currentUser?.targetId || currentUser?.username || "";

  // Hash kiểm tra đã bầu
  const hasVotedForBox = (box: BallotBox) => {
    if (!currentCongress || !currentVoterId) return false;
    const expectedHash = btoa(`${currentCongress.campaignId}_${currentCongress.classId}_${box.id}_${currentVoterId.trim().toUpperCase()}`);
    return box.votes.some(v => v.voterHash === expectedHash);
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
  const [candidateForm, setCandidateForm] = useState<{ studentId: string; manifesto: string }>({
    studentId: "",
    manifesto: ""
  });

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

        {(isClassSecretary || isAdminOrYouthUnion || isAdviser) && (
          <button
            onClick={() => setActiveTab("SECRETARY")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer whitespace-nowrap ${
              activeTab === "SECRETARY" 
                ? "bg-indigo-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Đề Xuất Nhân Sự (Bí Thư)</span>
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
          {currentCongress.status !== "VOTING" && currentCongress.status !== "COUNTED" && currentCongress.status !== "APPOINTED" && currentCongress.status !== "APPROVED" && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Giai đoạn: Bí thư Chi đoàn lập danh sách & đề xuất nhân sự bầu cử
                  </h4>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    Bí thư Chi đoàn đang thực hiện đề xuất danh sách ứng cử viên 3 hòm phiếu (BCH Chi đoàn, BCH Chi hội, Ban cán sự) và gửi Cố vấn học tập (CVHT) phê duyệt. Hòm phiếu sẽ mở sau khi hoàn tất phê chuẩn.
                  </p>
                </div>
              </div>
              {(isClassSecretary || isAdminOrYouthUnion || isAdviser) && (
                <button
                  onClick={() => setActiveTab("SECRETARY")}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-xs whitespace-nowrap min-h-[44px] cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <UserCheck size={15} />
                  <span>Vào Đề Xuất Nhân Sự Ngay</span>
                </button>
              )}
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
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        box.type === "BCH_CHI_DOAN" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/10" :
                        box.type === "BCH_CHI_HOI" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/10" :
                        "bg-purple-50 text-purple-700 ring-1 ring-purple-600/10"
                      }`}>
                        {box.type === "BCH_CHI_DOAN" ? "BCH Chi đoàn" : box.type === "BCH_CHI_HOI" ? "BCH Chi hội" : "Ban cán sự lớp"}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOpen ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10" : "bg-slate-100 text-slate-500"
                      }`}>
                        {isOpen ? "Đang mở" : box.status}
                      </span>
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
      {/* 2. TAB ĐỀ XUẤT NHÂN SỰ & QUẢN TRỊ (BÍ THƯ CHI ĐOÀN) */}
      {/* ========================================================= */}
      {activeTab === "SECRETARY" && currentCongress && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Banner Bí thư Chi đoàn */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1">
                ⭐ Quyền Bí thư Chi đoàn • Đề xuất nhân sự ứng cử
              </span>
              <h2 className="text-lg font-bold text-white">
                Đề Xuất Nhân Sự Bầu Cử Đại Hội Chi Đoàn {currentCongress.classId}
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Quyền hạn Bí thư: Thiết lập số lượng cần bầu, đề xuất danh sách ứng cử viên 3 hòm phiếu (BCH Chi đoàn, BCH Chi hội, Ban cán sự lớp) và gửi Cố vấn học tập (CVHT) phê duyệt.
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
                  onClick={() => openCongressBallotBox(currentCongress.id)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Unlock size={15} />
                  <span>Mở Hòm Phiếu Bầu Cử</span>
                </button>
              ) : currentCongress.status === "VOTING" ? (
                <button
                  onClick={() => closeCongressBallotBox(currentCongress.id)}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Lock size={15} />
                  <span>Khóa Hòm Phiếu & Kiểm Phiếu</span>
                </button>
              ) : currentCongress.status === "MINUTES_SIGNED" ? (
                <button
                  onClick={() => submitCongressToAdmin(currentCongress.id)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Send size={15} />
                  <span>Gửi Biên Bản Lên Phân Hiệu</span>
                </button>
              ) : null}

              {/* Nút mở lại soạn thảo để đề xuất nhân sự nếu cần */}
              {(currentCongress.status === "VOTING" || currentCongress.status === "CANDIDATE_APPROVED") && (
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

          {/* THANH THÔNG TIN & GÁN QUYỀN BÍ THƯ CHI ĐOÀN */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bí thư Chi đoàn lớp hiện tại</span>
                <span className="font-bold text-slate-900">
                  {currentSecretaryStudent ? `${currentSecretaryStudent.name} (${currentSecretaryStudent.id})` : (currentCongress.secretaryStudentId || "Chưa chỉ định Bí thư")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Nếu là Admin hoặc CVHT: Dropdown chỉ định Bí thư */}
              {(isAdminOrYouthUnion || isAdviser) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">Chỉ định Bí thư:</span>
                  <select
                    onChange={async (e) => {
                      if (e.target.value) {
                        await assignClassSecretary(e.target.value, currentCongress.classId);
                        showToast("success", `Đã chỉ định sinh viên làm Bí thư Chi đoàn ${currentCongress.classId}.`);
                      }
                    }}
                    defaultValue=""
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-h-[38px]"
                  >
                    <option value="" disabled>-- Chọn sinh viên làm Bí thư --</option>
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
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
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
                >
                  <ShieldCheck size={14} />
                  <span>Kích hoạt quyền Bí thư của tôi</span>
                </button>
              )}
            </div>
          </div>

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
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {box.status}
                    </span>
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
                        onClick={() => setCandidateModal({ boxType: box.type })}
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
                onClick={() => setCandidateModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn sinh viên từ danh sách lớp {currentCongress.classId}:</label>
                <select
                  value={candidateForm.studentId}
                  onChange={(e) => setCandidateForm({ ...candidateForm, studentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-h-[44px]"
                >
                  <option value="">-- Chọn sinh viên ứng cử --</option>
                  {classStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
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
                onClick={() => setCandidateModal(null)}
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
                Không gian Cố vấn học tập (CVHT)
              </span>
              <h2 className="text-lg font-bold text-white">
                Xét duyệt & Bổ nhiệm chức danh Đại hội {currentCongress.classId}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Phê duyệt danh sách ứng viên, giám sát kiểm phiếu, bổ nhiệm chức danh và ký xác nhận biên bản.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleApproveAllCandidates}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <CheckCircle size={15} />
                <span>Phê Duyệt Toàn Bộ Ứng Viên</span>
              </button>
            </div>
          </div>

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
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Phó Bí thư Chi đoàn:</label>
                    <select
                      value={appointmentsState["PHO_BI_THU_CHI_DOAN"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, PHO_BI_THU_CHI_DOAN: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Ủy viên BCH Chi đoàn:</label>
                    <select
                      value={appointmentsState["UY_VIEN_BCH_CHI_DOAN"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, UY_VIEN_BCH_CHI_DOAN: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
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
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Chi hội phó:</label>
                    <select
                      value={appointmentsState["CHI_HOI_PHO"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, CHI_HOI_PHO: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Ủy viên BCH Chi hội:</label>
                    <select
                      value={appointmentsState["UY_VIEN_BCH_CHI_HOI"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, UY_VIEN_BCH_CHI_HOI: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
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
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Lớp phó học tập:</label>
                    <select
                      value={appointmentsState["LOP_PHO_HOC_TAP"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, LOP_PHO_HOC_TAP: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Lớp phó đời sống / phong trào:</label>
                    <select
                      value={appointmentsState["LOP_PHO_DOI_SONG_PHONG_TRAO"] || ""}
                      onChange={(e) => setAppointmentsState({ ...appointmentsState, LOP_PHO_DOI_SONG_PHONG_TRAO: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                    >
                      <option value="">-- Chọn nhân sự trúng cử --</option>
                      {classStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
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
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">
                Bảng theo dõi tiến độ Đại hội các Chi đoàn ({classCongresses.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Chi đoàn lớp</th>
                    <th className="p-3">Bí thư phụ trách</th>
                    <th className="p-3">Tiến độ trạng thái</th>
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
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cong.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                            cong.status === "SUBMITTED" ? "bg-blue-100 text-blue-800" :
                            cong.status === "VOTING" ? "bg-purple-100 text-purple-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {cong.status}
                          </span>
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
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                            >
                              Duyệt cuối
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
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Biên bản Đại hội Chi đoàn điện tử
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrintMinutes}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Printer size={15} />
                <span>In / Xuất Biên Bản</span>
              </button>

              {isAdviser && currentCongress.status !== "MINUTES_SIGNED" && currentCongress.status !== "SUBMITTED" && currentCongress.status !== "APPROVED" && (
                <button
                  onClick={() => signCongressMinutes(currentCongress.id, currentUser?.name || "Cố vấn học tập", "Đã xác nhận kết quả bầu cử và danh sách bổ nhiệm chức danh.")}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <CheckCircle size={15} />
                  <span>CVHT Ký Xác Nhận Biên Bản</span>
                </button>
              )}
            </div>
          </div>

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

              {currentCongress.ballotBoxes.map((box, bIdx) => {
                // Đếm số phiếu cho từng ứng viên
                const candVoteCounts: { [candId: string]: number } = {};
                box.candidates.forEach(c => { candVoteCounts[c.id] = 0; });
                box.votes.forEach(v => {
                  v.selectedCandidateIds.forEach(cId => {
                    if (candVoteCounts[cId] !== undefined) candVoteCounts[cId]++;
                  });
                });

                const sortedCandidates = [...box.candidates].sort((a, b) => (candVoteCounts[b.id] || 0) - (candVoteCounts[a.id] || 0));

                return (
                  <div key={box.id} className="space-y-2">
                    <p className="text-xs font-bold text-slate-800">
                      {bIdx + 1}. {box.title} (Số lượng cần bầu: {box.maxWinners})
                    </p>
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
                          const totalV = box.votes.length || 1;
                          const pct = ((votes / totalV) * 100).toFixed(1);
                          const isElected = idx < box.maxWinners;

                          return (
                            <tr key={c.id}>
                              <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                              <td className="p-2 border-r border-slate-200 font-semibold">{c.studentName}</td>
                              <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{c.studentId}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">{votes}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-mono">{pct}%</td>
                              <td className="p-2 text-center font-semibold">
                                {isElected ? <span className="text-emerald-600">Trúng cử</span> : <span className="text-slate-400">Không trúng</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
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
                        <td className="p-2 border-r border-slate-200 font-bold text-indigo-900">{app.role}</td>
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
                <p className="font-bold text-slate-900">{currentCongress.secretaryStudentId || "Ma Văn Long"}</p>
              </div>

              <div className="space-y-12">
                <div>
                  <p className="font-bold uppercase">CỐ VẤN HỌC TẬP</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký và xác nhận biên bản)</p>
                </div>
                <p className="font-bold text-slate-900">{currentCongress.minutesSignedBy || "Hoàng Minh Đức"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
