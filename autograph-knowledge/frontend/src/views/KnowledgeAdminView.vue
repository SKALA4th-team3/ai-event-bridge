<script setup>
import { knowledgeDashboard } from '../data/knowledgeViewModel'
import KnowledgeSummary from '../components/knowledge/KnowledgeSummary.vue'
import DataQualityPanel from '../components/knowledge/DataQualityPanel.vue'
import AiReadinessPanel from '../components/knowledge/AiReadinessPanel.vue'
import '../components/knowledge/knowledge.css'
</script>

<template>
  <main class="knowledge-admin">
    <header class="knowledge-hero">
      <div class="knowledge-container"><div class="admin-breadcrumb">관리자 / 데이터 운영 / AI Knowledge</div><span class="hero-eyebrow">AI Knowledge Management</span><h1>AI Knowledge 관리</h1><p>행사, 입찰, 업체, 검색, 성과 데이터를 AI 활용 가능한 지식 자산으로 관리합니다.</p></div>
    </header>
    <div class="knowledge-container knowledge-content">
      <KnowledgeSummary :items="knowledgeDashboard.summary" :as-of="knowledgeDashboard.asOf" />
      <DataQualityPanel :groups="knowledgeDashboard.collection" />
      <AiReadinessPanel :data="knowledgeDashboard.aiUse" />
    </div>
  </main>
</template>
