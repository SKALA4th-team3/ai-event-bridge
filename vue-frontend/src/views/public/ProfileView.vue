<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CATEGORIES } from '@/constants/categories.js'
import { REGION_GROUPS } from '@/constants/regions.js'
import { useProfileStore } from '@/store/profile.js'
import { useAuthStore } from '@/store/auth.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const profile = useProfileStore()
const auth = useAuthStore()
const ui = useUiStore()

const isGov = computed(() => profile.data?.kind === 'gov')
const editing = ref(false)
const saving = ref(false)
const e = ref({})
const set = (k, v) => { e.value = { ...e.value, [k]: v } }

/* 수정은 복사본에서 하고 저장할 때만 반영합니다 — 취소하면 원래대로 */
const form = ref({ ...profile.data })
function start() { form.value = { ...profile.data }; e.value = {}; editing.value = true }
function cancel() { editing.value = false; e.value = {} }

const FIELDS = ['축제·행사', '전시·박람회', '체육 행사', '문화예술 공연', '지역 홍보']
function toggleRegion(r) {
  const list = form.value.regions ? [...form.value.regions] : []
  const i = list.indexOf(r)
  i >= 0 ? list.splice(i, 1) : list.push(r)
  form.value = { ...form.value, regions: list }
  set('regions', '')
}

async function save() {
  let ok = true
  if (!form.value.name?.trim()) { set('name', isGov.value ? '기관명을 입력해 주세요.' : '상호를 입력해 주세요.'); ok = false } else set('name', '')
  if (isGov.value) {
    if (!form.value.dept?.trim() || !form.value.manager?.trim()) { set('dept', '부서와 담당자명을 모두 입력해 주세요.'); ok = false } else set('dept', '')
  } else {
    if (!form.value.regions?.length) { set('regions', '활동 지역을 하나 이상 선택해 주세요.'); ok = false } else set('regions', '')
    if (form.value.tenure === '' || form.value.tenure === null) { set('tenure', '업력을 입력해 주세요.'); ok = false } else set('tenure', '')
  }
  if (!ok) return ui.toast('입력값을 확인해 주세요.', 'bad')

  saving.value = true
  /* ★ PATCH /api/users/me 가 아직 없어 브라우저 프로필에만 반영합니다.
     엔드포인트가 생기면 여기서 호출만 추가하면 됩니다. */
  profile.save({
    ...form.value,
    tenure: Number(form.value.tenure) || 0,
    records: Number(form.value.records) || 0
  })
  saving.value = false
  editing.value = false
  ui.toast('내 정보를 저장했습니다.', 'good')
}
</script>

