# Sprint 10

## Goal

Implement SMTP configuration and connection testing.

Authenticated users should be able to configure SMTP settings, securely store credentials, and verify that the configuration works by sending a test email.

No campaign sending functionality should be implemented in this sprint.

---

## Backend

### SMTP Configuration

Implement:

GET /api/v1/smtp

PUT /api/v1/smtp

POST /api/v1/smtp/test

Requirements:

- every user owns exactly one SMTP configuration,
- passwords must never be returned by the API,
- passwords must be encrypted before being stored,
- existing SMTP configuration should be updated instead of creating duplicates.

---

### SMTP Test

Implement SMTP connection testing.

The endpoint should:

- load the authenticated user's SMTP configuration,
- decrypt the stored password,
- establish an SMTP connection,
- send a simple test email,
- return success or a standardized error response.

---

### Security

Requirements:

- passwords must never be logged,
- passwords must never be returned by the API,
- passwords must always remain encrypted in the database,
- only the authenticated user may access their SMTP configuration.

---

## Frontend

Create a dedicated SMTP Settings page.

Fields:

- SMTP Host
- SMTP Port
- Username
- Password
- From Name
- From Email
- Use TLS

Requirements:

- create and edit use the same form,
- password field behaves like a standard password input,
- existing configuration is loaded automatically,
- password is never displayed after saving.

---

### Test Email

Add a section:

Test SMTP Connection

Field:

Recipient Email

Button:

Send Test Email

Display:

- loading state,
- success message,
- backend validation errors.

---

## UI

Reuse existing UI components.

Keep the page visually consistent with Customers and Templates.

---

## Tests

Backend:

- create SMTP configuration
- update SMTP configuration
- encrypt password
- decrypt password
- send test email
- ownership enforcement

Frontend:

- load SMTP configuration
- save SMTP configuration
- password handling
- send test email
- success message
- validation

---

## Out of Scope

Do not implement:

- Campaign sending
- Queue
- Retry logic
- Attachments
- OAuth authentication
- Multiple SMTP configurations

---

## Definition of Done

Sprint is complete when:

- SMTP configuration can be created.
- Existing configuration can be edited.
- Passwords are encrypted.
- Passwords are never returned by the API.
- Test email can be sent.
- Success and error states are displayed.
- Tests pass.