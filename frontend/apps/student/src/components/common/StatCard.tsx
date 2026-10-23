import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SubStat {
  label: string;
  value: string | number;
  highlight?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'gray';
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  subStats?: SubStat[];
  trend?: {
    value: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  subStats,
  trend,
  onClick,
  accentColor = '#5C42FD'
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-[#E9EAF3] hover:border-[#D5D7EE] transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              {value}
            </h3>
            {trend && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-rose-700 bg-rose-50'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          style={{ backgroundColor: `${accentColor}12`, color: accentColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subStats && subStats.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs">
          {subStats.map((stat, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-[11px] text-gray-500">{stat.label}</span>
              <span
                className={`font-semibold ${
                  stat.highlight === 'emerald'
                    ? 'text-emerald-600'
                    : stat.highlight === 'rose'
                    ? 'text-rose-600'
                    : stat.highlight === 'amber'
                    ? 'text-amber-600'
                    : stat.highlight === 'indigo'
                    ? 'text-[#5C42FD]'
                    : 'text-gray-900'
                }`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
