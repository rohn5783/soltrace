import React from 'react';

export default function LoadingSkeleton({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 bg-slate-800/40 border border-slate-800/60 rounded-lg w-full flex items-center px-4 gap-4"
        >
          <div className="h-4 bg-slate-700/50 rounded w-24"></div>
          <div className="h-4 bg-slate-700/50 rounded w-48 hidden sm:block"></div>
          <div className="h-4 bg-slate-700/50 rounded w-32 ml-auto"></div>
        </div>
      ))}
    </div>
  );
}
