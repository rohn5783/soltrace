import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ status = 'Success', showIcon = true }) {
  const isUnavailable = status === 'Unavailable' || status == null;
  const isSuccess = status === 'Success' || status === true;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
        isUnavailable
          ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          : isSuccess
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }`}
    >
      {showIcon && (
        isUnavailable ? null : isSuccess ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )
      )}
      {isUnavailable ? 'Unavailable' : isSuccess ? 'Success' : 'Failed'}
    </span>
  );
}
