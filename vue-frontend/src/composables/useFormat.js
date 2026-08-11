export function won(n) {
  const eok = Math.floor(n / 1e8)
  const man = Math.floor((n % 1e8) / 1e4)
  if (eok) return `${eok}억${man ? ` ${man.toLocaleString()}만` : ''}원`
  return `${man.toLocaleString()}만원`
}
export function wonShort(n) {
  const eok = Math.floor(n / 1e8)
  const man = Math.floor((n % 1e8) / 1e4)
  return eok ? `${eok}억${man ? ` ${man.toLocaleString()}` : ''}` : `${man.toLocaleString()}만`
}
export const ddayLabel = (d) => (d === null ? '마감' : `D-${d}`)
export const isUrgent = (d) => d !== null && d <= 7
export const dateShort = (iso) => (iso ? iso.slice(5, 10).replace('-', '.') : '')
/* 마감이 해를 넘길 수 있어, 결정을 내리는 자리에서는 연도까지 적습니다 */
export const dateLong = (iso) => (iso ? iso.replaceAll('-', '.') : '')
