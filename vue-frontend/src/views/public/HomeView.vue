<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import KoreaMap from '@/components/public/KoreaMap.vue'
import { parseQuery, conditionsToFilters, SAMPLE_QUERIES } from '@/composables/useQueryParser.js'
import { recommendFor } from '@/composables/useFitScore.js'
import { applyFilters } from '@/composables/useFilters.js'
import { won, wonShort, ddayLabel, isUrgent } from '@/composables/useFormat.js'
import { usePostingStore } from '@/store/posting.js'
import { useApplicationStore } from '@/store/application.js'
import { useProfileStore } from '@/store/profile.js'
import { useSeasonStore } from '@/store/season.js'
import { useUiStore } from '@/store/ui.js'
import { DEMO_BIDDERS } from '@/constants/demoBidders.js'

const router = useRouter()
const posting = usePostingStore()
const application = useApplicationStore()
const profile = useProfileStore()
const season = useSeasonStore()
const ui = useUiStore()

const isGov = computed(() => profile.data?.kind === 'gov')
const firm = computed(() => profile.firm)

onMounted(async () => {
  await posting.load()
  if (!isGov.value) application.load()
})

/* 시즌은 색이면서 조회 기간입니다 */
const inSeason = computed(() => season.inSeason(posting.scored))
const openCount = computed(() => inSeason.value.filter((p) => p.dday !== null).length)
const soonCount = computed(() => inSeason.value.filter((p) => p.dday !== null && p.dday <= 7).length)
const orgCount = computed(() => new Set(posting.scored.map((p) => p.orgName)).size)

/* ── 검색: 문장 → 조건 칩 ───────────────────────────────── */
const q = ref('')
const st = ref([])
const regionsPicked = computed(() =>
  conditionsToFilters(st.value).regions
)
/* 칩을 목록에 적용했을 때 몇 건이 남는지 — 스토어를 건드리지 않고 계산합니다 */
const hitCount = computed(() => applyFilters(posting.scored, conditionsToFilters(st.value)).length)
function search() { st.value = parseQuery(q.value); ui.toast(`조건 ${st.value.length}개를 읽었습니다.`) }
function pickSample(s) { q.value = s; st.value = parseQuery(s) }
function dropChip(c) { st.value = st.value.filter((x) => x !== c) }
/* 조건을 하나씩 지우는 건 일이라 한 번에 비우는 길을 둡니다 */
function clearChips() { st.value = []; q.value = '' }
/* 검색 칩을 그대로 목록에 넘깁니다 */
function applyQuery() { posting.filters = conditionsToFilters(st.value); router.push('/postings') }
function pickRegion(group) {
  /* 지도 핀은 지역 조건을 켜고 끕니다 */
  const hit = st.value.find((c) => c.key === '지역그룹' && c.value === group)
  st.value = hit ? st.value.filter((c) => c !== hit) : [...st.value, { key: '지역그룹', value: group }]
}

/* ── 추천 카드 ─────────────────────────────────────────── */
/* 홈 목록을 세 갈래로 나눕니다.
   알리오처럼 여러 목록을 훑게 하되, 패널을 늘리는 대신 탭으로 압축했습니다.
   축이 서로 달라 내용이 겹치지 않습니다 — 적합도 / 마감 / 등록순. */
const TABS = [
  { key: 'fit',  label: '우리 업체에 맞는 공고' },
  { key: 'soon', label: '마감 임박' },
  { key: 'new',  label: '새로 올라온' }
]
const tab = ref('fit')

const recommended = computed(() => recommendFor(inSeason.value, firm.value, 8))
const closingSoon = computed(() =>
  inSeason.value.filter((p) => p.dday !== null).sort((a, b) => a.dday - b.dday).slice(0, 8))
/* 등록순 대용 — id가 클수록 최근에 올라온 공고입니다 */
const newest = computed(() =>
  [...inSeason.value].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 8))

const picks = computed(() =>
  tab.value === 'soon' ? closingSoon.value : tab.value === 'new' ? newest.value : recommended.value)
const urgentN = computed(() => picks.value.filter((p) => p.dday !== null && p.dday <= 7).length)
const th = (i) => 'abcd'.charAt(i % 4)

