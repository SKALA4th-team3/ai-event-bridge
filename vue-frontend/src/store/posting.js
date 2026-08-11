import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postingApi, groupByEvent } from '@/api/posting.js'
import { emptyFilters, applyFilters, sortPostings } from '@/composables/useFilters.js'
import { withFit } from '@/composables/useFitScore.js'
import { useProfileStore } from './profile.js'
import { useAuthStore } from './auth.js'
import { demoCourses, canFallback, offlinePreview } from '@/constants/demoData.js'
import { toPosting } from '@/api/posting.js'

export const usePostingStore = defineStore('posting', () => {
  const all = ref([])
  const loading = ref(false)
  const error = ref(null)
  const usingDemo = ref(false)
  const filters = ref(emptyFilters())
  const sort = ref('deadline')

  const profile = useProfileStore()
  const auth = useAuthStore()

  /** 적합도가 얹힌 전체 공고 */
  const scored = computed(() => withFit(all.value, profile.firm))
  const filtered = computed(() => sortPostings(applyFilters(scored.value, filters.value), sort.value))
  const grouped = computed(() => groupByEvent(filtered.value))
  const openCount = computed(() => scored.value.filter((p) => p.dday !== null).length)
  const dueSoonCount = computed(() => scored.value.filter((p) => p.dday !== null && p.dday <= 7).length)

  async function load(force = false) {
    if (all.value.length && !force) return
    loading.value = true; error.value = null
    if (offlinePreview()) {
      all.value = demoCourses().map(toPosting); usingDemo.value = true; loading.value = false; return
    }
    try {
      all.value = await postingApi.list()
      usingDemo.value = false
    } catch (e) {
      /* 백엔드가 없거나 로그인 전이어도 화면은 볼 수 있어야 합니다 */
      if (canFallback()) { all.value = demoCourses().map(toPosting); usingDemo.value = true }
      else { error.value = e; all.value = []; usingDemo.value = false }
    } finally { loading.value = false }
  }
  const byId = (id) => scored.value.find((p) => String(p.id) === String(id))
  /* 내가 올린 공고 — courses.instructorId와 로그인 사용자 id를 맞춥니다 */
  const mine = computed(() =>
    auth.user?.id ? scored.value.filter((p) => String(p.orgId) === String(auth.user.id)) : []
  )

  /* 기관 콘솔이 다루는 공고 목록.
     데모 계정으로는 내가 올린 공고를 특정하기 어려워, 없으면 전체를 씁니다. */
  const consoleRows = computed(() => (mine.value.length ? mine.value : scored.value))

  function resetFilters() { filters.value = emptyFilters() }
  function toggle(axis, value) {
    const f = filters.value
    if (axis === 'period') { f.period = f.period === value ? null : value; return }
    const arr = f[axis]
    const i = arr.indexOf(value)
    if (i >= 0) arr.splice(i, 1); else arr.push(value)
  }
  /* 401은 '공고가 없음'이 아니라 '로그인이 안 됨'입니다. 화면에서 구분해 보여줍니다. */
  const needsLogin = computed(() => error.value?.response?.status === 401)

  return { all, scored, filtered, grouped, loading, error, needsLogin, usingDemo, filters, sort, consoleRows,
           openCount, dueSoonCount, mine, load, byId, resetFilters, toggle }
})
