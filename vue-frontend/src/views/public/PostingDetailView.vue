<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApplyModal from '@/components/common/ApplyModal.vue'
import { postingApi } from '@/api/posting.js'
import { matchRequirements } from '@/composables/useFitScore.js'
import { noticeStatus } from '@/constants/status.js'
import { won, ddayLabel, isUrgent, dateLong } from '@/composables/useFormat.js'
import { usePostingStore } from '@/store/posting.js'
import { useApplicationStore } from '@/store/application.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'

const route = useRoute()
const router = useRouter()
const store = usePostingStore()
const application = useApplicationStore()
const profile = useProfileStore()
const ui = useUiStore()

const w = ref(null)
const loading = ref(true)

onMounted(async () => {
  await Promise.all([store.load(), application.load()])
  w.value = store.byId(route.params.id) ?? null
  if (!w.value) { try { w.value = await postingApi.detail(route.params.id) } catch { w.value = null } }
  loading.value = false
})

const reqs = computed(() => (w.value ? matchRequirements(w.value, profile.firm) : []))
const metCount = computed(() => reqs.value.filter((r) => r.ok).length)
const applied = computed(() => w.value && application.hasApplied(w.value.id))
/* 같은 축제의 다른 공사 — 적합도가 높은 순으로 보여 줍니다 */
const siblings = computed(() => {
  if (!w.value) return []
  return store.scored
    .filter((p) => p.eventName === w.value.eventName && p.id !== w.value.id)
    .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0))
})

const code = computed(() => (w.value
  ? `${(w.value.deadline || '').slice(0, 4) || new Date().getFullYear()}-${String(w.value.orgId ?? 0).padStart(2, '0')}-W${w.value.id}`
  : ''))

/* 지원 흐름 — 0 닫힘 · 1 금액 입력 · 2 접수 중 · 3 완료 · -1 실패 */
const modal = ref(0)
const failMsg = ref('')

/* 미리보기 바에서 모달 상태를 바로 띄웁니다 (실제 접수는 하지 않습니다) */
watch(() => route.query.stage, (st) => {
  modal.value = st === 'bidding' ? 1 : st === 'applying' ? 2 : st === 'applied' ? 3 : 0
}, { immediate: true })
function startApply() { modal.value = 1 }

async function submitBid({ amount, proposal }) {
  modal.value = 2
  try {
    await application.apply(w.value.id, amount, proposal)
    /* 결제·심사 큐가 Kafka 비동기라 상태가 바뀔 때까지 확인합니다 */
    await application.pollUntilActive(w.value.id, { tries: 4, interval: 700 })
    modal.value = 3
    ui.notify('지원이 접수되었습니다', `${w.value.eventName} · ${w.value.name}`)
    ui.toast('지원이 접수되었습니다.', 'good')
  } catch (err) {
    modal.value = -1
    failMsg.value = err.response?.data?.message || '접수 중 오류가 발생했습니다.'
  }
}
</script>

