import React from 'react';
import { DollarSign, Activity, Zap, Layers, Server, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatsOverview({ stats, liveSlot }) {
  const tps = stats?.tps ?? null;
  const trueTps = stats?.trueTps ?? null;
  const solPrice = stats?.solPrice ?? null;
  const change = stats?.solPriceChange24h ?? null;
  const isPositive = change >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: SOL Price & Market Cap */}
      <div className="sol-card p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="font-medium uppercase tracking-wider">Solana Price</span>
          <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {change == null ? 'N/A' : `${isPositive ? '+' : ''}${change.toFixed(2)}%`}
          </span>
        </div>
        <div className="text-2xl font-extrabold text-white mb-2">
          {solPrice == null ? 'N/A' : `$${solPrice.toFixed(2)}`}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Market Cap</span>
          <span className="font-mono text-slate-200">
            {stats?.marketCap == null ? 'N/A' : `$${(stats.marketCap / 1e9).toFixed(2)}B`}
          </span>
        </div>
      </div>

      {/* Card 2: Live Network TPS */}
      <div className="sol-card p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="font-medium uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator"></span>
            Recent TPS Sample
          </span>
          <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded">
            ~400ms Block Time
          </span>
        </div>
        <div className="text-2xl font-extrabold text-white font-mono mb-2 flex items-baseline gap-2">
          <span>{tps == null ? 'N/A' : tps.toLocaleString()}</span>
          <span className="text-xs font-normal text-slate-400">tx/s</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Non-Vote TPS</span>
          <span className="font-mono text-emerald-400 font-semibold">{trueTps == null ? 'N/A' : `${trueTps.toLocaleString()} tx/s`}</span>
        </div>
      </div>

      {/* Card 3: Epoch & Progress Bar */}
      <div className="sol-card p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="font-medium uppercase tracking-wider">Epoch Progress</span>
          <span className="font-mono text-cyan-400 font-semibold">
            {stats?.epochProgress == null ? 'N/A' : `${stats.epochProgress}%`}
          </span>
        </div>
        <div className="text-2xl font-extrabold text-white font-mono mb-2">
          {stats?.currentEpoch == null ? 'N/A' : `#${stats.currentEpoch}`}
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-2.5 overflow-hidden">
          <div
            className="h-full rounded-full solana-gradient-bg transition-all duration-500"
            style={{ width: `${Math.min(stats?.epochProgress ?? 0, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Slot Index</span>
          <span className="font-mono text-slate-300">
            {stats?.slotIndex == null || stats?.slotsInEpoch == null ? 'N/A' : `${(stats.slotIndex / 1000).toFixed(1)}k / ${(stats.slotsInEpoch / 1000).toFixed(0)}k`}
          </span>
        </div>
      </div>

      {/* Card 4: Slot Height & Validators */}
      <div className="sol-card p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
        <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span className="font-medium uppercase tracking-wider">Current Slot</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Observed
          </span>
        </div>
        <div className="text-2xl font-extrabold text-white font-mono mb-2 truncate">
          {liveSlot?.slot ?? stats?.currentSlot ?? 'N/A'}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>Active Validators</span>
          <span className="font-mono text-slate-200">
            {stats?.validatorCount == null ? 'N/A' : `${stats.validatorCount.toLocaleString()} Nodes`}
          </span>
        </div>
      </div>
    </div>
  );
}
