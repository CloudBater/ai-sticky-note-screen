import type { AddressInfo } from "node:net";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/app";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;
type CreateConfiguredApp = (options: {
  fetchFrankfurter: FetchFrankfurter;
  frankfurterBaseUrl: string;
}) => ReturnType<typeof createApp>;

describe("GET /api/rates/latest", () => {
  it("proxies Frankfurter and normalizes the latest daily reference rates", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.901,
            JPY: 144.9,
            GBP: 0.787,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    };

    const server = createServer(
      (createApp as CreateConfiguredApp)({
        fetchFrankfurter,
        frankfurterBaseUrl: "https://api.frankfurter.test",
      }),
    );

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/rates/latest?base=usd&symbols=eur,jpy,gbp`,
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        base: "USD",
        date: "2024-08-23",
        rates: {
          EUR: 0.901,
          JPY: 144.9,
          GBP: 0.787,
        },
      });
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/latest?from=USD&to=EUR%2CJPY%2CGBP",
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

  it("returns a clear error response when Frankfurter fails", async () => {
    const fetchFrankfurter: FetchFrankfurter = async () =>
      new Response(JSON.stringify({ message: "upstream unavailable" }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      });

    const server = createServer(
      (createApp as CreateConfiguredApp)({
        fetchFrankfurter,
        frankfurterBaseUrl: "https://api.frankfurter.test",
      }),
    );

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/rates/latest?base=usd&symbols=eur`,
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Unable to fetch latest reference rates",
      });
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
