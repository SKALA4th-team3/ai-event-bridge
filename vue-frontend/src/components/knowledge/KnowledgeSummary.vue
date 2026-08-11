<script setup>
defineProps({ items: { type: Array, required: true }, asOf: { type: String, required: true } })
const number = value => Number(value).toLocaleString('ko-KR')
</script>

<template>
  <section aria-labelledby="knowledge-summary-title">
    <div class="knowledge-section-heading compact"><div><span class="section-kicker">OVERVIEW</span><h2 id="knowledge-summary-title">Knowledge 현황</h2></div><span class="updated-label">{{ asOf }} 기준</span></div>
    <div class="knowledge-summary-grid">
      <article v-for="item in items" :key="item.id" class="knowledge-card summary-card">
        <span class="summary-label">{{ item.label }}</span>
        <template v-if="item.count !== undefined"><strong>{{ number(item.count) }} / {{ number(item.total) }}<small>{{ item.unit }}</small></strong><b class="summary-rate">{{ item.percentage }}%</b></template>
        <strong v-else>{{ number(item.value) }}<small>{{ item.unit }}</small></strong>
        <p>{{ item.description }}</p>
        <small v-if="item.formula" class="metric-formula">성과 연결률 = {{ item.formula }}</small>
      </article>
    </div>
  </section>
</template>
