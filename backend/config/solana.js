import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const NETWORKS = {
  'mainnet-beta': {
    name: 'Mainnet Beta',
    endpoints: [
      process.env.SOLANA_RPC_MAINNET || 'https://api.mainnet-beta.solana.com',
      'https://rpc.ankr.com/solana',
      'https://solana-mainnet.rpc.extrnode.com',
    ],
  },
  'devnet': {
    name: 'Devnet',
    endpoints: [
      process.env.SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
      'https://rpc.ankr.com/solana_devnet',
    ],
  },
  'testnet': {
    name: 'Testnet',
    endpoints: [
      process.env.SOLANA_RPC_TESTNET || 'https://api.testnet.solana.com',
    ],
  },
};

const connections = new Map();

export const getConnection = (network = 'mainnet-beta') => {
  const netKey = NETWORKS[network] ? network : 'mainnet-beta';
  
  if (!connections.has(netKey)) {
    const primaryEndpoint = NETWORKS[netKey].endpoints[0];
    const connection = new Connection(primaryEndpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 30000,
    });
    connections.set(netKey, connection);
  }
  
  return connections.get(netKey);
};

export const lamportsToSol = (lamports) => {
  if (lamports === undefined || lamports === null) return 0;
  return Number(lamports) / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol) => {
  if (!sol) return 0;
  return Math.round(Number(sol) * LAMPORTS_PER_SOL);
};

export const isValidSolanaAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  try {
    new PublicKey(address);
    return true;
  } catch (err) {
    return false;
  }
};

export const isValidTxSignature = (signature) => {
  if (!signature || typeof signature !== 'string') return false;
  // Solana transaction signatures are base58 encoded, typically 87 or 88 chars
  return /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(signature.trim());
};