/* 히어로 지표 — 세 장 중 가운데를 띄워 시선을 모읍니다.
   숫자만 보여주지 않고 누르면 그 조건으로 목록이 열립니다. */
const ICON = {
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5-9 4.5z"/><path d="M3 12.5 12 17l9-4.5"/><path d="M3 17 12 21.5 21 17"/></svg>',
  mine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v6l4 2.4" stroke-linecap="round"/></svg>',
  org:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 21h18M4.5 21V9.5L12 4l7.5 5.5V21"/><path d="M9.5 21v-6h5v6"/></svg>'
}
const myField = computed(() => firm.value?.category ?? null)
const myCount = computed(() =>
  myField.value ? inSeason.value.filter((p) => p.category === myField.value).length : 0)

function goList(patch = {}) {
  posting.resetFilters()
  Object.assign(posting.filters, patch)
  router.push('/postings')
}

const statCards = computed(() => isGov.value
  ? [
      { key: 'open', kicker: `${season.meta.label} 시즌`, title: '모집 중 공고', value: openCount.value, unit: '건',
        icon: ICON.open, go: () => goList() },
      { key: 'mine', kicker: '우리 기관', title: '진행 중 공고', value: myOpen.value, unit: '건',
        icon: ICON.org, go: () => router.push('/console') },
      { key: 'soon', kicker: '이번 주', title: '마감 임박', value: soonCount.value, unit: '건',
        icon: ICON.soon, go: () => goList({ period: '이번 주 마감' }) }
    ]
  : [
      { key: 'open', kicker: `${season.meta.label} 시즌`, title: '모집 중 공고', value: openCount.value, unit: '건',
        icon: ICON.open, go: () => goList() },
      { key: 'mine', kicker: myField.value ?? '업종 미등록', title: '내 업종 공고', value: myCount.value, unit: '건',
        icon: ICON.mine, go: () => goList(myField.value ? { categories: [myField.value] } : {}) },
      { key: 'soon', kicker: '이번 주', title: '마감 임박', value: soonCount.value, unit: '건',
        icon: ICON.soon, go: () => goList({ period: '이번 주 마감' }) }
    ])

const kicker = computed(() =>
  isGov.value ? `${profile.org?.name ?? '발주 기관'} · ${profile.org?.dept ?? '담당 부서'}`
              : `${firm.value?.name ?? '우리 업체'} · ${firm.value?.category ?? '업종 미등록'}`)
const sub = computed(() =>
  isGov.value ? '등록한 공고 요건에 맞춰 AI가 적합한 업체를 찾아 제안을 보냅니다.'
              : '등록하신 업종에 맞는 공고를 마감이 가까운 순서로 모았습니다.')
const recTitle = computed(() => (isGov.value ? '내 공고에 추천된 업체' : '우리 업체에 맞는 공고'))
const recWhy = computed(() => {
  if (isGov.value) return '‘축제 부스 운영’ 기준 · 업종·수행 이력 · 적합도순'
  if (tab.value === 'soon') return `${season.meta.label} 발주 중 마감이 가장 가까운 순`
  if (tab.value === 'new') return '최근 등록된 순 · 아직 지원이 적은 공고'
  return `업종 ‘${firm.value?.category ?? '미등록'}’ 우선 · 적합 70% 이상 → 적합도순`
})

/* 기관 홈의 추천 업체 — 업체 목록 API가 없어 시연 명단을 씁니다 */
const bidCards = computed(() => DEMO_BIDDERS)

/* ── 캐러셀 ────────────────────────────────────────────────
   카드가 한 화면에 4장씩 들어가고, 나머지는 옆으로 넘겨 봅니다.
   자동 전환은 5초. 마우스를 올리거나 키보드 포커스가 들어오면 멈추고,
   손으로 넘기면 그때부터는 자동 전환을 하지 않습니다 —
   읽는 중에 화면이 움직이는 게 가장 성가시기 때문입니다. */
