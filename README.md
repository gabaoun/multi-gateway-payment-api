# Multi-Gateway Payment API

[![CI](https://github.com/gabaoun/multi-gateway-payment-api/actions/workflows/ci.yml/badge.svg)](https://github.com/gabaoun/multi-gateway-payment-api/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/gabaoun/multi-gateway-payment-api/actions/workflows/codeql.yml/badge.svg)](https://github.com/gabaoun/multi-gateway-payment-api/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

RESTful payment orchestration engine that routes transactions across multiple payment providers with **automatic failover**, **transactional integrity**, and **role-based access control**. Built with AdonisJS 6 and TypeScript as a resilience study, not a production deployment.

The service abstracts external payment gateways behind a unified provider interface, enabling seamless onboarding of new processors, dynamic contingency rules, and consistent auditability of every payment operation.

---

## Core Capabilities

- **Multi-Gateway Orchestration:** Transactions are routed across active providers ordered by priority, maximizing approval rates and eliminating single points of failure.
- **Automatic Failover:** On gateway timeout or downstream error, the engine retries the operation against backup providers without user intervention.
- **Chargeback Management:** Refunds are executed on the exact gateway that processed the original transaction, preserving financial traceability.
- **Transaction State Machine:** Every purchase moves through a strict state model (`PENDING → PAID | FAILED`) inside a single database transaction.
- **Dynamic Pricing:** Cart totals are recomputed server-side from persisted product records — client-submitted totals are never trusted.
- **RBAC Security Model:** Bearer-token authentication plus role-scoped authorization (ADMIN, MANAGER, FINANCE, USER) across all administrative routes.
- **Stateless Merchant Auth (OAuth2 client-credentials + JWT):** external/server-to-server consumers exchange a `client_id`/`client_secret` for a scope-claimed JWT (`POST /merchant/token`), separate from the staff session/opaque-token guard - see [Security & Compliance](#security--compliance).
- **Full Test Environment:** Dockerized mock gateways simulate provider failures for deterministic validation of the fallback logic.

---

## Tech Stack

| Layer            | Technology                                  |
| :--------------- | :------------------------------------------ |
| Runtime          | Node.js + TypeScript (~5.9)                 |
| Framework        | AdonisJS 6                                   |
| ORM / Database   | Lucid ORM + MySQL 8.0                        |
| Validation       | VineJS 4                                     |
| HTTP Client      | Axios                                        |
| Authentication   | `@adonisjs/auth` (token + session guards) + custom JWT (merchant API) |
| Security         | Shield (HSTS, X-Frame DENY) + CORS + rate limiting + scope-based authorization |
| Testing          | Japa 5 (functional tests via `@japa/api-client`) |
| Logging          | pino + pino-pretty                          |
| Infrastructure   | Docker & Docker Compose                      |

---

## Architecture

### Design Patterns

- **Strategy Pattern:** Each payment provider implements the `PaymentGateway` interface (`pay`, `refund`), isolating external contracts from core business logic. New gateways are onboarded by adding a single adapter.
- **Service Layer:** Payment orchestration, fee/discount calculation, and gateway selection live in isolated, unit-testable services (`PaymentService`).
- **Failover Loop:** Gateway selection is driven by `isActive` status and a numeric priority — the service iterates the candidate list until a transaction is authorized.
- **Data Modeling:** Normalized relational schema with dynamic transaction-to-gateway mappings to support multi-item cart purchases and per-transaction provider references.

### Payment Flow

```text
Client
  │
  ▼
POST /purchase ──► VineJS validation
  │
  ▼
PaymentService
  ├── Create/load client
  ├── Recompute total from DB products
  ├── Open DB transaction
  ├── Create transaction (PENDING)
  │
  ├── for each active gateway (priority order):
  │       ├── GatewayAdapter.pay()
  │       ├── success ──► PAID + store gateway_id + external_id ──► commit
  │       └── failure ──► try next gateway
  │
  └── all gateways failed ──► FAILED ──► commit
```

### Project Structure

```text
multi-gateway-payment-api/
├── app/
│   ├── controllers/          # HTTP layer (auth, merchant_auth, transactions, users, products, gateways, clients)
│   ├── middleware/           # Auth + RBAC role middleware, JWT auth, scope check, rate limiter
│   ├── models/               # Lucid ORM models
│   ├── services/
│   │   ├── payment_service.ts        # Orchestration, totals, failover logic
│   │   ├── jwt_service.ts            # Merchant JWT sign/verify (scoped claims)
│   │   └── gateways/                 # PaymentGateway contract + adapters
│   │       ├── payment_gateway.ts    # Provider interface (pay / refund)
│   │       ├── gateway_one.ts
│   │       └── gateway_two.ts
│   └── validators/           # VineJS schemas
├── start/routes.ts           # Route definitions + role guards
├── tests/                    # Functional tests (Japa)
└── docker-compose.yml        # API + MySQL + gateway mocks
```

---

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Quickstart

```bash
git clone <REPOSITORY_URL>
cd multi-gateway-payment-api

cp .env.example .env

docker compose up -d --build
```

The Compose stack launches three services: the API, a MySQL 8.0 database, and a `gateways-mock` container exposing two simulated providers (ports `3001` / `3002`).

### Migrations & Seeds

Populate the database schema with access profiles and test products:

```bash
docker exec -it payment_app node ace migration:run --force
docker exec -it payment_app node ace db:seed
```

### Running Tests

The functional test suite validates the critical purchase flow and the fallback behavior when the primary gateway is unavailable:

```bash
docker exec -it payment_app node ace test
```

---

## Configuration & Environment Variables

Copy `.env.example` to `.env` and adjust the values for your environment.

| Variable                  | Default                            | Description                                   |
| :------------------------ | :--------------------------------- | :-------------------------------------------- |
| `PORT`                    | `3333`                             | HTTP port                                     |
| `HOST`                    | `0.0.0.0`                          | Bind address                                  |
| `APP_KEY`                 | *(required)*                       | App encryption/signing key                    |
| `NODE_ENV`                | `development`                      | Runtime environment                           |
| `LOG_LEVEL`               | `info`                             | Log verbosity                                 |
| `DB_CONNECTION`           | `mysql`                            | Database connection type                      |
| `DB_HOST`                 | `mysql`                            | Database host                                 |
| `DB_PORT`                 | `3306`                             | Database port                                 |
| `DB_USER`                 | `user`                             | Database user                                 |
| `DB_PASSWORD`             | `password`                         | Database password                             |
| `DB_DATABASE`             | `payment_db`                       | Database name                                 |
| `GATEWAY_ONE_URL`         | `http://gateways-mock:3001`        | Provider #1 base URL                          |
| `GATEWAY_ONE_EMAIL`       | `dev@payments.io`                  | Provider #1 credentials (token-based auth)    |
| `GATEWAY_ONE_TOKEN`       | *(mock)*                           | Provider #1 auth token                        |
| `GATEWAY_TWO_URL`         | `http://gateways-mock:3002`        | Provider #2 base URL                          |
| `GATEWAY_TWO_TOKEN`       | *(mock)*                           | Provider #2 auth token                        |
| `GATEWAY_TWO_SECRET`      | *(mock)*                           | Provider #2 auth secret                       |
| `JWT_SECRET`               | *(required)*                       | Signing secret for merchant JWTs               |
| `MERCHANT_CLIENT_ID`       | `demo-merchant`                    | Client ID accepted by `POST /merchant/token`   |
| `MERCHANT_CLIENT_SECRET`   | *(required)*                       | Client secret accepted by `POST /merchant/token`|

---

## Security & Compliance

Two independent authentication boundaries, matched to who's calling:

- **Staff (internal admin panel):** `POST /login` issues an opaque, DB-backed access token (`@adonisjs/auth` `tokensGuard`) tied to a `User` row with a fixed role (ADMIN, MANAGER, FINANCE, USER). Authorization is role-based (`role_middleware.ts`).
- **Merchants (server-to-server integration):** `POST /merchant/token` implements an OAuth2 **client-credentials grant** - a `client_id`/`client_secret` pair (no user record) exchanged for a short-lived, stateless **JWT** carrying a `scopes` claim (`app/services/jwt_service.ts`). Authorization is scope-based (`scope_middleware.ts`, e.g. `merchant:read`), checked independently of the staff role system - a merchant token can never satisfy a `role_middleware` check and vice versa.

OWASP API Security Top 10 mitigations applied to the merchant surface:

| Risk | Mitigation |
| :--- | :--- |
| **API4:2023 Unrestricted Resource Consumption** | `rate_limit_middleware.ts` - fixed-window limiter (10 req/60s on `/merchant/token`) blocks brute-force credential guessing. In-memory by design (see the module's own doc comment on the single-instance limitation). |
| **API5:2023 Broken Function Level Authorization** | `scope_middleware.ts` denies any request whose JWT `scopes` claim doesn't cover the route's required scope, independent of the token being otherwise valid. |
| **API2:2023 Broken Authentication** | JWTs are signed (`JWT_SECRET`), issuer-checked, and short-lived (1h `expires_in`); `jwt_auth_middleware.ts` rejects expired or tampered tokens with a 401 before any handler runs. |

---

## API Reference

### Public Endpoints

| Method | Route                              | Description                                  |
| :----- | :--------------------------------- | :------------------------------------------- |
| `POST` | `/login`                           | Authenticate and issue an access token       |
| `POST` | `/purchase`                        | Process a purchase (automatic failover logic)|
| `POST` | `/merchant/token`                  | OAuth2 client-credentials grant → scoped JWT (rate-limited) |

### Merchant Endpoints

Require a Bearer JWT issued by `POST /merchant/token`, checked against the route's required scope (`scope_middleware.ts`) - independent of the staff role system below.

| Method | Route                   | Required scope   | Description          |
| :----- | :----------------------- | :--------------- | :-------------------- |
| `GET`  | `/merchant/transactions` | `merchant:read`  | Payment listing (read-only) |

### Authenticated Endpoints

All routes below require a Bearer token issued by `POST /login`.

| Method   | Route                        | Roles                    | Description                        |
| :------- | :--------------------------- | :----------------------- | :--------------------------------- |
| `GET`    | `/users`                     | ADMIN, MANAGER           | List users                         |
| `POST`   | `/users`                     | ADMIN, MANAGER           | Create user                        |
| `GET`    | `/users/:id`                 | ADMIN, MANAGER           | Show user                          |
| `PUT`    | `/users/:id`                 | ADMIN, MANAGER           | Update user                        |
| `DELETE` | `/users/:id`                 | ADMIN, MANAGER           | Delete user                        |
| `GET`    | `/products`                  | ADMIN, MANAGER, FINANCE  | List products                      |
| `POST`   | `/products`                  | ADMIN, MANAGER, FINANCE  | Create product                     |
| `GET`    | `/products/:id`              | ADMIN, MANAGER, FINANCE  | Show product                       |
| `PUT`    | `/products/:id`              | ADMIN, MANAGER, FINANCE  | Update product                     |
| `DELETE` | `/products/:id`              | ADMIN, MANAGER, FINANCE  | Delete product                     |
| `GET`    | `/gateways`                  | ADMIN                    | List gateway configurations        |
| `PUT`    | `/gateways/:id`              | ADMIN                    | Toggle provider status / priority  |
| `GET`    | `/clients`                   | Authenticated            | List clients                       |
| `GET`    | `/clients/:id`               | Authenticated            | Show client                        |
| `GET`    | `/transactions`              | Authenticated            | Payment listing & auditing         |
| `GET`    | `/transactions/:id`          | Authenticated            | Show transaction                   |
| `POST`   | `/transactions/:id/charge_back` | ADMIN, FINANCE         | Process a refund on original gateway|

### Seeded Access Profiles

| Email                     | Password    | Profile   | Permissions                          |
| :------------------------ | :---------- | :-------- | :----------------------------------- |
| `admin@payments.io`       | `password`  | **ADMIN**   | Full system access                 |
| `manager@payments.io`     | `password`  | **MANAGER** | User & product management          |
| `finance@payments.io`     | `password`  | **FINANCE** | Product & refund management        |
| `user@payments.io`        | `password`  | **USER**    | Purchase processing & history      |

---

## Roadmap

- **Idempotency keys** for safe retries of `/purchase` under network failures.
- **Webhook notifications** for asynchronous gateway confirmations.
- **Circuit-breaker** with cooldown tracking per gateway to avoid retrying known-down providers.
- **Observability:** structured request tracing and payment-metric dashboards.
