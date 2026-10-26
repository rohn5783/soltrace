import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Coins,
  ShieldCheck,
  ShieldAlert,
  Users,
  TrendingUp,
  Bookmark,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import CopyButton from '../components/common/CopyButton';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../api/client';
import { useWatchlist } from '../context/WatchlistContext';

export default function TokenDetailPage() {
  const { mint } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('holders');

  const { addToWatchlist, isWatchlisted, removeFromWatchlist } = useWatchlist();

  useEffect(() => {
    let mounted = true;
    const fetchToken = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tokens/${mint}`);
        if (mounted && res.success && res.data) {
          setToken(res.data);
        }
      } catch (err) {
        console.warn('Failed to load token:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchToken();
    return () => {
      mounted = false;
    };
  }, [mint]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-800 rounded w-64 animate-pulse"></div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="sol-card p-12 text-center space-y-4">
        <Coins className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Token Not Found</h2>
        <Link to="/tokens" className="text-xs text-purple-400 hover:underline">
          Back to Tokens
        </Link>
      </div>
    );
  }

  const bookmarked = isWatchlisted(token.mint);
  const isPositive = token.change24h != null && token.change24h >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {token.icon ? (
            <img
              src={token.icon}
              alt={token.symbol}
              className="w-12 h-12 rounded-full bg-slate-800 p-0.5"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg">
              {token.symbol?.[0] || 'T'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">
                {token.name}
              </h1>
              <span className="text-sm font-mono text-slate-400 font-semibold bg-slate-800 px-2.5 py-0.5 rounded-full">
                {token.symbol}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-slate-400 break-all">{token.mint}</span>
              <CopyButton text={token.mint} />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (bookmarked) {
              removeFromWatchlist(token.mint);
            } else {
              addToWatchlist({
                address: token.mint,
                label: `${token.name} (${token.symbol})`,
                type: 'token',
                network: 'mainnet-beta',
              });
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto ${
            bookmarked
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-[#0f172a] text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-400' : ''}`} />
          <span>{bookmarked ? 'Saved' : 'Watchlist'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Price */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 uppercase font-medium">Price</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            {token.price == null ? 'N/A' : `$${Number(token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`}
          </div>
          <span className={`inline-flex items-center text-xs font-semibold ${token.change24h == null ? 'text-slate-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {token.change24h == null ? 'N/A' : <>{isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}{`${isPositive ? '+' : ''}${token.change24h.toFixed(2)}% (24h)`}</>}
          </span>
        </div>

        {/* Market Cap */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 uppercase font-medium">Market Capitalization</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            {token.marketCap == null ? 'N/A' : `$${(token.marketCap / 1e6).toFixed(2)}M`}
          </div>
          <span className="text-xs text-slate-400">
            FDV: {token.fullyDilutedValuation == null ? 'N/A' : `$${(token.fullyDilutedValuation / 1e6).toFixed(2)}M`}
          </span>
        </div>

        {/* Total Supply */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 uppercase font-medium">Total Supply</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1 truncate">
            {token.supply == null ? 'N/A' : Number(token.supply).toLocaleString()}
          </div>
          <span className="text-xs text-slate-400">
            Decimals: {token.decimals}
          </span>
        </div>

        {/* Holders */}
        <div className="sol-card p-5">
          <span className="text-xs text-slate-400 uppercase font-medium">Total Holders</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1 mb-1">
            {token.holdersCount == null ? 'Unavailable' : Number(token.holdersCount).toLocaleString()}
          </div>
          <span className="text-xs text-cyan-400">
            Active SPL Wallets
          </span>
        </div>
      </div>

      {/* Authorities & Security Overview */}
      <div className="sol-card p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Token Security & Authorities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Mint Authority</span>
              <span className="font-mono text-slate-200">
                {token.mintAuthority ? token.mintAuthority.slice(0, 12) + '...' : 'None (Fixed Supply)'}
              </span>
            </div>
            {token.mintAuthority ? (
              <span className="sol-badge sol-badge-info">Active</span>
            ) : (
              <span className="sol-badge sol-badge-success">Revoked / Fixed</span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block font-medium">Freeze Authority</span>
              <span className="font-mono text-slate-200">
                {token.freezeAuthority ? token.freezeAuthority.slice(0, 12) + '...' : 'None (Unfreezable)'}
              </span>
            </div>
            {token.freezeAuthority ? (
              <span className="sol-badge sol-badge-failed">Active</span>
            ) : (
              <span className="sol-badge sol-badge-success">Revoked (Safe)</span>
            )}
          </div>
        </div>
      </div>

      {/* Top Holders Tab */}
      <div className="sol-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Top Token Holders Distribution
        </h3>

        {(!token.holders || token.holders.length === 0) ? (
          <p className="text-xs text-slate-500 italic py-2">Holder distribution is unavailable from the configured RPC data source.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-2">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Holder Address</th>
                  <th className="py-2.5 px-3">Entity / Label</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {token.holders.map((holder) => (
                  <tr key={holder.rank} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400">#{holder.rank}</td>
                    <td className="py-3 px-3">
                      <AddressLink address={holder.address} chars={6} />
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {holder.owner}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-100 font-semibold">
                      {holder.amount.toLocaleString()} {token.symbol}
                    </td>
                    <td className="py-3 px-3 text-right text-cyan-400 font-semibold">
                      {holder.percentage}%
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
