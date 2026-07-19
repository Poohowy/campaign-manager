# Sprint 5

## Goal

Implement the first end-to-end Customer module.

After this sprint, authenticated users should be able to open the Customers page and view their customer list retrieved from the backend.

No customer import functionality should be implemented yet.

---

## Tasks

### Backend

Implement CustomerService.

Responsibilities:

- list customers
- get customer by id
- upsert customer

Implement Customer API.

Endpoints:

- GET /customers
- GET /customers/{id}

Use the existing repository layer.

Business logic must remain inside CustomerService.

---

### Frontend

Create a Customers page.

The page should:

- be accessible from the sidebar
- fetch customers from the backend
- display customers in a table
- display an empty state if no customers exist

Use shadcn/ui components.

---

### Navigation

Create the initial application navigation.

Sidebar:

- Dashboard
- Customers
- Templates
- Campaigns
- SMTP

Dashboard remains unchanged.

---

### API Integration

Connect the frontend to the backend.

Use:

GET /customers

No mock data.

No hardcoded objects.

---

### Tests

Verify:

- authenticated user can access Customers page
- customer list endpoint works
- empty state is displayed correctly

---

## Out of Scope

Do not implement:

- CSV/XLSX import
- Customer editing
- Customer deletion
- Template module
- SMTP module
- Campaign sending

---

## Definition of Done

Sprint is complete when:

- Customer API works.
- CustomerService exists.
- CustomerRepository is used by CustomerService.
- Customers page exists.
- Frontend loads customers from backend.
- Empty state is displayed correctly.
- Tests pass.