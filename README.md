# Multi-Gateway Payment API

A highly resilient RESTful API for payment processing and gateway orchestration developed with **AdonisJS 6** and **TypeScript**. This service implements dynamic contingency rules, automatic gateway failovers, and robust backend validation.

---

## 🎯 Key Features

This microservice implements robust design patterns and secure third-party payment integrations:

- **Gateway Orchestration:** Real-time routing and fallback execution between multiple payment providers to maximize transaction success rates.

- **Data Integrity:** Strict server-side validation of transactional states, dynamic pricing, and checkout payloads.

- **Security:** Access control powered by standard Role-Based Access Control (RBAC) schemas.

---

## 🛠️ Technical Stack

- **Framework:** [AdonisJS 6](https://adonisjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** MySQL 8.0 (Lucid ORM)
- **Validation:** VineJS
- **Testing:** Japa (Functional Testing)
- **Infrastructure:** Docker & Docker Compose

---

## 🏗️ Design Patterns & Architecture

To ensure code maintainability, clean architecture standards, and performance, the system is structured around well-established backend design patterns:

- **Strategy Pattern:** Decouples external gateway integrations through a unified provider interface, facilitating seamless onboarding of new payment processors.

- **Service Layer:** Encapsulates business logic, fee calculations, and transaction retries in isolated, testable services.

- **Fallback / Failover System:** Handles downstream network timeouts or gateway errors by automatically rerouting transactions to backup providers.

- **Data Modeling:** Normalized relational database structure using dynamic transaction mappings to support multi-item cart purchases.

---

## 🚀 Getting Started

### 1. Initial Setup

```bash
git clone <REPOSITORY_URL>
cd multi-gateway-payment-api
cp .env.example .env

```

2. Infrastructure (Docker)

The project includes a complete environment via Docker Compose, launching the API, the MySQL database, and gateway mocks for failure simulation:

```Bash

docker compose up -d --build

```

3. Migrations and Seeds

To populate the database with access profiles and test products:

```Bash

docker exec -it payment_app node ace migration:run --force
docker exec -it payment_app node ace db:seed

```

🧪 Test Coverage

Functional tests were developed to validate the critical payment flow and effectiveness Fallback:

```Bash

docker exec -it payment_app node ace test
```

## 👥 Configured Access Profiles

| Email                 | Password   | Profile     | Permissions                     |
| :-------------------- | :--------- | :---------- | :------------------------------ |
| `admin@payments.io`   | `password` | **ADMIN**   | Full system access              |
| `manager@payments.io` | `password` | **MANAGER** | User and product management     |
| `finance@payments.io` | `password` | **FINANCE** | Product and refund management   |
| `user@payments.io`    | `password` | **USER**    | Purchase processing and history |

🛣️ Main Endpoints
Business Routes

- `POST /login: Authentication and token generation.`

- `POST /purchase: Purchase processing (includes automatic fallback logic).`

Administrative Routes (Require Auth)

- `GET /transactions: Payment listing and auditing.`

- `PUT /gateways/:id: Configuration and switching of active providers. POST /transactions/:id/charge_back: Chargeback processing.`

Developed by Gabriel Penha. Built as a high-performance payment orchestration microservice.
