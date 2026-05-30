---
name: quotaflo-secure-storage
description: Use when touching how QuotaFlo stores, locks, encrypts, backs up, or claims to protect user data (PIN, localStorage, encryption, backup, "Encrypted"/"Secure" wording). Enforces real encryption and honest security claims for a client-side PWA holding client PII, prices, invoices and GST.
---

# QuotaFlo Secure Storage & Red-Team

Context: QuotaFlo is a client-side PWA. Data lives in browser `localStorage`. History: it shipped
XOR obfuscation marketed as "Encrypted", a default PIN `1234` printed on the lock screen, and (after
rebrand) a "Secure sync" claim despite having no sync. Treat all three as defects to prevent
recurring.

## Non-negotiable rules
1. **XOR / base64 / obfuscation is NOT encryption.** Never describe it as encrypted/secure.
2. **Only claim a security property that is actually implemented.** No "Encrypted", "Secure sync",
   "bank-level", "end-to-end" unless the code does exactly that, verifiably.
3. **Encryption = AES-GCM 256** via Web Crypto (`crypto.subtle`). Key derived from the user PIN/
   passphrase with **PBKDF2-SHA-256 ≥600,000 iterations** (or Argon2id WASM). Random per-install
   salt (stored) + fresh random IV per write. **Never persist the key or PIN.** Drop the key on lock.
4. **No default credentials.** Force first-run PIN creation; reject weak/sequential/repeated PINs.
5. **Migrations must be reversible/safe.** When changing the at-rest format, decrypt-old →
   encrypt-new → verify → only then remove old; keep a one-release rollback so a bug can't brick data.
6. **Backups stay encrypted at rest**, including exported files and any cloud blob (server stores
   ciphertext only — zero-knowledge).

## Procedure when invoked
1. Identify every read/write of `localStorage` and every security-related user-facing string.
2. Classify current state honestly (plaintext / obfuscated / encrypted) and list the gaps.
3. Implement to the rules above; show the crypto module + migration + how you tested
   encrypt→reload→decrypt and wrong-PIN failure (GCM auth-tag reject).
4. Reconcile claims: update copy to match reality at each step.

## Done = 
At-rest data is AES-GCM ciphertext keyed from the PIN; no key/PIN persisted; weak PINs rejected;
migration verified with rollback; every security claim in the UI is literally true.
