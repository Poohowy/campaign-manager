# Sprint 7.5

## Goal

Implement basic customer deletion.

Authenticated users should be able to select one or more customers and permanently delete them after explicit confirmation.

---

## Tasks

### Backend

Implement:

DELETE /api/v1/customers

Request:

```json
{
  "ids": [
    "uuid-1",
    "uuid-2"
  ]
}
```

Requirements:

- Delete only customers belonging to the authenticated user.
- Ignore non-existing IDs.
- Return the number of deleted customers.
- Use the standard API response envelope.

Example response:

```json
{
  "data": {
    "deleted": 5
  }
}
```

---

### Frontend

Add row selection to the Customers table.

Requirements:

- Checkbox for every row.
- Checkbox in the table header for **Select All / Deselect All** on the current page.
- Support selecting one or more customers.
- Display **Delete Selected** only when at least one customer is selected.
- Hide **Import Customers** while selection mode is active.
- Replace the default page title with a selection summary whenever at least one customer is selected.
- Clicking a table row (except interactive controls) should toggle the row selection.

Examples:

- 1 customer selected
- 3 customers selected
- 15 customers selected

The selection summary should appear in the page header next to the available bulk actions.

The header checkbox should:

- Select all customers currently visible on the page.
- Deselect all customers when clicked again.
- Correctly reflect the current selection state.
- Display the indeterminate state when only some rows are selected.

Selections should persist while sorting or filtering the current page, but should be cleared after successful deletion.

---

### Confirmation Dialog

Before deleting customers, display a confirmation dialog.

Use the standard shadcn/ui Alert Dialog.

Title:

Delete Customers

Message:

Are you sure you want to permanently delete the selected customers?

This action cannot be undone.

Buttons:

- Cancel
- Delete

Requirements:

- Delete must use the destructive variant.
- Cancel should keep the current selection.
- Clicking outside the dialog must not delete customers.

---

### After Successful Deletion

- Close the dialog.
- Refresh the customer list automatically.
- Clear the current selection.
- Restore the default page title ("Customers").
- Restore the **Import Customers** button.
- Display a success message showing how many customers were deleted.

Example:

Customer deleted successfully.

or

5 customers deleted successfully.

---

### Validation

- Do not allow deletion when nothing is selected.
- Handle backend errors gracefully.
- Never delete customers belonging to another user.

---

### UI

Use shadcn/ui components.

Use:

- Table
- Checkbox
- Alert Dialog
- Button

Keep the page simple and consistent with the existing Customers module.

---

### Tests

Backend:

- delete one customer
- delete multiple customers
- ignore unknown IDs
- enforce user ownership

Frontend:

- row selection
- select all
- deselect all
- indeterminate header checkbox
- confirmation dialog
- successful deletion
- automatic table refresh
- success message
- Import button visibility
- selection summary visibility

---

## Out of Scope

Do not implement:

- Delete All
- Soft delete
- Undo
- Bulk edit
- Archive
- Pagination-aware selection across multiple pages

---

## Definition of Done

Sprint is complete when:

- One or more customers can be selected.
- Users can select or deselect all customers on the current page.
- The header checkbox correctly supports the indeterminate state.
- Import Customers is replaced by Delete Selected while rows are selected.
- The page title changes to the selection summary.
- Confirmation dialog is displayed before deletion.
- Selected customers are deleted.
- Customer list refreshes automatically.
- Selection is cleared after deletion.
- Success message is displayed.
- Tests pass.