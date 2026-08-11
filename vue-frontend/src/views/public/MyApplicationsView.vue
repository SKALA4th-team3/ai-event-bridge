<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wonShort, dateShort, isUrgent } from '@/composables/useFormat.js'
import { bidStatus } from '@/constants/status.js'
import { useApplicationStore } from '@/store/application.js'
import { usePostingStore } from '@/store/posting.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'
import { onEscape } from '@/composables/useEscape.js'

const router = useRouter()
const application = useApplicationStore()
const posting = usePostingStore()
const profile = useProfileStore()
const ui = useUiStore()

onMounted(async () => { await posting.load(); await application.load() })

/* 상태별로 나눠 봅니다 — 무엇이 아직 결과를 기다리는지가 가장 궁금합니다 */
const TABS = [
  { key: 'ALL',       label: '전체' },
  { key: 'PENDING',   label: '심사 중' },
  { key: 'ACTIVE',    label: '선정' },
  { key: 'CANCELLED', label: '미선정' }
]
const tab = ref('ALL')
const all = computed(() => application.rows)
const rows = computed(() => all.value.filter((a) => tab.value === 'ALL' || a.status === tab.value))
const countOf = (k) => (k === 'ALL' ? all.value.length : all.value.filter((a) => a.status === k).length)
const rate = computed(() => {
  const judged = all.value.filter((a) => a.status !== 'PENDING').length
  return judged ? Math.round((application.selected / judged) * 100) : 0
})
const orgShort = (o) => (o ?? '').split(' ').pop()

async function refresh() { await application.load(); ui.toast('최신 상태로 새로고침했습니다.') }

/* ── 신청 수정 — 제출 서류만 다시 올립니다 ────────────────────
   금액·내용 수정은 공고 조건이 바뀌는 셈이라 열지 않습니다.
   ★ 서류 교체 API가 없어 지금은 파일명만 갱신합니다. */
const OK_EXT = ['pdf', 'hwp', 'hwpx', 'doc', 'docx', 'zip']
const MAX_MB = 20
const editing = ref(null)
const newFile = ref(null)
const fileErr = ref('')
const dragging = ref(false)
const sizeText = (b) => (b < 1048576 ? `${Math.round(b / 1024)}KB` : `${(b / 1048576).toFixed(1)}MB`)

function openEdit(a) { editing.value = a; newFile.value = null; fileErr.value = '' }
function pick(f) {
  if (!f) return
  const ext = f.name.split('.').pop()?.toLowerCase()
  if (!OK_EXT.includes(ext)) return (fileErr.value = `${OK_EXT.join(', ')} 파일만 올릴 수 있습니다.`)
  if (f.size > MAX_MB * 1048576) return (fileErr.value = `${MAX_MB}MB 이하만 올릴 수 있습니다.`)
  fileErr.value = ''; newFile.value = f
}
function saveEdit() {
  if (!newFile.value) return (fileErr.value = '새 서류를 첨부해 주세요.')
  editing.value.proposal = newFile.value.name
  ui.toast('제출 서류를 교체했습니다.', 'good')
  editing.value = null
}

/* ── 신청 취소 ─────────────────────────────────────────────
   ★ DELETE /api/enrollments/{id} 가 없어 목록에서만 내립니다. */
const canceling = ref(null)
function doCancel() {
  const a = canceling.value
  a.status = 'CANCELLED'
  a.withdrawn = true
  ui.notify('지원을 취소했습니다', a.posting?.name ?? `공고 #${a.postingId}`)
  ui.toast('지원을 취소했습니다.')
  canceling.value = null
}

/* Esc 로 닫습니다 */
onEscape(() => { editing.value = null; canceling.value = null })
</script>

