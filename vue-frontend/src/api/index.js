import axios from 'axios'
import { useAuthStore } from '@/store/auth.js'
import { isPreview } from '@/lib/preview.js'

const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  /* 이미 지정된 Authorization 은 덮지 않습니다.
     토큰 교환은 Basic(client_id:secret) 을 쓰는데, 예전 토큰이 남아 있으면
     Bearer 로 덮여 로그인이 실패합니다. */
  if (auth.accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    /* 토큰이 없거나 만료되면 세션을 비우고 로그인 화면으로 돌립니다.
       화면을 빈 목록으로 두면 "공고가 없다"로 잘못 읽히기 때문입니다. */
    /* 미리보기 중에는 시연 데이터로 화면을 채우므로 리다이렉트하지 않습니다 */
    if (err.response?.status === 401 && !isPreview() && !location.pathname.startsWith('/login')) {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('eb.profile')
      location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api