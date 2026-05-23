import { describe, expect, it } from "vitest";

import { fetchHistoricalReferenceRates } from "../src/client/dashboard-history-api";

describe("fetchHistoricalReferenceRates", () => {
  it("loads daily historical reference rates from the backend API", async () => {
    const requestedUrls: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requestedUrls.push(url);

      if (
        url ===
        "/api/rates/history?base=USD&symbol=EUR&start=2024-08-21&end=2024-08-23"
      ) {
        return {
          base: "USD",
          symbol: "EUR",
          startDate: "2024-08-21",
          endDate: "2024-08-23",
          points: [
            { date: "2024-08-21", rate: 0.899 },
            { date: "2024-08-22", rate: 0.902 },
            { date: "2024-08-23", rate: 0.901 },
          ],
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(
      fetchHistoricalReferenceRates({
        baseCurrency: "usd",
        symbol: "eur",
        startDate: "2024-08-21",
        endDate: "2024-08-23",
        fetchJson,
      }),
    ).resolves.toEqual({
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
    expect(requestedUrls).toEqual([
      "/api/rates/history?base=USD&symbol=EUR&start=2024-08-21&end=2024-08-23",
    ]);
  });
});