<template>
  <div class="view" id="me">
    <div class="ahead">
      <h2>내 정보</h2>
      <span style="font-family:var(--f-mono);font-size:.77em;color:var(--tx2)">
        {{ isGov ? '발주 기관' : '참여 업체' }} · {{ auth.user?.email ?? '실습 계정' }}
      </span>
      <span style="margin-left:auto;display:flex;gap:.5em">
        <template v-if="!editing">
          <button class="btn sec" @click="router.back()">뒤로</button>
          <button class="btn pri" @click="start">정보 수정</button>
        </template>
        <template v-else>
          <button class="btn sec" @click="cancel">취소</button>
          <button class="btn pri" :disabled="saving" @click="save">저장</button>
        </template>
      </span>
    </div>

    <div class="abody">
      <!-- 조회 -->
      <div v-if="!editing" class="panel">
        <h3>{{ isGov ? '기관 정보' : '업체 정보' }}</h3>
        <dl class="kv">
          <dt>{{ isGov ? '기관명' : '상호' }}</dt><dd>{{ profile.data?.name || '—' }}</dd>
          <template v-if="isGov">
            <dt>부서</dt><dd>{{ profile.org?.dept || '—' }}</dd>
            <dt>담당자</dt><dd>{{ profile.org?.manager || '—' }}</dd>
            <dt>담당 분야</dt><dd>{{ profile.org?.field || '—' }}</dd>
          </template>
          <template v-else>
            <dt>사업자등록번호</dt><dd>{{ profile.firm?.biz || '—' }}</dd>
            <dt>업종</dt><dd>{{ profile.firm?.category || '—' }}</dd>
            <dt>활동 지역</dt><dd>{{ profile.firm?.regions?.join(' · ') || '—' }}</dd>
            <dt>업력</dt><dd>{{ profile.firm?.tenure ?? 0 }}년</dd>
            <dt>유사 수행 실적</dt><dd>{{ profile.firm?.records ?? 0 }}건</dd>
          </template>
          <dt>역할</dt><dd>{{ isGov ? '발주 기관' : '참여 업체' }}</dd>
        </dl>
        <p v-if="!isGov" style="margin:.9em 0 0;font-size:.78em;color:var(--tx3);line-height:1.6">
          업종·활동 지역·업력·실적은 <b>공고 적합도 계산</b>에 그대로 쓰입니다.
          정확할수록 맞는 공고가 먼저 올라옵니다.
        </p>
      </div>

      <!-- 수정 -->
      <div v-else class="panel" style="max-width:44em">
        <h3>{{ isGov ? '기관 정보 수정' : '업체 정보 수정' }}</h3>
        <div class="form2">
          <div class="field full" :class="{ bad: e.name }">
            <label>{{ isGov ? '기관명' : '상호' }} <span class="req">*</span></label>
            <div class="inwrap"><input v-model="form.name"></div>
            <span class="err">⚠ <span class="msg">{{ e.name }}</span></span>
          </div>

          <template v-if="isGov">
            <div class="field" :class="{ bad: e.dept }">
              <label>부서 <span class="req">*</span></label>
              <div class="inwrap"><input v-model="form.dept"></div>
              <span class="err">⚠ <span class="msg">{{ e.dept }}</span></span>
            </div>
            <div class="field">
              <label>담당자 <span class="req">*</span></label>
              <div class="inwrap"><input v-model="form.manager"></div>
            </div>
            <div class="field full">
              <label>담당 분야</label>
              <div class="inwrap"><select v-model="form.field">
                <option v-for="f2 in FIELDS" :key="f2">{{ f2 }}</option></select></div>
            </div>
          </template>

          <template v-else>
            <div class="field">
              <label>사업자등록번호</label>
              <div class="inwrap"><input v-model="form.biz" style="font-family:var(--f-mono)"></div>
              <span class="hint">변경 시 진위확인을 다시 거칩니다</span>
            </div>
            <div class="field">
              <label>업종 <span class="req">*</span></label>
              <div class="inwrap"><select v-model="form.category">
                <option v-for="c in CATEGORIES" :key="c.code">{{ c.label }}</option></select></div>
              <span class="hint">적합도에서 가장 큰 비중(45점)입니다</span>
            </div>
            <div class="field full" :class="{ bad: e.regions }">
              <label>활동 지역 <span class="req">*</span> <span style="font-weight:400;color:var(--tx3)">복수 선택</span></label>
              <div class="chipsel">
                <button v-for="r in REGION_GROUPS" :key="r" type="button"
                        :aria-pressed="form.regions?.includes(r)" @click="toggleRegion(r)">{{ r }}</button>
              </div>
              <span class="err">⚠ <span class="msg">{{ e.regions }}</span></span>
            </div>
            <div class="field" :class="{ bad: e.tenure }">
              <label>업력 <span class="req">*</span></label>
              <div class="inwrap"><input v-model="form.tenure" type="number" style="font-family:var(--f-mono)"><span class="sfx">년</span></div>
              <span class="err">⚠ <span class="msg">{{ e.tenure }}</span></span>
            </div>
            <div class="field">
              <label>유사 수행 실적</label>
              <div class="inwrap"><input v-model="form.records" type="number" style="font-family:var(--f-mono)"><span class="sfx">건</span></div>
              <span class="hint">최근 3년 기준</span>
            </div>
          </template>
        </div>

        <p style="margin:.2em 0 0;font-size:.76em;color:var(--tx3)">
          역할은 계정 속성이라 이 화면에서 바꿀 수 없습니다.
        </p>
      </div>
    </div>
  </div>
</template>
