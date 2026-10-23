import React, { useState } from 'react';
import { X, CheckCircle2, BookOpen, FileText, AlertCircle } from 'lucide-react';
import { Lesson } from '../../types';
import { teacherService } from '../../services/teacherService';

interface Props {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (updatedLesson: Lesson) => void;
}

export const CompleteLessonModal: React.FC<Props> = ({
  lesson,
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [topic, setTopic] = useState(lesson?.topic || '');
  const [summary, setSummary] = useState(lesson?.summary || '');
  const [coveredMaterial, setCoveredMaterial] = useState(lesson?.covered_material || '');
  const [homeworkAssigned, setHomeworkAssigned] = useState(lesson?.homework_assigned || '');
  const [additionalNotes, setAdditionalNotes] = useState(lesson?.additional_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!topic.trim()) {
      setError('Dars mavzusi (Topic) kiritilishi shart.');
      return;
    }
    if (!summary.trim()) {
      setError('Darsning qisqacha mazmuni (Summary) kiritilishi shart.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await teacherService.completeLesson(lesson.id, {
        topic: topic.trim(),
        summary: summary.trim(),
        covered_material: coveredMaterial.trim(),
        homework_assigned: homeworkAssigned.trim(),
        additional_notes: additionalNotes.trim(),
      });
      setIsSubmitting(false);
      onCompleted(updated);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Darsni yakunlashda xatolik yuz berdi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold">Darsni Yakunlash va Hisobot Yuborish</h3>
              <p className="text-xs text-slate-400 font-mono">
                {lesson.group_name} · {lesson.date} ({lesson.start_time} - {lesson.end_time})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Dars mavzusi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="masalan: Django REST Framework: ModelSerializer va APIView"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Dars mazmuni & xulosasi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Darsda o‘rganilgan asosiy konseptsiyalar va amaliy mashqlar..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              O‘tilgan materiallar va havola resurslar
            </label>
            <input
              type="text"
              value={coveredMaterial}
              onChange={(e) => setCoveredMaterial(e.target.value)}
              placeholder="GitHub repo havolasi, taqdimot yoki hujjatlar"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Berilgan uy vazifasi
            </label>
            <input
              type="text"
              value={homeworkAssigned}
              onChange={(e) => setHomeworkAssigned(e.target.value)}
              placeholder="Vazifa nomi yoki talablari"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Qo‘shimcha eslatmalar (Direktor & O‘quv bo‘limi uchun)
            </label>
            <textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Talabalar faolligi, kechikishlar yoki xona texnik jihozlari haqida fikr..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-xs"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saqlanmoqda...' : 'Darsni yakunlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
