<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wonShort, dateShort } from '@/composables/useFormat.js'
import { bidStatus } from '@/constants/status.js'
import { useApplicationStore } from '@/store/application.js'
import { usePostingStore } from '@/store/posting.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const application = useApplicationStore()
const posting = usePostingStore()
const profile = useProfileStore()
const ui = useUiStore()

onMounted(async () => { await posting.load(); await application.load() })

const rows = computed(() => application.rows)
/* 백엔드 3상태 → 명세 지원 상태로 옮겨 표시합니다 */
const cls = (s) => bidStatus(s).tone
const label = (s) => bidStatus(s).label
const orgShort = (o) => (o ?? '').split(' ').pop()

async function refresh() {
  await application.load()
  ui.toast('최신 상태로 새로고침했습니다.')
}
</script>

<template>
  <div class="view" id="apps">
    <div class="ahead">
      <h2>내 지원 관리</h2>
      <span style="font-family:var(--f-mono);font-size:.77em;color:var(--tx2)">
        {{ profile.firm?.name ?? '우리 업체' }} · 총 <b style="color:var(--brand)">{{ rows.length }}</b>건
      </span>
      <span style="margin-left:auto"><button class="btn sec" @click="refresh">새로고침</button></span>
    </div>

    <div class="abody">
      <div class="atable">
        <template v-if="rows.length">
          <div class="arow hd">
            <span>공고</span><span>발주 기관</span><span>예산</span><span>지원일</span><span>상태</span><span></span>
          </div>
          <div v-for="a in rows" :key="a.id" class="arow"
               :style="a.status === 'CANCELLED' ? 'opacity:.55' : ''">
            <span class="anm">
              {{ a.posting?.name ?? `공고 #${a.postingId}` }}
              <small>{{ a.posting?.eventName }}</small>
            </span>
            <span style="color:var(--tx2);font-size:calc(var(--u)*.8)">{{ orgShort(a.posting?.orgName) }}</span>
            <span class="mono" style="font-weight:700;text-align:right">{{ a.posting ? wonShort(a.posting.budget) : '—' }}</span>
            <span class="mono" style="color:var(--tx2)">{{ dateShort(a.appliedAt) }}</span>
            <span><span class="badge" :class="cls(a.status)">{{ label(a.status) }}</span></span>
            <span>
              <button v-if="a.status === 'PENDING'" class="btn ghost2"
                      @click="ui.toast('접수된 입찰서는 취소할 수 없습니다.', 'bad')">지원 취소</button>
            </span>
          </div>
        </template>
        <div v-else class="empty">
          <span class="big">📄</span><b>아직 지원한 공고가 없습니다</b>
          업종에 맞는 공고를 찾아 지원해 보세요.<br><br>
          <button class="btn pri" @click="router.push('/postings')">공고 둘러보기</button>
        </div>
      </div>
      <p style="margin:0;font-size:.75em;color:var(--tx3)">
        서류 검토 단계에서는 발주 기관이 자격요건과 제출 서류를 확인합니다. 결과는 마감 후 영업일 5일 이내 알림으로 전달됩니다.
      </p>
    </div>
  </div>
</template>
