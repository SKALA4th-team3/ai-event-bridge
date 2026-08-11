<script setup>
import { computed, ref } from 'vue'
import { colorForBid } from '../../utils/bidColors'
import { formatMoney } from '../../utils/formatMoney'

const props = defineProps({
  history: { type: Array, required: true },
  bids: { type: Array, required: true },
  visitorTrend: { type: Array, required: true },
  costTrend: { type: Array, required: true },
  profitTrend: { type: Array, required: true },
})
const width=1100, height=440, left=82, right=92, top=62, bottom=58
const PROFIT_COLOR='#ca8a04'
const years=Array.from({length:21},(_,i)=>2006+i)
const hoveredYear=ref(null)
const hoveredBid=ref(null)
const visitorValues=computed(()=>props.history.map(item=>Number(item.visitors)))
const costValues=computed(()=>props.history.map(item=>Number(item.cost)))
const profitValues=computed(()=>props.history.map(item=>Number(item.netProfit)))
const bidCosts=computed(()=>props.bids.map(bid=>Number(bid.bidAmount)+Number(bid.otherCost)))
const bidProfits=computed(()=>props.bids.map(bid=>Number(bid.expectedProfit)))
const visitorAll=computed(()=>[...visitorValues.value,...props.visitorTrend.map(Number)])
const financialAll=computed(()=>[...costValues.value,...profitValues.value,...props.costTrend.map(Number),...props.profitTrend.map(Number),...bidCosts.value,...bidProfits.value])
const visitorMin=computed(()=>Math.min(...visitorAll.value)*.88)
const visitorMax=computed(()=>Math.max(...visitorAll.value)*1.1)
const financialMin=computed(()=>Math.min(0,...financialAll.value)*1.08)
const financialMax=computed(()=>Math.max(...financialAll.value)*1.12)
const x=i=>left+i*(width-left-right)/(years.length-1)
const yVisitors=value=>top+(1-(value-visitorMin.value)/Math.max(visitorMax.value-visitorMin.value,1))*(height-top-bottom)
const yMoney=value=>top+(1-(value-financialMin.value)/Math.max(financialMax.value-financialMin.value,1))*(height-top-bottom)
const points=(values,yFn)=>values.map((value,i)=>`${x(i)},${yFn(value)}`).join(' ')
const visitorActual=computed(()=>points(visitorValues.value,yVisitors))
const costActual=computed(()=>points(costValues.value,yMoney))
const profitActual=computed(()=>points(profitValues.value,yMoney))
const visitorRegression=computed(()=>points(props.visitorTrend,yVisitors))
const costRegression=computed(()=>points(props.costTrend,yMoney))
const profitRegression=computed(()=>points(props.profitTrend,yMoney))
const leftTicks=computed(()=>[0,.25,.5,.75,1].map(ratio=>visitorMin.value+(visitorMax.value-visitorMin.value)*ratio))
const rightTicks=computed(()=>[0,.25,.5,.75,1].map(ratio=>financialMin.value+(financialMax.value-financialMin.value)*ratio))
const showYear=i=>i%4===0||i===20
const bidX=i=>x(20)+(i-(props.bids.length-1)/2)*9
const bidColor=bid=>colorForBid(bid)
const tooltipX=computed(()=>{
  const source=hoveredBid.value!==null?bidX(hoveredBid.value):x(hoveredYear.value??0)
  return Math.min(Math.max(source-130,left),width-right-260)
})
const money=value=>formatMoney(value)
const people=value=>`${Math.round(Number(value)).toLocaleString('ko-KR')}명`
</script>

