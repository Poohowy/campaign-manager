# Campaign Manager

## Development Tasks

This document describes the implementation roadmap for the MVP.

Each task should be completed independently.

The application must remain fully functional after every completed task.

---

# Phase 1 — Project Setup

## Task 1

Create repository structure.

* frontend
* backend
* documentation

---

## Task 2

Create React project.

* Vite
* TypeScript
* Tailwind
* React Router
* TanStack Query

Acceptance Criteria

* Application starts successfully.

---

## Task 3

Create FastAPI project.

Configure:

* uv
* SQLAlchemy
* Alembic
* project structure

Acceptance Criteria

* Backend starts successfully.

---

## Task 4

Create Supabase project.

Configure:

* Authentication
* Environment variables
* Database connection

Acceptance Criteria

* Frontend communicates with Supabase.

---

# Phase 2 — Authentication

## Task 5

Implement:

* Register
* Login
* Logout

Acceptance Criteria

Users can authenticate using Supabase.

---

## Task 6

Protect routes.

Acceptance Criteria

Unauthenticated users cannot access application pages.

---

# Phase 3 — Database

## Task 7

Create database schema.

Tables:

* customers
* templates
* campaigns
* campaign_messages
* smtp_settings

Acceptance Criteria

Alembic migrations created.

---

## Task 8

Enable Row Level Security.

Acceptance Criteria

Each user only accesses their own data.

---

# Phase 4 — Customer Import

## Task 9

Upload CSV/XLSX.

Acceptance Criteria

Files can be uploaded.

---

## Task 10

Implement column mapping.

Acceptance Criteria

User maps spreadsheet columns to application fields.

---

## Task 11

Import customers.

Acceptance Criteria

* Insert new customers.
* Update existing customers.
* Preserve campaign history.

---

# Phase 5 — Customer Management

## Task 12

Customer list.

Features:

* Search
* Sort
* Filter
* Multi-select

Acceptance Criteria

Customer table is fully usable.

---

# Phase 6 — Email Templates

## Task 13

Create template CRUD.

Acceptance Criteria

Templates can be created, edited and deleted.

---

## Task 14

Variable rendering.

Acceptance Criteria

Variables are correctly replaced.

---

## Task 15

Email preview.

Acceptance Criteria

Rendered email matches final output.

---

# Phase 7 — SMTP

## Task 16

SMTP configuration page.

Acceptance Criteria

User can save SMTP configuration.

---

## Task 17

Encrypt SMTP password.

Acceptance Criteria

Passwords are never stored in plaintext.

---

## Task 18

SMTP test.

Acceptance Criteria

User receives test email.

---

# Phase 8 — Campaigns

## Task 19

Create campaign.

Acceptance Criteria

Campaign record is created.

---

## Task 20

Send emails.

Acceptance Criteria

Selected customers receive personalized emails.

---

## Task 21

Store campaign messages.

Acceptance Criteria

Every email is stored independently.

---

# Phase 9 — Dashboard

## Task 22

Dashboard.

Display:

* Customers
* Templates
* Campaigns
* Latest campaign

Acceptance Criteria

Dashboard displays live statistics.

---

# Phase 10 — History

## Task 23

Campaign history.

Acceptance Criteria

User sees all campaigns.

---

## Task 24

Campaign details.

Acceptance Criteria

User sees every sent email with:

* Recipient
* Subject
* Body
* Status
* Error
* Sent Date

---

# MVP Complete

The MVP is complete when all tasks have been finished and the Definition of Done from PRD.md has been satisfied.

No additional features should be implemented before MVP completion.
