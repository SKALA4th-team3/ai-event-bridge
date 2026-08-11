/* ============================================================
   상태 모델 — 기능 명세를 따르되 단계를 줄였습니다.

   공고  DRAFT → OPEN → CLOSED → AWARDED   (+ CANCELLED)
     · PUBLISHED(공개했으나 접수 전) 제거 — MVP에서 OPEN과 구분되는
       행동이 없어 화면만 늘어납니다. 사전규격공개가 필요해지면 그때 넣습니다.
     · COMPLETED(사업 종료) 제거 — 선정 이후는 우리 서비스 밖입니다.

   지원  SUBMITTED → UNDER_REVIEW → AWARDED / NOT_AWARDED  (+ WITHDRAWN)
     · 보류(HOLD) 제거 — 상태를 하나 더 만들 만큼의 행동이 아니고,
       기관은 결국 선정/미선정만 결정합니다.

   백엔드 enrollments.status 는 PENDING/ACTIVE/CANCELLED 3개뿐이라
   아래 MAP 으로 옮깁니다. 백엔드가 확장되면 이 파일만 고칩니다.
   ============================================================ */

/** 백엔드 값 → 명세 지원 상태 */
export const BID_STATUS_MAP = {
  PENDING: 'UNDER_REVIEW',
  ACTIVE: 'AWARDED',
  CANCELLED: 'NOT_AWARDED'
}

export const BID_STATUS = {
  SUBMITTED:    { label: '접수 완료', tone: 'sec' },
  UNDER_REVIEW: { label: '심사 중',   tone: 'wait' },
  AWARDED:      { label: '선정',      tone: 'ok' },
  NOT_AWARDED:  { label: '미선정',    tone: '' },
  WITHDRAWN:    { label: '지원 취소', tone: '' }
}

export const bidStatus = (backendStatus) =>
  BID_STATUS[BID_STATUS_MAP[backendStatus] ?? backendStatus] ?? { label: backendStatus, tone: '' }

/** 공고 상태 — 마감일로 판정합니다 (백엔드에 상태 컬럼이 없습니다) */
export const NOTICE_STATUS = {
  DRAFT:     { label: '작성 중',   tone: '' },
  OPEN:      { label: '지원 접수', tone: 'wait' },
  CLOSED:    { label: '심사 중',   tone: 'sec' },
  AWARDED:   { label: '선정 완료', tone: 'ok' },
  CANCELLED: { label: '취소',      tone: '' }
}
/* 공고 상태는 백엔드에 컬럼이 없어 프론트에서 '오늘'과 마감일을 견줘 정합니다.
   마감일이 지났으면 CLOSED(심사 중), 남았으면 OPEN(지원 접수). */
export const noticeStatus = (dday) => (dday === null ? NOTICE_STATUS.CLOSED : NOTICE_STATUS.OPEN)
export const isOpen = (dday) => dday !== null

export const SEASONS = [
  { key: 'spring', label: '봄',   period: '3월 – 5월',  months: [3, 4, 5] },
  { key: 'summer', label: '여름', period: '6월 – 8월',  months: [6, 7, 8] },
  { key: 'autumn', label: '가을', period: '9월 – 11월', months: [9, 10, 11] },
  { key: 'winter', label: '겨울', period: '12월 – 2월', months: [12, 1, 2] }
]
export const seasonOfMonth = (m) => SEASONS.find((s) => s.months.includes(m))?.key ?? 'autumn'
