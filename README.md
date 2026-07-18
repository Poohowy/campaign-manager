# Campaign Manager

## Overview

Campaign Manager is a lightweight web application that allows small businesses to send personalized email campaigns using customer data stored in Excel or CSV files.

The project is intentionally focused on simplicity, fast delivery and ease of use.

This repository contains the complete source code for the MVP version.

---

# Project Goals

* Build a working MVP in 2–3 days.
* Deliver real business value.
* Keep the codebase simple.
* Build a strong foundation for future development.

---

# Tech Stack

## Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* TanStack Query

## Backend

* FastAPI
* SQLAlchemy
* Alembic

## Database

* PostgreSQL
* Supabase Cloud

## Authentication

* Supabase Auth

## Deployment

Frontend:

* Vercel

Backend:

* Google Cloud Run

Database:

* Supabase Cloud

---

# Project Structure

```text
campaign-manager/

├── .env.example
├── .gitignore
├── PRD.md
├── README.md
├── TASKS.md
├── documentation/
├── frontend/
└── backend/
```

The project is divided into two independent applications:

* frontend
* backend

---

# Development Workflow

Development should follow the tasks defined in `TASKS.md`.

Each completed task should leave the application in a working state.

Avoid implementing multiple major features simultaneously.

---

# Coding Principles

* Keep components small.
* Prefer readability.
* Avoid unnecessary abstractions.
* Write production-quality code.
* Keep business logic separated from UI.
* Write clean APIs.
* Never duplicate code.

---

# Security Principles

* Never expose secrets.
* Never commit `.env`.
* Use Row Level Security.
* Encrypt SMTP passwords.
* Validate all user input.

---

# Running the Project

Frontend

```bash
cd frontend
npm install
npm run dev
```

Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

---

# Documentation

* PRD.md — Product Requirements
* TASKS.md — Development Roadmap
* README.md — Project Overview

---

# License

Private project developed by Data Wildcat.
