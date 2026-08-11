<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import EventPerformanceModule from '../components/EventPerformanceModule.vue'
const route=useRoute()
const eventId=computed(()=>route.params.eventId)
</script>

<template>
  <main>
    <div class="event-hero"><div class="breadcrumb">행사 관리 / 행사 상세</div><h1>지역축제 #{{ eventId }}</h1><p>행사 성과와 참여 업체의 제안 내용을 한눈에 비교하세요.</p></div>
    <!-- 실제 행사 상세 화면에서는 아래 모듈 한 줄만 삽입하면 됩니다. -->
    <EventPerformanceModule :event-id="eventId" />
  </main>
</template>
