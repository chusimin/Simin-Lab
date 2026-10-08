---
kind: upgrade-guide
description: Simin file mutations now require the observed document content version.
---

# Simin document versions

English | [中文](guide.zh.md)

## Change

The local `/aipm/stage` endpoint no longer overwrites a document without an observed content version. A missing or stale version returns HTTP 409. The Simin client uses preview confirmation and versioned `/aipm/mutate` requests. Project files live under the current checkout’s `projects/` directory.

## Migration

1. Read the document through `/aipm/file?project=<name>&file=<name>` and retain its `version`. For a new document, use `version: null`.
2. Include that version with the reviewed content when saving. On HTTP 409, reread and review the current content before retrying.
3. Verify that the saved document appears in the project folder and that a stale version is refused. Existing Session files require no migration.
