import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Send,
  ExternalLink,
  Download,
  Paperclip,
  Image as ImageIcon,
  Coins,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, Homework, SubmissionImage } from '../../types';
import { StudentApiService } from '../../services/studentApi';
import { useToast } from '../../context/ToastContext';

const MAX_IMAGE_COUNT = 10;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp';
const PROJECT_FILE_ACCEPT = '.zip,.rar,.7z,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.py,.ipynb,.java,.c,.cpp,.js,.ts,.html,.css,.sql';

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Shows a submitted image by fetching it with the auth token (plain <img src> cannot send the header). */
const AuthorizedImage: React.FC<{ image: SubmissionImage; index: number }> = ({ image, index }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    StudentApiService.fetchAttachment(image.url)
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

export const StudentHomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;
  const { success, error } = useToast();

  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit modal form
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [targetHw, setTargetHw] = useState<Homework | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [projectFile, setProjectFile] = useState<File | null>(null);
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

  const requiredTypes = targetHw?.submissionTypes ?? ['text'];
  const canSubmit =
    (!requiredTypes.includes('text') || !!solutionText.trim()) &&
    (!requiredTypes.includes('link') || isValidUrl(linkUrl.trim())) &&
    (!requiredTypes.includes('image') || imageFiles.length > 0) &&
    (!requiredTypes.includes('file') || !!projectFile);

  const openSubmitModal = (hw: Homework) => {
    setTargetHw(hw);
    setSolutionText('');
    setLinkUrl('');
    setImageFiles([]);
    setProjectFile(null);
    setSubmitModalOpen(true);
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > MAX_IMAGE_COUNT) {
      error('Xatolik', `Ko‘pi bilan ${MAX_IMAGE_COUNT} ta rasm yuklash mumkin.`);
      e.target.value = '';
      setImageFiles([]);
      return;
    }
    if (files.some(file => file.size > MAX_FILE_BYTES)) {
      error('Xatolik', 'Har bir rasm hajmi 100 MB dan oshmasligi kerak.');
      e.target.value = '';
      setImageFiles([]);
      return;
    }
    setImageFiles(files);
  };

  const handleProjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_BYTES) {
      error('Xatolik', 'Fayl hajmi 100 MB dan oshmasligi kerak.');
      e.target.value = '';
      setProjectFile(null);
      return;
    }
    setProjectFile(file);
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHw || !canSubmit) return;

    setSubmitting(true);
    try {
      await StudentApiService.submitHomework(targetHw.id, {
        textContent: solutionText,
        linkUrl: linkUrl.trim() || undefined,
        images: imageFiles,
        file: projectFile,
      });
      success('Vazifa topshirildi!', `"${targetHw.title}" muvaffaqiyatli jo‘natildi.`);
      setSubmitModalOpen(false);
      await loadHomework();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Vazifani yuborishda xatolik yuz berdi';
      error('Xatolik', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadProjectFile = async (url: string, fileName: string) => {
    try {
      const blob = await StudentApiService.fetchAttachment(url);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      error('Xatolik', 'Faylni yuklab bo‘lmadi.');
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
        {!loading && homeworkList.length === 0 && (
          <div className="text-center p-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Hozircha uy vazifalari yo‘q.
          </div>
        )}
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
                      Muddat: {hw.deadline || '—'}
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

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
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

                  {hw.submission.textContent && (
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">Sizning javobingiz:</span>
                      <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                        {hw.submission.textContent}
                      </p>
                    </div>
                  )}

                  {hw.submission.images.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-medium block mb-1">
                        Yuborilgan rasmlar ({hw.submission.images.length}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {hw.submission.images.map((image, index) => (
                          <AuthorizedImage key={image.id} image={image} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {hw.submission.linkUrl && (
                      <a
                        href={hw.submission.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-800 hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Loyiha havolasi</span>
                      </a>
                    )}
                    {hw.submission.fileUrl && (
                      <button
                        type="button"
                        onClick={() => downloadProjectFile(hw.submission!.fileUrl!, hw.submission!.fileName || 'loyiha')}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-800 hover:text-black font-semibold underline"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>{hw.submission.fileName || 'Loyiha fayli'}</span>
                        <Download className="w-3.5 h-3.5" />
                      </button>
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
                    onClick={() => openSubmitModal(hw)}
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
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
                <p className="text-[11px] text-slate-500 mt-0.5">Muddat: {targetHw.deadline || '—'}</p>
              </div>

              {requiredTypes.includes('text') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Javob / izohingiz *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={solutionText}
                    onChange={e => setSolutionText(e.target.value)}
                    placeholder="Vazifani qanday bajardingiz..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                </div>
              )}

              {requiredTypes.includes('link') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loyiha havolasi (URL) *
                  </label>
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">GitHub, Google Drive, Figma va boshqa havolalar.</p>
                </div>
              )}

              {requiredTypes.includes('image') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rasmlar (JPG, PNG yoki WEBP) *
                  </label>
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    multiple
                    required
                    onChange={handleImagesChange}
                    className="w-full text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ko‘pi bilan {MAX_IMAGE_COUNT} ta rasm, har biri 100 MB gacha.
                  </p>
                  {imageFiles.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {imageFiles.map(file => (
                        <li key={`${file.name}-${file.size}`} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-slate-400 font-mono">{formatSize(file.size)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {requiredTypes.includes('file') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loyiha fayli (100 MB gacha) *
                  </label>
                  <input
                    type="file"
                    accept={PROJECT_FILE_ACCEPT}
                    required
                    onChange={handleProjectFileChange}
                    className="w-full text-xs"
                  />
                  {projectFile && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {projectFile.name} · {formatSize(projectFile.size)}
                    </p>
                  )}
                </div>
              )}

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
                  disabled={submitting || !canSubmit}
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
