-- EventBridge 초기 DDL: 코드의 Course/Enrollment 명칭은 유지한다.
-- Spring JPA ddl-auto: update 로도 생성되지만
-- 명시적 DDL로 테이블 선후 관계를 문서화

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    role        VARCHAR(20)     NOT NULL COMMENT 'STUDENT | INSTRUCTOR',
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기관 담당자가 공고(Course)를 등록 (instructor_id → users.id)
CREATE TABLE IF NOT EXISTS courses (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    title            VARCHAR(255)    NOT NULL,
    description      TEXT,
    category         VARCHAR(50)     NOT NULL COMMENT 'BACKEND|FRONTEND|DEVOPS|DATA_SCIENCE|MOBILE|SECURITY|DATABASE|OTHER',
    price            DECIMAL(10,2)   NOT NULL,
    instructor_id    BIGINT          NOT NULL,
    enrollment_count INT             NOT NULL DEFAULT 0,
    status           VARCHAR(20)     NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | PUBLISHED | OPEN | CLOSED | AWARDED | COMPLETED | CANCELLED',
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    PRIMARY KEY (id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 업체가 지원(Enrollment) (user_id → users.id, course_id → courses.id)
CREATE TABLE IF NOT EXISTS enrollments (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    course_id   BIGINT      NOT NULL,
    bid_amount  DECIMAL(15,2),
    proposal    TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'SUBMITTED | UNDER_REVIEW | AWARDED | NOT_AWARDED | WITHDRAWN',
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_course (user_id, course_id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 지급 예정 금액/낙찰 처리 기록
CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    course_id       BIGINT          NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | COMPLETED | FAILED | CANCELLED',
    transaction_id  VARCHAR(255)    UNIQUE,
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id)   REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 기존 볼륨에 이미 생성된 테이블도 최신 Enrollment 엔티티와 맞춘다.
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(15,2) NULL AFTER course_id;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS proposal TEXT NULL AFTER bid_amount;

-- 시연 데이터: 명시적 PK와 INSERT IGNORE를 사용하므로 기존 행을 변경하지 않는다.
-- password 컬럼은 BCrypt('password') 해시다.
INSERT IGNORE INTO users (id, email, password, name, role, created_at, updated_at) VALUES
(1, 'admin1@festival.go.kr', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '서울문화재단', 'INSTRUCTOR', NOW(), NOW()),
(2, 'admin2@festival.go.kr', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '부산관광공사', 'INSTRUCTOR', NOW(), NOW()),
(3, 'admin3@festival.go.kr', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '대전문화재단', 'INSTRUCTOR', NOW(), NOW()),
(4, 'admin4@festival.go.kr', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '진주시청', 'INSTRUCTOR', NOW(), NOW()),
(5, 'admin5@festival.go.kr', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '전주시청', 'INSTRUCTOR', NOW(), NOW()),
(6, 'company01@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '한빛무대', 'STUDENT', NOW(), NOW()),
(7, 'company02@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '그린이벤트', 'STUDENT', NOW(), NOW()),
(8, 'company03@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '온누리안전', 'STUDENT', NOW(), NOW()),
(9, 'company04@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '미디어웨이브', 'STUDENT', NOW(), NOW()),
(10, 'company05@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '다온디자인', 'STUDENT', NOW(), NOW()),
(11, 'company06@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '코리아렌탈', 'STUDENT', NOW(), NOW()),
(12, 'company07@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '해든케이터링', 'STUDENT', NOW(), NOW()),
(13, 'company08@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '새봄전시', 'STUDENT', NOW(), NOW()),
(14, 'company09@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '동행기획', 'STUDENT', NOW(), NOW()),
(15, 'company10@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '더나은광고', 'STUDENT', NOW(), NOW()),
(16, 'company11@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '플랜에이', 'STUDENT', NOW(), NOW()),
(17, 'company12@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '빛소리기술', 'STUDENT', NOW(), NOW()),
(18, 'company13@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '아트컴퍼니', 'STUDENT', NOW(), NOW()),
(19, 'company14@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '스마트가드', 'STUDENT', NOW(), NOW()),
(20, 'company15@example.com', '$2a$10$txbS16fwCF2aM2Lks6zZ0ep2kBVmRdrku5xYG6NLrFPyK2blT.sIO', '축제랩', 'STUDENT', NOW(), NOW());

INSERT IGNORE INTO courses (id, title, description, category, price, instructor_id, enrollment_count, status, created_at, updated_at) VALUES
(1, '한강 여름축제 주무대 설치', '서울 한강 여름축제 주무대·음향 설치 및 운영', 'FRONTEND', 68000000, 1, 3, 'OPEN', NOW(), NOW()),
(2, '한강 여름축제 부스 설치', '홍보·체험 부스 60동 설치와 철거', 'BACKEND', 42000000, 1, 2, 'OPEN', NOW(), NOW()),
(3, '한강 여름축제 안전관리', '행사장 안전요원과 동선 관리', 'DEVOPS', 29000000, 1, 1, 'PUBLISHED', NOW(), NOW()),
(4, '부산 불꽃축제 영상 제작', '4K 다원 중계와 하이라이트 영상 제작', 'SECURITY', 59000000, 2, 2, 'OPEN', NOW(), NOW()),
(5, '부산 불꽃축제 관람석 설치', '광안리 관람석·VIP 부스 설치', 'BACKEND', 72000000, 2, 1, 'CLOSED', NOW(), NOW()),
(6, '부산 불꽃축제 안내 인력', '다국어 안내와 현장 운영 인력 배치', 'DATA_SCIENCE', 24000000, 2, 0, 'PUBLISHED', NOW(), NOW()),
(7, '대전 과학축제 체험존', '과학 체험 부스와 안전설비 시공', 'BACKEND', 37500000, 3, 2, 'OPEN', NOW(), NOW()),
(8, '대전 과학축제 홍보물', '포스터·리플릿·SNS 홍보물 제작', 'MOBILE', 18000000, 3, 1, 'OPEN', NOW(), NOW()),
(9, '대전 과학축제 장비 렌탈', '체험 장비와 전기 설비 렌탈', 'DATABASE', 31000000, 3, 0, 'DRAFT', NOW(), NOW()),
(10, '진주 유등축제 전시 부스', '남강변 유등 전시 부스 설치', 'BACKEND', 48000000, 4, 2, 'OPEN', NOW(), NOW()),
(11, '진주 유등축제 무대 운영', '개폐막식 무대·음향 운영', 'FRONTEND', 54000000, 4, 1, 'CLOSED', NOW(), NOW()),
(12, '진주 유등축제 행사 인력', '안내·티켓·주차 운영 인력 배치', 'DATA_SCIENCE', 26000000, 4, 0, 'PUBLISHED', NOW(), NOW()),
(13, '전주 비빔밥축제 체험 무대', '요리 체험 무대와 조리대 설치', 'FRONTEND', 39000000, 5, 2, 'OPEN', NOW(), NOW()),
(14, '전주 비빔밥축제 의무실', '행사장 안전인력과 임시 의무실 운영', 'DEVOPS', 24500000, 1, 1, 'OPEN', NOW(), NOW()),
(15, '강릉 커피축제 시음존', '커피 시음존 부스와 위생설비 설치', 'BACKEND', 31000000, 2, 0, 'PUBLISHED', NOW(), NOW()),
(16, '강릉 커피축제 케이터링', '내빈·스태프 케이터링 운영', 'DATABASE', 22000000, 3, 0, 'DRAFT', NOW(), NOW()),
(17, '수원 화성문화제 조명', '야간 경관 조명과 전기 설비 운영', 'SECURITY', 46000000, 4, 1, 'OPEN', NOW(), NOW()),
(18, '수원 화성문화제 퍼레이드', '퍼레이드 동선과 관람 구역 설치', 'OTHER', 35500000, 5, 1, 'OPEN', NOW(), NOW()),
(19, '제주 들불축제 무대', '야외 무대 설치와 음향 운영', 'FRONTEND', 51000000, 1, 0, 'CANCELLED', NOW(), NOW()),
(20, '제주 들불축제 안전관리', '안전요원 배치와 응급 대응 체계 운영', 'DEVOPS', 27000000, 2, 0, 'COMPLETED', NOW(), NOW());

INSERT IGNORE INTO enrollments (id, user_id, course_id, bid_amount, proposal, status, created_at, updated_at) VALUES
(1, 6, 1, 65000000, '주무대 설치 및 음향 운영 제안서', 'SUBMITTED', NOW(), NOW()),
(2, 7, 1, 63000000, '행사 운영 인력 포함 제안서', 'UNDER_REVIEW', NOW(), NOW()),
(3, 8, 2, 40000000, '체험 부스 설치 제안서', 'SUBMITTED', NOW(), NOW()),
(4, 9, 4, 57000000, '4K 중계 운영 제안서', 'UNDER_REVIEW', NOW(), NOW()),
(5, 10, 5, 71000000, 'VIP 관람석 시공 제안서', 'AWARDED', NOW(), NOW()),
(6, 11, 7, 36000000, '과학 체험존 설비 제안서', 'SUBMITTED', NOW(), NOW()),
(7, 12, 8, 17500000, '홍보물 제작 제안서', 'SUBMITTED', NOW(), NOW()),
(8, 13, 10, 47000000, '유등 전시 부스 제안서', 'UNDER_REVIEW', NOW(), NOW()),
(9, 14, 11, 52000000, '개폐막식 운영 제안서', 'NOT_AWARDED', NOW(), NOW()),
(10, 15, 13, 38000000, '체험 무대 제안서', 'SUBMITTED', NOW(), NOW()),
(11, 16, 14, 24000000, '의무실 운영 제안서', 'SUBMITTED', NOW(), NOW()),
(12, 17, 17, 45000000, '경관 조명 제안서', 'UNDER_REVIEW', NOW(), NOW()),
(13, 18, 18, 34000000, '퍼레이드 설치 제안서', 'SUBMITTED', NOW(), NOW()),
(14, 19, 1, 67000000, '한강 축제 무대 제안서', 'WITHDRAWN', NOW(), NOW()),
(15, 20, 2, 41000000, '한강 부스 제안서', 'SUBMITTED', NOW(), NOW()),
(16, 6, 4, 58000000, '불꽃축제 중계 제안서', 'SUBMITTED', NOW(), NOW()),
(17, 7, 7, 35000000, '과학축제 체험 제안서', 'WITHDRAWN', NOW(), NOW()),
(18, 8, 10, 46500000, '유등축제 전시 제안서', 'SUBMITTED', NOW(), NOW()),
(19, 9, 13, 38500000, '비빔밥축제 무대 제안서', 'UNDER_REVIEW', NOW(), NOW()),
(20, 10, 17, 45500000, '화성문화제 조명 제안서', 'SUBMITTED', NOW(), NOW());

INSERT IGNORE INTO payments (id, user_id, course_id, amount, status, transaction_id, created_at, updated_at) VALUES
(1, 6, 1, 65000000, 'PENDING', 'seed-payment-001', NOW(), NOW()), (2, 7, 1, 63000000, 'PENDING', 'seed-payment-002', NOW(), NOW()),
(3, 8, 2, 40000000, 'PENDING', 'seed-payment-003', NOW(), NOW()), (4, 9, 4, 57000000, 'PENDING', 'seed-payment-004', NOW(), NOW()),
(5, 10, 5, 71000000, 'COMPLETED', 'seed-payment-005', NOW(), NOW()), (6, 11, 7, 36000000, 'PENDING', 'seed-payment-006', NOW(), NOW()),
(7, 12, 8, 17500000, 'PENDING', 'seed-payment-007', NOW(), NOW()), (8, 13, 10, 47000000, 'PENDING', 'seed-payment-008', NOW(), NOW()),
(9, 14, 11, 52000000, 'FAILED', 'seed-payment-009', NOW(), NOW()), (10, 15, 13, 38000000, 'PENDING', 'seed-payment-010', NOW(), NOW()),
(11, 16, 14, 24000000, 'PENDING', 'seed-payment-011', NOW(), NOW()), (12, 17, 17, 45000000, 'PENDING', 'seed-payment-012', NOW(), NOW()),
(13, 18, 18, 34000000, 'PENDING', 'seed-payment-013', NOW(), NOW()), (14, 19, 1, 67000000, 'CANCELLED', 'seed-payment-014', NOW(), NOW()),
(15, 20, 2, 41000000, 'PENDING', 'seed-payment-015', NOW(), NOW()), (16, 6, 4, 58000000, 'PENDING', 'seed-payment-016', NOW(), NOW()),
(17, 7, 7, 35000000, 'CANCELLED', 'seed-payment-017', NOW(), NOW()), (18, 8, 10, 46500000, 'PENDING', 'seed-payment-018', NOW(), NOW()),
(19, 9, 13, 38500000, 'PENDING', 'seed-payment-019', NOW(), NOW()), (20, 10, 17, 45500000, 'PENDING', 'seed-payment-020', NOW(), NOW());
