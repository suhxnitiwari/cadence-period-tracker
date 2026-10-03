# Cadence

*Designed for your first period. Built for every period after.*

[![Test and deploy](https://github.com/suhxnitiwari/cadence-period-tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/suhxnitiwari/cadence-period-tracker/actions/workflows/deploy.yml)

**Live:** https://suhxnitiwari.github.io/cadence-period-tracker/ (installable on any phone, works offline)

## What it is

Cadence is a free, private menstrual-health app designed first for the hardest possible user: someone who knows almost nothing about her cycle, often a girl in the first few years after her first period. It's meant to be good enough that she never has to graduate from it. At 9 it answers *"What is happening?"*, at 12 *"Is this normal?"*, at 15 *"How do I deal with this at school?"*, and at 24 *"Will this overlap with my trip?"* Same app, same history, more useful over time.

There's no account, no ads and no paywall. Logging, full history, predictions, patterns, education, School Mode, export and delete are free.

### What makes it different

| Common in period apps | What Cadence does |
|---|---|
| Tracking, predictions or insights behind a subscription. | **Free means free.** A girl never loses access to her own history because she can't pay. |
| Fertility, ovulation, pregnancy and sex tracking built into apps young people use. | **None of it exists here,** and a test fails the build if it ever shows up. |
| Fake precision and panic: "Period starts Oct 12." "PERIOD 11 DAYS LATE." | **Honest ranges:** "May come around Oct 14–20 · 🌱 Learning." Ranges narrow only with consistent history (🌱 → 🌿 → 🌷). Never "late". |
| Forget to end a period and the app counts 23 days of bleeding. | **Never invents data.** If she stops logging, Cadence asks "Are you still on your period?" |
| "What's your average cycle length?" | **Zero-knowledge onboarding:** "Have you had your first period?" and "Remember when your last one started?" That's it. |
| Calendar → period → next period. | **Notice → Understand → Prepare → Speak up.** |

## Features

**Notice**
- **🩸 I got my period.** One tap, then *“Is this your first one?”*, then *“How’s your flow?”* with emoji options and **I don’t know**, which explains light, medium and heavy in plain words.
- Fast logging: flow, clots, unexpected bleeding, pain, 13 body symptoms, 9 feelings, sleep, sports, pain relief, custom symptoms and private notes. Plus *“Did your period affect school today?”*
- A calendar with complete history. Likely windows are shown as striped ranges, never as single days.

**Understand**
- **My Body:** usual period length, recent cycle range, heaviest day, top symptoms, and *“Something we’ve noticed”* (e.g. “You’ve logged cramps during the first two days of your last 5 periods.”)
- **Change detection:** “Your last 3 cycles were longer than usual.” “You’ve logged stronger cramps during your last 3 periods than you usually do.”
- **Is this normal?** A persistent button with private, on-device search. Every answer is structured as *What’s happening · Usually · Keep an eye on · Tell someone if…*
- **Learn:** short explanations, including *Before my first period* and a no-shame product guide (which side sticks, wings, disposal, don’t flush).

**Prepare**
- **School Mode:** one-tap help for *I just got my period*, *I bled through my clothes*, *I don’t have a pad*, *My cramps hurt* and *PE or swimming*. Also a customizable period-pouch checklist and a discreet reminder (“Might want your pouch tomorrow 🎒”).
- **Your period fits into your life:** add a trip, exams, a swim meet or a field trip, and Cadence tells you if your possible window overlaps (“Your period may overlap with Barcelona. Pack extra supplies in your carry-on. Your cramps are usually strongest on Days 1–2.”)
- **Add to my calendar:** Google, Apple or Outlook, as a range, with a privacy level she chooses: 🌷 “Personal”, 🎒 “Period window” or 🩸 “Expected period”. When the window moves, one tap updates the same event (stable iCalendar UID).

**Speak up** (early versions of V2 features)
- **Help me tell someone:** pick a topic and a person (Mom, Dad, guardian, trusted adult, school nurse, doctor) and get an editable, age-appropriate message, optionally backed by her own logs. Nothing is ever sent automatically.
- **My period report:** cycles, variation, flow, clots, pain, pain relief and school impact. It’s printable or saved as a PDF for a pediatrician.

**Grows up with you**
- A *“How should Cadence talk to you?”* setting (Simple, Standard, Grown-up) changes the wording (“Got your period today?”, “Log today”, “Daily check-in”) without ever switching on adult content. Nobody is aged out.

**Bring my history / take it with me**
- Import a Cadence backup, **any CSV** from another tracker or a spreadsheet (date and flow columns are auto-detected, including start/end formats), or paste a list of start dates. Export to JSON or CSV. Delete everything instantly.

## Private by design

Built for users as young as 8, so privacy is architecture, not policy.

- **No account.** Everything lives in the browser’s IndexedDB on her device. No name, email or phone number is collected. The only thing that ever leaves the device is opt-in, end-to-end-encrypted sharing between phones she pairs.
- **No third-party requests at all.** The production build ships a strict Content-Security-Policy (`default-src 'self'`). System fonts are used instead of Google Fonts, and there’s no analytics.
- No ads, no data sales, no profiles, no feed, no strangers, no DMs, no location.
- **No parent surveillance.** She decides what to share, in her own words.
- **Discreet by default:** calendar events say “Personal” unless she chooses otherwise, and even the `.ics` file’s metadata never says “period”.
- **Optional passcode** that re-locks after a minute in the background. (It keeps casual eyes out on a shared device. It isn’t encryption.)
- Designed with COPPA in mind: collecting nothing is the strongest position. **Specialized counsel is still needed before a U.S. launch.**

## How it's built

**Local-first.** All data lives in IndexedDB on the device. The app is a React PWA with a web manifest and a service worker that caches only the app's own files (network-first for pages, so updates still arrive), and it works with no connection.

**End-to-end encrypted family sharing.** Not every 9-year-old has a phone, and many parents want to help.

- **Profiles.** A parent can log for a child with no phone (or several children, and themselves). Wording follows the profile: “Maya’s period, day 2”, “How is Maya today?”.
- **Share with another phone.** One phone shows a QR code; the other scans it and says whose phone it is (“Mine” or “I’m a parent or guardian”). When a child gets her first phone, her whole history moves over.
- **End-to-end encrypted.** Pairing shares one random 256-bit secret, only inside the QR code. Each phone derives an AES-GCM key, an HMAC key that turns record names like `day:2026-09-30` into random IDs, and an access token. The relay (`server/`) stores ciphertext under those IDs. It never sees names, dates or anything logged, and it stores no timestamps.
- **She’s in charge.** On her own phone, periods and flow are shared; pain, symptoms and feelings, and school impact stay private unless she turns them on. A parent’s phone hides what she keeps private (“That’s by design”), and turning a category off clears it from the parent’s copy. Private notes never leave the phone they were written on.
- **Either side can stop sharing.** That deletes the encrypted copy from the relay, and the other phone is told. Everything already on each phone stays.
- **Separately, “Send an update”** lets her send a one-time snapshot (e.g. “Could we get more pads?”) by text or QR, with no server involved at all.

Under the hood (`src/lib/syncCore.js`), the 256-bit pairing secret goes through HKDF-SHA-256 (Web Crypto) to derive an AES-GCM key, an HMAC-SHA-256 key and an access token. Each record is encrypted with AES-GCM, with its HMAC ID bound in as additional authenticated data. The relay in `server/` is a small Express app with rate limiting and two Postgres tables: random space IDs with a hashed access token, and ciphertext records. It keeps no timestamps, because *when* someone logs could itself reveal cycle timing.

**Strict CSP, generated at build time.** The Vite build injects a Content-Security-Policy of `default-src 'self'`. If a sync relay URL is configured, exactly that one origin is added; otherwise the app makes no network requests beyond its own files.

**Product guardrails enforced in tests.** `npm test` fails if the app's source mentions fertility, ovulation, contraception, conception or sex tracking, or uses "your period is late" language. The GitHub Actions workflow runs the app and relay tests before every GitHub Pages deploy, so the mission is checked in CI, not just written in a doc.

**41 automated tests** (36 for the app, 5 for the relay) also cover honest ranges at every stage of history, never inventing bleeding, change detection, patterns and natural phrasing, the "Is this normal?" search against real phrasings ("Why do I poop more?", "I got blood on my clothes"), discreet calendar output, importers, message drafting and the encrypted sync.

**No UI or chart libraries.** The cycle chart, calendar and bottom sheets are hand-built in React and CSS. The only runtime dependencies are React, React Router and a QR code generator.

```
src/lib/cycles.js      periods, ranged predictions, confidence, patterns, change detection, check-ins
src/lib/tell.js        "Help me tell someone" drafts
src/lib/ics.js         calendar ranges + discreet reminders (Google / Apple / Outlook)
src/lib/importers.js   CSV + pasted-date import
src/lib/plans.js       "My life" overlap
src/lib/syncCore.js    end-to-end encrypted sharing: keys, records, what she shares, merging
src/lib/useSync.js     background sync engine
server/                the relay: ciphertext in, ciphertext out
src/content/           Is this normal? · Learn · School Mode content
src/pages/             Today · Calendar · My Body · School · Learn · Normal · Tell · Report · Settings
```

## Design choices

- Plain, warm wording written for a 9-year-old, with a *"How should Cadence talk to you?"* setting (Simple, Standard, Grown-up) that changes the voice but never unlocks adult content.
- Every "Is this normal?" answer follows the same shape: *What's happening · Usually · Keep an eye on · Tell someone if…*
- Predicted windows are drawn as striped ranges on the calendar, never single days.
- Discreet by default: calendar events say "Personal" unless she chooses otherwise.
- System fonts and a light and dark theme that follows the phone.

## Tech stack

React 18, React Router, Vite, IndexedDB, Web Crypto, service worker / PWA · Node.js + Express + PostgreSQL relay (Neon, Render) · Node test runner · GitHub Actions + GitHub Pages.

## Run it locally

```bash
npm install
npm run dev                 # http://localhost:5173
npm test
npm run build               # static site in dist/

cd server && npm install
npm run dev                 # encrypted sync relay on :4000 (in-memory DB without DATABASE_URL)
npm test
```

**Deploying sharing:** create a free Neon Postgres database and a Render web service from `render.yaml`, set `DATABASE_URL`, then set the repository variable `SYNC_URL` to the Render URL. The GitHub Pages build picks it up and adds exactly that origin to the Content-Security-Policy. Without it, the app works fully on-device and sharing says it isn’t switched on yet.

## Roadmap

**V2:** Ask Anything (private conversational Q&A, moderated, sent without identity or cycle data) · ✨ “Just tell me” natural-language logging · deeper change detection · an opt-in auto-updating calendar feed (needs a server and a COPPA review) · reading her calendar for *My life* (Google/Microsoft OAuth) · Face ID via WebAuthn · discreet app icon.

**V3:** Parent Guide (education for parents, not surveillance) · clinician workflows · school-nurse and nonprofit distribution · Apple Health / Health Connect import (native app) · more languages.

**Before launch:** medical review of all health content by a pediatric/adolescent gynecology clinician · COPPA counsel · accessibility audit.

---

© 2026 Suhani Tiwari. All rights reserved. See [LICENSE](LICENSE). Cadence provides general information and is not medical advice.

Built by [Suhani Tiwari](https://suhanitiwari.com).
