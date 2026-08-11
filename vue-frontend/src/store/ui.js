import { defineStore } from 'pinia'
import { ref } from 'vue'

/* 전역 피드백(토스트)과 알림 드로어.
   필드 단위 오류는 토스트가 아니라 FormField의 인라인으로 처리합니다. */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])
  const drawerOpen = ref(false)
  const notifications = ref([])
  let seq = 0

  /* 같은 자리에서 반복되는 알림은 쌓지 않고 갈아 끼웁니다.
     시즌 버튼을 연달아 누르면 네 장이 겹쳐 카드를 덮었습니다.
     group 을 주면 그 그룹 안에서 마지막 하나만 남습니다. */
  function toast(message, kind = 'info', group = null) {
    const id = ++seq
    if (group) toasts.value = toasts.value.filter((t) => t.group !== group)
    /* 그룹이 없어도 세 장을 넘기지 않습니다 — 그 이상은 읽히지 않습니다 */
    if (toasts.value.length >= 3) toasts.value = toasts.value.slice(-2)
    toasts.value.push({ id, message, kind, group })
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
