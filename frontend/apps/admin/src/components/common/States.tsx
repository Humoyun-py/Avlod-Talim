import React from 'react';
import { Loader2, Inbox, AlertOctagon, RotateCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string; height?: string }> = ({
  message = 'Loading data from server...',
  height = 'h-64',
}) => (
  <div className={`flex flex-col items-center justify-center ${height} text-slate-500 w-full`}>
    <Loader2 className="w-7 h-7 text-slate-700 animate-spin mb-3" />
    <p className="text-xs font-medium text-slate-600">{message}</p>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = <Inbox className="w-8 h-8 text-slate-400" />,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto my-6">
    <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-500">{icon}</div>
    <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed mb-4">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Failed to load records',
  message = 'A server error occurred while retrieving information. Please retry or contact system administrator.',
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-6 bg-rose-50/50 border border-rose-100 rounded-xl">
    <div className="p-3 bg-rose-100 rounded-full mb-3 text-rose-600">
      <AlertOctagon className="w-7 h-7" />
    </div>
    <h4 className="text-sm font-semibold text-rose-950 mb-1">{title}</h4>
    <p className="text-xs text-rose-700 leading-relaxed mb-4">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors shadow-xs"
      >
        <RotateCw className="w-3.5 h-3.5" />
        Retry Request
      </button>
    )}
  </div>
);
