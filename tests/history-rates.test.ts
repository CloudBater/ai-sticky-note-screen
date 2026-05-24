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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbols=eur&start=2024-08-21&end=2024-08-23`,
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

  it("accepts the singular symbol query parameter used by the frontend chart", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          start_date: "2026-04-22",
          end_date: "2026-05-22",
          rates: {
            "2026-04-22": { CNY: 6.8244 },
            "2026-05-22": { CNY: 6.7953 },
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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbol=cny&start=2026-04-22&end=2026-05-22`,
      );

      expect(response.status).toBe(200);
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/2026-04-22..2026-05-22?from=USD&to=CNY",
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

  it("preserves a versioned Frankfurter base URL when building history requests", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          start_date: "2026-04-22",
          end_date: "2026-05-22",
          rates: {
            "2026-04-22": { CNY: 6.8244 },
            "2026-05-22": { CNY: 6.7953 },
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
        frankfurterBaseUrl: "https://api.frankfurter.test/v1",
      }),
    );

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbols=cny&start=2026-04-22&end=2026-05-22`,
      );

      expect(response.status).toBe(200);
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/v1/2026-04-22..2026-05-22?from=USD&to=CNY",
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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbols=&start=2024-08-23&end=2024-08-21`,
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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbols=eur&start=2024-08-21&end=2024-08-23`,
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

  it("returns a clear error response when Frankfurter history JSON is malformed", async () => {
    const fetchFrankfurter: FetchFrankfurter = async () =>
      new Response("{bad-json", {
        headers: { "Content-Type": "application/json" },
        status: 200,
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
        `http://127.0.0.1:${port}/api/rates/history?base=usd&symbols=eur&start=2024-08-21&end=2024-08-23`,
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

  it("caches identical historical reference rate requests during the app lifetime", async () => {
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
      const url = `http://127.0.0.1:${port}/api/rates/history?base=usd&symbols=eur&start=2024-08-21&end=2024-08-23`;

      const firstResponse = await fetch(url);
      const secondResponse = await fetch(url);

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      await expect(firstResponse.json()).resolves.toEqual({
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
      await expect(secondResponse.json()).resolves.toEqual({
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
});
