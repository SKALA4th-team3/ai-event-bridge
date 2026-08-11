import { defineStore } from 'pinia'
import { ref } from 'vue'

/* 전역 피드백(토스트)과 알림 드로어.
   필드 단위 오류는 토스트가 아니라 FormField의 인라인으로 처리합니다. */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])
  const drawerOpen = ref(false)
  const notifications = ref([])
  let seq = 0

  function toast(message, kind = 'info') {
    const id = ++seq
    toasts.value.push({ id, message, kind })
    setTimeout(() => { toasts.value = toasts.value.filter((t) => t.id !== id) }, 2800)
  }
  const notify = (title, sub) => notifications.value.unshift({ title, sub, at: '방금', read: false })
  function openDrawer() {
    drawerOpen.value = true
    setTimeout(() => notifications.value.forEach((n) => { n.read = true }), 1200)
  }
  const closeDrawer = () => { drawerOpen.value = false }
  return { toasts, drawerOpen, notifications, toast, notify, openDrawer, closeDrawer }
})
