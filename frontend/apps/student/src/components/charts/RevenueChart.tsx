import React, { useState } from 'react';
import { MONTHLY_REVENUE_CHART_DATA } from '../../data/mockData';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const RevenueChart: React.FC = () => {
  const { t } = useLanguage();
  const [activeRange, setActiveRange] = useState<'all' | '6m'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const data = activeRange === '6m' ? MONTHLY_REVENUE_CHART_DATA.slice(-6) : MONTHLY_REVENUE_CHART_DATA;

  const maxRevenue = Math.max(...data.map(d => d.revenue)) * 1.15;
  const minRevenue = 100000000;

  const svgWidth = 640;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (index: number) => paddingX + (index / (data.length - 1)) * (svgWidth - paddingX * 2);
  const getY = (val: number) => svgHeight - paddingY - ((val - minRevenue) / (maxRevenue - minRevenue)) * (svgHeight - paddingY * 2);

  // Generate smooth line path
  const points = data.map((d, i) => `${getX(i)},${getY(d.revenue)}`);
  const linePath = points.reduce((acc, point, i) => (i === 0 ? `M ${point}` : `${acc} L ${point}`), '');
  const areaPath = `${linePath} L ${getX(data.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;

  const formatUzSum = (val: number) => {
    return (val / 1000000).toFixed(0) + ' mln';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E9EAF3] shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#5C42FD]/10 text-[#5C42FD]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-gray-900">
              {t('charts.revenue_title')}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('charts.revenue_sub')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#F8F8FC] p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveRange('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeRange === 'all'
                  ? 'bg-white text-[#5C42FD] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t('charts.yearly')}
            </button>
            <button
              type="button"
              onClick={() => setActiveRange('6m')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeRange === '6m'
                  ? 'bg-white text-[#5C42FD] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t('charts.six_months')}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5C42FD" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5C42FD" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + ratio * (svgHeight - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="#F0F1F7"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#revenueGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#5C42FD"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.revenue);
            const isHovered = hoveredPoint === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 4.5}
                  fill="#FFFFFF"
                  stroke="#5C42FD"
                  strokeWidth="3"
                  className="transition-all duration-150"
                />

                {/* X labels */}
                <text
                  x={cx}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-400 font-semibold"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Tooltip Card */}
        {hoveredPoint !== null && (
          <div
            className="absolute top-2 right-4 bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="font-bold text-gray-200">
              {data[hoveredPoint].month} oyi tushumi
            </div>
            <div className="text-base font-extrabold text-[#9F8EFF] mt-0.5">
              {(data[hoveredPoint].revenue).toLocaleString()} so‘m
            </div>
            <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between gap-3">
              <span>Faol talabalar: {data[hoveredPoint].students} ta</span>
              <span className="text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +12.4%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#5C42FD]"></span>
          <span className="font-medium text-gray-700">Umumiy to‘lovlar (UZS)</span>
        </div>
        <div className="font-semibold text-gray-900">
          Shu oy (Oktyabr): <span className="text-[#5C42FD]">284,000,000 so‘m</span>
        </div>
      </div>
    </div>
  );
};
