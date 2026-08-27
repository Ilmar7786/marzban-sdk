<!--
Pending downstream notes for marzban-mcp's changelog.

Add one bullet per line for an sdk change that alters mcp's behaviour but
can't be marked on the commit itself (already merged, or the effect only
became clear later). scripts/downstream-notes.mjs folds these into the
"### 🔗 From marzban-sdk" section on the next mcp release, then clears this
file. See docs/release.md.
-->

- `POST` and other unsafe methods are no longer retried — a failed write now surfaces as a tool error instead of being silently replayed ([#75](https://github.com/Ilmar7786/marzban-sdk/issues/75))
- HTTP retries now actually run on API requests ([#92](https://github.com/Ilmar7786/marzban-sdk/pull/92))
