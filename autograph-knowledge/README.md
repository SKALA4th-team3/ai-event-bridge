# 행사 성과·입찰 비교 독립 모듈

기존 시스템에 나중에 붙일 수 있도록 API 계약, 서비스, 저장소 포트, Vue 화면을 분리한 데모입니다.

## 실행

요구 환경: Java 21, Node.js 20 이상

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

- 백엔드: `BidStore`의 JPA 구현체를 추가하고 `InMemoryBidStore` 대신 주입합니다.
- 행사명: `EventPerformanceService`의 데모 행사명을 실제 Event 조회 서비스로 교체합니다.
- 과거 성과: `SeededDemoDataGenerator.history` 호출을 실제 성과 Repository 조회로 교체합니다.
- 프론트: 기존 행사 상세 페이지에 `EventPerformanceModule`을 import하고 `eventId` prop을 전달합니다.
- API 주소: 동일한 계약을 유지하면 프론트 변경이 필요 없습니다. 다른 API 서버라면 Vite proxy 또는 배포 환경의 reverse proxy만 조정합니다.

메모리 입찰은 애플리케이션 재시작 시 초기화됩니다. 초기 3개 업체와 2006~2025 성과는 `eventId`에서 파생한 고정 seed로 매번 동일하게 생성됩니다. 방문객·총비용·순이익 회귀선은 2026까지 이어지며, 2026 재무 포인트는 각 업체의 입찰 금액을 사용합니다.
