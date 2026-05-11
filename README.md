# 🏟️ StadiumTime – Live Stadium Ticket Booking Platform

> A cloud-native, microservices-based platform for booking live cricket match tickets with a **Hotstar-inspired** premium UI

![Microservices](https://img.shields.io/badge/Architecture-Microservices-blue)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot-brightgreen)
![React](https://img.shields.io/badge/Frontend-React%2018-61dafb)
![Docker](https://img.shields.io/badge/Containers-Docker-2496ED)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5)
![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)
![RabbitMQ](https://img.shields.io/badge/Messaging-RabbitMQ-FF6600)

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Microservices](#microservices)
- [Frontend – Hotstar UI](#frontend--hotstar-ui)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [CI/CD Pipelines](#cicd-pipelines)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring & Logging (ELK)](#monitoring--logging-elk)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)

---

## Overview

**StadiumTime** is a full-stack stadium ticket booking system that allows users to:

- 🏏 **Browse live cricket matches** with team details, venue info, and session timings
- 🎫 **Book stadium seats** with an interactive seat layout selector
- 💳 **Pay securely** via UPI, cards, net banking, or wallets
- 📱 **View & download** QR-coded digital tickets
- 📧 **Receive email confirmations** via event-driven notifications

The backend is built as **7 independent Spring Boot microservices** communicating via REST APIs and RabbitMQ, deployed using Docker Compose and Kubernetes, and automated through Jenkins CI/CD pipelines.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT (React Frontend)                       │
│              Hotstar-inspired dark theme UI                       │
│                  http://172.16.180.127:80                         │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (:8085)                            │
│              Spring Cloud Gateway + JWT Auth                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ User Service │ │Match Service │ │Booking Svc   │
│   (:8083)    │ │  (:8086)     │ │  (:8087)     │
│  PostgreSQL  │ │  PostgreSQL  │ │  PostgreSQL  │
│  (user_db)   │ │  (match_db)  │ │ (booking_db) │
└──────────────┘ └──────────────┘ └───────┬──────┘
                                          │ RabbitMQ
                               ┌──────────┼──────────┐
                               ▼                      ▼
                    ┌──────────────┐       ┌──────────────┐
                    │Payment Svc   │       │Notification  │
                    │  (:8089)     │       │  Service     │
                    │              │       │  (:8088)     │
                    └──────────────┘       │  📧 Email    │
                                           └──────────────┘

              ┌──────────────────────────────┐
              │     EUREKA DISCOVERY (:8761) │
              │  Service Registry & Health   │
              └──────────────────────────────┘

              ┌──────────────────────────────┐
              │   ELK Stack (Logging)        │
              │ Elasticsearch → Logstash     │
              │     → Kibana (:5601)         │
              └──────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Material UI, CSS3 Animations |
| **Backend** | Java 17, Spring Boot 3.x |
| **API Gateway** | Spring Cloud Gateway |
| **Service Discovery** | Netflix Eureka |
| **Databases** | PostgreSQL 16 (3 independent DBs) |
| **Messaging** | RabbitMQ 3 (async event-driven) |
| **Caching** | Redis 7 |
| **Auth** | JWT + Spring Security + BCrypt |
| **Containers** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (Minikube) |
| **CI/CD** | Jenkins (2 unified pipelines) |
| **Logging** | Logback → Filebeat → Logstash → Elasticsearch → Kibana |

---

## Microservices

| Service | Port | Responsibility |
|---------|------|---------------|
| 🧭 **Discovery Server** | 8761 | Eureka service registry |
| 🔀 **API Gateway** | 8085 | Centralized routing, JWT validation |
| 👤 **User Service** | 8083 | Registration, login, JWT tokens |
| 🏏 **Match Service** | 8086 | Cricket matches, sessions, venues |
| 🎫 **Booking Service** | 8087 | Seat selection, booking lifecycle |
| 💳 **Payment Service** | 8089 | Payment processing, RabbitMQ events |
| 📧 **Notification Service** | 8088 | Email confirmations via RabbitMQ |

### Event-Driven Flow (RabbitMQ)

```
User Books Seats → Booking Service
    → Payment Service (PaymentRequest)
        → Payment Success Event (RabbitMQ)
            → Booking Service (confirms booking)
                → Notification Service (sends email)
```

---

## Frontend – Hotstar UI

The frontend features a **premium Hotstar-inspired dark theme** (`#0f0617`) with:

- 🎬 **Home Page** – Ken Burns animated hero carousel, horizontal scroll rails, category browsing
- 🏟️ **Matches Page** – Stadium SVG animated empty state, filter tabs, match grid
- 🆚 **Match Detail** – Team VS display, stadium atmosphere, session cards with facility chips
- 💺 **Seat Layout** – Interactive seat picker with category-based pricing
- 💳 **Payment** – Multi-method selector (UPI, Card, Net Banking, Wallet), animated processing steps
- 🎫 **My Bookings** – QR-coded digital tickets with perforated edge design, download function

Custom animations: `kenBurns`, `ticketReveal`, `pulse`, `stadiumWave`, `fadeInUp`

---

## Repository Structure

```
microservices-ticket-booking/
│
├── Movie-Booking-Service-Frontend-main/     # React Frontend
│   ├── src/
│   │   ├── components/                      # All UI components
│   │   │   ├── Home.js                      # Hotstar-style home
│   │   │   ├── Matches.js                   # Match discovery
│   │   │   ├── Match.js                     # Match detail + sessions
│   │   │   ├── SeatLayout.js                # Seat picker
│   │   │   ├── Payment.js                   # Payment gateway
│   │   │   ├── MyBookings.js                # QR ticket viewer
│   │   │   └── ...
│   │   └── App.css                          # Global animations & theme
│   ├── Jenkinsfile                          # Frontend CI/CD pipeline
│   ├── Dockerfile                           # nginx-based production build
│   └── k8s/                                 # K8s deployment manifests
│
├── Movie-Booking-System-Microservices/      # Backend Microservices
│   ├── discovery-server/                    # Eureka
│   ├── api-gateway/                         # Spring Cloud Gateway
│   ├── user-service/                        # Auth & users
│   ├── match-service/                       # Matches & sessions
│   ├── booking-service/                     # Bookings
│   ├── payment-service/                     # Payments
│   ├── notification-service/                # Email notifications
│   ├── docker-compose.yml                   # Full stack orchestration
│   ├── Jenkinsfile                          # Backend CI/CD pipeline
│   ├── k8s/                                 # K8s manifests for all services
│   └── elk/                                 # ELK stack configs
│
└── seed_matches.py                          # Data seeder script
```

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Kubernetes (Minikube) – optional

### 1. Start Backend (Docker Compose)

```bash
cd Movie-Booking-System-Microservices
docker compose up -d
```

This starts **all 15 containers**: 3 PostgreSQL DBs, Redis, RabbitMQ, Eureka, API Gateway, 5 business services, and the ELK stack.

### 2. Start Frontend

```bash
cd Movie-Booking-Service-Frontend-main
npm install
npm start
```

### 3. Access the Application

| Component | URL |
|-----------|-----|
| 🌐 **Frontend** | http://172.16.180.127:80 |
| 🔗 **API Gateway** | http://172.16.180.127:8085 |
| 🧭 **Eureka Dashboard** | http://172.16.180.127:8761 |
| 🐰 **RabbitMQ Management** | http://172.16.180.127:15672 |
| 📊 **Kibana (Logs)** | http://172.16.180.127:5601 |

### 4. Seed Sample Data

```bash
python3 seed_matches.py
```

---

## CI/CD Pipelines

The project uses **2 unified Jenkins pipelines** (consolidated from 9 individual pipelines):

### Backend Pipeline (`Stadium-Backend-Pipeline`)

```
Checkout → Build All 7 Services (parallel) → Docker Build → Docker Push → Docker Compose Restart → (Optional) K8s Deploy
```

| Stage | Description |
|-------|------------|
| Build & Test | Parallel Maven builds of all 7 microservices |
| Docker Build | Builds 7 Docker images with tagged versions |
| Docker Push | Pushes all images to Docker Hub |
| Docker Compose | Restarts all services with new images |
| K8s Deploy | Optional rolling update to Minikube |

### Frontend Pipeline (`Stadium-Frontend-Pipeline`)

```
Checkout → npm install → React Build → Docker Build → Docker Push → Restart Container → (Optional) K8s Deploy
```

| Stage | Description |
|-------|------------|
| Install | `npm install` dependencies |
| Build | `CI=false npm run build` (production) |
| Docker | Build nginx-based image |
| Push | Push to Docker Hub |
| Restart | Stop/start frontend container on port 80 |
| K8s Deploy | Optional rolling update to Minikube |

### Jenkins Access

- **URL**: http://172.16.180.127:8080
- **Jobs**: `Stadium-Backend-Pipeline`, `Stadium-Frontend-Pipeline`

---

## Kubernetes Deployment

### Create Namespace

```bash
kubectl create namespace movie-app
```

### Deploy Infrastructure

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rabbitmq/
kubectl apply -f k8s/redis/
kubectl apply -f k8s/booking-db/
kubectl apply -f k8s/match-service/   # includes match-db
kubectl apply -f k8s/user-db/
```

### Deploy Services

```bash
kubectl apply -f k8s/eureka/
kubectl apply -f k8s/api-gateway/
kubectl apply -f k8s/user-service/
kubectl apply -f k8s/match-service/
kubectl apply -f k8s/booking-service/
kubectl apply -f k8s/payment-service/
kubectl apply -f k8s/notification-service/
```

### Deploy Frontend

```bash
kubectl apply -f ../Movie-Booking-Service-Frontend-main/k8s/
```

---

## Monitoring & Logging (ELK)

The ELK stack provides centralized logging across all microservices:

- **Filebeat** collects Docker container logs
- **Logstash** parses and forwards to Elasticsearch
- **Elasticsearch** stores and indexes logs
- **Kibana** provides visualization and search

Log index format: `movie-logs-YYYY.MM.dd`

Access Kibana at: http://172.16.180.127:5601

---

## API Endpoints

### Auth (via API Gateway :8085)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login, returns JWT |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | List all matches |
| GET | `/api/matches/{id}` | Match details |
| POST | `/api/matches` | Create match (admin) |
| GET | `/api/matches/{id}/sessions` | Get sessions |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | User's bookings |
| GET | `/api/bookings/{id}/seats` | Booked seat status |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/pay` | Process payment |

---

## Security

- 🔐 JWT-based authentication with Spring Security
- 🔑 BCrypt encrypted passwords
- 👮 Role-based access control (USER / ADMIN)
- 🔒 Secure inter-service communication
- 🌐 Kubernetes internal networking

---

## 🚀 Deployment Workflow

```
Developer pushes code to GitHub
    → Jenkins pipeline triggers
        → Maven build & tests (all 7 services in parallel)
            → Docker images built & pushed to Docker Hub
                → Docker Compose restarts services
                    → (Optional) Kubernetes rolling update
                        → Frontend rebuilt & deployed
                            → App live at http://172.16.180.127:80
                                → Logs visible in Kibana (:5601)
```

---

## Future Enhancements

- 📈 Prometheus + Grafana monitoring
- 🔍 Distributed tracing with Jaeger
- 🔐 OAuth2 authentication
- 🚦 API rate limiting
- 🏗️ Terraform Infrastructure as Code
- 🔄 GitOps with ArgoCD

---

## Contributors

- **Abhash Tiwari** – Full Stack Development, DevOps, CI/CD

---

⭐ **If this project was helpful, consider starring the repository!**
