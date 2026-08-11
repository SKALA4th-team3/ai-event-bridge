/* 축제 사진 — 위키미디어 공용의 자유 라이선스 사진입니다.
   저작자·라이선스는 public/festivals/credits.json 에 있고
   이용 안내 화면 하단에 출처를 표기합니다.
   사진이 없는 축제는 계절 그라데이션으로 대체합니다. */
const MAP = {
  '진해 군항제': 'jinhae',
  '여의도 봄꽃축제': 'yeouido',
  '보령 머드축제': 'boryeong',
  '부산 바다축제': 'busan-sea',
  '대구 치맥페스티벌': 'daegu',
  '강릉 단오제': 'gangneung',
  '진주 남강유등축제': 'jinju',
  '서울 국제도서전': 'seoulbook',
  '부산 광안리 불꽃축제': 'busan-fw'
}
export const photoOf = (eventName) =>
  MAP[eventName] ? `/festivals/${MAP[eventName]}.jpg` : null
