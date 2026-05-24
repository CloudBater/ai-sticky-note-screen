import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { STARTING_BALANCE, buildPortfolioCurve, buildSignal } from "./portfolio.js";
import "./styles.css";

const DEFAULT_SYMBOLS = ["EUR", "JPY", "GBP", "CNY", "SGD"];
const DEFAULT_CODES = ["USD", ...DEFAULT_SYMBOLS];
const PAIR_PRESETS = [
  ["USD", "EUR"],
  ["EUR", "JPY"],
  ["CNY", "SGD"],
  ["GBP", "JPY"]
];

function formatRate(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 2 : 4
  }).format(value);
}

function formatBaseValue(value, base) {
  if (base === "USD") {
    return `$${value.toLocaleString()}`;
  }

  return `${value.toLocaleString()} ${base}`;
}

function buildRateRows(rates, symbol) {
  return Object.entries(rates || {})
    .filter(([, dailyRates]) => Number.isFinite(dailyRates[symbol]))
    .sort()
    .map(([date, dailyRates], index, entries) => {
      const rate = dailyRates[symbol];
      const previousRate = index > 0 ? entries[index - 1][1][symbol] : null;
      const dailyChange = previousRate ? ((rate - previousRate) / previousRate) * 100 : 0;

      return {
        date,
        rate,
        dailyChange: Number(dailyChange.toFixed(2))
      };
    });
}

function getNearestPoint(event, points) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width) * 100;

  return points.reduce((nearest, point) => (
    Math.abs(point.x - x) < Math.abs(nearest.x - x) ? point : nearest
  ), points[0]);
}

