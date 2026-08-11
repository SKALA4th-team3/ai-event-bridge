/* 적합도 산식 · 자격요건 대조.
   ★ 기능 명세가 확정되면 이 파일만 고치면 전 화면에 반영됩니다. */
const WEIGHTS = { category: 45, region: 20, experience: 20, tenure: 15 }

/** 공고 요건 vs 업체 프로필 → 항목별 충족 여부 */
export function matchRequirements(posting, firm) {
  if (!firm) return []
  const req = Object.fromEntries(posting.requirements.map((r) => [r.key, r.value]))
  const rows = []

  rows.push({
    key: '업종', want: req['업종'] ?? posting.category,
    ok: posting.category === firm.category,
    note: posting.category === firm.category ? '일치' : `당사 ${firm.category}`
  })
  if (req['업력']) {
    const need = parseInt(req['업력'], 10) || 0
    rows.push({ key: '업력', want: req['업력'], ok: (firm.tenure ?? 0) >= need, note: `당사 ${firm.tenure ?? 0}년` })
  }
  if (req['유사 실적'] || req['실적']) {
    const raw = req['유사 실적'] ?? req['실적']
    const need = parseInt(raw, 10) || 0
    rows.push({ key: '유사 실적', want: raw, ok: (firm.records ?? 0) >= need, note: `당사 ${firm.records ?? 0}건` })
  }
  if (req['지역']) {
    const ok = (firm.regions ?? []).includes(posting.region)
    rows.push({ key: '지역', want: req['지역'], ok, note: ok ? '해당' : '해당 없음', preferred: true })
  }
  return rows
}

/** 0~100 적합도.
    실적·업력은 절대량이 아니라 "그 공고가 요구하는 수준 대비"로 봅니다.
    절대량으로 재면 요건을 넉넉히 넘는 업체는 모든 공고에서 같은 점수가 나와
    정렬이 무의미해집니다. 요건이 빡빡한 공고일수록 점수가 갈립니다. */
const clamp01 = (n) => Math.max(0, Math.min(1, n))
const need = (posting, keys, dflt) => {
  const req = Object.fromEntries(posting.requirements.map((r) => [r.key, r.value]))
  for (const k of keys) if (req[k]) return parseInt(req[k], 10) || dflt
  return dflt
}

export function fitScore(posting, firm) {
  if (!firm) return null
  let s = 0
  if (posting.category === firm.category) s += WEIGHTS.category
  if ((firm.regions ?? []).includes(posting.region)) s += WEIGHTS.region

  /* 요건의 2배를 채우면 실적 만점, 1.5배를 채우면 업력 만점 */
  const needRec = need(posting, ['유사 실적', '실적'], 2)
  const needTen = need(posting, ['업력'], 3)
  s += WEIGHTS.experience * clamp01((firm.records ?? 0) / Math.max(needRec * 2, 4))
  s += WEIGHTS.tenure * clamp01((firm.tenure ?? 0) / Math.max(needTen * 1.5, 5))
  return Math.round(s)
}

export function withFit(postings, firm) {
  return postings.map((p) => ({ ...p, fit: fitScore(p, firm) }))
}

/** 홈 추천.
    ① 업종이 맞고 적합 70% 이상인 공고를 마감 임박순으로 먼저 담고
    ② 자리가 남으면 업종이 달라도 적합도가 높은 순으로 채웁니다.
    ①만 쓰면 업종이 좁은 업체는 추천이 두세 건에 그쳐 화면이 비어 버립니다.
    ★ 기능 명세가 확정되면 이 함수만 고치면 됩니다. */
export const RECOMMEND_MIN_FIT = 70
export function recommendFor(postings, firm, limit = 8) {
  const open = postings.filter((p) => p.dday !== null)
  if (!firm) return [...open].sort((a, b) => a.dday - b.dday).slice(0, limit)

  const primary = open
    .filter((p) => p.category === firm.category && (p.fit ?? 0) >= RECOMMEND_MIN_FIT)
    .sort((a, b) => a.dday - b.dday)

  if (primary.length >= limit) return primary.slice(0, limit)

  const rest = open
    .filter((p) => !primary.includes(p))
    .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0) || a.dday - b.dday)

  return [...primary, ...rest].slice(0, limit)
}
