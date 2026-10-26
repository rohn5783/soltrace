import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const NETWORKS = {
  'mainnet-beta': {
    name: 'Mainnet Beta',
    endpoint: process.env.SOLANA_RPC_MAINNET || 'https://api.mainnet-beta.solana.com',
    wsEndpoint: process.env.SOLANA_WS_MAINNET || undefined,
  },
  'devnet': {
    name: 'Devnet',
    endpoint: process.env.SOLANA_RPC_DEVNET || 'https://api.devnet.solana.com',
    wsEndpoint: process.env.SOLANA_WS_DEVNET || undefined,
  },
  'testnet': {
    name: 'Testnet',
    endpoint: process.env.SOLANA_RPC_TESTNET || 'https://api.testnet.solana.com',
    wsEndpoint: process.env.SOLANA_WS_TESTNET || undefined,
  },
};

const connections = new Map();
for (const [network, config] of Object.entries(NETWORKS)) {
  let endpoint;
  try { endpoint = new URL(config.endpoint); } catch { throw new Error(`Invalid RPC endpoint configured for ${network}`); }
  if (!['https:', 'http:'].includes(endpoint.protocol)) throw new Error(`Invalid RPC protocol configured for ${network}`);
}
const commitments = new Set(['processed', 'confirmed', 'finalized']);
const configuredCommitment = process.env.SOLANA_COMMITMENT || 'confirmed';
if (!commitments.has(configuredCommitment)) throw new Error('SOLANA_COMMITMENT must be processed, confirmed, or finalized');

export const validateNetwork = (network = 'mainnet-beta') => {
  if (!Object.hasOwn(NETWORKS, network)) {
    const error = new Error(`Unsupported Solana network: ${network}`);
    error.statusCode = 400;
    error.code = 'INVALID_NETWORK';
    throw error;
  }
  return network;
};

export const getConnection = (network = 'mainnet-beta') => {
  const netKey = validateNetwork(network);
  
  if (!connections.has(netKey)) {
    const primaryEndpoint = NETWORKS[netKey].endpoint;
    const connection = new Connection(primaryEndpoint, {
      commitment: configuredCommitment,
      wsEndpoint: NETWORKS[netKey].wsEndpoint,
      confirmTransactionInitialTimeout: Math.min(Math.max(Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 10000, 1000), 60000),
    });
    connections.set(netKey, connection);
  }
  
  return connections.get(netKey);
};

export const lamportsToSol = (lamports) => {
  if (lamports === undefined || lamports === null) return null;
  return Number(lamports) / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol) => {
  if (sol === undefined || sol === null || !Number.isFinite(Number(sol))) return null;
  return Math.round(Number(sol) * LAMPORTS_PER_SOL);
};

export const isValidSolanaAddress = (address) => {
  if (!address || typeof address !== 'string' || address.length < 32 || address.length > 44) return false;
  try {
    new PublicKey(address);
    return true;
  } catch (err) {
    return false;
  }
};

export const isValidTxSignature = (signature) => {
  if (!signature || typeof signature !== 'string' || signature.length < 64 || signature.length > 88) return false;
  try {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let value = 0n;
    for (const char of signature) {
      const digit = chars.indexOf(char);
      if (digit < 0) return false;
      value = value * 58n + BigInt(digit);
    }
    let bytes = 0;
    while (value > 0n) { bytes++; value >>= 8n; }
    for (const char of signature) { if (char !== '1') break; bytes++; }
    return bytes === 64;
  } catch { return false; }
};
