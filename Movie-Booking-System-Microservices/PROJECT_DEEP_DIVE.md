# MovieTime — Movie Booking System (Microservices Architecture)

> A production-grade, end-to-end movie ticket booking platform built with **Spring Boot 3.5**, **Spring Cloud 2025**, and a full **DevOps pipeline** (Docker, Kubernetes, Jenkins, ELK).

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Microservice Deep Dive](#4-microservice-deep-dive)
5. [End-to-End Booking Flow](#5-end-to-end-booking-flow)
6. [Inter-Service Communication](#6-inter-service-communication)
7. [Database Design](#7-database-design)
8. [Security Architecture](#8-security-architecture)
9. [Seat Locking with Redis](#9-seat-locking-with-redis)
10. [Event-Driven Architecture (RabbitMQ)](#10-event-driven-architecture-rabbitmq)
11. [Observability — ELK Stack](#11-observability--elk-stack)
12. [DevOps & CI/CD](#12-devops--cicd)
13. [Kubernetes Deployment](#13-kubernetes-deployment)
14. [Configuration Profiles](#14-configuration-profiles)
15. [API Reference](#15-api-reference)
16. [How to Run](#16-how-to-run)

---

## 1. High-Level Architecture

```
                        ┌──────────────────┐
                        │   Client / UI    │
                        └────────┬─────────┘
                                 │ HTTP
                        ┌────────▼─────────┐
                        │   API Gateway    │  :8085
                        │ (JWT validation) │
                        └──┬──┬──┬──┬──────┘
             ┌─────────────┘  │  │  └──────────────┐
             ▼                ▼  ▼                  ▼
      ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐
      │User Service│  │Movie Svc  │  │Booking   │  │Payment Svc   │
      │   :8083    │  │  :8086    │  │Svc :8087 │  │   :8089      │
      └─────┬──────┘  └─────┬────┘  └──┬───┬───┘  └──────┬───────┘
            │               │           │   │              │
        [user-db]       [movie-db]  [booking-db]      (stateless)
        Postgres        Postgres    Postgres
                                       │   │              │
                                    [Redis] └──[RabbitMQ]──┘
                                   (seat locks) (events)
                                                    │
                                            ┌───────▼────────┐
                                            │ Notification   │
                                            │ Service :8088  │
                                            │ (email via     │
                                            │  Brevo SMTP)   │
                                            └────────────────┘

         All services register with Eureka Discovery Server (:8761)
         All logs → Filebeat → Logstash → Elasticsearch → Kibana
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.5.7, Spring Cloud 2025.0.0 |
| API Gateway | Spring Cloud Gateway (WebFlux) |
| Service Discovery | Netflix Eureka |
| Databases | PostgreSQL 16 (one per domain service) |
| Caching / Locking | Redis 7 |
| Message Broker | RabbitMQ 3 (management plugin) |
| Email | Brevo (Sendinblue) SMTP |
| Auth | JWT (HMAC-SHA, jjwt 0.11.1) |
| API Docs | SpringDoc OpenAPI 3 / Swagger UI |
| Logging | Logstash-Logback encoder → ELK 8.15 |
| Tracing | Micrometer Tracing (Brave) |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (Minikube), Nginx Ingress |
| CI/CD | Jenkins (declarative pipelines, GitHub webhooks) |
| Build Tool | Maven (mvnw wrapper) |
| ORM | Spring Data JPA / Hibernate |

---

## 3. Project Structure

```
Movie-Booking-System-Microservices/
├── api-gateway/              # Spring Cloud Gateway + JWT filter
├── discovery-server/         # Eureka Server
├── user-service/             # Auth (signup/signin), JWT generation
├── movie-service/            # Movies & Shows CRUD
├── booking-service/          # Seat locking, booking lifecycle
├── payment-service/          # Payment simulation + event publishing
├── notification-service/     # RabbitMQ consumer + email sender
├── elk/                      # Filebeat & Logstash configs
├── k8s/                      # Full Kubernetes manifests
├── docker-compose.yml        # Local multi-container orchestration
├── Jenkinsfile               # Master CI/CD pipeline (monorepo)
└── .gitignore
```

---

## 4. Microservice Deep Dive

### 4.1 Discovery Server (Eureka) — `:8761`

**Purpose:** Service registry. All microservices register here and discover each other by logical name (e.g., `USER-SERVICE`, `MOVIE-SERVICE`).

| Item | Detail |
|------|--------|
| Main class | `DiscoveryServerApplication` (`@EnableEurekaServer`) |
| Self-registration | Disabled (`register-with-eureka=false`, `fetch-registry=false`) |
| Dependency | `spring-cloud-starter-netflix-eureka-server` |

### 4.2 API Gateway — `:8085`

**Purpose:** Single entry point for all client requests. Handles JWT validation, CORS, and request routing to downstream services via Eureka load balancing (`lb://`).

**Route table (docker profile):**

| Path Pattern | Target Service | Eureka Name |
|-------------|---------------|-------------|
| `/auth/**` | user-service | `USER-SERVICE` |
| `/movies/**` | movie-service | `MOVIE-SERVICE` |
| `/bookings/**` | booking-service | `BOOKING-SERVICE` |
| `/payment/**` | payment-service | `PAYMENT-SERVICE` |

**JWT Filter (`JwtGlobalFilter`):**
- Implements `GlobalFilter` + `Ordered` (order=1000, runs AFTER CORS filter)
- **Whitelisted paths** (no JWT required): `/auth/**`, `/movies/**`, `OPTIONS` requests
- For protected paths: extracts `Bearer` token → validates with HMAC-SHA secret → extracts `email` claim → injects `X-User-Email` header into the downstream request
- Returns `401 Unauthorized` if token is missing/invalid

**Security:** WebFlux-based `SecurityConfig` disables CSRF, enables CORS for `movieapp.local` and `localhost:3000`.

### 4.3 User Service — `:8083`

**Purpose:** User registration, authentication, and JWT token generation.

**Database:** `user_db` (PostgreSQL) — `users` table.

**Entity — `User`:**
| Field | Type |
|-------|------|
| id | Long (auto) |
| fullname | String |
| email | String |
| password | String (BCrypt) |
| role | Enum: `USER`, `ADMIN` |

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | Public | Register user, return JWT |
| POST | `/auth/signin` | Public | Login user, return JWT |

**JWT generation (`JwtProvider`):**
- Signs with HMAC-SHA using a shared secret key
- Claims: `email`, `authorities` (role)
- Expiry: 24 hours
- Same secret key is shared with the API Gateway for validation

**Security chain (`AppConfig`):**
- Stateless sessions
- `JwtTokenValidator` filter runs before `BasicAuthenticationFilter`
- `/auth/**` endpoints are public; `/api/admin/**` requires `ADMIN` role

### 4.4 Movie Service — `:8086`

**Purpose:** CRUD for movies and shows (screenings).

**Database:** `movie_db` (PostgreSQL) — `movies` and `shows` tables.

**Entity — `Movie`:**
| Field | Type |
|-------|------|
| id | Long (auto) |
| title, description, language, duration, genre, rating, posterUrl | String |
| releaseDate | LocalDate |
| active | boolean |
| createdAt, updatedAt | Instant |

**Entity — `Show`:**
| Field | Type |
|-------|------|
| id | Long (auto) |
| movie | ManyToOne → Movie (cascade delete) |
| startTime, endTime | LocalDateTime |
| auditorium | String (default "AUD-1") |
| priceRegular, pricePremium | Integer |

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/movies` | List movies (optional `?activeOnly=true`) |
| GET | `/movies/{id}` | Get movie by ID |
| POST | `/movies` | Create movie |
| PUT | `/movies/{id}` | Update movie |
| DELETE | `/movies/{id}` | Delete movie |
| GET | `/movies/{id}/shows` | Shows for a movie |
| POST | `/movies/shows` | Create a show |
| GET | `/movies/shows?date=YYYY-MM-DD` | Shows by date |
| GET | `/movies/shows/{id}` | Get show |
| GET | `/movies/shows/{id}/pricing` | Get pricing |
| GET | `/movies/shows/{showId}/details` | Full show+movie details (used by notification-service) |

**Exception handling:** Global `@RestControllerAdvice` returns structured `ApiError` JSON for 404, 400, and 500 errors.

### 4.5 Booking Service — `:8087`

**Purpose:** Core booking engine. Manages the full booking lifecycle: seat locking → booking creation → payment confirmation → seat finalization. This is the most complex service.

**Database:** `booking_db` (PostgreSQL) — `bookings`, `booking_seats`, `booked_seats` tables.

**Entities:**

**`Booking`** — the booking record:
| Field | Type |
|-------|------|
| id | Long (auto) |
| showId | Long |
| userId | String (email from JWT) |
| status | Enum: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| totalAmount | BigDecimal |
| currency | String ("INR") |
| paymentId | String |
| lockId | String (UUID) |
| seats | OneToMany → BookingSeat |

**`BookingSeat`** — individual seats in a booking:
| Field | Type |
|-------|------|
| seatId, seatNumber | Long, Integer |
| rowLabel | String |
| seatType | Enum: `REGULAR`, `PREMIUM` |
| price | BigDecimal |

**`BookedSeat`** — permanently booked seats (unique constraint on `show_id + seat_id`):
| Field | Type |
|-------|------|
| showId, seatId, bookingId | Long |
| bookedAt | Instant |

**Endpoints:**

| Method | Path | Auth Header | Description |
|--------|------|-------------|-------------|
| POST | `/bookings/create` | `X-User-Email` | Create booking (locks seats) |
| POST | `/bookings/confirm/{bookingId}?paymentId=...` | — | Confirm after payment |
| GET | `/bookings/show/{showId}/seats/status` | — | Get booked + locked seats |
| GET | `/bookings/my` | `X-User-Email` | User's bookings |
| PUT | `/bookings/{bookingId}/cancel` | `X-User-Email` | Cancel booking |

**Scheduled task:** Every 60 seconds, scans `PENDING_PAYMENT` bookings. If all Redis locks have expired, auto-cancels the booking.

### 4.6 Payment Service — `:8089`

**Purpose:** Simulates payment processing and publishes a `PaymentSuccessEvent` via RabbitMQ.

**No database** — stateless service.

**Endpoint:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/payment/pay` | Accepts `{bookingId, amount}`, simulates 2s delay, publishes event |

**Flow:** Receives payment request → simulates gateway delay (2s) → creates `PaymentSuccessEvent(bookingId, "SUCCESS")` → publishes to `payment.exchange` with routing key `payment.success`.

### 4.7 Notification Service — `:8088`

**Purpose:** Listens for booking confirmation events and sends formatted email notifications with full movie/show details.

**No database** — event-driven consumer.

**How it works:**
1. Listens on RabbitMQ queue `booking.notifications` (bound to `booking.exchange` with key `booking.confirmed`)
2. Extracts `bookingId`, `userEmail`, `status`, `showId` from the message
3. Makes a synchronous REST call to movie-service: `GET /movies/shows/{showId}/details`
4. Composes a rich email with movie title, genre, duration, show time, auditorium
5. Sends email via **Brevo SMTP** (`smtp-relay.brevo.com:587`)

---

## 5. End-to-End Booking Flow

This is the complete user journey from signup to receiving a booking confirmation email:

```
Step 1: User Registration
  Client → POST /auth/signup → [API Gateway] → [User Service]
  ← JWT token returned

Step 2: Browse Movies
  Client → GET /movies → [API Gateway] → [Movie Service]
  ← List of movies (public, no JWT needed)

Step 3: Select Show
  Client → GET /movies/{id}/shows → [API Gateway] → [Movie Service]
  ← Available shows with pricing

Step 4: Check Seat Availability
  Client → GET /bookings/show/{showId}/seats/status → [API Gateway] → [Booking Service]
  ← { bookedSeatIds: [...], lockedSeatIds: [...] }

Step 5: Create Booking (Seat Locking)
  Client → POST /bookings/create (JWT required)
  → [API Gateway validates JWT, injects X-User-Email]
  → [Booking Service]:
     a. Locks each seat in Redis (SET NX, TTL 600s)
     b. If any seat already locked → rollback all locks → 409 error
     c. Creates Booking record (status=PENDING_PAYMENT)
     d. Saves BookingSeat records
  ← BookingResponse { id, status: PENDING_PAYMENT, lockId }

Step 6: Make Payment
  Client → POST /payment/pay { bookingId, amount } (JWT required)
  → [API Gateway] → [Payment Service]:
     a. Simulates 2-second payment gateway delay
     b. Publishes PaymentSuccessEvent to RabbitMQ
  ← "Payment started"

Step 7: Booking Confirmation (Async, Event-Driven)
  [Payment Service] → RabbitMQ (payment.exchange / payment.success)
  → [Booking Service] listens on payment.success.queue:
     a. Finds booking by ID
     b. Sets status = CONFIRMED, saves paymentId
     c. Moves seats from BookingSeat → BookedSeat (permanent)
     d. Removes Redis locks
     e. Publishes BookingConfirmedEvent to RabbitMQ

Step 8: Email Notification (Async)
  [Booking Service] → RabbitMQ (booking.exchange / booking.confirmed)
  → [Notification Service] listens on booking.notifications:
     a. Calls Movie Service for show details
     b. Sends formatted email via Brevo SMTP
  → User receives email with movie name, show time, auditorium
```

---

## 6. Inter-Service Communication

| From | To | Method | Purpose |
|------|----|--------|---------|
| API Gateway | All services | HTTP (lb:// via Eureka) | Request routing |
| Payment Svc | Booking Svc | RabbitMQ (`payment.success`) | Payment confirmation event |
| Booking Svc | Notification Svc | RabbitMQ (`booking.confirmed`) | Booking confirmation event |
| Notification Svc | Movie Svc | HTTP (RestTemplate) | Fetch show/movie details for email |
| All services | Eureka | HTTP | Service registration & discovery |

**RabbitMQ Exchanges & Queues:**

| Exchange | Type | Queue | Routing Key | Publisher | Consumer |
|----------|------|-------|-------------|-----------|----------|
| `payment.exchange` | Topic | `payment.success.queue` | `payment.success` | Payment Svc | Booking Svc |
| `booking.exchange` | Topic | `booking.notifications` | `booking.confirmed` | Booking Svc | Notification Svc |

---

## 7. Database Design

Three isolated PostgreSQL 16 databases (database-per-service pattern):

**user_db** (port 5435):
```sql
CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  fullname   VARCHAR,
  email      VARCHAR UNIQUE,
  password   VARCHAR,      -- BCrypt hashed
  role       VARCHAR       -- 'USER' or 'ADMIN'
);
```

**movie_db** (port 5434):
```sql
CREATE TABLE movies (
  id, title, description, language, duration, genre,
  rating, poster_url, release_date, active, created_at, updated_at
);
CREATE TABLE shows (
  id, movie_id (FK→movies ON DELETE CASCADE),
  start_time, end_time, auditorium, price_regular, price_premium
);
```

**booking_db** (port 5433):
```sql
CREATE TABLE bookings (
  id, show_id, user_id, status, total_amount, currency,
  payment_id, lock_id, created_at, updated_at
);
CREATE TABLE booking_seats (
  id, booking_id (FK→bookings), seat_id, row_label,
  seat_number, seat_type, price
);
CREATE TABLE booked_seats (
  id, show_id, seat_id, booking_id, booked_at,
  UNIQUE(show_id, seat_id)  -- prevents double-booking
);
```

---

## 8. Security Architecture

```
Client Request
     │
     ▼
[API Gateway - JwtGlobalFilter]
     │
     ├─ /auth/**, /movies/** → PASS (no JWT needed)
     ├─ OPTIONS → PASS (CORS preflight)
     └─ Everything else:
          ├─ No Bearer token → 401
          ├─ Invalid token → 401
          └─ Valid token:
               → Extract email claim
               → Add X-User-Email header
               → Forward to downstream service
```

- **Token generation:** User Service creates JWT with claims: `email`, `authorities`
- **Token validation:** API Gateway validates signature with shared HMAC secret
- **User identity propagation:** Gateway injects `X-User-Email` header; downstream services read this header (no need to re-validate JWT)
- **Password storage:** BCrypt encoding via Spring Security's `PasswordEncoder`

---

## 9. Seat Locking with Redis

The booking service uses Redis for **distributed seat locking** to prevent race conditions:

```
Lock Key Pattern:  lock:show:{showId}:seat:{seatId}
Lock Value:        {rowLabel}-{seatNumber}-{seatType}
TTL:               600 seconds (10 minutes)
Operation:         SET NX (atomic, only succeeds if key doesn't exist)
```

**Locking algorithm:**
1. For each seat in the booking request, attempt `SETNX` with TTL
2. If ANY seat fails to lock → rollback ALL previously acquired locks → throw error
3. On successful payment → delete Redis locks + insert into `booked_seats` table
4. On cancellation → delete Redis locks
5. Scheduled job (every 60s): if locks expired for a `PENDING_PAYMENT` booking → auto-cancel

This provides a **two-tier protection**:
- **Redis (temporary):** Prevents concurrent bookings of the same seat (10-min hold)
- **PostgreSQL unique constraint (permanent):** `UNIQUE(show_id, seat_id)` on `booked_seats` prevents double-booking even if Redis fails

---

## 10. Event-Driven Architecture (RabbitMQ)

```
[Payment Service]                    [Booking Service]                [Notification Service]
      │                                     │                                │
      │ processPayment()                    │                                │
      │──── publishes ─────────────────────►│                                │
      │  PaymentSuccessEvent               │ handlePaymentEvent()           │
      │  exchange: payment.exchange        │ (RabbitListener)               │
      │  key: payment.success              │                                │
      │                                    │ confirmPayment()               │
      │                                    │   → status=CONFIRMED           │
      │                                    │   → seats → booked_seats       │
      │                                    │   → delete Redis locks         │
      │                                    │                                │
      │                                    │── publishes ──────────────────►│
      │                                    │ BookingConfirmedEvent          │ handleBookingNotification()
      │                                    │ exchange: booking.exchange     │ (RabbitListener)
      │                                    │ key: booking.confirmed        │
      │                                    │                               │ → REST call to Movie Svc
      │                                    │                               │ → sendBookingEmail()
```

All messages use `Jackson2JsonMessageConverter` for JSON serialization.

---

## 11. Observability — ELK Stack

```
[Spring Boot services]  →  [Filebeat]  →  [Logstash]  →  [Elasticsearch]  →  [Kibana]
  (JSON logs via              (reads          (pipeline       (stores &          (UI for
   logstash-logback)        container logs)   processing)     indexes)        visualization)
```

- **Filebeat** (`filebeat.yml`): Reads Docker container logs, decodes embedded Spring Boot JSON, drops ELK self-logs to avoid recursion
- **Logstash** (`logstash.conf`): Receives from Filebeat on port 5044, outputs to Elasticsearch with index pattern `movie-logs-YYYY.MM.dd`
- **Elasticsearch** (8.15.0): Single-node, security disabled, 512MB heap
- **Kibana** (8.15.0): Accessible at `:5601`, security/fleet/ML/monitoring disabled for resource savings

---

## 12. DevOps & CI/CD

### Master Pipeline (root `Jenkinsfile`)

Triggered by GitHub webhook. Detects which folders changed and triggers only the affected service pipelines in parallel:

```
Checkout → Detect Changes → Apply Infra (if k8s/ changed)
                          → Trigger Service Pipelines (parallel)
                          → Nothing Changed (skip)
```

### Per-Service Pipeline (e.g., `booking-service/Jenkinsfile`)

Each service has its own pipeline:
```
Checkout → Check for Changes → Build & Test (mvnw clean verify)
         → Docker Build → Docker Push (to DockerHub ketan803/*)
         → Deploy to Minikube (kubectl set image + rollout status)
```

- **Docker images:** Built with `eclipse-temurin:17-jre`, tagged as `main-{BUILD_NUMBER}`
- **Profile activation:** `SPRING_PROFILES_ACTIVE=docker` set in Dockerfile ENV
- **Registry:** DockerHub (`ketan803/{service-name}`)

---

## 13. Kubernetes Deployment

All resources deployed to namespace `movie-app`.

| Component | K8s Resource | Notes |
|-----------|-------------|-------|
| Databases (user/movie/booking) | StatefulSet + PVC + Secret + Service | 1Gi persistent storage each |
| User DB (alternative) | Zalando Postgres Operator (`postgresql` CRD) | 2 replicas, auto-managed |
| Redis | Deployment + Service | Ephemeral (no persistence) |
| RabbitMQ | Deployment + Secret + Service | Credentials in Secret |
| Eureka | Deployment + Service | |
| API Gateway | Deployment + Service + HPA | Scales 1-5 pods at 60% CPU |
| Booking Service | Deployment + Service + HPA | Scales 1-5 pods at 60% CPU |
| Movie Service | Deployment + Service + HPA | Scales 1-5 pods at 60% CPU |
| Payment/Notification | Deployment + Service | |
| Ingress | Nginx Ingress | Host: `movieapp.local` |

**Ingress routing:**
| Path | Backend |
|------|---------|
| `/` | movie-frontend:80 |
| `/auth` | api-gateway:8085 |
| `/movies` | api-gateway:8085 |
| `/bookings` | api-gateway:8085 |
| `/payment` | api-gateway:8085 |

**Resource limits per service pod:** 250m-600m CPU, 384Mi-768Mi memory.

---

## 14. Configuration Profiles

Each service supports three Spring profiles:

| Profile | Activation | Eureka URL | DB Host | Use Case |
|---------|-----------|------------|---------|----------|
| `local` | `application-local.properties` | `localhost:8761` | `localhost:{port}` | Local development |
| `docker` | `SPRING_PROFILES_ACTIVE=docker` | `eureka:8761` | `{service}-db:5432` | Docker Compose / K8s |
| `test` | `application-test.properties` | — | H2 in-memory | Unit/integration tests |

Default profile set in `application.properties` → `spring.profiles.active=local`.

---

## 15. API Reference

### User Service
```
POST /auth/signup    Body: { fullname, email, password, role? }  → { token, role, message }
POST /auth/signin    Body: { email, password }                   → { token, role, message }
```

### Movie Service
```
GET    /movies                          → [MovieDTO]
GET    /movies/{id}                     → MovieDTO
POST   /movies                          → MovieDTO  (Body: CreateMovieRequest)
PUT    /movies/{id}                     → MovieDTO
DELETE /movies/{id}
GET    /movies/{id}/shows               → [ShowDTO]
POST   /movies/shows                    → ShowDTO   (Body: CreateShowRequest)
GET    /movies/shows?date=YYYY-MM-DD    → [ShowDTO]
GET    /movies/shows/{id}/pricing       → { priceRegular, pricePremium }
GET    /movies/shows/{showId}/details   → ShowDetailsDTO
```

### Booking Service (JWT required)
```
POST /bookings/create                   → BookingResponse (Header: X-User-Email)
POST /bookings/confirm/{id}?paymentId=  → BookingResponse
GET  /bookings/show/{showId}/seats/status → SeatStatusResponse
GET  /bookings/my                       → [BookingResponseDTO] (Header: X-User-Email)
PUT  /bookings/{id}/cancel              → BookingResponse (Header: X-User-Email)
```

### Payment Service (JWT required)
```
POST /payment/pay   Body: { bookingId, amount }  → "Payment started"
```

---

## 16. How to Run

### Docker Compose (recommended)
```bash
# 1. Build all services
for svc in discovery-server api-gateway user-service movie-service booking-service payment-service notification-service; do
  cd $svc && ./mvnw -B clean package -DskipTests && cd ..
done

# 2. Start everything
docker-compose up --build -d

# 3. Wait for Eureka to be ready, then check
open http://localhost:8761    # Eureka dashboard
open http://localhost:5601    # Kibana
open http://localhost:15672   # RabbitMQ (guest/guest)
```

### Service Ports
| Service | Port |
|---------|------|
| Eureka | 8761 |
| API Gateway | 8085 |
| User Service | 8083 |
| Movie Service | 8086 |
| Booking Service | 8087 |
| Notification Service | 8088 |
| Payment Service | 8089 |
| RabbitMQ Management | 15672 |
| Kibana | 5601 |
| Elasticsearch | 9200 |

### Kubernetes
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/redis/ -f k8s/rabbitmq/
kubectl apply -f k8s/user-db/ -f k8s/movie-db/ -f k8s/booking-db/
kubectl apply -f k8s/eureka/
kubectl apply -f k8s/api-gateway/ -f k8s/user-service/ -f k8s/movie-service/
kubectl apply -f k8s/booking-service/ -f k8s/payment-service/ -f k8s/notification-service/
kubectl apply -f k8s/ingress/
kubectl apply -f k8s/elk/
```

---

*Generated from source code analysis. Last updated: April 2026.*
