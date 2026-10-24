import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Search, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import AddressLink from '../components/common/AddressLink';
import CopyButton from '../components/common/CopyButton';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import api from '../api/client';

export default function TokensPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchTokens = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tokens');
        if (mounted && res.success && res.data) {
          setTokens(res.data);
        }
      } catch (err) {
        console.warn('Failed to load tokens:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTokens();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTokens = tokens.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(s) ||
      t.symbol.toLowerCase().includes(s) ||
      t.mint.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-400" />
            Solana SPL Tokens Market
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Top Solana SPL tokens ranked by market capitalization and 24h trading volume
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search token name, symbol, or mint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-[#0f172a] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Tokens Table Card */}
      <div className="sol-card p-5">
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-sans pb-3">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Token Asset</th>
                  <th className="py-3 px-3 text-right">Price</th>
                  <th className="py-3 px-3 text-right">24h Change</th>
                  <th className="py-3 px-3 text-right">24h Volume</th>
                  <th className="py-3 px-3 text-right">Market Cap</th>
                  <th className="py-3 px-3">Mint Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredTokens.map((token, idx) => {
                  const isPositive = (token.change24h || 0) >= 0;
                  return (
                    <tr key={token.mint} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          to={`/token/${token.mint}`}
                          className="flex items-center gap-2.5 group cursor-pointer"
                        >
                          {token.icon ? (
                            <img
                              src={token.icon}
                              alt={token.symbol}
                              className="w-7 h-7 rounded-full bg-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {token.symbol?.[0] || 'T'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                              {token.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {token.symbol}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-100 font-semibold">
                        ${token.price ? Number(token.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={`inline-flex items-center text-xs font-semibold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {isPositive ? '+' : ''}
                          {token.change24h?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        ${((token.volume24h || 0) / 1e6).toFixed(1)}M
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-100 font-semibold">
                        ${((token.marketCap || 0) / 1e6).toFixed(1)}M
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <AddressLink address={token.mint} isToken={true} chars={4} />
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
