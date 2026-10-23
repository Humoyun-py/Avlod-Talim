import React from 'react';
import { MONTHLY_REVENUE_CHART_DATA } from '../../data/mockData';
import { Users, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const StudentsGrowthChart: React.FC = () => {
  const { t } = useLanguage();
  const data = MONTHLY_REVENUE_CHART_DATA.slice(-7);
  const maxVal = Math.max(...data.map(d => d.students)) * 1.2;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E9EAF3] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#5C42FD]/10 text-[#5C42FD]">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-gray-900">
              {t('charts.growth_title')}
            </h3>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            <ArrowUpRight className="w-3.5 h-3.5" /> +18.2%
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t('charts.growth_sub')}
        </p>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2.5 h-44 pt-4 border-b border-gray-100">
        {data.map((item, idx) => {
          const heightPercent = Math.round((item.students / maxVal) * 100);
          const isLatest = idx === data.length - 1;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
              <span className="text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.students}
              </span>
              <div className="w-full bg-[#F3F2FD] rounded-xl h-36 flex items-end overflow-hidden p-1">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-lg transition-all duration-300 group-hover:scale-y-105 ${
                    isLatest
                      ? 'bg-gradient-to-t from-[#5C42FD] to-[#806BFE]'
                      : 'bg-[#5C42FD]/40 group-hover:bg-[#5C42FD]/70'
                  }`}
                />
              </div>
              <span className={`text-[10px] font-semibold ${isLatest ? 'text-[#5C42FD]' : 'text-gray-400'}`}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>{t('charts.active_students_total')}</span>
        <span className="font-bold text-gray-900 text-sm">294 {t('common.students_count_suffix')}</span>
      </div>
    </div>
  );
};
