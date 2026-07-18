# Sprint 4

## Goal

Implement the database foundation for the Campaign Manager backend.

The objective of this sprint is to create a production-ready persistence layer based on the approved `DATABASE.md` specification.

The implementation must strictly follow the database design.

No business logic or API endpoints should be implemented.

---

## Tasks

### SQLAlchemy

Configure SQLAlchemy 2.0 as the ORM for the project.

Implement SQLAlchemy models for all entities defined in `DATABASE.md`.

---

### Alembic

Configure Alembic.

Generate the initial migration.

The generated schema must match `DATABASE.md`.

---

### Database Schema

Implement the following tables:

- customers
- templates
- smtp_settings
- campaigns
- campaign_messages

Every table must follow the approved specification.

---

### Relationships

Implement all foreign keys and ORM relationships.

Relationships should be explicit and bidirectional where appropriate.

---

### Constraints

Implement:

- Primary Keys
- Foreign Keys
- Unique Constraints
- Check Constraints (if applicable)

---

### Indexes

Implement every index defined in `DATABASE.md`.

---

### Enums

Create PostgreSQL enums for:

- CampaignStatus
- CampaignMessageStatus

Use SQLAlchemy enum types.

---

### JSON Fields

Implement JSONB columns for:

- customers.custom_fields
- campaign_messages.rendered_variables

Provide appropriate defaults.

---

### UUID Strategy

Use UUID as the primary key for every business entity.

Configure automatic UUID generation.

---

### Repository Layer

Create repository classes for:

- CustomerRepository
- TemplateRepository
- CampaignRepository
- CampaignMessageRepository
- SMTPSettingsRepository

Repositories should contain only generic database operations.

Do not implement business logic.

---

### Pydantic Schemas

Create base schemas for all entities.

Include:

- Create schemas
- Read schemas
- Update schemas

Do not implement validation specific to business rules yet.

---

### Tests

Verify:

- Initial migration executes successfully.
- All tables are created.
- Foreign keys are valid.
- Constraints are enforced.
- Indexes are created.
- Enums work correctly.

---

## Out of Scope

Do NOT implement:

- API endpoints
- Services
- Customer import
- SMTP sending
- Email templates logic
- Campaign sending
- CSV/XLSX processing
- Authentication changes
- Background jobs

---

## Definition of Done

Sprint is complete when:

- SQLAlchemy 2.0 is fully configured.
- Alembic is configured.
- Initial migration has been generated.
- Database schema matches `DATABASE.md`.
- SQLAlchemy models are implemented.
- Repository layer exists.
- Base Pydantic schemas exist.
- Migration runs successfully on an empty database.
- Backend starts without errors.
- All tests pass.

---

## Deliverables

At the end of the sprint the developer should provide:

1. Summary of implemented functionality.
2. Database schema overview.
3. Explanation of architectural decisions.
4. Suggested updates to `DECISIONS.md`.
5. Any discrepancies found between implementation and `DATABASE.md`.

Wait for review before continuing.