/* 축제 사진 — 위키미디어 공용의 자유 라이선스 사진입니다.
   화면 크기에 맞는 판을 브라우저가 고르도록 두 가지를 준비합니다.
     · 720px — 목록 카드처럼 크게 쓰는 자리, 레티나 2배까지 감당
     ·  360px — 좁은 화면이나 작은 썸네일
   실제 선택은 <img srcset/sizes> 가 하고, 그래서 배경이미지가 아니라
   <img> 를 씁니다. 배경이미지로는 화면 크기에 따라 다른 파일을 못 고릅니다.
   사진이 없는 축제는 null 이며 계절 그라데이션으로 대체됩니다. */
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

export const photoOf = (eventName) => {
  const slug = MAP[eventName]
  if (!slug) return null
  return {
    src: `/festivals/${slug}.jpg`,
    srcset: `/festivals/sm/${slug}.jpg 360w, /festivals/${slug}.jpg 720w`
  }
}
