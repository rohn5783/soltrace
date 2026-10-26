import { PublicKey } from '@solana/web3.js';
import { getConnection, lamportsToSol, isValidSolanaAddress, isValidTxSignature, validateNetwork } from '../config/solana.js';
import { getSolanaPrice, getTokenPrices } from './priceService.js';
import { POPULAR_TOKENS, KNOWN_PROGRAMS } from './chainMetadata.js';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

const fetched = (network, data, source = 'rpc') => ({ ...(data || {}), source, network, fetchedAt: new Date().toISOString(), stale: false });
const inputError = (message) => Object.assign(new Error(message), { statusCode: 400, code: 'INVALID_INPUT' });
const checkedAddress = (value, field = 'address') => {
  if (!isValidSolanaAddress(value)) throw inputError(`Invalid Solana ${field}`);
  return new PublicKey(value);
};
const checkedLimit = (limit, max = 100) => {
  const value = Number(limit);
  if (!Number.isInteger(value) || value < 1 || value > max) throw inputError(`limit must be an integer between 1 and ${max}`);
  return value;
};
export const rpc = async (operation) => {
  const timeout = Math.min(Math.max(Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 10000, 1000), 60000);
  const retries = Math.min(Math.max(Number(process.env.SOLANA_RPC_MAX_RETRIES ?? 2) || 0, 0), 5);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    let timer;
    try {
      return await Promise.race([
        operation(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('Solana RPC request timed out'), { code: 'RPC_TIMEOUT', statusCode: 504 })), timeout); }),
      ]);
    } catch (error) {
      lastError = error;
      const permanent = error?.statusCode === 400 || error?.code === 'INVALID_INPUT';
      if (permanent || attempt === retries) break;
      const wait = Math.min(250 * (2 ** attempt), 2000) + Math.floor(Math.random() * 200);
      await new Promise((resolve) => setTimeout(resolve, wait));
    } finally { clearTimeout(timer); }
  }
  lastError.statusCode ||= 502;
  lastError.code ||= 'RPC_UNAVAILABLE';
  throw lastError;
};
const blockToView = (block, slot) => ({
  slot, blockhash: block.blockhash, previousBlockhash: block.previousBlockhash,
  parentSlot: block.parentSlot, blockTime: block.blockTime == null ? null : new Date(block.blockTime * 1000),
  blockHeight: block.blockHeight ?? null, txCount: block.transactions?.length ?? 0,
  successfulTxCount: block.transactions?.filter((tx) => tx.meta && !tx.meta.err).length ?? null,
  totalFees: block.transactions?.every((tx) => Number.isFinite(tx.meta?.fee))
    ? lamportsToSol(block.transactions.reduce((sum, tx) => sum + tx.meta.fee, 0)) : null,
  leader: null, reward: null, network: null,
});
const normalizeInstruction = (ix, index, keys) => {
  const programId = ix.programId?.toBase58?.() || (typeof ix.programIdIndex === 'number' ? keys[ix.programIdIndex] : null) || String(ix.programId || '');
  const programName = KNOWN_PROGRAMS[programId] || (ix.program ? `${ix.program} Program` : 'Unknown Program');
  return {
    index, programId, programName, type: ix.parsed?.type || (ix.data ? 'partially decoded' : 'unknown'),
    parsed: ix.parsed || null, rawData: ix.data || null,
    accounts: Array.isArray(ix.accounts) ? ix.accounts.map((account) => typeof account === 'number' ? keys[account] : (account?.toBase58?.() || String(account))) : [],
  };
};
export const normalizeTransaction = (parsedTx, signature, network) => {
  if (!parsedTx) return null;
  const message = parsedTx.transaction?.message;
  const accountKeys = (message?.accountKeys || []).map((item) => item.pubkey?.toBase58?.() || item.toBase58?.() || String(item));
  const meta = parsedTx.meta;
  const balanceChanges = (meta?.preBalances && meta?.postBalances ? accountKeys.map((account, index) => ({
    account, preBalance: lamportsToSol(meta.preBalances[index]), postBalance: lamportsToSol(meta.postBalances[index]),
    changeSol: Number.isFinite(meta.preBalances[index]) && Number.isFinite(meta.postBalances[index]) ? (meta.postBalances[index] - meta.preBalances[index]) / 1e9 : null,
  })) : []);
  const pre = meta?.preTokenBalances || [];
  const post = meta?.postTokenBalances || [];
  const tokenBalances = new Map();
  for (const [items, field] of [[pre, 'pre'], [post, 'post']]) for (const item of items) {
    const key = `${item.accountIndex}:${item.mint}`;
    if (!tokenBalances.has(key)) tokenBalances.set(key, { accountIndex: item.accountIndex, mint: item.mint, owner: item.owner || null, decimals: item.uiTokenAmount?.decimals ?? null, pre: 0n, post: 0n });
    const target = tokenBalances.get(key);
    target.owner ||= item.owner || null;
    target.decimals ??= item.uiTokenAmount?.decimals ?? null;
    target[field] = BigInt(item.uiTokenAmount?.amount || 0);
  }
  const tokenTransfers = [...tokenBalances.values()].filter((item) => item.pre !== item.post).map((item) => {
    const diff = item.post - item.pre;
    return { account: accountKeys[item.accountIndex] || null, owner: item.owner, mint: item.mint, rawAmount: diff < 0n ? (-diff).toString() : diff.toString(), decimals: item.decimals, type: diff > 0n ? 'Receive' : 'Send', note: 'Token account balance change; transfer instruction interpretation is not inferred' };
  });
  const instructions = (message?.instructions || []).map((ix, index) => normalizeInstruction(ix, index, accountKeys));
  for (const group of meta?.innerInstructions || []) for (const ix of group.instructions || []) instructions.push({ ...normalizeInstruction(ix, instructions.length, accountKeys), inner: true, parentIndex: group.index });
  return {
    signature, slot: parsedTx.slot, blockTime: parsedTx.blockTime == null ? null : new Date(parsedTx.blockTime * 1000),
    status: !meta || meta.err === undefined ? 'Unavailable' : meta.err === null ? 'Success' : 'Failed', err: meta?.err ?? null,
    fee: Number.isFinite(meta?.fee) ? lamportsToSol(meta.fee) : null,
    signer: message?.accountKeys?.find((key) => key.signer)?.pubkey?.toBase58?.() || accountKeys[0] || null,
    recentBlockhash: message?.recentBlockhash || null, instructions, balanceChanges, tokenTransfers,
    logs: meta?.logMessages || [], network, rawTx: parsedTx,
  };
};

