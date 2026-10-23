import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  footer
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with explicit z-0 and safe dark overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity z-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container with relative z-10 so it's strictly above backdrop */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6 text-center pointer-events-none">
        <div
          className={`pointer-events-auto w-full ${maxWidthClasses} overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl border border-gray-200/80 flex flex-col max-h-[92vh] transition-all`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-colors cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 text-gray-800 bg-white">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-4 bg-[#FAF9FD] border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 z-20">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