const PER_PAGE = 4
const list = computed(() => (isGov.value ? bidCards.value : picks.value))
const pages = computed(() => {
  const out = []
  for (let i = 0; i < list.value.length; i += PER_PAGE) out.push(list.value.slice(i, i + PER_PAGE))
  return out.length ? out : [[]]
})
const page = ref(0)
const paused = ref(false)
const manual = ref(false)

function go(step) {
  const n = pages.value.length
  page.value = (page.value + step + n) % n
}
function goManual(step) { manual.value = true; go(step) }
function jump(i) { manual.value = true; page.value = i }

/* 탭이나 시즌이 바뀌면 첫 장으로 되돌립니다 */
watch([() => tab.value, () => season.current, list], () => { page.value = 0 })

let timer = null
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
onMounted(() => {
  if (reduce) return
  timer = setInterval(() => {
    if (!paused.value && !manual.value && pages.value.length > 1) go(1)
  }, 5000)
})
onUnmounted(() => clearInterval(timer))

/* ── 업체 검토 의견 ────────────────────────────────────────
   카드를 누르면 바로 발송하지 않고 근거부터 보여 줍니다.
   제안 발송은 되돌릴 수 없어, 한 번은 멈춰 세우는 게 맞습니다. */
const firm2 = ref(null)
const sent = ref(new Set())
const openFirm = (b) => { firm2.value = b }
function sendProposal() {
  sent.value = new Set([...sent.value, firm2.value.id])
  ui.notify('제안을 발송했습니다', firm2.value.name)
  ui.toast(`${firm2.value.name}에 제안을 발송했습니다.`, 'good')
  firm2.value = null
}

/* ── 하단 바 ───────────────────────────────────────────── */
const myOpen = computed(() => {
  const mine = posting.consoleRows.filter((p) => p.dday !== null)
  return mine.length
})
const myBids = computed(() => posting.consoleRows.reduce((s, p) => s + p.bidderCount, 0))
const open = (p) => router.push(`/postings/${p.id}`)
</script>

