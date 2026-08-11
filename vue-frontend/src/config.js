/* ============================================================
   런타임 설정 한 곳.
   포트·주소가 코드 여기저기에 흩어지지 않도록 .env 만 바라봅니다.
   이전 변수명(VITE_API_BASE_URL / VITE_AUTH_SERVER_URL)을 쓰는
   .env 도 그대로 동작하도록 순서대로 찾습니다.
   ============================================================ */
const env = import.meta.env

/* .env 가 없어도 실습 기본값으로 돌아갑니다.
   .env 는 저장소에서 무시 대상이라 새로 클론하면 없습니다.
   여기서 예외를 던지면 화면이 통째로 하얗게 떠서, 기본값으로 이어가고 알리기만 합니다. */
const DEFAULT_GATEWAY = 'http://localhost:8080'
const DEFAULT_REDIRECT = 'http://localhost:3000/callback'

const picked = env.VITE_GATEWAY_URL ?? env.VITE_API_BASE_URL ?? env.VITE_AUTH_SERVER_URL ?? ''
export const GATEWAY_URL = (picked || DEFAULT_GATEWAY).replace(/\/+$/, '')

export const CLIENT_ID = env.VITE_CLIENT_ID || 'web-client'
export const CLIENT_SECRET = env.VITE_CLIENT_SECRET || 'web-secret'
export const REDIRECT_URI = env.VITE_REDIRECT_URI || DEFAULT_REDIRECT

if (!picked) {
  console.warn(
    '[config] vue-frontend/.env 가 없어 실습 기본값으로 동작합니다.\n' +
    '         cp vue-frontend/.env.example vue-frontend/.env 로 만들어 두면 이 경고가 사라집니다.\n' +
    `         게이트웨이 ${GATEWAY_URL} · 콜백 ${REDIRECT_URI}`
  )
}
