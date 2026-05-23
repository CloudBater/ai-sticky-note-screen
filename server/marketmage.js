const RILEY_CODES = ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"];
const CACHE_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 60;

export function buildCurrencyUniverse(currencies) {
  const supported = RILEY_CODES
    .filter((code) => currencies[code])
    .map((code) => ({ code, name: currencies[code] }));

  const unsupported = RILEY_CODES.filter((code) => !currencies[code]);

  return { supported, unsupported };
}

export function summarizeHistory(rates, symbol) {
  const dates = Object.keys(rates).sort();

  if (dates.length === 0) {
    return null;
  }

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const first = rates[firstDate][symbol];
  const last = rates[lastDate][symbol];
  const changePercent = Number((((last - first) / first) * 100).toFixed(2));

  return { firstDate, lastDate, first, last, changePercent };
}

export function createMemoryCache(ttlMs = CACHE_TTL_MS) {
  const items = new Map();

  return {
    async get(key, loader) {
      const cached = items.get(key);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        return cached.value;
      }

      const value = await loader();
      items.set(key, { value, expiresAt: now + ttlMs });
      return value;
    }
  };
}

export function createRateLimiter(limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS) {
  const clients = new Map();

  return function rateLimiter(req, res, next) {
    const key = req.ip || "local";
    const now = Date.now();
    const record = clients.get(key);

    if (!record || record.resetAt <= now) {
      clients.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= limit) {
      res.status(429).json({ error: "Too many requests. Please try again soon." });
      return;
    }

    record.count += 1;
    next();
  };
}

export function normalizeCodes(rawCodes) {
  if (!rawCodes) {
    return ["EUR", "JPY", "TWD", "GBP", "SGD"];
  }

  return rawCodes
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

export function assertSupportedCodes(codes, currencies) {
  const unsupported = codes.filter((code) => !currencies[code]);

  if (unsupported.length > 0) {
    const error = new Error(`Unsupported currency: ${unsupported.join(", ")}`);
    error.status = 400;
    error.unsupported = unsupported;
    throw error;
  }
}
