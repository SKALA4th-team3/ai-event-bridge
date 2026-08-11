<script setup>
/* 접수 → 검증 → 확정. enrollment→payment→enrollment Kafka 왕복이 비동기라
   "대기"가 실제로 존재하고, 그 공백을 숨기지 않고 단계로 드러냅니다. */
import { ref, computed, watch } from 'vue'
import { won } from '@/composables/useFormat.js'
import { onEscape } from '@/composables/useEscape.js'

const props = defineProps({
  state: { type: Number, default: 0 },   // 0 닫힘 · 1 금액 입력 · 2 접수 중 · 3 완료 · -1 실패
  posting: Object,
  message: String
})
const emit = defineEmits(['close', 'apps', 'retry', 'submit'])

/* 지원 금액 — 명세의 bidAmount 입니다.
   ★ 백엔드 EnrollRequest 에 필드가 없어 지금은 화면에만 남습니다.
     enrollments 에 bid_amount 가 생기면 api/application.js 에서 함께 보내면 됩니다. */
const amount = ref('')
const err = ref('')
const budget = computed(() => props.posting?.budget ?? 0)
/* 제안서 — 명세의 '제안서 파일'에 해당합니다.
   ★ 백엔드에 업로드 엔드포인트가 없어 지금은 파일을 고르고 확인만 합니다.
     POST /api/bids/{id}/proposal 이 생기면 submit에서 함께 보내면 됩니다. */
const OK_EXT = ['pdf', 'hwp', 'hwpx', 'doc', 'docx', 'zip']
const MAX_MB = 20
const file = ref(null)
const fileErr = ref('')
const dragging = ref(false)
const picker = ref(null)

const sizeText = (b) => (b < 1024 * 1024 ? `${Math.round(b / 1024)}KB` : `${(b / 1048576).toFixed(1)}MB`)

function pick(f) {
  if (!f) return
  const ext = f.name.split('.').pop()?.toLowerCase()
  if (!OK_EXT.includes(ext)) {
    fileErr.value = `${OK_EXT.join(', ')} 파일만 올릴 수 있습니다.`; return
  }
  if (f.size > MAX_MB * 1048576) {
    fileErr.value = `${MAX_MB}MB 이하만 올릴 수 있습니다. (선택한 파일 ${sizeText(f.size)})`; return
  }
  fileErr.value = ''
  file.value = f
}
const onDrop = (e) => { dragging.value = false; pick(e.dataTransfer?.files?.[0]) }
const clearFile = () => { file.value = null; fileErr.value = ''; if (picker.value) picker.value.value = '' }

/* 공고가 늦게 로드되는 딥링크도 있어 둘 다 지켜봅니다.
   clearFile 을 쓰므로 선언 뒤에 두어야 합니다 (const 는 끌어올려지지 않습니다). */
watch([() => props.state, budget], ([v, b]) => {
  if (v === 1 && b && !amount.value) { amount.value = String(b); err.value = '' }
  if (v !== 1) { amount.value = ''; clearFile() }
}, { immediate: true })

function submit() {
  const n = Number(String(amount.value).replace(/[,\s]/g, ''))
  if (!n || Number.isNaN(n)) return (err.value = '지원 금액을 입력해 주세요.')
  if (n > budget.value) return (err.value = `추정 예산(${won(budget.value)})을 넘을 수 없습니다.`)
  if (n < budget.value * 0.5) return (err.value = '예산의 50% 미만은 적격심사에서 제외될 수 있습니다.')
  if (!file.value) return (fileErr.value = '제안서를 첨부해 주세요.')
  err.value = ''
  emit('submit', { amount: n, proposal: file.value })
}

/* Esc 로 닫습니다 */
onEscape(() => { if (props.state !== 0) emit('close') })
</script>

<template>
  <div v-if="state !== 0" class="ovl" role="dialog" aria-modal="true">
    <div class="ovlcard">
      <template v-if="state === 1">
        <h3>지원 금액을 입력해 주세요</h3>
        <p class="p">{{ posting?.eventName }} · {{ posting?.name }}</p>
        <div class="field" :class="{ bad: err }" style="text-align:left">
          <label>지원 금액 (원) <span class="req">*</span></label>
          <div class="inwrap">
            <input v-model="amount" inputmode="numeric" style="font-family:var(--f-mono)"
                   @keyup.enter="submit">
          </div>
          <span class="hint">추정 예산 {{ won(budget) }} 이하로 적어 주세요</span>
          <span class="err">⚠ <span class="msg">{{ err }}</span></span>
        </div>

        <div class="field" :class="{ bad: fileErr }" style="text-align:left">
          <label>제안서 <span class="req">*</span></label>

          <label v-if="!file" class="drop" :class="{ over: dragging }"
                 @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
            <input ref="picker" type="file" :accept="OK_EXT.map(e => '.' + e).join(',')"
                   @change="pick($event.target.files[0])">
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
            <span class="pf">
              <b>{{ file.name }}</b>
              <em>{{ sizeText(file.size) }}</em>
            </span>
            <button type="button" class="pdel" aria-label="첨부 제거" @click="clearFile">✕</button>
          </div>

          <span class="hint">과업 수행 계획과 견적 근거를 담아 주세요</span>
          <span class="err">⚠ <span class="msg">{{ fileErr }}</span></span>
        </div>
        <div class="ovlacts">
          <button class="btn sec" @click="emit('close')">취소</button>
          <button class="btn pri" @click="submit">지원서 제출</button>
        </div>
      </template>

      <template v-else-if="state === 2">
        <h3>지원서를 접수하고 있습니다</h3>
        <p class="p">{{ posting?.eventName }} · {{ posting?.name }}</p>
        <div class="track">
          <div class="tstep done"><span class="sn">접수</span><span class="sd">지원서 등록</span></div>
          <div class="tstep doing"><span class="sn">검증 중</span><span class="sd">자격요건 확인</span></div>
          <div class="tstep"><span class="sn">확정</span><span class="sd">기관에 전달</span></div>
        </div>
        <div class="ovlnote"><span class="spin" /> 자격요건과 제출 서류를 확인하는 중입니다.</div>
        <div class="ovlacts"><button class="btn sec" @click="emit('close')">닫기</button></div>
      </template>

      <template v-else-if="state === 3">
        <h3>지원이 접수되었습니다</h3>
        <p class="p">{{ posting?.orgName }}에 전달되었습니다.</p>
        <div class="track">
          <div class="tstep done"><span class="sn">접수</span><span class="sd">지원서 등록</span></div>
          <div class="tstep done"><span class="sn">검증 중</span><span class="sd">자격요건 확인</span></div>
          <div class="tstep done"><span class="sn">확정</span><span class="sd">기관에 전달</span></div>
        </div>
        <div class="ovlnote">
          결과는 마감 후 영업일 <b>5일 이내</b> 알림으로 전달됩니다. 현재 상태는 <b>서류 검토</b>입니다.
        </div>
        <div class="ovlacts">
          <button class="btn sec" @click="emit('close')">닫기</button>
          <button class="btn pri" @click="emit('apps')">내 지원 관리 →</button>
        </div>
      </template>

      <template v-else>
        <h3>접수하지 못했습니다</h3>
        <p class="p">{{ posting?.eventName }} · {{ posting?.name }}</p>
        <div class="ovlnote">{{ message || '잠시 후 다시 시도해 주세요.' }}</div>
        <div class="ovlacts">
          <button class="btn sec" @click="emit('close')">닫기</button>
          <button class="btn pri" @click="emit('retry')">다시 시도</button>
        </div>
      </template>
    </div>
  </div>
</template>
