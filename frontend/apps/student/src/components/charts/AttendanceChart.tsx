import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const AttendanceChart: React.FC = () => {
  const { t, language } = useLanguage();
  // 88% Present, 7% Absent, 5% Late
  const present = 88;
  const absent = 7;
  const late = 5;

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const presentStroke = (present / 100) * circumference;
  const absentStroke = (absent / 100) * circumference;
  const lateStroke = (late / 100) * circumference;

  const absentOffset = circumference - presentStroke;
  const lateOffset = absentOffset - absentStroke;

  const labels = {
    present: language === 'uz' ? 'Darsga kelgan' : language === 'ru' ? 'Присутствовали' : 'Present',
    absent: language === 'uz' ? 'Sababsiz kelmagan' : language === 'ru' ? 'Отсутствовали' : 'Absent',
    late: language === 'uz' ? 'Kechikkan' : language === 'ru' ? 'Опоздали' : 'Late',
    disciplineLabel: language === 'uz' ? 'O‘rtacha dars intizomi:' : language === 'ru' ? 'Средняя дисциплина:' : 'Average discipline:',
    disciplineValue: language === 'uz' ? 'A’lo (Yuqori barqaror)' : language === 'ru' ? 'Отлично (Высокая)' : 'Excellent (High)',
    attendanceRate: language === 'uz' ? 'Davomat' : language === 'ru' ? 'Посещаемость' : 'Attendance'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E9EAF3] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold text-gray-900">
            {t('charts.attendance_title')}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t('charts.attendance_sub')}
        </p>
      </div>

      <div className="my-4 flex flex-col sm:flex-row items-center justify-around gap-4">
        {/* Donut SVG */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F0F1F7"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Present (Emerald) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#10B981"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${presentStroke} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Absent (Rose) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F43F5E"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${absentStroke} ${circumference}`}
              strokeDashoffset={-presentStroke}
            />
            {/* Late (Amber) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F59E0B"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${lateStroke} ${circumference}`}
              strokeDashoffset={-(presentStroke + absentStroke)}
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900">88%</span>
            <span className="text-[10px] uppercase font-bold text-gray-400">{labels.attendanceRate}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-gray-600">{labels.present}</span>
            </div>
            <span className="font-bold text-gray-900">{present}%</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-gray-600">{labels.absent}</span>
            </div>
            <span className="font-bold text-gray-900">{absent}%</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-gray-600">{labels.late}</span>
            </div>
            <span className="font-bold text-gray-900">{late}%</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{labels.disciplineLabel}</span>
        <span className="font-bold text-emerald-600">{labels.disciplineValue}</span>
      </div>
    </div>
  );
};
