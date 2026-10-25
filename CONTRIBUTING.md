# Contributing to Journeloom

Welcome! Journeloom is in its initial product-design phase.

## Before opening a PR

1. Read [PRD](docs/PRD.md), [Architecture](docs/ARCHITECTURE.md) and [Data Model](docs/DATA_MODEL.md).
2. Open an issue for any change affecting storage, backup format, sharing or privacy.
3. Keep PRs focused; describe user value, test coverage, security considerations and migration impact.
4. Run the project's checks once the application scaffold is added.

## Branch and commit naming

- `feat/<scope>`, `fix/<scope>`, `docs/<scope>`, `test/<scope>`.
- Prefer conventional commits such as `feat(timeline): support approximate dates`.
- Use pull requests and squash merge into `main`.

## Privacy rules

Never commit real life archives, photos of children, private messages, addresses,
medical information, credentials or user backups. Build test fixtures with
clearly fictional names and dates. Treat public export redaction as a security
boundary and add regression tests for it.

## Branding

The name, Chinese alias and artwork are provisional, pending trademark and
production design checks. MIT licensing of the repository does not grant
exclusive trademark rights.