function MiniChart({ rates, symbol }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chart = useMemo(() => {
    const rows = buildRateRows(rates, symbol);
    if (rows.length === 0) {
      return null;
    }

    const values = rows.map((row) => row.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    const minIndex = values.indexOf(min);
    const maxIndex = values.indexOf(max);
    const xFor = (index) => 8 + (index / Math.max(rows.length - 1, 1)) * 84;
    const yFor = (value) => 82 - ((value - min) / spread) * 66;
    const plottedPoints = rows.map((row, index) => ({
      ...row,
      x: xFor(index),
      y: yFor(row.rate)
    }));
    const points = plottedPoints.map((point) => `${point.x},${point.y}`).join(" ");

    return {
      firstDate: rows[0].date,
      lastDate: rows[rows.length - 1].date,
      max,
      maxPoint: { x: xFor(maxIndex), y: yFor(max) },
      min,
      minPoint: { x: xFor(minIndex), y: yFor(min) },
      plottedPoints,
      points
    };
  }, [rates, symbol]);

  if (!chart) {
    return <div className="empty-chart">No history yet</div>;
  }

  return (
    <svg
      className="chart"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${symbol} daily trend`}
      onMouseLeave={() => setHoveredPoint(null)}
    >
      <polyline points={chart.points} />
      <circle cx={chart.maxPoint.x} cy={chart.maxPoint.y} r="1.4" />
      <circle cx={chart.minPoint.x} cy={chart.minPoint.y} r="1.4" />
      <text className="chart-label" x="8" y="8">High {formatRate(chart.max)}</text>
      <text className="chart-label" x="8" y="94">{chart.firstDate}</text>
      <text className="chart-label chart-label-end" x="92" y="94">{chart.lastDate}</text>
      <text className="chart-label chart-label-end" x="92" y="8">Low {formatRate(chart.min)}</text>
      {hoveredPoint ? (
        <g className="chart-tooltip">
          <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1="12" y2="86" />
          <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="2" />
          <rect x={hoveredPoint.x > 62 ? hoveredPoint.x - 42 : hoveredPoint.x + 2} y={hoveredPoint.y > 58 ? hoveredPoint.y - 20 : hoveredPoint.y + 4} width="40" height="15" rx="2" />
          <text x={hoveredPoint.x > 62 ? hoveredPoint.x - 39 : hoveredPoint.x + 5} y={hoveredPoint.y > 58 ? hoveredPoint.y - 13 : hoveredPoint.y + 11}>{hoveredPoint.date}</text>
          <text x={hoveredPoint.x > 62 ? hoveredPoint.x - 39 : hoveredPoint.x + 5} y={hoveredPoint.y > 58 ? hoveredPoint.y - 7 : hoveredPoint.y + 17}>{formatRate(hoveredPoint.rate)}</text>
        </g>
      ) : null}
      <rect
        className="chart-hitbox"
        x="0"
        y="0"
        width="100"
        height="100"
        onClick={(event) => setHoveredPoint(getNearestPoint(event, chart.plottedPoints))}
        onMouseMove={(event) => setHoveredPoint(getNearestPoint(event, chart.plottedPoints))}
      />
    </svg>
  );
}

function PortfolioChart({ points, valueFormatter = formatRate }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chart = useMemo(() => {
    if (points.length === 0) {
      return null;
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    const minIndex = values.indexOf(min);
    const maxIndex = values.indexOf(max);
    const xFor = (index) => 8 + (index / Math.max(points.length - 1, 1)) * 84;
    const yFor = (value) => 82 - ((value - min) / spread) * 66;
    const plottedPoints = points.map((point, index) => ({
      ...point,
      x: xFor(index),
      y: yFor(point.value)
    }));
    const line = plottedPoints.map((point) => `${point.x},${point.y}`).join(" ");

    return {
      firstDate: points[0].date,
      lastDate: points[points.length - 1].date,
      line,
      max,
      maxPoint: { x: xFor(maxIndex), y: yFor(max) },
      min,
      minPoint: { x: xFor(minIndex), y: yFor(min) },
      plottedPoints
    };
  }, [points]);

  if (!chart) {
    return <div className="empty-chart">No portfolio history yet</div>;
  }

  return (
    <svg
      className="chart pnl-chart"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Simulated portfolio curve"
      onMouseLeave={() => setHoveredPoint(null)}
    >
      <polyline points={chart.line} />
      <circle cx={chart.maxPoint.x} cy={chart.maxPoint.y} r="1.4" />
      <circle cx={chart.minPoint.x} cy={chart.minPoint.y} r="1.4" />
      <text className="chart-label" x="8" y="8">High {valueFormatter(chart.max)}</text>
      <text className="chart-label" x="8" y="94">{chart.firstDate}</text>
      <text className="chart-label chart-label-end" x="92" y="94">{chart.lastDate}</text>
      <text className="chart-label chart-label-end" x="92" y="8">Low {valueFormatter(chart.min)}</text>
      {hoveredPoint ? (
        <g className="chart-tooltip">
          <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1="12" y2="86" />
          <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="2" />
          <rect x={hoveredPoint.x > 62 ? hoveredPoint.x - 48 : hoveredPoint.x + 2} y={hoveredPoint.y > 58 ? hoveredPoint.y - 20 : hoveredPoint.y + 4} width="46" height="15" rx="2" />
          <text x={hoveredPoint.x > 62 ? hoveredPoint.x - 45 : hoveredPoint.x + 5} y={hoveredPoint.y > 58 ? hoveredPoint.y - 13 : hoveredPoint.y + 11}>{hoveredPoint.date}</text>
          <text x={hoveredPoint.x > 62 ? hoveredPoint.x - 45 : hoveredPoint.x + 5} y={hoveredPoint.y > 58 ? hoveredPoint.y - 7 : hoveredPoint.y + 17}>{valueFormatter(hoveredPoint.value)}</text>
        </g>
      ) : null}
      <rect
        className="chart-hitbox"
        x="0"
        y="0"
        width="100"
        height="100"
        onClick={(event) => setHoveredPoint(getNearestPoint(event, chart.plottedPoints))}
        onMouseMove={(event) => setHoveredPoint(getNearestPoint(event, chart.plottedPoints))}
      />
    </svg>
  );
}

function App() {
  const [currencies, setCurrencies] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState(null);
  const [base, setBase] = useState("USD");
  const [selected, setSelected] = useState("EUR");
  const [startingBalance, setStartingBalance] = useState(STARTING_BALANCE);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const supportedCodes = useMemo(
    () => currencies?.supported?.map((currency) => currency.code) || DEFAULT_CODES,
    [currencies]
  );
  const comparisonSymbols = useMemo(
    () => supportedCodes.filter((code) => code !== base),
    [base, supportedCodes]
  );

  useEffect(() => {
    async function loadCurrencies() {
      const response = await fetch("/api/currencies");
      if (!response.ok) {
        throw new Error("Could not load supported currencies.");
      }
      setCurrencies(await response.json());
    }

    loadCurrencies().catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    async function loadRates() {
      setError("");
      setLatest(null);
      setHistory(null);
      const latestResponse = await fetch(`/api/latest?base=${base}&symbols=${comparisonSymbols.join(",")}`);
      const historyResponse = await fetch(`/api/history?base=${base}&symbol=${selected}`);

      if (!latestResponse.ok || !historyResponse.ok) {
        throw new Error("Could not load exchange-rate data.");
      }

      if (requestId.current !== currentRequest) {
        return;
      }

      setLatest(await latestResponse.json());
      setHistory(await historyResponse.json());
    }

    loadRates().catch((loadError) => {
      if (requestId.current === currentRequest) {
        setError(loadError.message);
      }
    });
  }, [base, comparisonSymbols, selected]);

  const rates = latest?.rates || {};
  const summary = history?.summary;
  const summaryWithSymbol = summary ? { ...summary, baseSymbol: base, symbol: selected } : null;
  const signal = buildSignal(summaryWithSymbol);
  const rateRows = buildRateRows(history?.rates, selected);
  const recentRateRows = rateRows.slice(-8).reverse();
  const portfolioCurve = buildPortfolioCurve(history?.rates, selected, startingBalance);
  const portfolioLast = portfolioCurve[portfolioCurve.length - 1];
  const recentPortfolioRows = portfolioCurve.slice(-8).reverse();
  const selectPair = (nextBase, nextSelected) => {
    setBase(nextBase);
    setSelected(nextSelected);
  };

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">MarketMage</p>
          <h1>Daily FX reference rates, without fake trading magic.</h1>
          <p className="lede">
            A small dashboard for comparing Frankfurter's daily exchange rates and recent movement across supported currencies.
          </p>
        </div>
        <div className="status-card">
          <span>Data source</span>
          <strong>Frankfurter / ECB</strong>
          <small>{latest ? `As of ${latest.date}` : "Loading latest business-day rates"}</small>
        </div>
      </section>

      {error ? <div className="error">{error}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{base} comparison</h2>
            <p>Daily reference rates. These are not sub-second market quotes.</p>
          </div>
        </div>

        <div className="pair-presets" aria-label="Common cross-rate pairs">
          {PAIR_PRESETS.map(([presetBase, presetQuote]) => (
            <button
              aria-label={`${presetBase} to ${presetQuote}`}
              className={base === presetBase && selected === presetQuote ? "active" : ""}
              key={`${presetBase}-${presetQuote}`}
              onClick={() => selectPair(presetBase, presetQuote)}
              type="button"
            >
              {presetBase}
            </button>
          ))}
        </div>

        <div className="rate-grid">
          {comparisonSymbols.map((code) => (
            <button
              className={selected === code ? "rate-card active" : "rate-card"}
              key={code}
              onClick={() => setSelected(code)}
              type="button"
            >
              <span>{base} to {code}</span>
              <strong>{rates[code] ? formatRate(rates[code]) : "..."}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="detail-layout">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>{selected} recent movement</h2>
              <p>Daily {base}/{selected} observations from the last several weeks.</p>
            </div>
          </div>
          <MiniChart rates={history?.rates} symbol={selected} />
          {summary ? (
            <div className="summary">
              <span>{summary.firstDate}: {formatRate(summary.first)}</span>
              <strong className={summary.changePercent >= 0 ? "up" : "down"}>
                {summary.changePercent >= 0 ? "+" : ""}{summary.changePercent}%
              </strong>
              <span>{summary.lastDate}: {formatRate(summary.last)}</span>
            </div>
          ) : null}
          {recentRateRows.length > 0 ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <caption>Recent {base}/{selected} reference rates</caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rate</th>
                    <th>Daily move</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRateRows.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{formatRate(row.rate)}</td>
                      <td className={row.dailyChange >= 0 ? "up" : "down"}>
                        {row.dailyChange >= 0 ? "+" : ""}{row.dailyChange}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <h2>Scope notes</h2>
          <ul className="notes">
            <li>No leverage, auto-trading, or portfolio recommendations.</li>
            <li>No prediction accuracy claims. This view shows history only.</li>
            <li>
              Unsupported from Riley's list:
              {" "}
              <strong>{currencies?.unsupported?.join(", ") || "checking..."}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section className="portfolio-layout">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Portfolio simulation lab</h2>
              <p>Historical what-if curve for converting {base} into {selected}. It is not managed trading.</p>
            </div>
            <div className="pnl-pill">
              <span>Sim P/L</span>
              <strong className={portfolioLast?.pnl >= 0 ? "up" : "down"}>
                {portfolioLast ? `${portfolioLast.pnl >= 0 ? "+" : "-"}${formatBaseValue(Math.abs(portfolioLast.pnl), base)}` : "..."}
              </strong>
            </div>
          </div>
          <div className="lab-controls">
            <label className="amount-field">
              <span>Total assets</span>
              <input
                min="1"
                step="500"
                type="number"
                value={startingBalance}
                onChange={(event) => setStartingBalance(Math.max(1, Number(event.target.value) || 1))}
              />
            </label>
          </div>
          <PortfolioChart points={portfolioCurve} valueFormatter={(value) => formatBaseValue(value, base)} />
          {portfolioLast ? (
            <div className="summary">
              <span>Start: {formatBaseValue(startingBalance, base)}</span>
              <strong className={portfolioLast.pnlPercent >= 0 ? "up" : "down"}>
                {portfolioLast.pnlPercent >= 0 ? "+" : ""}{portfolioLast.pnlPercent}%
              </strong>
              <span>Now: {formatBaseValue(portfolioLast.value, base)}</span>
            </div>
          ) : null}
          {recentPortfolioRows.length > 0 ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <caption>Recent simulation checkpoints</caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Value</th>
                    <th>P/L</th>
                    <th>P/L %</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPortfolioRows.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{formatBaseValue(row.value, base)}</td>
                      <td className={row.pnl >= 0 ? "up" : "down"}>
                        {row.pnl >= 0 ? "+" : "-"}{formatBaseValue(Math.abs(row.pnl), base)}
                      </td>
                      <td className={row.pnlPercent >= 0 ? "up" : "down"}>
                        {row.pnlPercent >= 0 ? "+" : ""}{row.pnlPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="panel signal-panel">
          <p className="eyebrow">Guardrailed signal</p>
          <h2>{signal.label}</h2>
          <p>{signal.reason}</p>
          <div className="blocked-actions">
            <button type="button" disabled>50x leverage blocked</button>
            <button type="button" disabled>YOLO rebalance blocked</button>
          </div>
          <small>
            These controls are intentionally disabled because simulated leverage and auto-trading can still teach the wrong behavior.
          </small>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
