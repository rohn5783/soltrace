import axios from 'axios';

const TTL_MS = 60_000;
let solCache = null;
const tokenCache = new Map();

export const getSolanaPrice = async () => {
  if (solCache && Date.now() - solCache.cachedAt < TTL_MS) return { ...solCache.value, source: 'cache' };
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
    params: { ids: 'solana', vs_currencies: 'usd', include_24hr_vol: true, include_24hr_change: true, include_market_cap: true },
    timeout: Number(process.env.MARKET_DATA_TIMEOUT_MS) || 4000,
  });
  const row = response.data?.solana;
  if (!row || !Number.isFinite(row.usd)) throw new Error('SOL market data unavailable');
  const value = { usd: row.usd, usd_24h_change: Number.isFinite(row.usd_24h_change) ? row.usd_24h_change : null, usd_market_cap: Number.isFinite(row.usd_market_cap) ? row.usd_market_cap : null, usd_24h_vol: Number.isFinite(row.usd_24h_vol) ? row.usd_24h_vol : null, source: 'coingecko', fetchedAt: new Date().toISOString() };
  solCache = { value, cachedAt: Date.now() };
  return value;
};

export const getTokenPrices = async (mintAddresses = []) => {
  const unique = [...new Set(mintAddresses)].filter((mint) => typeof mint === 'string' && mint.length <= 44);
  if (!unique.length) return {};
  const now = Date.now();
  const missing = unique.filter((mint) => !tokenCache.has(mint) || now - tokenCache.get(mint).cachedAt >= TTL_MS);
  if (missing.length) {
    const response = await axios.get('https://api.jup.ag/price/v2', { params: { ids: missing.join(',') }, timeout: Number(process.env.MARKET_DATA_TIMEOUT_MS) || 4000 });
    for (const mint of missing) {
      const price = Number(response.data?.data?.[mint]?.price);
      tokenCache.set(mint, { value: Number.isFinite(price) ? { price, source: 'jupiter', fetchedAt: new Date().toISOString() } : null, cachedAt: now });
    }
  }
  return Object.fromEntries(unique.map((mint) => {
    const entry = tokenCache.get(mint);
    return [mint, entry?.value ? { ...entry.value, source: now - entry.cachedAt < 1 ? 'jupiter' : 'cache' } : null];
  }).filter(([, value]) => value));
};
