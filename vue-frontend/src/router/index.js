import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useProfileStore } from '@/store/profile.js'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AuthShell.vue'),
    meta: { guestOnly: true },
    children: [
      { path: 'login',  name: 'Login',  component: () => import('@/views/auth/LoginView.vue') },
      { path: 'signup', name: 'Signup', component: () => import('@/views/auth/SignupView.vue') }
    ]
  },
  { path: '/callback', name: 'Callback', component: () => import('@/views/auth/CallbackView.vue') },

  {
    path: '/',
    component: () => import('@/layouts/AppShell.vue'),
    meta: { requiresSession: true },
    children: [
      { path: '', redirect: '/home' },
      { path: 'home',         name: 'Home',           component: () => import('@/views/public/HomeView.vue') },
      { path: 'postings',     name: 'PostingList',    component: () => import('@/views/public/PostingListView.vue') },
      { path: 'postings/:id', name: 'PostingDetail',  component: () => import('@/views/public/PostingDetailView.vue') },
      { path: 'applications', name: 'MyApplications', component: () => import('@/views/public/MyApplicationsView.vue') },
      { path: 'guide',        name: 'Guide',          component: () => import('@/views/public/GuideView.vue') },
      { path: 'me',           name: 'Profile',        component: () => import('@/views/public/ProfileView.vue') }
    ]
  },

  /* 발주 콘솔은 어두운 사이드바를 쓰는 별도 셸입니다 */
  {
    path: '/console',
    component: () => import('@/layouts/ConsoleShell.vue'),
    meta: { requiresSession: true, govOnly: true },
    children: [
      { path: '',                     name: 'Dashboard',     component: () => import('@/views/console/DashboardView.vue') },
      { path: 'postings/new',         name: 'PostingCreate', component: () => import('@/views/console/PostingCreateView.vue') },
      { path: 'postings/:id/bidders', name: 'Bidders',       component: () => import('@/views/console/BiddersView.vue') }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/home' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  /* 미리보기 바로 이동한 경우 — 로그인·역할 가드를 건너뜁니다.
     주소에 preview=1이 남으므로 우회 여부가 눈에 보입니다. */
  if (to.query.preview === '1') return

  const auth = useAuthStore()
  const profile = useProfileStore()
  const hasSession = auth.isAuthenticated || !!profile.data

  if (to.matched.some((r) => r.meta.requiresSession) && !hasSession) return { name: 'Login' }

  /* 되돌리는 기준은 실제 토큰입니다.
     토큰 없이 프로필만 남은 상태까지 막으면 로그인으로 돌아갈 길이 없어집니다. */
  if (to.matched.some((r) => r.meta.guestOnly) && auth.isAuthenticated) {
    return profile.data?.kind === 'gov' ? { name: 'Dashboard' } : { name: 'Home' }
  }
  if (to.matched.some((r) => r.meta.govOnly) && profile.data?.kind !== 'gov') return { name: 'Home' }
})

export default router
