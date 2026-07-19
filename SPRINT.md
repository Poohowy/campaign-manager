# Sprint 11

## Goal

Implement Campaign Creation.

Authenticated users should be able to create campaigns by selecting an email template and one or more customers.

Campaign creation prepares all required data for future email sending but does not send any emails.

---

## Backend

Implement:

GET /api/v1/campaigns

GET /api/v1/campaigns/{id}

POST /api/v1/campaigns

DELETE /api/v1/campaigns/{id}

Requirements:

- all campaigns belong to the authenticated user,
- verify ownership of the selected template,
- verify ownership of all selected customers,
- create one campaign record,
- create one campaign_message record per selected customer,
- initial campaign status = draft,
- initial campaign_message status = pending,
- do not render templates,
- do not send emails,
- do not communicate with SMTP.

---

## Frontend

Create a Campaigns page.

Display a table with:

- Campaign Name
- Template
- Number of Recipients
- Status
- Created At

Actions:

- Create Campaign
- Delete Campaign

Deleting a campaign must always require confirmation using the existing Alert Dialog component.

---

## Campaign Form

Create a reusable Create Campaign form.

Fields:

- Campaign Name
- Template
- Customers

Validation:

Required:

- Campaign Name
- Template
- At least one customer

The customer selector should support:

- multi-selection,
- search by company name,
- select / deselect multiple customers.

Reuse existing UI components whenever possible.

---

## Campaign Summary

Before saving, display a summary containing:

- Campaign Name
- Selected Template
- Number of Recipients
- Initial Status (Draft)

The summary is read-only.

---

## Campaign Status

Introduce campaign lifecycle statuses.

Supported values:

- draft
- running
- completed
- failed

For this sprint every newly created campaign must always start with:

draft

No other status transitions are implemented in this sprint.

---

## Campaign Messages

Creating a campaign must automatically create one campaign_message record for every selected customer.

Each message must initially have:

- status = pending

No rendering or sending should occur.

---

## UI

Reuse existing UI components.

The Campaigns module should visually match:

- Customers
- Templates
- SMTP

The application should feel like a single consistent product.

---

## Tests

Backend:

- create campaign
- list campaigns
- get campaign
- delete campaign
- ownership enforcement
- campaign_messages creation
- initial statuses

Frontend:

- campaign list
- create campaign dialog
- campaign validation
- customer multi-select
- delete confirmation
- automatic refresh after create/delete

---

## Out of Scope

Do not implement:

- email rendering,
- SMTP sending,
- retry,
- scheduling,
- campaign editing,
- campaign duplication,
- analytics,
- attachments,
- campaign history details.

---

## Definition of Done

Sprint is complete when:

- campaigns can be created,
- campaigns can be listed,
- campaigns can be deleted,
- campaign_messages are automatically generated,
- every campaign starts in Draft status,
- every campaign_message starts in Pending status,
- all tests pass,
- the application remains fully functional.