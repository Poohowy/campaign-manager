# Sprint 6

## Goal

Implement the customer import foundation.

After this sprint, authenticated users should be able to upload a CSV file, preview its contents and map CSV columns to customer fields.

No data should be written to the database.

---

## Tasks

### Backend

Create a new CustomerImportService.

Responsibilities:

- parse CSV files
- validate CSV format
- detect column headers
- generate preview
- count rows

No database writes.

---

Implement API endpoint:

POST /api/v1/customers/import/preview

Input:

- multipart/form-data
- CSV file

Output:

- detected headers
- first 10 rows
- total row count

---

### Frontend

Add an **Import Customers** button to the Customers page.

Clicking the button should open an import dialog.

The dialog should allow:

- selecting a CSV file
- uploading the file
- displaying detected columns
- displaying the first 10 preview rows

---

### Column Mapping

Allow the user to map CSV columns to customer fields.

Required fields:

- External ID
- Company Name
- Email

Optional fields:

- Contact Name
- Phone
- Website
- City
- Country

The Continue button must remain disabled until all required fields are mapped.

---

### Validation

Validate:

- file exists
- CSV is readable
- required mappings are selected

Display clear validation messages.

---

### UI

Use shadcn/ui components.

Keep the import dialog simple and responsive.

---

### Tests

Verify:

- CSV parsing
- Preview generation
- Header detection
- Empty file handling
- Invalid CSV handling
- Required mapping validation

---

## Out of Scope

Do not implement:

- Database import
- Upsert
- Duplicate detection
- XLSX support
- Background jobs
- Import history

---

## Definition of Done

Sprint is complete when:

- CSV files can be uploaded.
- Preview is displayed.
- Headers are detected.
- Column mapping works.
- No data is written to the database.
- Tests pass.