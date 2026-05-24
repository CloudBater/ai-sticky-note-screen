import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { fetchRates, fetchHistory, RatesResponse, HistoryResponse } from './api'
import { convert, formatRate } from './calculator'
import './App.css'

const DEFAULT_CURRENCIES = ['EUR', 'JPY', 'GBP', 'CNY', 'SGD', 'TWD']
const BASE = 'USD'
const HISTORY_DAYS = 90

export default function App() {
  const [rates, setRates] = useState<RatesResponse | null>(null)
  const [history, setHistory] = useState<HistoryResponse | null>(null)
  const [selectedTarget, setSelectedTarget] = useState('EUR')
  const [amount, setAmount] = useState('100')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRates(BASE, DEFAULT_CURRENCIES)
      .then(setRates)
      .catch(() => setError('Failed to load rates. Please try again later.'))
  }, [])

  useEffect(() => {
    setHistory(null)
    fetchHistory(BASE, selectedTarget, HISTORY_DAYS)
      .then(setHistory)
      .catch(() => setError('Failed to load history.'))
  }, [selectedTarget])

  const rate = rates?.rates[selectedTarget] ?? 0
  const converted = convert(Number(amount) || 0, rate)

  return (
    <div className="app">
      <header className="header">
        <h1>MarketMage</h1>
        <p className="disclaimer">
          Rates are ECB reference rates updated once per business day. Not financial advice.
        </p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {rates && (
        <section className="rates-section">
          <div className="section-header">
            <h2>Today's Rates</h2>
            <span className="last-updated">Last updated: {rates.date}</span>
          </div>
          {rates.unsupported && rates.unsupported.length > 0 && (
            <p className="unsupported-note">
              Note: {rates.unsupported.join(', ')} not available from ECB reference rates.
            </p>
          )}
          <div className="rate-cards">
            {Object.entries(rates.rates).map(([currency, r]) => (
              <button
                key={currency}
                className={`rate-card ${selectedTarget === currency ? 'active' : ''}`}
                onClick={() => setSelectedTarget(currency)}
              >
                <span className="currency-pair">{BASE} → {currency}</span>
                <span className="rate-value">{formatRate(r)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="calculator-section">
        <h2>Converter</h2>
        <div className="calculator">
          <div className="calc-input-group">
            <label htmlFor="amount">{BASE}</label>
            <input
              id="amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <span className="calc-arrow">→</span>
          <div className="calc-result-group">
            <label>{selectedTarget}</label>
            <span className="calc-result">{rate > 0 ? converted.toFixed(2) : '—'}</span>
          </div>
        </div>
        {rate > 0 && (
          <p className="calc-note">
            1 {BASE} = {formatRate(rate)} {selectedTarget}
          </p>
        )}
      </section>

      <section className="chart-section">
        <h2>90-Day Trend: {BASE} → {selectedTarget}</h2>
        {history ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history.points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#888' }}
                tickFormatter={(d: string) => d.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#888' }}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => v.toFixed(3)}
                width={60}
              />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 6 }}
                labelStyle={{ color: '#aaa' }}
                formatter={(v: number) => [formatRate(v), selectedTarget]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#4ade80"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-loading">Loading chart…</div>
        )}
      </section>
    </div>
  )
}
