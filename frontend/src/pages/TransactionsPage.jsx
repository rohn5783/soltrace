import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hash, Search, RefreshCw, Filter, CheckCircle2, XCircle } from 'lucide-react';
import TxLink from '../components/common/TxLink';
import AddressLink from '../components/common/AddressLink';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../api/client';
import { useNetwork } from '../context/NetworkContext';

export default function TransactionsPage() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Success', 'Failed'
  const [searchTerm, setSearchTerm] = useState('');
  const { network } = useNetwork();

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/transactions?limit=40&network=${network}`);
      if (res.success && res.data) {
        setTxs(res.data);
      }
    } catch (err) {
      console.warn('Failed to load transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [network]);

  const filteredTxs = txs.filter((tx) => {
    const matchesStatus =
      statusFilter === 'all' || tx.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      tx.signature.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      tx.signer.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Hash className="w-6 h-6 text-purple-400" />
            Solana Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of confirmed smart contract instructions and transfers on {network}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search signature / signer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f172a] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
            />
          </div>
          <button
            onClick={fetchTxs}
            className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setStatusFilter('Success')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            statusFilter === 'Success'
              ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Success</span>
        </button>
        <button
          onClick={() => setStatusFilter('Failed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            statusFilter === 'Failed'
              ? 'bg-rose-600/20 text-rose-300 font-semibold border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Failed</span>
        </button>
      </div>

      {/* Transactions Table Card */}
      <div className="sol-card p-5">
        {loading ? (
          <LoadingSkeleton rows={10} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-3">
                  <th className="py-3 px-3">Signature</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Slot</th>
                  <th className="py-3 px-3">Signer</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3 text-right">Fee (SOL)</th>
                  <th className="py-3 px-3 text-right font-sans">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTxs.map((tx) => {
                  const prog = tx.instructions?.[0]?.programName || 'Solana Transfer';
                  return (
                    <tr key={tx.signature} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <TxLink signature={tx.signature} chars={6} />
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          to={`/block/${tx.slot}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          {tx.slot}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <AddressLink address={tx.signer} chars={4} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] border border-purple-500/20">
                          {prog}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {tx.fee == null ? 'N/A' : Number(tx.fee).toFixed(6)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 font-sans text-[11px]">
                        {new Date(tx.blockTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
