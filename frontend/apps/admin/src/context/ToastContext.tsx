import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, title?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: Toast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {/* Toast viewport container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          let borderClass = 'border-slate-200 bg-white text-slate-800';
          let icon = <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;

          if (toast.type === 'success') {
            borderClass = 'border-emerald-200 bg-white text-slate-900';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
          } else if (toast.type === 'error') {
            borderClass = 'border-rose-200 bg-white text-slate-900';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
          } else if (toast.type === 'warning') {
            borderClass = 'border-amber-200 bg-white text-slate-900';
            icon = <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all duration-200 ${borderClass}`}
              role="alert"
            >
              {icon}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-semibold tracking-tight text-slate-900 mb-0.5">{toast.title}</h4>
                )}
                <p className="text-xs text-slate-600 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors rounded"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
