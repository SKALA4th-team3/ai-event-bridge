<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CATEGORIES } from '@/constants/categories.js'
import { postingApi, groupByEvent } from '@/api/posting.js'
import { usePostingStore } from '@/store/posting.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const route = useRoute()
const store = usePostingStore()
const profile = useProfileStore()
const ui = useUiStore()

onMounted(() => store.load())

const step = ref(1)
const e = ref({})
const set = (k, v) => { e.value = { ...e.value, [k]: v } }

/* 소속 이벤트 — 직접 입력하되 이미 등록된 이름은 추천 목록으로 보여 줍니다 */
const events = computed(() => groupByEvent(store.scored).map((g) => ({ name: g.name, period: g.period })))
const f = ref({
  event: '', period: '', location: '',
  cat: CATEGORIES[0].label, name: '', bud: '', dd: '',
  desc: '', req: '업종: 전시·부스 설치업\n업력: 3년 이상\n유사 실적: 2건 이상\n지역: 경남 소재 우대'
})
/* 목록에 없는 이름을 적으면 새 이벤트로 봅니다 */
const isNew = computed(() => !!f.value.event && !events.value.some((x) => x.name === f.value.event))

function next1() {
  let ok = true
  if (!f.value.event.trim()) { set('ev', '이벤트명을 입력해 주세요.'); ok = false } else set('ev', '')
  if (!f.value.name.trim()) { set('name', '공사명을 입력해 주세요.'); ok = false } else set('name', '')
  const bd = String(f.value.bud).replace(/[,\s]/g, '')
  if (!bd || isNaN(+bd) || +bd < 1000000) { set('bud', '100만원 이상 숫자로 입력해 주세요.'); ok = false } else set('bud', '')
  const dd = String(f.value.dd).trim()
  if (!dd || isNaN(+dd) || +dd < 1) { set('dd', '1 이상 숫자로 입력해 주세요.'); ok = false } else set('dd', '')
  if (!ok) return ui.toast('입력값을 확인해 주세요.', 'bad')
  step.value = 2
}

/* 미리보기 바에서 단계를 바로 띄웁니다. 2단계는 앞 입력이 있어야 읽히므로 예시를 채웁니다. */
watch(() => route.query.stage, (st) => {
  if (!st) return
  if (st === '2' && !f.value.name) {
    f.value = { ...f.value, event: events.value[0]?.name ?? '진주 남강유등축제', name: '축제 부스 운영 및 관리',
                bud: '48000000', dd: '14', location: '경남 진주',
                desc: '부스 40동 설치·운영·철거. 3×3m 조립식, 전기 인입과 야간 조명, 우천 대비 방수 포함. 행사 종료 후 3일 이내 원상 복구.' }
  }
  step.value = Number(st) === 2 ? 2 : 1
}, { immediate: true })

const saving = ref(false)
async function save() {
  saving.value = true
  try {
    const deadline = new Date(Date.now() + Number(f.value.dd) * 86400000).toISOString().slice(0, 10)
    const picked = events.value.find((x) => x.name === f.value.event)
    const created = await postingApi.create({
      eventName: f.value.event,
      period: isNew.value ? f.value.period : (picked?.period || f.value.period),
      deadline,
      location: f.value.location || profile.org?.name || '전국',
      orgName: profile.org?.name ?? '발주 기관',
      name: f.value.name,
      category: f.value.cat,
      budget: String(f.value.bud).replace(/[,\s]/g, ''),
      task: f.value.desc,
      requirements: f.value.req
    })
    await store.load(true)
    ui.notify('공고가 등록되었습니다', created.name)
    ui.toast('공고가 등록되었습니다. 적합 업체에게 알림이 발송됩니다.', 'good')
    router.push('/console')
  } catch (err) {
    ui.toast(err.response?.data?.message || '등록에 실패했습니다.', 'bad')
  } finally { saving.value = false }
}
</script>

