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

/* ── 팀 공용 설정 ────────────────────────────────────────────
   .env 는 .gitignore 에 있어 pull 로는 오지 않습니다. 그래서 팀이 함께
   쓰는 값은 여기 둡니다 — 저장소를 받으면 바로 AI 검색이 됩니다.

   여기 적힌 값은 비밀이 아닙니다. Firebase 웹 설정과 reCAPTCHA 사이트 키는
   어차피 클라이언트 번들에 실려 브라우저에 노출되는 공개 식별자입니다.
   호출을 막는 것은 App Check 이고, reCAPTCHA 키의 허용 도메인은
   localhost 로 묶여 있습니다.

   ★ reCAPTCHA '비밀 키'는 여기 두지 않습니다. 그건 Firebase 콘솔에만 있습니다.

   각자의 .env 로 덮어쓸 수 있습니다 (다른 Firebase 프로젝트를 쓸 때). */
const TEAM = {
  apiKey: 'AIzaSyAQ4Mc9OXEdfSb0caWjEDF_m4TWvk300BQ',
  authDomain: 'ai-event-bridge.firebaseapp.com',
  projectId: 'ai-event-bridge',
  appId: '1:973186344892:web:594e2a59854eb299a22db9',
  appCheckSiteKey: '6LfYJIAtAAAAAJvOAut8WAydd59l1VFG3bAIWpi7',
  model: 'gemini-flash-latest'
}

/* App Check 디버그 토큰.
   true 로 두면 브라우저마다 다른 UUID 가 생겨 각자 콘솔에 등록해야 합니다.
   이미 등록해 둔 값을 고정으로 쓰면 팀원은 등록할 일이 없습니다.

   TEAM 객체 안에 두면 객체가 살아 있어 빌드 산출물에도 문자열이 남습니다.
   삼항으로 감싸면 import.meta.env.DEV 가 false 로 치환되면서 통째로 지워집니다.
   디버그 토큰은 App Check 를 우회하는 값이라 배포본에 남기지 않습니다. */
const DEBUG_TOKEN = import.meta.env.DEV
  ? (env.VITE_APPCHECK_DEBUG_TOKEN || 'ab936521-0b9c-4c44-85a9-3717140f87f4')
  : null

const MODEL = env.VITE_GEMINI_MODEL || TEAM.model

const CONFIG = {
  apiKey: env.VITE_FIREBASE_API_KEY || TEAM.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || TEAM.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || TEAM.projectId,
  appId: env.VITE_FIREBASE_APP_ID || TEAM.appId
}
/* App Check 는 선택이 아닙니다. 등록하지 않으면 호출이 403 으로 막힙니다:
   "This AI Logic Project is inactive. Please complete onboarding and enable App Check"

   공급자는 둘 중 하나입니다.
     v3         — 일반 reCAPTCHA. google.com/recaptcha/admin 에서 무료로 만듭니다.
                  GCP 결제 계정이 필요 없어 실습·데모에 맞습니다.
     enterprise — reCAPTCHA Enterprise. GCP 에서 키를 만들며 결제 계정을 요구합니다. */
const APPCHECK_SITE_KEY = env.VITE_FIREBASE_APPCHECK_SITE_KEY || TEAM.appCheckSiteKey
const APPCHECK_PROVIDER = (env.VITE_FIREBASE_APPCHECK_PROVIDER || 'v3').toLowerCase()
export const aiConfigured = Object.values(CONFIG).every(Boolean)

/* 같은 문장을 두 번 부르지 않습니다 — 무료 티어 한도를 아낍니다 */
const cache = new Map()

/* 설정을 맞추는 동안 무엇이 막았는지 보려고 마지막 오류를 남깁니다.
   브라우저 콘솔: (await import('/src/lib/aiSearch.js')).lastError */
export const state = { lastError: null }

/* App Check — 이 앱에서 온 호출임을 증명합니다.
   개발 중에는 reCAPTCHA 를 통과할 수 없으므로 디버그 토큰을 씁니다.
   FIREBASE_APPCHECK_DEBUG_TOKEN 을 true 로 두면 브라우저 콘솔에 UUID 가
   찍히고, 그 값을 Firebase 콘솔의 '디버그 토큰 관리'에 등록하면 됩니다. */