<template>
  <div class="chart-wrap unified-chart">
    <div class="performance-legend">
      <span><i class="legend-line visitors"></i>방문객</span>
      <span><i class="legend-line cost"></i>총비용</span>
      <span><i class="legend-line profit" :style="{background:PROFIT_COLOR}"></i>순이익</span>
      <span><i class="legend-line regression"></i>선형회귀 추세</span>
      <span><i class="legend-shape total-cost"></i>업체 예상 총비용</span>
      <span><i class="legend-shape expected-profit"></i>업체 예상 순이익</span>
    </div>
    <div class="company-legend" aria-label="2026 예상 업체 색상 범례">
      <span v-for="bid in bids" :key="bid.bidId"><i :style="{background:bidColor(bid)}"></i>{{ bid.companyName }}</span>
    </div>
    <svg :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="연도별 행사 성과 및 2026 업체별 예상">
      <g v-for="(tick,i) in leftTicks" :key="`left-${i}`">
        <line :x1="left" :x2="width-right" :y1="yVisitors(tick)" :y2="yVisitors(tick)" class="grid-line" />
        <text :x="left-10" :y="yVisitors(tick)+4" text-anchor="end" class="axis-text visitor-axis">{{ people(tick) }}</text>
      </g>
      <g v-for="(tick,i) in rightTicks" :key="`right-${i}`">
        <text :x="width-right+10" :y="yMoney(tick)+4" text-anchor="start" class="axis-text money-axis">{{ money(tick) }}</text>
      </g>
      <text :x="left" y="22" class="axis-title visitor-axis">방문객 수 (명)</text>
      <text :x="width-right" y="22" text-anchor="end" class="axis-title money-axis">총비용 / 순이익 (억원)</text>

      <polyline :points="visitorActual" fill="none" stroke="#2563eb" stroke-width="2.8" stroke-linejoin="round" />
      <polyline :points="costActual" fill="none" stroke="#0f766e" stroke-width="2.8" stroke-linejoin="round" />
      <polyline :points="profitActual" fill="none" :stroke="PROFIT_COLOR" stroke-width="2.8" stroke-linejoin="round" />
      <polyline :points="visitorRegression" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="8 6" opacity=".65" />
      <polyline :points="costRegression" fill="none" stroke="#0f766e" stroke-width="2" stroke-dasharray="8 6" opacity=".65" />
      <polyline :points="profitRegression" fill="none" :stroke="PROFIT_COLOR" stroke-width="2" stroke-dasharray="8 6" opacity=".65" />

      <g v-for="(item,i) in history" :key="item.year">
        <circle :cx="x(i)" :cy="yVisitors(item.visitors)" r="3.4" fill="#2563eb" />
        <circle :cx="x(i)" :cy="yMoney(item.cost)" r="3.4" fill="#0f766e" />
        <circle :cx="x(i)" :cy="yMoney(item.netProfit)" r="3.4" :fill="PROFIT_COLOR" />
        <rect :x="x(i)-18" :y="top" width="36" :height="height-top-bottom" fill="transparent" @mouseenter="hoveredYear=i;hoveredBid=null" @mouseleave="hoveredYear=null" />
      </g>

      <g v-for="(bid,i) in bids" :key="bid.bidId" class="bid-points">
        <rect :x="bidX(i)-7" :y="yMoney(bid.bidAmount+bid.otherCost)-7" width="14" height="14" :fill="bidColor(bid)" transform-origin="center" :transform="`rotate(45 ${bidX(i)} ${yMoney(bid.bidAmount+bid.otherCost)})`" />
        <circle :cx="bidX(i)" :cy="yMoney(bid.expectedProfit)" r="7" :fill="bidColor(bid)" stroke="#fff" stroke-width="2" />
        <rect :x="bidX(i)-8" :y="Math.min(yMoney(bid.bidAmount+bid.otherCost),yMoney(bid.expectedProfit))-10" width="16" :height="Math.abs(yMoney(bid.bidAmount+bid.otherCost)-yMoney(bid.expectedProfit))+20" fill="transparent" @mouseenter="hoveredBid=i;hoveredYear=null" @mouseleave="hoveredBid=null" />
      </g>

      <g v-for="(year,i) in years" :key="year">
        <text v-if="showYear(i)" :x="x(i)" :y="height-20" text-anchor="middle" :class="i===20?'axis-text forecast-axis-text':'axis-text'">{{ i===20?'2026 예상':year }}</text>
      </g>

      <g v-if="hoveredYear!==null" class="svg-tooltip" pointer-events="none">
        <rect :x="tooltipX" y="72" width="260" height="92" rx="9" />
        <text :x="tooltipX+14" y="95" class="tooltip-title">{{ history[hoveredYear].year }}년</text>
        <text :x="tooltipX+14" y="118" class="tooltip-value">방문객: {{ people(history[hoveredYear].visitors) }}</text>
        <text :x="tooltipX+14" y="138" class="tooltip-value">총비용: {{ money(history[hoveredYear].cost) }}</text>
        <circle :cx="tooltipX+17" cy="154" r="4" :fill="PROFIT_COLOR" />
        <text :x="tooltipX+29" y="158" class="tooltip-value">순이익: {{ money(history[hoveredYear].netProfit) }}</text>
      </g>
      <g v-if="hoveredBid!==null" class="svg-tooltip" pointer-events="none">
        <rect :x="tooltipX" y="62" width="260" height="164" rx="9" />
        <circle :cx="tooltipX+17" cy="81" r="5" :fill="bidColor(bids[hoveredBid])" />
        <text :x="tooltipX+29" y="85" class="tooltip-title">{{ bids[hoveredBid].companyName }}</text>
        <text :x="tooltipX+14" y="106" class="tooltip-value">2026 예상</text>
        <text :x="tooltipX+14" y="128" class="tooltip-value">제안금액: {{ money(bids[hoveredBid].bidAmount) }}</text>
        <text :x="tooltipX+14" y="148" class="tooltip-value">기타비용: {{ money(bids[hoveredBid].otherCost) }}</text>
        <text :x="tooltipX+14" y="168" class="tooltip-value">예상 총비용: {{ money(bids[hoveredBid].bidAmount+bids[hoveredBid].otherCost) }}</text>
        <text :x="tooltipX+14" y="188" class="tooltip-value">예상 매출: {{ money(bids[hoveredBid].expectedRevenue) }}</text>
        <text :x="tooltipX+14" y="208" class="tooltip-value">예상 순이익: {{ money(bids[hoveredBid].expectedProfit) }}, ROI {{ bids[hoveredBid].roi.toFixed(1) }}%</text>
      </g>
    </svg>
  </div>
</template>
