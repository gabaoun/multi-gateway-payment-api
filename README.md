# Multi-Gateway Payment API

<p align="left">
  <img src="https://img.shields.io/badge/TypeScript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/AdonisJS-220052?style=for-the-badge&logo=AdonisJS&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
</p>

A highly resilient RESTful API for payment processing and gateway orchestration developed with **AdonisJS 6** and **TypeScript**. This microservice implements dynamic contingency rules, automatic gateway failovers, and robust backend validation.

## 🏛️ System Architecture & Design Patterns

To ensure maintainability, testability, and enterprise-grade performance, the system heavily utilizes established backend design patterns:

- **Strategy Pattern:** Decouples external gateway integrations through a unified provider interface, facilitating seamless onboarding of new payment processors without modifying core logic.
- **Service Layer:** Encapsulates business logic, fee calculations, and transaction retries in isolated, testable services.
- **Fallback / Failover System:** Handles downstream network timeouts or third-party gateway errors by automatically rerouting transactions to backup providers.
- **Data Integrity & Security:** Employs strict server-side validation (VineJS), dynamic pricing checks, and Role-Based Access Control (RBAC) schemas to secure transactional states.

## 🐳 Quick Start

```bash
# Clone the repository
git clone https://github.com/gabaoun/multi-gateway-payment-api.git
cd multi-gateway-payment-api

# Boot the database and application via Docker
docker-compose up -d
```
