import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Search, RefreshCw, Clock } from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import CopyButton from '../components/common/CopyButton';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../api/client';
import { useNetwork } from '../context/NetworkContext';

export default function BlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchSlot, setSearchSlot] = useState('');
  const { network } = useNetwork();

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/blocks?limit=30&network=${network}`);
      if (res.success && res.data) {
        setBlocks(res.data);
      }
    } catch (err) {
      console.warn('Failed to load blocks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [network]);

  const filteredBlocks = searchSlot.trim()
    ? blocks.filter((b) => String(b.slot).includes(searchSlot.trim()))
    : blocks;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            Solana Confirmed Blocks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse newly committed blocks, validators, and slot production on {network}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by slot..."
              value={searchSlot}
              onChange={(e) => setSearchSlot(e.target.value)}
              className="bg-[#0f172a] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={fetchBlocks}
            className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh blocks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Blocks Table Card */}
      <div className="sol-card p-5">
        {loading ? (
          <LoadingSkeleton rows={10} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-3">
                  <th className="py-3 px-3">Slot</th>
                  <th className="py-3 px-3">Blockhash</th>
                  <th className="py-3 px-3">Leader</th>
                  <th className="py-3 px-3 text-right">Txns</th>
                  <th className="py-3 px-3 text-right">Reward</th>
                  <th className="py-3 px-3 text-right font-sans">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBlocks.map((block) => (
                  <tr key={block.slot} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        to={`/block/${block.slot}`}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        #{block.slot.toLocaleString()}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="truncate inline-block max-w-[120px]" title={block.blockhash}>
                        {block.blockhash.slice(0, 6)}...{block.blockhash.slice(-6)}
                      </span>
                      <CopyButton text={block.blockhash} />
                    </td>
                    <td className="py-3 px-3">
                      <AddressLink address={block.leader} chars={5} />
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200">
                      {block.txCount?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400">
                      +{Number(block.reward || 0.025).toFixed(4)} SOL
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 font-sans">
                      <div className="flex items-center justify-end gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(block.blockTime).toLocaleTimeString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
