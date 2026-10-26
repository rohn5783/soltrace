import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hash, ArrowRight, Clock, Tag } from 'lucide-react';
import TxLink from '../common/TxLink';
import AddressLink from '../common/AddressLink';
import StatusBadge from '../common/StatusBadge';
import LoadingSkeleton from '../common/LoadingSkeleton';
import api from '../../api/client';
import { useNetwork } from '../../context/NetworkContext';

export default function LatestTransactionsTable() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { network } = useNetwork();

  useEffect(() => {
    let mounted = true;
    const fetchTxs = async () => {
      try {
        const res = await api.get(`/transactions?limit=10&network=${network}`);
        if (mounted && res.success && res.data) {
          setTxs(res.data);
        }
      } catch (err) {
        console.warn('Failed to load transactions', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTxs();
    return () => {
      mounted = false;
    };
  }, [network]);

  return (
    <div className="sol-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Hash className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Latest Transactions</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator ml-1"></span>
        </div>
        <Link
          to="/txs"
          className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 group"
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
                <th className="py-2.5 px-3">Signature</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Signer</th>
                <th className="py-2.5 px-3 text-right">Fee (SOL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {txs.map((tx) => {
                const progName = tx.instructions?.[0]?.programName || 'Unknown Program';
                return (
                  <tr
                    key={tx.signature}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-3">
                      <TxLink signature={tx.signature} chars={5} />
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 text-[9px] border border-purple-500/20">
                          {progName}
                        </span>
                        <span>•</span>
                        <Link
                          to={`/block/${tx.slot}`}
                          className="hover:text-cyan-400 transition-colors"
                        >
                          Slot {tx.slot}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="py-2.5 px-3">
                      <AddressLink address={tx.signer} chars={4} />
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {tx.fee == null ? 'N/A' : Number(tx.fee).toFixed(6)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
