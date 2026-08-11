<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import BrandMark from '@/components/common/BrandMark.vue'

const route = useRoute()

/* 좌측 브랜드 패널 카피는 화면마다 다릅니다 */
const COPY = {
  Login: {
    h: ['흩어진 이벤트 발주,', '한 곳에서 만납니다'],
    p: '전국 164개 기관의 이벤트 공사 공고를 모아, 우리 업체에 맞는 것만 골라 보여드립니다.',
    f: ['문장으로 검색 — 지역·기간·분야·예산 자동 인식',
        '업종·실적 기반 적합도와 자격요건 자동 대조',
        '마감 임박 알림과 지원 상태 추적'],
    fine: '공공 이벤트 발주 매칭 플랫폼'
  },
  Signup: {
    h: ['업종만 등록하면', '맞는 공고가 찾아옵니다'],
    p: '사업자등록번호로 진위를 확인한 뒤, 등록하신 업종·지역의 공고만 골라 보여드립니다.',
    f: ['가입비·이용료 없음 — 조회와 지원은 무료',
        '검증 영업일 1~2일 — 그동안에도 열람 가능',
        '등록 정보가 많을수록 적합도가 정확해집니다'],
    fine: '참여 업체 회원가입'
  }
}
const c = computed(() => COPY[route.name] ?? COPY.Login)
</script>

<template>
  <div class="viewport">
    <div class="view auth">
      <div class="auth-l">
        <div class="lg"><BrandMark />이벤트브릿지</div>
        <div class="mid">
          <h2>{{ c.h[0] }}<br>{{ c.h[1] }}</h2>
          <p>{{ c.p }}</p>
          <ul class="feat">
            <li v-for="t in c.f" :key="t"><span class="d" />{{ t }}</li>
          </ul>
        </div>
        <div class="fine">{{ c.fine }}</div>
      </div>
      <div class="auth-r">
        <RouterView />
      </div>
    </div>
  </div>
</template>