<template>
  <div class="view" id="home">
    <div class="hero">
      <div class="hero-l">
        <span class="kicker">{{ kicker }}</span>
        <h1 v-if="!isGov">이번 주 마감 <em>{{ urgentN }}건</em>, 확인하셨나요</h1>
        <h1 v-else>공고를 등록하고 <em>업체</em>를 찾으세요</h1>
        <p class="sub">{{ sub }}</p>

        <form class="searchbar" @submit.prevent="search">
          <span class="ico">✦</span>
          <input v-model="q" aria-label="공고 검색" autocomplete="off">
          <button type="submit" class="btn pri">찾기</button>
        </form>

        <div class="parsed" aria-live="polite">
          <template v-if="st.length">
            <span class="parsed-label">읽어낸 조건</span>
            <span v-for="c in st" :key="c.key + c.value" class="chip">
              <span>{{ c.key === '지역그룹' ? '지역' : c.key }} · {{ c.value }}</span>
              <button class="x" type="button" :aria-label="`${c.value} 조건 지우기`" @click="dropChip(c)">✕</button>
            </span>
            <button class="rescount" @click="applyQuery">→ {{ hitCount }}건 보기</button>
            <button class="chipclear" @click="clearChips">조건 모두 해제</button>
          </template>
          <template v-else>
            <span class="parsed-label">이렇게 물어보세요</span>
            <button v-for="s in SAMPLE_QUERIES" :key="s" type="button" class="chip ghost"
                    @click="pickSample(s)">{{ s }}</button>
          </template>
        </div>

        <div class="statcards">
          <button v-for="(c, i) in statCards" :key="c.key" class="statcard"
                  :class="{ lead: i === 1 }" @click="c.go()">
            <span v-if="i === 1" class="tab" />
            <span class="sc-k">{{ c.kicker }}</span>
            <span class="sc-t">{{ c.title }}</span>
            <span class="sc-v">{{ c.value }}<em>{{ c.unit }}</em></span>
            <span class="sc-ico" v-html="c.icon" />
          </button>
        </div>
      </div>

      <div class="hero-r">
        <div class="map">
          <div class="map-head">
            <span class="t">전국 발주 현황</span>
            <span class="m">{{ season.meta.period }} · 총 <b>{{ openCount }}</b>건</span>
          </div>
          <div class="map-body">
            <KoreaMap :postings="inSeason" :selected="regionsPicked" @pick="pickRegion" />
          </div>
          <div class="map-foot">
            <span><span class="sw">●</span> 마감 임박</span>
            <span><span class="sw o">○</span> 모집 중</span>
            <span><span class="sw pick">✓</span> 선택</span>
            <span class="hintx">여러 지역 선택 가능 →</span>
          </div>
        </div>
      </div>
    </div>

    <div class="recs">
      <div class="recs-head">
        <template v-if="!isGov">
          <div class="rtabs" role="tablist">
            <button v-for="t in TABS" :key="t.key" role="tab" :aria-selected="tab === t.key"
                    :class="{ on: tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
          </div>
        </template>
        <h2 v-else>{{ recTitle }}</h2>
        <span class="why">{{ recWhy }}</span>
        <button class="more" @click="router.push('/postings')">카테고리별로 보기 →</button>
      </div>

      <div class="carousel" @mouseenter="paused = true" @mouseleave="paused = false"
           @focusin="paused = true" @focusout="paused = false">
        <div class="ctrack-wrap">
          <div class="ctrack" :style="{ transform: `translateX(-${page * 100}%)` }">
            <div v-for="(pg, pi) in pages" :key="pi" class="cpage"
                 :aria-hidden="pi !== page" :inert="pi !== page ? '' : undefined">
              <template v-if="!isGov">
        <article v-for="(p, i) in pg" :key="p.id" class="hcard">
                  <button class="ec-hit" :aria-label="`${p.eventName} ${p.name} 상세 보기`" @click="open(p)" />
                  <span class="hc-th" :class="th(i)">
                    <img v-if="p.photo" class="ph" :src="p.photo.src" :srcset="p.photo.srcset"
                         sizes="120px" :alt="`${p.eventName} 사진`" loading="lazy" decoding="async">
                  </span>
                  <span class="hc-body">
                    <span class="hc-top">
                      <span class="hc-name">{{ p.eventName }}</span>
                      <span class="hc-price">{{ wonShort(p.budget) }}</span>
                    </span>
                    <span class="hc-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
                      </svg>
                      {{ p.location }} · {{ p.name }}
                    </span>
                    <span class="hc-stats">
                      <span class="ec-stat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                          <path d="M3 7.5 12 3l9 4.5-9 4.5z" /><path d="M3 12.5 12 17l9-4.5" />
                        </svg>{{ p.category }}
                      </span>
                      <span class="ec-stat" :class="{ hot: isUrgent(p.dday) }">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" stroke-linecap="round" />
                        </svg><b>{{ ddayLabel(p.dday) }}</b>
                      </span>
                      <span class="ec-stat fit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" />
                        </svg>적합 <b>{{ p.fit ?? 0 }}%</b>
                      </span>
                    </span>
                  </span>
                </article>
              </template>
              <template v-else>
        <article v-for="(b, i) in pg" :key="b.id" class="hcard">
                  <button class="ec-hit" :aria-label="`${b.name} 검토 의견 보기`"
                          @click="openFirm(b)" />
                  <span class="hc-th" :class="th(i)" />
                  <span class="hc-body">
                    <span class="hc-top">
                      <span class="hc-name">{{ b.name }}</span>
                      <span class="hc-price">{{ b.records }}건</span>
                    </span>
                    <span class="hc-loc">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
                      </svg>
                      {{ b.loc }} · {{ b.category }}
                    </span>
                    <span class="hc-stats">
                      <span class="ec-stat" :class="{ hot: i < 2 }">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                          <path d="m4 12 5 5L20 6" stroke-linecap="round" />
                        </svg>{{ i < 2 ? '지원함' : '미지원' }}
                      </span>
                      <span class="ec-stat fit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" />
                        </svg>적합 <b>{{ b.fit }}%</b>
                      </span>
                    </span>
                  </span>
                </article>
              </template>
            </div>
          </div>
        </div>

        <template v-if="pages.length > 1">
          <button class="cnav prev" aria-label="이전" @click="goManual(-1)">‹</button>
          <button class="cnav next" aria-label="다음" @click="goManual(1)">›</button>
          <div class="cdots" role="tablist" aria-label="공고 묶음">
            <button v-for="(pg, i) in pages" :key="i" role="tab" :aria-selected="i === page"
                    :aria-label="`${i + 1}번째 묶음`" :class="{ on: i === page }" @click="jump(i)" />
          </div>
        </template>

        <div v-if="!list.length" class="empty">
          <span class="big">🔍</span>
          <b>{{ tab === 'fit' ? '업종에 맞는 공고가 아직 없습니다' : '해당하는 공고가 없습니다' }}</b>
          시즌을 바꾸거나 활동 지역·업종을 넓히면 더 많은 공고를 볼 수 있습니다.
        </div>
      </div>
    </div>

    <!-- 업체 검토 의견 -->
    <div v-if="firm2" class="ovl" @click.self="firm2 = null">
      <div class="ovlcard" style="text-align:left">
        <h3 style="text-align:center">{{ firm2.name }}</h3>
        <p class="p" style="text-align:center">{{ firm2.loc }} · {{ firm2.category }} · 수행 {{ firm2.records }}건</p>

        <div class="aipanel" style="margin-bottom:.9em">
          <h4>✦ AI 검토 의견</h4>
          <div class="why2">{{ firm2.why }}</div>
          <div v-for="(t, i) in firm2.reasons" :key="i" class="reason">
            <span class="m">·</span><span>{{ t }}</span>
          </div>
          <div class="reason" style="margin-top:.6em">
            <span class="m">◎</span>
            <span>적합도 <b style="color:var(--sec)">{{ firm2.fit }}%</b>
              <span class="bar" style="display:inline-block;width:8em;vertical-align:middle;margin-left:.5em">
                <i :style="{ width: firm2.fit + '%' }" /></span>
            </span>
          </div>
        </div>

        <p class="ovlnote" style="margin-bottom:.9em">
          제안을 보내면 해당 업체에 알림이 전달됩니다. <b>발송 후에는 되돌릴 수 없습니다.</b>
        </p>
        <div class="ovlacts">
          <button class="btn sec" @click="firm2 = null">닫기</button>
          <button v-if="!sent.has(firm2.id)" class="btn pri" @click="sendProposal">제안 발송</button>
          <button v-else class="btn sec" disabled>발송 완료</button>
        </div>
      </div>
    </div>

    <!-- 업체 하단 바 -->
    <div v-if="!isGov" class="govbar v">
      <span class="ic">🏢</span>
      <span>
        <span class="tt">내 지원 현황</span>
        <span class="ds">{{ firm?.name ?? '우리 업체' }} · {{ firm?.category ?? '업종 미등록' }}</span>
      </span>
      <span class="barstats">
        <span class="barstat"><span class="n">{{ application.reviewing }}</span><span class="l">심사 중</span></span>
        <span class="barstat"><span class="n">{{ application.selected }}</span><span class="l">선정</span></span>
        <span class="barstat alert"><span class="n">{{ urgentN }}</span><span class="l">마감 임박</span></span>
      </span>
      <span class="acts"><button class="btn pri" @click="router.push('/applications')">내 지원 관리 →</button></span>
    </div>

    <!-- 기관 하단 바 -->
    <div v-else class="govbar">
      <span class="ic">🏛</span>
      <span>
        <span class="tt">내 공고 현황</span>
        <span class="ds">{{ profile.org?.name }} · {{ profile.org?.dept }}</span>
      </span>
      <span class="barstats">
        <span class="barstat"><span class="n">{{ myOpen }}</span><span class="l">모집 중</span></span>
        <span class="barstat alert"><span class="n">{{ myBids }}</span><span class="l">총 지원</span></span>
        <span class="barstat"><span class="n">{{ posting.consoleRows.length - myOpen }}</span><span class="l">선정 대기</span></span>
      </span>
      <span class="acts"><button class="btn pri" @click="router.push('/console')">기관 콘솔로 →</button></span>
    </div>
  </div>
</template>
