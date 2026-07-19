# Campaign Manager MVP

## Product Requirements Document (PRD)

**Version:** 1.0

**Status:** Ready for Development

---

# Project Vision

Campaign Manager is a lightweight SaaS application designed for small businesses that want to send personalized email campaigns using customer lists stored in Excel or CSV files.

The application should be extremely easy to use, quick to deploy, and solve one business problem exceptionally well:

> Import customers → Create a template → Send personalized emails → Track what was sent.

The goal is not to build a complete marketing automation platform.

The goal is to build a simple, reliable product that delivers value immediately.

---

# Primary Goal

**Build a production-quality MVP that can be demonstrated to the first customer within 2–3 days.**

Every development decision should support this objective.

Whenever a new feature is proposed, ask:

> Does this help us deliver the MVP to a customer within 2–3 days?

If not, move it to the backlog.

---

# Business Problem

Many small businesses keep their customer database in Excel spreadsheets.

Typical workflow:

* Maintain customers in Excel
* Copy email addresses manually
* Personalize emails manually
* Send emails one by one
* No history
* No campaign tracking

Campaign Manager automates this process.

---

# Target Users

Small businesses

Examples:

* Architecture firms
* Accounting offices
* Law firms
* Marketing agencies
* Consultants
* Small software companies

---

# MVP Scope

## Authentication

Use Supabase Authentication.

Features:

* Register
* Login
* Logout
* Email verification
* Persistent sessions
* Password reset

No custom authentication implementation.

---

## Customer Import

Supported formats:

* CSV
* XLSX

The application must support importing customer lists.

Import behavior:

* Insert new customers
* Update existing customers
* Never remove existing customers
* Never modify campaign history

Each customer is identified using:

`external_id`

---

## Column Mapping

After uploading a file, the user maps spreadsheet columns to application fields.

Required mappings:

* External Identifier
* Company Name
* Email

Optional mappings:

* Contact Name
* Phone

Every remaining column should be stored inside:

`custom_fields`

This mapping is NOT persisted in MVP.

---

## Customer Management

Display customers in a table.

Features:

* Search
* Sorting
* Filtering
* Multi-selection

Manual editing is NOT available.

Customer data is updated only through imports.

---

## Email Templates

Users can:

* Create
* Edit
* Delete

Unlimited templates (MVP).

Each template contains:

* Name
* Description
* Subject
* Body

Templates support variables:

```
{{company_name}}

{{contact_name}}

{{email}}

{{phone}}
```

and every field stored inside `custom_fields`.

---

## Email Preview

Before sending, the user selects:

* Customer
* Template

The application renders the final email exactly as it will be sent.

---

## Email Campaign

Workflow:

1. Select customers

2. Select template

3. Click Send

This creates a new campaign.

---

## Campaign History

Every send operation creates one Campaign.

Campaign contains:

* Name
* Template
* Status
* Created date
* Start date
* Finish date

Statuses:

* Draft
* Running
* Completed
* Failed

---

## Campaign Messages

Every sent email is stored separately.

Stored information:

* Recipient
* Subject
* Rendered Body
* Rendered Variables
* Status
* Sent Date
* Error Message

Statuses:

* Pending
* Sent
* Failed

---

## SMTP Configuration

Each user configures their own SMTP server.

Fields:

* Host
* Port
* Username
* Password
* From Name
* From Email

The application must provide:

**Test Connection**

Only one SMTP configuration per user in MVP.

---

# Data Model

## Customers

* id (UUID)
* user_id
* external_id
* company_name
* contact_name
* email
* phone
* custom_fields (JSONB)
* created_at
* updated_at

---

## Templates

* id
* user_id
* name
* description
* subject
* body
* created_at
* updated_at

---

## Campaigns

* id
* user_id
* template_id
* name
* status
* created_at
* started_at
* finished_at

---

## Campaign Messages

* id
* campaign_id
* customer_id
* email
* subject
* body
* rendered_variables (JSONB)
* status
* error_message
* sent_at

---

## SMTP Settings

* id
* user_id
* host
* port
* username
* encrypted_password
* from_name
* from_email
* created_at
* updated_at

---

# Security Requirements

