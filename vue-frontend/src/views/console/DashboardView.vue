<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wonShort, ddayLabel } from '@/composables/useFormat.js'
import { DEMO_BIDDERS } from '@/constants/demoBidders.js'
import { usePostingStore } from '@/store/posting.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const posting = usePostingStore()
const ui = useUiStore()

onMounted(() => posting.load())

const rows = computed(() =>
  [...posting.consoleRows].sort((a, b) => (a.dday === null ? 999 : a.dday) - (b.dday === null ? 999 : b.dday))
)
const open = computed(() => rows.value.filter((p) => p.dday !== null).length)
const bids = computed(() => rows.value.reduce((s, p) => s + p.bidderCount, 0))
const wait = computed(() => rows.value.filter((p) => p.dday === null).length)
const spent = computed(() => (rows.value.reduce((s, p) => s + p.budget, 0) / 1e8).toFixed(1))
const avgBudget = computed(() => {
  if (!rows.value.length) return 0
  const avg = rows.value.reduce((s, p) => s + p.budget, 0) / rows.value.length
  return Math.round(avg / 1e4).toLocaleString()
})

/* 숫자만 늘어놓으면 다음 행동이 안 보입니다. 처리할 일을 먼저 세웁니다. */
const queue = computed(() => {
  const q = []
  const closed = rows.value.find((p) => p.dday === null && p.bidderCount > 0)
  if (closed) q.push({ id: closed.id, dot: '', t: `${closed.name} — 선정 필요`, s: `마감 경과 · 지원 ${closed.bidderCount}개사`, b: '검토', go: closed.id })
  const soon = rows.value.find((p) => p.dday !== null && p.dday <= 7)
  if (soon) q.push({ id: soon.id, dot: '', t: `${soon.name} — 마감 임박`, s: `D-${soon.dday} · 현재 ${soon.bidderCount}개사 지원`, b: '보기', go: soon.id })
  const low = rows.value.find((p) => p.dday !== null && p.bidderCount <= 2)
  if (low) q.push({ id: low.id, dot: 's', t: `${low.name} — 지원 저조`, s: `D-${low.dday}인데 ${low.bidderCount}개사만 지원`, b: '제안 발송', toast: '적합 업체 8개사에 제안을 발송했습니다.' })
  q.push({ id: 'meet', dot: 's', t: '현장 설명회 준비', s: '09.24 14:00 · 시청 3층', b: '일정', toast: '일정을 캘린더에 추가했습니다.' })
  return q
})
/* 처리 대기를 누르면 화면을 옮기지 않고 아래에 지원 업체를 펼칩니다.
   담당자가 목록과 후보를 같은 화면에서 견주게 하려는 것입니다. */
const openId = ref(null)
const opened = computed(() => rows.value.find((p) => String(p.id) === String(openId.value)) ?? null)

/* ★ 공고별 지원 업체 조회 API가 없어 시연 명단을 씁니다.
     findByCourseId 가 추가되면 이 한 줄만 API 호출로 바꾸면 됩니다. */
const bidders = ref([])
function openPanel(id) {
  openId.value = String(openId.value) === String(id) ? null : id
  if (openId.value) bidders.value = DEMO_BIDDERS.map((b) => ({ ...b }))
}
const picked = computed(() => bidders.value.some((b) => b.status === '선정'))
function award(b) {
  bidders.value.forEach((x) => { if (x.status === '선정') x.status = '검토' })
  b.status = '선정'
  ui.notify('선정 업체를 정했습니다', `${opened.value?.name} · ${b.name}`)
  ui.toast(`${b.name}을(를) 선정했습니다.`, 'good')
}
const goBid = (id) => openPanel(id)
</script>

