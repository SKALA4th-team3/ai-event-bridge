import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/* 업체 업종·지역·실적과 기관 부서 정보는 백엔드 users 테이블에 필드가 없습니다.
   서버가 필드를 갖게 되면 이 스토어의 load/save만 API 호출로 바꾸면 됩니다. */
const KEY = 'eb.profile'

export const useProfileStore = defineStore('profile', () => {
  const data = ref(JSON.parse(sessionStorage.getItem(KEY) || 'null'))

  const firm = computed(() => (data.value?.kind === 'vendor' ? data.value : null))
  const org  = computed(() => (data.value?.kind === 'gov' ? data.value : null))

  function save(p) {
    data.value = p
    sessionStorage.setItem(KEY, JSON.stringify(p))
  }
  function clear() {
    data.value = null
    sessionStorage.removeItem(KEY)
  }
  /** 프로필이 없을 때 쓰는 기본값 — 데모가 빈 화면이 되지 않게 합니다 */
  function ensureVendor(name = '우리 업체') {
    if (!firm.value) save({ kind: 'vendor', name, category: '부스 설치', regions: ['경상'], records: 6, tenure: 4 })
    return firm.value
  }
  function ensureGov(name = '발주 기관') {
    if (!org.value) save({ kind: 'gov', name, dept: '문화관광과', manager: '담당자' })
    return org.value
  }
  return { data, firm, org, save, clear, ensureVendor, ensureGov }
})
