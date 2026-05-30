---
name: quotaflo-accessibility
description: Use when working on QuotaFlo's colours, themes, contrast, text size, touch targets, or an outdoor/sunlight mode. Enforces WCAG 2.1 AA for an app used outdoors on job sites.
---

# QuotaFlo Accessibility

Users work on roofs/sites in sunlight; the default dark-blue theme washes out, and contrast is
unverified.

## Rules (WCAG 2.1 AA)
- Body/muted text contrast ≥ 4.5:1; large text (≥18.66px bold / 24px) and UI/graphics ≥ 3:1.
- Touch targets ≥ 44×44 px.
- Provide a high-contrast **Outdoor/Light** theme toggle designed for direct sun.
- Every interactive element keyboard-focusable and labelled (aria-label / visible label).
- Don't rely on colour alone to convey state.

## Procedure
1. Inventory text/background/chart colour pairs; compute contrast ratios.
2. Report before/after ratios; fix failures (especially muted grey text and chart lines).
3. Add the Outdoor/Light theme; verify both themes pass.
