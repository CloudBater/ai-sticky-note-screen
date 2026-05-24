export interface RatesResponse {
  base: string
  date: string
  rates: Record<string, number>
  unsupported?: string[]
}

export interface HistoryPoint {
  date: string
  rate: number
}

export interface HistoryResponse {
  base: string
  target: string
  points: HistoryPoint[]
}

export async function fetchRates(base: string, to: string[]): Promise<RatesResponse> {
  const res = await fetch(`/api/rates?base=${base}&to=${to.join(',')}`)
  if (!res.ok) throw new Error(`Rates fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchHistory(base: string, to: string, days: number): Promise<HistoryResponse> {
  const res = await fetch(`/api/history?base=${base}&to=${to}&days=${days}`)
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`)
  return res.json()
}
