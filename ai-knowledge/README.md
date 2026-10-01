# 행사 성과·입찰 비교 독립 모듈

기존 시스템에 나중에 붙일 수 있도록 API 계약, 서비스, 저장소 포트, Vue 화면을 분리한 데모입니다.

## 실행

요구 환경: Java 21, Node.js 20 이상, 루트의 `docker-compose.yml`로 띄운 MariaDB(`lecturedb`, `localhost:3379`)

루트 디렉터리에서 인프라만 먼저 올립니다(이미 띄워져 있다면 생략).

```bash
docker compose up -d mariadb
```

```bash
./gradlew bootRun
```

백엔드는 별도 옵션 없이 `http://localhost:18080`에서 실행됩니다.

별도 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173/events/101`을 엽니다. 다른 seed 데이터는 URL의 `101`을 다른 양의 정수로 바꿔 확인할 수 있습니다.

## API

```text
GET  /api/events/{eventId}/performance
POST /api/events/{eventId}/bids
```

POST 예시:

```bash
curl -X POST http://localhost:18080/api/events/101/bids \
  -H 'Content-Type: application/json' \
  -d '{"companyName":"SK 이벤트","bidAmount":420000000,"expectedRevenue":900000000,"otherCost":100000000}'
```

## 검증

```bash
./gradlew test
cd frontend
npm run build
```

## 실제 시스템 연결 지점

- 백엔드: ✅ `BidStore`의 JPA 구현체(`JpaBidStore`, `@Primary`)가 루트 `docker-compose.yml`의 MariaDB(`lecture_db`)에 `knowledge_bid` 테이블로 연결되어 있습니다. `InMemoryBidStore`는 DB 없이 띄울 때를 위한 참고용으로만 남아 있습니다.
- 과거 성과: ✅ `SeededDemoDataGenerator.historicalData`가 `knowledge_event_performance` 테이블을 먼저 조회합니다. 해당 `eventId`에 저장된 행이 있으면 그 값을 쓰고, 없으면 기존 고정 seed 난수로 폴백합니다(테스트/데모 편의 목적).
- 행사명: ⬜ 아직 미연결. `EventPerformanceService`가 `"지역축제 #" + eventId`로 이름을 즉석 생성합니다 — 실제 Event 조회 서비스로 교체가 필요합니다.
- 프론트: ⬜ 아직 미연결. 기존 행사 상세 페이지에 `EventPerformanceModule`을 import하고 `eventId` prop을 전달해야 합니다.
- API 주소: 동일한 계약을 유지하면 프론트 변경이 필요 없습니다. 다른 API 서버라면 Vite proxy 또는 배포 환경의 reverse proxy만 조정합니다.

### DB 스키마

기존 `courses`/`enrollments`/`users`/`payments` 테이블은 건드리지 않고, `knowledge_` 접두사로 별도 테이블만 씁니다(`spring.jpa.hibernate.ddl-auto: update`로 자동 생성).

```text
knowledge_event_performance (event_id, year, visitors, cost, revenue, net_profit)   -- 연도별 실제 성과
knowledge_bid               (event_id, display_id, company_name, bid_amount, ...)   -- 실제로 접수된 입찰
```

`demo-data/knowledge-seed.sql`에 테스트용 고정 데이터(이벤트 101, 102에 2006~2025년 20개년 성과)가 들어 있습니다.

```bash
docker exec -i lecturedb mariadb -umanager -pSqlDba-1 lecture_db < demo-data/knowledge-seed.sql
```

입력 후 `GET /api/events/101/performance`는 더 이상 난수가 아니라 이 고정 데이터를 돌려주므로, 반복 가능한 시연·테스트가 가능합니다. 시드를 넣지 않은 다른 `eventId`는 지금처럼 난수 폴백으로 동작합니다.

메모리 입찰은 더 이상 재시작 시 초기화되지 않습니다(DB에 영속). 초기 3개 업체(`한빛이벤트` 등)는 여전히 `eventId` 기반 고정 seed로 매 요청마다 동일하게 생성되는 표시용 데이터입니다. 방문객·총비용·순이익 회귀선은 2026까지 이어지며, 2026 재무 포인트는 각 업체의 입찰 금액을 사용합니다.
