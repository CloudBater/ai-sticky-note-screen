import express from "express";

import {
  assertSupportedCodes,
  buildCurrencyUniverse,
  createMemoryCache,
  createRateLimiter,
  normalizeCodes,
  summarizeHistory
} from "./marketmage.js";

const FRANKFURTER_BASE_URL = "https://api.frankfurter.app";
const cache = createMemoryCache();

async function getJson(path) {
  const response = await fetch(`${FRANKFURTER_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Frankfurter request failed with ${response.status}`);
  }

  return response.json();
}

function daysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function createApp() {
  const app = express();

  app.use("/api", createRateLimiter());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/currencies", async (_req, res, next) => {
    try {
      const currencies = await cache.get("currencies", () => getJson("/currencies"));
      res.json(buildCurrencyUniverse(currencies));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/latest", async (req, res, next) => {
    try {
      const currencies = await cache.get("currencies", () => getJson("/currencies"));
      const base = (req.query.base || "USD").toString().toUpperCase();
      const symbols = normalizeCodes(req.query.symbols?.toString());
      assertSupportedCodes([base, ...symbols], currencies);

      const key = `latest:${base}:${symbols.join(",")}`;
      const latest = await cache.get(key, () => (
        getJson(`/latest?from=${base}&to=${symbols.join(",")}`)
      ));

      res.json(latest);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/history", async (req, res, next) => {
    try {
      const currencies = await cache.get("currencies", () => getJson("/currencies"));
      const base = (req.query.base || "USD").toString().toUpperCase();
      const symbol = (req.query.symbol || "EUR").toString().toUpperCase();
      assertSupportedCodes([base, symbol], currencies);

      const end = new Date().toISOString().slice(0, 10);
      const start = daysAgo(45);
      const key = `history:${base}:${symbol}:${start}:${end}`;
      const history = await cache.get(key, () => (
        getJson(`/${start}..${end}?from=${base}&to=${symbol}`)
      ));

      res.json({
        ...history,
        summary: summarizeHistory(history.rates, symbol)
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    const status = error.status || 502;
    res.status(status).json({
      error: error.status ? error.message : "Could not load exchange-rate data.",
      unsupported: error.unsupported
    });
  });

  return app;
}
