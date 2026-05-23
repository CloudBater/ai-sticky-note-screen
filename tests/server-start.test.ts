import type { AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";

import { startBackendServer } from "../src/server/start";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;

describe("startBackendServer", () => {
  it("starts the backend with environment-derived config", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
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

    const server = await startBackendServer({
      env: {
        PORT: "0",
        FRANKFURTER_BASE_URL: "https://api.frankfurter.test",
      },
      fetchFrankfurter,
      hostname: "127.0.0.1",
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/rates/latest?base=usd&symbols=eur`,
      );

      expect(response.status).toBe(200);
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/latest?from=USD&to=EUR",
      ]);
    } finally {
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
  });
});
