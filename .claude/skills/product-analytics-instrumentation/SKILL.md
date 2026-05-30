---
name: product-analytics-instrumentation
description: Use when adding or reviewing analytics/event tracking in QuotaFlo (activation funnel, feature usage, NPS, crash/error reporting). Closes the "no product signals" gap before/at launch.
---

# Product Analytics Instrumentation

QuotaFlo currently has no analytics, funnel, feedback or error reporting — so activation/churn are
invisible. Instrument the activation funnel first.

## Minimum event plan (privacy-respecting)
- Funnel: app_open → pin_set → onboarding_step (n/total) → first_quote_created → first_quote_sent →
  first_invoice_paid. (first_quote_sent is the activation north-star.)
- Feature usage: voice_used vs text_used, materials_added, safety_pack_generated, mileage_trip,
  backup_created.
- Errors: capture JS errors + AI failures (no PII in payloads).
- Feedback: lightweight in-app NPS after first sent quote.

## Rules
- No PII in event properties; respect the AI-consent notice; allow opt-out.
- Use a simple privacy-friendly tool (e.g. self-hosted Plausible/PostHog) or a thin custom endpoint;
  document setup steps for the owner.
- Define events in one schema/module; don't scatter literals.
