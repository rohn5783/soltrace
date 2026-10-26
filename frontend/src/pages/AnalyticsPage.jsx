import React from 'react';
import {
  Activity,
  Zap,
  Server,
  Layers,
  Clock,
  ShieldCheck,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import TpsChart from '../components/dashboard/TpsChart';
import { useNetwork } from '../context/NetworkContext';

export default function AnalyticsPage() {
  const { network, networkStats } = useNetwork();
  const stats = networkStats?.network === network ? networkStats : null;

  const currentTps = stats?.tps ?? null;
  const trueTps = stats?.trueTps ?? null;
  const voteTps = currentTps != null && trueTps != null ? currentTps - trueTps : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-400" />
          Solana Network Telemetry & Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep diagnostic metrics, throughput rates, validator performance, and cluster health
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total TPS */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Network Throughput
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            {currentTps == null ? 'N/A' : `${currentTps.toLocaleString()} TPS`}
          </div>
          <span className="text-xs text-emerald-400">Total raw blockchain TPS</span>
        </div>

        {/* True Execution TPS */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Non-Vote Transactions
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            {trueTps == null ? 'N/A' : `${trueTps.toLocaleString()} TPS`}
          </div>
          <span className="text-xs text-purple-400">RPC-reported non-vote transactions</span>
        </div>

        {/* Average Slot Time */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Slot Duration
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            N/A
          </div>
          <span className="text-xs text-cyan-400">Slot duration is unavailable from this RPC sample</span>
        </div>

        {/* Total Processed Txs */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            All-Time Transactions
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1 truncate">
            {stats?.totalTransactions == null ? 'N/A' : `${(stats.totalTransactions / 1e9).toFixed(1)}B`}
          </div>
          <span className="text-xs text-slate-400">Confirmed since Genesis</span>
        </div>
      </div>

      {/* TPS History Chart */}
      <section>
        <TpsChart />
      </section>

      {/* Cluster Health & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Types Breakdown */}
        <div className="sol-card p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            TPS Execution Composition
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Consensus Voting Txns</span>
                <span className="font-mono text-purple-400">
                  {voteTps == null || !currentTps ? 'N/A' : `${voteTps.toLocaleString()} TPS (${Math.round((voteTps / currentTps) * 100)}%)`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${voteTps == null || !currentTps ? 0 : (voteTps / currentTps) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Non-Vote Transactions</span>
                <span className="font-mono text-emerald-400">
                  {trueTps == null || !currentTps ? 'N/A' : `${trueTps.toLocaleString()} TPS (${Math.round((trueTps / currentTps) * 100)}%)`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-400 h-2 rounded-full"
                  style={{ width: `${trueTps == null || !currentTps ? 0 : (trueTps / currentTps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Validator Infrastructure */}
        <div className="sol-card p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Validator Decentralization
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090d18] border border-slate-800">
              <span className="text-slate-400">Active Consensus Nodes</span>
              <span className="font-mono text-slate-100 font-bold">N/A</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090d18] border border-slate-800">
              <span className="text-slate-400">Nakamoto Coefficient</span>
              <span className="font-mono text-emerald-400 font-bold">N/A</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090d18] border border-slate-800">
              <span className="text-slate-400">Staked SOL Supply</span>
              <span className="font-mono text-slate-100 font-bold">N/A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
