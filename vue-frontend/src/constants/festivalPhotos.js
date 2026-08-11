/* 축제 사진 — 위키미디어 공용의 자유 라이선스 사진입니다.
   · 원본을 가로 720px · 품질 72 로 줄여 담았습니다 (표시 최대폭이 300px 라 충분합니다)
   · 저작자·라이선스는 constants/photoCredits.js 에 있고 이용 안내 화면에 표기합니다
   · 사진이 없는 축제는 계절 그라데이션으로 대체됩니다 */
const MAP = {
  '진해 군항제': 'jinhae',
  '여의도 봄꽃축제': 'yeouido',
  '보령 머드축제': 'boryeong',
  '대구 치맥페스티벌': 'daegu',
  '서울 국제도서전': 'seoulbook',
  '강릉 단오제': 'gangneung',
  '진주 남강유등축제': 'jinju',
  '부산 광안리 불꽃축제': 'busan-fw',
  '부산 바다축제': 'busan-sea',
  '화천 산천어축제': 'hwacheon',
  '태백산 눈축제': 'taebaek',
  '이천 쌀문화축제': 'icheon',
  '대전 사이언스페스티벌': 'daejeon'
}
export const photoOf = (eventName) =>
  MAP[eventName] ? `/festivals/${MAP[eventName]}.jpg` : null
