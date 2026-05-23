import { describe, expect, it } from "vitest";

import { fetchDashboardReferenceData } from "../src/client/dashboard-api";

describe("fetchDashboardReferenceData", () => {
  it("loads currencies and latest rates from the backend API", async () => {
    const requestedUrls: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requestedUrls.push(url);

      if (url === "/api/currencies") {
        return {
          currencies: {
            USD: "US Dollar",
            EUR: "Euro",
            JPY: "Japanese Yen",
          },
        };
      }

      if (url === "/api/rates/latest?base=USD&symbols=EUR%2CJPY") {
        return {
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.901,
            JPY: 144.9,
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(
      fetchDashboardReferenceData({
        baseCurrency: "usd",
        symbols: ["eur", "jpy", "twd"],
        fetchJson,
      }),
    ).resolves.toEqual({
      currencies: {
        USD: "US Dollar",
        EUR: "Euro",
        JPY: "Japanese Yen",
      },
      latestRates: {
        base: "USD",
        date: "2024-08-23",
        rates: {
          EUR: 0.901,
          JPY: 144.9,
        },
      },
    });
    expect(requestedUrls).toEqual([
      "/api/currencies",
      "/api/rates/latest?base=USD&symbols=EUR%2CJPY",
    ]);
  });

  it("skips latest rates when no requested target symbols are supported", async () => {
    const requestedUrls: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requestedUrls.push(url);

      if (url === "/api/currencies") {
        return {
          currencies: {
            USD: "US Dollar",
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(
      fetchDashboardReferenceData({
        baseCurrency: "usd",
        symbols: ["twd"],
        fetchJson,
      }),
    ).resolves.toEqual({
      currencies: {
        USD: "US Dollar",
      },
      latestRates: {
        base: "USD",
        date: "Unavailable",
        rates: {},
      },
    });
    expect(requestedUrls).toEqual(["/api/currencies"]);
  });
});
