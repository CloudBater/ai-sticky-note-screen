import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const DEFAULT_SYMBOLS = ["EUR", "JPY", "GBP", "CNY", "SGD"];

function formatRate(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 100 ? 2 : 4
  }).format(value);
}

function MiniChart({ rates, symbol }) {
  const points = useMemo(() => {
    const entries = Object.entries(rates || {}).sort();
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

function App() {
  const [currencies, setCurrencies] = useState(null);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState("EUR");
  const [error, setError] = useState("");

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
    async function loadRates() {
      setError("");
      const latestResponse = await fetch(`/api/latest?base=USD&symbols=${DEFAULT_SYMBOLS.join(",")}`);
      const historyResponse = await fetch(`/api/history?base=USD&symbol=${selected}`);

      if (!latestResponse.ok || !historyResponse.ok) {
        throw new Error("Could not load exchange-rate data.");
      }

      setLatest(await latestResponse.json());
      setHistory(await historyResponse.json());
    }

    loadRates().catch((loadError) => setError(loadError.message));
  }, [selected]);

  const supportedCodes = currencies?.supported?.map((currency) => currency.code) || DEFAULT_SYMBOLS;
  const rates = latest?.rates || {};
  const summary = history?.summary;

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">MarketMage</p>
          <h1>Daily FX reference rates, without fake trading magic.</h1>
          <p className="lede">
            A small dashboard for comparing Frankfurter's daily USD exchange rates and recent movement.
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
            <h2>USD comparison</h2>
            <p>Daily reference rates. These are not sub-second market quotes.</p>
          </div>
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {supportedCodes
              .filter((code) => code !== "USD")
              .map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
          </select>
        </div>

        <div className="rate-grid">
          {DEFAULT_SYMBOLS.map((code) => (
            <button
              className={selected === code ? "rate-card active" : "rate-card"}
              key={code}
              onClick={() => setSelected(code)}
              type="button"
            >
              <span>USD to {code}</span>
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
              <p>Using available daily observations from the last several weeks.</p>
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
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
