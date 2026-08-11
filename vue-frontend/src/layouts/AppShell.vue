<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import BrandMark from '@/components/common/BrandMark.vue'
import { useAuthStore } from '@/store/auth.js'
import { useProfileStore } from '@/store/profile.js'
import { useSeasonStore } from '@/store/season.js'
import { useUiStore } from '@/store/ui.js'
import { DEMO_VENDOR, offlinePreview } from '@/constants/demoData.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const profile = useProfileStore()
const season = useSeasonStore()
const ui = useUiStore()

/* 미리보기 딥링크로 바로 들어오면 프로필이 없어 적합도·업체명이 비어 보입니다.
   시연 업체로 채워 화면이 온전히 보이게 합니다. */
onMounted(() => { if (offlinePreview() && !profile.data) profile.save({ ...DEMO_VENDOR }) })

const isGov = computed(() => profile.data?.kind === 'gov')
const name = computed(() => profile.data?.name || auth.user?.name || '게스트')
const initial = computed(() => name.value.replace(/[()주]/g, '').charAt(0))
const unread = computed(() => ui.notifications.filter((n) => !n.read).length)

const NAV = computed(() =>
  isGov.value
    ? [['Home', '공고 찾기'], ['PostingList', '카테고리별'], ['Guide', '이용 안내']]
    : [['Home', '공고 찾기'], ['PostingList', '카테고리별'], ['MyApplications', '내 지원'], ['Guide', '이용 안내']]
)
const active = (n) => route.name === n || (n === 'PostingList' && route.name === 'PostingDetail')

function signOut() {
  profile.clear(); auth.logout(false)
  router.push('/login'); ui.toast('로그아웃되었습니다.')
}
function pickSeason(s) {
  season.set(s.key)
  ui.toast(`${s.label} 시즌 발주 현황입니다.`, 'info', 'season')
}
</script>

<template>
  <div class="gnb">
    <button class="logo" @click="router.push('/home')"><BrandMark />이벤트브릿지</button>
    <nav>
      <button v-for="n in NAV" :key="n[0]" :class="{ on: active(n[0]) }"
              @click="router.push({ name: n[0] })">{{ n[1] }}</button>
    </nav>
    <div class="right">
      <div class="gs">
        <span class="gs-label">시즌</span>
        <div class="sb-group" role="group" aria-label="시즌 선택">
          <button v-for="s in season.seasons" :key="s.key" type="button"
                  :aria-pressed="season.current === s.key" @click="pickSeason(s)">{{ s.label }}</button>
        </div>
      </div>
      <span class="vsep" />
      <span class="acct" :class="{ v: !isGov }">
        <button class="bell" :data-n="unread || null" @click="ui.openDrawer()">🔔</button>
        <span class="av">{{ initial }}</span>
        <button class="who" @click="router.push('/me')" title="내 정보">{{ name.replace('(주)', '') }}</button>
        <button class="out" @click="signOut">로그아웃</button>
      </span>
    </div>
  </div>

  <div class="viewport"><RouterView /></div>
</template>
