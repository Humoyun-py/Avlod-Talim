import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
  Download,
  Paperclip,
  Coins,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Homework, HomeworkSubmission, Group } from '../types';

const SUBMISSION_TYPE_OPTIONS = [
  { value: 'text', label: 'Matn', hint: 'Javob yoki izoh matni' },
  { value: 'image', label: 'Rasmlar', hint: '1–10 ta rasm, har biri 100 MB gacha' },
  { value: 'link', label: 'Loyiha havolasi', hint: 'Istalgan sayt yoki repozitoriy URL' },
  { value: 'file', label: 'Loyiha fayli', hint: 'Arxiv, hujjat yoki kod fayli, 100 MB gacha' },
];

/** Shows a submitted image by fetching it with the auth token (plain <img src> cannot send the header). */
const AuthorizedImage: React.FC<{ image: { id: string; url: string }; index: number }> = ({ image, index }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    teacherService.fetchAttachment(image.url)
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.url]);

  if (!src) {
    return <div className="h-24 rounded-lg bg-slate-100 border border-slate-200 animate-pulse" />;
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block">
      <img src={src} alt={`Rasm ${index + 1}`} className="h-24 w-full object-cover rounded-lg border border-slate-200" />
    </a>
  );
};

export const HomeworkPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<HomeworkSubmission | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<HomeworkSubmission | null>(null);

  // Review & Coin grading state
  const [reviewScore, setReviewScore] = useState<number>(90);
  const [reviewCoins, setReviewCoins] = useState<number>(15); // 1-20 Coins
  const [reviewFeedback, setReviewFeedback] = useState<string>('');

  // Create homework form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [deadline, setDeadline] = useState('2026-10-22 23:59');
  const [submissionTypes, setSubmissionTypes] = useState<string[]>(['text']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    setSubmissions(await teacherService.getSubmissions(hw.id));
  };

  const toggleSubmissionType = (value: string) => {
    setSubmissionTypes(prev => (prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]));
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim() || !groupId) {
      setFormError('Barcha majburiy maydonlarni to‘ldiring.');
      return;
    }
    if (submissionTypes.length === 0) {
      setFormError('Kamida bitta topshiriq turini tanlang.');
      return;
    }

    setIsSubmitting(true);
    try {
      await teacherService.createHomework({
        group_id: groupId,
        title: title.trim(),
        description: description.trim(),
        deadline: deadline.trim(),
        submission_types: submissionTypes,
      });
      setIsSubmitting(false);
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setSubmissionTypes(['text']);
      await loadData();
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Vazifa yaratishda xatolik yuz berdi.');
    }
  };

  const downloadAttachment = async (url: string, fileName: string) => {
    try {
      const blob = await teacherService.fetchAttachment(url);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      alert('Faylni yuklab bo‘lmadi.');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Uy vazifalari & Baholash</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-600" />
              <span>1-20 Coin baholash tizimi</span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Matn, rasm, loyiha havolasi yoki fayl ko‘rinishida topshiriqlarni qabul qilish va talabalarga 1 dan 20 gacha coin taqsimlash
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
                          {(hw.submission_types ?? []).map((type) => (
                            <span key={type} className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-cyan-100 text-cyan-800">
                              {SUBMISSION_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type}
                            </span>
                          ))}
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
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Topshirilgan ishlar ({submissions.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                {selectedHomework ? selectedHomework.title : 'Vazifani tanlang'}
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-[750px] overflow-y-auto">
              {!selectedHomework ? (
                <div className="text-center p-8 text-slate-400 text-xs">
                  Talabalar topshirgan ishlarni ko‘rish uchun chapdagi ro‘yxatdan vazifani bosing.
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>Hozircha hech bir talaba topshiriq yuklamagan.</p>
                </div>
              ) : (
                submissions.map((sub) => {
                  const isReviewed = sub.status === 'reviewed';
                  const imageCount = sub.images?.length ?? 0;

                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-3 text-xs shadow-2xs"
                    >
                      {/* Student info and Status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sub.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{sub.submitted_at}</div>
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

                      {/* What the student submitted */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                        {sub.text && <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">Matn</span>}
                        {sub.link_url && <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">Havola</span>}
                        {imageCount > 0 && <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">{imageCount} ta rasm</span>}
                        {sub.file_url && <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">Fayl: {sub.file_name}</span>}
                      </div>

                      {sub.text && (
                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 line-clamp-2 whitespace-pre-line">
                          {sub.text}
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
                          onClick={() => setViewingSubmission(sub)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold text-[11px] hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Topshiriqni ko‘rish</span>
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

      {/* Submission Viewer Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{selectedHomework?.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Talaba: <strong className="text-slate-200">{viewingSubmission.student_name}</strong> · Topshirilgan: {viewingSubmission.submitted_at}
                </p>
              </div>
              <button
                onClick={() => setViewingSubmission(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {viewingSubmission.text && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5">Matnli javob</h4>
                  <p className="whitespace-pre-line bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800">{viewingSubmission.text}</p>
                </div>
              )}

              {viewingSubmission.link_url && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5">Loyiha havolasi</h4>
                  <a
                    href={viewingSubmission.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-700 hover:underline font-semibold break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>{viewingSubmission.link_url}</span>
                  </a>
                </div>
              )}

              {(viewingSubmission.images?.length ?? 0) > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5">Rasmlar ({viewingSubmission.images?.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {viewingSubmission.images?.map((image, index) => (
                      <AuthorizedImage key={image.id} image={image} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {viewingSubmission.file_url && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1.5">Loyiha fayli</h4>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(viewingSubmission.file_url!, viewingSubmission.file_name || 'loyiha')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{viewingSubmission.file_name || 'Loyiha fayli'}</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!viewingSubmission.text && !viewingSubmission.link_url && !viewingSubmission.images?.length && !viewingSubmission.file_url && (
                <p className="text-slate-500">Talaba hech qanday material yubormagan.</p>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const sub = viewingSubmission;
                  setViewingSubmission(null);
                  handleOpenReview(sub);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
              >
                Baholash
              </button>
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

              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Talabadan talab qilinadigan topshiriq turlari <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUBMISSION_TYPE_OPTIONS.map((option) => {
                    const checked = submissionTypes.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer ${
                          checked ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubmissionType(option.value)}
                          className="mt-0.5 w-4 h-4 accent-cyan-600 cursor-pointer"
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">{option.label}</span>
                          <span className="block text-[10px] text-slate-500">{option.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Talaba tanlangan barcha turlarni topshiradi.</p>
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
