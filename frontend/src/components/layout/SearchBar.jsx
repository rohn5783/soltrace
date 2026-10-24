import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, ArrowRight, Layers, CreditCard, Coins, Hash, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { useNetwork } from '../../context/NetworkContext';

export default function SearchBar({ isHero = false, className = '' }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [isFocused, setIsFocused] = useState(false);

  const navigate = useNavigate();
  const { network } = useNetwork();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Global hotkey Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.get(`/search?q=${encodeURIComponent(cleanQuery)}&network=${network}`);
      if (res.success && res.data) {
        setResult(res.data);
        setIsFocused(true);
        // Direct navigation on explicit form submit
        if (e && e.type === 'submit') {
          navigate(res.data.target);
          setIsFocused(false);
          setQuery('');
        }
      }
    } catch (err) {
      setError(err.message || 'No matching records found on Solana');
      setIsFocused(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (target) => {
    navigate(target);
    setIsFocused(false);
    setQuery('');
    setResult(null);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'block':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'transaction':
        return <Hash className="w-4 h-4 text-purple-400" />;
      case 'token':
        return <Coins className="w-4 h-4 text-emerald-400" />;
      case 'account':
      default:
        return <CreditCard className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div
          className={`flex items-center gap-2 rounded-xl border transition-all duration-200 ${
            isHero
              ? 'bg-[#0f172a]/90 border-slate-700/80 p-2 shadow-2xl focus-within:border-purple-500/80 focus-within:ring-2 focus-within:ring-purple-500/20'
              : 'bg-[#0d121f] border-slate-800 px-3 py-1.5 focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-600'
          }`}
        >
          {/* Filter Dropdown (Optional on Hero) */}
          {isHero && (
            <div className="hidden sm:flex items-center gap-1 border-r border-slate-700 pr-2 pl-1">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Filters</option>
                <option value="account" className="bg-slate-900 text-slate-200">Account</option>
                <option value="tx" className="bg-slate-900 text-slate-200">Tx Hash</option>
                <option value="token" className="bg-slate-900 text-slate-200">Token</option>
                <option value="block" className="bg-slate-900 text-slate-200">Block</option>
              </select>
            </div>
          )}

          <Search className={`${isHero ? 'w-5 h-5 ml-2' : 'w-4 h-4'} text-slate-400 shrink-0`} />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError('');
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={
              isHero
                ? 'Search by Address / Txn Hash / Block / Token (Press Ctrl + K)'
                : 'Search Address, Tx, Token, Block...'
            }
            className={`w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none ${
              isHero ? 'text-sm py-2' : 'text-xs py-1'
            }`}
          />

          {loading ? (
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin mr-1 shrink-0" />
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-sm">
                Ctrl K
              </kbd>
              {isHero && (
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-purple-500/20 cursor-pointer"
                >
                  Search
                </button>
              )}
            </div>
          )}
        </div>
      </form>

      {/* Autocomplete / Instant Result Dropdown */}
      {isFocused && (result || error || (query.length > 2 && !loading)) && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0e1628] border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-md">
          {result ? (
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-3 py-1.5 flex items-center justify-between">
                <span>Direct Result Match</span>
                <span className="text-purple-400 font-mono text-[10px]">{result.type}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectResult(result.target)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/80 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/50">
                    {getIconForType(result.type)}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                      {result.label}
                    </p>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {result.details?.signature || result.details?.address || result.details?.mint || `Block #${result.details?.slot}`}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>
            </div>
          ) : error ? (
            <div className="p-3 text-center text-xs text-rose-400">
              {error}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">
              Press Enter or click Search to lookup on Solana {network}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