<template>
  <div class="cview">
    <div class="kpis">
      <div class="kpi"><div class="l">모집 중 공고</div><div class="v">{{ open }}</div><div class="d">전체 {{ rows.length }}건 중</div></div>
      <div class="kpi alert"><div class="l">총 지원</div><div class="v">{{ bids }}</div><div class="d">공고 {{ rows.length }}건 합계</div></div>
      <div class="kpi"><div class="l">선정 대기</div><div class="v">{{ wait }}</div><div class="d">마감 지난 공고</div></div>
      <div class="kpi"><div class="l">공고 예산 합계</div><div class="v">{{ spent }}<span>억</span></div><div class="d">평균 {{ avgBudget }}만원</div></div>
    </div>

    <div class="grid2">
      <div>
        <div class="sect-h">
          <h3>{{ posting.consoleIsAll ? '전체 공고' : '내 공고' }}</h3>
          <span class="note">{{ posting.consoleIsAll ? '실습 계정이라 기관 구분 없이 전체를 봅니다 · 마감 임박순' : '마감 임박순' }}</span>
          <span class="act"><button class="btn sec" @click="router.push('/console/postings/new')">+ 공고 등록</button></span>
        </div>
        <div class="ptable">
          <div class="prow hd"><span>공고</span><span>예산</span><span>지원</span><span>마감</span><span>상태</span></div>
          <div v-for="p in rows" :key="p.id" class="prow click"
               :style="p.dday === null ? 'opacity:.6' : ''" @click="openPanel(p.id)">
            <span class="pn">{{ p.name }}</span>
            <span class="num">{{ wonShort(p.budget) }}</span>
            <span class="num" :class="{ hot: p.bidderCount >= 5 }">{{ p.bidderCount }}</span>
            <span class="num">{{ ddayLabel(p.dday) }}</span>
            <span><span class="badge" :class="p.dday === null ? '' : 'wait'">{{ p.dday === null ? '선정 대기' : '모집 중' }}</span></span>
          </div>
          <div v-if="!rows.length" class="empty"><span class="big">📄</span><b>등록한 공고가 없습니다</b></div>
        </div>
      </div>

      <div>
        <div class="sect-h"><h3>처리 대기</h3><span class="note">오늘 할 일</span></div>
        <div class="queue">
          <div v-for="t in queue" :key="t.id" class="qitem">
            <span class="dot" :class="t.dot" />
            <span class="t"><b>{{ t.t }}</b><span>{{ t.s }}</span></span>
            <button class="btn sec" @click="t.toast ? ui.toast(t.toast) : goBid(t.go)">{{ t.b }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 선택한 공고의 지원 업체 -->
    <section v-if="opened" class="bidpanel">
      <div class="sect-h">
        <h3>{{ opened.name }} · 지원 업체</h3>
        <span class="note">{{ bidders.length }}개사 · 예산 {{ wonShort(opened.budget) }} · {{ ddayLabel(opened.dday) }}</span>
        <span class="act">
          <button class="btn sec" @click="openId = null">접기</button>
          <button class="btn sec" @click="router.push(`/console/postings/${opened.id}/bidders`)">AI 추천 보기 →</button>
        </span>
      </div>
      <div class="bidcards">
        <article v-for="b in bidders" :key="b.id" class="bidcard" :class="{ won: b.status === '선정' }">
          <span class="bc-top">
            <span class="ava">{{ b.name.replace(/[()주]/g, '').charAt(0) }}</span>
            <span class="bc-n">
              <b>{{ b.name }}</b>
              <em>{{ b.loc }} · {{ b.category }}</em>
            </span>
            <span class="badge" :class="b.status === '선정' ? 'ok' : b.status === '미달' ? '' : 'sec'">
              {{ b.status === '검토' ? '심사 중' : b.status === '미달' ? '요건 미달' : b.status }}
            </span>
          </span>
          <span class="bc-m">
            <span class="ec-stat"><b>{{ b.records }}</b>건 수행</span>
            <span class="ec-stat fit">적합 <b>{{ b.fit }}%</b></span>
          </span>
          <span class="bar"><i :style="{ width: b.fit + '%' }" /></span>
          <p class="bc-why">{{ b.why }}</p>
          <span class="bc-act">
            <button v-if="b.status === '선정'" class="btn sec" @click="b.status = '검토'">선정 취소</button>
            <button v-else class="btn pri" :disabled="picked || b.status === '미달'" @click="award(b)">이 업체 선정</button>
          </span>
        </article>
      </div>
      <p v-if="picked" class="note" style="margin:.7em 0 0;font-size:calc(var(--u)*.76);color:var(--tx3)">
        이미 선정된 업체가 있습니다. 다른 업체를 고르려면 선정을 먼저 취소해 주세요.
      </p>
    </section>
  </div>
</template>
