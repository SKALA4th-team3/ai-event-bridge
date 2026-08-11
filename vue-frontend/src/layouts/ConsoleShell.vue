<script setup>
import { computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import BrandMark from '@/components/common/BrandMark.vue'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'
import { useAuthStore } from '@/store/auth.js'

const router = useRouter()
const route = useRoute()
const profile = useProfileStore()
const ui = useUiStore()

const TITLES = { Dashboard: '대시보드', PostingCreate: '공고 등록', ConsoleProfile: '내 정보' }
const title = computed(() => TITLES[route.name] ?? '발주 콘솔')
const org = computed(() => ({
  name: profile.org?.name || '발주 기관',
  dept: profile.org?.dept || '담당 부서',
  manager: profile.org?.manager || '담당자'
}))
const unread = computed(() => ui.notifications.filter((n) => !n.read).length)

const auth = useAuthStore()
function signOut() {
  profile.clear(); auth.logout(false)
  router.push('/login'); ui.toast('로그아웃되었습니다.')
}
</script>

<template>
  <div class="viewport">
    <div class="view" id="console">
      <aside class="cside">
        <button class="cbrand" @click="router.push('/home')"><BrandMark />이벤트브릿지</button>
        <div class="org">
          <div class="n">{{ org.name }}</div>
          <div class="d">{{ org.dept }} · {{ org.manager }}</div>
        </div>
        <nav class="cnav">
          <button :class="{ on: route.name === 'Dashboard' }" @click="router.push('/console')">대시보드</button>
          <button :class="{ on: route.name === 'PostingCreate' }" @click="router.push('/console/postings/new')">공고 등록</button>
          <button :class="{ on: route.name === 'ConsoleProfile' }" @click="router.push('/console/me')">
            내 정보
          </button>
        </nav>
      </aside>

      <div class="cmain">
        <div class="ctop">
          <span class="ttl">{{ title }}</span>
          <span class="right">
            <button class="bell" :data-n="unread || null" @click="ui.openDrawer()">🔔</button>
            <span class="vsep" /><span>{{ org.manager }} 님</span>
            <button class="btn ghost2 cout" @click="signOut">로그아웃</button>
          </span>
        </div>
        <div class="cbody"><RouterView /></div>
      </div>
    </div>
  </div>
</template>
