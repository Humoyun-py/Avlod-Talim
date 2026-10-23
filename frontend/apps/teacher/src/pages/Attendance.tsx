import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertCircle,
  Check,
  RefreshCw,
  Calendar,
  Users2,
  MapPin,
  ShieldCheck,
  Info,
  Coins,
  Award,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Play,
  Flame,
  BookOpen,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Lesson, Student, AttendanceStatus, AttendanceRecord, Group } from '../types';
import { useAuth } from '../context/AuthContext';
import { AwardCoinsModal } from '../components/modals/AwardCoinsModal';
import { StudentCoinHistoryModal } from '../components/modals/StudentCoinHistoryModal';
import { CompleteLessonModal } from '../components/modals/CompleteLessonModal';

interface StudentAttendanceItem {
  status: AttendanceStatus | null;
  lateMinutes: number;
  notes: string;
}

export const Attendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Selection states: Group first, then Lesson & Darsni boshlash
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, StudentAttendanceItem>>({});
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isStartingLesson, setIsStartingLesson] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [autoAwardCoins, setAutoAwardCoins] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Coin Reward Modals State
  const [coinModalStudent, setCoinModalStudent] = useState<Student | null>(null);
  const [historyModalStudent, setHistoryModalStudent] = useState<Student | null>(null);
  const [coinRewardAlert, setCoinRewardAlert] = useState<{
    studentName: string;
    amount: number;
    newBalance: number;
    reason: string;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [allGroups, allLessons] = await Promise.all([
        teacherService.getGroups(),
        teacherService.getSchedule(),
      ]);
      setGroups(allGroups);
      setLessons(allLessons);

      const qLessonId = searchParams.get('lessonId');
      const qGroupId = searchParams.get('groupId');

      if (qLessonId) {
        const foundLesson = allLessons.find((l) => l.id === qLessonId);
        if (foundLesson) {
          setSelectedGroupId(foundLesson.group_id);
          setSelectedLessonId(foundLesson.id);
          await loadLessonStudentsAndAttendance(foundLesson.id, allLessons, foundLesson.group_id);
          return;
        }
      }

      if (qGroupId && allGroups.some((g) => g.id === qGroupId)) {
        setSelectedGroupId(qGroupId);
        const groupLessons = allLessons.filter((l) => l.group_id === qGroupId);
        const activeOrPlanned =
          groupLessons.find((l) => l.status === 'in_progress') ||
          groupLessons.find((l) => l.status === 'planned') ||
          groupLessons[0];

        if (activeOrPlanned) {
          setSelectedLessonId(activeOrPlanned.id);
          await loadLessonStudentsAndAttendance(activeOrPlanned.id, allLessons, qGroupId);
        } else {
          // Load students directly
          const groupStudents = await teacherService.getStudents(qGroupId);
          setStudents(groupStudents);
          initEmptyAttendance(groupStudents);
        }
      } else {
        // Nothing selected by default
        setSelectedGroupId('');
        setSelectedLessonId('');
        setStudents([]);
        setAttendanceState({});
        setExistingRecords([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initEmptyAttendance = (studentList: Student[]) => {
    const initialMap: Record<string, StudentAttendanceItem> = {};
    // Every student starts completely blank / unselected (status: null)
    studentList.forEach((student) => {
      initialMap[student.id] = {
        status: null,
        lateMinutes: 5,
        notes: '',
      };
    });
    setAttendanceState(initialMap);
  };

  const loadLessonStudentsAndAttendance = async (
    lessonId: string,
    lessonList = lessons,
    groupId = selectedGroupId
  ) => {
    const lesson = lessonList.find((l) => l.id === lessonId);
    const targetGroupId = lesson?.group_id || groupId;
    if (!targetGroupId) return;

    setIsLoading(true);
    try {
      const [groupStudents, existing] = await Promise.all([
        teacherService.getStudents(targetGroupId),
        lessonId ? teacherService.getLessonAttendance(lessonId) : Promise.resolve([]),
      ]);

      setStudents(groupStudents);
      setExistingRecords(existing);

      // User requirement: Davomat keyingi darsgacha turishi kerak.
      // Agar ushbu dars uchun davomat avval saqlangan bo'lsa (existing > 0), o'sha saqlangan davomat ko'rinib turadi!
      // Agar yangi dars bo'lsa (existing == 0), barcha talabalar tanlanmagan (status: null) bo'lib ochiladi.
      if (existing && existing.length > 0) {
        const restoredMap: Record<string, StudentAttendanceItem> = {};
        groupStudents.forEach((student) => {
          const found = existing.find((e) => e.student_id === student.id);
          if (found) {
            restoredMap[student.id] = {
              status: found.status,
              lateMinutes: found.late_minutes ?? 5,
              notes: found.notes || '',
            };
          } else {
            restoredMap[student.id] = {
              status: null,
              lateMinutes: 5,
              notes: '',
            };
          }
        });
        setAttendanceState(restoredMap);
      } else {
        initEmptyAttendance(groupStudents);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group selector change
  const handleGroupChange = async (groupId: string) => {
    setSelectedGroupId(groupId);
    setSuccessMessage(null);
    setErrorMessage(null);
    setCoinRewardAlert(null);

    if (!groupId) {
      setSelectedLessonId('');
      setStudents([]);
      setAttendanceState({});
      setExistingRecords([]);
      return;
    }

    const groupLessons = lessons.filter((l) => l.group_id === groupId);
    const activeOrPlanned =
      groupLessons.find((l) => l.status === 'in_progress') ||
      groupLessons.find((l) => l.status === 'planned') ||
      groupLessons[0];

    if (activeOrPlanned) {
      setSelectedLessonId(activeOrPlanned.id);
      await loadLessonStudentsAndAttendance(activeOrPlanned.id, lessons, groupId);
    } else {
      setSelectedLessonId('');
      const groupStudents = await teacherService.getStudents(groupId);
      setStudents(groupStudents);
      initEmptyAttendance(groupStudents);
      setExistingRecords([]);
    }
  };

  // Specific lesson selector change within the selected group
  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setSuccessMessage(null);
    setErrorMessage(null);
    setCoinRewardAlert(null);
    if (lessonId) {
      loadLessonStudentsAndAttendance(lessonId);
    }
  };

  // "Darsni boshlash" (Start Lesson) action
  const handleStartLesson = async () => {
    if (!selectedGroupId) {
      setErrorMessage('Iltimos, avval guruhni tanlang.');
      return;
    }

    setIsStartingLesson(true);
    setErrorMessage(null);

    try {
      const targetLessonId = selectedLessonId;
      if (!targetLessonId) throw new Error('Davomat olishdan oldin jadvaldagi darsni tanlang.');
      const updatedLesson = lessons.find(l => l.id === targetLessonId);
      if (!updatedLesson) throw new Error('Tanlangan dars topilmadi.');

      // Refresh schedule
      const updatedSchedule = await teacherService.getSchedule();
      setLessons(updatedSchedule);
      setSelectedLessonId(updatedLesson.id);

      setSuccessMessage(
        `Guruh: "${updatedLesson.group_name}". Davomatni yuborish uchun tanlangan dars ishlatiladi.`
      );

      // Load group students with unselected status
      await loadLessonStudentsAndAttendance(updatedLesson.id, updatedSchedule, selectedGroupId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Darsni boshlashda xatolik yuz berdi.');
    } finally {
      setIsStartingLesson(false);
    }
  };

  // "Keyingi darsni boshlash" - creates/starts the next lesson and gives clean unselected attendance
  const handleStartNextLesson = async () => {
    if (!selectedGroupId) {
      setErrorMessage('Iltimos, avval guruhni tanlang.');
      return;
    }

    setIsStartingLesson(true);
    setErrorMessage(null);

    try {
      throw new Error('Yangi darsni boshlash endpointi mavjud emas. Direktor yoki administrator darsni jadvalga qo‘shishi kerak.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Keyingi darsni boshlashda xatolik yuz berdi.');
    } finally {
      setIsStartingLesson(false);
    }
  };

  // "Darsni tugatish" (Complete Lesson) handler
  const handleLessonCompleted = async (updatedLesson: Lesson) => {
    setIsCompleteModalOpen(false);
    const updatedSchedule = await teacherService.getSchedule();
    setLessons(updatedSchedule);
    setSelectedLessonId(updatedLesson.id);
    setSuccessMessage(
      `Dars muvaffaqiyatli tugatildi! Dars hisoboti O‘quv bo‘limiga yuborildi va davomat keyingi darsgacha saqlanib turadi.`
    );
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => {
      const current = prev[studentId]?.status;
      const nextStatus = current === status ? null : status;
      return {
        ...prev,
        [studentId]: {
          status: nextStatus,
          lateMinutes: prev[studentId]?.lateMinutes ?? 5,
          notes: prev[studentId]?.notes || '',
        },
      };
    });
  };

  const handleLateMinutesChange = (studentId: string, minutes: number) => {
    const validMinutes = isNaN(minutes) ? 1 : Math.max(1, Math.min(180, minutes));
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: 'late',
        lateMinutes: validMinutes,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, StudentAttendanceItem> = {};
    students.forEach((s) => {
      updated[s.id] = {
        status,
        lateMinutes: attendanceState[s.id]?.lateMinutes ?? 5,
        notes: attendanceState[s.id]?.notes || '',
      };
    });
    setAttendanceState(updated);
  };

  const handleClearAll = () => {
    const updated: Record<string, StudentAttendanceItem> = {};
    students.forEach((s) => {
      updated[s.id] = {
        status: null,
        lateMinutes: 5,
        notes: attendanceState[s.id]?.notes || '',
      };
    });
    setAttendanceState(updated);
  };

  const handleRestoreExisting = () => {
    if (existingRecords.length === 0) return;
    const restoredMap: Record<string, StudentAttendanceItem> = {};
    students.forEach((s) => {
      const found = existingRecords.find((e) => e.student_id === s.id);
      if (found) {
        restoredMap[s.id] = {
          status: found.status,
          lateMinutes: found.late_minutes ?? 5,
          notes: found.notes || '',
        };
      } else {
        restoredMap[s.id] = { status: null, lateMinutes: 5, notes: '' };
      }
    });
    setAttendanceState(restoredMap);
    setSuccessMessage('Oldingi saqlangan davomat yozuvlari tiklandi.');
  };

  // Coin Reward Calculation Rule:
  // - Bor (present): 2 coins
  // - Kechikdi <= 5 daqiqa: 2 coins
  // - Kechikdi > 5 daqiqa: 1 coin
  // - Yo'q / Sababli: 0 coins
  const getStudentCoinPreview = (status: AttendanceStatus | null, lateMinutes: number = 5) => {
    if (status === 'present') {
      return {
        amount: 2,
        label: '+2 coin',
        subtext: 'Darsga o‘z vaqtida keldi',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (status === 'late') {
      if (lateMinutes <= 5) {
        return {
          amount: 2,
          label: '+2 coin',
          subtext: `${lateMinutes} daq kechikdi (≤5 daq)`,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      }
      return {
        amount: 1,
        label: '+1 coin',
        subtext: `${lateMinutes} daq kechikdi (>5 daq)`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (status === 'absent') {
      return {
        amount: 0,
        label: '0 coin',
        subtext: 'Darsda yo‘q',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    if (status === 'excused') {
      return {
        amount: 0,
        label: '0 coin',
        subtext: 'Sababli',
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      };
    }
    return {
      amount: 0,
      label: '—',
      subtext: 'Tanlanmagan',
      badgeClass: 'bg-slate-50 text-slate-400 border-dashed border-slate-200',
    };
  };

  const handleCoinAwarded = (
    studentId: string,
    newBalance: number,
    amountAwarded: number,
    reason: string
  ) => {
    const updatedStudent = students.find((s) => s.id === studentId);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, coins_balance: newBalance } : s))
    );

    setCoinRewardAlert({
      studentName: updatedStudent?.full_name || 'Talaba',
      amount: amountAwarded,
      newBalance,
      reason,
    });
  };

  const handleBalanceUpdatedInModal = (studentId: string, newBalance: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, coins_balance: newBalance } : s))
    );
  };

  const handleSubmitAttendance = async () => {
    if (!selectedLessonId) {
      setErrorMessage('Davomatni saqlash uchun dars mavjud bo‘lishi lozim.');
      return;
    }

    const unmarked = students.filter((s) => !attendanceState[s.id]?.status);
    if (unmarked.length > 0) {
      setErrorMessage(
        `Diqqat: ${unmarked.length} nafar talabaning davomati hali belgilanmagan. Iltimos, barcha talabalar holatini belgilang yoki "Barchani Bor qilish" tugmasidan foydalaning.`
      );
      return;
    }

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = students.map((s) => ({
      student_id: s.id,
      status: (attendanceState[s.id]?.status || 'present') as AttendanceStatus,
      late_minutes: attendanceState[s.id]?.lateMinutes ?? 5,
      notes: attendanceState[s.id]?.notes,
      auto_reward_coins: autoAwardCoins,
    }));

    try {
      const res = await teacherService.submitLessonAttendance(selectedLessonId, payload);
      setIsSubmitting(false);

      // Refresh students to reflect newly awarded coins
      const updatedStudents = await teacherService.getStudents(selectedGroupId);
      setStudents(updatedStudents);

      let msg = `Davomat muvaffaqiyatli saqlandi! (${res.count} nafar talaba bo‘yicha qayd etildi).`;
      if (autoAwardCoins && res.totalCoinsAwarded > 0) {
        msg += ` Qoidaga muvofiq: ${res.rewardsCount} nafar talabaga jami +${res.totalCoinsAwarded} ta coin taqsimlandi.`;
      }
      setSuccessMessage(msg);
      const updatedExisting = await teacherService.getLessonAttendance(selectedLessonId);
      setExistingRecords(updatedExisting);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Davomatni saqlashda xatolik yuz berdi.');
    }
  };

  const currentGroup = groups.find((g) => g.id === selectedGroupId);
  const groupLessons = lessons.filter((l) => l.group_id === selectedGroupId);
  const currentLesson = lessons.find((l) => l.id === selectedLessonId);

  // Summary counts and Coin distribution statistics
  const summaryCounts = {
    present: Object.values(attendanceState).filter((s) => s.status === 'present').length,
    absent: Object.values(attendanceState).filter((s) => s.status === 'absent').length,
    late: Object.values(attendanceState).filter((s) => s.status === 'late').length,
    excused: Object.values(attendanceState).filter((s) => s.status === 'excused').length,
    unmarked: students.filter((s) => !attendanceState[s.id]?.status).length,
  };

  const rewardSummary = {
    presentCount: students.filter((s) => attendanceState[s.id]?.status === 'present').length,
    presentCoins: students.filter((s) => attendanceState[s.id]?.status === 'present').length * 2,
    lateUnder5Count: students.filter(
      (s) => attendanceState[s.id]?.status === 'late' && (attendanceState[s.id]?.lateMinutes ?? 5) <= 5
    ).length,
    lateUnder5Coins:
      students.filter(
        (s) => attendanceState[s.id]?.status === 'late' && (attendanceState[s.id]?.lateMinutes ?? 5) <= 5
      ).length * 2,
    lateOver5Count: students.filter(
      (s) => attendanceState[s.id]?.status === 'late' && (attendanceState[s.id]?.lateMinutes ?? 5) > 5
    ).length,
    lateOver5Coins:
      students.filter(
        (s) => attendanceState[s.id]?.status === 'late' && (attendanceState[s.id]?.lateMinutes ?? 5) > 5
      ).length * 1,
    absentCount: summaryCounts.absent,
    excusedCount: summaryCounts.excused,
    unmarkedCount: summaryCounts.unmarked,
  };

  const totalCalculatedCoins =
    rewardSummary.presentCoins + rewardSummary.lateUnder5Coins + rewardSummary.lateOver5Coins;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Coin Reward Modal */}
      <AwardCoinsModal
        student={coinModalStudent}
        lesson={currentLesson}
        isOpen={!!coinModalStudent}
        onClose={() => setCoinModalStudent(null)}
        onAwarded={handleCoinAwarded}
      />

      {/* Student Coin History & Shop Preview Modal */}
      <StudentCoinHistoryModal
        student={historyModalStudent}
        isOpen={!!historyModalStudent}
        onClose={() => setHistoryModalStudent(null)}
        onBalanceUpdated={handleBalanceUpdatedInModal}
      />

      {/* Complete Lesson Modal (Darsni tugatish) */}
      <CompleteLessonModal
        lesson={currentLesson || null}
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onCompleted={handleLessonCompleted}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Davomat va Dars nazorati
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guruhni tanlang, darsni boshlang hamda talabalarga qoidaga muvofiq coinlar taqsimlang
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>O‘qituvchi: {user?.full_name}</span>
        </div>
      </div>

      {/* Group & Lesson Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Step 1: Select Group */}
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>1. Guruhni tanlang:</span>
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-cyan-500 shadow-xs cursor-pointer"
          >
            <option value="">-- Guruhni tanlang ({groups.length} ta guruh) --</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} · {group.course_name} ({group.student_count} nafar talaba)
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Lesson within Group */}
        {selectedGroupId && groupLessons.length > 0 && (
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              <span>2. Darsni tanlang:</span>
            </label>
            <select
              value={selectedLessonId}
              onChange={(e) => handleLessonChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-semibold focus:outline-hidden focus:ring-1 focus:ring-cyan-500 shadow-xs cursor-pointer"
            >
              {groupLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.date} · {l.start_time}-{l.end_time} · {l.topic || 'Dars'} (
                  {l.status === 'in_progress'
                    ? '🟢 Dars faol'
                    : l.status === 'planned'
                    ? 'Rejalashtirilgan'
                    : 'Yakunlangan'}
                  )
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lesson meta badges if selected */}
        {currentLesson && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span className="font-mono">
                {currentLesson.start_time} - {currentLesson.end_time}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              <span>{currentLesson.room}</span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Coin Reward Banner */}
      {coinRewardAlert && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Talaba {coinRewardAlert.studentName} ga +{coinRewardAlert.amount} coin berildi!
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Sabab: {coinRewardAlert.reason} · Yangi balans:{' '}
                <strong className="font-mono">{coinRewardAlert.newBalance} coin</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCoinRewardAlert(null)}
            className="text-amber-700 hover:text-amber-950 text-xs font-bold px-2 py-1 cursor-pointer"
          >
            Yopish
          </button>
        </div>
      )}

      {/* CASE 1: No Group Selected */}
      {!selectedGroupId ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Users2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Guruh tanlanmagan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            Darsni boshlash va talabalar davomatini olish uchun yuqoridagi{' '}
            <strong>&quot;1. Guruhni tanlang&quot;</strong> menyusidan guruhni tanlang.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 bg-cyan-50 px-3.5 py-1.5 rounded-lg border border-cyan-200">
            <span>Yuqoridagi ro‘yxatdan guruhni tanlang</span>
          </div>
        </div>
      ) : (
        <>
          {/* STEP: Darsni Boshlash (Start Lesson) Card / In-Progress Indicator */}
          {(!currentLesson || currentLesson.status === 'planned') ? (
            <div className="bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-white border-2 border-emerald-400/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Play className="w-6 h-6 fill-white translate-x-0.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Rejalashtirilgan dars
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {currentLesson ? `${currentLesson.start_time} - ${currentLesson.end_time}` : 'Bugungi dars'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {currentLesson?.topic || `${currentGroup?.name} amaliy mashg‘uloti`}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Guruh: <strong>{currentGroup?.name}</strong> · Talabalar: <strong>{students.length} nafar</strong>. Darsni boshlaganingizdan so‘ng talabalar davomati ochiladi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartLesson}
                disabled={isStartingLesson}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{isStartingLesson ? 'Dars boshlanmoqda...' : 'Darsni boshlash'}</span>
              </button>
            </div>
          ) : currentLesson.status === 'in_progress' ? (
            <div className="bg-linear-to-r from-emerald-500/15 via-emerald-500/5 to-white border border-emerald-400 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-950 uppercase tracking-wide text-xs">
                      Jonli dars davom etmoqda
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Faol dars
                    </span>
                  </div>
                  <p className="text-slate-700 font-semibold mt-0.5">
                    {currentLesson.topic} ({currentGroup?.name})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px] bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span>Vaqt: {currentLesson.start_time} - {currentLesson.end_time}</span>
                  <span>·</span>
                  <span>Xona: {currentLesson.room}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Darsni tugatish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Ushbu dars yakunlangan ({currentLesson.completed_at || currentLesson.date})
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-semibold text-[10px] bg-slate-200 text-slate-700">
                      Davomat saqlangan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mavzu: <strong>{currentLesson.topic}</strong> · Keyingi dars boshlanguncha ushbu dars davomati ko‘rinib turadi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartNextLesson}
                disabled={isStartingLesson}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isStartingLesson ? 'Boshlanmoqda...' : 'Keyingi darsni boshlash'}</span>
              </button>
            </div>
          )}

          {/* Saved Attendance Alert Banner if attendance exists */}
          {existingRecords.length > 0 && (
            <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    ✓ Ushbu dars davomati to‘liq saqlangan ({existingRecords.length} nafar talaba bo‘yicha qayd etilgan)
                  </span>
                  <span className="text-[11px] text-cyan-800 block sm:inline sm:ml-2">
                    Keyingi dars boshlanguncha ma’lumotlar saqlanadi.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg border border-cyan-300 bg-white text-cyan-800 hover:bg-cyan-100 font-semibold text-[11px] cursor-pointer"
                >
                  Qayta belgilash (Bo‘shatish)
                </button>
                <button
                  type="button"
                  onClick={handleStartNextLesson}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Keyingi darsni boshlash</span>
                </button>
              </div>
            </div>
          )}

          {/* Official Coin Rules Notice Banner */}
          <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Avlod Ta’lim — Davomat tangalari qoidasi:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-bold text-[10px]">
                    Avtomatlashtirilgan
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 mt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <strong>Bor (Darsga keldi):</strong> +2 coin
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <strong>5 daqiqagacha kechikdi:</strong> +2 coin
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <strong>5 daqiqadan ko‘p kechikdi:</strong> +1 coin
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <strong>Yo‘q / Sababli:</strong> 0 coin
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-white px-3.5 py-2 rounded-lg border border-amber-300 shadow-xs">
              <Coins className="w-4 h-4 text-amber-600" />
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Jami hisoblangan:</div>
                <div className="text-xs font-extrabold text-amber-900 font-mono">
                  {totalCalculatedCoins} coin ({rewardSummary.presentCount + rewardSummary.lateUnder5Count + rewardSummary.lateOver5Count} talaba)
                </div>
              </div>
            </div>
          </div>

          {/* Live Attendance Summary Counter */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Qatnashdi (Bor)</span>
                <span className="text-xl font-mono font-bold text-emerald-600">
                  {summaryCounts.present}
                </span>
                <span className="text-[10px] text-emerald-700 block font-semibold">+2 coin dan</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Kechikdi</span>
                <span className="text-xl font-mono font-bold text-amber-600">{summaryCounts.late}</span>
                <span className="text-[10px] text-amber-700 block font-semibold">
                  ≤5m (+2) | &gt;5m (+1)
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Qatnashmadi</span>
                <span className="text-xl font-mono font-bold text-rose-600">{summaryCounts.absent}</span>
                <span className="text-[10px] text-slate-400 block font-medium">0 coin</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Sababli</span>
                <span className="text-xl font-mono font-bold text-sky-600">{summaryCounts.excused}</span>
                <span className="text-[10px] text-slate-400 block font-medium">0 coin</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Tanlanmagan</span>
                <span className={`text-xl font-mono font-bold ${summaryCounts.unmarked > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {summaryCounts.unmarked}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {summaryCounts.unmarked === 0 ? 'Hammasi tanlandi' : 'Tanlash kutilmoqda'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Student Attendance & Reward Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-cyan-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  {currentGroup?.name} talabalari ({students.length} nafar)
                </h2>
                {summaryCounts.unmarked > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {summaryCounts.unmarked} ta tanlanmagan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                {existingRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreExisting}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-700 hover:text-cyan-900 font-semibold underline cursor-pointer"
                  >
                    Oldingi davomatni tiklash
                  </button>
                )}
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Coin balansi jonli bog‘langan</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">№</th>
                    <th className="py-3 px-3">Talaba F.I.Sh</th>
                    <th className="py-3 px-3 font-mono">Talaba ID</th>
                    <th className="py-3 px-3 text-center">Joriy Balans</th>
                    <th className="py-3 px-3 text-center">Davomat holati</th>
                    <th className="py-3 px-3 text-center">Qoidaga muvofiq Coin</th>
                    <th className="py-3 px-3">Izoh / Sabab</th>
                    <th className="py-3 px-3 text-right">Qo‘shimcha Coin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, idx) => {
                    const studentItem = attendanceState[student.id];
                    const currentStatus = studentItem?.status;
                    const lateMinutes = studentItem?.lateMinutes ?? 5;
                    const currentNotes = studentItem?.notes || '';
                    const coinPreview = getStudentCoinPreview(currentStatus, lateMinutes);

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          !currentStatus
                            ? 'bg-white hover:bg-slate-50/50'
                            : currentStatus === 'present'
                            ? 'bg-emerald-50/15 hover:bg-emerald-50/30'
                            : currentStatus === 'late'
                            ? 'bg-amber-50/15 hover:bg-amber-50/30'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {student.full_name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {student.student_code}
                        </td>

                        {/* Student Coin Balance Badge */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setHistoryModalStudent(student)}
                            title="Tangalar tarixi va talaba do‘konini ko‘rish"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-mono font-bold transition-colors cursor-pointer group shadow-2xs"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                            <span>{student.coins_balance || 0}</span>
                          </button>
                        </td>

                        {/* Status Segmented Buttons */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <div
                              className={`inline-flex items-center gap-1 p-1 rounded-lg border transition-all ${
                                currentStatus
                                  ? 'bg-slate-100 border-slate-300 shadow-xs'
                                  : 'bg-slate-50/80 border-slate-200 border-dashed'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'present')}
                                title="Bor (Darsga o‘z vaqtida keldi: +2 coin)"
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                              >
                                Bor
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'absent')}
                                title="Yo‘q (Kelmadi: 0 coin)"
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                              >
                                Yo‘q
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'late')}
                                title="Kechikdi (≤5 daqiqagacha: +2 coin, >5 daqiqa: +1 coin)"
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                              >
                                Kechikdi
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'excused')}
                                title="Sababli (0 coin)"
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                  currentStatus === 'excused'
                                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                              >
                                Sababli
                              </button>
                            </div>

                            {/* If Kechikdi is selected, show late minutes controller */}
                            {currentStatus === 'late' ? (
                              <div className="flex items-center gap-1.5 mt-1 bg-amber-50 p-1 rounded-md border border-amber-200 text-[11px]">
                                <span className="text-amber-800 font-semibold">Kechikish:</span>
                                <button
                                  type="button"
                                  onClick={() => handleLateMinutesChange(student.id, 5)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    lateMinutes <= 5
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                                  }`}
                                  title="5 daqiqagacha: +2 coin beriladi"
                                >
                                  ≤5 daq (+2)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLateMinutesChange(student.id, 10)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    lateMinutes > 5
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                                  }`}
                                  title="5 daqiqadan ko'p: +1 coin beriladi"
                                >
                                  &gt;5 daq (+1)
                                </button>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={lateMinutes}
                                    onChange={(e) =>
                                      handleLateMinutesChange(student.id, parseInt(e.target.value) || 1)
                                    }
                                    className="w-10 px-1 py-0.5 text-center bg-white border border-amber-300 rounded text-[11px] font-mono font-bold text-amber-950 focus:outline-hidden"
                                    title="Aniq daqiqani kiriting"
                                  />
                                  <span className="text-[10px] text-amber-700 ml-0.5">daq</span>
                                </div>
                              </div>
                            ) : !currentStatus ? (
                              <span className="text-[10px] text-slate-400 italic">Tanlanmagan</span>
                            ) : null}
                          </div>
                        </td>

                        {/* Calculated Coin Preview */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${coinPreview.badgeClass}`}
                            >
                              {coinPreview.amount > 0 && (
                                <Coins className="w-3 h-3 text-amber-500 fill-amber-500" />
                              )}
                              <span>{coinPreview.label}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              {coinPreview.subtext}
                            </span>
                          </div>
                        </td>

                        {/* Notes input */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={currentNotes}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            placeholder={
                              currentStatus === 'late'
                                ? `${lateMinutes} daqiqa kechikdi...`
                                : 'masalan: faol qatnashmoqda...'
                            }
                            className="w-full max-w-[170px] px-2 py-1 rounded border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                          />
                        </td>

                        {/* Manual / Extra Coin Reward Button */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setCoinModalStudent(student)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-900 font-bold text-xs transition-colors border border-amber-300 shadow-2xs cursor-pointer group"
                            title="Ushbu talabaga alohida sabab bilan qo‘shimcha tanga berish"
                          >
                            <Coins className="w-3.5 h-3.5 text-amber-600 group-hover:text-slate-950" />
                            <span>Coin berish</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Submission Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAwardCoins}
                    onChange={(e) => setAutoAwardCoins(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                  />
                  <span>Davomat qoidasiga ko‘ra tangalarni avtomatik berish (+2 coin / +1 coin)</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleMarkAll('present')}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Barchani &quot;Bor&quot; qilish
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tozalash (Bo‘sh qilish)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const unmarked = students.filter((s) => !attendanceState[s.id]?.status);
                    if (unmarked.length > 0) {
                      setErrorMessage(
                        `Diqqat: ${unmarked.length} nafar talabaning davomati hali tanlanmagan. Iltimos, barcha talabalar holatini belgilang yoki "Barchani Bor qilish" tugmasidan foydalaning.`
                      );
                      return;
                    }
                    setShowConfirmModal(true);
                  }}
                  disabled={isSubmitting || students.length === 0}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saqlanmoqda...' : 'Davomatni tasdiqlash va saqlash'}</span>
                </button>

                {currentLesson?.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => setIsCompleteModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Darsni tugatish</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden p-6 text-xs text-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Davomat va Tangalarni tasdiqlaysizmi?</h3>
                <p className="text-xs text-slate-500 font-mono">{currentGroup?.name} · {currentLesson?.topic}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <span>Jami talabalar:</span>
                <span className="font-mono">{students.length} nafar</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Darsga o‘z vaqtida kelganlar (Bor):</span>
                <span className="font-mono font-bold">
                  {rewardSummary.presentCount} nafar (+{rewardSummary.presentCoins} coin)
                </span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>5 daqiqagacha kechikkanlar (≤5 daq):</span>
                <span className="font-mono font-bold">
                  {rewardSummary.lateUnder5Count} nafar (+{rewardSummary.lateUnder5Coins} coin)
                </span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>5 daqiqadan ko‘p kechikkanlar (&gt;5 daq):</span>
                <span className="font-mono font-bold">
                  {rewardSummary.lateOver5Count} nafar (+{rewardSummary.lateOver5Coins} coin)
                </span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Darsda yo‘q / Sababli:</span>
                <span className="font-mono font-bold">
                  {rewardSummary.absentCount + rewardSummary.excusedCount} nafar (0 coin)
                </span>
              </div>

              {autoAwardCoins && (
                <div className="flex justify-between text-amber-950 font-bold bg-amber-100/70 p-2 rounded-md border border-amber-300 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    Jami taqsimlanadigan tangalar:
                  </span>
                  <span className="font-mono text-sm">+{totalCalculatedCoins} coin</span>
                </div>
              )}
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Ushbu davomat o‘qituvchi <strong className="text-slate-900">{user?.full_name}</strong> tomonidan tasdiqlanadi va talabalar hisobiga tangalar avtomatik yoziladi.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Qaytish
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Tasdiqlash va saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
