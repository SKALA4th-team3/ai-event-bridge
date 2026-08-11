import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'
import { GATEWAY_URL, CLIENT_ID, REDIRECT_URI } from '@/config.js'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('access_token') || null)
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isInstructor = computed(() => user.value?.role === 'INSTRUCTOR')

  function setToken(token) {
    accessToken.value = token
    sessionStorage.setItem('access_token', token)
  }

  function setUser(userData) {
    user.value = userData
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  async function fetchUser() {
    try {
      const res = await authApi.getMe()
      console.log('[AuthStore] /me response =', res.data)

      const userData = res?.data?.data ?? res?.data

      if (!userData || typeof userData !== 'object') {
        throw new Error('사용자 정보 형식이 올바르지 않습니다.')
      }

      setUser(userData)
    } catch (error) {
      console.error('[AuthStore] 사용자 정보 조회 실패:', error)
      logout(false)
    }
  }

  /* 우리 토큰만 지우면 인증 서버 세션(JSESSIONID)이 그대로 남습니다.
     그 상태로 /oauth2/authorize 를 타면 로그인 화면 없이 곧바로
     '직전 계정'의 코드가 나옵니다 — 기관으로 로그아웃한 뒤 업체 이메일을
     넣어도 기관으로 되돌아오는 이유였습니다.

     인증 서버에도 로그아웃을 알려 세션을 끊습니다.
     같은 출처(/authsrv)로 부르므로 쿠키가 함께 나갑니다. */
  async function endAuthServerSession() {
    try { await fetch('/authsrv/logout', { credentials: 'same-origin' }) } catch { /* 백엔드가 없어도 진행합니다 */ }
  }

  async function logout(redirect = true) {
    accessToken.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')

    await endAuthServerSession()

    if (redirect) {
      window.location.href = '/login'
    }
  }

  // OAuth2 Authorization Code Flow
  function redirectToLogin() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'openid profile read write'
    })

    /* 브라우저가 SPA를 떠나므로 절대 주소여야 합니다.
       게이트웨이(8080)가 /oauth2/**, /login 을 auth-server로 넘겨 줍니다. */
    window.location.href = `${GATEWAY_URL}/oauth2/authorize?${params.toString()}`
  }

  /* 우리 화면에서 받은 자격 증명으로 곧장 로그인합니다.

     실습 백엔드에는 비밀번호를 받는 API가 없지만,
     인증 서버의 폼 로그인(POST /login)은 CSRF 토큰 없이 받습니다.
     세션 쿠키만 생기면 /oauth2/authorize 가 바로 코드를 내주므로,
     인증 서버 화면에서 같은 계정을 한 번 더 입력할 이유가 없습니다.

     · vite 프록시(/authsrv)를 거쳐 같은 출처로 부릅니다 — CORS 없이 쿠키가 붙습니다.
     · 쿠키는 포트를 가리지 않아 localhost:8080 요청에도 함께 나갑니다.
     · 성공하면 '/', 실패하면 '/login?error' 로 끝납니다.

     프록시가 없는 환경(빌드 산출물 등)에서는 false 를 돌려주고,
     호출한 쪽이 기존 방식(인증 서버 화면으로 이동)으로 넘어갑니다. */
  async function passwordLogin(email, password) {
    let res
    try {
      res = await fetch('/authsrv/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
        credentials: 'same-origin'
      })
    } catch {
      return { ok: false, reachable: false }
    }
    if (!res.ok && res.status >= 500) return { ok: false, reachable: false }
    /* 인증 서버가 아니라 SPA 의 index.html 이 돌아왔다면 통로가 없는 것입니다 */
    const isAuthServer = /\/login|\/$/.test(new URL(res.url).pathname) &&
                         !res.headers.get('content-type')?.includes('javascript')
    if (!isAuthServer) return { ok: false, reachable: false }
    return { ok: !new URL(res.url).search.includes('error'), reachable: true }
  }

  async function handleCallback(code) {
    const res = await authApi.exchangeCode(code)
    console.log('[AuthStore] token response =', res.data)

    const token = res?.data?.access_token

    if (!token) {
      throw new Error('액세스 토큰을 받지 못했습니다.')
    }

    setToken(token)
    await fetchUser()
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isInstructor,
    setToken,
    setUser,
    fetchUser,
    logout,
    redirectToLogin,
    passwordLogin,
    handleCallback
  }
})