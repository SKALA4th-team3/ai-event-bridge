<script setup>
import { computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import BrandMark from '@/components/common/BrandMark.vue'
import { useProfileStore } from '@/store/profile.js'
import { usePostingStore } from '@/store/posting.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const route = useRoute()
const profile = useProfileStore()
const posting = usePostingStore()
const ui = useUiStore()

const TITLES = { Dashboard: '대시보드', PostingCreate: '공고 등록', Bidders: '지원 업체 · AI 추천' }
const title = computed(() => TITLES[route.name] ?? '발주 콘솔')
const org = computed(() => ({
  name: profile.org?.name || '발주 기관',
  dept: profile.org?.dept || '담당 부서',
  manager: profile.org?.manager || '담당자'
}))
const bidTotal = computed(() => posting.consoleRows.reduce((s, p) => s + p.bidderCount, 0))
const unread = computed(() => ui.notifications.filter((n) => !n.read).length)

/* 지원 업체 화면은 공고 단위라, 지원이 가장 많은 공고를 기본으로 엽니다 */
function openBidders() {
  const top = [...posting.consoleRows].sort((a, b) => b.bidderCount - a.bidderCount)[0]
  if (top) router.push(`/console/postings/${top.id}/bidders`)
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
          <button :class="{ on: route.name === 'Bidders' }" @click="openBidders()">
            지원 업체 <span class="n">{{ bidTotal }}</span>
          </button>
          <!-- 공개 화면은 기관에게 '업체 찾기'입니다. 콘솔에서 들어가게 둡니다. -->
          <button class="sub" @click="router.push('/home')">업체 찾기</button>
        </nav>
        <div class="cback"><button @click="router.push('/home')">← 공개 화면으로</button></div>
      </aside>

      <div class="cmain">
        <div class="ctop">
          <span class="ttl">{{ title }}</span>
          <span class="right">
            <button class="bell" :data-n="unread || null" @click="ui.openDrawer()">🔔</button>
            <span class="vsep" /><span>{{ org.manager }} 님</span>
          </span>
        </div>
        <div class="cbody"><RouterView /></div>
      </div>
    </div>
  </div>
</template>
