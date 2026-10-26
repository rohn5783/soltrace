import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Activity, BarChart2, Zap } from 'lucide-react';
import api from '../../api/client';

export default function TpsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('both'); // 'total', 'true', 'both'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/stats/tps-chart');
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('TPS chart fetch fallback', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b101d] border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="text-slate-400 font-medium mb-1">{label}</p>
          <div className="flex items-center gap-2 text-purple-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Total TPS:</span>
            <span className="font-bold text-slate-100">{payload[0]?.value?.toLocaleString()}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center gap-2 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>True TPS:</span>
              <span className="font-bold text-slate-100">{payload[1]?.value?.toLocaleString()}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sol-card p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            Historical Solana Network TPS
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical samples are unavailable until Soltrace stores a trusted metrics history
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#090d18] border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setMode('both')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              mode === 'both' ? 'bg-purple-600/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setMode('true')}
            className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
              mode === 'true' ? 'bg-emerald-600/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            True TPS Only
          </button>
        </div>
      </div>

      {!loading && data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-500">No historical performance samples are available.</div>
      ) : <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9945FF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#9945FF" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14F195" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#14F195" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2538" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
            <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            {(mode === 'both' || mode === 'total') && (
              <Area
                type="monotone"
                dataKey="tps"
                stroke="#9945FF"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#purpleGrad)"
                name="Total TPS"
              />
            )}
            {(mode === 'both' || mode === 'true') && (
              <Area
                type="monotone"
                dataKey="trueTps"
                stroke="#14F195"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#emeraldGrad)"
                name="True TPS"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>}
    </div>
  );
}
