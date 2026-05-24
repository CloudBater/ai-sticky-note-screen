import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function shortDate(iso) {
  return iso.slice(5); // "YYYY-MM-DD" → "MM-DD"
}

export default function RateChart({ data, pair }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-600 text-sm py-8 text-center">No data available</p>;
  }

  const points = data.map(d => ({ ...d, label: shortDate(d.date) }));
  const rates = points.map(p => p.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const pad = (max - min) * 0.1 || 0.001;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
          domain={[min - pad, max + pad]}
          width={64}
          tickFormatter={v => v.toFixed(4)}
        />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#9ca3af' }}
          itemStyle={{ color: '#a5b4fc', fontFamily: 'monospace' }}
          formatter={val => [val.toFixed(4), `USD / ${pair}`]}
          labelFormatter={label => `Date: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#818cf8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#a5b4fc' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
