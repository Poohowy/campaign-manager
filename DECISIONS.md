# Architectural Decision Records

## ADR-001

Title: Monorepo Structure

Decision:
The project uses a monorepo with separate frontend and backend applications.

Reason:
Allows independent deployment to Vercel and Google Cloud Run while keeping a single repository.

Status:
Accepted

---

## ADR-002

Title: Authentication

Decision:
Supabase Authentication.

Reason:
Provides secure authentication with minimal implementation effort.

Status:
Accepted

---

## ADR-003

Title: Database

Decision:
Supabase PostgreSQL.

Reason:
Managed PostgreSQL with built-in authentication and Row Level Security.

Status:
Accepted

---

## ADR-004

Title: Backend Framework

Decision:
FastAPI.

Reason:
Clear architecture, excellent typing, easy deployment, good AI ecosystem.

Status:
Accepted

---

## ADR-005

Title: Frontend Framework

Decision:
React + Vite + TypeScript.

Reason:
Fast development, modern tooling and strong ecosystem.

Status:
Accepted

---

## ADR-006

Title: Authentication Flow

Decision:
The frontend authenticates directly against Supabase Authentication.

FastAPI validates Supabase JWT tokens and never performs user authentication itself.

Reason:
This reduces backend complexity and leverages Supabase as the identity provider.

Status:
Accepted

---

## ADR-007

Title: Backend Supabase Connectivity Check

Decision:
The backend verifies Supabase connectivity using a service-role Supabase client.

The infrastructure check performs a lightweight authentication admin call.

Reason:
Keeps integration validation in the backend and avoids coupling connectivity checks to frontend state.

Status:
Accepted

---

## ADR-008

Title: Health Endpoint Contract

Decision:
The backend exposes `GET /health` with a structured response including:

- service status
- runtime environment
- Supabase configuration state
- Supabase connectivity state

The endpoint returns `200` when dependencies are healthy and `503` when degraded.

Reason:
Provides a predictable readiness signal for local debugging and future deployment monitoring.

Status:
Accepted

---

## ADR-009

Title: Frontend Route Protection Baseline

Decision:
Authentication state is centralized in an `AuthProvider`.

Protected application routes are gated through a `ProtectedRoute` component, while `/auth` remains public until authentication pages are implemented.

Reason:
Establishes a scalable authentication boundary without introducing login/register UI in infrastructure sprint scope.

Status:
Accepted