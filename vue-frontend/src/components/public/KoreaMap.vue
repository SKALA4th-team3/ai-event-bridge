<script setup>
import { computed } from 'vue'
import { KOREA_VIEWBOX, KOREA_REGIONS } from '@/constants/koreaMap.js'

const props = defineProps({
  postings: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] }
})
const emit = defineEmits(['pick'])

/* 라벨은 도형 중심을 쓰되, 서울처럼 다른 지역에 둘러싸인 곳은
   겹치지 않게 손으로 밀어 둡니다 (dx, dy). */
const NUDGE = {
  '서울': [-40, -30], '경기·인천': [4, 34], '강원': [4, 4],
  '충청': [-6, 4], '전라': [-6, -14], '경상': [12, 6], '제주': [0, -26]
}

const rows = computed(() => {
  const counts = {}
  const hot = {}
  props.postings.forEach((p) => {
    counts[p.region] = (counts[p.region] ?? 0) + 1
    if (p.dday !== null && p.dday <= 7) hot[p.region] = true
  })
  const max = Math.max(1, ...Object.values(counts))
  return KOREA_REGIONS.map((r) => {
    const n = counts[r.group] ?? 0
    const [dx, dy] = NUDGE[r.group] ?? [0, 0]
    return {
      ...r, n, hot: !!hot[r.group],
      on: props.selected.includes(r.group),
      /* 물량을 채도로 — 0건은 옅게, 최다 지역은 진하게 */
      alpha: n === 0 ? 0.22 : 0.34 + (n / max) * 0.62,
      lx: r.cx + dx, ly: r.cy + dy
    }
  })
})
</script>

<template>
  <svg class="kmap" :class="{ picking: selected.length }" :viewBox="KOREA_VIEWBOX" preserveAspectRatio="xMidYMid meet"
       role="img" aria-label="지역별 발주 현황">
    <g v-for="r in rows" :key="r.group" class="rg"
       :class="{ on: r.on, hot: r.hot, none: !r.n }"
       tabindex="0" role="button" :aria-label="`${r.group} ${r.n}건, 조건 추가/해제`"
       @click="emit('pick', r.group)"
       @keydown.enter.prevent="emit('pick', r.group)"
       @keydown.space.prevent="emit('pick', r.group)">
      <path :d="r.d" class="land" :style="{ fillOpacity: r.alpha }" />
      <!-- 고른 지역에만 붙는 체크 — 색이 아니라 형태로 알립니다 -->
      <g class="pickmark" :transform="`translate(${r.lx + 34},${r.ly - 8})`">
        <circle r="11" />
        <path d="M-5 0 L-1.5 3.5 L5 -3.5" />
      </g>
      <text :x="r.lx" :y="r.ly" class="nm">{{ r.group }}</text>
      <text :x="r.lx" :y="r.ly + 20" class="ct">{{ r.n }}</text>
    </g>
  </svg>
</template>
