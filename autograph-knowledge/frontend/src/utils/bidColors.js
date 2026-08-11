export const BID_COLOR_PALETTE = Object.freeze([
  '#be123c', // crimson
  '#a21caf', // fuchsia
  '#334155', // charcoal
  '#881337', // burgundy
  '#7e22ce', // violet
  '#52525b', // graphite
  '#db2777', // pink
  '#18181b', // ink
])

function hashCompanyName(companyName = '') {
  let hash = 0
  for (const character of companyName) {
    hash = ((hash << 5) - hash + character.codePointAt(0)) | 0
  }
  return Math.abs(hash)
}

export function colorForBid(bid) {
  const numericId = Number(bid?.bidId)
  const stableIndex = Number.isInteger(numericId) && numericId > 0
    ? numericId - 1
    : hashCompanyName(bid?.companyName)
  return BID_COLOR_PALETTE[stableIndex % BID_COLOR_PALETTE.length]
}
