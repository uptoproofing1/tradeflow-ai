# TradeFlow AI

> **Built on the tools. Built for the tools.**

A complete AI-powered trade business management app built as a single HTML file — no framework, no build step, no installs. Open it in a browser and it works.

---

## What's in this repo

| File | Description |
|------|-------------|
| `index.html` | Main TradeFlow AI app — full trade management suite |
| `scanner.html` | AI Materials Price Scanner — invoice OCR tool |
| `logo.html` | Standalone brand/logo file |

---

## Features

### `index.html` — TradeFlow AI App

**Voice to Quote**
Speak a job out loud. AI transcribes it and generates a professional PDF-ready quote with line items, GST, and totals. Hands-free on site.

**Jobs Pipeline**
Kanban-style pipeline — Lead → Booked → In Progress → Completed. Full job history with value tracking.

**AI Safety Pack**
Upload site photos → AI identifies hazards, generates a toolbox talk, emergency procedures, and PPE list. Supports NZ, AU, UK, US, CA, ZA, IE, DE legislation zones.

**Mileage GPS Tracker**
Live mileage tracking per job. Auto-calculates fuel cost and ATO/IRD-compliant deduction amounts.

**Materials Price List**
Voice-add materials and prices. AI auto-fills quantities and units. Prices feed directly into quotes.

**Invoice Manager**
Track outstanding, sent, and paid invoices. One-tap send and overdue alerts.

**AI Email Reply**
Speak or type what you want to say — AI writes a polished client reply in your voice.

**Variation Tool**
Add job variations mid-quote by voice. AI prices them using your materials list and appends to the quote.

**Colour Themes**
6 built-in themes: Light Blue, Sky Blue, Navy, Teal, Indigo, Slate.

**AI Voice Assistant**
Every action confirmed by voice. Female/male voice toggle. Works on all browsers via Web Speech API.

---

### `scanner.html` — Materials AI Scanner

Upload or photograph a supplier invoice. Claude AI reads every line item, extracts unit prices, compares against your existing price list, and shows what's new or changed. One tap to update everything.

- Works with any supplier invoice (PlaceMakers, Carters, ITM, Steel & Tube, Mitre 10, etc.)
- Detects price increases/decreases vs your stored prices
- Demo mode included — try it without a real invoice
- Requires Anthropic API key (set in the fetch headers, or connect via backend)

---

## Setup

### Option A — Open directly (demo mode)
Just open `index.html` in any modern browser. Everything works except live AI calls.

### Option B — With AI (Claude API)
The scanner uses the Anthropic API for invoice OCR. To enable:

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In `scanner.html`, the fetch call is at the bottom of the `scanInvoice()` function
3. For production, route through a backend so the key stays server-side (see Handover doc)

The main app (`index.html`) uses the **Web Speech API** only — no API key needed for voice features.

---

## Tech stack

- **Zero dependencies** — pure HTML, CSS, JavaScript
- **Web Speech API** — voice recording and text-to-speech
- **Anthropic Claude API** — invoice vision OCR (scanner only)
- **CSS custom properties** — full theming system
- **No build step** — edit and refresh

---

## Brand

**Colours**
- Primary blue: `#1565ff`
- Brand cyan: `#0d8cff` / `#1db7ff`
- Dark navy: `#071b3d`

**Fonts**
- Wordmark: `Poppins 800`
- UI: `DM Sans`

**Logo**
Pure CSS TF letterform — no image files needed. See `logo.html` for the full standalone version.

---

## Roadmap / Backend integration

The next phase connects a Node.js backend so users don't need API keys:

- `POST /api/speak` — voice quote generation
- `POST /api/quote` — quote PDF generation  
- `POST /api/safety` — safety pack AI generation
- Supabase auth + Stripe billing
- API keys stored server-side

See `TradeFlow_Complete_Handover.md` for the full technical handover.

---

## Licence

Private / proprietary. All rights reserved.

Built by Martyn & Claude · 2024
