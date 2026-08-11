/* 미리보기 모드 판정 한 곳.
   백엔드나 로그인 없이도 모든 화면을 볼 수 있게 하는 스위치이며,
   개발 모드에서만 켜집니다. */
export const isPreview = () =>
  import.meta.env.DEV && sessionStorage.getItem('eb.preview') !== 'off'
