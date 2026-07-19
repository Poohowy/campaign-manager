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

## ADR-012

Title: REST API Versioning

Decision:
The backend exposes all endpoints under `/api/v1`. Future breaking changes will be introduced through new API versions rather than modifying existing endpoints.

Reason:
Provides a stable API contract for the frontend, enables backward compatibility in future releases, and allows the API to evolve without breaking existing clients.

Status:
Accepted

---

## ADR-013

Title: Standardized API Response Format

Decision:
All successful API responses use a consistent response envelope containing a `data` field. Collection endpoints additionally include a `pagination` object. Error responses always return an `error` object containing a machine-readable `code` and a human-readable `message`.

Reason:
A consistent response structure simplifies frontend development, reduces error-handling complexity, improves API predictability, and makes future integrations easier.

Status:
Accepted

## ADR-014

Title: Database-First Development

Decision:
The database schema is designed and reviewed before implementing SQLAlchemy models, repositories, or API endpoints. The approved database design serves as the single source of truth for the backend implementation.

Reason:
Designing the data model first reduces costly refactoring, improves consistency across the backend, and ensures that business requirements are reflected in the database before implementation begins.

Status:
Accepted

---

## ADR-015

Title: User Ownership Foreign Key Strategy

Decision:
Business tables store `user_id` as `UUID NOT NULL` without a database-level foreign key to Supabase `auth.users`.

Ownership and access control are enforced through Supabase JWT identity and Row Level Security policies.

Reason:
Keeps the application schema decoupled from Supabase-managed internal auth tables while preserving strict user ownership semantics at the authorization layer.

Status:
Accepted

---

## ADR-016

Title: Database Naming Canonicalization

Decision:
`DATABASE.md` is the canonical source for database naming and schema details.

Implementation names must follow it exactly, including:

- `password_encrypted`
- `body_markdown`
- `CampaignStatus`
- `CampaignMessageStatus`

Reason:
Prevents schema drift between documents and implementation, reduces migration rework, and keeps backend/database contracts predictable.

Status:
Accepted

---

## ADR-017

Title: ADR Document Governance

Decision:
ADR entries must follow a consistent structure and unique numbering:

- one ADR number used exactly once
- uniform section labels (`Title`, `Decision`, `Reason`, `Status`)
- append-only numbering for new accepted decisions

Existing duplicate or inconsistent ADR entries should be normalized in a dedicated documentation cleanup pass, without changing the underlying accepted decisions.

Reason:
Improves traceability, avoids ambiguity during implementation, and keeps architecture decisions auditable as the project grows.

Status:
Accepted

## ADR-018

Title: API Base Path

Decision:

All backend endpoints are exposed under `/api/v1`.

No public endpoints are exposed outside the versioned API namespace.

Reason:

Using a versioned API from the beginning provides a stable contract, simplifies future evolution of the API, and avoids breaking changes when introducing new versions.

Status:

Accepted

---

## ADR-019

Title: Backend JWT Validation Strategy

Decision:
Protected backend endpoints validate bearer tokens by calling Supabase Auth `get_user` with the received access token.

Request identity is derived from the validated Supabase user and propagated as `user_id` for service-layer authorization.

Reason:
This avoids custom authentication logic in FastAPI, keeps identity verification aligned with Supabase as the source of truth, and ensures request-level user scoping.

Status:
Accepted

---

## ADR-020

Title: Incremental API Response Envelope Rollout

Decision:
The standardized API response envelope from `API.md` is rolled out incrementally by module.

Customer endpoints must already return:

- success payloads in `data` envelopes
- collection payloads with `pagination`
- failures as `error` objects with `code` and `message`

Existing non-customer endpoints are migrated in subsequent sprints.

Reason:
Allows consistent contracts for newly delivered features without forcing a broad refactor across unrelated modules in the same sprint.

Status:
Accepted