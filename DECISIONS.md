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

## ADR-010

### Title

Authentication handled entirely by Supabase

### Decision

The frontend communicates directly with Supabase Authentication.

FastAPI does not implement authentication logic.

Backend trusts JWT tokens issued by Supabase.

### Reason

This significantly reduces backend complexity while leveraging a secure, managed authentication provider.

### Status

Accepted

---

## ADR-012

Title: Authentication Form and Routing Architecture

Decision:
Authentication forms use `react-hook-form` with `zod` schemas for reusable validation.

Authentication pages are organized under `/auth/*` (`/auth/login`, `/auth/register`, `/auth/forgot-password`).

Route access is enforced with two guards:

- `PublicOnlyRoute` for authentication pages
- `ProtectedRoute` for authenticated application pages

Supabase auth operations are centralized in `features/auth/api/auth-client.ts`.

Reason:
Creates a scalable and consistent authentication boundary, avoids duplicated validation logic, and keeps auth behavior isolated inside the auth feature.

Status:
Accepted

## ADR-011

### Title

UI Component Library

### Decision

The project uses **shadcn/ui** as the default UI component library.

### Reason

shadcn/ui provides modern, accessible and reusable components that integrate naturally with Tailwind CSS. Components are copied into the project, allowing full customization without vendor lock-in. The library is well understood by AI coding assistants, improving implementation quality and consistency.

### Status

Accepted