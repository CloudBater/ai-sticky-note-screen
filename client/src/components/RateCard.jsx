const TREND_ICON = { up: '▲', down: '▼', flat: '—' };
const TREND_COLOR = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  flat: 'text-gray-500',
};

export default function RateCard({ pair, rate, delta1d, trend, selected, onSelect }) {
  const deltaColor =
    delta1d > 0 ? 'text-emerald-400' : delta1d < 0 ? 'text-red-400' : 'text-gray-500';

  return (
    <button
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left transition-colors w-full cursor-pointer
        ${selected
          ? 'border-indigo-500 bg-indigo-950/40'
          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
        }`}
    >
      <div className="text-xs text-gray-500 mb-1 font-mono tracking-wider">
        USD / {pair}
      </div>
      <div className="text-2xl font-semibold font-mono tabular-nums leading-none">
        {rate != null ? rate.toFixed(4) : '—'}
      </div>
      <div className={`text-xs mt-2 font-mono flex items-center gap-1 ${deltaColor}`}>
        {delta1d != null
          ? `${delta1d >= 0 ? '+' : ''}${delta1d.toFixed(3)}%`
          : '—'}
        <span
          className={`${TREND_COLOR[trend ?? 'flat']} ml-1`}
          title="5-day historical direction — not a prediction"
        >
          {TREND_ICON[trend ?? 'flat']}
        </span>
      </div>
      <div className="text-[10px] text-gray-700 mt-1">5d direction</div>
    </button>
  );
}