<template>
  <div class="view" id="apps">
    <div class="ahead">
      <h2>내 지원 관리</h2>
      <span style="font-family:var(--f-mono);font-size:.77em;color:var(--tx2)">
        {{ profile.firm?.name ?? '우리 업체' }} · 총 <b style="color:var(--brand)">{{ all.length }}</b>건
      </span>
      <span style="margin-left:auto"><button class="btn sec" @click="refresh">새로고침</button></span>
    </div>

    <div class="abody">
      <div class="kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:0">
        <div class="kpi"><div class="l">전체 지원</div><div class="v">{{ all.length }}<span>건</span></div></div>
        <div class="kpi alert"><div class="l">심사 중</div><div class="v">{{ application.reviewing }}<span>건</span></div><div class="d">결과 통보 전</div></div>
        <div class="kpi"><div class="l">선정</div><div class="v">{{ application.selected }}<span>건</span></div></div>
        <div class="kpi"><div class="l">선정률</div><div class="v">{{ rate }}<span>%</span></div><div class="d">심사 완료 건 기준</div></div>
      </div>

      <div class="atabs">
        <button v-for="t in TABS" :key="t.key" :class="{ on: tab === t.key }" @click="tab = t.key">
          {{ t.label }}<em>{{ countOf(t.key) }}</em>
        </button>
      </div>

      <div class="atable">
        <template v-if="rows.length">
          <div class="arow hd">
            <span>공고</span><span>발주 기관</span><span>예산</span><span>지원일 · 마감</span><span>제출 서류</span><span>상태</span><span></span>
          </div>
          <div v-for="a in rows" :key="a.id" class="arow" :style="a.status === 'CANCELLED' ? 'opacity:.6' : ''">
            <span class="anm">
              {{ a.posting?.name ?? `공고 #${a.postingId}` }}
              <small>{{ a.posting?.eventName }}</small>
            </span>
            <span style="color:var(--tx2);font-size:calc(var(--u)*.8)">{{ orgShort(a.posting?.orgName) }}</span>
            <span class="mono" style="font-weight:700;text-align:right">{{ a.posting ? wonShort(a.posting.budget) : '—' }}</span>
            <span class="adate">
              <span class="mono">{{ dateShort(a.appliedAt) }}</span>
              <small v-if="a.posting" :class="{ hot: isUrgent(a.posting.dday) }">
                {{ a.posting.dday === null ? '접수 마감 · 심사 중' : `마감 D-${a.posting.dday}` }}
              </small>
            </span>
            <span class="doc" :title="a.proposal ?? ''">{{ a.proposal ?? '—' }}</span>
            <span><span class="badge" :class="bidStatus(a.status).tone">{{ a.withdrawn ? '지원 취소' : bidStatus(a.status).label }}</span></span>
            <span class="rowact">
              <template v-if="a.status === 'PENDING'">
                <button class="btn sec" @click="openEdit(a)">수정</button>
                <button class="btn ghost2" @click="canceling = a">취소</button>
              </template>
            </span>
          </div>
        </template>
        <div v-else class="empty">
          <span class="big">📄</span><b>{{ tab === 'ALL' ? '아직 지원한 공고가 없습니다' : '해당하는 지원이 없습니다' }}</b>
          업종에 맞는 공고를 찾아 지원해 보세요.<br><br>
          <button class="btn pri" @click="router.push('/postings')">공고 둘러보기</button>
        </div>
      </div>
      <p style="margin:0;font-size:.75em;color:var(--tx3)">
        심사 중 단계에서만 수정·취소할 수 있습니다. 수정은 <b>제출 서류 교체</b>만 가능하며,
        지원 금액과 내용은 공고 조건이 달라지므로 바꿀 수 없습니다.
      </p>
    </div>

    <!-- 서류 재업로드 -->
    <div v-if="editing" class="ovl" role="dialog" aria-modal="true" @click.self="editing = null">
      <div class="ovlcard">
        <h3>제출 서류 교체</h3>
        <p class="p">{{ editing.posting?.eventName }} · {{ editing.posting?.name }}</p>

        <div class="field" style="text-align:left" :class="{ bad: fileErr }">
          <label>현재 서류</label>
          <div class="picked" style="background:var(--band2);border-color:var(--line)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" style="color:var(--tx3)">
              <path d="M14 3v5h5" /><path d="M19 8v11.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3H14z" />
            </svg>
            <span class="pf"><b>{{ editing.proposal ?? '첨부 없음' }}</b></span>
          </div>

          <label style="margin-top:.8em">새 서류 <span class="req">*</span></label>
          <label v-if="!newFile" class="drop" :class="{ over: dragging }"
                 @dragover.prevent="dragging = true" @dragleave="dragging = false"
                 @drop.prevent="dragging = false; pick($event.dataTransfer?.files?.[0])">
            <input type="file" :accept="OK_EXT.map(e => '.' + e).join(',')" @change="pick($event.target.files[0])">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
              <path d="M12 16V4M8 8l4-4 4 4" /><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
            </svg>
            <b>파일을 끌어다 놓거나 눌러서 선택</b>
            <span>{{ OK_EXT.join(' · ') }} · 최대 {{ MAX_MB }}MB</span>
          </label>
          <div v-else class="picked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round">
              <path d="M14 3v5h5" /><path d="M19 8v11.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3H14z" />
            </svg>
            <span class="pf"><b>{{ newFile.name }}</b><em>{{ sizeText(newFile.size) }}</em></span>
            <button type="button" class="pdel" aria-label="첨부 제거" @click="newFile = null">✕</button>
          </div>
          <span class="err">⚠ <span class="msg">{{ fileErr }}</span></span>
        </div>

        <div class="ovlacts">
          <button class="btn sec" @click="editing = null">취소</button>
          <button class="btn pri" @click="saveEdit">서류 교체</button>
        </div>
      </div>
    </div>

    <!-- 지원 취소 확인 -->
    <div v-if="canceling" class="ovl" role="dialog" aria-modal="true" @click.self="canceling = null">
      <div class="ovlcard">
        <h3>지원을 취소하시겠어요?</h3>
        <p class="p">{{ canceling.posting?.eventName }} · {{ canceling.posting?.name }}</p>
        <div class="ovlnote">
          취소하면 심사 대상에서 빠집니다. <b>같은 공고에 다시 지원할 수 없습니다.</b>
        </div>
        <div class="ovlacts">
          <button class="btn sec" @click="canceling = null">되돌아가기</button>
          <button class="btn pri" @click="doCancel">지원 취소</button>
        </div>
      </div>
    </div>
  </div>
</template>
