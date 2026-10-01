# 행사 성과·입찰 비교 독립 모듈

기존 시스템에 나중에 붙일 수 있도록 API 계약, 서비스, 저장소 포트, Vue 화면을 분리한 데모로 시작했지만,
지금은 루트 MSA 스택(course/enrollment/user-service)과 실제로 연동되고, 실제 입찰 데이터를 근거로
로컬 LLM(Qwen, Ollama)이 업체를 비교·추천하는 수준까지 올라와 있습니다. 아래 "실제 시스템 연결 지점"에서
무엇이 실제고 무엇이 아직 데모인지 정확히 구분해 둡니다.

## 실행

요구 환경: Java 21, Node.js 20 이상, 루트 `docker-compose.yml`의 MariaDB·Kafka, 로컬 [Ollama](https://ollama.com)

### 1. 인프라

루트 디렉터리에서:

```bash
docker compose up -d mariadb kafka
ollama serve &              # 이미 떠 있다면 생략
ollama pull qwen3.5:4b      # 이미 받아져 있다면 생략
```

### 2. (선택) course/enrollment/user-service를 실제로 붙이려면

ai-knowledge는 이 서비스들이 꺼져 있어도 동작합니다(데모 폴백). 실제 공고·입찰 연동과 AI 업체 비교
에이전트까지 보려면 아래도 각자 다른 터미널에서 띄웁니다(루트 `docker-compose.yml`의 `auth-server`
이미지가 없어도, 서비스 자체는 DB만 있으면 직접 기동됩니다).

```bash
cd user-service       && SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:3379/lecture_db ./gradlew bootRun
cd course-service     && SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:3379/lecture_db ./gradlew bootRun
cd enrollment-service && SPRING_DATASOURCE_URL=jdbc:mariadb://localhost:3379/lecture_db SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 ./gradlew bootRun
```

### 3. ai-knowledge 백엔드

```bash
./gradlew bootRun
```

`http://localhost:18080`에서 실행됩니다.

### 4. 프론트

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/events/1`을 엽니다(`1`은 루트 DB에 실재하는 courseId — "한강
여름축제 주무대 설치"). 실제 공고와 연결되면 화면에 "course-service 실제 공고 연동됨" 배지와
"AI 업체 비교 실행" 버튼이 뜹니다. 101, 102처럼 실재하지 않는 id는 지금까지와 같은 데모 데이터로
표시됩니다(다른 양의 정수도 데모로 동작).

## API

```text
GET  /api/events/{eventId}/performance        -- 연도별 성과 + 입찰 비교 (데모/실데이터 자동 판별)
POST /api/events/{eventId}/bids                -- 데모 입찰 등록 (DB에 영속)
GET  /api/events/{eventId}/vendor-comparison   -- 로컬 LLM 업체 비교 에이전트 (실제 공고만, 아니면 409)
```

POST 예시:

```bash
curl -X POST http://localhost:18080/api/events/101/bids \
  -H 'Content-Type: application/json' \
  -d '{"companyName":"SK 이벤트","bidAmount":420000000,"expectedRevenue":900000000,"otherCost":100000000}'
```

AI 업체 비교 예시 (courseId=1에 실제로 입찰한 업체 3곳을 로컬 Qwen이 비교):

```bash
curl http://localhost:18080/api/events/1/vendor-comparison
```

```json
{
  "eventId": 1,
  "eventName": "한강 여름축제 주무대 설치",
  "linkedToRealCourse": true,
  "recommendedCompany": "한빛무대",
  "reasoning": "예산 절감 실적과 음향·설치 전문성을 모두 갖춘 최상위권 업체...",
  "scores": [
    {"companyName": "한빛무대", "score": 92, "comment": "..."},
    {"companyName": "그린이벤트", "score": 58, "comment": "..."},
    {"companyName": "스마트가드", "score": 65, "comment": "..."}
  ],
  "model": "qwen3.5:4b"
}
```

실제 공고가 아닌 eventId(예: 101)나 아직 지원 업체가 없는 공고는 409를 돌려줍니다.

## 검증

```bash
./gradlew test
cd frontend
npm run build
```

테스트는 H2(인메모리)로 동작하므로 MariaDB/Ollama 없이도 통과합니다. 실제 DB·서비스 연동·LLM 호출은
위 "실행" 절차로 직접 띄워서 수동 검증했습니다(2026-10-02, courseId 1/9/101로 정상/409 케이스 확인).

## 실제 시스템 연결 지점

README가 원래 제시했던 5개 연결 지점 중 상태:

- 백엔드(BidStore): ✅ `JpaBidStore`(`@Primary`)가 `knowledge_bid` 테이블에 영속화. `InMemoryBidStore`는 DB 없이 띄울 때를 위한 참고용으로만 남아 있음.
- 과거 성과: ✅ `SeededDemoDataGenerator.historicalData`가 `knowledge_event_performance` 테이블을 먼저 조회, 없으면 기존 난수 폴백.
- 행사명: ✅ `CourseServiceClient`가 course-service `GET /api/courses/{id}`를 호출. 실제 공고면 진짜 제목, 아니면 `"지역축제 #" + eventId` 데모 이름.
- 실제 입찰: ✅ `EnrollmentServiceClient` + `UserServiceClient`가 enrollment/user-service에서 실제 지원 현황·업체명을 가져와 `realBids`에 담음(금액 외 항목은 추정하지 않음 — 서버 ROI 비교용 `bids`와는 별개 필드).
- 프론트: ✅ `EventPerformanceModule.vue`가 `linkedToRealCourse`일 때 실제 지원 현황 테이블과 AI 업체 비교 버튼을 보여줌.
- API 주소: 동일한 계약을 유지하면 프론트 변경이 필요 없습니다. 다른 API 서버라면 Vite proxy 또는 배포 환경의 reverse proxy만 조정합니다.

### AI 업체 비교 에이전트 (신규)

`AiReadinessPanel`이 그리던 "향후 Agent가 업체를 비교 분석한다"는 구상을 실제로 호출되게 만든 것이
`VendorComparisonAgentService`입니다.

- 모델: 로컬 [Ollama](https://ollama.com) + `qwen3.5:4b`. API 키 불필요, 비용 0원. (`agent.ollama.*`로 주소/모델 교체 가능)
- 입력: eventId가 실제 courseId와 매칭되면 그 공고에 실제로 지원한 업체들의 **실제 입찰 금액·제안서**(enrollment-service) + **과거 수행 평가 문서**(`knowledge_vendor_document`, 아래 참고)를 그대로 프롬프트에 넣음.
- eventId가 실제 공고와 연결되지 않았거나 지원 업체가 없으면 409 — 가짜 데이터로 에이전트를 돌리지 않음.
- Ollama가 꺼져 있으면 503(`AgentUnavailableException`).

과거 수행 평가 문서는 테스트를 위해 작성한 가상 데이터입니다(4건, `demo-data/knowledge-vendor-documents.sql`).
회사명은 루트 `init-db/01_init.sql`에 실재하는 업체(한빛무대·그린이벤트·스마트가드·온누리안전)와 맞춰 뒀습니다.

```bash
docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < demo-data/knowledge-vendor-documents.sql
```

### DB 스키마

기존 `courses`/`enrollments`/`users`/`payments` 테이블은 건드리지 않고, `knowledge_` 접두사로 별도 테이블만 씁니다(`spring.jpa.hibernate.ddl-auto: update`로 자동 생성).

```text
knowledge_event_performance (event_id, event_year, visitors, cost, revenue, net_profit)   -- 연도별 실제 성과
knowledge_bid               (event_id, display_id, company_name, bid_amount, ...)         -- 실제로 접수된 입찰
knowledge_vendor_document   (company_name, title, content)                                 -- 업체 비교 에이전트용 평가 문서
```

`demo-data/knowledge-seed.sql`에 테스트용 고정 데이터(이벤트 101, 102에 2006~2025년 20개년 성과)가 들어 있습니다.

```bash
docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < demo-data/knowledge-seed.sql
```

입력 후 `GET /api/events/101/performance`는 더 이상 난수가 아니라 이 고정 데이터를 돌려주므로, 반복 가능한 시연·테스트가 가능합니다. 시드를 넣지 않은 다른 `eventId`는 지금처럼 난수 폴백으로 동작합니다.

메모리 입찰은 더 이상 재시작 시 초기화되지 않습니다(DB에 영속). 초기 3개 업체(`한빛이벤트` 등)는 여전히 `eventId` 기반 고정 seed로 매 요청마다 동일하게 생성되는 표시용 데이터입니다. 방문객·총비용·순이익 회귀선은 2026까지 이어지며, 2026 재무 포인트는 각 업체의 입찰 금액을 사용합니다.

## 아직 남은 것

- course/enrollment/user-service는 Eureka·API Gateway를 거치지 않고 포트로 직접 호출합니다(`services.*.base-url`). 루트 `docker-compose.yml`에 ai-knowledge를 정식으로 편입하거나 Eureka에 등록하는 건 다음 단계입니다.
- `knowledge_vendor_document`는 4개 업체분만 가상으로 채워져 있습니다. 실제 평가 데이터가 쌓이면 그걸로 교체하면 됩니다.
- 에이전트는 단건 비교 호출(synchronous)입니다. 다건 공고를 한 번에 비교하거나 과거 호출 이력을 저장하는 기능은 없습니다.
