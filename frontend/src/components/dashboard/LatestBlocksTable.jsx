import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import AddressLink from '../common/AddressLink';
import LoadingSkeleton from '../common/LoadingSkeleton';
import api from '../../api/client';
import { useNetwork } from '../../context/NetworkContext';

export default function LatestBlocksTable({ liveBlock }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { network } = useNetwork();

  useEffect(() => {
    let mounted = true;
    const fetchBlocks = async () => {
      try {
        const res = await api.get(`/blocks?limit=10&network=${network}`);
        if (mounted && res.success && res.data) {
          setBlocks(res.data);
        }
      } catch (err) {
        console.warn('Failed to load blocks', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBlocks();
    return () => {
      mounted = false;
    };
  }, [network]);

  // Handle incoming live block from Socket.io
  useEffect(() => {
    if (liveBlock) {
      setBlocks((prev) => {
        const exists = prev.some((b) => b.slot === liveBlock.slot);
        if (exists) return prev;
        return [liveBlock, ...prev.slice(0, 9)];
      });
    }
  }, [liveBlock]);

  return (
    <div className="sol-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Latest Blocks</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator ml-1"></span>
        </div>
        <Link
          to="/blocks"
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                <th className="py-2.5 px-3">Slot</th>
                <th className="py-2.5 px-3">Leader</th>
                <th className="py-2.5 px-3 text-right">Txns</th>
                <th className="py-2.5 px-3 text-right">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {blocks.map((block) => (
                <tr
                  key={block.slot}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-2.5 px-3">
                    <Link
                      to={`/block/${block.slot}`}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      {block.slot.toLocaleString()}
                    </Link>
                    <div className="text-[10px] text-slate-500 font-sans mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        {block.blockTime ? new Date(block.blockTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        }) : 'Unavailable'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <AddressLink address={block.leader} chars={5} />
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200">
                    {block.txCount?.toLocaleString() ?? 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    {block.reward == null ? 'N/A' : `+${Number(block.reward).toFixed(4)} SOL`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