<template>
  <div class="cview">
    <div class="wizard">
      <span class="wstep" :class="step === 1 ? 'on' : 'done'"><span class="n">{{ step === 1 ? '1' : '✓' }}</span>기본 정보</span>
      <span class="wstep" :class="{ on: step === 2 }"><span class="n">2</span>과업·자격요건</span>
    </div>

    <div class="panel" style="max-width:58em">
      <!-- 1 · 기본 정보 -->
      <div v-if="step === 1">
        <div class="form2">
          <div class="field" :class="{ bad: e.ev }">
            <label>소속 이벤트 <span class="req">*</span></label>
            <div class="inwrap">
              <input v-model="f.event" list="event-list" placeholder="예: 진주 남강유등축제"
                     @blur="set('ev', f.event.trim() ? '' : '이벤트명을 입력해 주세요.')">
              <datalist id="event-list">
                <option v-for="ev in events" :key="ev.name" :value="ev.name">{{ ev.period }}</option>
              </datalist>
            </div>
            <span class="hint">이미 등록한 이벤트명을 적으면 그 아래로 묶이고, 새 이름을 적으면 새 이벤트가 됩니다</span>
            <span class="err">⚠ <span class="msg">{{ e.ev }}</span></span>
          </div>

          <div class="field">
            <label>공사 분야 <span class="req">*</span></label>
            <div class="inwrap"><select v-model="f.cat">
              <option v-for="c in CATEGORIES" :key="c.code">{{ c.label }}</option></select></div>
          </div>

          <div v-if="isNew" class="field full">
            <label>행사 기간 <span style="font-weight:400;color:var(--tx3)">새 이벤트</span></label>
            <div class="inwrap"><input v-model="f.period" placeholder="2026-10-01 ~ 2026-10-14"></div>
            <span class="hint">계절 구분과 공고 상세에 쓰입니다</span>
          </div>

          <div class="field full" :class="{ bad: e.name }">
            <label>공사명 <span class="req">*</span></label>
            <div class="inwrap"><input v-model="f.name" placeholder="예: 축제 부스 운영 및 관리"></div>
            <span class="err">⚠ <span class="msg">{{ e.name }}</span></span>
          </div>

          <div class="field" :class="{ bad: e.bud }">
            <label>사업 예산 (원) <span class="req">*</span></label>
            <div class="inwrap"><input v-model="f.bud" placeholder="48000000" style="font-family:var(--f-mono)"></div>
            <span class="err">⚠ <span class="msg">{{ e.bud }}</span></span>
          </div>

          <div class="field" :class="{ bad: e.dd }">
            <label>지원 마감까지 (일) <span class="req">*</span></label>
            <div class="inwrap"><input v-model="f.dd" placeholder="14" style="font-family:var(--f-mono)"></div>
            <span class="err">⚠ <span class="msg">{{ e.dd }}</span></span>
          </div>

          <div class="field full"><label>지역</label>
            <div class="inwrap"><input v-model="f.location" placeholder="경남 진주"></div>
            <span class="hint">시·도 + 시·군·구 — 지역 필터와 적합도에 쓰입니다</span></div>
        </div>

        <div class="formfoot">
          <button class="btn sec" @click="router.push('/console')">취소</button>
          <span class="rightg">
            <button class="btn sec" @click="ui.toast('임시 저장되었습니다.')">임시 저장</button>
            <button class="btn pri" @click="next1">다음 단계 →</button>
          </span>
        </div>
      </div>

      <!-- 2 · 과업·자격요건 -->
      <div v-else>
        <div class="form2">
          <div class="field full"><label>과업 내용</label>
            <div class="inwrap"><textarea v-model="f.desc"
              placeholder="부스 40동 설치·운영·철거. 3×3m 조립식, 전기 인입과 야간 조명, 우천 대비 방수 포함." /></div></div>
          <div class="field full">
            <label>자격요건 <span style="font-weight:400;color:var(--tx3)">— 이 형식대로 입력하면 업체 화면에서 자동 대조됩니다</span></label>
            <div class="inwrap"><textarea v-model="f.req" /></div>
          </div>
        </div>
        <div class="formfoot">
          <button class="btn sec" @click="step = 1">← 이전</button>
          <span class="rightg"><button class="btn pri" :disabled="saving" @click="save">공고 등록</button></span>
        </div>
      </div>
    </div>
  </div>
</template>
