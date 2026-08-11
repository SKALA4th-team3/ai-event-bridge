/* ============================================================
   런타임 설정 한 곳.
   포트·주소가 코드 여기저기에 흩어지지 않도록 .env 만 바라봅니다.
   이전 변수명(VITE_API_BASE_URL / VITE_AUTH_SERVER_URL)을 쓰는
   .env 도 그대로 동작하도록 순서대로 찾습니다.
   ============================================================ */
const env = import.meta.env

export const GATEWAY_URL = (
  env.VITE_GATEWAY_URL ?? env.VITE_API_BASE_URL ?? env.VITE_AUTH_SERVER_URL ?? ''
).replace(/\/+$/, '')

export const CLIENT_ID = env.VITE_CLIENT_ID
export const CLIENT_SECRET = env.VITE_CLIENT_SECRET
export const REDIRECT_URI = env.VITE_REDIRECT_URI

/* 값이 비면 로그인 단계에서야 알 수 있어, 시작할 때 바로 알립니다 */
if (!GATEWAY_URL) {
  throw new Error('[config] VITE_GATEWAY_URL 이 비어 있습니다. vue-frontend/.env 를 확인해 주세요.')
}
if (!CLIENT_ID || !REDIRECT_URI) {
  console.warn('[config] VITE_CLIENT_ID 또는 VITE_REDIRECT_URI 가 비어 있습니다.')
}
