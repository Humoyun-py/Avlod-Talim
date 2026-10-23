import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message: string) => addToast('success', title, message), [addToast]);
  const error = useCallback((title: string, message: string) => addToast('error', title, message), [addToast]);
  const warning = useCallback((title: string, message: string) => addToast('warning', title, message), [addToast]);
  const info = useCallback((title: string, message: string) => addToast('info', title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast viewport */}
      <div 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map(toast => {
          let borderClass = 'border-purple-200 bg-white';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          let titleColor = 'text-gray-900';

          if (toast.type === 'success') {
            borderClass = 'border-emerald-200 bg-emerald-50/90 text-emerald-900';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
            titleColor = 'text-emerald-950';
          } else if (toast.type === 'error') {
            borderClass = 'border-rose-200 bg-rose-50/90 text-rose-900';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
            titleColor = 'text-rose-950';
          } else if (toast.type === 'warning') {
            borderClass = 'border-amber-200 bg-amber-50/90 text-amber-900';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
            titleColor = 'text-amber-950';
          } else {
            borderClass = 'border-[#5C42FD]/20 bg-indigo-50/90 text-indigo-900';
            icon = <Info className="w-5 h-5 text-[#5C42FD] shrink-0" />;
            titleColor = 'text-indigo-950';
          }

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-black/5 backdrop-blur-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${borderClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${titleColor}`}>
                  {toast.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md"
                aria-label="Yopish"
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

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
