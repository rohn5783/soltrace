import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Plus, Trash2, ExternalLink, CreditCard, Coins, Hash } from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import TxLink from '../components/common/TxLink';
import { useWatchlist } from '../context/WatchlistContext';
import { useNetwork } from '../context/NetworkContext';

export default function WatchlistPage() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { network } = useNetwork();

  const [isAdding, setIsAdding] = useState(false);
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('account');
  const [notes, setNotes] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    await addToWatchlist({
      address: address.trim(),
      label: label.trim() || 'My Tracked Item',
      type,
      network,
      notes: notes.trim(),
    });

    setAddress('');
    setLabel('');
    setNotes('');
    setIsAdding(false);
  };

  const getIcon = (itemType) => {
    switch (itemType) {
      case 'token':
        return <Coins className="w-4 h-4 text-emerald-400" />;
      case 'transaction':
        return <Hash className="w-4 h-4 text-purple-400" />;
      case 'account':
      default:
        return <CreditCard className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-400" />
            Watchlist & Bookmarks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track key Solana wallets, treasury addresses, SPL token mints, and transactions
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Tracker</span>
        </button>
      </div>

      {/* Add Item Modal / Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="sol-card p-5 space-y-4 border-purple-500/50 bg-[#0c1221]"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Add to Watchlist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#080d18] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="account">Wallet / Account</option>
                <option value="token">SPL Token</option>
                <option value="transaction">Transaction Signature</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] text-slate-400">Solana Address / Hash</label>
              <input
                type="text"
                placeholder="Enter base58 address or signature..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full bg-[#080d18] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-purple-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[11px] text-slate-400">Custom Label</label>
              <input
                type="text"
                placeholder="e.g. My Phantom Wallet"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-[#080d18] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-purple-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] text-slate-400">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Staking rewards recipient"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#080d18] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer"
            >
              Save Tracker
            </button>
          </div>
        </form>
      )}

      {/* Watchlist Table */}
      <div className="sol-card p-5">
        {watchlist.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Your Watchlist is empty</p>
            <p className="text-xs text-slate-500">
              Click the bookmark icon on any account, token, or transaction page to track it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-3">
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Label</th>
                  <th className="py-3 px-3">Address / Signature</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {watchlist.map((item) => (
                  <tr key={item.address} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {getIcon(item.type)}
                        <span className="capitalize text-slate-300 font-mono text-[11px]">
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-100">
                      {item.label || 'Unnamed'}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {item.type === 'transaction' ? (
                        <TxLink signature={item.address} chars={6} />
                      ) : (
                        <AddressLink
                          address={item.address}
                          isToken={item.type === 'token'}
                          chars={6}
                        />
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => removeFromWatchlist(item.address)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
