# Campaign Manager
## API Design

Version: 1.0

Status: Approved

---

# API Philosophy

The backend exposes a REST API consumed exclusively by the frontend.

The API should be:

- Simple
- Predictable
- Resource-oriented
- Easy to extend
- Versioned

Authentication is handled entirely by Supabase Authentication.

The frontend authenticates directly with Supabase and includes the JWT access token in every request.

FastAPI validates the JWT and never performs authentication itself.

---

# Base URL

```
/api/v1
```

Example:

```
GET /api/v1/customers
```

---

# Authentication

Every authenticated request must include:

```
Authorization: Bearer <JWT>
```

The backend validates the Supabase JWT.

There are **no authentication endpoints** inside FastAPI.

---

# Resource: Customers

Represents imported customers.

---

## GET /customers

Returns a paginated list of customers.

Supports:

- pagination
- search
- sorting

Query parameters:

| Name | Description |
|------|-------------|
| page | Current page |
| page_size | Items per page |
| search | Search by company, contact or email |
| sort | Sort column |
| order | asc / desc |

---

## GET /customers/{id}

Returns customer details.

---

## POST /customers/import/preview

Uploads a CSV file and returns a preview without writing any data to the database.

Request:

```
multipart/form-data
```

Response:

```json
{
  "headers": [
    "company_name",
    "email",
    "city"
  ],
  "preview": [
    {
      "company_name": "ABC",
      "email": "office@abc.com"
    }
  ],
  "row_count": 156
}
```

No data is persisted.

---

## POST /customers/import

Imports customers using the selected column mapping.

Request:

- multipart/form-data
- CSV file
- column mapping

The backend:

- parses the CSV file
- validates required fields
- performs an upsert using the selected External ID
- creates new customers
- updates existing customers
- skips invalid rows

Returns:

```json
{
  "data": {
    "imported": 120,
    "updated": 18,
    "skipped": 4
  }
}
```

Errors follow the standardized API error envelope.

---

# Resource: Templates

Represents email templates.

---

## GET /templates

Returns all templates.

---

## GET /templates/{id}

Returns template details.

---

## POST /templates

Creates a new template.

---

## PUT /templates/{id}

Updates an existing template.

---

## DELETE /templates/{id}

Deletes a template.

---

# Resource: SMTP Settings

Represents the SMTP configuration for the current user.

---

## GET /smtp

Returns SMTP configuration.

Sensitive fields (such as passwords) must never be returned.

---

## PUT /smtp

Creates or updates SMTP configuration.

---

## POST /smtp/test

Sends a test email using the configured SMTP server.

---

# Resource: Campaigns

Represents email campaigns.

---

## GET /campaigns

Returns campaign history.

Supports:

- pagination
- filtering

---

## GET /campaigns/{id}

Returns campaign details.

Includes:

- campaign metadata
- delivery statistics
- sent messages

---

## POST /campaigns/send

Creates and immediately starts a campaign.

Request example:

```json
{
  "name": "Architecture Firms - July",
  "template_id": "uuid",
  "customer_ids": [
    "uuid",
    "uuid"
  ]
}
```

Backend responsibilities:

- Create campaign
- Render templates
- Create campaign messages
- Send emails
- Update message statuses
- Update campaign status

Response:

```json
{
  "campaign_id": "uuid",
  "status": "running"
}
```

---

# Resource: Campaign Messages

Represents individual emails sent within a campaign.

---

## GET /campaigns/{id}/messages

Returns all messages belonging to the campaign.

Supports filtering by:

- status
- recipient

---

# Resource: Health

---

## DELETE /customers

Deletes selected customers.

Request:

```json
{
  "ids": [
    "uuid-1",
    "uuid-2"
  ]
}
```

Only customers belonging to the authenticated user may be deleted.

Returns:

```json
{
  "data": {
    "deleted": 2
  }
}
```

---

## GET /health

Returns backend health information.

---

# Response Format

Successful responses:

```json
{
  "data": {}
}
```

Collections:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

Errors:

```json
{
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found."
  }
}
```

---

# HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

# File Upload

Customer import accepts:

```
multipart/form-data
```

Supported formats:

- CSV
- XLSX

Maximum file size:

```
10 MB
```

---

# Search

Customer search covers:

- company_name
- contact_name
- email

---

# Sorting

Example:

```
GET /customers?sort=company_name&order=asc
```

---

# Security

Every request is authorized using the authenticated user's JWT.

Every resource is scoped to the current authenticated user.

Users can never access another user's resources.

Sensitive information (SMTP passwords, internal credentials, service keys) is never returned by the API.

---

# Future API Extensions

The following functionality is intentionally excluded from the MVP:

- Scheduled campaigns
- Campaign drafts
- Email attachments
- Import history
- Campaign analytics
- AI-generated templates
- CRM integrations
- Webhooks
- Organization / Team accounts

