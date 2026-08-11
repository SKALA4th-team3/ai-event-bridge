<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api/auth.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'
import { labelToCode } from '@/constants/categories.js'

const router = useRouter()
const route = useRoute()
const profile = useProfileStore()
const ui = useUiStore()

/* 1 → 2v(업체) / 2g(기관) → 3(완료) — 프로토타입과 같은 단계 구성 */
const step = ref('1')
const role = ref('vendor')
const isGov = computed(() => role.value === 'gov')

const email = ref(''), pw = ref(''), pw2 = ref(''), agree = ref(true)
const showPw = ref(false)
const e = ref({})                       // 필드별 오류
const set = (k, v) => { e.value = { ...e.value, [k]: v } }

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isGovMail = (v) => /@[\w.-]*\.go\.kr$/.test(v) || /@korea\.kr$/.test(v)
const TAKEN = ['student@lecture.com', 'instructor@lecture.com']

function chkEmail() {
  const v = email.value.trim()
  if (!v) return set('email', '이메일을 입력해 주세요.') || false
  if (!isEmail(v)) return set('email', '이메일 형식이 올바르지 않습니다.') || false
  if (TAKEN.includes(v)) return set('email', '이미 가입된 이메일입니다. 로그인해 주세요.') || false
  if (isGov.value && !isGovMail(v)) return set('email', '기관 도메인(@*.go.kr, @korea.kr) 주소로 가입해 주세요.') || false
  if (!isGov.value && isGovMail(v)) return set('email', '기관 도메인입니다. 위에서 ‘발주 기관’을 선택해 주세요.') || false
  set('email', ''); return true
}
function chkPw() {
  const v = pw.value
  set('pw', v.length < 8 ? '8자 이상 입력해 주세요.'
       : (!/[a-zA-Z]/.test(v) || !/\d/.test(v)) ? '영문과 숫자를 함께 사용해 주세요.' : '')
  return !e.value.pw
}
const chkPw2 = () => { set('pw2', pw2.value !== pw.value ? '비밀번호가 일치하지 않습니다.' : ''); return !e.value.pw2 }

function setRole(r) { role.value = r; set('email', '') }
const govDomain = computed(() => '@' + (email.value.trim().split('@')[1] || '*.go.kr'))

function next1() {
  const ok = [chkEmail(), chkPw(), chkPw2()].every(Boolean)
  if (!agree.value) { ui.toast('약관에 동의해 주세요.', 'bad'); return }
  if (!ok) return ui.toast('입력값을 확인해 주세요.', 'bad')
  step.value = isGov.value ? '2g' : '2v'
}

/* 2단계 · 업체 */
const CATS = ['전시·부스 설치업', '무대·음향 설비업', '행사 운영·인력', '홍보·디자인', '영상·중계', '케이터링']
const CAT_TO_FIELD = {
  '전시·부스 설치업': '부스 설치', '무대·음향 설비업': '무대·음향', '행사 운영·인력': '운영인력',
  '홍보·디자인': '홍보·디자인', '영상·중계': '영상·중계', '케이터링': '케이터링'
}
const REGIONS = ['서울', '경기·인천', '강원', '충청', '전라', '경상', '제주']
const v = ref({ name: '', biz: '', cat: CATS[0], regions: [] })
function toggleRegion(r) {
  const i = v.value.regions.indexOf(r)
  if (i >= 0) v.value.regions.splice(i, 1); else v.value.regions.push(r)
  set('reg', '')
}

/* 2단계 · 기관 */
const FIELDS = ['축제·행사', '전시·박람회', '체육 행사', '문화예술 공연', '지역 홍보']
const SCALES = ['1억원 미만', '1–5억원', '5–10억원', '10억원 이상']
const g = ref({ name: '', dept: '', who: '', field: FIELDS[0], scale: SCALES[0] })

const saving = ref(false)
const doneSub = ref('')

/* 미리보기 바에서 ?stage=... 로 단계를 바로 띄웁니다.
   비어 있으면 화면이 판단되지 않으니 예시 값을 함께 채웁니다. */
