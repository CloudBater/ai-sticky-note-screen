import type { AddressInfo } from "node:net";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/app";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;
type CreateConfiguredApp = (options: {
  fetchFrankfurter: FetchFrankfurter;
  frankfurterBaseUrl: string;
}) => ReturnType<typeof createApp>;

describe("GET /api/rates/history", () => {
  it("proxies Frankfurter daily historical reference rates for a pair", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          start_date: "2024-08-21",
          end_date: "2024-08-23",
          rates: {
            "2024-08-21": { EUR: 0.899 },
            "2024-08-22": { EUR: 0.902 },
            "2024-08-23": { EUR: 0.901 },
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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbol=eur&start=2024-08-21&end=2024-08-23`,
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        base: "USD",
        symbol: "EUR",
        startDate: "2024-08-21",
        endDate: "2024-08-23",
        points: [
          { date: "2024-08-21", rate: 0.899 },
          { date: "2024-08-22", rate: 0.902 },
          { date: "2024-08-23", rate: 0.901 },
        ],
      });
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/2024-08-21..2024-08-23?from=USD&to=EUR",
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

  it("rejects invalid historical rate query parameters before calling Frankfurter", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbol=&start=2024-08-23&end=2024-08-21`,
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid historical rates request",
      });
      expect(upstreamRequests).toEqual([]);
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

  it("rejects incomplete historical rate responses instead of returning undefined rates", async () => {
    const fetchFrankfurter: FetchFrankfurter = async () =>
      new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          start_date: "2024-08-21",
          end_date: "2024-08-23",
          rates: {
            "2024-08-21": { EUR: 0.899 },
            "2024-08-22": {},
            "2024-08-23": { EUR: 0.901 },
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );

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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbol=eur&start=2024-08-21&end=2024-08-23`,
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Unable to fetch historical reference rates",
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
