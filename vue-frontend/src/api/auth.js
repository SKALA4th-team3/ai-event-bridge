import api from './index.js'
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from '@/config.js'

export const authApi = {
  /* Authorization Code → Access Token 교환.
     상대 경로라 개발에서는 vite 프록시, 운영에서는 nginx가
     게이트웨이로 넘깁니다. 같은 출처를 쓰므로 CORS가 끼어들지 않습니다. */
  exchangeCode(code) {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    })

    return api.post('/oauth2/token', body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // CLIENT_SECRET_BASIC — client_id:client_secret 을 Base64로
        Authorization: `Basic ${credentials}`
      }
    })
  },

  getMe() {
    return api.get('/api/users/me')
  },

  register(data) {
    return api.post('/api/users/register', data)
  }
}
