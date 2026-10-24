import React from 'react';
import { Link } from 'react-router-dom';
import CopyButton from './CopyButton';

export default function AddressLink({
  address,
  truncate = true,
  chars = 4,
  isToken = false,
  showCopy = true,
  className = '',
}) {
  if (!address) return <span className="text-slate-500">None</span>;

  const display = truncate && address.length > chars * 2 + 3
    ? `${address.slice(0, chars)}...${address.slice(-chars)}`
    : address;

  const to = isToken ? `/token/${address}` : `/account/${address}`;

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm ${className}`}>
      <Link
        to={to}
        className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors truncate"
        title={address}
      >
        {display}
      </Link>
      {showCopy && <CopyButton text={address} />}
    </span>
  );
}
