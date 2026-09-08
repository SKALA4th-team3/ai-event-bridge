# MSA 실습 프로젝트

마이크로서비스 아키텍처(MSA)의 구성과 서비스 간 연동을 학습하기 위한 실습 프로젝트입니다.

> **교육용 프로젝트 안내**
>
> 본 프로젝트의 코드는 교육 목적으로만 제공됩니다. 완성된 상용 버전이 아니며, 실제 서비스에 적용하려면 배포 목적과 운영 환경에 맞는 보완이 필요합니다.
>
> 문의: Sungryel Lim, Ph.D. · [audit@korea.ac.kr](mailto:audit@korea.ac.kr)

## 서비스 기동 구조

각 서비스는 Docker Compose의 `depends_on` 설정을 기준으로 다음 순서로 기동됩니다.

```text
MariaDB · Kafka
       ↓
Eureka Server
       ↓
Auth Server
       ↓
API Gateway · User · Course · Enrollment · Payment
       ↓
Recommend Service
```

## 백엔드 실행

### 1. 공통 이미지 불러오기

API Gateway와 Auth Server에서 사용하는 공통 이미지를 불러옵니다.

```bash
docker load -i infra-images.tar
```

이미지가 정상적으로 등록되었는지 확인합니다.

```bash
docker images
```

`msa-lecture/auth-server:1.0` 등의 이미지와 태그가 표시되는지 확인하세요.

### 2. 이미지 빌드 및 컨테이너 실행

프로젝트 루트에서 캐시 없이 이미지를 빌드한 뒤, 전체 컨테이너를 백그라운드로 실행합니다.

```bash
docker compose build --no-cache
docker compose up -d
```

한 번에 실행하려면 다음 명령어를 사용합니다.

```bash
docker compose build --no-cache && docker compose up -d
```

### 3. 기동 상태 확인

Eureka 대시보드에서 각 서비스의 등록 상태를 확인할 수 있습니다.

- [Eureka 대시보드](http://localhost:8761/)

## 로그 확인

전체 서비스의 로그를 실시간으로 확인합니다.

```bash
docker compose logs -f
```

특정 서비스의 로그만 확인하려면 다음 형식을 사용합니다.

```bash
docker compose logs -f <서비스명>
```

사용 가능한 서비스명은 다음과 같습니다.

```text
mariadb
kafka
eureka-server
auth-server
api-gateway
user-service
course-service
enrollment-service
payment-service
recommend-service
```

예시:

```bash
docker compose logs -f user-service
```

## 프론트엔드 실행

새 터미널에서 프론트엔드 디렉터리로 이동한 뒤 의존성을 설치하고 개발 서버를 실행합니다.

```bash
cd vue-frontend
npm install
npm run dev
```

실행 후 브라우저에서 아래 주소로 접속합니다.

- [프론트엔드](http://localhost:3000/)

## 종료 및 재실행

전체 컨테이너를 종료하고 정리합니다.

```bash
docker compose down
```

빌드 또는 실행에 실패해 기존 컨테이너를 정리해야 할 때도 위 명령어를 실행한 후 다시 빌드하세요.

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```
