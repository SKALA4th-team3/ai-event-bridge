import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { applicationApi } from '@/api/application.js'
import { usePostingStore } from './posting.js'
import { demoEnrollments, canFallback, offlinePreview } from '@/constants/demoData.js'
import { toApplication } from '@/api/application.js'

export const useApplicationStore = defineStore('application', () => {
  const list = ref([])
  const loading = ref(false)
  const posting = usePostingStore()

  /** 지원 내역에 공고 정보를 붙여서 반환 */
  /* 공고 정보의 정본은 /api/courses입니다.
     enrollment 응답에 붙어 오는 course는 필드 표현이 달라 보조로만 씁니다. */
  const rows = computed(() => list.value.map((a) => ({ ...a, posting: posting.byId(a.postingId) ?? a.posting })))
  const reviewing = computed(() => list.value.filter((a) => a.status === 'PENDING').length)
  const selected = computed(() => list.value.filter((a) => a.status === 'ACTIVE').length)
  const appliedIds = computed(() => new Set(list.value.map((a) => String(a.postingId))))
  const hasApplied = (id) => appliedIds.value.has(String(id))

  async function load() {
    loading.value = true
    if (offlinePreview()) {
      list.value = demoEnrollments().map(toApplication); loading.value = false; return
    }
    try { list.value = await applicationApi.mine() }
    catch { list.value = canFallback() ? demoEnrollments().map(toApplication) : [] }
    finally { loading.value = false }
  }

  /** 지원 → PENDING. 확정(ACTIVE)은 Kafka 왕복 후라 폴링으로 확인합니다. */
  async function apply(postingId, bidAmount = null, proposal = null) {
    /* 미리보기에서는 서버에 접수하지 않고 화면 흐름만 재현합니다 */
    if (offlinePreview()) {
      const fake = { id: Date.now(), postingId, userId: 0, status: 'PENDING',
                     appliedAt: new Date().toISOString(), bidAmount, proposal: proposal?.name ?? null, posting: null }
      list.value.unshift(fake)
      return fake
    }
    /* bidAmount·proposal 은 백엔드에 받을 자리가 없어 아직 전송되지 않습니다.
       enrollments 에 bid_amount 컬럼과 제안서 업로드 엔드포인트가 생기면
       applicationApi.apply 에서 함께 보내면 됩니다. */
    const created = { ...(await applicationApi.apply(postingId)), bidAmount, proposal: proposal?.name ?? null }
    list.value.unshift(created)
    return created
  }
  async function pollUntilActive(postingId, { tries = 8, interval = 900 } = {}) {
    if (offlinePreview()) { await new Promise((r) => setTimeout(r, 1200)); return null }
    for (let i = 0; i < tries; i++) {
      await new Promise((r) => setTimeout(r, interval))
      try {
        const fresh = await applicationApi.mine()
        list.value = fresh
        const hit = fresh.find((a) => String(a.postingId) === String(postingId))
        if (hit && hit.status !== 'PENDING') return hit
      } catch { /* 폴링 실패는 무시하고 재시도 */ }
    }
    return null
  }
  return { list, rows, loading, reviewing, selected, hasApplied, load, apply, pollUntilActive }
})
