import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E9EAF3] overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-6 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3.5 bg-gray-200 rounded-md flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-5 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="h-4 bg-gray-100 rounded-md flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-[#E9EAF3] animate-pulse space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
          </div>
          <div className="h-3 bg-gray-100 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};
