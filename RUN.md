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

---

## 4. 화면 미리보기 (로그인·백엔드 없이)

개발 모드에서 화면 맨 위에 **미리보기 바**가 뜹니다.

```
SCREEN  업체 · 홈   ROLE [업체][기관]  알림 드로어        [ 화면 선택 ▾ ]  ✕
```

- **화면 선택** — 19개 화면을 바로 엽니다. 버튼을 눌러야 보이던 화면
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

## 7. 알아둘 제약

프론트엔드는 백엔드를 고치지 않고 만들었습니다. 그래서 남는 제약이 있습니다.

- **지원 업체 목록만 시연 데이터입니다.** `EnrollmentRepository`에 `findByCourseId`가 없어
  "공고별 지원 업체 조회" API가 존재하지 않습니다. 저장소에 메서드가 추가되면
  `views/console/BiddersView.vue`의 `BIDDER_API_READY = true` 한 줄로 실데이터가 됩니다.
- **결제는 항상 성공합니다.** `PaymentService`가 무조건 `COMPLETED`를 돌려주므로
  지원은 접수 직후 곧바로 "선정"으로 바뀝니다.
- **예산 상한은 9,999만원입니다.** `courses.price`가 `decimal(10,2)`입니다.
- 공고의 이벤트·마감일·자격요건은 `courses.description`에 섹션 규약으로 실려 있습니다.
  규약은 `vue-frontend/src/api/posting.js` 맨 위 주석에 있습니다.
