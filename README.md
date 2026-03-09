# BeTalent - Sistema de Pagamentos Multi-Gateway (Nível 3)

Este repositório contém a implementação do Teste Prático para Desenvolvedor Back-end na BeTalent. A aplicação consiste em uma API RESTful para gerenciamento de pagamentos com suporte a múltiplos gateways e fallback automático.

---

## 🏆 Nível de Implementação: 3 (Pleno)

Este projeto foi desenvolvido para atender aos critérios do **Nível 3**, incluindo:

- **Cálculo de Compra no Back-end:** O valor total é calculado com base nos produtos e quantidades, consultando preços diretamente no banco de dados.
- **Multi-Gateways com Autenticação:** Integração completa com dois gateways distintos, cada um com seu método de autenticação (Bearer Token e Headers específicos).
- **Fallback Inteligente:** Se o gateway prioritário falhar (ex: erro de CVV no mock), o sistema roteia a cobrança para o próximo gateway disponível sem interromper a experiência do usuário.
- **RBAC (Role Based Access Control):** Controle de acesso rígido para perfis ADMIN, MANAGER, FINANCE e USER.
- **TDD (Test Driven Development):** Suíte de testes funcionais cobrindo fluxos de sucesso, falha e fallback.
- **Dockerização Total:** Infraestrutura completa via Docker Compose, incluindo banco de dados MySQL e os mocks dos gateways.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** AdonisJS 6 (Node.js)
- **Linguagem:** TypeScript
- **Banco de Dados:** MySQL 8.0 (Lucid ORM)
- **Validação:** VineJS
- **Testes:** Japa
- **Infraestrutura:** Docker & Docker Compose

---

## 🚀 Como Iniciar o Projeto

### 1. Clonar e Configurar

```bash
git clone <URL_DO_REPOSITORIO>
cd multi-gateway-payment-api
cp .env.example .env
```

### 2. Subir Infraestrutura (Docker)

Este comando iniciará a API, o banco MySQL e os mocks dos gateways:

```bash
docker compose up -d --build
```

### 3. Preparar o Banco de Dados

Execute as migrações e popule o banco com os dados iniciais (usuários, produtos e gateways):

```bash
docker exec -it betalent_app node ace migration:run --force
docker exec -it betalent_app node ace db:seed
```

---

## 🧪 Testes Automatizados (TDD)

Para validar a integridade do sistema e a lógica de fallback:

```bash
docker exec -it betalent_app node ace test
```

---

## 👥 Perfis de Acesso (Seeds)

| Email                   | Senha      | Role        | Permissões            |
| :---------------------- | :--------- | :---------- | :-------------------- |
| `admin@betalent.tech`   | `password` | **ADMIN**   | Acesso Total          |
| `manager@betalent.tech` | `password` | **MANAGER** | Usuários e Produtos   |
| `finance@betalent.tech` | `password` | **FINANCE** | Produtos e Reembolsos |
| `user@betalent.tech`    | `password` | **USER**    | Compras e Consultas   |

---

## 🛣️ API Endpoints

### 🟢 Rotas Públicas

- **Login:** `POST /login`
- **Realizar Compra:** `POST /purchase`
  - _Payload Exemplo:_
    ```json
    {
      "client": { "name": "João", "email": "joao@email.com" },
      "payment": { "cardNumber": "5569000000006063", "cvv": "010" },
      "products": [{ "id": 1, "quantity": 2 }]
    }
    ```

### 🔴 Rotas Privadas (`Authorization: Bearer <token>`)

- **Transações:**
  - `GET /transactions` - Listar histórico.
  - `GET /transactions/:id` - Detalhes da compra.
  - `POST /transactions/:id/charge_back` - Solicitar reembolso (Admin/Finance).
- **Gateways:**
  - `GET /gateways` - Listar gateways ativos e prioridades.
  - `PUT /gateways/:id` - Ativar/Desativar ou alterar prioridade (Admin).
- **Clientes:**
  - `GET /clients` - Listar clientes únicos.
  - `GET /clients/:id` - Detalhe do cliente e histórico de compras.
- **CRUDs:**
  - `/users` (Admin/Manager)
  - `/products` (Admin/Manager/Finance)

---

## ⚙️ Arquitetura e Padrões de Projeto

- **Strategy Pattern:** As integrações com Gateways são desacopladas através de uma interface comum. Adicionar um novo gateway requer apenas a criação de uma nova classe de estratégia, sem alterar a lógica de `PaymentService`.
- **Service Layer:** Toda a regra de negócio de orquestração de pagamentos e fallback reside em serviços dedicados, mantendo os controllers limpos.
- **Fallback Automático:** A lógica de falha foi testada usando os CVVs reservados do mock. Se o Gateway 1 retornar erro (como ocorre com o CVV 100), o sistema tenta o Gateway 2 de forma transparente.
- **Database Schema:** Estrutura otimizada com tabelas pivot (`transaction_products`) para suporte a múltiplos itens por compra, seguindo rigorosamente as nomenclaturas sugeridas no enunciado.

---

Desenvolvido por **Gabriel (Gabaoun) Penha**.
