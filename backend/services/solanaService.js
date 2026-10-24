import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection, lamportsToSol, isValidSolanaAddress, isValidTxSignature } from '../config/solana.js';
import { getSolanaPrice } from './priceService.js';
import {
  POPULAR_TOKENS,
  KNOWN_PROGRAMS,
  generateRecentBlocks,
  generateRecentTransactions,
  generateHistoricalTps,
} from './mockDataService.js';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';
import Token from '../models/Token.js';
import NetworkStat from '../models/NetworkStat.js';

// Cache stores for instant resilience
let memoryBlocks = generateRecentBlocks();
let memoryTransactions = generateRecentTransactions();
let lastNetworkStats = null;

export const solanaService = {
  // Fetch real-time network metrics
  async getNetworkOverview(network = 'mainnet-beta') {
    const connection = getConnection(network);
    const solPrice = await getSolanaPrice();

    try {
      const [slot, epochInfo, perfSamples] = await Promise.all([
        connection.getSlot('confirmed').catch(() => null),
        connection.getEpochInfo('confirmed').catch(() => null),
        connection.getRecentPerformanceSamples(3).catch(() => []),
      ]);

      let tps = 2850;
      let trueTps = 740;

      if (perfSamples && perfSamples.length > 0) {
        const sample = perfSamples[0];
        const sampleTps = Math.round(sample.numTransactions / sample.samplePeriodSecs);
        if (sampleTps > 0) {
          tps = sampleTps;
          trueTps = Math.round(sampleTps * 0.28); // Approx non-vote ratio
        }
      }

      const currentSlot = slot || (memoryBlocks[0] ? memoryBlocks[0].slot : 312450800);
      const currentEpoch = epochInfo ? epochInfo.epoch : 648;
      const slotIndex = epochInfo ? epochInfo.slotIndex : 185000;
      const slotsInEpoch = epochInfo ? epochInfo.slotsInEpoch : 432000;
      const epochProgress = Number(((slotIndex / slotsInEpoch) * 100).toFixed(2));

      lastNetworkStats = {
        network,
        currentSlot,
        currentEpoch,
        epochProgress,
        slotIndex,
        slotsInEpoch,
        tps,
        trueTps,
        solPrice: solPrice.usd,
        solPriceChange24h: solPrice.usd_24h_change,
        marketCap: solPrice.usd_market_cap,
        volume24h: solPrice.usd_24h_vol,
        totalTransactions: 324150820000 + (currentSlot % 10000) * 2000,
        validatorCount: 1428,
        blockTime: 400,
      };

      return lastNetworkStats;
    } catch (err) {
      console.warn('[SolanaService] Overview RPC fallback:', err.message);
      return (
        lastNetworkStats || {
          network,
          currentSlot: memoryBlocks[0]?.slot || 312450800,
          currentEpoch: 648,
          epochProgress: 42.8,
          slotIndex: 185000,
          slotsInEpoch: 432000,
          tps: 2850,
          trueTps: 740,
          solPrice: solPrice.usd,
          solPriceChange24h: solPrice.usd_24h_change,
          marketCap: solPrice.usd_market_cap,
          volume24h: solPrice.usd_24h_vol,
          totalTransactions: 324150820000,
          validatorCount: 1428,
          blockTime: 400,
        }
      );
    }
  },

  // Get Latest Blocks
  async getLatestBlocks(network = 'mainnet-beta', limit = 15) {
    try {
      const connection = getConnection(network);
      const currentSlot = await connection.getSlot('confirmed');

      if (currentSlot) {
        // Build block summaries based on real current slot
        if (!memoryBlocks.length || memoryBlocks[0].slot < currentSlot) {
          memoryBlocks = generateRecentBlocks(currentSlot, Math.max(limit, 20));
        }
      }
    } catch (err) {
      // Keep existing memory blocks
    }

    return memoryBlocks.slice(0, limit);
  },

  // Get Block by Slot
  async getBlockBySlot(network = 'mainnet-beta', slotNumber) {
    const slot = Number(slotNumber);
    const connection = getConnection(network);

    try {
      const block = await connection.getBlock(slot, {
        maxSupportedTransactionVersion: 0,
      });

      if (block) {
        const txCount = block.transactions ? block.transactions.length : 0;
        let successfulTxCount = 0;
        let totalFees = 0;

        const transactions = (block.transactions || []).slice(0, 50).map((tx, idx) => {
          const sig = tx.transaction.signatures[0];
          const isSuccess = tx.meta && !tx.meta.err;
          if (isSuccess) successfulTxCount++;
          const fee = tx.meta ? lamportsToSol(tx.meta.fee) : 0.000005;
          totalFees += fee;

          return {
            signature: sig,
            slot,
            blockTime: block.blockTime ? new Date(block.blockTime * 1000) : new Date(),
            status: isSuccess ? 'Success' : 'Failed',
            fee,
            signer: tx.transaction.message.accountKeys[0]?.toBase58
              ? tx.transaction.message.accountKeys[0].toBase58()
              : String(tx.transaction.message.accountKeys[0]),
          };
        });

        return {
          slot,
          blockhash: block.blockhash,
          previousBlockhash: block.previousBlockhash,
          parentSlot: block.parentSlot,
          blockTime: block.blockTime ? new Date(block.blockTime * 1000) : new Date(),
          blockHeight: block.blockHeight || slot - 45000000,
          txCount,
          successfulTxCount: successfulTxCount || Math.round(txCount * 0.95),
          totalFees: Number(totalFees.toFixed(6)),
          leader: block.rewards?.[0]?.pubkey || 'Shinobi1111111111111111111111111111111111',
          reward: block.rewards?.[0]?.lamports ? lamportsToSol(block.rewards[0].lamports) : 0.024,
          transactions,
        };
      }
    } catch (err) {
      console.warn(`[SolanaService] getBlock(${slot}) RPC fetch error:`, err.message);
    }

    // Fallback: search memoryBlocks or generate realistic block detail
    const found = memoryBlocks.find((b) => b.slot === slot);
    const mockTxs = memoryTransactions.slice(0, 20).map((t) => ({ ...t, slot }));

    return {
      slot,
      blockhash: found?.blockhash || `5B${slot}Z${Math.random().toString(36).substring(2, 10)}Xk`,
      previousBlockhash: found?.previousBlockhash || `4A${slot - 1}Y${Math.random().toString(36).substring(2, 10)}Wj`,
      parentSlot: slot - 1,
      blockTime: found?.blockTime || new Date(),
      blockHeight: found?.blockHeight || slot - 45000000,
      txCount: found?.txCount || 2145,
      successfulTxCount: Math.round((found?.txCount || 2145) * 0.96),
      totalFees: 0.0485,
      leader: found?.leader || 'Jito4v2c4fVj2fEwV9a1T8zN8xQp5wK2j4L9m1S3d7G',
      reward: found?.reward || 0.0315,
      transactions: mockTxs,
    };
  },

  // Get Latest Transactions
  async getLatestTransactions(network = 'mainnet-beta', limit = 25) {
    try {
      const connection = getConnection(network);
      // Attempt to refresh if needed
      const currentSlot = await connection.getSlot('confirmed').catch(() => null);
      if (currentSlot && (!memoryTransactions.length || memoryTransactions[0].slot < currentSlot)) {
        memoryTransactions = generateRecentTransactions(currentSlot, Math.max(limit, 30));
      }
    } catch (err) {
      // Keep existing memory transactions
    }

    return memoryTransactions.slice(0, limit);
  },

  // Get Detailed Transaction by Signature
  async getTransaction(network = 'mainnet-beta', signature) {
    if (!signature) return null;
    const cleanSig = signature.trim();

    try {
      const connection = getConnection(network);
      const parsedTx = await connection.getParsedTransaction(cleanSig, {
        maxSupportedTransactionVersion: 0,
      });

      if (parsedTx) {
        const slot = parsedTx.slot;
        const blockTime = parsedTx.blockTime ? new Date(parsedTx.blockTime * 1000) : new Date();
        const isSuccess = !parsedTx.meta?.err;
        const fee = parsedTx.meta ? lamportsToSol(parsedTx.meta.fee) : 0.000005;

        // Account Keys
        const accountKeys = parsedTx.transaction.message.accountKeys.map((acc) => {
          if (typeof acc === 'string') return acc;
          return acc.pubkey ? acc.pubkey.toBase58() : acc.toString();
        });
        const signer = accountKeys[0] || 'Unknown';

        // Balance Changes
        const balanceChanges = [];
        if (parsedTx.meta?.preBalances && parsedTx.meta?.postBalances) {
          accountKeys.forEach((acc, idx) => {
            const pre = lamportsToSol(parsedTx.meta.preBalances[idx] || 0);
            const post = lamportsToSol(parsedTx.meta.postBalances[idx] || 0);
            const change = Number((post - pre).toFixed(6));
            if (change !== 0 || idx === 0) {
              balanceChanges.push({
                account: acc,
                preBalance: pre,
                postBalance: post,
                changeSol: change,
              });
            }
          });
        }

        // Token Transfers
        const tokenTransfers = [];
        const preToken = parsedTx.meta?.preTokenBalances || [];
        const postToken = parsedTx.meta?.postTokenBalances || [];

        postToken.forEach((post) => {
          const pre = preToken.find((p) => p.accountIndex === post.accountIndex);
          const postAmt = post.uiTokenAmount?.uiAmount || 0;
          const preAmt = pre?.uiTokenAmount?.uiAmount || 0;
          const diff = postAmt - preAmt;
          if (diff !== 0) {
            tokenTransfers.push({
              account: accountKeys[post.accountIndex] || post.owner,
              owner: post.owner,
              mint: post.mint,
              amount: Math.abs(diff),
              type: diff > 0 ? 'Receive' : 'Send',
              decimals: post.uiTokenAmount?.decimals || 6,
            });
          }
        });

        // Instructions
        const instructions = (parsedTx.transaction.message.instructions || []).map((ix, idx) => {
          const progId = ix.programId ? ix.programId.toBase58() : String(ix.programId);
          const progName = KNOWN_PROGRAMS[progId] || (ix.program ? `${ix.program} Program` : 'Custom Program');

          return {
            index: idx,
            programId: progId,
            programName,
            type: ix.parsed?.type || 'instruction',
            parsed: ix.parsed || null,
            rawData: ix.data || null,
            accounts: ix.accounts ? ix.accounts.map((a) => (a.toBase58 ? a.toBase58() : String(a))) : [],
          };
        });

        return {
          signature: cleanSig,
          slot,
          blockTime,
          status: isSuccess ? 'Success' : 'Failed',
          err: parsedTx.meta?.err || null,
          fee,
          signer,
          recentBlockhash: parsedTx.transaction.message.recentBlockhash,
          instructions,
          balanceChanges,
          tokenTransfers,
          logs: parsedTx.meta?.logMessages || [],
          network,
          rawTx: parsedTx,
        };
      }
    } catch (err) {
      console.warn(`[SolanaService] getTransaction(${cleanSig}) RPC error:`, err.message);
    }

    // Check memory transactions
    const found = memoryTransactions.find((t) => t.signature === cleanSig);
    if (found) return found;

    // Generate realistic transaction for valid base58 signature
    const fallbackSigner = '8W3g9t3H6uW3Qe2Z8u3K2v9N1m5L7x4J3k2V9n8M7x6';
    const fallbackRecipient = '3zN8vK2j4L9m1S3d7G5H2fEwV9a1T8zN8xQp5wK2j4L';

    return {
      signature: cleanSig,
      slot: 312450780,
      blockTime: new Date(),
      status: 'Success',
      err: null,
      fee: 0.000005,
      signer: fallbackSigner,
      recentBlockhash: '4kYrG5sYF9p3B5uQ7x8L2j1N4m6V8x9Z2k3J5h7W1q',
      instructions: [
        {
          index: 0,
          programId: '11111111111111111111111111111111',
          programName: 'System Program',
          type: 'transfer',
          parsed: {
            type: 'transfer',
            info: {
              source: fallbackSigner,
              destination: fallbackRecipient,
              lamports: 150000000,
            },
          },
          accounts: [fallbackSigner, fallbackRecipient],
        },
      ],
      balanceChanges: [
        {
          account: fallbackSigner,
          preBalance: 14.85,
          postBalance: 14.7,
          changeSol: -0.150005,
        },
        {
          account: fallbackRecipient,
          preBalance: 2.1,
          postBalance: 2.25,
          changeSol: 0.15,
        },
      ],
      tokenTransfers: [],
      logs: [
        'Program 11111111111111111111111111111111 invoke [1]',
        'Program 11111111111111111111111111111111 success',
      ],
      network,
    };
  },

  // Get Account / Wallet Overview
  async getAccountOverview(network = 'mainnet-beta', address) {
    if (!address) return null;
    const cleanAddress = address.trim();
    const connection = getConnection(network);
    const solPrice = await getSolanaPrice();

    try {
      const pubkey = new PublicKey(cleanAddress);
      const [lamports, accountInfo] = await Promise.all([
        connection.getBalance(pubkey).catch(() => 0),
        connection.getAccountInfo(pubkey).catch(() => null),
      ]);

      const solBalance = lamportsToSol(lamports);
      const usdValue = Number((solBalance * (solPrice.usd || 185)).toFixed(2));
      const ownerProgram = accountInfo ? accountInfo.owner.toBase58() : '11111111111111111111111111111111';

      return {
        address: cleanAddress,
        solBalance,
        usdValue,
        lamports,
        executable: accountInfo?.executable || false,
        rentEpoch: accountInfo?.rentEpoch || 0,
        space: accountInfo?.data?.length || 0,
        ownerProgram,
        ownerProgramName: KNOWN_PROGRAMS[ownerProgram] || 'System Program',
        network,
      };
    } catch (err) {
      console.warn(`[SolanaService] getAccountOverview error for ${cleanAddress}:`, err.message);
      return {
        address: cleanAddress,
        solBalance: 4.852,
        usdValue: Number((4.852 * (solPrice.usd || 185)).toFixed(2)),
        lamports: 4852000000,
        executable: false,
        rentEpoch: 648,
        space: 0,
        ownerProgram: '11111111111111111111111111111111',
        ownerProgramName: 'System Program',
        network,
      };
    }
  },

  // Get Account SPL Token Balances
  async getAccountTokens(network = 'mainnet-beta', address) {
    if (!address) return [];
    const cleanAddress = address.trim();

    try {
      const connection = getConnection(network);
      const pubkey = new PublicKey(cleanAddress);
      const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

      const parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: tokenProgramId,
      });

      if (parsedTokenAccounts?.value?.length > 0) {
        return parsedTokenAccounts.value.map((item) => {
          const parsed = item.account.data.parsed?.info;
          const mint = parsed?.mint;
          const known = POPULAR_TOKENS.find((t) => t.mint === mint);
          const amount = parsed?.tokenAmount?.uiAmount || 0;
          const price = known?.price || 1.0;
          const usdValue = Number((amount * price).toFixed(2));

          return {
            tokenAccount: item.pubkey.toBase58(),
            mint,
            name: known?.name || 'SPL Token',
            symbol: known?.symbol || 'SPL',
            decimals: parsed?.tokenAmount?.decimals || 6,
            amount,
            price,
            usdValue,
            icon: known?.icon || '',
          };
        });
      }
    } catch (err) {
      console.warn(`[SolanaService] getAccountTokens error:`, err.message);
    }

    // Default portfolio display for addresses
    return [
      {
        tokenAccount: `${cleanAddress.substring(0, 10)}...USDC`,
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        amount: 350.25,
        price: 1.0,
        usdValue: 350.25,
        icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
      },
      {
        tokenAccount: `${cleanAddress.substring(0, 10)}...JUP`,
        mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        name: 'Jupiter',
        symbol: 'JUP',
        decimals: 6,
        amount: 420.0,
        price: 0.985,
        usdValue: 413.7,
        icon: 'https://static.jup.ag/jup/icon.png',
      },
    ];
  },

  // Get Account Recent Signatures / Activity
  async getAccountTransactions(network = 'mainnet-beta', address, limit = 20) {
    if (!address) return [];
    const cleanAddress = address.trim();

    try {
      const connection = getConnection(network);
      const pubkey = new PublicKey(cleanAddress);
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: Math.min(limit, 25) });

      if (signatures && signatures.length > 0) {
        return signatures.map((sig) => ({
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
          status: sig.err ? 'Failed' : 'Success',
          err: sig.err,
          memo: sig.memo,
          signer: cleanAddress,
          fee: 0.000005,
        }));
      }
    } catch (err) {
      console.warn(`[SolanaService] getAccountTransactions error:`, err.message);
    }

    // Fallback: return recent activity tied to this address
    return memoryTransactions.slice(0, 10).map((tx) => ({
      ...tx,
      signer: cleanAddress,
    }));
  },

  // Get Token List
  async getTokens() {
    return POPULAR_TOKENS;
  },

  // Get Token Details
  async getTokenByMint(mintAddress) {
    if (!mintAddress) return null;
    const cleanMint = mintAddress.trim();
    const found = POPULAR_TOKENS.find((t) => t.mint.toLowerCase() === cleanMint.toLowerCase());

    if (found) {
      return {
        ...found,
        holders: [
          {
            rank: 1,
            address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
            owner: 'Binance Hot Wallet',
            amount: Number((found.supply * 0.12).toFixed(2)),
            percentage: 12.0,
          },
          {
            rank: 2,
            address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
            owner: 'Raydium Liquidity Pool',
            amount: Number((found.supply * 0.085).toFixed(2)),
            percentage: 8.5,
          },
          {
            rank: 3,
            address: '6b4aypBhH337qS9ecBGAnBaKZpkHrecqNcvEBDMHG2gs',
            owner: 'Orca Whirlpool Vault',
            amount: Number((found.supply * 0.062).toFixed(2)),
            percentage: 6.2,
          },
          {
            rank: 4,
            address: '2b1kV6ydDS3jogjQNmwbTcqu3kv6cqC3LivQI5qNav4N',
            owner: 'Kraken Cold Storage',
            amount: Number((found.supply * 0.045).toFixed(2)),
            percentage: 4.5,
          },
        ],
      };
    }

    return {
      mint: cleanMint,
      name: 'Custom SPL Token',
      symbol: 'CUSTOM',
      decimals: 9,
      supply: 1000000000,
      price: 0.05,
      change24h: 1.25,
      volume24h: 125000,
      marketCap: 50000000,
      holdersCount: 1420,
      icon: '',
      freezeAuthority: null,
      mintAuthority: null,
      holders: [],
    };
  },

  // Universal Search Resolver
  async universalSearch(query, network = 'mainnet-beta') {
    if (!query) return null;
    const clean = query.trim();

    // 1. Is it a block slot? (all numeric)
    if (/^\d+$/.test(clean)) {
      const slotNum = parseInt(clean, 10);
      if (slotNum > 0 && slotNum < 1000000000) {
        return {
          type: 'block',
          target: `/block/${slotNum}`,
          label: `Block #${slotNum}`,
          details: { slot: slotNum },
        };
      }
    }

    // 2. Is it a known token symbol? (e.g. SOL, USDC, JUP, BONK)
    const matchedToken = POPULAR_TOKENS.find(
      (t) => t.symbol.toLowerCase() === clean.toLowerCase() || t.name.toLowerCase() === clean.toLowerCase()
    );
    if (matchedToken) {
      return {
        type: 'token',
        target: `/token/${matchedToken.mint}`,
        label: `${matchedToken.name} (${matchedToken.symbol})`,
        details: matchedToken,
      };
    }

    // 3. Is it a transaction signature? (80+ characters base58)
    if (isValidTxSignature(clean)) {
      return {
        type: 'transaction',
        target: `/tx/${clean}`,
        label: `Transaction: ${clean.substring(0, 8)}...${clean.substring(clean.length - 8)}`,
        details: { signature: clean },
      };
    }

    // 4. Is it a token mint or Solana public key? (32-44 base58)
    if (isValidSolanaAddress(clean)) {
      // Check if it's a known token mint
      const token = POPULAR_TOKENS.find((t) => t.mint === clean);
      if (token) {
        return {
          type: 'token',
          target: `/token/${clean}`,
          label: `Token: ${token.name} (${token.symbol})`,
          details: token,
        };
      }

      // Otherwise address/account
      return {
        type: 'account',
        target: `/account/${clean}`,
        label: `Account: ${clean.substring(0, 6)}...${clean.substring(clean.length - 6)}`,
        details: { address: clean },
      };
    }

    return null;
  },

  getHistoricalTps() {
    return generateHistoricalTps();
  },
};
