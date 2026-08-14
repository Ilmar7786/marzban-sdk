# `local/`

Disposable environments for manually testing this repo's packages against a
real Marzban panel — not part of the automated test suite (see
[`docs/testing.md`](../docs/testing.md)), not deployed anywhere. Everything
under here is throwaway: weak dev-only credentials, state gitignored, safe to
delete and recreate at any time.

One stack per subdirectory:

- [`marzban/`](./marzban/README.md) — a standalone Marzban panel in Docker.
