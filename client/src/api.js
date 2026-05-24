export async function fetchRates() {
  const res = await fetch('/api/rates');
  if (!res.ok) throw new Error(`Rates fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchHistory(pair, days = 30) {
  const res = await fetch(`/api/rates/history?pair=${pair}&days=${days}`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
  return res.json();
}
