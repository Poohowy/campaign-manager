# Sprint 9

## Goal

Implement Template Rendering and Variable Picker.

Users should be able to insert predefined variables into email templates and preview the rendered result using data from a selected customer.

No email sending or SMTP functionality should be implemented in this sprint.

---

## Backend

### Template Rendering

Implement:

```
POST /api/v1/templates/render
```

The endpoint accepts:

```json
{
  "template_id": "uuid",
  "customer_id": "uuid"
}
```

The backend must:

- load the template
- load the selected customer
- replace supported variables
- return the rendered subject and body

The rendering logic belongs exclusively to the Service layer.

---

### Supported Variables

Support the following variables:

- {{company_name}}
- {{contact_name}}
- {{email}}
- {{phone}}
- {{website}}
- {{city}}
- {{country}}

Unknown variables must remain unchanged.

---

## Frontend

### Variable Picker

Add an **Insert Variable** button next to:

- Subject
- Body

When clicked, display a list of supported variables.

Selecting a variable inserts it at the current cursor position.

Users may still type variables manually.

---

### Template Preview

Add a **Preview** button.

When clicked:

- allow the user to choose one of their imported customers,
- call the backend rendering endpoint,
- display the rendered Subject and Body.

Preview must not save any changes.

---

### Markdown Preview

The template body should support two tabs:

- Edit
- Preview

Preview renders Markdown as HTML.

Editing remains in the existing textarea.

---

## Architecture

Reuse the existing architecture:

Router

↓

Service

↓

Repository

↓

Database

Requirements:

- rendering logic belongs only to TemplateService,
- routers remain thin,
- repositories perform data access only,
- all API responses use the standardized response envelope.

---

## Tests

Backend:

- render template successfully
- replace supported variables
- leave unknown variables unchanged
- template ownership enforcement
- customer ownership enforcement

Frontend:

- variable picker
- variable insertion
- markdown preview
- template preview
- rendered output
- API integration

---

## Out of Scope

Do not implement:

- SMTP
- Email sending
- Campaigns
- Rich text editor
- WYSIWYG editor
- Custom field variables
- Saving preview state
- Template versioning

---

## Definition of Done

Sprint is complete when:

- variables can be inserted using the Variable Picker,
- variables are inserted at the cursor position,
- templates can be rendered using a selected customer,
- Markdown Preview works,
- rendering is performed by the backend,
- unknown variables do not cause errors,
- all tests pass,
- the application remains fully functional.