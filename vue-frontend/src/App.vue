<script setup>
import { ref, shallowRef, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { RouterView } from 'vue-router'
import ToastHost from '@/components/common/ToastHost.vue'
import NotificationDrawer from '@/components/common/NotificationDrawer.vue'
import { useSeasonStore } from '@/store/season.js'

/* 스토어를 만드는 것만으로 <html data-season>이 세팅됩니다 */
useSeasonStore()

/* 화면 미리보기 바 — 개발 모드에서만, Ctrl+` 로 켜고 끕니다.
   동적 import라 빌드 산출물에는 포함되지 않습니다. */
const ScreenBar = shallowRef(
  import.meta.env.DEV ? defineAsyncComponent(() => import('@/components/dev/ScreenBar.vue')) : null
)
const preview = ref(import.meta.env.DEV && sessionStorage.getItem('eb.preview') !== 'off')
function onKey(e) {
  if (!import.meta.env.DEV) return
  if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
    preview.value = !preview.value
    sessionStorage.setItem('eb.preview', preview.value ? 'on' : 'off')
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <component :is="ScreenBar" v-if="preview && ScreenBar" />
  <RouterView />
  <NotificationDrawer />
  <ToastHost />
</template>
