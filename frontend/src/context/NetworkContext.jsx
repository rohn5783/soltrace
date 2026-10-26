import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../api/client';

const NetworkContext = createContext(null);

export const NETWORKS = [
  { id: 'mainnet-beta', name: 'Mainnet Beta', badge: 'Live', color: 'emerald' },
  { id: 'devnet', name: 'Devnet', badge: 'Test', color: 'amber' },
  { id: 'testnet', name: 'Testnet', badge: 'Staging', color: 'blue' },
];

export const NetworkProvider = ({ children }) => {
  const [network, setNetwork] = useState(() => {
    return localStorage.getItem('soltrace_network') || localStorage.getItem('solscan_network') || 'mainnet-beta';
  });

  const [liveBlock, setLiveBlock] = useState(null);
  const [liveSlot, setLiveSlot] = useState(null);
  const [networkStats, setNetworkStats] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [streamNetwork, setStreamNetwork] = useState(null);

  const handleNetworkChange = (newNet) => {
    setNetwork(newNet);
    localStorage.setItem('soltrace_network', newNet);
  };

  useEffect(() => {
    setLiveSlot(null);
    setLiveBlock(null);
    setNetworkStats(null);
    const socketUrl = BACKEND_URL || '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      query: { network },
    });

    socket.on('connect', () => {
      setIsLiveConnected(true);
    });
    socket.on('connected', (status) => setStreamNetwork(status.network || null));

    socket.on('new_block', (block) => {
      if (block.network === network) setLiveBlock(block);
    });

    socket.on('new_slot', (slot) => {
      if (slot.network === network) setLiveSlot(slot);
    });

    socket.on('network_stats', (stats) => {
      if (stats.network === network) setNetworkStats(stats);
    });

    socket.on('disconnect', () => {
      setIsLiveConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [network]);

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork: handleNetworkChange,
        networks: NETWORKS,
        liveBlock,
        liveSlot,
        networkStats,
        isLiveConnected,
        streamNetwork,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
