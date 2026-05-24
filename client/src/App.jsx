import { useState, useEffect } from 'react';
import RateCard from './components/RateCard.jsx';
import RateChart from './components/RateChart.jsx';
import { fetchRates, fetchHistory } from './api.js';

const PAIRS = ['EUR', 'JPY', 'GBP', 'CNY', 'SGD'];

function computeTrend(history) {
  if (!history || history.length < 2) return 'flat';
  const window = history.slice(-5);
  const diff = (window.at(-1).rate - window[0].rate) / window[0].rate;
  if (diff > 0.001) return 'up';
  if (diff < -0.001) return 'down';
  return 'flat';
}

function computeDelta1d(history) {
  if (!history || history.length < 2) return null;
  const prev = history.at(-2).rate;
  const curr = history.at(-1).rate;
  return ((curr - prev) / prev) * 100;
}

export default function App() {
  const [rates, setRates] = useState(null);
  const [histories, setHistories] = useState({});
  const [selectedPair, setSelectedPair] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [ratesData, ...historyResults] = await Promise.all([
          fetchRates(),
          ...PAIRS.map(p => fetchHistory(p, 30)),
        ]);
        setRates(ratesData);
        const h = {};
        PAIRS.forEach((p, i) => {
          h[p] = historyResults[i].history;
        });
        setHistories(h);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading ECB rates…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">MarketMage</h1>
            <p className="text-xs text-gray-600 mt-0.5">FX Rate Dashboard · USD base</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">ECB reference rate</p>
            <p className="text-xs text-gray-600">Updated daily at 16:00 CET</p>
            {rates?.date && (
              <p className="text-xs text-gray-500 font-mono mt-0.5">{rates.date}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PAIRS.map(pair => (
            <RateCard
              key={pair}
              pair={pair}
              rate={rates?.rates?.[pair]}
              delta1d={computeDelta1d(histories[pair])}
              trend={computeTrend(histories[pair])}
              selected={selectedPair === pair}
              onSelect={() => setSelectedPair(pair)}
            />
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-300">
              USD / {selectedPair} — 30-day closing rates
            </h2>
            <span className="text-xs text-gray-600">Daily ECB data · not a prediction</span>
          </div>
          <RateChart data={histories[selectedPair]} pair={selectedPair} />
        </div>

        <p className="text-xs text-gray-700 text-center pb-2">
          Data via{' '}
          <a
            href="https://www.frankfurter.app"
            className="underline hover:text-gray-500 transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            Frankfurter
          </a>{' '}
          (ECB reference rates) · Rates are informational only · Not financial advice
        </p>
      </main>
    </div>
  );
}
