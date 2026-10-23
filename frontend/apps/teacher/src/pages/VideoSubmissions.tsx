import React, { useState, useEffect } from 'react';
import {
  Video,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileVideo,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Lesson, VideoStatus } from '../types';

export const VideoSubmissions: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [submissionType, setSubmissionType] = useState<'url' | 'file'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    const list = await teacherService.getSchedule();
    setLessons(list);
    if (list.length > 0 && !selectedLessonId) {
      setSelectedLessonId(list[0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMsg(null);
    if (!file) return;

    // Check size (250MB limit)
    if (file.size > 250 * 1024 * 1024) {
      setErrorMsg('Fayl hajmi 250 MB dan oshmasligi kerak.');
      return;
    }

    // Check type
    if (!file.type.includes('video') && !file.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
      setErrorMsg('Faqat video fayllar (.mp4, .mov, .avi) qabul qilinadi.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedLessonId) {
      setErrorMsg('Iltimos, darsni tanlang.');
      return;
    }

    if (submissionType === 'url') {
      if (!videoUrl.trim() || !videoUrl.startsWith('http')) {
        setErrorMsg('To‘g‘ri video havolasini kiriting (https:// bilan boshlanishi kerak).');
        return;
      }
    } else {
      if (!selectedFile) {
        setErrorMsg('Iltimos, video faylni tanlang.');
        return;
      }
    }

    setIsSubmitting(true);
    setUploadProgress(10);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 250);

    try {
      const finalUrl =
        submissionType === 'url'
          ? videoUrl.trim()
          : `https://storage.avlodtalim.uz/videos/${Date.now()}_${selectedFile?.name}`;

      setTimeout(async () => {
        clearInterval(interval);
        setUploadProgress(100);

        await teacherService.submitLessonVideo(selectedLessonId, finalUrl);
        setIsSubmitting(false);
        setSuccessMsg('Video muvaffaqiyatli topshirildi va O‘quv bo‘limi tekshiruviga yuborildi.');
        setVideoUrl('');
        setSelectedFile(null);
        setUploadProgress(0);
        await loadLessons();
      }, 1200);
    } catch (err: any) {
      clearInterval(interval);
      setIsSubmitting(false);
      setUploadProgress(0);
      setErrorMsg(err.message || 'Video yuborishda xatolik yuz berdi.');
    }
  };

  const currentSelectedLesson = lessons.find((l) => l.id === selectedLessonId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dars video hisoboti (Video Submission)</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Direktor nazorati
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dars sifati nazorati uchun o‘tilgan mashg‘ulot videosini O‘quv bo‘limi va Direktor tekshiruviga topshirish (Talabalarga ko‘rinmaydi)
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>🔒 Faqat Direktor tekshiruvi uchun (Studentlarga ko‘rinmaydi)</span>
        </div>
      </div>

      {/* Info notice about Director panel */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30 font-bold">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">
              Dars video hisoboti nima uchun kerak?
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Ushbu video hisobot o‘qituvchi darsni o‘tganligini tasdiqlash va dars metodikasi sifatini baholash uchun xizmat qiladi. U <strong>hech qachon talabalarga ko‘rinmaydi</strong>. Barcha hisobotlar to‘g‘ridan-to‘g‘ri <strong>Direktor paneliga</strong> yuboriladi va direktor tomonidan tasdiqlanadi.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Upload form (left) & Submission history (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload form container (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Yangi video hisobot topshirish
                </h3>
              </div>
            </div>

            {/* Notification messages */}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Select Lesson */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Mashg‘ulotni (Darsni) tanlang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.date} · {lesson.group_name} ({lesson.course_name}) — {lesson.topic || 'Dars'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submission Type Switcher */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Topshirish usuli:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionType('url')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                      submissionType === 'url'
                        ? 'border-cyan-500 bg-cyan-50/40 text-cyan-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-cyan-600" />
                    <div>
                      <div className="text-xs">Video Havola (URL)</div>
                      <div className="text-[10px] text-slate-500">Google Drive, YouTube (unlisted)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmissionType('file')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                      submissionType === 'file'
                        ? 'border-cyan-500 bg-cyan-50/40 text-cyan-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-cyan-600" />
                    <div>
                      <div className="text-xs">Fayl yuklash (Upload)</div>
                      <div className="text-[10px] text-slate-500">MP4, MOV (maks. 250MB)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* URL input */}
              {submissionType === 'url' ? (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Tasdiqlangan video havolasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... yoki https://youtu.be/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Havolada ko‘rish ruxsati (Anyone with the link) ochiq bo‘lishi lozim.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Video faylni tanlang <span className="text-rose-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-cyan-500 transition-colors">
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/mp4,video/quicktime,video/x-msvideo"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer block space-y-2">
                      <FileVideo className="w-8 h-8 text-cyan-600 mx-auto" />
                      <div className="font-semibold text-slate-800">
                        {selectedFile ? selectedFile.name : 'Faylni tanlash uchun bosing'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {selectedFile
                          ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB tanlandi`
                          : 'MP4, MOV (Maksimal 250 MB)'}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Progress bar if uploading */}
              {isSubmitting && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>Yuklanmoqda...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Yuborilmoqda...' : 'Video hisobotni topshirish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Video Submission Status List (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Video hisobotlar holati
              </h3>
            </div>

            <div className="p-4 divide-y divide-slate-100 space-y-3">
              {lessons.map((lesson) => {
                const status = lesson.video_status || 'not_submitted';

                return (
                  <div key={lesson.id} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{lesson.group_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {lesson.date} ({lesson.start_time})
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
                          status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'pending_review'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status === 'approved'
                          ? 'Tasdiqlangan'
                          : status === 'pending_review'
                          ? 'Kutilmoqda'
                          : status === 'rejected'
                          ? 'Rad etilgan'
                          : 'Topshirilmagan'}
                      </span>
                    </div>

                    {lesson.video_feedback && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-800">O‘quv bo‘limi fikri:</span>{' '}
                          {lesson.video_feedback}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
