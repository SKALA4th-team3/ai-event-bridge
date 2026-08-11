<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePostingStore } from '@/store/posting.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'
import { DEMO_VENDOR, DEMO_GOV } from '@/constants/demoData.js'

/* 화면 바로가기 — 흐름을 타지 않고 어떤 화면·상태든 바로 띄웁니다.
   발표와 팀 리뷰용이라 인증 토큰은 건드리지 않고
   프로필만 바꿔 역할 화면을 전환합니다. */
const router = useRouter()
const route = useRoute()
const posting = usePostingStore()
const profile = useProfileStore()
const ui = useUiStore()

const VENDOR = DEMO_VENDOR
const GOV = DEMO_GOV

const firstId = () => posting.scored.find((p) => p.dday !== null)?.id ?? posting.scored[0]?.id ?? 1
const topId = () => [...posting.scored].sort((a, b) => b.bidderCount - a.bidderCount)[0]?.id ?? 1
const firstEvent = () => posting.grouped[0]?.name ?? ''

/* [값, 라벨, 필요한 역할, 경로] */
const SCREENS = [
  ['login',    '인증 · 로그인',               null,     () => '/login'],
  ['signup1',  '인증 · 회원가입 ① 계정',       null,     () => '/signup?stage=1'],
  ['signup2v', '인증 · 회원가입 ② 업체 정보',   null,     () => '/signup?stage=2v'],
  ['signup2g', '인증 · 회원가입 ② 기관 정보',   null,     () => '/signup?stage=2g'],
  ['signup3v', '인증 · 회원가입 ③ 완료(업체)',  null,     () => '/signup?stage=3v'],
  ['signup3g', '인증 · 회원가입 ③ 완료(기관)',  null,     () => '/signup?stage=3g'],

  ['home-v',   '업체 · 홈',                   'vendor', () => '/home'],
  ['list',     '업체 · 카테고리별 (이벤트 카드)', 'vendor', () => '/postings'],
  ['works',    '업체 · 공사 내역 (드릴다운)',   'vendor', () => `/postings?event=${encodeURIComponent(firstEvent())}`],
  ['detail',   '업체 · 공고 상세',             'vendor', () => `/postings/${firstId()}`],
  ['bidding',  '업체 · 지원 금액 입력',        'vendor', () => `/postings/${firstId()}?stage=bidding`],
  ['applying', '업체 · 지원 접수 중 모달',      'vendor', () => `/postings/${firstId()}?stage=applying`],
  ['applied',  '업체 · 접수 완료 모달',         'vendor', () => `/postings/${firstId()}?stage=applied`],
  ['apps',     '업체 · 내 지원 관리',           'vendor', () => '/applications'],

  ['home-g',   '기관 · 홈',                    'gov',    () => '/home'],
  ['dash',     '기관 · 콘솔 대시보드',           'gov',    () => '/console'],
  ['np1',      '기관 · 공고 등록 ① 기본 정보',    'gov',    () => '/console/postings/new?stage=1'],
  ['np2',      '기관 · 공고 등록 ② 과업·요건',    'gov',    () => '/console/postings/new?stage=2'],
  ['bidmodal', '기관 · 지원 업체 선정 모달',      'gov',    () => `/console?open=${topId()}`],
  ['me-g',     '기관 · 내 정보',                'gov',    () => '/console/me'],

  ['me',       '업체 · 내 정보',                'vendor', () => '/me'],
  ['help',     '업체 · 이용 안내',              'vendor', () => '/guide']
]

const role = computed(() => profile.data?.kind ?? 'vendor')
const picked = ref('login')

/* 주소가 바뀌면 선택값을 되짚어 라벨을 맞춥니다 */
watch(() => route.fullPath, () => {
  const stage = route.query.stage
  const hit = SCREENS.find(([, , , path]) => {
    let p; try { p = path() } catch { return false }
    const [base, qs] = p.split('?')
    if (base !== route.path) return false
    return qs ? qs.includes(`stage=${stage}`) : !stage
  })
  if (hit) picked.value = hit[0]
}, { immediate: true })

async function setRole(kind) {
  profile.save(kind === 'gov' ? { ...GOV } : { ...VENDOR })
  await posting.load(true)
  router.push({ path: kind === 'gov' ? '/console' : '/home', query: { preview: '1' } })
}

async function jump(v) {
  const row = SCREENS.find((s) => s[0] === v)
  if (!row) return
  const [, , need, path] = row
  if (v.startsWith('signup') || v === 'login') profile.clear()
  else if (need && profile.data?.kind !== need) profile.save(need === 'gov' ? { ...GOV } : { ...VENDOR })
  await posting.load()
  const [p, qs] = path().split('?')
  router.push({ path: p, query: { ...Object.fromEntries(new URLSearchParams(qs)), preview: '1' } })
}

/* 드로어는 알림이 쌓여야 화면이 판단되므로, 비어 있으면 예시를 채웁니다 */
const DEMO_NOTI = {
  vendor: [['이천 쌀문화축제 — 선정되었습니다', '체험 부스 20동 설치 · 5,900만원', '2시간 전'],
           ['마감 임박 — 축제 부스 운영 및 관리', '진주 남강유등축제 · D-2', '어제'],
           ['새 공고 3건이 등록되었습니다', '업종 ‘부스 설치’ · 경상 지역', '2일 전']],
  gov:    [['신규 지원 2건', '축제 부스 운영 및 관리', '1시간 전'],
           ['홍보물 제작·배포 — 선정 필요', '마감 3일 경과 · 지원 5개사', '어제'],
           ['행사장 안전인력 — 지원 저조', 'D-2인데 2개사만 지원', '어제']]
}
function openDrawer() {
  if (!ui.notifications.length) {
    ;[...DEMO_NOTI[role.value] ?? DEMO_NOTI.vendor].reverse()
      .forEach(([t, s2, at]) => { ui.notify(t, s2); ui.notifications[0].at = at })
  }
  ui.openDrawer()
}

const label = computed(() => SCREENS.find((s) => s[0] === picked.value)?.[1] ?? '—')
function hide() { sessionStorage.setItem('eb.preview', 'off'); location.reload() }
</script>

<template>
  <div class="pbar">
    <span class="tag">SCREEN</span><span class="now">{{ label }}</span>
    <span v-if="posting.usingDemo" class="tag" style="color:#F0A35A">시연 데이터</span>
    <span class="tag">ROLE</span>
    <div class="grp">
      <button :aria-pressed="role === 'vendor'" @click="setRole('vendor')">업체</button>
      <button :aria-pressed="role === 'gov'" @click="setRole('gov')">기관</button>
    </div>
    <button class="x" @click="openDrawer()">알림 드로어</button>
    <div class="jump">
      <select v-model="picked" aria-label="화면 바로가기" @change="jump(picked)">
        <option v-for="s in SCREENS" :key="s[0]" :value="s[0]">{{ s[1] }}</option>
      </select>
      <button class="x" title="미리보기 바 숨기기 (Ctrl+`로 다시 열기)" @click="hide">✕</button>
    </div>
  </div>
</template>