<template>
  <div class="view" id="detail" v-if="!loading && w">
    <div class="dhead">
      <div class="crumb">
        <button @click="router.push('/postings')">카테고리별 공고</button><span>›</span><span>{{ w.eventName }}</span>
      </div>
      <div class="dtitle">
        <h2>{{ w.name }}</h2>
        <span class="tagcat">{{ w.category }}</span>
        <span class="dday" :class="{ urgent: isUrgent(w.dday) }">{{ ddayLabel(w.dday) }}</span>
        <span class="badge" :class="noticeStatus(w.dday).tone">{{ noticeStatus(w.dday).label }}</span>
      </div>
      <p class="dsub">{{ w.orgName }} · 공고번호 {{ code }}</p>
    </div>

    <div class="dbody">
      <div style="display:flex;flex-direction:column;gap:1em;min-width:0">
        <div class="panel">
          <h3>공고 개요</h3>
          <dl class="kv">
            <dt>발주 기관</dt><dd>{{ w.orgName }}</dd>
            <dt>사업 기간</dt><dd>{{ w.period || '미정' }}</dd>
            <dt>사업 예산</dt><dd>{{ won(w.budget) }} (부가세 포함)</dd>
            <dt>지원 마감</dt><dd>{{ w.dday === null ? '마감되었습니다' : `D-${w.dday} · ${dateLong(w.deadline)} 18:00까지` }}</dd>
            <dt>계약 방식</dt><dd>제한경쟁지원 · 적격심사</dd>
            <dt>공사 분야</dt><dd>{{ w.category }}</dd>
            <dt>지원 현황</dt><dd>{{ w.bidderCount }}개사 지원</dd>
          </dl>
        </div>
        <div class="panel">
          <h3>과업 내용</h3>
          <p style="margin:0;font-size:.83em;color:var(--tx2);line-height:1.75">
            {{ w.task || '세부 규격과 일정은 현장 설명회에서 안내합니다.' }}
          </p>
        </div>

        <!-- 한 축제는 여러 공사로 나뉘어 발주됩니다.
             옆 공사가 우리 업종일 수도 있는데, 지금까지는 목록으로 되돌아가야 알 수 있었습니다. -->
        <div v-if="siblings.length" class="panel">
          <h3>같은 이벤트의 다른 공사 <span class="cnt">{{ siblings.length }}</span></h3>
          <ul class="sibs">
            <li v-for="sb in siblings" :key="sb.id">
              <button class="sib" @click="router.push(`/postings/${sb.id}`)">
                <span class="sb-n">{{ sb.name }}</span>
                <span class="sb-c">{{ sb.category }}</span>
                <span class="sb-b">{{ won(sb.budget) }}</span>
                <span class="sb-d" :class="{ urgent: isUrgent(sb.dday) }">{{ ddayLabel(sb.dday) }}</span>
                <span v-if="sb.fit != null" class="sb-f">적합 {{ sb.fit }}%</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="aside-stack">
        <div class="panel fitbig">
          <div class="num">{{ w.fit ?? 0 }}<span style="font-size:.45em">%</span></div>
          <div class="lbl">우리 업체 적합도</div>
          <div style="margin-top:.7em"><span class="bar"><i :style="{ width: (w.fit ?? 0) + '%' }" /></span></div>
        </div>

        <div class="panel">
          <h3>자격요건 대조</h3>
          <ul class="reqlist">
            <li v-for="r in reqs" :key="r.key">
              <span class="mkk" :class="r.ok ? 'y' : 'n'">{{ r.ok ? '✓' : '!' }}</span>
              <span>{{ r.key }} · {{ r.want }} ({{ r.note }})</span>
            </li>
            <li v-if="!reqs.length"><span class="mkk n">!</span><span>업체 프로필을 등록하면 요건을 대조해 드립니다.</span></li>
          </ul>
          <p v-if="reqs.length" style="margin:.65em 0 0;font-size:.73em;color:var(--tx3)">
            {{ reqs.length }}개 요건 중 {{ metCount }}개 충족
          </p>
        </div>

        <div>
          <button v-if="w.dday === null" class="btn sec" style="width:100%;padding:.72em" disabled>마감된 공고입니다</button>
          <button v-else-if="applied" class="btn sec" style="width:100%;padding:.72em"
                  @click="router.push('/applications')">지원 완료 · 내 지원 보기 →</button>
          <button v-else class="btn pri" style="width:100%;padding:.75em" @click="startApply">이 공고에 지원하기</button>
        </div>
      </div>
    </div>

    <ApplyModal :state="modal" :posting="w" :message="failMsg"
                @submit="submitBid" @retry="startApply" @close="modal = 0" @apps="modal = 0; router.push('/applications')" />
  </div>

  <div v-else-if="loading" class="view"><div class="empty"><span class="big">⋯</span><b>불러오는 중입니다</b></div></div>
  <div v-else class="view">
    <div class="empty">
      <span class="big">📄</span><b>공고를 찾을 수 없습니다</b>
      삭제되었거나 주소가 잘못되었습니다.<br><br>
      <button class="btn sec" @click="router.push('/postings')">공고 목록으로</button>
    </div>
  </div>
</template>
