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
        symbol: request.symbol,
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
        symbol: request.symbol,
        startDate: request.startDate,
        endDate: request.endDate,
        points:
          request.symbol === "EUR"
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
        symbol: "EUR",
        points: [
          { date: "2024-08-21", rate: 0.9 },
          { date: "2024-08-23", rate: 0.945 },
        ],
      },
      {
        symbol: "JPY",
        points: [
          { date: "2024-08-21", rate: 140 },
          { date: "2024-08-23", rate: 144.9 },
        ],
      },
    ]);
  });
});
