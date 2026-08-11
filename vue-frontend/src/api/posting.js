import api from './index.js'
import { codeToLabel, labelToCode } from '@/constants/categories.js'
import { toGroup } from '@/constants/regions.js'
import { photoOf } from '@/constants/festivalPhotos.js'

/* ============================================================
   Anti-Corruption Layer
   백엔드는 course/enrollment, 화면은 공고/지원 용어를 씁니다.
   변환을 이 파일에 가둬서 뷰가 백엔드 스키마를 모르게 합니다.

   description 규약 — 평면 구조인 courses에 계층·마감일을 싣습니다.
     [이벤트] 진주 남강유등축제
     [기간] 2026-10-01 ~ 2026-10-14
     [마감] 2026-09-28
     [지역] 경남 진주
     [과업] ...
     [자격요건]
     업종: 전시·부스 설치업
     업력: 3년 이상
   ============================================================ */

const section = (text, key) => {
  const m = text?.match(new RegExp(`\\[${key}\\]\\s*([\\s\\S]*?)(?=\\n\\[|$)`))
  return m ? m[1].trim() : ''
}

export function parseRequirements(text) {
  const block = section(text, '자격요건')
  if (!block) return []
  return block.split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const [k, ...rest] = line.split(':')
    return { key: k.trim(), value: rest.join(':').trim() }
  })
}

/** 행사 기간의 시작 월. 기간이 없으면 마감월로 갈음합니다. */
function eventMonthOf(period, deadline) {
  const m = period?.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return Number(m[2])
  const d = deadline?.match(/-(\d{2})-/)
  return d ? Number(d[1]) : null
}

function daysUntil(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T23:59:59')
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d - new Date()) / 86400000)
}

/** course(백엔드) → posting(우리 도메인) */
export function toPosting(c) {
  const desc = c.description ?? ''
  const loc = section(desc, '지역') || '전국'
  const deadline = section(desc, '마감')
  const dday = daysUntil(deadline)
  return {
    id: c.id,
    name: c.title,
    eventName: section(desc, '이벤트') || c.title,
    photo: photoOf(section(desc, '이벤트') || c.title),
    period: section(desc, '기간'),
    task: section(desc, '과업'),
    requirements: parseRequirements(desc),
    categoryCode: c.category,
    category: codeToLabel(c.category),
    budget: Number(c.price) || 0,
    orgId: c.instructorId,
    orgName: section(desc, '기관') || '발주 기관',
    location: loc,
    region: toGroup(loc.split(' ')[0]),
    bidderCount: c.enrollmentCount ?? 0,
    deadline,
    /* 계절은 '언제 열리는 축제인가'로 판정합니다.
       입찰 마감은 행사보다 두어 달 앞서므로 마감월로 재면 어긋납니다. */
    eventMonth: eventMonthOf(section(desc, '기간'), deadline),
    dday: dday !== null && dday >= 0 ? dday : null,
    closed: dday !== null && dday < 0,
    raw: c
  }
}

/** 공고 등록 폼 → course 생성 요청 */
export function toCoursePayload(f) {
  const description = [
    `[이벤트] ${f.eventName}`,
    f.period ? `[기간] ${f.period}` : '',
    `[마감] ${f.deadline}`,
    `[지역] ${f.location}`,
    `[기관] ${f.orgName}`,
    `[과업] ${f.task}`,
    `[자격요건]\n${f.requirements}`
  ].filter(Boolean).join('\n')

  return {
    title: f.name,
    description,
    category: labelToCode(f.category),
    price: Number(f.budget)
  }
}

const unwrap = (res) => res.data?.data ?? res.data

export const postingApi = {
  async list() {
    /* 목록 API에 검색·필터 파라미터가 없어 전체를 받아 클라이언트에서 거릅니다.
       서버에 파라미터가 생기면 이 메서드만 바꾸면 됩니다. */
    return (unwrap(await api.get('/api/courses')) ?? []).map(toPosting)
  },
  async byCategory(label) {
    const code = labelToCode(label)
    return (unwrap(await api.get(`/api/courses/category/${code}`)) ?? []).map(toPosting)
  },
  async detail(id) {
    return toPosting(unwrap(await api.get(`/api/courses/${id}`)))
  },
  async create(form) {
    return toPosting(unwrap(await api.post('/api/courses', toCoursePayload(form))))
  }
}

/** 같은 이벤트끼리 묶기 — 백엔드가 평면이라 화면에서 계층을 만듭니다.
    카드에 필요한 요약값(대표 마감·예산 합계·분야 목록)도 여기서 만듭니다. */
export function groupByEvent(postings) {
  const map = new Map()
  postings.forEach((p) => {
    if (!map.has(p.eventName)) {
      map.set(p.eventName, {
        name: p.eventName, period: p.period, org: p.orgName, photo: p.photo,
        location: p.location, region: p.region, works: []
      })
    }
    map.get(p.eventName).works.push(p)
  })

  return [...map.values()].map((g, i) => {
    const open = g.works.filter((w) => w.dday !== null)
    return {
      ...g,
      /* 카드 썸네일 색은 목록 안에서 서로 구분되도록 순환시킵니다 */
      thumb: 'abcd'[i % 4],
      /* 대표 마감은 가장 임박한 공사 기준 — 카드에서 급한 축제를 먼저 알아보게 합니다 */
      dday: open.length ? Math.min(...open.map((w) => w.dday)) : null,
      openCount: open.length,
      budget: g.works.reduce((s, w) => s + w.budget, 0),
      bidders: g.works.reduce((s, w) => s + w.bidderCount, 0),
      categories: [...new Set(g.works.map((w) => w.category))],
      bestFit: Math.max(0, ...g.works.map((w) => w.fit ?? 0))
    }
  })
}
