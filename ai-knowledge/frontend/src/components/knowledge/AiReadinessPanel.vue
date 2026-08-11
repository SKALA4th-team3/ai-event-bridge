<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ data: { type: Object, required: true } })
const number = value => Number(value).toLocaleString('ko-KR')
const money = value => `${(Number(value) / 100000000).toFixed(1)}억원`
const gradeForScore = score => score >= 85 ? '우수' : score >= 75 ? '양호' : '일반'
const selectedVendorId = ref('')
const vendorSection = computed(() => props.data.future.find(item => item.id === 'company-analysis'))
const selectedVendor = computed(() => vendorSection.value?.vendors.find(vendor => vendor.id === Number(selectedVendorId.value)))
</script>

<template>
  <div class="ai-use-sections">
    <section aria-labelledby="current-ai-title">
      <div class="knowledge-section-heading"><div><span class="section-kicker">CURRENT AI USE</span><h2 id="current-ai-title">현재 AI 활용</h2></div></div>
      <div class="current-ai-grid">
        <article class="knowledge-card knowledge-section current-ai current-ai-card">
          <header><h3>{{ data.search.name }}</h3><span>{{ data.search.status }}</span></header><p>{{ data.search.description }}</p>
          <div class="current-ai-flow"><template v-for="(step,index) in data.search.flow" :key="step"><span>{{ step }}</span><b v-if="index < data.search.flow.length - 1">→</b></template></div>
          <div class="current-ai-total"><span>전체 자연어 검색 로그</span><strong>{{ number(data.search.total) }}건</strong><small>현재 자연어 검색 기능에서 발생한 검색 요청과 LLM이 구조화한 조건을 저장한 운영 로그이며, 검색 결과 개수가 아닙니다.</small></div>
          <div class="search-metrics current-ai-metrics"><div v-for="item in data.search.metrics" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.percentage }}%</strong><b>{{ number(item.count) }} / {{ number(item.total) }} 검색</b><small>{{ item.description }}</small></div></div>
          <article class="search-example"><p><small>사용자 입력</small>“{{ data.search.example.raw }}”</p><div class="example-arrow">↓ LLM이 검색 조건 추출</div><dl><template v-for="(value,key) in data.search.example.conditions" :key="key"><dt>{{ key }}</dt><dd>{{ value }}</dd></template></dl><div class="example-arrow">↓ 조건 기반 조회</div><p class="example-result">해당 조건과 일치하는 이벤트 카드 표시</p><p class="search-log-uses">운영 로그 활용: {{ data.search.uses.join(' / ') }}</p></article>
        </article>
        <article class="knowledge-card knowledge-section current-ai current-ai-card prediction-card">
          <header><h3>{{ data.prediction.name }}</h3><span>{{ data.prediction.status }}</span></header><p>{{ data.prediction.description }}</p>
          <div class="prediction-items"><div v-for="item in data.prediction.items" :key="item.label"><strong>{{ item.label }}</strong><span>{{ item.description }}</span></div></div>
          <h4>현재 확보된 Knowledge</h4><div class="prediction-knowledge"><div v-for="item in data.prediction.knowledge" :key="item.label"><span>{{ item.label }}</span><strong v-if="item.total">{{ number(item.count) }} / {{ number(item.total) }}</strong><strong v-else>{{ number(item.value) }}{{ item.unit }}</strong></div></div>
          <div class="prediction-data-links"><div v-for="link in data.prediction.dataLinks" :key="link.source"><b>{{ link.source }}</b><span>{{ link.fields }}</span><em>→ {{ link.use }}</em></div></div><div class="prediction-method"><p><b>현재</b>{{ data.prediction.currentMethod }}</p><p><b>향후</b>{{ data.prediction.futureMethod }}</p></div>
        </article>
      </div>
    </section>

    <section class="future-section" aria-labelledby="future-title">
      <div class="knowledge-section-heading"><div><span class="section-kicker">FUTURE AX USE</span><h2 id="future-title">향후 AX 활용</h2></div><span class="section-meta">현재 기능과 겹치지 않는 확장 방향</span></div>
      <aside class="future-guide"><h3>{{ data.futureGuide.title }}</h3><p>{{ data.futureGuide.description }}</p><div class="future-guide-flow"><template v-for="(step,index) in data.futureGuide.flow" :key="step"><span>{{ step }}</span><b v-if="index < data.futureGuide.flow.length - 1">→</b></template></div><div class="model-roles"><p><b>LLM</b>{{ data.futureGuide.llmRole }}</p><p><b>ML / 회귀 모델</b>{{ data.futureGuide.mlRole }}</p></div><small>{{ data.futureGuide.benefit }}</small></aside>
      <div class="future-use-grid single">
        <article v-for="item in data.future" :key="item.id" class="knowledge-card future-card vendor-knowledge-card">
          <header><h3>{{ item.name }}</h3><p>{{ item.description }}</p></header>
          <div class="vendor-platform-summary"><div><span>등록 업체</span><b>{{ number(item.platformSummary.registeredCompanies) }}개</b></div><div><span>누적 수행 이력</span><b>{{ number(item.platformSummary.performanceRecords) }}건</b></div><div><span>연결된 행사</span><b>{{ number(item.platformSummary.linkedEvents) }}건</b></div><div><span>성과 데이터 연결</span><b>{{ number(item.platformSummary.linkedResults) }}건</b></div><div><span>평가 데이터 연결</span><b>{{ number(item.platformSummary.linkedEvaluations) }}건</b></div></div>
          <div class="vendor-selector"><label for="vendor-knowledge-select">업체 선택</label><select id="vendor-knowledge-select" v-model="selectedVendorId"><option value="">업체를 선택하세요</option><option v-for="vendor in item.vendors" :key="vendor.id" :value="vendor.id">{{ vendor.companyName }}</option></select><small v-if="!selectedVendor">업체를 선택해 상세 수행 Knowledge를 확인하세요.</small></div>
          <section v-if="selectedVendor" class="vendor-detail">
            <div class="future-flow"><template v-for="(step,index) in item.flow" :key="step"><span>{{ index === 0 ? selectedVendor.companyName : step }}</span><b v-if="index < item.flow.length - 1">→</b></template></div>
            <div class="vendor-detail-grid">
              <div class="vendor-stat-panel"><h4>{{ selectedVendor.companyName }} 수행 Knowledge</h4><div class="vendor-stats"><div><span>과거 수행 행사</span><b>{{ selectedVendor.totalEvents }}건</b></div><div><span>유사 행사 수행</span><b>{{ selectedVendor.similarEvents }}건</b></div><div><span>평균 계약금액</span><b>{{ money(selectedVendor.averageContractAmount) }}</b></div><div><span>평균 실제 비용</span><b>{{ money(selectedVendor.averageActualCost) }}</b></div><div><span>평균 실제 방문객</span><b>{{ number(selectedVendor.averageVisitors) }}명</b></div><div><span>평균 실제 매출</span><b>{{ money(selectedVendor.averageRevenue) }}</b></div><div><span>평균 ROI</span><b>{{ selectedVendor.averageRoi }}%</b></div><div><span>평균 평가점수</span><b>{{ selectedVendor.averageScore }}점</b></div><div><span>우수 등급 비율</span><b>{{ selectedVendor.excellentRate }}%</b></div></div></div>
              <div class="vendor-evaluation"><h4>누적 평균 평가</h4><div class="vendor-average-score"><b>{{ selectedVendor.averageScore.toFixed(1) }}점</b><em>{{ gradeForScore(selectedVendor.averageScore) }}</em><small>{{ selectedVendor.totalEvents }}개 수행 행사 · 평가 데이터 {{ selectedVendor.totalEvents }}건 기준</small></div><p>선택 업체의 과거 수행 행사 평가 데이터를 기준으로 산출한 평균입니다.</p><div v-for="criterion in selectedVendor.averageEvaluationCriteria" :key="criterion.label" class="vendor-average-criterion"><span>{{ criterion.label }}</span><b>{{ criterion.score.toFixed(1) }} / {{ criterion.maxScore }}</b></div></div>
            </div>
            <aside class="vendor-insight"><b>수치 기반 Knowledge Insight</b><p>{{ selectedVendor.companyName }}는 유사 규모 행사 {{ selectedVendor.similarEvents }}건에서 평균 ROI {{ selectedVendor.averageRoi }}%, 평균 평가점수 {{ selectedVendor.averageScore }}점을 기록했습니다.</p><div><span>평균 계약금액 {{ money(selectedVendor.averageContractAmount) }}</span><span>평균 방문객 {{ number(selectedVendor.averageVisitors) }}명</span><span>우수 등급 비율 {{ selectedVendor.excellentRate }}%</span></div></aside>
          </section>
        </article>
      </div>
    </section>

    <section class="knowledge-card knowledge-section ax-extension" aria-labelledby="agent-title"><div><span class="section-kicker">FUTURE EXTENSION</span><h2 id="agent-title">향후 확장</h2></div><div class="agent-summary"><div><h3>{{ data.agent.name }}</h3><span>{{ data.agent.status }}</span></div><p>{{ data.agent.description }}</p><h4>향후 Agent가 참고할 현재 축적 핵심 Knowledge</h4><div class="agent-knowledge core"><div v-for="item in data.agent.coreKnowledge" :key="item.label"><span>{{ item.label }}</span><strong v-if="item.total">{{ number(item.value) }} / {{ number(item.total) }} {{ item.unit }}</strong><strong v-else>{{ number(item.value) }}{{ item.unit }}</strong></div></div><div class="agent-comparison"><div><b>업체 비교 평가 항목</b><span v-for="criterion in data.agent.comparisonCriteria" :key="criterion">{{ criterion }}</span><small>각 업체의 과거 수행 행사 평가 데이터 누적 평균 기준</small></div><div class="agent-comparison-example"><b>비교분석 예시</b><article v-for="vendor in data.agent.comparisonExample" :key="vendor.company"><strong>{{ vendor.company }}</strong><span>평균 {{ vendor.score }}점</span><span>수행 품질 {{ vendor.quality }} / 20</span><span>안전 {{ vendor.safety }} / 20</span><span>예산 효율 {{ vendor.budget }} / 20</span><span>ROI {{ vendor.roi }}%</span></article><p>{{ data.agent.comparisonSummary }}</p></div></div><small class="flow-label">향후 Agent 업무 흐름 예시</small><div class="current-ai-flow muted"><template v-for="(step,index) in data.agent.flow" :key="step"><span>{{ step }}</span><b v-if="index < data.agent.flow.length - 1">→</b></template></div><p class="decision-note">{{ data.agent.decisionNote }}</p></div></section>
  </div>
</template>
