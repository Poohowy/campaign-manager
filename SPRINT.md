# Sprint 8

## Goal

Implement the Template Management module.

Authenticated users should be able to create, edit, view and delete email templates.

No variable rendering or preview should be implemented in this sprint.

---

## Tasks

### Backend

Implement CRUD endpoints:

GET /api/v1/templates

GET /api/v1/templates/{id}

POST /api/v1/templates

PUT /api/v1/templates/{id}

DELETE /api/v1/templates/{id}

Requirements:

- All templates belong to the authenticated user.
- Follow Router → Service → Repository → Database.
- Use standardized API response envelopes.
- Ignore requests for templates belonging to another user.

---

### Database

Use the existing templates table.

No schema changes.

---

### Frontend

Create a new Templates page.

The page should display all templates in a table.

Columns:

- Name
- Subject
- Last Updated

Actions:

- Create
- Edit
- Delete

---

### Template Form

Create a reusable form supporting both Create and Edit modes.

Fields:

- Template Name
- Subject
- Body (Markdown)

Validation:

Required:

- Name
- Subject
- Body

---

### Delete

Deleting a template must require confirmation.

Use the existing Alert Dialog pattern introduced in Sprint 7.5.

---

### UI

Reuse existing UI components whenever possible.

Reuse:

- Table
- Button
- Card
- Alert Dialog

The Templates page should visually match the Customers module.

---

### Tests

Backend:

- create template
- update template
- delete template
- list templates
- ownership enforcement

Frontend:

- template list
- create dialog
- edit dialog
- delete confirmation
- automatic refresh

---

## Out of Scope

Do not implement:

- Variable rendering
- Variable picker
- Template preview
- Rich text editor
- Version history
- Duplicate template

---

## Definition of Done

Sprint is complete when:

- Templates can be created.
- Templates can be edited.
- Templates can be deleted.
- Template list refreshes automatically.
- Confirmation dialog works.
- Tests pass.