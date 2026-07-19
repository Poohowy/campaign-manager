# Sprint 7

## Goal

Complete the customer import workflow.

After this sprint, authenticated users should be able to import customers into the database using the previously selected column mapping.

The import must perform upsert operations and preserve existing customer history.

---

## Tasks

### Backend

Implement:

POST /api/v1/customers/import

Responsibilities:

- receive the selected column mapping
- parse the uploaded CSV
- validate required fields
- perform upsert operations
- preserve existing customer records
- never overwrite campaign-related information

Upsert must use the selected External ID as the unique identifier.

Return:

- imported count
- updated count
- skipped count

using the standard API response envelope.

The import endpoint must receive the original CSV file again together with the selected column mapping.
The backend must not persist preview data or temporary import sessions between requests.
The import process must remain stateless.

---

### Import Rules

For every row:

If External ID does not exist:

- create a new customer

If External ID already exists:

- update customer information

Never modify:

- created_at
- campaign history
- future campaign statistics

Only customer profile fields may be updated.

---

### Validation

Skip invalid rows.

Examples:

- missing External ID
- missing Company Name
- missing Email
- invalid email

Skipped rows should not stop the import.

Return the number of skipped rows.

---

### Frontend

Complete the import dialog.

After clicking Continue:

- upload the CSV
- send the selected mapping
- execute the import
- display loading state

After completion:

Display:

- Imported
- Updated
- Skipped

Close the dialog.

Refresh the Customers table automatically.

After preview generation, keep the selected File object in client memory.
When the user clicks Continue, send the original CSV file again together with the selected column mapping.

---

### UI

Display success feedback after import.

Display backend validation errors when import fails.

---

### Tests

Backend:

- import new customers
- update existing customers
- preserve existing data
- skip invalid rows

Frontend:

- successful import
- loading state
- import summary
- automatic customer table refresh

---

## Out of Scope

Do not implement:

- XLSX
- duplicate merge UI
- import history
- rollback
- background jobs
- progress bars

---

## Definition of Done

Sprint is complete when:

- Customers can be imported.
- Existing customers are updated.
- Invalid rows are skipped.
- Customer list refreshes automatically.
- Import summary is displayed.
- Tests pass.