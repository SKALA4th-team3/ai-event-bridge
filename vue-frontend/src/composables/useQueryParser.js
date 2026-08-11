import { BUDGET_BANDS } from '@/composables/useFilters.js'

/* 자연어 한 줄 → 검색 조건 칩.
   프로토타입의 규칙 기반 파서입니다. LLM으로 교체할 경우
   이 함수의 시그니처(문자열 → [{key,value}])만 유지하면 됩니다. */
const RULES = [
  { key: '기간', pats: [['다음 달', '다음 달'], ['이번 달', '이번 달'], ['이번 주', '마감 임박'], ['마감', '마감 임박']] },
  /* 그룹명이 먼저입니다 — '경상'을 '경남'보다 먼저 잡아야 합니다 */
  { key: '지역그룹', multi: true, pats: [
    ['경기·인천', '경기·인천'], ['경상', '경상'], ['전라', '전라'], ['충청', '충청']] },
  { key: '지역', multi: true, pats: [
    ['서울', '서울'], ['경기', '경기'], ['인천', '인천'], ['강원', '강원'], ['대전', '대전'],
    ['충남', '충남'], ['충북', '충북'], ['전남', '전남'], ['전북', '전북'],
    ['경남', '경남'], ['경북', '경북'], ['부산', '부산'], ['대구', '대구'], ['제주', '제주']] },
  { key: '분야', pats: [
    ['부스', '부스 설치'], ['무대', '무대·음향'], ['음향', '무대·음향'], ['안전', '안전인력'],
    ['운영', '운영인력'], ['홍보', '홍보·디자인'], ['디자인', '홍보·디자인'],
    ['영상', '영상·중계'], ['중계', '영상·중계'], ['케이터링', '케이터링']] },
  { key: '예산', pats: [['3천만', '3천만 이하'], ['5천만', '5천만 이하'], ['7천만', '7천만 이하']] }
]

export const SAMPLE_QUERIES = [
  '다음 달 경기 부스 설치',
  '무대·음향 5천만원 이하',
  '이번 주 마감 안전인력'
]

export function parseQuery(text) {
  const out = []
  RULES.forEach((rule) => {
    for (const [needle, value] of rule.pats) {
      if (text.includes(needle)) {
        out.push({ key: rule.key, value })
        if (!rule.multi) break
      }
    }
  })
  /* 축에 하나도 안 걸리면 문장 그대로 이름에서 찾습니다 —
     '진해 군항제'처럼 축제 이름만 넣는 경우입니다. */
  if (!out.length && text.trim()) out.push({ key: '검색어', value: text.trim() })
  return out
}

/** 검색 조건 → 목록 화면의 필터 상태 */
export function conditionsToFilters(conditions) {
  const f = { period: null, regions: [], categories: [], budgets: [], text: '' }
  const groupOf = {
    서울: '서울', 경기: '경기·인천', 인천: '경기·인천', 강원: '강원',
    대전: '충청', 충남: '충청', 충북: '충청',
    전남: '전라', 전북: '전라', 경남: '경상', 경북: '경상',
    부산: '경상', 대구: '경상', 제주: '제주'
  }
  conditions.forEach((c) => {
    /* 지도 핀은 시·도가 아니라 지역 그룹을 바로 얹습니다 */
    if (c.key === '지역그룹' && !f.regions.includes(c.value)) f.regions.push(c.value)
    if (c.key === '기간' && c.value !== '마감 임박') f.period = c.value
    if (c.key === '기간' && c.value === '마감 임박') f.period = '이번 주 마감'
    if (c.key === '분야' && !f.categories.includes(c.value)) f.categories.push(c.value)
    if (c.key === '지역') {
      const g = groupOf[c.value]
      if (g && !f.regions.includes(g)) f.regions.push(g)
    }
    /* AI 파서는 예산 구간 라벨을 그대로 줍니다 (규칙 파서는 '~이하' 문구) */
    if (c.key === '예산밴드') {
      const code = BUDGET_BANDS.find((b) => b.label === c.value)?.code
      if (code && !f.budgets.includes(code)) f.budgets.push(code)
    }
    if (c.key === '검색어') f.text = c.value
    if (c.key === '예산') {
      if (c.value.startsWith('3천만')) f.budgets.push('a')
      else if (c.value.startsWith('5천만')) f.budgets.push('a', 'b')
      else f.budgets.push('a', 'b', 'c')
    }
  })
  f.budgets = [...new Set(f.budgets)]
  return f
}
