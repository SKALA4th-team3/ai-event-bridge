import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  /* 게이트웨이 주소는 .env 한 곳에서만 옵니다.
     예전 변수명을 쓰는 .env 도 그대로 동작하도록 순서대로 찾습니다. */
  const gateway = (env.VITE_GATEWAY_URL || env.VITE_API_BASE_URL || env.VITE_AUTH_SERVER_URL
                   || 'http://localhost:8080').replace(/\/+$/, '')

  /* 개발 서버 포트는 콜백 주소에서 가져옵니다.
     auth-server 에 http://localhost:3000/callback 이 하드코딩되어 있어
     이 둘이 어긋나면 로그인이 redirect_uri_mismatch 로 실패합니다. */
  const redirect = env.VITE_REDIRECT_URI || 'http://localhost:3000/callback'
  const port = Number(new URL(redirect).port || 80)

  const proxy = (path) => [path, { target: gateway, changeOrigin: true, secure: false }]

  return {
    plugins: [vue()],
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    server: {
      host: 'localhost',
      port,
      strictPort: true,
      proxy: Object.fromEntries([
        proxy('/api'),
        /* 토큰 교환·JWKS 용. /login·/logout 은 프록시하지 않습니다 —
           SPA의 로그인 화면 경로와 겹쳐 인증 서버 기본 폼이 대신 뜹니다.
           인증 서버로의 이동은 절대 주소(게이트웨이)로 합니다. */
        proxy('/oauth2'),
        proxy('/userinfo')
      ])
    }
  }
})
