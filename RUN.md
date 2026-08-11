# 이벤트브릿지 — 실행 방법

공공 이벤트 발주 매칭 플랫폼. 백엔드는 SKALA MSA 실습 템플릿(Spring Boot MSA)을 그대로 쓰고,
프론트엔드(`vue-frontend/`)를 이벤트브릿지 화면으로 구현했습니다.

---

## 0. 준비물

| | 버전 | 확인 |
|---|---|---|
| Docker Desktop | 실행 중 | `docker info` |
| Node.js | 20 이상 | `node -v` |

메모리는 Docker에 **6GB 이상** 할당해 두세요. 컨테이너가 10개입니다.

---

## 1. 백엔드 띄우기 (최초 1회는 10분쯤 걸립니다)

프로젝트 루트(`msa-lecture/`)에서 순서대로 실행합니다.

### 1-1. 공통 이미지 로드

`auth-server`와 `api-gateway`는 **소스가 없고 이미지 파일로만 제공**됩니다.
이 단계를 건너뛰면 `docker compose up`이 이미지를 못 찾아 실패합니다.

```bash
docker load -i infra-images.tar
docker images | grep msa-lecture     # auth-server:1.0, api-gateway:1.0 확인
```

### 1-2. 나머지 서비스 빌드 후 기동

```bash
docker compose build          # 최초 4~5분. 재실행 시 캐시로 수십 초
docker compose up -d          # 헬스체크 순서대로 올라가 2~3분
```

> **빌드가 멈춘 것처럼 보여도 정상입니다.** Java 5개 서비스가 동시에
> `gradlew --no-daemon`을 돌리는데, 비대화형 터미널이라 진행률이 안 찍힙니다.

### 1-3. 상태 확인

```bash
docker compose ps                    # 10개 모두 Up
open http://localhost:8761           # Eureka — 7개 서비스 등록 확인
```

Eureka에 아래 7개가 보이면 성공입니다.

```
API-GATEWAY  AUTH-SERVER  USER-SERVICE  COURSE-SERVICE
ENROLLMENT-SERVICE  PAYMENT-SERVICE  RECOMMEND-SERVICE
```

### 1-4. 시연용 공고 데이터 넣기

기본 템플릿에는 강의 데이터 2건만 있습니다. 이벤트브릿지 공고 14건(이벤트 6개)을 넣습니다.

```bash
docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < demo-data.sql
```

> `docker compose down -v`로 볼륨까지 지웠다면 **다시 넣어야** 합니다.

---

## 2. 프론트엔드 띄우기

```bash
cd vue-frontend
npm ci            # npm install 아님 — 아래 주의 참고
npm run dev
```

브라우저에서 **http://localhost:3000** 을 엽니다.

> **`npm install` 대신 `npm ci`를 쓰세요.**
> 이 프로젝트를 Slack 등으로 받으면 macOS가 `node_modules`에 격리 속성
> (`com.apple.quarantine`)을 붙여, vite의 네이티브 바이너리 로드가 막힙니다.
> 증상은 `Cannot find native binding`인데 원인은 패키지가 아니라 격리 속성입니다.
> 이미 걸렸다면 `xattr -dr com.apple.quarantine node_modules` 후 다시 실행하세요.

---

## 3. 로그인

로그인 화면 하단 **데모** 버튼으로 계정을 채울 수 있습니다.

| 역할 | 계정 | 비밀번호 |
|---|---|---|
| 참여 업체 | `student@lecture.com` | `password1234` |
| 발주 기관 | `instructor@lecture.com` | `password1234` |

**로그인 버튼 한 번으로 끝납니다.** 업체는 홈, 기관은 콘솔로 들어갑니다.

실습 백엔드에는 비밀번호를 받는 API가 없지만, 인증 서버의 폼 로그인(`POST /login`)은
CSRF 토큰 없이 받습니다. 세션 쿠키만 생기면 `/oauth2/authorize`가 곧바로 코드를 내주므로,
인증 서버 화면에서 같은 계정을 한 번 더 입력할 필요가 없습니다.

