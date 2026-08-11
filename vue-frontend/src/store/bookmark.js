import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/* 관심 공고.
   ★ 백엔드에 즐겨찾기 API가 없어 브라우저 세션에만 담습니다.
     API가 생기면 load/save 두 곳만 요청으로 바꾸면 됩니다.
   목록 화면 밖(GNB 배지 등)에서도 개수를 쓸 수 있게 스토어로 뺐습니다. */
const KEY = 'eb.saved'

export const useBookmarkStore = defineStore('bookmark', () => {
  const items = ref(new Set(JSON.parse(sessionStorage.getItem(KEY) || '[]')))

  const count = computed(() => items.value.size)
  const has = (name) => items.value.has(name)

  function toggle(name) {
    const next = new Set(items.value)
    next.has(name) ? next.delete(name) : next.add(name)
    items.value = next
    sessionStorage.setItem(KEY, JSON.stringify([...next]))
    return next.has(name)
  }
  function clear() {
    items.value = new Set()
    sessionStorage.removeItem(KEY)
  }
  return { items, count, has, toggle, clear }
})
