import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useProfileStore } from '@/store/profile.js'

const routes = [
  /* '/' 를 먼저 잡습니다.
     아래 두 레이아웃이 모두 '/' 로 선언돼 있어, 먼저 오는 인증 레이아웃이
     '/' 를 가져가는데 빈 경로 자식이 없어 폼 자리가 비어 있었습니다.
     (왼쪽 브랜드 패널만 뜨고 오른쪽이 하얗던 증상)

     기관의 일터는 콘솔이라 착지도 콘솔입니다. 로그인 직후뿐 아니라
     주소로 바로 들어와도 같아야 해서 여기서 갈라 줍니다. */
  { path: '/', redirect: () => (useProfileStore().data?.kind === 'gov' ? '/console' : '/home') },

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
      { path: 'postings/new', name: 'PostingCreate',  component: () => import('@/views/console/PostingCreateView.vue') },
      /* 기관의 내 정보는 콘솔 안에 둡니다 — 기관은 공개 화면을 일터로 쓰지 않습니다.
         화면은 업체와 같은 ProfileView 이고, 그 안에서 기관/업체를 가려 그립니다. */
      { path: 'me',           name: 'ConsoleProfile', component: () => import('@/views/public/ProfileView.vue') },
      { path: 'knowledge',    name: 'ConsoleKnowledge', component: () => import('@/views/console/KnowledgeAdminView.vue') }
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
