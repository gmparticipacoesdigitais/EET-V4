# Calculo de Encargos Trabalhistas — Firebase + Google Auth

[![CI](https://github.com/gmparticipacoesdigitais/estimativa-de-encargos-trabalhistas/actions/workflows/ci.yml/badge.svg)](https://github.com/gmparticipacoesdigitais/estimativa-de-encargos-trabalhistas/actions/workflows/ci.yml)

This app integrates Google Sign-In (Firebase Auth) and Firestore to manage tenants, users, employees and calculations. Backend is Express (Node) with Firebase Admin.

Google One Tap (GSI)
- Optional, non-blocking One Tap flow enabled when `VITE_GOOGLE_GSI_CLIENT_ID` is set.
- Falls back automatically to the regular Google button (popup → redirect if blocked).

Java Backend (optional)
- A minimal Spring Boot backend is included in `java-backend/` that validates Firebase ID tokens server-side.
- Run with `mvn spring-boot:run` inside `java-backend` (requires JDK 17+ and `GOOGLE_APPLICATION_CREDENTIALS`).
- CORS allows `http://localhost:8080` by default and exposes `/health` and `/me` endpoints.

Key features
- Google Auth with session persistence; `/api/session/ensure` syncs profile/claims.
- Firestore structure under `/tenants/{tenantId}` with employees, calculations and audit logs.
- RBAC via custom claims: OWNER, ADMIN, ANALYST, VIEWER.
- Firestore Rules enforcing tenant isolation and immutable calculations.
- Firebase Emulator Suite for local development.

Environment
- Front (Vite): set `VITE_FIREBASE_*`, `VITE_APP_TIMEZONE`, `VITE_APP_FEATURE_EMULATORS`.
- Back (Express): set `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS` (when not using emulators), `APP_TIMEZONE`, `PORT`.

Quick start
1) Copy `.env.example` to `.env` and fill in values. For local emulator use, set:
   - `VITE_APP_FEATURE_EMULATORS=1`
   - `FIREBASE_PROJECT_ID=demo-project` (or your id)
2) Install deps: `npm install`
3) Run backend+frontend: `npm run dev:full` (server + Vite) — backend on `:8888`, frontend on `:8080`.
4) Optionally run emulators: `npm run dev:emulators`
5) (Optional) Java backend: `cd java-backend && mvn spring-boot:run` (server on `http://localhost:9090`).

Emulators
- Config is in `firebase.json` and `firestore.rules`.
- Start: `firebase emulators:start --import=./.seed --export-on-exit` (or `npm run dev:emulators`).
- Front automatically connects when `VITE_APP_FEATURE_EMULATORS=1` and `vite` runs in dev.

Ports
- Frontend (Vite): 8080
- Node API (Express): 8888
- Firebase Emulators: Auth 9099, Firestore 8081, UI 4000
- Java API (Spring Boot): 9090

API
- `POST /api/session/ensure` (Auth): Ensure profile `/tenants/{tenantId}/users/{uid}` and set custom claims.
- `GET /api/employees` (Auth, tenant): List employees.
- `POST /api/employees` (OWNER/ADMIN): Create/update with dedupe by `(nome+admissao+desligamento)`.
- `POST /api/calculations` (OWNER/ADMIN/ANALYST): Create calculation with snapshot and idempotency.

Firestore structure
- `/tenants/{tenantId}`
  - `users/{uid}`: profile + roles
  - `employees/{employeeId}`
  - `settings/current`: year tables (`aliquotas`), `regrasProrata`
  - `calculations/{calcId}`: immutable
  - `auditLogs/{logId}`

Testing
- Unit/integration via Vitest. Add tests under `server/` or `src/` as needed.

Quality/CI
- Node 20 (ver `./.nvmrc`).
- Lint: `npm run lint`
- Test: `npm test`
- Build: `npm run build`
- CI automatizado em GitHub Actions (arquivo `.github/workflows/ci.yml`).

Notes
- Do not expose service accounts in frontend.
- Dates stored in UTC; display in `America/Fortaleza`.
- Rounding in cents (half up, 2 decimals).
 - Login route: use `/login.html` (static page). The app avoids redirect loops on this path.
 - Legacy React code exists under `src/` but is not part of the current build; entrypoint is `src/main.ts`.
