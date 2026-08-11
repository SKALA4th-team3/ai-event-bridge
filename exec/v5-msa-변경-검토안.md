# 기능 명세서 v5 — MSA 백엔드 변경 검토안

작성일: 2026-08-11  
상태: **검토 대기 — 기존 파일은 변경하지 않음**

## 결론

현재 구현은 `강의(Course) / 수강신청(Enrollment) / 결제(Payment)` 모델이며, 명세 v5는
`공고(Event) / 입찰(Apply) / 낙찰(Award)` 모델이다. 같은 URL(`GET/POST /api/courses` 등)을
서로 다른 의미로 사용하므로, 새 컨트롤러를 단순 추가하면 Spring의 매핑 충돌로 기동하지 못한다.

따라서 아래의 **기존 파일 교체·수정**이 필요하다. 사용자 검토 전에는 어느 파일도 수정하지 않았다.

| 서비스 | 명세상 책임 | 변경 대상 |
| --- | --- | --- |
| user-service | 가입, 내 정보, 기관/업체 프로필 | `User`, `UserDto`, `UserService`, `UserController`, DDL |
| course-service → event 책임 | 공고 CRUD와 상태 전이 | `Course*` 전반, DDL |
| enrollment-service → apply 책임 | 입찰 제출/수정/취소 | `Enrollment*` 전반, DDL |
| payment-service → award 책임 | 낙찰 확정과 결과 조회 | `Payment*` 전반, DDL |
| recommend-service | OPEN 공고 추천 | Python 모델/라우터/두 내부 클라이언트 |
| gateway/auth-server | 역할 인가와 토큰 발급 | 별도 이미지 소스가 저장소에 없어 추가 소스 또는 이미지 교체 필요 |

## 데이터 모델 제안

기존 테이블을 재사용하지 않고 아래 v5 테이블을 추가한다. 기존 데이터 및 강의 기능을 보존하기 위해
테이블 이름도 분리한다.

```sql
CREATE TABLE event_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  role VARCHAR(20) NOT NULL COMMENT 'ADMIN|COMPANY',
  organization_name VARCHAR(255), department VARCHAR(100), contact_person VARCHAR(100),
  business_field VARCHAR(100), annual_order_volume DECIMAL(15,2),
  company_name VARCHAR(255), business_registration_no VARCHAR(30), industry VARCHAR(100),
  service_regions VARCHAR(500), workforce_count INT,
  refresh_token_hash VARCHAR(255), created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL
);

CREATE TABLE event_notices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT NOT NULL, title VARCHAR(255) NOT NULL, organization_name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL, field VARCHAR(100) NOT NULL, budget DECIMAL(15,2) NOT NULL,
  project_start_date DATE, project_end_date DATE, application_deadline DATETIME(6) NOT NULL,
  contract_method VARCHAR(100), task_description TEXT NOT NULL, eligibility_requirements TEXT,
  required_workforce INT, status VARCHAR(20) NOT NULL COMMENT 'DRAFT|PUBLISHED|OPEN|CLOSED|AWARDED|COMPLETED|CANCELLED',
  created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
  INDEX ix_event_notices_listing (status, region, field, application_deadline),
  INDEX ix_event_notices_admin (admin_id)
);

CREATE TABLE bid_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL, company_id BIGINT NOT NULL, apply_amount DECIMAL(15,2) NOT NULL,
  business_plan_url VARCHAR(1000), proposal_summary TEXT,
  status VARCHAR(20) NOT NULL COMMENT 'SUBMITTED|UNDER_REVIEW|AWARDED|NOT_AWARDED|WITHDRAWN',
  created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL,
  UNIQUE KEY uq_bid_applications_event_company (event_id, company_id),
  INDEX ix_bid_applications_company (company_id), INDEX ix_bid_applications_event_status (event_id, status)
);

CREATE TABLE awards (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_id BIGINT NOT NULL UNIQUE, apply_id BIGINT NOT NULL UNIQUE, company_id BIGINT NOT NULL,
  scheduled_amount DECIMAL(15,2) NOT NULL, award_reason TEXT NOT NULL,
  awarded_at DATETIME(6) NOT NULL, created_at DATETIME(6) NOT NULL, updated_at DATETIME(6) NOT NULL
);
```

## API 구현 규칙

모든 외부 API는 Gateway가 검증해 전달하는 다음 헤더를 사용한다.

```text
X-User-Id: 42
X-User-Role: ADMIN | COMPANY
```

응답은 기존 프런트와 호환되는 `{ success, message, data }` 래퍼를 사용한다. 인증/권한 오류는
각각 401/403, 소유자·상태·중복 규칙 위반은 400 또는 409로 통일한다.

### Event 상태 전이

```text
DRAFT --open--> PUBLISHED --publish--> OPEN --close--> CLOSED
CLOSED --award--> AWARDED --complete--> COMPLETED
PUBLISHED|OPEN|CLOSED --cancel--> CANCELLED  (정책 결정 후 노출)
```

`close`는 Apply 서비스에 `POST /internal/events/{eventId}/under-review`를 호출하거나 Kafka
`event.closed` 이벤트를 발행하여 `SUBMITTED → UNDER_REVIEW`를 일괄 전이시킨다. 동기 호출 실패로
이벤트 상태만 닫히는 것을 막기 위해 운영 구현에서는 outbox 패턴을 권장한다.

