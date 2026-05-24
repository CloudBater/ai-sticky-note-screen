export function convert(amount: number, rate: number): number {
  if (amount < 0) throw new Error('Amount must be non-negative')
  return amount * rate
}

export function formatRate(rate: number): string {
  return rate.toFixed(4)
}
