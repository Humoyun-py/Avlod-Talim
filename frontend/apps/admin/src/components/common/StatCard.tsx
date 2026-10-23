import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  accentColor?: 'navy' | 'emerald' | 'amber' | 'indigo' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick,
  accentColor = 'navy',
}) => {
  const colorMap = {
    navy: 'bg-slate-100 text-slate-800',
    emerald: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-800',
    indigo: 'bg-indigo-50 text-indigo-800',
    rose: 'bg-rose-50 text-rose-800',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl bg-white border border-slate-200/90 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${colorMap[accentColor]}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-medium tabular-nums ml-auto ${
                trend.isPositive ? 'text-emerald-700' : 'text-slate-600'
              }`}
            >
              {trend.value} {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
