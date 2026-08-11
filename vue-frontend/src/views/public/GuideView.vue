<script setup>
import { PHOTO_CREDITS } from '@/constants/photoCredits.js'
const GOV = [
  ['기관 계정 개설', '기관 도메인 이메일로 가입하면 도메인 인증과 운영자 승인을 거쳐 개설됩니다. 같은 기관 동료는 초대로 추가합니다.'],
  ['이벤트와 공사 등록', '하나의 이벤트에 부스·무대·인력 등 여러 공사를 나눠 등록합니다.'],
  ['AI 추천으로 선정 업체 선정', '업종과 수행 이력을 대조해 적합한 업체를 추천하고 선정 사유를 기록합니다.']
]
const VENDOR = [
  ['업체 등록과 검증', '사업자등록번호로 진위를 확인합니다. 영업일 1~2일이 걸립니다.'],
  ['업종 등록', '등록한 업종에 해당하는 공고만 모아 보여드립니다.'],
  ['마감 임박순 확인', '업종에 맞는 공고를 마감이 가까운 순서로 보여드립니다.']
]
</script>

<template>
  <div class="view" id="help">
    <div class="hhead">
      <h2>이벤트브릿지 이용 안내</h2>
      <p>지자체·공공기관의 이벤트 발주와, 이를 수행할 업체를 잇는 매칭 플랫폼입니다.</p>
    </div>
    <div class="hbody">
      <div class="panel hcard">
        <h3><span class="pill g">발주 기관</span><span class="ttl">공고를 내고 업체를 찾습니다</span></h3>
        <ol class="steps">
          <li v-for="s in GOV" :key="s[0]"><span><b>{{ s[0] }}</b>{{ s[1] }}</span></li>
        </ol>
      </div>
      <div class="panel hcard v">
        <h3><span class="pill v">참여 업체</span><span class="ttl">맞는 공고만 받아 지원합니다</span></h3>
        <ol class="steps">
          <li v-for="s in VENDOR" :key="s[0]"><span><b>{{ s[0] }}</b>{{ s[1] }}</span></li>
        </ol>
      </div>
      <div class="panel flowcard">
        <h3 style="margin:0 0 .2em;font-size:calc(var(--u)*1.02);font-weight:730">지원은 이렇게 진행됩니다</h3>
        <p style="margin:0 0 .5em;font-size:calc(var(--u)*.8);color:var(--tx2)">
          화면에 보이는 배지와 같은 표기입니다.
        </p>
        <div class="flowrow">
          <span class="fk">공고</span>
          <span class="flowseq">
            <span class="badge wait">지원 접수</span><span class="arw">→</span>
            <span class="badge sec">심사 중</span><span class="arw">→</span>
            <span class="badge ok">선정 완료</span>
          </span>
        </div>
        <div class="flowrow">
          <span class="fk">내 지원</span>
          <span class="flowseq">
            <span class="badge sec">접수 완료</span><span class="arw">→</span>
            <span class="badge wait">심사 중</span><span class="arw">→</span>
            <span class="badge ok">선정</span><span class="alt">또는</span><span class="badge">미선정</span>
          </span>
        </div>
        <p class="flownote">
          마감이 지나면 공고는 <b>심사 중</b>으로 바뀌고, 접수한 입찰도 함께 심사에 들어갑니다.
          결과는 마감 후 영업일 5일 이내 알림으로 전달됩니다.
        </p>
      </div>

      <div class="panel" style="grid-column:1/-1">
        <h3 style="margin:0 0 .5em;font-size:calc(var(--u)*.96);font-weight:700">사진 출처</h3>
        <p style="margin:0 0 .6em;font-size:calc(var(--u)*.78);color:var(--tx2);line-height:1.6">
          축제 사진은 위키미디어 공용의 자유 라이선스 사진입니다. 저작자와 라이선스를 아래에 밝힙니다.
        </p>
        <ul style="margin:0;padding:0;list-style:none;display:grid;gap:.3em;
                   grid-template-columns:repeat(auto-fill,minmax(20em,1fr))">
          <li v-for="c in PHOTO_CREDITS" :key="c.name"
              style="font-size:calc(var(--u)*.74);color:var(--tx2);line-height:1.5">
            <b style="color:var(--tx)">{{ c.name }}</b> — {{ c.author }},
            <a :href="c.source" target="_blank" rel="noopener">{{ c.license }}</a>
          </li>
        </ul>
      </div>

      <div class="panel faq">
        <h3 style="margin:0 0 .7em;font-size:.96em;font-weight:700">자주 묻는 질문</h3>
        <dl>
          <div><dt>‘우리 업체에 맞는 공고’는 어떻게 고르나요</dt>
            <dd>등록하신 <b>업종</b>과 일치하고 <b>적합도 70% 이상</b>인 공고만 추린 뒤 <b>마감이 가까운 순서</b>로 정렬합니다.</dd></div>
          <div><dt>D-day는 무엇을 가리키나요</dt>
            <dd><b>지원 마감일까지 남은 일수</b>입니다. 마감 전 공고는 모두 지원할 수 있고, 7일 이내는 강조됩니다.</dd></div>
          <div><dt>하나의 이벤트에 여러 건에 지원할 수 있나요</dt>
            <dd>가능합니다. 이벤트는 공사 단위로 발주되며 각 건에 개별 지원합니다. <b>같은 건에 중복 지원은 되지 않습니다.</b></dd></div>
          <div><dt>시즌은 무엇을 바꾸나요</dt>
            <dd>상단 시즌 선택은 <b>조회 기간의 범위</b>입니다. 해당 분기의 발주 현황과 지역 분포를 보여줍니다.</dd></div>
        </dl>
      </div>
    </div>
  </div>
</template>