let appCheckDone = false
async function setupAppCheck(app) {
  if (appCheckDone || !APPCHECK_SITE_KEY) return
  appCheckDone = true
  const { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } =
    await import('firebase/app-check')
  /* 등록해 둔 토큰을 고정으로 씁니다 — 팀원이 각자 등록할 필요가 없습니다 */
  if (DEBUG_TOKEN) self.FIREBASE_APPCHECK_DEBUG_TOKEN = DEBUG_TOKEN
  const provider = APPCHECK_PROVIDER === 'enterprise'
    ? new ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY)
    : new ReCaptchaV3Provider(APPCHECK_SITE_KEY)
  initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true })
}

let modelPromise = null
async function getModel() {
  if (modelPromise) return modelPromise
  modelPromise = (async () => {
    /* 동적 import — 설정이 없으면 firebase 를 아예 불러오지 않습니다 */
    const { initializeApp } = await import('firebase/app')
    const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai')

    const app = initializeApp(CONFIG)
    await setupAppCheck(app)
    const ai = getAI(app, { backend: new GoogleAIBackend() })

    /* 고를 수 있는 값은 우리 축뿐입니다 */
    /* enum 에 빈 문자열을 넣으면 400 입니다 ("enum[0]: cannot be empty").
       '해당 없음'은 값이 아니라 항목을 비우는 것으로 나타냅니다. */
    const responseSchema = Schema.object({
      optionalProperties: ['period', 'text'],
      properties: {
        period: Schema.enumString({ enum: PERIODS }),
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
2. text 에는 고유명사만 넣는다 — 축제·행사 이름, 기관 이름, 지명.
   '돈 되는', '괜찮은', '일감' 같은 꾸밈말이나 일반 명사는 넣지 않는다.
   넣을 고유명사가 없으면 text 는 비운다.
   ※ text 는 공고 제목에서 그대로 찾는 데 쓰이므로,
     제목에 없을 말을 넣으면 결과가 0건이 된다.
3. 값은 주어진 목록에서만 고른다.

검색어: `

/* 설정이 제대로 붙었는지, 어떤 모델 ID 가 사는지 확인하는 용도입니다.
   브라우저 콘솔에서:
     const m = await import('/src/lib/aiSearch.js'); await m.probeModel('gemini-2.5-flash')
   모델 ID 는 버전이 자주 오르므로 콘솔 문서보다 직접 불러 보는 편이 확실합니다. */
export async function probeModel(modelId) {
  if (!aiConfigured) return { ok: false, reason: '.env 에 VITE_FIREBASE_* 값이 없습니다' }
  try {
    const { initializeApp, getApps } = await import('firebase/app')
    const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai')
    const app = getApps()[0] || initializeApp(CONFIG)
    await setupAppCheck(app)
    const ai = getAI(app, { backend: new GoogleAIBackend() })
    const m = getGenerativeModel(ai, { model: modelId })
    const r = await m.generateContent('한 단어로만 답해: 하늘은 무슨 색?')
    return { ok: true, answer: r.response.text().trim() }
  } catch (e) {
    return { ok: false, reason: e.message || String(e) }
  }
}

/** 문장 → { period, regions, categories, budgets, text } · 실패하면 null */
export async function analyzeQuery(text) {
  const q = text.trim()
  if (!q || !aiConfigured) return null
  if (cache.has(q)) return cache.get(q)

  try {
    const model = await getModel()
    /* 응답이 늦으면 기다리지 않고 규칙 파서로 넘어갑니다.
       실측 2.7~5.1초라 6초는 아슬아슬해 여유를 둡니다. */
    const res = await Promise.race([
      model.generateContent(PROMPT + q),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000))
    ])
    const out = JSON.parse(res.response.text())
    cache.set(q, out)
    return out
  } catch (e) {
    state.lastError = e?.message || String(e)
    console.warn('[aiSearch] 해석에 실패해 규칙 파서로 넘어갑니다:', state.lastError)
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
