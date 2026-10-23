import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Clock,
  Calendar,
  Users2,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  MessageSquare,
  Award,
  ExternalLink,
  ShieldCheck,
  Code2,
  FileCode,
  Copy,
  Check,
  Download,
  Upload,
  Coins,
  Sparkles,
  Terminal,
  FileUp,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Homework, HomeworkSubmission, Group, Student } from '../types';

export const HomeworkPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<HomeworkSubmission | null>(null);
  const [viewingCodeSubmission, setViewingCodeSubmission] = useState<HomeworkSubmission | null>(null);
  const [studentSubmitModalOpen, setStudentSubmitModalOpen] = useState(false);

  // Review & Coin grading state
  const [reviewScore, setReviewScore] = useState<number>(90);
  const [reviewCoins, setReviewCoins] = useState<number>(15); // 1-20 Coins
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Create homework form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [deadline, setDeadline] = useState('2026-10-22 23:59');
  const [requiresCode, setRequiresCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Student submission form state (for uploading code file)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [codeFileName, setCodeFileName] = useState('');
  const [codeFileSize, setCodeFileSize] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState('');
  const [studentComment, setStudentComment] = useState('');
  const [isUploadingCode, setIsUploadingCode] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [hw, grps] = await Promise.all([
      teacherService.getHomework(),
      teacherService.getGroups(),
    ]);
    setHomeworkList(hw);
    setGroups(grps);
    if (grps.length > 0 && !groupId) {
      setGroupId(grps[0].id);
    }
    if (hw.length > 0 && !selectedHomework) {
      handleSelectHomework(hw[0]);
    }
  };

  const handleSelectHomework = async (hw: Homework) => {
    setSelectedHomework(hw);
    const [subs, stds] = await Promise.all([
      teacherService.getSubmissions(hw.id),
      teacherService.getStudents(hw.group_id),
    ]);
    setSubmissions(subs);
    setGroupStudents(stds);
    if (stds.length > 0) {
      setSelectedStudentId(stds[0].id);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim() || !groupId) {
      setFormError('Barcha majburiy maydonlarni to‘ldiring.');
      return;
    }

    setIsSubmitting(true);
    try {
      await teacherService.createHomework({
        group_id: groupId,
        title: title.trim(),
        description: description.trim(),
        deadline: deadline.trim(),
      });
      setIsSubmitting(false);
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Vazifa yaratishda xatolik yuz berdi.');
    }
  };

  const handleOpenReview = (submission: HomeworkSubmission) => {
    setReviewingSubmission(submission);
    setReviewScore(submission.score ?? 90);
    // Default or existing coins awarded (1 to 20)
    setReviewCoins(submission.coins_awarded ?? 15);
    setReviewFeedback(submission.feedback || '');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    // Validate coins: 1 to 20
    const clampedCoins = Math.min(20, Math.max(1, Math.round(reviewCoins || 1)));

    try {
      await teacherService.reviewSubmission(
        reviewingSubmission.id,
        Number(reviewScore),
        reviewFeedback.trim(),
        clampedCoins
      );
      setReviewingSubmission(null);
      setSubmitSuccessMsg(
        `Topshiriq baholandi! Talaba (${reviewingSubmission.student_name})ga ${reviewScore} ball va +${clampedCoins} coin taqdim etildi.`
      );
      setTimeout(() => setSubmitSuccessMsg(null), 5000);

      // Reload submissions and list
      if (selectedHomework) {
        const updatedSubs = await teacherService.getSubmissions(selectedHomework.id);
        setSubmissions(updatedSubs);
      }
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle uploading code file on behalf of student
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCodeFileName(file.name);
    const sizeKb = (file.size / 1024).toFixed(1);
    setCodeFileSize(`${sizeKb} KB`);

    // Auto-detect language
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'py') setCodeLanguage('python');
    else if (ext === 'js') setCodeLanguage('javascript');
    else if (ext === 'ts') setCodeLanguage('typescript');
    else if (ext === 'sql') setCodeLanguage('sql');
    else if (ext === 'html') setCodeLanguage('html');
    else if (ext === 'css') setCodeLanguage('css');
    else if (ext === 'java') setCodeLanguage('java');
    else if (ext === 'cpp' || ext === 'c') setCodeLanguage('cpp');

    // Read content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCodeContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitStudentCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomework || !selectedStudentId) return;

    if (!codeFileName.trim()) {
      alert('Iltimos, kod faylini tanlang yoki fayl nomini kiriting.');
      return;
    }

    if (!codeContent.trim()) {
      alert('Iltimos, fayl kodi yoki matnini kiriting.');
      return;
    }

    setIsUploadingCode(true);
    try {
      await teacherService.submitHomework({
        homework_id: selectedHomework.id,
        student_id: selectedStudentId,
        file_name: codeFileName.trim(),
        file_size: codeFileSize || '3.5 KB',
        code_content: codeContent.trim(),
        code_language: codeLanguage,
        comment: studentComment.trim() || undefined,
      });

      setIsUploadingCode(false);
      setStudentSubmitModalOpen(false);
      setCodeFileName('');
      setCodeContent('');
      setStudentComment('');
      setSubmitSuccessMsg('Talaba nomidan kod fayli muvaffaqiyatli topshirildi va tekshirish uchun qabul qilindi!');
      setTimeout(() => setSubmitSuccessMsg(null), 5000);

      // Refresh submissions
      const updatedSubs = await teacherService.getSubmissions(selectedHomework.id);
      setSubmissions(updatedSubs);
      await loadData();
    } catch (err: any) {
      setIsUploadingCode(false);
      alert(err.message || 'Kod faylini yuklashda xatolik yuz berdi.');
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadCode = (fileName: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Uy vazifalari & Kod tekshiruvi</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-600" />
              <span>1-20 Coin baholash tizimi</span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dasturlash kurslarida kod fayllarini qabul qilish, sintaksisni tekshirish va talabalarga 1 dan 20 gacha coin taqsimlash
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedHomework && (
            <button
              onClick={() => setStudentSubmitModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Kod fayli topshirish (Sinov)</span>
            </button>
          )}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi vazifa berish</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {submitSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{submitSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSubmitSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Grid: Homework List (Left 2 cols) & Submissions panel (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Homework list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Topshiriqlar ro‘yxati ({homeworkList.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Vazifani tanlang va uning yechimlarini ko‘ring
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {homeworkList.map((hw) => {
                const isSelected = selectedHomework?.id === hw.id;
                const pending = hw.submissions_count - hw.reviewed_count;

                return (
                  <div
                    key={hw.id}
                    onClick={() => handleSelectHomework(hw)}
                    className={`p-5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-50/60 border-l-4 border-cyan-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{hw.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                            {hw.group_name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-cyan-100 text-cyan-800 flex items-center gap-1">
                            <Code2 className="w-3 h-3 text-cyan-700" />
                            <span>Kod talab qilinadi</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {hw.description}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-end gap-1 shrink-0 text-right">
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Muddat: {hw.deadline}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-800">
                          {hw.submissions_count} / {hw.total_students} topshirildi
                        </div>
                        {pending > 0 ? (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {pending} ta tekshirish kutilmoqda
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Barchasi tekshirilgan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Homework Submissions Drawer */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-600" />
                  <span>Topshirilgan Kod Yechimlari ({submissions.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                  {selectedHomework ? selectedHomework.title : 'Vazifani tanlang'}
                </p>
              </div>

              {selectedHomework && (
                <button
                  onClick={() => setStudentSubmitModalOpen(true)}
                  title="Yangi kod yuklash"
                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4 space-y-3 max-h-[750px] overflow-y-auto">
              {!selectedHomework ? (
                <div className="text-center p-8 text-slate-400 text-xs">
                  Talabalar topshirgan ishlarni ko‘rish uchun chapdagi ro‘yxatdan vazifani bosing.
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs space-y-2">
                  <FileCode className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Hozircha hech bir talaba topshiriq yuklamagan.</p>
                  <button
                    onClick={() => setStudentSubmitModalOpen(true)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Talaba nomidan kod yuklab sinash
                  </button>
                </div>
              ) : (
                submissions.map((sub) => {
                  const isReviewed = sub.status === 'reviewed';

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-3 text-xs shadow-2xs"
                    >
                      {/* Student info and Status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sub.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sub.student_code} · {sub.submitted_at}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {isReviewed ? (
                            <>
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {sub.score} / 100 ball
                              </span>
                              {sub.coins_awarded && sub.coins_awarded > 0 && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                  <Coins className="w-3 h-3 text-amber-600" />
                                  <span>+{sub.coins_awarded} Coin berildi</span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              Tekshirish kutilmoqda
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Code File Box */}
                      <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-cyan-400" />
                            <span className="font-mono text-xs font-bold text-white truncate max-w-[160px]">
                              {sub.file_name || 'solution.py'}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                              {sub.code_language || 'python'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {sub.file_size || '3.8 KB'}
                          </span>
                        </div>

                        {/* Code snippet preview */}
                        {sub.code_content && (
                          <pre className="text-[10px] font-mono text-emerald-400 bg-slate-950 p-2 rounded max-h-16 overflow-hidden select-none line-clamp-3 opacity-90">
                            {sub.code_content}
                          </pre>
                        )}
                      </div>

                      {/* Student comment */}
                      {sub.comment && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 italic">
                          &quot;{sub.comment}&quot;
                        </p>
                      )}

                      {/* Teacher Feedback if reviewed */}
                      {sub.feedback && (
                        <div className="text-[11px] text-cyan-900 bg-cyan-50 p-2 rounded border border-cyan-100">
                          <span className="font-semibold">Ustoz fikri:</span> {sub.feedback}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCodeSubmission(sub)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold text-[11px] hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Code2 className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Kodni to‘liq ko‘rish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(sub)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isReviewed ? 'Bahoni & Coinni o‘zgartirish' : 'Tekshirish & Coin berish'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {viewingCodeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">
                      {viewingCodeSubmission.file_name || 'solution.py'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {viewingCodeSubmission.code_language || 'python'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {viewingCodeSubmission.file_size || '3.8 KB'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Talaba: <strong className="text-slate-200">{viewingCodeSubmission.student_name}</strong> ({viewingCodeSubmission.student_code}) · Topshirilgan: {viewingCodeSubmission.submitted_at}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCopyCode(viewingCodeSubmission.code_content || '')
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kodni nusxalash</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    handleDownloadCode(
                      viewingCodeSubmission.file_name || 'solution.py',
                      viewingCodeSubmission.code_content || ''
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yuklab olish</span>
                </button>

                <button
                  onClick={() => setViewingCodeSubmission(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Student comment preview */}
            {viewingCodeSubmission.comment && (
              <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <span className="font-semibold text-cyan-400">Talaba izohi:</span>
                <span className="italic">&quot;{viewingCodeSubmission.comment}&quot;</span>
              </div>
            )}

            {/* Code Body with Line Numbers */}
            <div className="flex-1 overflow-auto p-4 bg-[#0a0e17] font-mono text-xs text-slate-200 leading-relaxed">
              <div className="flex">
                {/* Line numbers column */}
                <div className="select-none text-slate-600 pr-4 text-right border-r border-slate-800 space-y-1">
                  {(viewingCodeSubmission.code_content || '// Hech qanday kod matni yo‘q')
                    .split('\n')
                    .map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                </div>

                {/* Code text column */}
                <div className="pl-4 space-y-1 overflow-x-auto w-full">
                  {(viewingCodeSubmission.code_content || '// Kod mavjud emas')
                    .split('\n')
                    .map((line, i) => (
                      <div key={i} className="hover:bg-slate-900/60 px-1 rounded whitespace-pre">
                        {line || ' '}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with quick grading jump */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-400 flex items-center gap-2 font-mono">
                <span>
                  Qatorlar soni: {(viewingCodeSubmission.code_content || '').split('\n').length} ta
                </span>
                <span>·</span>
                <span>Belgilar: {(viewingCodeSubmission.code_content || '').length} ta</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingCodeSubmission(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sub = viewingCodeSubmission;
                    setViewingCodeSubmission(null);
                    handleOpenReview(sub);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Coins className="w-4 h-4 fill-slate-950" />
                  <span>Ushbu kodni baholash & 1-20 Coin berish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal (1-20 Coin Grading) */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>Talaba ishini baholash</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    1-20 Coin
                  </span>
                </h3>
                <p className="text-xs text-cyan-400">
                  {reviewingSubmission.student_name} ({reviewingSubmission.student_code}) · {reviewingSubmission.file_name || 'Kod fayli'}
                </p>
              </div>
              <button
                onClick={() => setReviewingSubmission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-5 text-xs">
              {/* Score (0-100) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">
                    Akademik Ball (0 dan 100 gacha):
                  </label>
                  <span className="font-mono font-extrabold text-sm text-cyan-700">
                    {reviewScore} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={reviewScore}
                  onChange={(e) => setReviewScore(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>75</span>
                  <span>90</span>
                  <span>100</span>
                </div>
              </div>

              {/* Coins Award (1 to 20 Coins) - CORE USER REQUIREMENT */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Tangalar (Coin) berish: 1 dan 20 coingacha</span>
                  </label>
                  <div className="flex items-center gap-1.5 bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg shadow-xs text-xs font-mono">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{reviewCoins} Coin</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={1}
                    value={reviewCoins}
                    onChange={(e) => setReviewCoins(Number(e.target.value))}
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <div className="w-20">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={reviewCoins}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setReviewCoins(Math.min(20, Math.max(1, isNaN(val) ? 1 : val)));
                      }}
                      className="w-full px-2 py-1 text-center font-mono font-bold text-slate-900 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Quick preset buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Tezkor tanlash:</span>
                  {[
                    { amount: 5, label: '+5 Coin (Yaxshi)' },
                    { amount: 10, label: '+10 Coin (Juda yaxshi)' },
                    { amount: 15, label: '+15 Coin (A’lo)' },
                    { amount: 20, label: '+20 Coin (Maksimal)' },
                  ].map((preset) => (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => setReviewCoins(preset.amount)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        reviewCoins === preset.amount
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                          : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-amber-800 leading-relaxed">
                  💡 <strong>Izoh:</strong> Vazifaning qiyinlik darajasi, kod tozaligi va algoritmlar to‘g‘riligiga qarab talabaga 1-20 tanga taqsimlanadi. Bu tangalar darhol talaba hisobiga qo‘shiladi.
                </p>
              </div>

              {/* Teacher Feedback */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  O‘qituvchi xulosasi & konstruktiv fikri:
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Koddagi tozalik, optimizatsiya, xatolar yoki talabaga tavsiyalar..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReviewingSubmission(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Coins className="w-4 h-4 text-amber-300" />
                  <span>Bahoni saqlash & +{reviewCoins} Coin berish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Code File Modal (Kod faylini so'rash & yuklash) */}
      {studentSubmitModalOpen && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-emerald-400" />
                  <span>Dasturlash topshirig‘i: Kod faylini yuklash</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Vazifa: <strong>{selectedHomework.title}</strong> ({selectedHomework.group_name})
                </p>
              </div>
              <button
                onClick={() => setStudentSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudentCode} className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Select Student */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Talabani tanlang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  required
                >
                  {groupStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.full_name} ({std.student_code}) · Balans: {std.coins_balance} coin
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Code File */}
              <div className="p-4 rounded-xl border-2 border-dashed border-cyan-400/80 bg-cyan-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <FileCode className="w-4 h-4 text-cyan-600" />
                    <span>Kod faylini yuklang (.py, .js, .ts, .sql, .html, .cpp, .zip)</span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                    Majburiy
                  </span>
                </div>

                <input
                  type="file"
                  accept=".py,.js,.ts,.jsx,.tsx,.sql,.html,.css,.json,.cpp,.c,.java,.zip,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                />

                {codeFileName && (
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-cyan-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono font-bold text-slate-800">{codeFileName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{codeFileSize}</span>
                  </div>
                )}
              </div>

              {/* Code Language & File Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Dasturlash tili:
                  </label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-mono"
                  >
                    <option value="python">Python (.py)</option>
                    <option value="javascript">JavaScript (.js)</option>
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="sql">PostgreSQL / SQL (.sql)</option>
                    <option value="html">HTML5 (.html)</option>
                    <option value="css">CSS / Tailwind (.css)</option>
                    <option value="cpp">C++ (.cpp)</option>
                    <option value="java">Java (.java)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Fayl nomi:
                  </label>
                  <input
                    type="text"
                    value={codeFileName}
                    onChange={(e) => setCodeFileName(e.target.value)}
                    placeholder="masalan: task_solution.py"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Code Content / Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    Kod matni / sintaksisi:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {codeContent ? `${codeContent.split('\n').length} qator` : 'Fayldan o‘qiladi yoki yozing'}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder={`# Kod matnini shu yerga yozing yoki fayl yuklang\ndef solve():\n    print("Salom, Avlod Talim!")`}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* Student Comment */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Talaba izohi (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={studentComment}
                  onChange={(e) => setStudentComment(e.target.value)}
                  placeholder="masalan: 3-topshiriqdagi funksiyani test qildim, barchasi ishladi."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStudentSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isUploadingCode}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingCode ? 'Yuklanmoqda...' : 'Kod faylini topshirish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Homework Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Yangi Uy Vazifasi Qo‘shish</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateHomework} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Guruhni tanlang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.course_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Vazifa sarlavhasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="masalan: Python OOP: Singleton Pattern va Metaclass"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Tavsif va talablar <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vazifa shartlari, talab qilinadigan modellar, kutilgan natija va fayl turi (.py, .js va h.k.)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Topshirish oxirgi muddati (Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Kod fayli topshirilishi shart:</div>
                  <div className="text-[10px] text-slate-500">Talaba .py, .js, .sql yoki .zip fayl yuklashi lozim</div>
                </div>
                <input
                  type="checkbox"
                  checked={requiresCode}
                  onChange={(e) => setRequiresCode(e.target.checked)}
                  className="w-4 h-4 accent-cyan-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Vazifani e’lon qilish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
