import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

import { describe, expect, it } from "vitest";

import { readServerConfig } from "../src/server/config";
import { createBackendServer } from "../src/server/server";
import { startBackendServer } from "../src/server/start";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;

function createLatestRatesFetch(upstreamRequests: string[]): FetchFrankfurter {
  return async (url) => {
    upstreamRequests.push(String(url));

    return new Response(
      JSON.stringify({
        amount: 1,
        base: "USD",
        date: "2024-08-23",
        rates: { EUR: 0.901 },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  };
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error: Error | undefined) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function fetchLatestRateFrom(server: Server): Promise<Response> {
  const address = server.address() as AddressInfo;
  const port = address.port;

  return fetch(
    `http://127.0.0.1:${port}/api/rates/latest?base=usd&symbols=eur`,
  );
}

describe("backend startup wiring", () => {
  it("uses safe defaults for local backend startup", () => {
    expect(readServerConfig({})).toEqual({
      port: 3000,
      frankfurterBaseUrl: "https://api.frankfurter.app",
    });
  });

  it("reads the backend port and Frankfurter base URL from environment variables", () => {
    expect(
      readServerConfig({
        PORT: "4173",
        FRANKFURTER_BASE_URL: "https://api.frankfurter.test",
      }),
    ).toEqual({
      port: 4173,
      frankfurterBaseUrl: "https://api.frankfurter.test",
    });
  });

  it("creates a local HTTP server wired to the MarketMage backend app", async () => {
    const upstreamRequests: string[] = [];
    const server = createBackendServer({
      fetchFrankfurter: createLatestRatesFetch(upstreamRequests),
      frankfurterBaseUrl: "https://api.frankfurter.test",
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const response = await fetchLatestRateFrom(server);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        base: "USD",
        date: "2024-08-23",
        rates: { EUR: 0.901 },
      });
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/latest?from=USD&to=EUR",
      ]);
    } finally {
      await closeServer(server);
    }
  });

  it("starts the backend with environment-derived config", async () => {
    const upstreamRequests: string[] = [];
    const server = await startBackendServer({
      env: {
        PORT: "0",
        FRANKFURTER_BASE_URL: "https://api.frankfurter.test",
      },
      fetchFrankfurter: createLatestRatesFetch(upstreamRequests),
      hostname: "127.0.0.1",
    });

    try {
      const response = await fetchLatestRateFrom(server);

      expect(response.status).toBe(200);
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/latest?from=USD&to=EUR",
      ]);
    } finally {
      await closeServer(server);
    }
  });
});