Security is **NOT** optional.

The MVP may simplify business functionality, but it must not compromise security.

## Authentication

Use Supabase Auth only.

No custom authentication.

---

## Authorization

Every business table contains:

`user_id`

Enable Row Level Security (RLS).

Users must only access their own:

* Customers
* Templates
* Campaigns
* Campaign Messages
* SMTP Settings

---

## SMTP Passwords

Passwords must NEVER be stored in plaintext.

Passwords should be encrypted before being stored.

Encryption key must exist only in backend environment variables.

Frontend must never receive decrypted passwords.

---

## Secrets

Never store secrets inside the repository.

Use:

* .env
* Cloud Secret Manager

---

# Technology Stack

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* TanStack Query

---

## Backend

* FastAPI
* SQLAlchemy
* Alembic

---

## Database

* PostgreSQL
* Supabase Cloud

---

## Authentication

* Supabase Auth

---

## Deployment

Frontend:

* Vercel

Backend:

* Google Cloud Run

Database:

* Supabase Cloud

---

# Application Pages

* Login
* Register
* Dashboard
* Customers
* Import Customers
* Templates
* SMTP Settings
* New Campaign
* Campaign History
* Campaign Details

---

# Dashboard

Display:

* Number of Customers
* Number of Templates
* Number of Campaigns
* Last Campaign

Nothing more for MVP.

---

# Email Sending Flow

```
Import Customers

↓

Customer List

↓

Select Customers

↓

Select Template

↓

Preview

↓

Send

↓

Create Campaign

↓

Send Emails

↓

Store Campaign History

↓

Store Message History
```

---

# Development Principles

The application should be:

* Simple
* Clean
* Easy to extend
* Easy to maintain

Avoid unnecessary abstractions.

Prefer readability over cleverness.

Build the simplest solution that satisfies the requirements.

---

# Cursor Development Guidelines

You are acting as a Senior Full Stack Engineer.

Follow these rules during development.

## General

* Never generate placeholder implementations.
* Never skip requested functionality.
* Never simplify features unless explicitly instructed.
* Explain important architectural decisions.
* Keep the code production-ready.
* Keep commits logically separated by feature.

---

## Frontend

* Use TypeScript strict mode.
* Create reusable components.
* Keep components small.
* Prefer composition over inheritance.
* Avoid duplicated logic.
* Use custom hooks where appropriate.
* Use TanStack Query for server state.
* Keep UI clean and minimal.

---

## Backend

* Follow REST principles.
* Separate routers, services and repositories.
* Use dependency injection where appropriate.
* Keep business logic outside API endpoints.
* Use SQLAlchemy ORM.
* Generate Alembic migrations for schema changes.

---

## Database

* Use PostgreSQL best practices.
* Use JSONB only where flexibility is required.
* Enable Row Level Security.
* Never expose data belonging to another user.

---

## Security

* Never expose secrets.
* Never expose SMTP passwords.
* Validate all inputs.
* Handle errors gracefully.
* Never trust client-side validation.

---

# Out of Scope (Backlog)

The following features are intentionally excluded from MVP:

* AI generated emails
* Scheduled campaigns
* Retry mechanism
* Email queue
* Email open tracking
* Click tracking
* Multi-tenant organizations
* Subscription plans
* Trial accounts
* Multiple SMTP configurations
* CRM integrations
* Customer editing
* File attachments
* Analytics
* Reports

---

# MVP Definition of Done

The project is considered complete when a user can:

1. Register
2. Verify email
3. Login
4. Configure SMTP
5. Test SMTP connection
6. Import CSV/XLSX
7. Map spreadsheet columns
8. View customer list
9. Create email templates
10. Preview personalized emails
11. Select recipients
12. Send a campaign
13. View campaign history
14. View sent messages
15. See only their own data

---

# Future Vision

Campaign Manager is intentionally designed as a focused product.

Future versions may evolve into a modular business automation platform by adding:

* AI-generated email content
* Campaign scheduling
* Follow-up automation
* CRM integrations
* Project management
* Offer generation
* Analytics
* Multi-tenant organizations

These features are intentionally excluded from MVP to maximize delivery speed and validate the product with real customers first.
