import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { SEASONS, seasonOfMonth } from '@/constants/status.js'

/* 시즌은 화면 색이자 조회 기간 범위입니다. 전역 스코프라 스토어에 둡니다. */
export const useSeasonStore = defineStore('season', () => {
  const current = ref(seasonOfMonth(new Date().getMonth() + 1))
  const meta = computed(() => SEASONS.find((s) => s.key === current.value))

  /* 사용자가 직접 고르기 전까지는 오늘 날짜를 따라갑니다.
     발표 중 자정을 넘기거나 앱을 오래 띄워 두는 경우를 위해 주기적으로 확인합니다. */
  const pinned = ref(false)
  function set(key) { pinned.value = true; current.value = key }

  const syncToToday = () => {
    if (pinned.value) return
    const auto = seasonOfMonth(new Date().getMonth() + 1)
    if (auto !== current.value) current.value = auto
  }
  setInterval(syncToToday, 60 * 60 * 1000)          // 1시간마다
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncToToday() })

  /* 문서 루트에 data-season을 심어 CSS 변수 전체가 바뀝니다 */
  watch(current, (v) => document.documentElement.setAttribute('data-season', v), { immediate: true })

  /** 해당 시즌에 '열리는' 축제의 공고 */
  function inSeason(postings) {
    const months = meta.value.months
    return postings.filter((p) => p.eventMonth === null || months.includes(p.eventMonth))
  }
  return { current, meta, seasons: SEASONS, pinned, set, inSeason }
})
