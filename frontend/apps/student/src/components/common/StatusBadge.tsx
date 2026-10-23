import React from 'react';
import { Ban, Clock, AlertCircle } from 'lucide-react';
import { PaymentStatus, UserStatus, OrderStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  status: UserStatus | PaymentStatus | OrderStatus | 'in_stock' | 'low_stock' | 'out_of_stock' | 'active' | 'inactive' | 'archived' | 'planned' | 'processing';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useLanguage();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const getLabel = () => {
    switch (status) {
      case 'active':
        return t('status.active');
      case 'inactive':
        return t('status.inactive');
      case 'paid':
        return t('status.paid');
      case 'pending':
      case 'Pending':
        return t('status.pending');
      case 'overdue':
        return t('status.overdue');
      case 'blocked':
        return t('status.blocked');
      case 'Completed':
        return t('status.completed');
      case 'Accepted':
        return t('status.accepted');
      case 'Rejected':
        return t('status.rejected');
      case 'in_stock':
        return t('status.in_stock');
      case 'low_stock':
        return t('status.low_stock');
      case 'out_of_stock':
        return t('status.out_of_stock');
      case 'archived':
        return t('status.archived');
      case 'processing':
        return t('status.processing');
      case 'planned':
        return t('status.planned');
      default:
        return status;
    }
  };

  switch (status) {
    case 'active':
    case 'paid':
    case 'Accepted':
    case 'Completed':
    case 'in_stock':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{getLabel()}</span>
        </span>
      );

    case 'inactive':
    case 'blocked':
    case 'Rejected':
    case 'archived':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200 ${sizeClasses}`}>
          <Ban className="w-3 h-3 text-gray-500" />
          <span>{getLabel()}</span>
        </span>
      );

    case 'pending':
    case 'Pending':
    case 'processing':
    case 'planned':
    case 'low_stock':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{getLabel()}</span>
        </span>
      );

    case 'overdue':
    case 'out_of_stock':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 ${sizeClasses}`}>
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>{getLabel()}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-gray-100 text-gray-700 ${sizeClasses}`}>
          {getLabel()}
        </span>
      );
  }
};