- 요청은 vite 프록시 `/authsrv`를 거쳐 **같은 출처**로 나갑니다 (CORS 없이 세션 쿠키가 붙습니다).
- 비밀번호가 틀리면 **이 화면에** 오류가 뜹니다. 8080으로 튕기지 않습니다.
- 프록시가 없거나(빌드 산출물) 백엔드가 안 떠 있으면, 예전처럼 인증 서버 화면으로 넘어갑니다.

역할은 계정의 `users.role`을 따릅니다 — `STUDENT`는 참여 업체, `INSTRUCTOR`는 발주 기관입니다.

역할에 따라 착지와 메뉴가 다릅니다.

| | 로그인 직후 | 상단 메뉴 |
|---|---|---|
| 참여 업체 | 홈 (`/home`) | 공고 찾기 · 카테고리별 · 내 지원 · 이용 안내 |
| 발주 기관 | **콘솔** (`/console`) | 대시보드 · 공고 등록 · 내 정보 |

기관의 일터는 콘솔입니다. 로그인 직후는 물론 `/` 로 들어와도 콘솔로 갑니다.
지원 업체 심사는 대시보드에서 공고를 누르면 열리는 **선정 모달**이 맡습니다.

기관도 공개 화면(`/home`)을 볼 수 있습니다. 기관에게 그 화면은 **‘업체 찾기’**
하나의 뜻만 가집니다 — 문장 검색·지도·추천 업체가 전부 업체를 고르는 도구입니다.
콘솔 왼쪽 위 로고를 누르면 갑니다.

---

## 4. 화면 미리보기 (로그인·백엔드 없이)

개발 모드에서 화면 맨 위에 **미리보기 바**가 뜹니다.

```
SCREEN  업체 · 홈   ROLE [업체][기관]  알림 드로어        [ 화면 선택 ▾ ]  ✕
```

- **화면 선택** — 20개 화면을 바로 엽니다. 버튼을 눌러야 보이던 화면
  (가입 2·3단계, 지원 모달, 공고 등록 2단계, 알림 드로어)도 직접 열립니다.
- **ROLE** — 로그아웃 없이 업체/기관 화면을 전환합니다.
- **✕** 또는 `Ctrl` + `` ` `` — 바를 숨기고 다시 엽니다.

**도커를 안 띄워도, 로그인을 안 해도 모든 화면이 보입니다.** 이때는 시연 데이터로
채워지고 바에 주황색 **"시연 데이터"** 표시가 뜹니다. 발표 리허설이나 팀 리뷰에 쓰세요.

상태는 주소에 실리므로 팀원에게 링크로 바로 공유할 수 있습니다.

```
http://localhost:3000/signup?stage=2g&preview=1        회원가입 ② 기관 정보
http://localhost:3000/postings/1?stage=applied&preview=1   접수 완료 모달
```

미리보기 바는 **`npm run build` 산출물에는 포함되지 않습니다.**

---

## 5. 포트

| 주소 | 용도 |
|---|---|
| http://localhost:3000 | **프론트엔드 (여기로 접속)** |
| http://localhost:8080 | API Gateway — 모든 요청의 단일 입구 |
| http://localhost:8761 | Eureka 대시보드 |
| http://localhost:9000 | Auth Server (**직접 접속 금지**, 아래 참고) |
| 8081 / 8082 / 8083 / 8084 | user / course / enrollment / payment |
| http://localhost:8085/docs | recommend (FastAPI) |
| 3379 | MariaDB |

서비스별 Swagger는 `http://localhost:{8081~8084}/swagger-ui/index.html` 입니다.

> **9000으로 직접 들어가지 마세요.** 토큰의 `issuer`가 `http://localhost:8080`으로
> 고정돼 있어서, 9000으로 로그인하면 접속 경로와 issuer가 어긋납니다.
> 로그인 도중 주소가 `localhost:8080/login`으로 바뀌는 건 정상입니다 —
> 게이트웨이가 `/login`을 auth-server로 넘겨주기 때문입니다.

### 포트를 바꿔야 한다면

프론트엔드는 `vue-frontend/.env` **한 곳**만 고치면 됩니다. `vite.config.js`의
프록시와 개발 서버 포트도 이 값을 읽습니다.

```
VITE_GATEWAY_URL=http://localhost:8080
VITE_REDIRECT_URI=http://localhost:3000/callback
```

