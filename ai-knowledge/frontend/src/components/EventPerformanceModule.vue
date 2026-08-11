<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { createBid, getEventPerformance } from '../api/eventPerformanceApi'
import UnifiedPerformanceChart from './charts/UnifiedPerformanceChart.vue'
import BidMetricChart from './charts/BidMetricChart.vue'
import BidForm from './BidForm.vue'
import { formatMoney } from '../utils/formatMoney'

const props = defineProps({ eventId: { type: [String, Number], required: true } })
const data = ref(null), loading = ref(true), error = ref(''), submitting = ref(false), success = ref('')
const money = value => formatMoney(value)
const people = value => `${Math.round(Number(value)).toLocaleString('ko-KR')}명`
const visitorTrend = computed(() => data.value?.visitorRegression.trend.map(point => point.value) ?? [])
const costTrend = computed(() => data.value?.costRegression.trend.map(point => point.value) ?? [])
const profitTrend = computed(() => data.value?.netProfitRegression.trend.map(point => point.value) ?? [])
async function load() {
  loading.value=true; error.value=''
  try { data.value=await getEventPerformance(props.eventId) }
  catch (e) { error.value=e.message }
  finally { loading.value=false }
}
async function submitBid(payload, reset) {
  submitting.value=true; error.value=''; success.value=''
  try { const bid=await createBid(props.eventId,payload); await load(); reset(); success.value=`${bid.companyName} 입찰이 등록되어 그래프에 반영되었습니다.` }
  catch (e) { error.value=e.message }
  finally { submitting.value=false }
}
onMounted(load)
watch(() => props.eventId, load)
</script>

<template>
  <section class="performance-module">
    <div v-if="loading" class="state-box">성과 데이터를 불러오는 중입니다…</div>
    <div v-else-if="!data" class="state-box error">{{ error }} <button @click="load">다시 시도</button></div>
    <template v-else>
      <div class="section-heading"><div><span class="eyebrow">PERFORMANCE ANALYTICS</span><h2>연도별 행사 성과 및 2026 업체별 예상</h2></div><span class="demo-badge">eventId 기반 데모 데이터</span></div>
      <article class="panel unified-panel">
        <h3>2006~2025 성과 추세와 2026 입찰 제안</h3>
        <p>2006~2025는 과거 행사 데이터이며, 2026은 입찰 업체가 제안한 예상 성과입니다. 점선은 과거 20년 데이터를 기반으로 한 선형회귀 추세입니다.</p>
        <UnifiedPerformanceChart :history="data.history" :bids="data.bids" :visitor-trend="visitorTrend" :cost-trend="costTrend" :profit-trend="profitTrend" />
      </article>

      <div class="section-heading bids-heading"><div><span class="eyebrow">BID COMPARISON</span><h2>업체별 입찰 비교</h2></div><strong>{{ data.bids.length }}개 업체</strong></div>
      <article class="panel"><h3>업체별 지표 그래프</h3><p>예상 순이익을 기본으로 제안금액과 ROI를 각각 같은 단위끼리 비교합니다.</p><BidMetricChart :bids="data.bids" /></article>
      <div class="table-wrap">
        <table><thead><tr><th>업체명</th><th>제안금액</th><th>예상 매출</th><th>기타비용</th><th>예상 순이익</th><th>ROI</th></tr></thead>
        <tbody><tr v-for="bid in data.bids" :key="bid.bidId"><td><strong>{{ bid.companyName }}</strong></td><td>{{ money(bid.bidAmount) }}</td><td>{{ money(bid.expectedRevenue) }}</td><td>{{ money(bid.otherCost) }}</td><td class="positive">{{ money(bid.expectedProfit) }}</td><td><span class="roi-pill">{{ bid.roi.toFixed(1) }}%</span></td></tr></tbody></table>
      </div>

      <article class="panel form-panel"><h3>데모 입찰 등록</h3><p>등록 후 최신 데이터를 다시 조회하여 비교 그래프를 즉시 갱신합니다.</p><BidForm :submitting="submitting" @submit="submitBid" /><p v-if="success" class="success-message">{{ success }}</p><p v-if="error" class="form-error">{{ error }}</p></article>
    </template>
  </section>
</template>