### Apply 규칙

1. `POST /api/courses/{eventId}/enrollments`는 COMPANY만 허용한다.
2. Event 서비스에서 공고 상태가 `OPEN`이며 deadline 이전임을 조회한다.
3. `(event_id, company_id)` 유니크 제약으로 동시 중복 지원도 차단한다.
4. 수정·취소는 본인, `SUBMITTED`, deadline 이전일 때만 허용한다.

### Award 트랜잭션 규칙

`POST /api/courses/{eventId}/payments`에서 다음 순서를 단일 saga로 처리한다.

1. Event가 `CLOSED`, 요청자가 공고 ADMIN인지 확인한다.
2. 선택 Apply가 해당 공고의 `UNDER_REVIEW`인지 확인한다.
3. Award를 idempotency key(`eventId`)로 생성한다.
4. 선택 Apply는 `AWARDED`, 같은 공고의 나머지 `UNDER_REVIEW`는 `NOT_AWARDED`로 전이한다.
5. Event는 `AWARDED`로 전이한다.

어느 단계라도 실패하면 재시도 가능한 보상 이벤트를 남긴다. Award 서비스 DB 트랜잭션만으로
다른 서비스 DB를 원자적으로 묶지 않는다.

## 적용할 컨트롤러 시그니처

아래는 기존 구현을 대체할 때의 외부 경로 목록이다. `courses`, `enrollments`, `payments`라는
경로 이름은 명세 호환을 위해 유지하되 내부 클래스명은 `Event`, `Apply`, `Award`로 변경한다.

```java
// EventController: /api/courses
POST   /api/courses
GET    /api/courses?region=&field=&minBudget=&maxBudget=&deadlineFrom=&deadlineTo=
GET    /api/courses/{eventId}
PATCH  /api/courses/{eventId}
DELETE /api/courses/{eventId}
POST   /api/courses/{eventId}/open
POST   /api/courses/{eventId}/publish
POST   /api/courses/{eventId}/close
GET    /api/courses/enrollments
POST   /api/courses/{eventId}/complete

// ApplyController
POST   /api/courses/{eventId}/enrollments
GET    /api/enrollments/{applyId}
PATCH  /api/enrollments/{applyId}
DELETE /api/enrollments/{applyId}
GET    /api/companies/me/enrollments

// AwardController
POST   /api/courses/{eventId}/payments
GET    /api/courses/{eventId}/payments

// UserController
POST   /api/users/signup
POST   /api/users/login
POST   /api/users/logout
GET    /api/users/verify
POST   /api/users/refresh
GET    /api/users/me
PATCH  /api/users/me
GET    /api/admins/me/courses

// RecommendController
GET    /api/recommend/courses
```

## 필요한 파일별 변경안

1. `init-db/02_event_bridge_v5.sql`을 **새 파일로 추가**한다. 위 네 테이블 DDL과 인덱스를 넣는다.
2. 각 Java 서비스에 기존 강의 모델을 덮어쓰지 않는 새 패키지(`event`, `apply`, `award`, `profile`)를
   추가한다.
3. 기존 `CourseController`, `EnrollmentController`, `PaymentController`는 위 명세 컨트롤러로
   **교체**해야 한다. 동일한 Spring mapping은 공존 불가하다.
4. `auth-server`, `api-gateway`는 현재 Docker image만 있고 소스가 없다. 가입/로그인/역할 클레임을
   지원하는 이미지 또는 해당 소스가 필요하다.
5. `docker-compose.yml`은 새 DDL 및 서비스 환경변수/게이트웨이 라우팅을 반영해야 한다.
6. `recommend-service`는 `OPEN` 공고와 회사 프로필·기존 지원 이력을 조회하도록 Python client와
   score 모델을 교체한다. 최대 5건, 마감 임박 순 정렬, 이미 지원한 공고 제외가 필수다.

## 확인이 필요한 정책

- `DRAFT`는 본문에 “최초 상태 DRAFT”와 “DRAFT 제거”가 함께 있어, 구현 전 유지 여부를 결정해야 한다.
  본 검토안은 공고 등록 후 검토/수정이 가능하도록 `DRAFT` 유지안을 사용했다.
- 기관 도메인 검증은 `@*.go.kr` 표기상 서브도메인을 포함한 `^[^@]+@([^.@]+\\.)*go\\.kr$`로 제안한다.
- `CANCELLED` 공고의 외부 노출 여부, 그리고 입찰 금액의 통화/부가세 포함 여부가 필요하다.
- 파일 업로드는 URL/저장 키만 보관한다. 실제 파일 저장소(S3/MinIO) 범위는 아직 명세에 없다.

## 검증 계획

- 서비스 단위: 역할, 소유자, 모든 상태 전이, 중복 입찰, 마감 시각 경계 테스트
- 통합: OPEN 공고 지원 → CLOSE → AWARD → COMPLETE 전체 흐름
- 동시성: 같은 회사의 동일 공고 동시 지원과 낙찰 요청 중복 재시도
- 계약: Vue API 응답과 `{success,message,data}` 및 필드명 스냅샷 비교

승인 후 위 순서대로 신규 코드와 필요한 기존 파일 교체를 적용한다.
