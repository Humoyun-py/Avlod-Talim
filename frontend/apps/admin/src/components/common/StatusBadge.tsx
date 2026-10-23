import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  XCircle,
  Truck,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'payment' | 'account' | 'verification' | 'order' | 'general';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general' }) => {
  const norm = (status || '').toLowerCase();

  // Payment statuses
  if (type === 'payment' || norm === 'paid' || norm === 'partially_paid' || norm === 'unpaid' || norm === 'restricted') {
    switch (norm) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Paid</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Partial</span>
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Unpaid</span>
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Restricted</span>
          </span>
        );
      default:
        break;
    }
  }

  // Account statuses
  if (type === 'account' || norm === 'active' || norm === 'deactivated') {
    switch (norm) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Active</span>
          </span>
        );
      case 'restricted':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Restricted</span>
          </span>
        );
      case 'deactivated':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Deactivated</span>
          </span>
        );
      default:
        break;
    }
  }

  // Verification statuses
  if (type === 'verification' || norm === 'pending' || norm === 'approved' || norm === 'rejected') {
    switch (norm) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pending Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Approved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Rejected</span>
          </span>
        );
      default:
        break;
    }
  }

  // Order statuses
  switch (norm) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Pending</span>
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>Approved</span>
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700">
          <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Processing</span>
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
          <PackageCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Ready for Pickup</span>
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Completed</span>
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Rejected</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 capitalize">
          <span>{status}</span>
        </span>
      );
  }
};
