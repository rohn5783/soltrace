import React from 'react';
import { Link } from 'react-router-dom';
import CopyButton from './CopyButton';

export default function TxLink({
  signature,
  truncate = true,
  chars = 6,
  showCopy = true,
  className = '',
}) {
  if (!signature) return <span className="text-slate-500">Unknown</span>;

  const display = truncate && signature.length > chars * 2 + 3
    ? `${signature.slice(0, chars)}...${signature.slice(-chars)}`
    : signature;

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm ${className}`}>
      <Link
        to={`/tx/${signature}`}
        className="text-purple-400 hover:text-purple-300 hover:underline transition-colors truncate"
        title={signature}
      >
        {display}
      </Link>
      {showCopy && <CopyButton text={signature} />}
    </span>
  );
}