단, **콜백 주소(3000)는 auth-server 이미지에 하드코딩**되어 있어 바꿀 수 없습니다.
게이트웨이 포트를 바꾸려면 `docker-compose.yml`의 `JWT_ISSUER_URI` 2곳도 함께 고쳐야 하는데,
auth-server의 issuer는 소스가 없어 수정 불가라 **실질적으로 8080 고정**입니다.

---

## 6. 자주 겪는 문제

**안 될 때 먼저 이것부터**
```bash
cd vue-frontend && npm run doctor
```
Node 버전 · node_modules · macOS 격리 속성 · 포트 3000 · .env · 백엔드까지 한 번에 짚어 줍니다.

**포트 3000이 이미 사용 중**
3000이 막혀 있으면 다음 포트(3001…)로 자동으로 뜹니다. 터미널에 찍히는 주소를 보세요.
다만 **OAuth 로그인은 콜백이 3000으로 고정**이라, 실제 로그인까지 하려면 3000을 비워야 합니다.
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN     # PID 확인 후 종료
```

**공고 목록이 비어 있음**
`demo-data.sql`을 넣었는지 확인하세요 (1-4단계). 볼륨을 지웠다면 다시 넣어야 합니다.

**로그인 후 화면이 비고 로그인으로 되돌아감**
토큰이 만료된 상태입니다. 다시 로그인하면 됩니다. 브라우저 콘솔에서
`sessionStorage.clear()` 후 새로고침해도 됩니다.

**로그인 화면이 안 뜨고 홈으로 감**
이미 로그인된 상태입니다. 우측 상단 이름을 누르면 로그아웃됩니다.

**로그아웃했는데 다시 로그인하면 이전 계정으로 들어감**
인증 서버 세션(JSESSIONID)이 남아 있으면 `/oauth2/authorize`가 로그인 화면 없이
직전 계정의 코드를 곧바로 내줍니다. 로그아웃 시 인증 서버에도 로그아웃을 알리도록
고쳤습니다. 그래도 겪는다면 브라우저 쿠키에서 `localhost`의 `JSESSIONID`를 지우세요.

**로그인해도 8080 화면이 한 번 더 뜸**
백엔드가 안 떠 있거나 개발 서버가 vite 설정 변경을 아직 못 읽은 상태입니다.
`docker compose ps`로 게이트웨이를 확인하고, 개발 서버를 다시 띄우세요.

**Swagger가 500을 반환**
경로가 `/swagger-ui/index.html` 인지 확인하세요. OpenAPI 문서는 `/v3/api-docs`가 아니라
**`/api-docs`** 입니다 (`springdoc.api-docs.path` 설정).

**전부 다시 시작**
```bash
docker compose down -v && docker compose up -d
docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < demo-data.sql
```

---

## 7. AI 검색 (선택)

검색창의 문장을 **우리 필터 축(기간·지역·분야·예산)으로 옮기는 데만** AI를 씁니다.
검색 결과를 고르는 일은 기존 데이터에서 하므로, 없는 공고가 결과에 섞이지 않습니다.

```
"서울이랑 전라에서 홍보 디자인 3천만원 이하로 이번 달 마감"
        ↓  Firebase AI Logic → Gemini
{ period:'이번 달', regions:['서울','전라'],
  categories:['홍보·디자인'], budgets:['3천만 이하'], text:'' }
        ↓  conditionsToFilters → applyFilters
    기존 공고 데이터에서 걸러 낸 결과
