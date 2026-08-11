<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/index.js'
import { postingApi } from '@/api/posting.js'
import { wonShort, ddayLabel } from '@/composables/useFormat.js'
import { DEMO_BIDDERS } from '@/constants/demoBidders.js'
import { usePostingStore } from '@/store/posting.js'
import { useUiStore } from '@/store/ui.js'

const route = useRoute()
const router = useRouter()
const store = usePostingStore()
const ui = useUiStore()

const w = ref(null)
const bids = ref([])
const cur = ref(0)
const loading = ref(true)
const demo = ref(false)

/* 공고별 지원 업체 조회 API는 아직 없습니다.
   enrollment-service의 EnrollmentRepository에 findByCourseId가 없어
   /api/enrollments/course/{id}는 500을 돌려줍니다. 매 진입마다 콘솔에
   오류를 남기지 않도록 호출을 끄고, 저장소에 메서드가 추가되면
   아래 상수만 true로 바꾸면 실데이터로 전환됩니다. */
const BIDDER_API_READY = false

async function fetchBidders(id) {
  if (!BIDDER_API_READY) throw new Error('bidder API not available')
  const { data } = await api.get(`/api/enrollments/course/${id}`)
  return data?.data ?? data ?? []
}

async function load() {
  loading.value = true
  await store.load()
  w.value = store.byId(route.params.id) ?? null
  if (!w.value) { try { w.value = await postingApi.detail(route.params.id) } catch { w.value = null } }
  try {
    bids.value = (await fetchBidders(route.params.id)).map((x, i) => ({
      id: x.id, name: x.userName ?? `업체 #${x.userId}`, loc: '—',
      category: w.value?.category, records: x.records ?? 0, fit: 90 - i * 6,
      status: x.status === 'ACTIVE' ? '선정' : '검토', why: '', reasons: []
    }))
    demo.value = false
  } catch {
    bids.value = DEMO_BIDDERS.map((b) => ({ ...b }))
    demo.value = true
  }
  cur.value = 0
  loading.value = false
}
onMounted(load)
watch(() => route.params.id, load)

const sel = computed(() => bids.value[cur.value] ?? null)
const picked = computed(() => bids.value.some((b) => b.status === '선정'))
const stCls = (s) => (s === '선정' ? 'ok' : s === '미달' ? '' : 'sec')
const stLabel = (s) => (s === '검토' ? '심사 중' : s === '미달' ? '요건 미달' : s === '선정' ? '선정' : s)

function pick() {
  bids.value.forEach((x) => { if (x.status === '선정') x.status = '검토' })
  sel.value.status = '선정'
  ui.notify('선정 업체를 선정했습니다', `${w.value?.name} · ${sel.value.name}`)
  ui.toast(`${sel.value.name}을(를) 선정 처리했습니다.`, 'good')
}
function undo() { sel.value.status = '검토'; ui.toast('낙찰을 취소했습니다.') }
</script>

<template>
  <div class="cview">
    <div class="sect-h">
      <h3>{{ w?.name ?? '공고' }}</h3>
      <span class="note">
        예산 {{ w ? wonShort(w.budget) : '—' }} · {{ ddayLabel(w?.dday ?? null) }} · 지원 {{ bids.length }}개사
      </span>
      <span class="act"><button class="btn sec" @click="router.push('/console')">← 대시보드</button></span>
    </div>

    <p v-if="demo" class="note" style="margin:0 0 .8em;font-size:calc(var(--u)*.76);color:var(--warn)">
      공고별 지원 업체 조회 API가 아직 없어 시연 데이터로 표시합니다.
    </p>

    <div class="bidgrid">
      <div class="ptable">
        <div class="prow hd" style="grid-template-columns:minmax(0,1fr) 5em 7em 5.5em">
          <span>업체</span><span>실적</span><span>적합도</span><span>상태</span>
        </div>
        <div v-for="(b, i) in bids" :key="b.id" class="brow" :class="{ sel: i === cur }" @click="cur = i">
          <span class="bn">{{ b.name }}<small>{{ b.loc }} · {{ b.category }}</small></span>
          <span class="brec">{{ b.records }}건</span>
          <span class="bf">{{ b.fit }}%<span class="bar"><i :style="{ width: b.fit + '%' }" /></span></span>
          <span><span class="badge" :class="stCls(b.status)">{{ stLabel(b.status) }}</span></span>
        </div>
        <div v-if="!loading && !bids.length" class="empty">
          <span class="big">🏢</span><b>아직 입찰한 업체가 없습니다</b>
        </div>
      </div>

      <div class="aipanel" v-if="sel">
        <h4>✦ AI 검토 의견</h4>
        <div class="why2">{{ sel.why || '자격요건 대조 결과입니다.' }}</div>
        <div v-for="(t, i) in sel.reasons" :key="i" class="reason"><span class="m">·</span><span>{{ t }}</span></div>
        <div class="cta2">
          <template v-if="sel.status === '선정'">
            <button class="btn sec" style="flex:1" @click="undo">선정 취소</button>
          </template>
          <template v-else>
            <!-- 보류(HOLD)는 두지 않습니다. 상태를 하나 더 만들 만큼의 행동이 아니고
                 기관은 결국 낙찰/미선정만 결정합니다. -->
            <button class="btn pri" style="flex:1" :disabled="picked || sel.status === '미달'" @click="pick">
              이 업체 선정
            </button>
          </template>
        </div>
        <p v-if="picked && sel.status !== '선정'" style="margin:.6em 0 0;font-size:.72em;color:var(--tx3)">
          이미 다른 업체가 선정되었습니다.
        </p>
        <p v-else-if="sel.status === '미달'" style="margin:.6em 0 0;font-size:.72em;color:var(--tx3)">
          요건 미달 업체는 선정할 수 없습니다.
        </p>
      </div>
    </div>
  </div>
</template>
