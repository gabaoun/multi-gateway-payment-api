# Multi-Gateway Payment API

A robust and resilient RESTful API for payment management, featuring multi-gateway support and automatic fallback logic. This project demonstrates high-level software engineering practices using AdonisJS 6.

---

## 🚀 Key Features

- **Dynamic Purchase Calculation:** Total amounts are calculated on the backend, fetching real-time product prices from the database.
- **Multi-Gateway Integration:** Seamless integration with multiple payment gateways, each with specific authentication methods (Bearer Token, Custom Headers).
- **Smart Fallback System:** If the primary gateway fails (e.g., CVV errors, timeout), the system automatically routes the charge to the next available gateway, ensuring a smooth user experience.
- **Role-Based Access Control (RBAC):** Strict access control for ADMIN, MANAGER, FINANCE, and USER profiles.
- **TDD (Test-Driven Development):** Comprehensive functional test suite covering success, failure, and fallback flows.
- **Full Dockerization:** Complete infrastructure via Docker Compose, including MySQL database and gateway mocks.

---

## 🛠️ Tech Stack

- **Framework:** [AdonisJS 6](https://adonisjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** MySQL 8.0 (Lucid ORM)
- **Validation:** VineJS
- **Testing:** Japa
- **Infrastructure:** Docker & Docker Compose

---

## ⚙️ Architecture & Design Patterns

- **Strategy Pattern:** Gateway integrations are decoupled through a common interface. Adding a new gateway only requires creating a new strategy class, keeping the `PaymentService` clean and maintainable.
- **Service Layer:** All business logic for payment orchestration and fallback resides in dedicated services, following the Single Responsibility Principle.
- **Automatic Fallback:** Failure logic is implemented to handle instabilities. If Gateway 1 returns a specific failure (like CVV mismatch in mock), the system transparently attempts Gateway 2.
- **Database Schema:** Optimized structure with pivot tables (`transaction_products`) for multi-item purchases.

---

## 🚀 Getting Started

### 1. Setup

```bash
git clone <YOUR_REPOSITORY_URL>
cd multi-gateway-payment-api
cp .env.example .env
```

### 2. Infrastructure (Docker)

Start the API, MySQL database, and gateway mocks:

```bash
docker compose up -d --build
```

### 3. Database Preparation

Run migrations and seed initial data:

```bash
docker exec -it payment_app node ace migration:run --force
docker exec -it payment_app node ace db:seed
```

---

## 🧪 Testing

To validate system integrity and fallback logic:

```bash
docker exec -it payment_app node ace test
```

---

## 👥 Access Profiles (Seeds)

| Email                  | Password   | Role        | Permissions           |
| :--------------------- | :--------- | :---------- | :-------------------- |
| `admin@payments.io`    | `password` | **ADMIN**   | Full Access           |
| `manager@payments.io`  | `password` | **MANAGER** | Users & Products      |
| `finance@payments.io`  | `password` | **FINANCE** | Products & Refunds    |
| `user@payments.io`     | `password` | **USER**    | Purchases & History   |

---

## 🛣️ API Endpoints

### 🟢 Public Routes

- **Login:** `POST /login`
- **Purchase:** `POST /purchase`
  - _Example Payload:_
    ```json
    {
      "client": { "name": "John Doe", "email": "john@example.com" },
      "payment": { "cardNumber": "5569000000006063", "cvv": "010" },
      "products": [{ "id": 1, "quantity": 2 }]
    }
    ```

### 🔴 Private Routes (`Authorization: Bearer <token>`)

- **Transactions:** `GET /transactions`, `GET /transactions/:id`, `POST /transactions/:id/charge_back`
- **Gateways:** `GET /gateways`, `PUT /gateways/:id`
- **Clients:** `GET /clients`, `GET /clients/:id`
- **CRUDs:** `/users`, `/products`

---

Developed by [Gabriel Penha (Gabaoun)](https://github.com/Gabaoun).
