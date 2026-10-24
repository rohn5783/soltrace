import axios from 'axios';

let priceCache = {
  sol: {
    usd: 186.5,
    usd_24h_change: 4.15,
    usd_market_cap: 89500000000,
    usd_24h_vol: 3450000000,
  },
  tokens: {},
  lastUpdated: 0,
};

const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export const getSolanaPrice = async () => {
  const now = Date.now();
  if (now - priceCache.lastUpdated < CACHE_TTL_MS && priceCache.sol.usd > 0) {
    return priceCache.sol;
  }

  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'solana',
        vs_currencies: 'usd',
        include_24hr_vol: 'true',
        include_24hr_change: 'true',
        include_market_cap: 'true',
      },
      timeout: 3500,
    });

    if (res.data?.solana) {
      priceCache.sol = {
        usd: res.data.solana.usd,
        usd_24h_change: res.data.solana.usd_24h_change || 0,
        usd_market_cap: res.data.solana.usd_market_cap || 89000000000,
        usd_24h_vol: res.data.solana.usd_24h_vol || 3000000000,
      };
      priceCache.lastUpdated = now;
    }
  } catch (err) {
    // If rate-limited or offline, return cached or fallback price
    console.debug('[PriceService] Live price fetch failed or throttled, using cache:', err.message);
  }

  return priceCache.sol;
};

export const getTokenPrices = async (mintAddresses = []) => {
  if (!mintAddresses.length) return {};
  try {
    const ids = mintAddresses.join(',');
    const res = await axios.get(`https://api.jup.ag/price/v2?ids=${ids}`, {
      timeout: 3500,
    });
    return res.data?.data || {};
  } catch (err) {
    return {};
  }
};
