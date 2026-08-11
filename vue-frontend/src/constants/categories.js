/* 백엔드 Course.Category enum 8종 → 화면 라벨.
   enum 값은 절대 바꾸지 않고 표현 계층에서만 치환합니다. */
export const CATEGORIES = [
  { code: 'BACKEND',      label: '부스 설치' },
  { code: 'FRONTEND',     label: '무대·음향' },
  { code: 'DEVOPS',       label: '안전인력' },
  { code: 'DATA_SCIENCE', label: '운영인력' },
  { code: 'MOBILE',       label: '홍보·디자인' },
  { code: 'SECURITY',     label: '영상·중계' },
  { code: 'DATABASE',     label: '케이터링' },
  { code: 'OTHER',        label: '기타' }
]
/* enrollment-service가 내려주는 course.category는 코드가 아니라 한글 표시명입니다.
   ACL에서 둘 다 받아들여 화면 용어로 옮깁니다. */
const ALIAS = {
  백엔드: 'BACKEND', 프론트엔드: 'FRONTEND', 데브옵스: 'DEVOPS', DevOps: 'DEVOPS',
  데이터사이언스: 'DATA_SCIENCE', 모바일: 'MOBILE', 보안: 'SECURITY',
  데이터베이스: 'DATABASE', 기타: 'OTHER'
}
export const codeToLabel = (c) => {
  const code = ALIAS[c] ?? c
  return CATEGORIES.find((x) => x.code === code)?.label ?? '기타'
}
export const labelToCode = (l) => CATEGORIES.find((x) => x.label === l)?.code ?? 'OTHER'
