import React from 'react';
import { X, QrCode, ExternalLink } from 'lucide-react';
import CopyButton from './CopyButton';

export default function QrModal({ isOpen, onClose, title = 'Solana Address', address = '' }) {
  if (!isOpen || !address) return null;

  // Generate QR code image URL from standard safe API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(address)}&color=ffffff&bgcolor=0f172a`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f172a] border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-lg">
            <QrCode className="w-5 h-5 text-cyan-400" />
            {title}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#080d1a] border border-slate-800 p-4 rounded-xl flex items-center justify-center mx-auto mb-4 w-60 h-60">
          <img
            src={qrUrl}
            alt="Solana Address QR Code"
            className="w-52 h-52 rounded-lg"
          />
        </div>

        <p className="text-xs text-slate-400 mb-3">Scan with Phantom, Solflare or any Solana wallet</p>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-left mb-3">
          <span className="font-mono text-xs text-slate-300 truncate mr-2">{address}</span>
          <CopyButton text={address} label="" />
        </div>

        <a
          href={`solana:${address}`}
          className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-colors"
        >
          <span>Open in Mobile Wallet</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
