/* 4축 필터 + 정렬.
   목록 API에 파라미터가 없어 지금은 클라이언트에서 처리합니다.
   서버 필터가 생기면 이 파일만 요청 파라미터 조립으로 바꿉니다. */
/* courses.price가 decimal(10,2)라 상한이 9,999만원입니다.
   구간을 그 안에서 나눕니다. 컬럼이 넓어지면 여기만 고치면 됩니다. */
export const BUDGET_BANDS = [
  { code: 'a', label: '3천만 이하', test: (n) => n <= 30_000_000 },
  { code: 'b', label: '3–5천만',   test: (n) => n > 30_000_000 && n <= 50_000_000 },
  { code: 'c', label: '5–7천만',   test: (n) => n > 50_000_000 && n <= 70_000_000 },
  { code: 'd', label: '7천만 이상', test: (n) => n > 70_000_000 }
]
export const PERIODS = ['이번 주 마감', '이번 달', '다음 달']
export const SORTS = [
  { code: 'deadline', label: '마감 임박순' },
  { code: 'fit',      label: '적합도순' },
  { code: 'budgetHi', label: '예산 높은순' },
  { code: 'budgetLo', label: '예산 낮은순' }
]

export function emptyFilters() {
  /* text 는 네 축으로 옮길 수 없는 말입니다 — '진해 군항제'처럼
     이벤트·공고 이름을 그대로 찾을 때 씁니다. */
  return { period: null, regions: [], categories: [], budgets: [], text: '' }
}

const bandOf = (n) => BUDGET_BANDS.find((b) => b.test(n))?.code ?? 'd'

function periodPass(p, period) {
  if (!period) return true
  if (p.dday === null) return false
  if (period === '이번 주 마감') return p.dday <= 7
  if (period === '이번 달') return p.dday <= 31
  /* '다음 달'이 dday > 10 이면 내년 축제까지 딸려 옵니다.
     칩에 적힌 말과 걸러지는 범위가 같아야 합니다. */
  return p.dday > 31 && p.dday <= 62
}

export function applyFilters(postings, f) {
  return postings.filter((p) => {
    if (!periodPass(p, f.period)) return false
    if (f.regions.length && !f.regions.includes(p.region)) return false
    if (f.categories.length && !f.categories.includes(p.category)) return false
    if (f.budgets.length && !f.budgets.includes(bandOf(p.budget))) return false
    if (f.text) {
      const hay = `${p.eventName} ${p.name} ${p.location} ${p.orgName}`.toLowerCase()
      if (!hay.includes(f.text.toLowerCase())) return false
    }
    return true
  })
}

export function sortPostings(list, code) {
  const c = [...list]
  const dd = (p) => (p.dday === null ? 9999 : p.dday)
  if (code === 'fit') return c.sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0))
  if (code === 'budgetHi') return c.sort((a, b) => b.budget - a.budget)
  if (code === 'budgetLo') return c.sort((a, b) => a.budget - b.budget)
  return c.sort((a, b) => dd(a) - dd(b))
}
