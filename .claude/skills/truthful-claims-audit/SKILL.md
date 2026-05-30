---
name: truthful-claims-audit
description: Use when reviewing or writing any user-facing claim in QuotaFlo (security, sync, AI, "encrypted", "secure", capability/marketing copy, store/landing text). Ensures every claim matches what the product actually does.
---

# Truthful Claims Audit

The product has a history of claims outrunning reality ("Encrypted" over XOR storage; "Secure sync"
with no sync; SME/"manage pipelines" on a single-device app).

## Rules
- For each claim, find the implementing code. If it doesn't do exactly what the words say, the words
  change — not the other way around.
- Ban these unless implemented & verified: "encrypted", "secure sync", "end-to-end", "bank-level",
  "team", "multi-user", "pipeline", "enterprise", "backed up" (until backup ships).
- Prefer specific, true phrasing: e.g. "PIN-locked on this device", "Stored on your device".
- Capability copy must match the current architecture (today: single-operator, single-device).

## Procedure
1. Grep all user-facing strings (HTML, JS templates, manifest, landing, emails).
2. Build a table: claim · where · implemented? · verdict · replacement.
3. Apply only the wording fixes; list every change.
