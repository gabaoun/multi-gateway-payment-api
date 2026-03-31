# Multi-Gateway Payment API

This project is a case study focused on developing a RESTful API for payment processing using **AdonisJS 6**. The main objective was to implement a payment orchestration system that handles multiple providers and contingency rules.

---

## 🎯 Project Objectives

As part of my transition to Backend development, this repository documents the implementation of design patterns and integration logic with external services. The main focuses were:

- **Gateway Orchestration:** Implementing logic to switch between different payment providers.

- **Persistence and Integrity:** Ensuring that value calculations and transaction states are validated exclusively on the server.

- **Access Security:** Implementing user-level-based permission control (RBAC).

---

## 🛠️ Technical Stack

- **Framework:** [AdonisJS 6](https://adonisjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** MySQL 8.0 (Lucid ORM)
- **Validation:** VineJS
- **Testing:** Japa (Functional Testing)
- **Infrastructure:** Docker & Docker Compose

---

## 🏗️ Design Patterns & Applied Logic

To ensure code maintainability, I used concepts that I transferred from my experience with C++ to the web ecosystem:

- **Strategy Pattern:** Integrations with gateways were decoupled through a common interface. This allows adding new providers without altering the core logic of the `PaymentService`.

- **Service Layer:** All business rules, including rate calculation and retry logic, are isolated in dedicated services.

- **Fallback System:** Error handling implementation where, if the primary gateway returns a communication failure or specific error (e.g., timeout), the system automatically redirects the request to a secondary provider.

- **Data Modeling:** Normalized database structure, using dynamic tables to support multiple items per transaction.

---

## 🚀 How to Run the Study

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

````

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

| Email | Password | Profile | Permissions |
| :--- | :--- | :--- | :--- |
| `admin@payments.io` | `password` | **ADMIN** | Full system access |
| `manager@payments.io` | `password` | **MANAGER** | User and product management |
| `finance@payments.io` | `password` | **FINANCE** | Product and refund management |
| `user@payments.io` | `password` | **USER** | Purchase processing and history |

🛣️ Main Endpoints
Business Routes

- ```POST /login: Authentication and token generation.```

- ```POST /purchase: Purchase processing (includes automatic fallback logic).```

Administrative Routes (Require Auth)

- ```GET /transactions: Payment listing and auditing.```

- ```PUT /gateways/:id: Configuration and switching of active providers. POST /transactions/:id/charge_back: Chargeback processing.```

Developed by Gabriel Penha (Gabaoun) Study project in transition to Backend Software Engineering.
