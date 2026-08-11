/* ============================================================
   자연어 한 줄 → 우리 검색 축

   AI 는 '검색 결과'를 만들지 않습니다. 문장을 우리가 이미 쓰는
   필터 조건으로 옮기기만 합니다. 결과를 고르는 일은 applyFilters 가
   기존 데이터에서 합니다 — 없는 공고가 결과에 섞일 여지를 없앱니다.

   ▸ 왜 enum 인가
     AI 에게 자유 키워드를 받으면 '부스설치'처럼 우리 라벨과 한 글자
     다른 값이 와서 조용히 0건이 됩니다. 우리 필터는 닫힌 집합이라
     고를 수 있는 값 자체를 스키마에 박아 둡니다.
     축으로 안 잡히는 것(축제명 등)만 text 로 받습니다.

   ▸ 왜 Firebase AI Logic 인가
     Gemini 키를 브라우저 번들에 넣지 않아도 됩니다. Firebase 웹 설정값은
     원래 공개되는 식별자이고, 실제 호출 권한은 App Check 가 막습니다.

   ▸ 설정이 없으면
     조용히 null 을 돌려줍니다. 부르는 쪽이 규칙 파서로 넘어가므로
     키가 없어도, 네트워크가 끊겨도 검색은 그대로 됩니다.
   ============================================================ */
import { PERIODS, BUDGET_BANDS } from '@/composables/useFilters.js'
import { REGION_GROUPS } from '@/constants/regions.js'
import { CATEGORIES } from '@/constants/categories.js'

const env = import.meta.env
/* 모델 ID 는 Firebase 콘솔이 안내하는 현재 Flash 계열 값을 넣으세요.
   버전이 오르면 .env 만 고치면 됩니다. */
const MODEL = env.VITE_GEMINI_MODEL || 'gemini-flash-latest'

const CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID
}
export const aiConfigured = Object.values(CONFIG).every(Boolean)

/* 같은 문장을 두 번 부르지 않습니다 — 무료 티어 한도를 아낍니다 */
const cache = new Map()

let modelPromise = null
async function getModel() {
  if (modelPromise) return modelPromise
  modelPromise = (async () => {
    /* 동적 import — 설정이 없으면 firebase 를 아예 불러오지 않습니다 */
    const { initializeApp } = await import('firebase/app')
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai')

    const ai = getAI(initializeApp(CONFIG), { backend: new GoogleAIBackend() })

    /* 고를 수 있는 값은 우리 축뿐입니다 */
    const responseSchema = Schema.object({
      properties: {
        period: Schema.enumString({ enum: ['', ...PERIODS] }),
        regions: Schema.array({ items: Schema.enumString({ enum: REGION_GROUPS }) }),
        categories: Schema.array({ items: Schema.enumString({ enum: CATEGORIES.map((c) => c.label) }) }),
        budgets: Schema.array({ items: Schema.enumString({ enum: BUDGET_BANDS.map((b) => b.label) }) }),
        /* 축으로 못 옮기는 말 — 축제명·공고명 등 */
        text: Schema.string()
      }
    })

    return getGenerativeModel(ai, {
      model: MODEL,
      generationConfig: { responseMimeType: 'application/json', responseSchema }
    })
  })().catch((e) => { modelPromise = null; throw e })
  return modelPromise
}

const PROMPT = `너는 공공 이벤트 발주 공고 검색창의 검색어 해석기다.
사용자 문장에서 아래 축에 해당하는 조건만 골라라.

· 기간   — 마감이 언제인가
· 지역   — 행사가 열리는 권역
· 공사 분야 — 어떤 일을 맡기는가
· 예산   — 사업비 규모

규칙
1. 문장에 근거가 없는 축은 비워 둔다. 짐작해서 채우지 않는다.
2. 축으로 옮길 수 없는 말(축제 이름 등)만 text 에 넣는다. 없으면 빈 문자열.
3. 값은 주어진 목록에서만 고른다.

검색어: `

/** 문장 → { period, regions, categories, budgets, text } · 실패하면 null */
export async function analyzeQuery(text) {
  const q = text.trim()
  if (!q || !aiConfigured) return null
  if (cache.has(q)) return cache.get(q)

  try {
    const model = await getModel()
    /* 응답이 늦으면 기다리지 않고 규칙 파서로 넘어갑니다 */
    const res = await Promise.race([
      model.generateContent(PROMPT + q),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))
    ])
    const out = JSON.parse(res.response.text())
    cache.set(q, out)
    return out
  } catch (e) {
    console.warn('[aiSearch] 해석에 실패해 규칙 파서로 넘어갑니다:', e.message)
    return null
  }
}

/** AI 응답 → 화면이 쓰는 조건 칩 [{key,value}] (규칙 파서와 같은 모양) */
export function toConditions(r) {
  if (!r) return []
  const out = []
  if (r.period) out.push({ key: '기간', value: r.period })
  ;(r.regions ?? []).forEach((v) => out.push({ key: '지역그룹', value: v }))
  ;(r.categories ?? []).forEach((v) => out.push({ key: '분야', value: v }))
  ;(r.budgets ?? []).forEach((v) => out.push({ key: '예산밴드', value: v }))
  if (r.text?.trim()) out.push({ key: '검색어', value: r.text.trim() })
  return out
}
