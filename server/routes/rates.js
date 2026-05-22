import { Router } from 'express';

const router = Router();

const SUPPORTED_PAIRS = ['EUR', 'JPY', 'GBP', 'CNY', 'SGD'];
const BASE_URL = 'https://api.frankfurter.app';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — data only changes once per business day

const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

async function frankfurterGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Frankfurter ${res.status}: ${await res.text()}`);
  return res.json();
}

// GET /api/rates — latest ECB daily rates, USD as base
router.get('/', async (req, res) => {
  const cached = getCached('latest');
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const symbols = SUPPORTED_PAIRS.join(',');
    const data = await frankfurterGet(`/latest?from=USD&to=${symbols}`);
    const body = {
      base: data.base,
      date: data.date,
      rates: data.rates,
      note: 'ECB reference rate, updated once per business day at 16:00 CET',
    };
    setCached('latest', body);
    res.set('X-Cache', 'MISS');
    res.json(body);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/rates/history?pair=EUR&days=30
router.get('/history', async (req, res) => {
  const pair = (req.query.pair || 'EUR').toUpperCase();
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);

  if (!SUPPORTED_PAIRS.includes(pair)) {
    return res.status(400).json({
      error: `'${pair}' is not in the ECB reference set. Supported: ${SUPPORTED_PAIRS.join(', ')}`,
    });
  }

  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const cacheKey = `history-${pair}-${end}-${days}`;

  const cached = getCached(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const data = await frankfurterGet(`/${start}..${end}?from=USD&to=${pair}`);
    const history = Object.entries(data.rates).map(([date, rates]) => ({
      date,
      rate: rates[pair],
    }));
    const body = {
      base: 'USD',
      pair,
      history,
      note: 'Daily ECB closing rates — not a prediction',
    };
    setCached(cacheKey, body);
    res.set('X-Cache', 'MISS');
    res.json(body);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
