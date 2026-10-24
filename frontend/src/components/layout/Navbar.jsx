import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Activity,
  Coins,
  Bookmark,
  ChevronDown,
  Menu,
  X,
  Globe,
  Zap,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import SearchBar from './SearchBar';
import { useNetwork, NETWORKS } from '../../context/NetworkContext';
import api from '../../api/client';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const { network, setNetwork, liveTps, isLiveConnected } = useNetwork();
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  // Fetch quick stats for ticker
  useEffect(() => {
    let mounted = true;
    const fetchQuickStats = async () => {
      try {
        const res = await api.get(`/stats/overview?network=${network}`);
        if (mounted && res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        // Silent ticker error
      }
    };

    fetchQuickStats();
    const interval = setInterval(fetchQuickStats, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [network]);

  const navLinks = [
    { label: 'Dashboard', to: '/' },
    { label: 'Transactions', to: '/txs' },
    { label: 'Blocks', to: '/blocks' },
    { label: 'Tokens', to: '/tokens' },
    { label: 'Analytics', to: '/analytics' },
    { label: 'Watchlist', to: '/watchlist' },
  ];

  const currentNetworkObj = NETWORKS.find((n) => n.id === network) || NETWORKS[0];

  return (
    <header className="sticky top-0 z-40 bg-[#080c16]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Ticker Bar */}
      <div className="border-b border-slate-800/60 bg-[#050810] px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-5 whitespace-nowrap">
            {/* SOL Price */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">SOL:</span>
              <span className="font-semibold text-slate-200">
                ${stats?.solPrice ? stats.solPrice.toFixed(2) : '186.45'}
              </span>
              <span
                className={`text-[11px] font-medium flex items-center ${
                  (stats?.solPriceChange24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(stats?.solPriceChange24h || 0) >= 0 ? '+' : ''}
                {stats?.solPriceChange24h?.toFixed(2) || '4.15'}%
              </span>
            </div>

            {/* TPS Ticker */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>TPS:</span>
              <span className="font-semibold text-slate-200 font-mono">
                {liveTps?.tps || stats?.tps || '2,845'}
              </span>
            </div>

            {/* Epoch Progress */}
            <div className="hidden md:flex items-center gap-1.5">
              <span>Epoch {stats?.currentEpoch || 648}:</span>
              <span className="font-semibold text-purple-400 font-mono">
                {stats?.epochProgress || 44.9}%
              </span>
            </div>

            {/* Slot */}
            <div className="hidden lg:flex items-center gap-1.5">
              <span>Slot:</span>
              <span className="font-mono text-slate-300">
                {liveTps?.slot || stats?.currentSlot || '460,705,976'}
              </span>
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 live-indicator"></span>
              <span className="text-[11px] text-emerald-400 font-medium">Solana Mainnet Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7h16M7 12h13M4 17h16"
                      stroke="url(#sol-grad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="sol-grad" x1="4" y1="7" x2="20" y2="17" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9945FF" />
                        <stop offset="1" stopColor="#14F195" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                  Sol<span className="solana-gradient-text">Trace</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Compact Search on Non-Dashboard Pages */}
          {!isDashboard && (
            <div className="hidden md:block flex-1 max-w-md mx-4">
              <SearchBar isHero={false} />
            </div>
          )}

          {/* Right Controls: Network Switcher & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Network Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentNetworkObj.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {networkDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0f172a] border border-slate-700 shadow-2xl p-1.5 z-50 animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Solana Clusters
                  </div>
                  {NETWORKS.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => {
                        setNetwork(net.id);
                        setNetworkDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        network === net.id
                          ? 'bg-purple-600/20 text-purple-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            net.id === 'mainnet-beta'
                              ? 'bg-emerald-400'
                              : net.id === 'devnet'
                              ? 'bg-amber-400'
                              : 'bg-blue-400'
                          }`}
                        ></span>
                        <span>{net.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {net.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar on Non-Dashboard Pages */}
        {!isDashboard && !mobileMenuOpen && (
          <div className="md:hidden pb-3 pt-1">
            <SearchBar isHero={false} />
          </div>
        )}

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-2">
            {!isDashboard && (
              <div className="mb-3">
                <SearchBar isHero={false} />
              </div>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === link.to
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
