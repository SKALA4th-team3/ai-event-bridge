<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CATEGORIES } from '@/constants/categories.js'
import { REGION_GROUPS } from '@/constants/regions.js'
import { PERIODS, BUDGET_BANDS, SORTS } from '@/composables/useFilters.js'
import { wonShort, ddayLabel, isUrgent } from '@/composables/useFormat.js'
import { noticeStatus } from '@/constants/status.js'
import { usePostingStore } from '@/store/posting.js'
import { useApplicationStore } from '@/store/application.js'
import { useUiStore } from '@/store/ui.js'
import { useBookmarkStore } from '@/store/bookmark.js'
import { useProfileStore } from '@/store/profile.js'

const router = useRouter()
const route = useRoute()
const posting = usePostingStore()
const application = useApplicationStore()
const ui = useUiStore()
const profile = useProfileStore()
const bookmark = useBookmarkStore()

onMounted(async () => { await posting.load(); application.load() })

/* 축 순서는 기간 → 지역 → 공사 분야 → 예산 */
const AXES = [
  { key: 'period', label: '기간', items: PERIODS.map((p) => [p, p]) },
  { key: 'regions', label: '지역', multi: true, items: REGION_GROUPS.map((r) => [r, r]) },
  { key: 'categories', label: '공사 분야', multi: true, items: CATEGORIES.map((c) => [c.label, c.label]) },
  { key: 'budgets', label: '예산', multi: true, items: BUDGET_BANDS.map((b) => [b.code, b.label]) }
]
/* 업체 프로필이 있어야 적합도가 계산됩니다 (기관은 표시하지 않습니다) */
const hasFirm = computed(() => !!profile.firm)

/* 관심 공고 — 스토어에서 관리합니다(store/bookmark.js) */
const onlySaved = ref(route.query.saved === '1')
function toggleSave(name) {
  const on = bookmark.toggle(name)
  ui.toast(on ? '관심 공고에 담았습니다.' : '관심 공고에서 뺐습니다.')
}
function toggleOnlySaved() {
  onlySaved.value = !onlySaved.value
  const q = { ...route.query }
  onlySaved.value ? (q.saved = '1') : delete q.saved
  delete q.event
  router.replace({ query: q })
}

/* 조건을 하나씩 끄는 건 일이라 개수와 함께 한 번에 비우는 길을 둡니다 */
const activeCount = computed(() => {
  const f = posting.filters
  return (f.period ? 1 : 0) + f.regions.length + f.categories.length + f.budgets.length
})

const isOn = (axis, v) => (axis === 'period' ? posting.filters.period === v : posting.filters[axis].includes(v))

/* ── 두 단계 ────────────────────────────────────────────────
   ① 이벤트 카드 그리드  ② 선택한 이벤트의 공사 내역
   선택 상태를 주소에 실어 두면 뒤로가기와 링크 공유가 그냥 됩니다. */
const selected = computed(() => route.query.event ?? null)

const events = computed(() => {
  const list = onlySaved.value
    ? posting.grouped.filter((e) => bookmark.has(e.name))
    : posting.grouped
  const dd = (e) => (e.dday === null ? 9999 : e.dday)
  const s = posting.sort
  if (s === 'fit') return [...list].sort((a, b) => b.bestFit - a.bestFit)
  if (s === 'budgetHi') return [...list].sort((a, b) => b.budget - a.budget)
  if (s === 'budgetLo') return [...list].sort((a, b) => a.budget - b.budget)
  return [...list].sort((a, b) => dd(a) - dd(b))
})
const current = computed(() => events.value.find((e) => e.name === selected.value) ?? null)
const totalWorks = computed(() => events.value.reduce((s, e) => s + e.works.length, 0))

/* 필터를 다시 걸었는데 열어 둔 이벤트가 사라지면 목록으로 돌아갑니다 */
watch([selected, events], () => {
  if (selected.value && events.value.length && !current.value) back()
})

const open = (e) => router.push({ query: { ...route.query, event: e.name } })
function back() {
  const q = { ...route.query }; delete q.event
  router.push({ query: q })
}
function reset() { posting.resetFilters(); ui.toast('필터를 초기화했습니다.') }
const openWork = (w) => router.push(`/postings/${w.id}`)
</script>

