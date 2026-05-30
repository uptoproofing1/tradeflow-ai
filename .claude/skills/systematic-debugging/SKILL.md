---
name: systematic-debugging
description: Use when investigating a bug or unexpected behaviour in QuotaFlo. Enforces root-cause discipline instead of guess-and-patch.
---

# Systematic Debugging

## Rules
1. Reproduce reliably first; write down the exact steps and the observed vs expected.
2. Form ONE hypothesis at a time; find the smallest test that confirms/denies it.
3. Read the actual error/stack/console; don't assume. Bisect (git, or comment-out) to localise.
4. Fix the root cause, not the symptom; add a regression test (see safe-change-tdd).
5. Verify the fix with evidence; confirm you didn't break neighbours.
