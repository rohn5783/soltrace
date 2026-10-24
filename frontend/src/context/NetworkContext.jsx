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
  const [liveTx, setLiveTx] = useState(null);
  const [liveTps, setLiveTps] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const handleNetworkChange = (newNet) => {
    setNetwork(newNet);
    localStorage.setItem('soltrace_network', newNet);
  };

  useEffect(() => {
    const socketUrl = BACKEND_URL || '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setIsLiveConnected(true);
    });

    socket.on('new_block', (block) => {
      setLiveBlock(block);
    });

    socket.on('new_transaction', (tx) => {
      setLiveTx(tx);
    });

    socket.on('tps_pulse', (data) => {
      setLiveTps(data);
    });

    socket.on('disconnect', () => {
      setIsLiveConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork: handleNetworkChange,
        networks: NETWORKS,
        liveBlock,
        liveTx,
        liveTps,
        isLiveConnected,
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
