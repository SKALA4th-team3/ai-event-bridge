import { fitScore, matchRequirements } from '@/composables/useFitScore.js'

/* 시연용 지원 업체 명단.
   ★ enrollment-service의 EnrollmentRepository에 findByCourseId가 없어
     "공고별 지원 업체 조회" API가 존재하지 않습니다.
     저장소에 메서드가 추가되면 이 파일 대신 API 응답을 쓰면 됩니다.

   fit 은 목록 화면에서 쓰는 대략적인 값입니다.
   공고를 특정한 화면(지원 업체 심사)에서는 reviewOf() 로 그 공고에 맞춰 다시 잽니다. */
export const DEMO_BIDDERS = [
  { id: 1, name: '(주)한빛디스플레이', loc: '경남 진주', category: '부스 설치',
    records: 12, tenure: 9,  regions: ['경상'], fit: 92, status: '검토' },
  { id: 2, name: '대한전시산업', loc: '부산 해운대', category: '부스 설치',
    records: 27, tenure: 14, regions: ['경상'], fit: 88, status: '검토' },
  { id: 3, name: '남강이벤트', loc: '경남 진주', category: '종합 이벤트',
    records: 8,  tenure: 6,  regions: ['경상'], fit: 84, status: '검토' },
  { id: 4, name: '코리아부스텍', loc: '대구 수성', category: '부스 설치',
    records: 15, tenure: 11, regions: ['경상'], fit: 79, status: '검토' },
  { id: 5, name: '유등기획', loc: '경남 사천', category: '홍보·디자인',
    records: 4,  tenure: 3,  regions: ['경상'], fit: 61, status: '검토' }
]

/* 공고에 맞춘 지원 업체 명단.
   명단을 부스 설치 업체로 고정해 두면, 안전인력 공고를 열었을 때
   전원 업종 미달이 되어 '선정' 흐름 자체를 시연할 수 없습니다.
   실제로도 한 공고에 지원하는 업체는 대개 그 업종입니다.
   변별이 사라지지 않도록 인접 업종 하나와 불일치 업체 하나는 남깁니다. */
export function biddersFor(posting) {
  const own = posting?.category ?? '부스 설치'
  const cats = [own, own, '종합 이벤트', own, '홍보·디자인']
  return DEMO_BIDDERS
    .map((b, i) => ({ ...b, category: cats[i] }))
    .map((b) => ({ ...b, ...reviewOf(posting, b) }))
    /* 적합도는 '요건 대비'라 요건을 넉넉히 넘긴 업체끼리는 동점이 납니다.
       그때는 실적과 업력으로 가릅니다 — 표에 이미 보이는 값이라 납득이 됩니다. */
    .sort((a, b) => b.fit - a.fit || b.records - a.records || b.tenure - a.tenure)
}

/* 검토 의견을 공고와 대조해 만듭니다.
   문장을 박아 두면 다른 공고를 열었을 때 사실과 어긋납니다 —
   안전인력 공고에서 "부스 설치업과 정확히 일치합니다"라고 말하는 식입니다. */
export function reviewOf(posting, firm) {
  const rows = matchRequirements(posting, firm)
  const reasons = rows.map((r) =>
    r.ok ? `${r.key} · ${r.want} — 충족합니다 (${r.note}).`
         : `${r.key} · ${r.want} — 미충족입니다 (${r.note}).`)

  reasons.push(
    firm.loc && posting.location
      ? `${firm.loc} 소재 — 발주지 ${posting.location}${firm.regions?.includes(posting.region) ? ' 권역입니다.' : ' 권역 밖입니다.'}`
      : `수행 실적 ${firm.records}건, 업력 ${firm.tenure}년입니다.`)

  const missed = rows.filter((r) => !r.ok).length
  return {
    fit: fitScore(posting, firm) ?? 0,
    /* 요건을 못 채운 업체는 심사에서 걸러 두는 편이 담당자에게 정직합니다 */
    status: missed ? '미달' : '검토',
    why: missed ? `요건 ${missed}개 미충족` : `요건 ${rows.length}개 모두 충족`,
    reasons
  }
}
