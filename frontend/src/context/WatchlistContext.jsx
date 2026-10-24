import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const WatchlistContext = createContext(null);

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const local = localStorage.getItem('soltrace_watchlist');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  // Fetch from backend
  const fetchWatchlist = async () => {
    try {
      const res = await api.get('/watchlist');
      if (res.success && res.data) {
        setWatchlist(res.data);
        localStorage.setItem('soltrace_watchlist', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Using local watchlist store:', err.message);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const addToWatchlist = async (item) => {
    try {
      await api.post('/watchlist', item);
    } catch (err) {
      console.warn('Backend sync failed, storing locally:', err.message);
    }

    setWatchlist((prev) => {
      const exists = prev.some((i) => i.address === item.address);
      if (exists) return prev;
      const updated = [item, ...prev];
      localStorage.setItem('soltrace_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromWatchlist = async (address) => {
    try {
      await api.delete(`/watchlist/${address}`);
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err.message);
    }

    setWatchlist((prev) => {
      const updated = prev.filter((i) => i.address !== address);
      localStorage.setItem('soltrace_watchlist', JSON.stringify(updated));
      return updated;
    });
  };

  const isWatchlisted = (address) => {
    if (!address) return false;
    return watchlist.some((i) => i.address.toLowerCase() === address.toLowerCase());
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isWatchlisted,
        refreshWatchlist: fetchWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
