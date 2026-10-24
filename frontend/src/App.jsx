import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NetworkProvider } from './context/NetworkContext';
import { WatchlistProvider } from './context/WatchlistContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import BlocksPage from './pages/BlocksPage';
import BlockDetailPage from './pages/BlockDetailPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import AccountPage from './pages/AccountPage';
import TokensPage from './pages/TokensPage';
import TokenDetailPage from './pages/TokenDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WatchlistPage from './pages/WatchlistPage';

import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <Router>
      <NetworkProvider>
        <WatchlistProvider>
          <div className="min-h-screen flex flex-col bg-[#070a12] text-slate-100 antialiased">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ErrorBoundary>
                <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/blocks" element={<BlocksPage />} />
                <Route path="/block/:slot" element={<BlockDetailPage />} />
                <Route path="/txs" element={<TransactionsPage />} />
                <Route path="/tx/:signature" element={<TransactionDetailPage />} />
                <Route path="/account/:address" element={<AccountPage />} />
                <Route path="/tokens" element={<TokensPage />} />
                <Route path="/token/:mint" element={<TokenDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </WatchlistProvider>
      </NetworkProvider>
    </Router>
  );
}
