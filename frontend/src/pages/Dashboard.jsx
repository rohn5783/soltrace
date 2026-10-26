import React from 'react';
import { Layers, Hash, Coins, Activity, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import SearchBar from '../components/layout/SearchBar';
import StatsOverview from '../components/dashboard/StatsOverview';
import TpsChart from '../components/dashboard/TpsChart';
import LatestBlocksTable from '../components/dashboard/LatestBlocksTable';
import LatestTransactionsTable from '../components/dashboard/LatestTransactionsTable';
import { useNetwork } from '../context/NetworkContext';

export default function Dashboard() {
  const { network, liveBlock, liveSlot, networkStats } = useNetwork();
  const stats = networkStats?.network === network ? networkStats : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#10172a] via-[#0b101e] to-[#080c16] border border-slate-800/90 p-8 md:p-12 shadow-2xl">
        {/* Glowing background orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Solana High-Speed Block Explorer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Explore the <span className="solana-gradient-text">Solana Ecosystem</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Inspect real-time transactions, verified blocks, token accounts, and deep on-chain program telemetry across Solana clusters.
          </p>

          {/* Universal Hero Search Bar */}
          <div className="pt-2">
            <SearchBar isHero={true} />
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
            <span className="text-slate-400 font-medium">Trending SPL Tokens:</span>
            <a href="/token/So11111111111111111111111111111111111111112" className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors">SOL</a>
            <a href="/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors">USDC</a>
            <a href="/token/JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors">JUP</a>
            <a href="/token/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors">BONK</a>
          </div>
        </div>
      </section>

      {/* Network Stats KPI Cards */}
      <section>
        <StatsOverview stats={stats} liveSlot={liveSlot?.network === network ? liveSlot : null} />
      </section>

      {/* 24h TPS Performance Chart */}
      <section>
        <TpsChart />
      </section>

      {/* Side-by-Side Real-Time Feeds: Latest Blocks & Latest Transactions */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatestBlocksTable liveBlock={liveBlock} />
        <LatestTransactionsTable />
      </section>
    </div>
  );
}