<template>
  <div class="view" id="list">
    <aside class="rail">
      <div v-if="activeCount" class="railtop">
        <span>조건 <b>{{ activeCount }}</b>개</span>
        <button @click="reset">모두 해제</button>
      </div>
      <div v-for="a in AXES" :key="a.key" class="fgroup">
        <h3>{{ a.label }} <span v-if="a.multi">복수</span></h3>
        <div class="fchips">
          <button v-for="[v, t] in a.items" :key="v" class="fchip"
                  :aria-pressed="isOn(a.key, v)" @click="posting.toggle(a.key, v)">{{ t }}</button>
        </div>
      </div>
      <button class="rail-reset" @click="reset">필터 초기화</button>
    </aside>

    <div class="lmain">
      <div class="lhead">
        <h2>{{ current ? '공사 내역' : '카테고리별 공고' }}</h2>
        <span class="cnt">
          <template v-if="current"><b>{{ current.works.length }}</b>건 공사 · 지원 <b>{{ current.bidders }}</b>곳</template>
          <template v-else><b>{{ events.length }}</b>개 이벤트 · <b>{{ totalWorks }}</b>건 공사</template>
        </span>
        <button class="savetoggle" :class="{ on: onlySaved }" :aria-pressed="onlySaved"
                @click="toggleOnlySaved">
          <svg viewBox="0 0 24 24" :fill="onlySaved ? 'currentColor' : 'none'"
               stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M12 20.5 3.8 12.3a5 5 0 0 1 7.1-7.1l1.1 1.1 1.1-1.1a5 5 0 0 1 7.1 7.1z" />
          </svg>
          관심<b>{{ bookmark.count }}</b>
        </button>
        <span class="sortwrap">정렬
          <select v-model="posting.sort">
            <option v-for="s in SORTS" :key="s.code" :value="s.code">{{ s.label }}</option>
          </select>
        </span>
      </div>

      <div class="llist">
        <!-- ② 선택한 이벤트의 공사 내역 -->
        <template v-if="current">
          <button class="backlink" @click="back">← 전체 이벤트</button>

          <div class="ehero">
            <span class="th" :class="current.thumb" :style="current.photo ? { backgroundImage: `url(${current.photo})` } : null" />
            <span class="t">
              <b>{{ current.name }}</b>
              <span class="sub">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
                </svg>
                {{ current.location }} · {{ current.org }}
              </span>
              <span class="meta">
                <span class="ec-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                    <path d="M3 7.5 12 3l9 4.5-9 4.5z" /><path d="M3 12.5 12 17l9-4.5" />
                  </svg>공사 <b>{{ current.works.length }}</b>건
                </span>
                <span class="ec-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" stroke-linecap="round" />
                  </svg>{{ current.period || '기간 미정' }}
                </span>
                <span class="ec-stat" :class="{ hot: isUrgent(current.dday) }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" stroke-linecap="round" />
                  </svg><b>{{ ddayLabel(current.dday) }}</b>
                </span>
              </span>
            </span>
            <span class="n">
              <span class="v">
                <b>{{ wonShort(current.budget) }}</b>
                <span>총 사업 예산</span>
              </span>
              <button class="save" :class="{ on: bookmark.has(current.name) }"
                      :aria-label="bookmark.has(current.name) ? '관심 해제' : '관심 공고로 저장'"
                      :aria-pressed="bookmark.has(current.name)" @click="toggleSave(current.name)">
                <svg viewBox="0 0 24 24" :fill="bookmark.has(current.name) ? 'currentColor' : 'none'"
                     stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                  <path d="M12 20.5 3.8 12.3a5 5 0 0 1 7.1-7.1l1.1 1.1 1.1-1.1a5 5 0 0 1 7.1 7.1z" />
                </svg>
              </button>
            </span>
          </div>

          <section class="egroup">
            <div class="ehead">
              <span class="ename">필요한 공사</span>
              <span class="emeta">모집 중 {{ current.openCount }}건 / 전체 {{ current.works.length }}건</span>
              <span class="eorg">{{ current.org }}</span>
            </div>
            <div v-for="w in current.works" :key="w.id" class="wrow" :class="{ closed: w.dday === null }">
              <span class="wname">{{ w.name }}</span>
              <span class="wcat">{{ w.category }}</span>
              <span class="badge" :class="noticeStatus(w.dday).tone">{{ noticeStatus(w.dday).label }}</span>
              <span class="wbud">{{ wonShort(w.budget) }}</span>
              <span class="wfit">
                <span class="dday" :class="{ urgent: isUrgent(w.dday) }">{{ ddayLabel(w.dday) }}</span>
                <span v-if="w.fit !== null">적합 {{ w.fit }}%</span>
              </span>
              <button class="btn" :class="w.dday === null || application.hasApplied(w.id) ? 'sec' : 'pri'"
                      :disabled="w.dday === null" @click="openWork(w)">
                {{ w.dday === null ? '마감' : application.hasApplied(w.id) ? '지원함' : '보기' }}
              </button>
            </div>
          </section>
        </template>

        <!-- ① 이벤트 카드 그리드 -->
        <div v-else-if="events.length" class="egrid">
          <article v-for="e in events" :key="e.name" class="ecard" :class="{ closed: e.dday === null }">
            <!-- 카드 전체를 누르는 판. 관심 버튼만 이 위에 얹힙니다 -->
            <button class="ec-hit" :aria-label="`${e.name} — 공사 ${e.works.length}건 보기`" @click="open(e)" />

            <div class="ec-th" :class="e.thumb" :style="e.photo ? { backgroundImage: `url(${e.photo})` } : null">
              <span class="ec-tag" :class="{ urgent: isUrgent(e.dday) }">
                <i />{{ e.dday === null ? '심사 중' : isUrgent(e.dday) ? `마감 ${ddayLabel(e.dday)}` : '지원 접수' }}
              </span>
              <button class="ec-save" :class="{ on: bookmark.has(e.name) }"
                      :aria-label="bookmark.has(e.name) ? '관심 해제' : '관심 공고로 저장'"
                      :aria-pressed="bookmark.has(e.name)" @click.stop="toggleSave(e.name)">
                <svg viewBox="0 0 24 24" :fill="bookmark.has(e.name) ? 'currentColor' : 'none'"
                     stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                  <path d="M12 20.5 3.8 12.3a5 5 0 0 1 7.1-7.1l1.1 1.1 1.1-1.1a5 5 0 0 1 7.1 7.1z" />
                </svg>
              </button>
              <!-- 공사 개수 — 캐러셀 점과 같은 자리, 같은 읽는 법 -->
              <span class="ec-dots" aria-hidden="true">
                <i v-for="(w, i) in e.works.slice(0, 5)" :key="w.id" :class="{ on: i === 0 }" />
              </span>
            </div>

            <div class="ec-body">
              <div class="ec-top">
                <span class="ec-name">{{ e.name }}</span>
                <span class="ec-price">{{ wonShort(e.budget) }}</span>
              </div>
              <span class="ec-loc">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" />
                </svg>
                {{ e.location }} · {{ e.org }}
              </span>

              <div class="ec-stats">
                <span class="ec-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                    <path d="M3 7.5 12 3l9 4.5-9 4.5z" /><path d="M3 12.5 12 17l9-4.5" /><path d="M3 17 12 21.5 21 17" />
                  </svg>
                  공사 <b>{{ e.works.length }}</b>건
                </span>
                <span class="ec-stat" :class="{ hot: isUrgent(e.dday) }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" stroke-linecap="round" />
                  </svg>
                  <b>{{ ddayLabel(e.dday) }}</b>
                </span>
                <span v-if="hasFirm" class="ec-stat fit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" />
                  </svg>
                  적합 <b>{{ e.bestFit }}%</b>
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="!posting.loading && onlySaved" class="empty">
          <span class="big">♡</span><b>관심 공고가 없습니다</b>
          카드의 하트를 누르면 여기에 모입니다.<br><br>
          <button class="btn sec" @click="toggleOnlySaved">전체 공고 보기</button>
        </div>
        <div v-else-if="!posting.loading" class="empty">
          <span class="big">🔍</span><b>조건에 맞는 공고가 없습니다</b>
          필터를 줄이면 더 많은 공고를 볼 수 있습니다.<br><br>
          <button class="btn sec" @click="reset">필터 초기화</button>
        </div>
        <!-- 글자 대신 뼈대를 보여 주면 기다리는 느낌이 줄어듭니다 -->
        <div v-else class="egrid" aria-busy="true" aria-label="불러오는 중">
          <div v-for="n in 8" :key="n" class="skel">
            <span class="s-th" />
            <span class="s-l w80" /><span class="s-l w60" /><span class="s-l w40" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
