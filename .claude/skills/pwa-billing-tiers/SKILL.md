---
name: pwa-billing-tiers
description: Use when implementing QuotaFlo subscription tiers, feature gating, AI-usage metering, trials, or Stripe billing. Replaces the flat NZ$79.99 with a freemium ladder and protects AI COGS.
---

# QuotaFlo Billing & Tiers

Target structure (NZD): Free Starter ($0, ~3 quotes + ~20 AI actions/mo) · Solo ($39, unlimited
quotes, fair-use AI, full GST/IRD/safety) · Pro ($69, adds cloud backup/sync + accountant/IRD export)
· PAYG AI credits. 14-day no-card Pro trial that delivers a sent quote BEFORE the price-list build.

## Rules
- Define tiers + limits in one config; gate features/usage from it.
- **Meter AI usage** (voice/ElevenLabs + LLM calls) so PAYG credits decrement correctly — these are
  real per-use costs the plan must cover.
- Integrate Stripe Billing in **test mode** first; update plan via webhook; prices in NZD.
- **NEVER hardcode or accept live/secret keys in chat.** Secrets live in env/server only. The human
  creates the Stripe account, products, and webhook; you write the integration and document the
  exact dashboard steps for them.

## Done =
Tiers gated in code; Stripe test-mode checkout + webhook working; AI metering in place; trial logic
verified; a written list of the dashboard steps the owner must do to go live.
