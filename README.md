# Solvence

A forward cashflow and burn-rate operating system.

Solvence is engineered specifically to answer the core financial question:
> **"How much money do I actually have available, what bills are already committed, and how much can I safely spend today?"**

Unlike conventional backward-looking expense trackers that merely categorize past transactions, Solvence models forward runway by bridging actual cash reserves with upcoming committed obligations across individual pay cycles.

---

## 1. Project Overview

Solvence is built as a clean, high-precision financial operating system designed for professionals, freelancers, and businesses. It eliminates cashflow uncertainty by continually computing:
* **Liquid Reserve:** True liquid capital currently held.
* **Committed Bills:** Upcoming recurring obligations due in the remaining portion of the current pay cycle.
* **Available Cash:** Discretionary liquidity remaining after accounting for committed liabilities.
* **Safe Daily Spend:** Deterministic daily spending limit across remaining cycle days.
* **Life Hours:** Real cost of discretionary outflows expressed in hours of labor based on verified hourly wage.

---

## 2. Core Financial Model

### 2.1 Liquid Reserve
$$\text{Liquid Reserve} = \text{Opening Balance} + \sum \text{Income} - \sum \text{Expenses}$$

All monetary calculations use arbitrary-precision decimal arithmetic (`BigDecimal` in Java, `NUMERIC(14,2)` in PostgreSQL). Floating-point math (`double`, `float`) is strictly prohibited.

### 2.2 Committed Bills
$$\text{Committed Bills} = \sum \text{Active Recurring Obligations Due in Remaining Cycle}$$

Recurring obligations represent forecast commitments, not realized transactions. Obligations are evaluated against the current pay cycle `[cycleStart, cycleEnd]` with deterministic calendar clamping (e.g., handling due day 31 in February or 30-day months). Only obligations due on or after `today` are counted.

### 2.3 Available Cash
$$\text{Available Cash} = \text{Liquid Reserve} - \text{Committed Bills}$$

### 2.4 Safe Daily Spend
$$\text{Safe Daily Spend} = \frac{\text{Available Cash}}{\text{Days Remaining in Cycle}}$$

* **Date Convention:** Inclusive calculation: $\text{daysRemaining} = \text{ChronoUnit.DAYS.between}(\text{today}, \text{cycleEnd}) + 1$.
* **Boundary Safeguards:** If $\text{daysRemaining} = 0$, $\text{safeDailySpend} = \max(0, \text{Available Cash})$. If $\text{Available Cash} \le 0$, safe spend returns `0.00` without hiding the deficit. Division by zero is mathematically impossible.

### 2.5 Life Hours
$$\text{Life Hours} = \frac{\text{Transaction Amount}}{\text{Verified Hourly Wage}}$$

Computed using `BigDecimal` with `RoundingMode.HALF_UP` to 1 decimal place. When hourly wage is zero or undefined, returns `null` safely.

---

## 3. Technology Stack

### Backend
* **Language:** Java 21 (LTS)
* **Framework:** Spring Boot 3.3.5
* **Persistence:** Spring Data JPA, Hibernate ORM 6.5
* **Schema Evolution:** Flyway 10 (PostgreSQL engine)
* **Validation:** Jakarta Bean Validation (Hibernate Validator)
* **Build Tool:** Maven Wrapper (`mvnw`, `mvnw.cmd`)
* **Database:** PostgreSQL 18+

### Frontend
* **Core:** React 19, JavaScript (ES2022+)
* **Tooling:** Vite 6
* **Styling:** Tailwind CSS v4 (Light fintech theme, Inter & JetBrains Mono typography)
* **HTTP Client:** Axios with centralized interceptors
* **Icons:** Lucide React

---

## 4. Architecture

```text
React 19 (Vite + Tailwind CSS v4)
         │
         ▼  (Axios Client / Local Vite Proxy)
Spring Boot 3.3.5 REST Controllers
         │
         ▼  (Jakarta Validation / DTO Mapping)
Service Layer & Boundary Security
         │
         ├─► CurrentUserProvider (MockCurrentUserProvider: 1L)
         ├─► RunwayCalculationService (Modular Calculators)
         │
         ▼  (Spring Data JPA / Hibernate ddl-auto=validate)
Flyway Database Migrations (V1__initial_schema.sql)
         │
         ▼
PostgreSQL 18 Database (NUMERIC Financial Precision)
```

### Architectural Principles
1. **Decoupled User Boundary:** Business services resolve the user identity via the `CurrentUserProvider` abstraction. For Phase 1, `MockCurrentUserProvider` returns `1L`. Phase 2 will plug in real JWT security without modifying business services.
2. **DTO Encapsulation:** JPA Entities are never directly exposed to REST endpoints.
3. **Database Single Source of Truth:** Schema evolution is strictly managed by Flyway; Hibernate runs with `ddl-auto: validate`.

---

## 5. Repository Structure

