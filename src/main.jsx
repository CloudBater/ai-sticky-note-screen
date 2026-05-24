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

function MiniChart({ rates, symbol }) {
  const points = useMemo(() => {
    const entries = Object.entries(rates || {})
      .filter(([, dailyRates]) => Number.isFinite(dailyRates[symbol]))
      .sort();
    if (entries.length === 0) {
      return "";
    }

    const values = entries.map(([, dailyRates]) => dailyRates[symbol]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;

    return values
      .map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 100;
        const y = 100 - ((value - min) / spread) * 82 - 9;
        return `${x},${y}`;
      })
      .join(" ");
  }, [rates, symbol]);

  if (!points) {
    return <div className="empty-chart">No history yet</div>;
  }

  return (
    <svg className="chart" viewBox="0 0 100 100" role="img" aria-label={`${symbol} daily trend`}>
      <polyline points={points} />
    </svg>
  );
}

function PortfolioChart({ points }) {
  const line = useMemo(() => {
    if (points.length === 0) {
      return "";
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;

    return points
      .map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * 100;
        const y = 100 - ((point.value - min) / spread) * 82 - 9;
        return `${x},${y}`;
      })
      .join(" ");
  }, [points]);

  if (!line) {
    return <div className="empty-chart">No portfolio history yet</div>;
  }

  return (
    <svg className="chart pnl-chart" viewBox="0 0 100 100" role="img" aria-label="Simulated portfolio curve">
      <polyline points={line} />
    </svg>
  );
}

function App() {
  const [currencies, setCurrencies] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState(null);
  const [base, setBase] = useState("USD");
  const [selected, setSelected] = useState("EUR");
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
  const portfolioCurve = buildPortfolioCurve(history?.rates, selected);
  const portfolioLast = portfolioCurve[portfolioCurve.length - 1];
  const selectPair = (nextBase, nextSelected) => {
    setBase(nextBase);
    setSelected(nextSelected);
  };
  const changeBase = (nextBase) => {
    setBase(nextBase);
    if (nextBase === selected) {
      setSelected(supportedCodes.find((code) => code !== nextBase) || "USD");
    }
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
          <div className="pair-controls">
            <label>
              <span>Base</span>
              <select value={base} onChange={(event) => changeBase(event.target.value)}>
                {supportedCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Quote</span>
              <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                {comparisonSymbols.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="pair-presets" aria-label="Common cross-rate pairs">
          {PAIR_PRESETS.map(([presetBase, presetQuote]) => (
            <button
              className={base === presetBase && selected === presetQuote ? "active" : ""}
              key={`${presetBase}-${presetQuote}`}
              onClick={() => selectPair(presetBase, presetQuote)}
              type="button"
            >
              {presetBase}/{presetQuote}
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
              <h2>$10,000 simulation lab</h2>
              <p>Historical what-if curve for converting {base} into {selected}. It is not managed trading.</p>
            </div>
            <div className="pnl-pill">
              <span>Sim P/L</span>
              <strong className={portfolioLast?.pnl >= 0 ? "up" : "down"}>
                {portfolioLast ? `${portfolioLast.pnl >= 0 ? "+" : "-"}${formatBaseValue(Math.abs(portfolioLast.pnl), base)}` : "..."}
              </strong>
            </div>
          </div>
          <PortfolioChart points={portfolioCurve} />
          {portfolioLast ? (
            <div className="summary">
              <span>Start: {formatBaseValue(STARTING_BALANCE, base)}</span>
              <strong className={portfolioLast.pnlPercent >= 0 ? "up" : "down"}>
                {portfolioLast.pnlPercent >= 0 ? "+" : ""}{portfolioLast.pnlPercent}%
              </strong>
              <span>Now: {formatBaseValue(portfolioLast.value, base)}</span>
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