watch(() => route.query.stage, (st) => {
  if (!st) return
  if (st === '1') { step.value = '1'; return }
  email.value ||= st.endsWith('g') ? 'kim@jinju.go.kr' : 'contact@hanbit-d.co.kr'
  pw.value ||= 'password1234'; pw2.value = pw.value
  if (st.endsWith('g')) {
    role.value = 'gov'
    if (!g.value.name) g.value = { ...g.value, name: '진주시청', dept: '문화관광과', who: '김담당' }
  } else {
    role.value = 'vendor'
    if (!v.value.name) v.value = { ...v.value, name: '(주)한빛디스플레이', biz: '123-45-67890', regions: ['경기·인천', '경상'] }
  }
  if (st.startsWith('3')) {
    doneSub.value = st === '3g'
      ? `${g.value.name} · ${g.value.dept} ${g.value.who}`
      : `${v.value.name} · ${v.value.cat}`
    step.value = '3'
  } else step.value = st
}, { immediate: true })

async function register(kind) {
  saving.value = true
  try {
    await authApi.register({
      name: kind === 'gov' ? g.value.who : v.value.name,
      email: email.value.trim(),
      password: pw.value,
      role: kind === 'gov' ? 'INSTRUCTOR' : 'STUDENT'
    })
    return true
  } catch (err) {
    ui.toast(err.response?.data?.message || '가입에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'bad')
    return false
  } finally { saving.value = false }
}

async function doneVendor() {
  let ok = true
  if (!v.value.name.trim()) { set('name', '상호를 입력해 주세요.'); ok = false } else set('name', '')
  if (!/^\d{3}-?\d{2}-?\d{5}$/.test(v.value.biz.trim())) { set('biz', '000-00-00000 형식으로 입력해 주세요.'); ok = false } else set('biz', '')
  if (!v.value.regions.length) { set('reg', '한 곳 이상 선택해 주세요.'); ok = false } else set('reg', '')
  if (!ok) return ui.toast('입력값을 확인해 주세요.', 'bad')
  if (!(await register('vendor'))) return

  profile.save({
    kind: 'vendor', name: v.value.name, biz: v.value.biz,
    category: CAT_TO_FIELD[v.value.cat], categoryCode: labelToCode(CAT_TO_FIELD[v.value.cat]),
    regions: [...v.value.regions], tenure: 4, records: 6
  })
  doneSub.value = `${v.value.name} · ${v.value.cat}`
  step.value = '3'; ui.toast('업체 가입이 접수되었습니다.', 'good')
}

async function doneGov() {
  let ok = true
  if (!g.value.name.trim()) { set('gname', '기관명을 입력해 주세요.'); ok = false } else set('gname', '')
  if (!g.value.dept.trim() || !g.value.who.trim()) { set('gdept', '부서와 담당자명을 모두 입력해 주세요.'); ok = false } else set('gdept', '')
  if (!ok) return ui.toast('입력값을 확인해 주세요.', 'bad')
  if (!(await register('gov'))) return

  profile.save({ kind: 'gov', name: g.value.name, dept: g.value.dept, manager: g.value.who, field: g.value.field })
  doneSub.value = `${g.value.name} · ${g.value.dept} ${g.value.who}`
  step.value = '3'; ui.toast('기관 가입이 접수되었습니다. 인증 메일을 확인해 주세요.', 'good')
}
</script>

<template>
  <div class="acard">

    <!-- 1 · 계정 -->
    <div v-if="step === '1'" class="su">
      <div class="wizard">
        <span class="wstep on"><span class="n">1</span>계정</span>
        <span class="wstep"><span class="n">2</span>{{ isGov ? '기관 정보' : '업체 정보' }}</span>
      </div>
      <h3>계정 만들기</h3>
      <p class="lead">어떤 자격으로 이용하시는지 먼저 선택해 주세요.</p>

      <div class="field">
        <label>이용 자격 <span class="req">*</span></label>
        <div class="roleseg">
          <button type="button" :aria-pressed="!isGov" @click="setRole('vendor')">
            <b>🏢 참여 업체</b><span>공고를 찾아 지원합니다</span></button>
          <button type="button" :aria-pressed="isGov" @click="setRole('gov')">
            <b>🏛 발주 기관</b><span>공고를 등록하고 업체를 찾습니다</span></button>
        </div>
      </div>

      <div class="field" :class="{ bad: e.email }">
        <label>이메일 <span class="req">*</span></label>
        <div class="inwrap">
          <input v-model="email" type="email"
                 :placeholder="isGov ? 'name@city.go.kr' : 'name@company.co.kr'" @blur="chkEmail">
        </div>
        <span class="hint">{{ isGov ? '기관 도메인(@*.go.kr, @korea.kr)만 가입할 수 있습니다' : '공고 알림도 이 주소로 받습니다' }}</span>
        <span class="err">⚠ <span class="msg">{{ e.email }}</span></span>
      </div>

      <div class="field" :class="{ bad: e.pw }">
        <label>비밀번호 <span class="req">*</span></label>
        <div class="inwrap">
          <input v-model="pw" :type="showPw ? 'text' : 'password'" placeholder="••••••••" @blur="chkPw">
          <button type="button" class="eye" aria-label="비밀번호 표시" @click="showPw = !showPw">👁</button>
        </div>
        <span class="hint">영문·숫자 조합 8자 이상</span>
        <span class="err">⚠ <span class="msg">{{ e.pw }}</span></span>
      </div>

      <div class="field" :class="{ bad: e.pw2 }">
        <label>비밀번호 확인 <span class="req">*</span></label>
        <div class="inwrap"><input v-model="pw2" type="password" placeholder="••••••••" @blur="chkPw2"></div>
        <span class="err">⚠ <span class="msg">{{ e.pw2 }}</span></span>
      </div>

      <div class="arow2" style="margin-bottom:.9em">
        <label><input v-model="agree" type="checkbox"> 이용약관 및 개인정보 처리방침 동의</label>
      </div>
      <button class="btn pri" @click="next1">다음 단계 →</button>
      <div class="asplit">이미 계정이 있으신가요</div>
      <button class="btn sec" style="padding:.7em" @click="router.push('/login')">로그인으로</button>
    </div>

    <!-- 2 · 업체 -->
    <div v-else-if="step === '2v'" class="su">
      <div class="wizard">
        <span class="wstep done"><span class="n">✓</span>계정</span>
        <span class="wstep on"><span class="n">2</span>업체 정보</span>
      </div>
      <h3>업체 정보</h3>
      <p class="lead">이 정보로 공고 적합도를 계산합니다.</p>

      <div class="field" :class="{ bad: e.name }">
        <label>상호 <span class="req">*</span></label>
        <div class="inwrap"><input v-model="v.name" placeholder="(주)○○○"
               @blur="set('name', v.name.trim() ? '' : '상호를 입력해 주세요.')"></div>
        <span class="err">⚠ <span class="msg">{{ e.name }}</span></span>
      </div>

      <div class="field" :class="{ bad: e.biz }">
        <label>사업자등록번호 <span class="req">*</span></label>
        <div class="inwrap"><input v-model="v.biz" placeholder="000-00-00000" style="font-family:var(--f-mono)"
               @blur="set('biz', /^\d{3}-?\d{2}-?\d{5}$/.test(v.biz.trim()) ? '' : '000-00-00000 형식으로 입력해 주세요.')"></div>
        <span class="hint">국세청 진위확인을 거칩니다</span>
        <span class="err">⚠ <span class="msg">{{ e.biz }}</span></span>
      </div>

      <div class="field">
        <label>업종 <span class="req">*</span></label>
        <div class="inwrap"><select v-model="v.cat"><option v-for="c in CATS" :key="c">{{ c }}</option></select></div>
      </div>

      <div class="field" :class="{ bad: e.reg }">
        <label>서비스 가능 지역 <span class="req">*</span>
          <span style="font-weight:400;color:var(--tx3)">복수 선택</span></label>
        <div class="chipsel">
          <button v-for="r in REGIONS" :key="r" type="button"
                  :aria-pressed="v.regions.includes(r)" @click="toggleRegion(r)">{{ r }}</button>
        </div>
        <span class="err">⚠ <span class="msg">{{ e.reg }}</span></span>
      </div>

      <div style="display:flex;gap:.55em;margin-top:1em">
        <button class="btn sec" style="width:auto;flex:none;padding:.8em 1.1em" @click="step = '1'">← 이전</button>
        <button class="btn pri" :disabled="saving" @click="doneVendor">가입 완료</button>
      </div>
    </div>

    <!-- 2 · 기관 -->
    <div v-else-if="step === '2g'" class="su">
      <div class="wizard">
        <span class="wstep done"><span class="n">✓</span>계정</span>
        <span class="wstep on"><span class="n">2</span>기관 정보</span>
      </div>
      <h3>기관 정보</h3>
      <p class="lead">공고에 표시될 발주 기관 정보입니다.</p>

      <div class="field" :class="{ bad: e.gname }">
        <label>기관명 <span class="req">*</span></label>
        <div class="inwrap"><input v-model="g.name" placeholder="예: 진주시청"
               @blur="set('gname', g.name.trim() ? '' : '기관명을 입력해 주세요.')"></div>
        <span class="err">⚠ <span class="msg">{{ e.gname }}</span></span>
      </div>

      <div class="field" :class="{ bad: e.gdept }">
        <label>부서 · 담당자 <span class="req">*</span></label>
        <div class="inwrap" style="gap:.4em">
          <input v-model="g.dept" placeholder="문화관광과" style="flex:1.2"
                 @blur="set('gdept', g.dept.trim() && g.who.trim() ? '' : '부서와 담당자명을 모두 입력해 주세요.')">
          <input v-model="g.who" placeholder="김담당" style="flex:1"
                 @blur="set('gdept', g.dept.trim() && g.who.trim() ? '' : '부서와 담당자명을 모두 입력해 주세요.')">
        </div>
        <span class="err">⚠ <span class="msg">{{ e.gdept }}</span></span>
      </div>

      <div class="field">
        <label>담당 분야 <span class="req">*</span></label>
        <div class="inwrap"><select v-model="g.field"><option v-for="f in FIELDS" :key="f">{{ f }}</option></select></div>
      </div>

      <div class="field">
        <label>연간 발주 규모</label>
        <div class="inwrap"><select v-model="g.scale"><option v-for="s in SCALES" :key="s">{{ s }}</option></select></div>
        <span class="hint">추천 정확도에만 쓰이며 공개되지 않습니다</span>
      </div>

      <div class="anote" style="margin-bottom:1em">
        <b>기관 도메인 확인</b><br>
        입력하신 <span style="font-family:var(--f-mono)">{{ govDomain }}</span> 주소로 인증 메일을 보냅니다.
        메일 확인 후 운영자 승인까지 <b>영업일 1일</b>이 걸립니다.
      </div>

      <div style="display:flex;gap:.55em">
        <button class="btn sec" style="width:auto;flex:none;padding:.8em 1.1em" @click="step = '1'">← 이전</button>
        <button class="btn pri" :disabled="saving" @click="doneGov">가입 완료</button>
      </div>
    </div>

    <!-- 3 · 완료 -->
    <div v-else class="su donebox">
      <div class="okc">✓</div>
      <h3>가입이 접수되었습니다</h3>
      <p class="lead">{{ doneSub }}</p>
      <div class="anote" style="text-align:left;margin-bottom:1.1em">
        <template v-if="isGov">
          <b>{{ govDomain }}</b> 주소로 인증 메일을 보냈습니다.
          메일 확인 후 <b>운영자 승인까지 영업일 1일</b>이 걸립니다.
          승인 전에는 공고 등록이 제한되며, 등록된 공고 열람은 가능합니다.
          <span style="color:var(--tx3)">같은 기관의 동료는 승인 후 콘솔에서 초대할 수 있습니다.</span>
        </template>
        <template v-else>
          사업자등록번호 진위확인에 <b>영업일 1~2일</b>이 걸립니다. 검증이 끝나면
          알림 메일을 보내드리며, 그때부터 <b>업종에 맞는 맞춤 공고</b>를 받아보실 수 있습니다.
          <span style="color:var(--tx3)">검증 전에도 전체 공고 열람은 가능합니다.</span>
        </template>
      </div>
      <button class="btn pri" @click="router.push('/login')">로그인하고 시작하기 →</button>
      <button class="btn sec" style="padding:.7em;margin-top:.55em" @click="router.push('/login')">로그인 화면으로</button>
    </div>

  </div>
</template>
