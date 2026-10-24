import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ status = 'Success', showIcon = true }) {
  const isSuccess = status === 'Success' || status === true;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
        isSuccess
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }`}
    >
      {showIcon && (
        isSuccess ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        )
      )}
      {isSuccess ? 'Success' : 'Failed'}
    </span>
  );
}
