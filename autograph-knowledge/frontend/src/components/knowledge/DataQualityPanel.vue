<script setup>
defineProps({ groups: { type: Array, required: true } })
const number = value => Number(value).toLocaleString('ko-KR')
</script>

<template>
  <section aria-labelledby="collection-title">
    <div class="knowledge-section-heading compact"><div><span class="section-kicker">DATA COLLECTION</span><h2 id="collection-title">데이터 수집 현황</h2></div><span class="section-meta">수집률 = 확보 데이터 수 / 전체 대상 수</span></div>
    <div class="quality-grid collection-grid"><article v-for="group in groups" :key="group.title" class="knowledge-card quality-card"><h3>{{ group.title }}</h3><p class="collection-description">{{ group.description }}</p><div v-for="field in group.fields" :key="field.label" class="collection-row"><span class="collection-label">{{ field.label }}<button v-if="field.description" type="button" class="info-tooltip" :aria-label="`${field.label} 설명`"><i aria-hidden="true">i</i><span role="tooltip">{{ field.description }}</span></button></span><strong>{{ number(field.count) }} / {{ number(field.total) }}</strong><b>{{ field.percentage }}%</b></div></article></div>
  </section>
</template>
