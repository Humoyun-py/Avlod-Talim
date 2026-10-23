import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2, Info, LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success' | 'info';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'primary',
  icon: CustomIcon,
  isLoading = false
}) => {
  const { t } = useLanguage();
  const effectiveConfirmText = confirmText ?? t('common.confirm');
  const effectiveCancelText = cancelText ?? t('common.cancel');
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
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
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Determine theme and default icon based on variant
  let iconContainerClass = 'bg-[#5C42FD]/10 text-[#5C42FD]';
  let confirmBtnClass = 'bg-[#5C42FD] hover:bg-[#4d33eb] shadow-[#5C42FD]/20';
  let DefaultIcon: LucideIcon = CheckCircle2;

  if (variant === 'danger') {
    iconContainerClass = 'bg-rose-50 text-rose-600';
    confirmBtnClass = 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20';
    DefaultIcon = Trash2;
  } else if (variant === 'warning') {
    iconContainerClass = 'bg-amber-50 text-amber-600';
    confirmBtnClass = 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20';
    DefaultIcon = AlertTriangle;
  } else if (variant === 'success') {
    iconContainerClass = 'bg-emerald-50 text-emerald-600';
    confirmBtnClass = 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
    DefaultIcon = CheckCircle2;
  } else if (variant === 'info') {
    iconContainerClass = 'bg-sky-50 text-sky-600';
    confirmBtnClass = 'bg-[#5C42FD] hover:bg-[#4d33eb] shadow-[#5C42FD]/20';
    DefaultIcon = Info;
  }

  const RenderedIcon = CustomIcon || DefaultIcon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity z-0"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 text-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl border border-gray-200/80 transition-all animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${iconContainerClass}`}>
              <RenderedIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-snug">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={() => {
                if (!isLoading) onClose();
              }}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer transition-colors"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              {effectiveCancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              disabled={isLoading}
              className={`px-4 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${confirmBtnClass}`}
            >
              {isLoading ? t('common.loading') : effectiveConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
