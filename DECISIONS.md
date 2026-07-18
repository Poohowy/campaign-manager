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