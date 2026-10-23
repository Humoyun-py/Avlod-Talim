import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Github,
  ExternalLink,
  Award,
  Coins,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, Homework } from '../../types';
import { StudentApiService } from '../../services/studentApi';
import { useToast } from '../../context/ToastContext';

export const StudentHomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success, error } = useToast();

  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  // Submit modal form
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [targetHw, setTargetHw] = useState<Homework | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadHomework = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const data = await StudentApiService.getHomework(student.groupId);
      setHomeworkList(data);
    } catch (err) {
      console.error('Error loading homework:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [student?.groupId]);

  useEffect(() => {
    window.addEventListener('homework-updated', loadHomework);
    return () => window.removeEventListener('homework-updated', loadHomework);
  }, [student?.groupId]);

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHw || !solutionText.trim()) return;

    setSubmitting(true);
    try {
      await StudentApiService.submitHomework(targetHw.id, {
        textContent: solutionText,
        githubUrl: githubUrl.trim() || undefined,
        previewUrl: previewUrl.trim() || undefined
      });
      success('Vazifa topshirildi!', `"${targetHw.title}" muvaffaqiyatli jo‘natildi.`);
      setSubmitModalOpen(false);
      setSolutionText('');
      setGithubUrl('');
      setPreviewUrl('');
      await loadHomework();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Vazifani yuborishda xatolik yuz berdi';
      error('Xatolik', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <BookOpenCheck className="w-4 h-4" />
            <span>Mustaqil Ta’lim & Amaliy Vazifalar</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Uy Vazifalari Jurnali
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Guruh: <strong className="text-white">{student.groupName}</strong> · Ustoz:{' '}
            <strong className="text-cyan-300">{student.teacherName}</strong>
          </p>
        </div>

        <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs text-right">
          <span className="text-slate-400 block">Jami topshiriqlar:</span>
          <span className="font-mono font-bold text-white text-base">{homeworkList.length} ta vazifa</span>
        </div>
      </div>

      {/* Homework Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {homeworkList.map(hw => {
          const isGraded = hw.status === 'Graded';
          const isSubmitted = hw.status === 'Submitted';
          const isPending = hw.status === 'Pending';

          return (
            <div
              key={hw.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-500 font-mono">
                      Berilgan: {hw.assignedDate}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-rose-700 font-mono">
                      Muddat: {hw.deadline}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{hw.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hw.coinReward && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>+{hw.coinReward} coin</span>
                    </span>
                  )}

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      isGraded
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                        : isSubmitted
                        ? 'bg-sky-50 text-sky-800 border border-sky-200/60'
                        : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                    }`}
                  >
                    {isGraded ? 'Baholandi' : isSubmitted ? 'Topshirildi' : 'Kutilmoqda'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {hw.description}
              </p>

              {/* Submission details and teacher feedback */}
              {hw.submission && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                    <span>Topshirilgan vaqt: {hw.submission.submittedAt}</span>
                    {hw.submission.grade !== undefined && (
                      <span className="font-bold text-emerald-700 font-sans text-xs bg-emerald-100 px-2 py-0.5 rounded">
                        Baho: {hw.submission.grade} / {hw.maxScore}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Sizning javobingiz:</span>
                    <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-100">
                      {hw.submission.textContent}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {hw.submission.githubUrl && (
                      <a
                        href={hw.submission.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-800 hover:text-black font-semibold underline"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub Repository</span>
                      </a>
                    )}
                    {hw.submission.previewUrl && (
                      <a
                        href={hw.submission.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-800 hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Jonli Demo Sayt</span>
                      </a>
                    )}
                  </div>

                  {hw.submission.teacherFeedback && (
                    <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200/60 rounded-lg text-slate-900">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ustoz Taqrizi ({hw.teacherName}):</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">
                        {hw.submission.teacherFeedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {isPending && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setTargetHw(hw);
                      setSubmitModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Vazifani topshirish</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {submitModalOpen && targetHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Vazifani topshirish</h3>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHomework} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900">{targetHw.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Muddat: {targetHw.deadline}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Yechim tavsifi / Izohingiz *
                </label>
                <textarea
                  rows={4}
                  required
                  value={solutionText}
                  onChange={e => setSolutionText(e.target.value)}
                  placeholder="Vazifani qanday bajardingiz, qanday kutubxona va usullardan foydalandingiz..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GitHub Havolasi (URL)
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jonli Namuna Havolasi (Vercel / Netlify / Render)
                </label>
                <input
                  type="url"
                  value={previewUrl}
                  onChange={e => setPreviewUrl(e.target.value)}
                  placeholder="https://my-app.vercel.app"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting || !solutionText.trim()}
                  className="px-4 py-2 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Topshirilmoqda...' : 'Vazifani topshirish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
