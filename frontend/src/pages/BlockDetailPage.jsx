import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ChevronLeft, ChevronRight, Clock, Award, CheckCircle2, Copy } from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import TxLink from '../components/common/TxLink';
import StatusBadge from '../components/common/StatusBadge';
import CopyButton from '../components/common/CopyButton';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../api/client';
import { useNetwork } from '../context/NetworkContext';

export default function BlockDetailPage() {
  const { slot } = useParams();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { network } = useNetwork();

  const slotNum = parseInt(slot, 10);

  useEffect(() => {
    let mounted = true;
    const fetchBlock = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/blocks/${slot}?network=${network}`);
        if (mounted && res.success && res.data) {
          setBlock(res.data);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Block not found');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBlock();
    return () => {
      mounted = false;
    };
  }, [slot, network]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-48 animate-pulse"></div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="sol-card p-12 text-center space-y-4">
        <Layers className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Block #{slot} Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The requested slot might still be processing or has not been confirmed yet on {network}.
        </p>
        <Link
          to="/blocks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
        >
          Back to Blocks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Block Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                Block #{block.slot.toLocaleString()}
              </h1>
              <span className="sol-badge sol-badge-success">Finalized</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirmed on Solana {network}
            </p>
          </div>
        </div>

        {/* Previous & Next Slot Nav */}
        <div className="flex items-center gap-2">
          <Link
            to={`/block/${slotNum - 1}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Slot</span>
          </Link>
          <Link
            to={`/block/${slotNum + 1}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>Next Slot</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Overview Card */}
      <div className="sol-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-3">
          Block Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Blockhash */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Blockhash</span>
            <div className="font-mono text-slate-200 flex items-center gap-1 bg-[#090d18] p-2 rounded-lg border border-slate-800">
              <span className="truncate">{block.blockhash}</span>
              <CopyButton text={block.blockhash} />
            </div>
          </div>

          {/* Previous Blockhash */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Previous Blockhash</span>
            <div className="font-mono text-slate-200 flex items-center gap-1 bg-[#090d18] p-2 rounded-lg border border-slate-800">
              <span className="truncate">{block.previousBlockhash || 'N/A'}</span>
              {block.previousBlockhash && <CopyButton text={block.previousBlockhash} />}
            </div>
          </div>

          {/* Leader Validator */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Leader Validator</span>
            <div className="p-2 rounded-lg bg-[#090d18] border border-slate-800">
              <AddressLink address={block.leader} chars={8} />
            </div>
          </div>

          {/* Timestamp */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Block Time</span>
            <div className="p-2 rounded-lg bg-[#090d18] border border-slate-800 text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{new Date(block.blockTime).toUTCString()}</span>
            </div>
          </div>

          {/* Transactions Count */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Total Transactions</span>
            <div className="p-2 rounded-lg bg-[#090d18] border border-slate-800 text-slate-200 font-mono font-semibold flex items-center justify-between">
              <span>{block.txCount?.toLocaleString()} txs</span>
              <span className="text-emerald-400 text-[11px] font-sans font-normal">
                {block.successfulTxCount} successful
              </span>
            </div>
          </div>

          {/* Block Reward */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Block Reward & Fees</span>
            <div className="p-2 rounded-lg bg-[#090d18] border border-slate-800 text-emerald-400 font-mono font-semibold">
              +{Number(block.reward || 0.024).toFixed(4)} SOL
            </div>
          </div>
        </div>
      </div>

      {/* Block Transactions List */}
      <div className="sol-card p-6">
        <h3 className="text-sm font-bold text-white mb-4">
          Transactions in Block ({block.transactions?.length || 0})
        </h3>

        {(!block.transactions || block.transactions.length === 0) ? (
          <p className="text-xs text-slate-500 italic">No transactions listed for this block.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-2">
                  <th className="py-2.5 px-3">Transaction Signature</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Signer</th>
                  <th className="py-2.5 px-3 text-right">Fee (SOL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {block.transactions.map((tx) => (
                  <tr key={tx.signature} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <TxLink signature={tx.signature} chars={8} />
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-2.5 px-3">
                      <AddressLink address={tx.signer} chars={5} />
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {tx.fee ? Number(tx.fee).toFixed(6) : '0.000005'}
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
