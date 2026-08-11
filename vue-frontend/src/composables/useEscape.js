import { onMounted, onUnmounted } from 'vue'

/* Esc 로 덮개를 닫습니다.
   프로토타입에는 있었는데 Vue 로 옮기면서 빠져 있었습니다.
   모달·드로어가 열렸을 때 빠져나갈 길이 마우스뿐이면
   키보드만 쓰는 사람은 갇힙니다. */
export function onEscape(handler) {
  const onKey = (e) => { if (e.key === 'Escape') handler(e) }
  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
