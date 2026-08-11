<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { wonShort, ddayLabel } from '@/composables/useFormat.js'
import BidderModal from '@/components/console/BidderModal.vue'
import { usePostingStore } from '@/store/posting.js'
import { useUiStore } from '@/store/ui.js'
import { applicationApi } from '@/api/application.js'

const route = useRoute()
const router = useRouter()
const posting = usePostingStore()
const ui = useUiStore()

const bidderCounts = ref({})
async function loadBidderCounts() {
  const counts = await Promise.all(posting.consoleRows.map(async (p) => {
    try { return [p.id, (await applicationApi.byCourse(p.id)).length] }
    catch { return [p.id, p.bidderCount] }
  }))
  bidderCounts.value = Object.fromEntries(counts)
}

onMounted(async () => {
  await posting.load()
  await loadBidderCounts()
})

const rows = computed(() =>
  posting.consoleRows
    .map((p) => ({ ...p, bidderCount: bidderCounts.value[p.id] ?? p.bidderCount }))
    .sort((a, b) => (a.dday === null ? 999 : a.dday) - (b.dday === null ? 999 : b.dday))
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
/* 공고를 누르면 지원 업체를 모달로 엽니다.
   전에는 표 아래에 펼쳤는데, 위쪽 공고를 누르면 결과가 화면 밖이라
   스크롤로 찾아야 했습니다. 선정은 집중이 필요한 결정이라
   다른 것이 안 보이는 자리에서 견주게 합니다. */
const openId = ref(null)
const opened = computed(() => rows.value.find((p) => String(p.id) === String(openId.value)) ?? null)
const openPanel = (id) => { openId.value = String(openId.value) === String(id) ? null : id }

/* 미리보기 바에서 ?open=<공고id> 로 모달을 바로 띄웁니다 */
watch(() => [route.query.open, rows.value.length], ([q]) => {
  if (q && rows.value.some((p) => String(p.id) === String(q))) openId.value = String(q)
}, { immediate: true })

function onAward(b) {
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
    <BidderModal :posting="opened" @close="openId = null" @award="onAward" />
  </div>
</template>
