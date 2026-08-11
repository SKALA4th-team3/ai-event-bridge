<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

/* 실습 계정 — 프로토타입의 데모 버튼과 같은 자리입니다 */
const ACC = {
  vendor: { e: 'student@lecture.com', p: 'password1234' },
  gov: { e: 'instructor@lecture.com', p: 'password1234' }
}

const email = ref('')
const pw = ref('')
const showPw = ref(false)
const errEmail = ref('')
const errPw = ref('')
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

function blurEmail() {
  const v = email.value.trim()
  errEmail.value = !v ? '이메일을 입력해 주세요.' : !isEmail(v) ? '이메일 형식이 올바르지 않습니다.' : ''
}
const blurPw = () => { errPw.value = pw.value ? '' : '비밀번호를 입력해 주세요.' }

function fillDemo(k) {
  email.value = ACC[k].e; pw.value = ACC[k].p
  errEmail.value = ''; errPw.value = ''
}

const submitting = ref(false)
function doLogin() {
  blurEmail(); blurPw()
  if (errEmail.value || errPw.value) return ui.toast('입력값을 확인해 주세요.', 'bad')
  submitting.value = true

  /* 실습 백엔드는 OAuth2 Authorization Code Flow만 제공하고
     비밀번호를 직접 받는 엔드포인트가 없습니다.
     자격 증명 확인은 인증 서버 화면이 맡고, 이 화면은 형식 검증과
     역할 힌트까지를 책임집니다. */
  sessionStorage.setItem('eb.loginRole', /\.go\.kr$/.test(email.value.trim()) ? 'gov' : 'vendor')
  sessionStorage.setItem('eb.loginEmail', email.value.trim())
  auth.redirectToLogin()
}
</script>

<template>
  <div class="acard">
    <h3>로그인</h3>
    <p class="lead">등록하신 계정으로 로그인하세요.</p>

    <div class="field" :class="{ bad: errEmail }">
      <label>이메일 <span class="req">*</span></label>
      <div class="inwrap">
        <input v-model="email" type="email" placeholder="name@company.co.kr"
               autocomplete="username" @blur="blurEmail" @keyup.enter="doLogin">
      </div>
      <span class="hint">가입 시 사용한 이메일</span>
      <span class="err">⚠ <span class="msg">{{ errEmail }}</span></span>
    </div>

    <div class="field" :class="{ bad: errPw }">
      <label>비밀번호 <span class="req">*</span></label>
      <div class="inwrap">
        <input v-model="pw" :type="showPw ? 'text' : 'password'" placeholder="••••••••"
               autocomplete="current-password" @blur="blurPw" @keyup.enter="doLogin">
        <button type="button" class="eye" aria-label="비밀번호 표시" @click="showPw = !showPw">👁</button>
      </div>
      <span class="err">⚠ <span class="msg">{{ errPw }}</span></span>
    </div>

    <div class="arow2">
      <label><input type="checkbox" checked> 로그인 유지</label>
      <button class="linkbtn" @click="ui.toast('비밀번호 재설정 링크를 이메일로 보냈습니다.')">비밀번호 찾기</button>
    </div>

    <button class="btn pri" :disabled="submitting" @click="doLogin">로그인</button>

    <div class="asplit">처음이신가요</div>
    <button class="btn sec" style="padding:.72em" @click="router.push('/signup')">업체 회원가입</button>

    <div class="anote" style="margin-top:1em">
      <b>기관 담당자이신가요?</b><br>기관 도메인 이메일(<span style="font-family:var(--f-mono)">@*.go.kr</span>)로
      가입하시면 도메인 인증 후 <b>영업일 1일</b> 내 승인됩니다.
    </div>

    <div class="demo">
      <span class="dl">데모</span>
      <button type="button" @click="fillDemo('vendor')">업체 계정</button>
      <button type="button" @click="fillDemo('gov')">기관 계정</button>
    </div>
  </div>
</template>
