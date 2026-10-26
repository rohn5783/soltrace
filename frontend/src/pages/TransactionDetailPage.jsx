import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Hash,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  FileCode,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import StatusBadge from '../components/common/StatusBadge';
import CopyButton from '../components/common/CopyButton';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import InstructionViewer from '../components/transaction/InstructionViewer';
import BalanceChangesTable from '../components/transaction/BalanceChangesTable';
import api from '../api/client';
import { useNetwork } from '../context/NetworkContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function TransactionDetailPage() {
  const { signature } = useParams();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

  const { network } = useNetwork();
  const { addToWatchlist, isWatchlisted, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    let mounted = true;
    const fetchTx = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/transactions/${signature}?network=${network}`);
        if (mounted && res.success && res.data) {
          setTx(res.data);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Transaction not found');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTx();
    return () => {
      mounted = false;
    };
  }, [signature, network]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-64 animate-pulse"></div>
        <LoadingSkeleton rows={10} />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="sol-card p-12 text-center space-y-4">
        <Hash className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Transaction Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Signature <code className="text-purple-300 font-mono text-[11px]">{signature}</code> was
          not found on {network}.
        </p>
        <Link
          to="/txs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
        >
          Back to Transactions
        </Link>
      </div>
    );
  }

  const bookmarked = isWatchlisted(tx.signature);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Hash className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono truncate max-w-sm sm:max-w-md md:max-w-lg">
                Transaction Detail
              </h1>
              <StatusBadge status={tx.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Processed on Solana {network}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (bookmarked) {
                removeFromWatchlist(tx.signature);
              } else {
                addToWatchlist({
                  address: tx.signature,
                  label: `Tx in Slot #${tx.slot}`,
                  type: 'transaction',
                  network,
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              bookmarked
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-[#0f172a] text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-400' : ''}`} />
            <span>{bookmarked ? 'Saved' : 'Watchlist'}</span>
          </button>

          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showRawJson ? 'Hide JSON' : 'Raw JSON'}</span>
          </button>
        </div>
      </div>

      {/* Raw JSON modal or expandable */}
      {showRawJson && (
        <div className="sol-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">Raw Parsed Transaction JSON</span>
            <CopyButton text={JSON.stringify(tx, null, 2)} label="Copy JSON" />
          </div>
          <pre className="bg-[#050811] p-4 rounded-xl text-[11px] text-cyan-300 font-mono overflow-x-auto max-h-96">
            {JSON.stringify(tx, null, 2)}
          </pre>
        </div>
      )}

      {/* Overview Card */}
      <div className="sol-card p-6 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
          Transaction Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Signature */}
          <div className="space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Signature</span>
            <div className="font-mono text-slate-200 flex items-center justify-between bg-[#090d18] p-2.5 rounded-lg border border-slate-800">
              <span className="truncate mr-2">{tx.signature}</span>
              <CopyButton text={tx.signature} />
            </div>
          </div>

          {/* Slot */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Slot</span>
            <div className="p-2.5 rounded-lg bg-[#090d18] border border-slate-800 text-slate-200 font-mono">
              <Link to={`/block/${tx.slot}`} className="text-cyan-400 hover:underline">
                #{tx.slot.toLocaleString()}
              </Link>
            </div>
          </div>

          {/* Timestamp */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Timestamp</span>
            <div className="p-2.5 rounded-lg bg-[#090d18] border border-slate-800 text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{new Date(tx.blockTime).toUTCString()}</span>
            </div>
          </div>

          {/* Signer */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Fee Payer / Signer</span>
            <div className="p-2.5 rounded-lg bg-[#090d18] border border-slate-800">
              <AddressLink address={tx.signer} chars={8} />
            </div>
          </div>

          {/* Fee */}
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Transaction Fee</span>
            <div className="p-2.5 rounded-lg bg-[#090d18] border border-slate-800 font-mono text-slate-200 flex items-center justify-between">
              <span>{tx.fee == null ? 'N/A' : `${Number(tx.fee).toFixed(6)} SOL`}</span>
            </div>
          </div>

          {/* Recent Blockhash */}
          <div className="space-y-1 md:col-span-2">
            <span className="text-slate-400 font-medium">Recent Blockhash</span>
            <div className="font-mono text-slate-200 flex items-center justify-between bg-[#090d18] p-2.5 rounded-lg border border-slate-800">
              <span className="truncate mr-2">{tx.recentBlockhash || 'N/A'}</span>
              {tx.recentBlockhash && <CopyButton text={tx.recentBlockhash} />}
            </div>
          </div>
        </div>
      </div>

      {/* Decoded Program Instructions & Logs */}
      <section>
        <InstructionViewer instructions={tx.instructions || []} logs={tx.logs || []} />
      </section>

      {/* Balance Changes & Token Transfers */}
      <section>
        <BalanceChangesTable
          balanceChanges={tx.balanceChanges || []}
          tokenTransfers={tx.tokenTransfers || []}
        />
      </section>
    </div>
  );
}
