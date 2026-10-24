import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Heart, Terminal, Database, Server } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050811] border-t border-slate-800/80 text-slate-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-400 p-0.5">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[6px] flex items-center justify-center font-bold text-white text-xs">
                  S
                </div>
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Sol<span className="solana-gradient-text">Trace</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Soltrace is the premier blockchain explorer and real-time data analytics suite for the Solana high-performance decentralized network.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-indicator"></span>
              <span>All Solana Clusters Operational</span>
            </div>
          </div>

          {/* Col 2: Explorer */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 text-xs tracking-wider uppercase">
              Blockchain Explorer
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/txs" className="hover:text-cyan-400 transition-colors">
                  Solana Transactions
                </Link>
              </li>
              <li>
                <Link to="/blocks" className="hover:text-cyan-400 transition-colors">
                  Confirmed Blocks & Slots
                </Link>
              </li>
              <li>
                <Link to="/tokens" className="hover:text-cyan-400 transition-colors">
                  SPL Tokens & Market Caps
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-cyan-400 transition-colors">
                  TPS & Network Analytics
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-cyan-400 transition-colors">
                  Tracked Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture / Tech */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 text-xs tracking-wider uppercase">
              Full MERN Stack
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>MongoDB & Mongoose Store</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>Express & Node.js Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>React 19 & Tailwind Modern UI</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>@solana/web3.js RPC Bridge</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Solana Ecosystem */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 text-xs tracking-wider uppercase">
              Ecosystem Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://solana.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Solana Official</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://jup.ag"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Jupiter Aggregator</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://raydium.io"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Raydium Protocol</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://spl.solana.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Solana Program Library (SPL)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Soltrace — Solana Blockchain Explorer. Engineered with high-performance MERN & Solana Web3.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">API v2.0 Docs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
