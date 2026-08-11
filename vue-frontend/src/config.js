/* ============================================================
   런타임 설정 한 곳.
   포트·주소가 코드 여기저기에 흩어지지 않도록 .env 만 바라봅니다.
   이전 변수명(VITE_API_BASE_URL / VITE_AUTH_SERVER_URL)을 쓰는
   .env 도 그대로 동작하도록 순서대로 찾습니다.
   ============================================================ */
const env = import.meta.env

/* .env 가 없어도 뜨게 합니다.
   전에는 값이 비면 예외를 던져, 저장소를 갓 받은 사람은 흰 화면만 봤습니다.
   여기 적은 값은 실습 템플릿의 고정값입니다 (RUN.md 5장 참고) —
   auth-server 이미지에 issuer 와 콜백이 박혀 있어 사실상 바꿀 수 없습니다. */
const DEFAULTS = {
  gateway: 'http://localhost:8080',
  clientId: 'web-client',
  clientSecret: 'web-secret',
  redirectUri: 'http://localhost:3000/callback'
}

const picked = env.VITE_GATEWAY_URL ?? env.VITE_API_BASE_URL ?? env.VITE_AUTH_SERVER_URL ?? ''
export const GATEWAY_URL = (picked || DEFAULTS.gateway).replace(/\/+$/, '')
export const CLIENT_ID = env.VITE_CLIENT_ID || DEFAULTS.clientId
export const CLIENT_SECRET = env.VITE_CLIENT_SECRET || DEFAULTS.clientSecret
export const REDIRECT_URI = env.VITE_REDIRECT_URI || DEFAULTS.redirectUri

if (!picked) {
  console.warn(
    '[config] vue-frontend/.env 가 없어 실습 기본값으로 동작합니다.\n' +
    `  게이트웨이 ${GATEWAY_URL} · 콜백 ${REDIRECT_URI}\n` +
    '  주소를 바꾸려면 .env.example 을 .env 로 복사해 고치세요.'
  )
}