export const solanaService = {
  async getNetworkOverview(network = 'mainnet-beta') {
    validateNetwork(network);
    const connection = getConnection(network);
    const [slot, epochInfo, samples, transactionCount, price] = await Promise.all([
      rpc(() => connection.getSlot('confirmed')),
      rpc(() => connection.getEpochInfo('confirmed')),
      rpc(() => connection.getRecentPerformanceSamples(1)).catch(() => []),
      rpc(() => connection.getTransactionCount('confirmed')).catch(() => null),
      getSolanaPrice().catch(() => null),
    ]);
    const sample = samples?.[0];
    const tps = sample?.samplePeriodSecs ? sample.numTransactions / sample.samplePeriodSecs : null;
    const trueTps = sample?.samplePeriodSecs && sample.numNonVoteTransactions != null ? sample.numNonVoteTransactions / sample.samplePeriodSecs : null;
    const priceData = price ? { solPrice: price.usd ?? null, solPriceChange24h: price.usd_24h_change ?? null, marketCap: price.usd_market_cap ?? null, volume24h: price.usd_24h_vol ?? null, marketSource: price.source, marketFetchedAt: price.fetchedAt } : {};
    return fetched(network, { currentSlot: slot, currentEpoch: epochInfo.epoch, slotIndex: epochInfo.slotIndex, slotsInEpoch: epochInfo.slotsInEpoch, epochProgress: epochInfo.slotsInEpoch ? Number((epochInfo.slotIndex / epochInfo.slotsInEpoch * 100).toFixed(2)) : null, tps: tps == null ? null : Number(tps.toFixed(2)), trueTps: trueTps == null ? null : Number(trueTps.toFixed(2)), totalTransactions: transactionCount, validatorCount: null, blockTime: null, ...priceData });
  },
  async getLatestBlocks(network = 'mainnet-beta', limit = 15) {
    validateNetwork(network); checkedLimit(limit, 50);
    const connection = getConnection(network);
    const current = await rpc(() => connection.getSlot('confirmed'));
    const slots = await rpc(() => connection.getBlocks(Math.max(0, current - Math.max(limit * 2, 20)), current, 'confirmed'));
    const out = [];
    for (const slot of slots.slice(-limit).reverse()) {
      const block = await rpc(() => connection.getBlock(slot, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 1, transactionDetails: 'full', rewards: true }));
      if (block) out.push({ ...blockToView(block, slot), network, source: 'rpc', fetchedAt: new Date().toISOString(), stale: false });
    }
    return out;
  },
  async getBlockBySlot(network = 'mainnet-beta', slotNumber) {
    validateNetwork(network);
    if (!/^\d+$/.test(String(slotNumber)) || !Number.isSafeInteger(Number(slotNumber))) throw inputError('Invalid block slot');
    const slot = Number(slotNumber); const connection = getConnection(network);
    const block = await rpc(() => connection.getBlock(slot, { commitment: 'confirmed', encoding: 'jsonParsed', maxSupportedTransactionVersion: 1, transactionDetails: 'full', rewards: true }));
    if (!block) return null;
    const transactions = (block.transactions || []).map((tx) => {
      const signature = tx.transaction.signatures[0]; const message = tx.transaction.message;
      const keys = message.accountKeys || [];
      const signer = keys.find((key) => key.signer)?.pubkey?.toBase58?.() || keys[0]?.pubkey?.toBase58?.() || keys[0]?.toBase58?.() || null;
      return { signature, slot, blockTime: block.blockTime == null ? null : new Date(block.blockTime * 1000), status: !tx.meta || tx.meta.err === undefined ? 'Unavailable' : tx.meta.err === null ? 'Success' : 'Failed', fee: Number.isFinite(tx.meta?.fee) ? lamportsToSol(tx.meta.fee) : null, signer, network, source: 'rpc', fetchedAt: new Date().toISOString(), stale: false };
    });
    return { ...blockToView(block, slot), network, transactions, source: 'rpc', fetchedAt: new Date().toISOString(), stale: false };
  },
  async getLatestTransactions(network = 'mainnet-beta', limit = 25) {
    validateNetwork(network); checkedLimit(limit, 50);
    const blockCount = Math.min(20, Math.max(5, Math.ceil(limit / 25)));
    const blocks = await this.getLatestBlocks(network, blockCount);
    const transactions = [];
    for (const block of blocks) {
      const details = await this.getBlockBySlot(network, block.slot);
      for (const tx of details?.transactions || []) {
        transactions.push({ ...tx, source: 'rpc', fetchedAt: new Date().toISOString(), stale: false });
        if (transactions.length >= limit) return transactions;
      }
    }
    return transactions;
  },
  async getTransaction(network = 'mainnet-beta', signature) {
    validateNetwork(network);
    if (!isValidTxSignature(signature)) throw inputError('Invalid Solana transaction signature');
    const clean = signature.trim(); const connection = getConnection(network);
    const tx = await rpc(() => connection.getParsedTransaction(clean, { commitment: 'confirmed', maxSupportedTransactionVersion: 1 }));
    return tx ? { ...normalizeTransaction(tx, clean, network), source: 'rpc', fetchedAt: new Date().toISOString(), stale: false } : null;
  },
  async getAccountOverview(network = 'mainnet-beta', address) {
    validateNetwork(network); const pubkey = checkedAddress(address, 'address'); const connection = getConnection(network);
    const [balanceResult, accountResult, price] = await Promise.all([
      rpc(() => connection.getBalanceAndContext(pubkey, { commitment: 'confirmed' })),
      rpc(() => connection.getAccountInfoAndContext(pubkey, { commitment: 'confirmed' })),
      getSolanaPrice().catch(() => null),
    ]);
    const lamports = balanceResult.value;
    const info = accountResult.value;
    const owner = info?.owner?.toBase58?.() || null;
    return fetched(network, { address: pubkey.toBase58(), accountExists: info !== null, observedSlot: Math.min(balanceResult.context.slot, accountResult.context.slot), lamports, solBalance: lamportsToSol(lamports), usdValue: price?.usd != null ? Number((lamports / 1e9 * price.usd).toFixed(2)) : null, marketSource: price?.source || null, marketFetchedAt: price?.fetchedAt || null, executable: info?.executable ?? null, rentEpoch: info?.rentEpoch ?? null, space: info?.data?.length ?? null, ownerProgram: owner, ownerProgramName: owner ? (KNOWN_PROGRAMS[owner] || 'Unknown Program') : null, network });
  },
  async getAccountTokens(network = 'mainnet-beta', address) {
    validateNetwork(network); const owner = checkedAddress(address, 'address'); const connection = getConnection(network);
    const [classic, token2022] = await Promise.all([TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map((programId) => rpc(() => connection.getParsedTokenAccountsByOwner(owner, { programId }, 'confirmed'))));
    const mints = [...classic.value, ...token2022.value].map((item) => item.account.data.parsed?.info?.mint).filter(Boolean);
    const prices = await getTokenPrices(mints).catch(() => ({}));
    return [...classic.value, ...token2022.value].map((item) => {
      const info = item.account.data.parsed?.info; const amount = info?.tokenAmount;
      const known = POPULAR_TOKENS.find((token) => token.mint === info?.mint); const market = prices[info?.mint];
      const raw = amount?.amount || '0'; const uiAmountString = amount?.uiAmountString ?? null;
      const price = market?.price != null ? Number(market.price) : null;
      return { tokenAccount: item.pubkey.toBase58(), mint: info?.mint, name: known?.name || 'SPL Token', symbol: known?.symbol || null, decimals: amount?.decimals ?? null, rawAmount: raw, amount: uiAmountString == null ? null : Number(uiAmountString), price, usdValue: price == null || uiAmountString == null ? null : Number((Number(uiAmountString) * price).toFixed(2)), marketSource: prices[info?.mint]?.source || null, marketFetchedAt: prices[info?.mint]?.fetchedAt || null, icon: known?.icon || null, network, source: 'rpc', fetchedAt: new Date().toISOString(), stale: false };
    });
  },
  async getAccountTransactions(network = 'mainnet-beta', address, limit = 20) {
    validateNetwork(network); const owner = checkedAddress(address, 'address'); checkedLimit(limit, 100); const connection = getConnection(network);
    const signatures = await rpc(() => connection.getSignaturesForAddress(owner, { limit }, 'confirmed'));
    return signatures.map((sig) => ({ signature: sig.signature, slot: sig.slot, blockTime: sig.blockTime == null ? null : new Date(sig.blockTime * 1000), status: sig.err === null ? 'Success' : sig.err === undefined ? 'Unavailable' : 'Failed', err: sig.err ?? null, memo: sig.memo || null, signer: null, fee: null, network, source: 'rpc', fetchedAt: new Date().toISOString(), stale: false }));
  },
  async getTokens(network = 'mainnet-beta') {
    validateNetwork(network);
    if (network !== 'mainnet-beta') return [];
    return Promise.all(POPULAR_TOKENS.map(async (token) => {
      try { return await this.getTokenByMint(token.mint, network); } catch { return { mint: token.mint, name: token.name, symbol: token.symbol, icon: token.icon, decimals: null, supply: null, price: null, marketCap: null, holdersCount: null, network, source: 'unavailable', fetchedAt: new Date().toISOString(), stale: false, onChainStatus: 'unavailable' }; }
    }));
  },
  async getTokenByMint(mintAddress, network = 'mainnet-beta') {
    validateNetwork(network); const mint = checkedAddress(mintAddress, 'mint address'); const connection = getConnection(network);
    const parsed = await rpc(() => connection.getParsedAccountInfo(mint, 'confirmed'));
    const parsedInfo = parsed.value?.data?.parsed?.info;
    if (!parsedInfo || parsed.value?.data?.parsed?.type !== 'mint') return null;
    const known = POPULAR_TOKENS.find((token) => token.mint === mint.toBase58());
    const market = await getTokenPrices([mint.toBase58()]).catch(() => ({}));
    const price = market[mint.toBase58()]?.price != null ? Number(market[mint.toBase58()].price) : null;
    const decimals = parsedInfo.decimals ?? null; const rawSupply = parsedInfo.supply ?? null;
    const supply = rawSupply == null || decimals == null ? null : Number(rawSupply) / (10 ** decimals);
    return fetched(network, { mint: mint.toBase58(), name: known?.name || 'SPL Token', symbol: known?.symbol || null, metadataSource: known ? 'curated-registry' : null, icon: known?.icon || null, decimals, rawSupply, supply, price, marketCap: null, fullyDilutedValuation: price == null || supply == null ? null : price * supply, change24h: null, volume24h: null, holdersCount: null, holders: [], mintAuthority: parsedInfo.mintAuthority ?? null, freezeAuthority: parsedInfo.freezeAuthority ?? null, marketSource: market[mint.toBase58()]?.source || null, marketFetchedAt: market[mint.toBase58()]?.fetchedAt || null });
  },
  async universalSearch(query, network = 'mainnet-beta') {
    validateNetwork(network); if (!query || typeof query !== 'string' || !query.trim()) throw inputError('Search query is required');
    const clean = query.trim();
    if (/^\d+$/.test(clean)) { const slot = Number(clean); if (!Number.isSafeInteger(slot)) throw inputError('Invalid block slot'); return { type: 'block', target: `/block/${slot}`, label: `Block #${slot}`, details: { slot } }; }
    if (isValidTxSignature(clean)) return { type: 'transaction', target: `/tx/${clean}`, label: `Transaction: ${clean.slice(0, 8)}…${clean.slice(-8)}`, details: { signature: clean } };
    if (isValidSolanaAddress(clean)) {
      const token = await this.getTokenByMint(clean, network);
      return token ? { type: 'token', target: `/token/${clean}`, label: `${token.name} (${token.symbol || 'Token'})`, details: token } : { type: 'account', target: `/account/${clean}`, label: `Account: ${clean.slice(0, 6)}…${clean.slice(-6)}`, details: { address: clean } };
    }
    const token = POPULAR_TOKENS.find((item) => item.symbol.toLowerCase() === clean.toLowerCase() || item.name.toLowerCase() === clean.toLowerCase());
    return token ? { type: 'token', target: `/token/${token.mint}`, label: `${token.name} (${token.symbol})`, details: { mint: token.mint } } : null;
  },
  getHistoricalTps() { return []; },
};
