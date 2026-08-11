export function formatMoney(value) {
  const amount = Number(value)
  const absolute = Math.abs(amount)
  if (absolute >= 100_000_000) return `${trim(amount / 100_000_000)}억원`
  if (absolute >= 10_000_000) return `${trim(amount / 10_000_000)}천만원`
  return `${trim(amount / 10_000)}만원`
}

function trim(value) {
  return value.toFixed(1).replace(/\.0$/, '')
}
