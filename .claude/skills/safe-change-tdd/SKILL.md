---
name: safe-change-tdd
description: Use for any risky or data-touching change in QuotaFlo (encryption, migrations, billing, storage). Enforces test-first development and evidence-based verification before claiming done.
---

# Safe Change (TDD + Verify)

For anything that could lose data or money (crypto, migrations, backup, billing), do not "looks
right" — prove it.

## Loop
1. Write a failing test that captures the desired behaviour (e.g. "wrong PIN cannot decrypt",
   "migration preserves all records", "free tier blocks 4th quote").
2. Run it; confirm it fails for the right reason.
3. Implement the minimum to pass.
4. Run the full test; confirm pass. Add edge cases (empty data, corrupted store, offline).
5. For migrations/crypto: test the round-trip AND the rollback path.

## Verification gate (before saying "done")
- Re-run the exact command; read the output; quote the result ("12/12 pass").
- Never claim success from memory or partial runs. If you didn't run it this session, you can't claim it.
