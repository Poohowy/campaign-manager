# Campaign Manager
## Database Design

Version: 1.0

Status: Approved

---

# Philosophy

The database is the single source of truth for the application.

The schema should be:

- simple
- normalized
- easy to query
- easy to extend

The MVP optimizes for simplicity rather than flexibility.

---

# General Rules

## Primary Keys

Every table uses:

UUID

---

## Ownership

Every business entity belongs to exactly one user.

Every table contains:

user_id UUID NOT NULL

Exception:

Supabase authentication tables.

---

## Timestamps

Every table contains:

created_at TIMESTAMPTZ NOT NULL DEFAULT now()

updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

Soft delete is intentionally NOT used in MVP.

---

## Naming

Tables:

snake_case plural

Columns:

snake_case

Foreign Keys:

<entity>_id

Examples:

customer_id

campaign_id

template_id

---

# Tables

---

## customers

Purpose

Stores imported customer data.

Columns

id UUID PK

user_id UUID NOT NULL

external_id TEXT NOT NULL

email TEXT NOT NULL

company_name TEXT

contact_name TEXT

phone TEXT

custom_fields JSONB NOT NULL DEFAULT '{}'

created_at TIMESTAMPTZ

updated_at TIMESTAMPTZ

Constraints

UNIQUE(user_id, external_id)

Indexes

(user_id)

(user_id, email)

(user_id, company_name)

---

## templates

Purpose

Stores email templates.

Columns

id UUID PK

user_id UUID

name TEXT

description TEXT

subject TEXT

body_markdown TEXT

created_at

updated_at

Indexes

(user_id)

(user_id, name)

---

## smtp_settings

Purpose

SMTP configuration.

Columns

id UUID PK

user_id UUID UNIQUE

host TEXT

port INTEGER

username TEXT

password_encrypted TEXT

from_name TEXT

from_email TEXT

created_at

updated_at

---

## campaigns

Purpose

Represents one mailing campaign.

Columns

id UUID PK

user_id UUID

template_id UUID

name TEXT

status CampaignStatus

created_at

started_at

finished_at

Indexes

(user_id)

(status)

(created_at)

---

## campaign_messages

Purpose

Represents one email sent to one customer.

Columns

id UUID PK

user_id UUID

campaign_id UUID

customer_id UUID

email TEXT

subject TEXT

body_markdown TEXT

rendered_variables JSONB NOT NULL DEFAULT '{}'

status CampaignMessageStatus

error_message TEXT

sent_at TIMESTAMPTZ

Indexes

(campaign_id)

(customer_id)

(status)

(user_id)

---

# Relationships

User

1 ---- *

Customers

User

1 ---- *

Templates

User

1 ---- *

Campaigns

User

1 ---- 1

SMTPSettings

Campaign

1 ---- *

CampaignMessages

Customer

1 ---- *

CampaignMessages

Template

1 ---- *

Campaigns

---

# Enums

CampaignStatus

- draft
- running
- completed
- failed

CampaignMessageStatus

- pending
- sent
- failed

---

# Row Level Security

Every table is protected by Row Level Security.

Policy:

user_id = auth.uid()

Users can only:

- read their own data
- insert their own data
- update their own data
- delete their own data

CampaignMessages also contain user_id to simplify RLS policies and querying.

---

# JSON Fields

customers.custom_fields

Stores every imported column that is not mapped to one of the standard fields.

campaign_messages.rendered_variables

Stores values used during template rendering.

Example

{
    "company_name": "Data Wildcat",
    "city": "Warsaw"
}

---

# Future Extensions

The schema intentionally allows future additions such as:

- campaign scheduling
- email attachments
- import history
- CRM integrations
- AI generated templates
- campaign analytics
- organization accounts

without major database redesign.