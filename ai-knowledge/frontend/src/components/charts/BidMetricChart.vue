<script setup>
import { computed, ref } from 'vue'
import { formatMoney } from '../../utils/formatMoney'

const props = defineProps({ bids: { type: Array, required: true } })
const selected = ref('expectedProfit')
const metrics = [
  { key: 'expectedProfit', label: '예상 순이익', color: '#ca8a04', format: money },
  { key: 'bidAmount', label: '제안금액', color: '#2563eb', format: money },
  { key: 'roi', label: 'ROI', color: '#d97706', format: value => `${Number(value).toFixed(1)}%` },
]
const metric = computed(() => metrics.find(item => item.key === selected.value))
const maxValue = computed(() => Math.max(...props.bids.map(bid => Math.max(Number(bid[selected.value]), 0)), 1))
const barWidth = bid => `${Math.max((Math.max(Number(bid[selected.value]), 0) / maxValue.value) * 100, 1)}%`
function money(value) { return formatMoney(value) }
</script>

<template>
  <div class="metric-tabs" role="tablist">
    <button v-for="item in metrics" :key="item.key" :class="{active:selected===item.key}" @click="selected=item.key">{{ item.label }}</button>
  </div>
  <div class="horizontal-chart" :aria-label="`업체별 ${metric.label} 막대그래프`">
    <div v-for="bid in bids" :key="bid.bidId" class="bar-row">
      <span class="bar-label" :title="bid.companyName">{{ bid.companyName }}</span>
      <div class="bar-track"><div class="bar-fill" :style="{width:barWidth(bid),background:metric.color}"></div></div>
      <strong>{{ metric.format(bid[selected]) }}</strong>
    </div>
  </div>
</template>