```text
Solvence/
├── .env.example                     # Environment template (no secrets committed)
├── .gitignore                       # Multi-tier ignore rules
├── README.md                        # Documentation
├── backend/
│   ├── mvnw / mvnw.cmd              # Maven Wrapper
│   ├── pom.xml                      # Spring Boot 3.3.5 dependencies
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/solvence/
│   │   │   │   ├── config/          # WebConfig (CORS), TimeConfig (Clock bean)
│   │   │   │   ├── controller/      # Health, Categories, Transactions, Runway
│   │   │   │   ├── dto/             # Request & Response records
│   │   │   │   ├── entity/          # User, Category, Transaction, RecurringObligation
│   │   │   │   ├── exception/       # RFC 7807 ProblemDetail GlobalExceptionHandler
│   │   │   │   ├── repository/      # Spring Data JPA repositories
│   │   │   │   ├── security/        # CurrentUserProvider & MockCurrentUserProvider
│   │   │   │   └── service/
│   │   │   │       ├── CategoryService.java
│   │   │   │       ├── DataInitializer.java
│   │   │   │       ├── TransactionService.java
│   │   │   │       └── runway/      # Balance, Cycle, SafeSpend, LifeHour calculators
│   │   │   └── resources/
│   │   │       ├── application.yml  # Safe environment variable configuration
│   │   │       └── db/migration/
│   │   │           └── V1__initial_schema.sql
│   │   └── test/java/com/solvence/  # 31 isolated unit tests
└── frontend/
    ├── package.json
    ├── vite.config.js               # Dev server & backend proxy
    ├── index.html                   # HTML entry with typography
    └── src/
        ├── App.jsx                  # Root shell container
        ├── main.jsx                 # Entry point
        ├── index.css                # Tailwind CSS v4 & tabular numeral rules
        ├── components/
        │   ├── layout/              # AppShell, navigation
        │   ├── dashboard/           # MetricCard, FinancialSummaryGrid
        │   ├── transactions/        # TransactionLedger, TransactionDialog
        │   └── common/              # Skeletons, EmptyState, ErrorBanner
        ├── services/                # Centralized Axios api.js
        └── utils/                   # currency.js (INR), date.js
```

---

## 6. Local Prerequisites

* **Java:** OpenJDK 21 LTS
* **Node.js:** v20+ (tested on Node v22.23.2, npm 12.0.2)
* **PostgreSQL:** Version 16+ (tested on PostgreSQL 18.6)
* **Git:** Version 2.40+

---

## 7. Environment Configuration

Copy the template to create a local `.env` file (which is git-ignored):

```bash
cp .env.example .env
```

Define credentials safely:

```env
# Database Configuration
DB_URL=jdbc:postgresql://127.0.0.1:5432/solvence
DB_USERNAME=postgres
DB_PASSWORD=your_local_password

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

> **Security Note:** Never commit database credentials or `.env` files into source control.

---

## 8. Database Setup

Ensure PostgreSQL is running on `127.0.0.1:5432`, then create the database:

```sql
CREATE DATABASE solvence ENCODING 'UTF8';
```

Flyway will automatically execute `V1__initial_schema.sql` on backend startup, generating the schema, indexes, and constraints.

---

## 9. Backend Startup

Use the included Maven Wrapper:

### Linux / macOS
```bash
cd backend
export DB_PASSWORD=your_local_password
./mvnw spring-boot:run
```

### Windows (PowerShell)
```powershell
cd backend
$env:DB_PASSWORD = "your_local_password"
.\mvnw.cmd spring-boot:run
```

Backend will initialize on port `8080`.

---

## 10. Frontend Startup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173/`. In development, Vite automatically proxies `/api` calls to port `8080`.

---

## 11. Current Phase 1 Status

Phase 1 is **COMPLETE** and **FULLY VERIFIED**:
* ✅ PostgreSQL 18.6 native integration verified
* ✅ Flyway V1 migration verified
* ✅ Hibernate schema validation verified
* ✅ Deterministic DataInitializer verified (seeds User 1, 6 categories, default obligation)
* ✅ Transaction CRUD and user-scoping verified
* ✅ Runway calculation engine with deterministic pay cycle edge-case clamping verified
* ✅ React 19 + Tailwind CSS v4 dashboard verified
* ✅ 31 unit tests passing (`mvnw.cmd test`)
* ✅ Frontend lint and production build verified (`npm run lint`, `npm run build`)

---

## 12. API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check (`{"status": "UP"}`) |
| `GET` | `/api/v1/categories` | Returns accessible system & user categories |
| `GET` | `/api/v1/runway/summary` | Real-time cashflow, liquid reserve, safe daily spend |
| `GET` | `/api/v1/transactions` | Lists user-scoped transactions, newest first |
| `POST` | `/api/v1/transactions` | Records transaction with category ownership check |
| `DELETE` | `/api/v1/transactions/{id}` | Deletes transaction with ownership verification |

---

## 13. Testing & Verification

Run the backend test suite:
```bash
cd backend
./mvnw test        # Linux / macOS
.\mvnw.cmd test    # Windows
```

Run frontend verification:
```bash
cd frontend
npm run lint
npm run build
```

---

## 14. Security Notes

* **User Isolation:** All operations enforce user boundaries at the service and repository levels. Users cannot create transactions referencing another user's categories, nor delete another user's transactions (returns HTTP 403).
* **Mock Provider in Phase 1:** Phase 1 uses `MockCurrentUserProvider` (returning user ID `1L`). Authentication, registration, and JWT token exchange are planned for Phase 2.
* **Error Sanitization:** All controller exceptions are mapped to RFC 7807 `ProblemDetail` without leaking internal stack traces or SQL dialects.

---

## 15. Future Development Phases

* **Phase 2:** Authentication & Authorization (JWT, BCrypt, Spring Security, Multi-tenancy).
* **Phase 3:** Burn Analytics & Visualizations (Recharts, Burn trajectory, Category breakdowns).
* **Phase 4:** Quick Capture Parser (Natural-language financial transaction entry).
* **Phase 5:** Production Readiness (Observability, Containerization, Rate limiting).
