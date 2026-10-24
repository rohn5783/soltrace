import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  Bookmark,
  Coins,
  History,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import TxLink from '../components/common/TxLink';
import StatusBadge from '../components/common/StatusBadge';
import CopyButton from '../components/common/CopyButton';
import QrModal from '../components/common/QrModal';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../api/client';
import { useNetwork } from '../context/NetworkContext';
import { useWatchlist } from '../context/WatchlistContext';

export default function AccountPage() {
  const { address } = useParams();
  const [account, setAccount] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens', 'txs'
  const [qrOpen, setQrOpen] = useState(false);

  const { network } = useNetwork();
  const { addToWatchlist, isWatchlisted, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    let mounted = true;
    const fetchAccountData = async () => {
      setLoading(true);
      try {
        const [accRes, tokenRes, txRes] = await Promise.all([
          api.get(`/accounts/${address}?network=${network}`).catch(() => null),
          api.get(`/accounts/${address}/tokens?network=${network}`).catch(() => null),
          api.get(`/accounts/${address}/transactions?network=${network}`).catch(() => null),
        ]);

        if (mounted) {
          if (accRes?.success && accRes.data) setAccount(accRes.data);
          if (tokenRes?.success && tokenRes.data) setTokens(tokenRes.data);
          if (txRes?.success && txRes.data) setTxs(txRes.data);
        }
      } catch (err) {
        console.warn('Failed to fetch account info:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAccountData();
    return () => {
      mounted = false;
    };
  }, [address, network]);

  const bookmarked = isWatchlisted(address);

  // Calculate total portfolio net worth
  const tokensTotalUsd = tokens.reduce((sum, t) => sum + (t.usdValue || 0), 0);
  const totalNetWorth = (account?.usdValue || 0) + tokensTotalUsd;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-64 animate-pulse"></div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <QrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        address={address}
        title="Solana Wallet Address"
      />

      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono truncate max-w-xs sm:max-w-md">
                Account Profile
              </h1>
              {account?.executable ? (
                <span className="sol-badge sol-badge-info">Program / Contract</span>
              ) : (
                <span className="sol-badge sol-badge-success">User Wallet</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-slate-300 break-all">{address}</span>
              <CopyButton text={address} />
            </div>
          </div>
        </div>

        {/* Action Buttons: QR Code & Watchlist */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>QR Code</span>
          </button>

          <button
            onClick={() => {
              if (bookmarked) {
                removeFromWatchlist(address);
              } else {
                addToWatchlist({
                  address,
                  label: account?.executable ? 'Program Address' : 'Personal Wallet',
                  type: 'account',
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
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SOL Balance */}
        <div className="sol-card p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Native SOL Balance
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            {account?.solBalance ? Number(account.solBalance).toFixed(4) : '0.0000'} SOL
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            ≈ ${account?.usdValue ? account.usdValue.toLocaleString() : '0.00'} USD
          </span>
        </div>

        {/* Total Net Worth */}
        <div className="sol-card p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Estimated Net Worth
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            ${totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400">
            Including {tokens.length} SPL tokens
          </span>
        </div>

        {/* Program Owner */}
        <div className="sol-card p-5">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Assigned Owner Program
          </span>
          <div className="text-sm font-semibold text-slate-200 mt-2 mb-1 truncate">
            {account?.ownerProgramName || 'System Program'}
          </div>
          <AddressLink address={account?.ownerProgram} chars={6} />
        </div>
      </div>

      {/* Tabs: SPL Token Portfolio / Transactions */}
      <div className="sol-card overflow-hidden">
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`pb-3 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'tokens'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>SPL Token Holdings ({tokens.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('txs')}
            className={`pb-3 font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'txs'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>Transaction History ({txs.length})</span>
          </button>
        </div>

        {/* Tab 1: Token Portfolio */}
        {activeTab === 'tokens' && (
          <div className="p-5">
            {tokens.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No SPL tokens held in this account.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-sans pb-2">
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Mint Address</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-right font-sans">Price</th>
                      <th className="py-2.5 px-3 text-right font-sans">Value (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tokens.map((token, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 font-sans">
                            {token.icon ? (
                              <img
                                src={token.icon}
                                alt={token.symbol}
                                className="w-6 h-6 rounded-full bg-slate-800"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                                {token.symbol?.[0] || 'T'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-100">{token.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{token.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <AddressLink address={token.mint} isToken={true} chars={5} />
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200 font-semibold">
                          {Number(token.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">
                          ${token.price ? Number(token.price).toFixed(2) : '1.00'}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-semibold">
                          ${token.usdValue ? Number(token.usdValue).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Transaction History */}
        {activeTab === 'txs' && (
          <div className="p-5">
            {txs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No recent transactions found for this account.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-sans pb-2">
                      <th className="py-2.5 px-3">Signature</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Slot</th>
                      <th className="py-2.5 px-3 text-right">Fee (SOL)</th>
                      <th className="py-2.5 px-3 text-right font-sans">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {txs.map((t) => (
                      <tr key={t.signature} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <TxLink signature={t.signature} chars={8} />
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="py-2.5 px-3">
                          <Link to={`/block/${t.slot}`} className="text-cyan-400 hover:underline">
                            #{t.slot}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {t.fee ? Number(t.fee).toFixed(6) : '0.000005'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-sans text-[11px]">
                          {new Date(t.blockTime).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
