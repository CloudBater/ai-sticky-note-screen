import { describe, expect, it } from "vitest";

import {
  loadDashboardViewModel,
  type DashboardViewModel,
} from "../src/client/dashboard";

describe("historical chart data pipeline", () => {
  it("exposes historical rate points for the chart in the view model", async () => {
    const viewModel = await loadDashboardViewModel({
      simulationBalance: 10_000,
      requestedCurrencies: ["usd", "eur"],
      fetchReferenceData: async () => ({
        currencies: {
          USD: "US Dollar",
          EUR: "Euro",
        },
        latestRates: {
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.945,
          },
        },
      }),
      fetchHistoricalRates: async (request) => ({
        base: request.baseCurrency,
        symbol: request.symbols[0],
        startDate: request.startDate,
        endDate: request.endDate,
        points: [
          { date: "2024-08-21", rate: 0.9 },
          { date: "2024-08-22", rate: 0.92 },
          { date: "2024-08-23", rate: 0.945 },
        ],
      }),
    });

    expect(viewModel.historicalTrend.points).toEqual([
      { date: "2024-08-21", rate: 0.9 },
      { date: "2024-08-22", rate: 0.92 },
      { date: "2024-08-23", rate: 0.945 },
    ]);
    expect(viewModel.historicalTrend.baseCurrency).toBe("USD");
    expect(viewModel.historicalTrend.symbol).toBe("EUR");
  });

  it("defaults to empty points when no historical data is available", async () => {
    const viewModel = await loadDashboardViewModel({
      simulationBalance: 10_000,
      requestedCurrencies: ["usd", "twd"],
      fetchReferenceData: async () => ({
        currencies: {
          USD: "US Dollar",
        },
        latestRates: {
          base: "USD",
          date: "Unavailable",
          rates: {},
        },
      }),
    });

    expect(viewModel.historicalTrend.points).toEqual([]);
    expect(viewModel.historicalTrend.baseCurrency).toBe("USD");
    expect(viewModel.historicalTrend.symbol).toBe("");
  });

  it("exposes all currency series for chart switching", async () => {
    const viewModel = await loadDashboardViewModel({
      simulationBalance: 10_000,
      requestedCurrencies: ["usd", "eur", "jpy"],
      fetchReferenceData: async () => ({
        currencies: {
          USD: "US Dollar",
          CNY: "Chinese Yuan",
          EUR: "Euro",
          JPY: "Japanese Yen",
        },
        latestRates: {
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.945,
            JPY: 144.9,
          },
        },
      }),
      fetchHistoricalRates: async (request) => ({
        base: request.baseCurrency,
        symbol: request.symbols[0],
        startDate: request.startDate,
        endDate: request.endDate,
        points:
          request.symbols[0] === "CNY"
            ? [
                { date: "2024-08-21", rate: 7.01 },
                { date: "2024-08-23", rate: 7.12 },
              ]
            : request.symbols[0] === "EUR"
            ? [
                { date: "2024-08-21", rate: 0.9 },
                { date: "2024-08-23", rate: 0.945 },
              ]
            : [
                { date: "2024-08-21", rate: 140 },
                { date: "2024-08-23", rate: 144.9 },
              ],
      }),
    });

    expect(viewModel.historicalTrend.allSeries).toEqual([
      {
        symbols: ["CNY"],
        points: [
          { date: "2024-08-21", rate: 7.01 },
          { date: "2024-08-23", rate: 7.12 },
        ],
      },
      {
        symbols: ["EUR"],
        points: [
          { date: "2024-08-21", rate: 0.9 },
          { date: "2024-08-23", rate: 0.945 },
        ],
      },
      {
        symbols: ["JPY"],
        points: [
          { date: "2024-08-21", rate: 140 },
          { date: "2024-08-23", rate: 144.9 },
        ],
      },
    ]);
  });

  it("loads up to one year of historical points for supported currency charts", async () => {
    const requestedWindows: Array<{ startDate: string; endDate: string }> = [];

    await loadDashboardViewModel({
      simulationBalance: 10_000,
      requestedCurrencies: ["usd", "cny"],
      fetchReferenceData: async () => ({
        currencies: {
          USD: "US Dollar",
          CNY: "Chinese Yuan",
        },
        latestRates: {
          base: "USD",
          date: "2024-08-23",
          rates: {
            CNY: 7.12,
          },
        },
      }),
      fetchHistoricalRates: async (request) => {
        requestedWindows.push({
          startDate: request.startDate,
          endDate: request.endDate,
        });

        return {
          base: request.baseCurrency,
          symbol: request.symbols[0],
          startDate: request.startDate,
          endDate: request.endDate,
          points: [
            { date: request.startDate, rate: 7.01 },
            { date: request.endDate, rate: 7.12 },
          ],
        };
      },
    });

    expect(requestedWindows).toEqual([
      {
        startDate: "2023-08-24",
        endDate: "2024-08-23",
      },
    ]);
  });
});
