# Sprint 1.5

## Goal

Finalize the project structure before implementing any business functionality.

The objective of this sprint is to prepare a clean, scalable and maintainable codebase that will be used during the rest of the project.

No business functionality should be implemented.

---

## Tasks

### Frontend

Organize the `features` directory by creating empty feature modules:

- auth
- customers
- templates
- campaigns
- smtp

Each feature should contain a minimal scalable folder structure using `README.md` or `.gitkeep` files where appropriate.

Extend the `shared` directory by creating:

- api
- hooks
- types
- utils

---

### Backend

Inside `app`, create an empty:

- schemas

directory.

Do not create database models yet.

---

### Project Cleanup

Remove the `documentation` directory if it is no longer needed.

Verify:

- .venv is ignored by Git
- node_modules is ignored by Git
- environment files are handled correctly

Review the current architecture and make small improvements where appropriate.

Do not overengineer.

---

## Definition of Done

Sprint is complete when:

- Feature folders exist.
- Shared folders exist.
- Backend contains the schemas package.
- Repository is clean.
- Project structure follows the engineering rules.
- No business functionality has been added.