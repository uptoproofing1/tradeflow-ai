---
name: brand-name-clearance
description: Use when choosing, clearing, or finishing a rename for the app (e.g. confirming "QuotaFlo" is safe, checking trademarks/domains/handles, or auditing the codebase for old-name leaks).
---

# Brand Name Clearance

The app was renamed TradeFlow AI → QuotaFlo because the old name was contested. Don't repeat that —
clear a name before committing spend.

## Clearance checklist (report findings + links for each candidate)
- Trademark: IPONZ (iponz.govt.nz) in software/trade classes; WIPO Global Brand DB; USPTO/UKIPO.
- Domains: .co.nz, .nz, .com, .app availability.
- Code/handles: npm, GitHub org, X/Instagram/Facebook/LinkedIn.
- Collision search: existing products/companies ranking for the name or near-misses
  (e.g. Quoteflow/Quotia/Quotaflow). Trade- or AI-adjacent collisions are disqualifying.
- Casing: lock ONE canonical spelling (the app uses "QuotaFlo") and use it everywhere.
- Verdict: go / caution / stop, with 3 cleared alternatives if not "go".

## Rename completion + leak audit
- Change only USER-VISIBLE strings to the brand name; keep internal codename/repo/URL ("tradeflow")
  as-is, and document the policy in the README.
- Grep the repo (case-insensitive) for the old name; classify each hit USER-VISIBLE (fix) vs INTERNAL
  (leave): HTML <title>, manifest name/short_name, visible labels, exported file names (PDF/CSV/
  backup), email subjects/footers, share text, toasts, OG/meta. Flag the GitHub Pages URL leak.
