/**
 * TradeFlow AI — Backend API Server
 * Deployed on: https://tradeflow-api.onrender.com
 *
 * All API keys live here as Render env vars — never in the frontend.
 *
 * Routes:
 *   POST /api/speak          — ElevenLabs TTS → MP3 stream
 *   POST /api/quote          — Claude AI → structured quote JSON
 *   POST /api/safety         — Claude AI → hazard analysis + toolbox talk
 *   POST /api/email          — Claude AI → professional email reply
 *   POST /api/scan-invoice   — Claude vision → materials price JSON
 *   POST /webhook/stripe     — Stripe webhook handler
 *   GET  /health             — Health check
 */

'use strict';

const express  = require('express');
const cors     = require('cors');
const fetch    = require('node-fetch');
const Stripe   = require('stripe');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Keys from Render environment ────────────────────────────
const CLAUDE_KEY           = process.env.CLAUDE_KEY;
const ELEVENLABS_KEY       = process.env.ELEVENLABS_KEY;
const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET= process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const stripe = Stripe(STRIPE_SECRET_KEY);

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: '*' })); // lock down to your domain in production
app.use('/webhook/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// ── ElevenLabs voice map ─────────────────────────────────────
// Callum — natural, warm, works great for NZ/AU tradie context
// One of ElevenLabs' most natural-sounding male voices
const EL_VOICES = {
  default: 'N2lVS1w4EtoT3dr4eOWO', // Callum — natural warm male
};

// ── Voice style text transforms ──────────────────────────────
const STYLE = {
  tradie(t) {
    return t
      .replace(/Good morning/g,   "G'day")
      .replace(/Good afternoon/g, 'Hey, afternoon')
      .replace(/Good evening/g,   'Hey, evening')
      .replace(/Hello\b/g,        'Hey')
      .replace(/Thank you/g,      'Cheers')
      .replace(/Please\b/g,       'just')
      .replace(/has been generated/g, 'is sorted')
      .replace(/Your quotation/g, 'Your quote')
      .replace(/professional/gi,  '')
      .replace(/Generating your professional quote\./g,
               "I'm sorting that quote for you now.")
      .replace(/Recording\. Speak your quote now\./g,
               "Yep, I'm listening — go for it.")
      .replace(/Trip started\. GPS tracking active\./g,
               "GPS locked on, off we go.")
      .replace(/Profile saved\./g, "Done, all sorted.")
      .replace(/Quote ready to send\./g, "Quote's ready to go.")
      .replace(/Welcome back/g, 'Good to see ya')
      .replace(/TradeFlow AI unlocked\./g, "Right, you're in.")
      .replace(/Saved\./g, 'Done.')
      .replace(/Added/g, 'Added');
  },
  friendly(t) {
    return t
      .replace(/Good morning/g,   'Hey, good morning')
      .replace(/Good afternoon/g, 'Hey there, afternoon')
      .replace(/Good evening/g,   'Hey, good evening')
      .replace(/Profile saved\./g, 'Done, profile saved!')
      .replace(/Done!/g, 'Done — nice one!');
  },
  professional(t) { return t; }
};

// ═══════════════════════════════════════════════════════════
// POST /api/speak
// Body: { text, accent, gender, style, speed, volume }
// Returns: audio/mpeg stream
// ═══════════════════════════════════════════════════════════
app.post('/api/speak', async (req, res) => {
  try {
    const {
      text    = '',
      accent  = 'nz',
      gender  = 'f',
      style   = 'professional',
      speed   = 1.0,
      volume  = 1.0
    } = req.body;

    if (!text.trim()) return res.status(400).json({ error: 'No text provided' });
    if (!ELEVENLABS_KEY) return res.status(500).json({ error: 'ElevenLabs key not configured' });

    // Apply style transform
    const transformer = STYLE[style] || STYLE.professional;
    const transformed = transformer(text);

    const voiceId = EL_VOICES.default; // Callum — natural warm voice

    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   ELEVENLABS_KEY,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text: transformed,
          model_id: 'eleven_turbo_v2_5', // Latest, most natural model
          voice_settings: {
            stability:        0.4,  // Lower = more expressive/natural
            similarity_boost: 0.8,  // Higher = stays true to voice
            style:            0.5,  // Natural conversational style
            use_speaker_boost: true,
            speed: Math.min(Math.max(speed, 0.8), 1.2), // Keep speed natural
          },
        }),
      }
    );

    if (!elRes.ok) {
      const errText = await elRes.text();
      console.error('ElevenLabs error:', elRes.status, errText);
      return res.status(502).json({ error: 'TTS provider error', detail: errText });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    elRes.body.pipe(res);

  } catch (err) {
    console.error('/api/speak error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/quote
// Body: { transcript, materials[], profile, gst, country }
// Returns: { client, items[], subtotal, gst, total, notes }
// ═══════════════════════════════════════════════════════════
app.post('/api/quote', async (req, res) => {
  try {
    const { transcript, materials = [], profile = {}, gst = 15, country = 'New Zealand' } = req.body;

    if (!transcript) return res.status(400).json({ error: 'No transcript provided' });
    if (!CLAUDE_KEY)  return res.status(500).json({ error: 'Claude key not configured' });

    const materialsStr = materials.length
      ? `\nYour live materials price list:\n${materials.map(m => `- ${m.name}: $${m.price} ${m.unit}`).join('\n')}`
      : '';

    const prompt = `You are an AI quoting assistant for a trade business in ${country}.

A tradie has just spoken the following quote aloud:\n"${transcript}"

${materialsStr}

Your job is to extract a fully structured professional quote. Return ONLY valid JSON, no markdown:

{
  "client": "extracted client name or empty string",
  "address": "extracted address or empty string",
  "items": [
    { "description": "Work description", "qty": 1, "unit_price": 0.00, "total": 0.00 }
  ],
  "subtotal": 0.00,
  "gst_rate": ${gst},
  "gst_amount": 0.00,
  "total": 0.00,
  "notes": ["Quote valid for 30 days", "50% deposit required to secure booking"],
  "confidence": "high|medium|low"
}

Rules:
- Use prices from the materials list above where items match
- If no price is clear from speech, make a reasonable estimate for a ${country} trade job
- GST = subtotal * ${gst / 100}
- Be specific with descriptions (include materials, sqm, hours where mentioned)
- Return ONLY the JSON object`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const data = await claudeRes.json();
    const text = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const quote = JSON.parse(clean);

    res.json({ success: true, quote });

  } catch (err) {
    console.error('/api/quote error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/safety
// Body: { images: [base64...], country, legislation }
// Returns: { hazards[], ppe[], toolbox{}, emergency{} }
// ═══════════════════════════════════════════════════════════
app.post('/api/safety', async (req, res) => {
  try {
    const { images = [], country = 'New Zealand', legislation = 'HSWA 2015' } = req.body;

    if (!images.length) return res.status(400).json({ error: 'No images provided' });
    if (!CLAUDE_KEY)    return res.status(500).json({ error: 'Claude key not configured' });

    const imageContent = images.slice(0, 4).map(img => {
      const [meta, data] = img.split(',');
      const mediaType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
      return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
    });

    const prompt = `You are a health and safety AI for trade businesses in ${country} (${legislation}).

Analyse these site photos and return a complete safety assessment. Return ONLY valid JSON:

{
  "hazards": [
    { "name": "Hazard name with emoji", "severity": "Critical|High|Medium|Low", "description": "...", "action": "Control measure" }
  ],
  "ppe": ["Safety Harness & Lanyard", "Hard Hat", "Steel-Capped Boots"],
  "toolbox": {
    "title": "Site Safety Briefing",
    "today_plan": ["Work item 1", "Work item 2"],
    "key_hazards": ["Hazard control 1"],
    "emergency_procedures": ["Assembly point: ...", "Nearest hospital: ..."],
    "worker_notes": ["Note 1"]
  },
  "legislation": "${legislation}",
  "country": "${country}"
}

Be specific to what you can see in the photos. Focus on construction/trade hazards.
Return ONLY the JSON.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: prompt }
          ]
        }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const data = await claudeRes.json();
    const text = data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const safety = JSON.parse(clean);

    res.json({ success: true, safety });

  } catch (err) {
    console.error('/api/safety error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/email
// Body: { incomingEmail, replyIntent, senderName, companyName, style }
// Returns: { draft }
// ═══════════════════════════════════════════════════════════
app.post('/api/email', async (req, res) => {
  try {
    const {
      incomingEmail = '',
      replyIntent   = '',
      senderName    = '',
      companyName   = '',
      style         = 'professional'
    } = req.body;

    if (!replyIntent && !incomingEmail) return res.status(400).json({ error: 'No content provided' });
    if (!CLAUDE_KEY) return res.status(500).json({ error: 'Claude key not configured' });

    const toneMap = {
      professional: 'professional and polite',
      tradie:       'friendly, casual tradie tone — like a real Kiwi tradesperson. Use natural language, contractions, sign off with "Cheers"',
      friendly:     'warm, friendly and conversational',
    };
    const tone = toneMap[style] || toneMap.professional;

    const prompt = `Write a ${tone} email reply.

${incomingEmail ? `Incoming email:\n"${incomingEmail}"\n` : ''}
${replyIntent ? `My reply should cover: "${replyIntent}"` : ''}

Sender: ${senderName || 'the tradie'}
Company: ${companyName || 'the company'}

Write ONLY the email body text — no subject line, no JSON. Start directly with the greeting.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const data = await claudeRes.json();
    const draft = data.content.map(c => c.text || '').join('').trim();

    res.json({ success: true, draft });

  } catch (err) {
    console.error('/api/email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/scan-invoice
// Body: { image: base64 }
// Returns: { supplier, invoice_date, items[] }
// ═══════════════════════════════════════════════════════════
app.post('/api/scan-invoice', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image)       return res.status(400).json({ error: 'No image provided' });
    if (!CLAUDE_KEY)  return res.status(500).json({ error: 'Claude key not configured' });

    const [meta, data] = image.split(',');
    const mediaType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';

    const prompt = `Analyse this supplier invoice and extract ALL product prices.

Return ONLY valid JSON (no markdown):
{
  "supplier": "Supplier Name",
  "invoice_date": "date if visible",
  "items": [
    { "name": "Product Name", "unit": "per sheet/per metre/per m2/per box/per unit/per hour", "price": 12.50, "quantity": "amount if visible" }
  ]
}

Rules:
- Extract every single line item with a price
- Price must be the UNIT price (not line total)
- Be specific with names (include size/spec if shown)
- Return ONLY the JSON`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
            { type: 'text', text: prompt }
          ]
        }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      return res.status(502).json({ error: 'Claude API error', detail: err });
    }

    const respData = await claudeRes.json();
    const text = respData.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    res.json({ success: true, ...result });

  } catch (err) {
    console.error('/api/scan-invoice error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /webhook/stripe
// ═══════════════════════════════════════════════════════════
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Stripe event:', event.type);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Payment completed:', session.id, session.customer_email);
      // TODO: activate subscription in Supabase
      // await supabase.from('subscriptions').upsert({ ... })
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log('Subscription cancelled:', sub.id);
      // TODO: deactivate in Supabase
      break;
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      console.log('Payment failed:', inv.id, inv.customer_email);
      // TODO: notify user
      break;
    }
  }

  res.json({ received: true });
});

// ═══════════════════════════════════════════════════════════
// GET /health
// ═══════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({
    status:   'ok',
    service:  'tradeflow-api',
    version:  '1.0.0',
    keys: {
      claude:      !!CLAUDE_KEY,
      elevenlabs:  !!ELEVENLABS_KEY,
      stripe:      !!STRIPE_SECRET_KEY,
      supabase:    !!SUPABASE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ TradeFlow API running on port ${PORT}`);
  console.log(`   Claude:     ${CLAUDE_KEY      ? '✓' : '✗ MISSING'}`);
  console.log(`   ElevenLabs: ${ELEVENLABS_KEY  ? '✓' : '✗ MISSING'}`);
  console.log(`   Stripe:     ${STRIPE_SECRET_KEY ? '✓' : '✗ MISSING'}`);
  console.log(`   Supabase:   ${SUPABASE_URL    ? '✓' : '✗ MISSING'}`);
});