```

**팀 저장소를 받으면 바로 동작합니다.** 설정값은 `src/lib/aiSearch.js` 의
`TEAM` 상수에 들어 있어 `.env` 없이도 켜집니다.

> 거기 있는 값은 비밀이 아닙니다. Firebase 웹 설정과 reCAPTCHA 사이트 키는
> 어차피 클라이언트 번들에 실려 브라우저에 노출되는 공개 식별자입니다.
> 호출을 막는 것은 App Check 이고, reCAPTCHA 키의 허용 도메인은 `localhost` 로
> 묶여 있습니다. **reCAPTCHA 비밀 키는 저장소에 없습니다** — Firebase 콘솔에만 있습니다.
> App Check 디버그 토큰은 개발 모드에서만 존재하며 빌드 산출물에는 들어가지 않습니다.

호출이 실패하거나 늦으면(9초) 규칙 기반 파서로 넘어가므로 검색이 멈추지 않습니다
(`composables/useQueryParser.js`).

### 다른 Firebase 프로젝트를 쓰려면

1. Firebase Console에서 프로젝트 생성
2. **AI Logic → Get started → provider를 `Gemini Developer API`로 선택**
   (Spark 무료 플랜 유지, 결제 연결 불필요)
3. 프로젝트 설정 → 내 앱 → 웹 앱 추가 → 아래 값을 `vue-frontend/.env`에

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_APPCHECK_PROVIDER=v3
VITE_FIREBASE_APPCHECK_SITE_KEY=
VITE_GEMINI_MODEL=gemini-flash-latest
```

4. **App Check는 필수입니다.** 없으면 호출이 403으로 막힙니다
   (`This AI Logic Project is inactive`). 위 네 값은 비밀키가 아니라
   공개 식별자라 호출 권한을 App Check가 통제합니다.
   Gemini API 키는 브라우저 코드에 들어가지 않습니다.

   - **reCAPTCHA v3** 를 쓰면 GCP 결제 계정이 필요 없습니다.
     https://www.google.com/recaptcha/admin 에서 v3 키 생성 → 도메인에 `localhost`
     → **비밀 키**는 Firebase App Check 콘솔에, **사이트 키**는 위 `.env` 에.
   - reCAPTCHA Enterprise 를 쓰려면 `VITE_FIREBASE_APPCHECK_PROVIDER=enterprise`.

5. **로컬 개발은 디버그 토큰이 필요합니다.** `npm run dev` 로 띄우고 검색을
   한 번 하면 브라우저 콘솔에 `App Check debug token: <UUID>` 가 찍힙니다.
   그 값을 Firebase Console → App Check → 앱 → ⋮ → **디버그 토큰 관리** 에 등록하세요.
   (`import.meta.env.DEV` 일 때만 켜지므로 빌드 산출물에는 들어가지 않습니다)

### 막혔을 때

브라우저 콘솔에서 마지막 오류와 모델 확인:

```js
const m = await import('/src/lib/aiSearch.js')
m.state.lastError            // 마지막 실패 원인
await m.probeModel('gemini-flash-latest')   // 이 모델 ID 가 사는지
```

| 증상 | 원인 |
|---|---|
| `403 This AI Logic Project is inactive` | AI Logic 온보딩 미완료 또는 디버그 토큰 미등록 |
| `404 no longer available to new users` | 모델 ID 가 만료됨 — `probeModel` 로 다른 ID 확인 |
| `400 enum[0]: cannot be empty` | 스키마 enum 에 빈 문자열 |

> AI가 고를 수 있는 값은 `Schema.enumString` 으로 우리 축의 라벨에 묶여 있습니다.
> '부스설치'처럼 한 글자 다른 값이 와서 조용히 0건이 되는 일을 막습니다.
> 축으로 옮길 수 없는 말(축제명 등)만 `text` 로 받아 이름에서 찾습니다.

---

## 8. 알아둘 제약

프론트엔드는 백엔드를 고치지 않고 만들었습니다. 그래서 남는 제약이 있습니다.

- **지원 업체 목록만 시연 데이터입니다.** `EnrollmentRepository`에 `findByCourseId`가 없어
  "공고별 지원 업체 조회" API가 존재하지 않습니다. 저장소에 메서드가 추가되면
  `views/console/BiddersView.vue`의 `BIDDER_API_READY = true` 한 줄로 실데이터가 됩니다.
- **결제는 항상 성공합니다.** `PaymentService`가 무조건 `COMPLETED`를 돌려주므로
  지원은 접수 직후 곧바로 "선정"으로 바뀝니다.
- **예산 상한은 9,999만원입니다.** `courses.price`가 `decimal(10,2)`입니다.
- 공고의 이벤트·마감일·자격요건은 `courses.description`에 섹션 규약으로 실려 있습니다.
  규약은 `vue-frontend/src/api/posting.js` 맨 위 주석에 있습니다.
