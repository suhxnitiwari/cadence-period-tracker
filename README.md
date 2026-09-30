# Cadence

**A period tracker that works for you, not for advertisers.**
Free, private, and safe for every age, from a first period on.

Cadence is a full-stack web app (React, Node/Express and PostgreSQL) with **end-to-end encryption**: everything you log is encrypted in your browser before it's saved, so the server only ever stores ciphertext. Even the *dates* are hidden.

© 2026 Suhani Tiwari. All rights reserved.

---

## Why I built it

I used the most popular period tracker and kept running into the same problems. Looking closer, most of them come from the business model:

| Problem with today's apps | What Cadence does instead |
|---|---|
| **Data is the product.** Leading apps have shared health data with advertisers, and after *Dobbs* (2022) period data can be subpoenaed. A privacy policy is only a promise. | **End-to-end encrypted.** The server can't read your data, so it can't sell, leak or hand it over. That's provable, not a promise. Sign-up is a username only: no email, no phone. |
| **Paywalls and upsells.** "Choose your plan" screens, trials that turn into bills, red notification badges. | **Free, with everything included.** No ads, no plans, no trackers, no engagement bait. |
| **Not safe for kids.** Feeds of sex content and anonymous "secret chats" sit next to the tracker, even though many users are 10–13. | **Safe for any age.** No feed, no community, no sex content. A calm **Learn** page covers first periods, supplies, cramps and when to see a doctor. |
| **"Partners" is the only sharing option.** | **People who help you:** share with a parent, guardian, caregiver or partner. You choose exactly what they see, and they get practical, age-appropriate ways to help. **"I need…" buttons** let a kid quietly ask for supplies or say they're in pain. |
| **False precision.** One confident date, even for irregular cycles (PCOS and endometriosis each affect about 1 in 10). | **Honest ranges** sized by *your* cycle-to-cycle variation, with a confidence label. The fertile window is off by default, hidden for irregular cycles, and labelled *not birth control*. |
| **Useless at the doctor's office.** Endometriosis takes 7–10 years to diagnose on average. | **Printable doctor report:** cycle and period lengths, variation, heavy-flow days, pain, symptom frequency, and gentle flags worth raising. |
| **No calendar integration.** | **Google & Apple Calendar:** one-click add, an opt-in auto-updating subscription, and a `.ics` download. Event titles can be discreet ("Reminder") for shared calendars. |
| **Lock-in.** | **Export** to JSON or CSV, **import** backups, and **delete everything instantly**. |

It also surfaces personal patterns ("Headaches usually show up about 2 days before your period"), because knowing what's coming helps you plan.

## How the encryption works

```
password ──PBKDF2 (600k, SHA-256)──► 768 bits
                                     ├─ authKey  → sent to server, bcrypt-hashed (proves identity)
                                     ├─ encKey   → AES-256-GCM, never leaves the browser
                                     └─ macKey   → HMAC-SHA-256 entry IDs, never leaves the browser
```

- Each logged day is stored as `{ id: HMAC(macKey, "day:2026-09-30"), iv, ciphertext }`. The server can't tell which date an entry belongs to.
- The entry ID is bound into AES-GCM as associated data, so the server can't swap blobs between entries.
- Keys live in IndexedDB as **non-extractable** `CryptoKey`s. Logging out wipes them.
- Predictions, insights and the doctor report are all computed **client-side**.
- **Share links** use a fresh random key per person, carried in the URL `#fragment`, which browsers never send to servers.
- The server keeps **no timestamps and no request logs**, since *when* you log could itself reveal cycle timing.
- Unknown usernames get a stable fake salt, so the login flow can't be used to check whether someone has an account.
- **The trade-off:** a forgotten password can't be reset. The sign-up flow says so plainly and asks the user to acknowledge it.
- **The one opt-in exception** is calendar sync. Calendar apps can't decrypt, so turning it on publishes *predicted dates and your chosen title* at an unguessable URL. Turning it off deletes it.

## Tech

- **Client:** React 18, React Router, Vite, Web Crypto API, IndexedDB. No UI or chart libraries; the charts are hand-built SVG.
- **Server:** Node, Express, PostgreSQL (`pg`), bcrypt, JWT in an `httpOnly` + `SameSite=Strict` cookie, Helmet (strict CSP, `no-referrer`), rate-limited auth.
- **Tests:** `node:test` + Supertest. 11 API tests (auth, user isolation, calendar feed, share links, account deletion) and 13 client tests (prediction logic, symptom patterns, crypto round-trips, `.ics` output, share-snapshot filtering).

```
client/src/
  lib/cycles.js     cycle detection, ranged predictions, health flags, symptom patterns
  lib/crypto.js     key derivation, AES-GCM, HMAC entry IDs, share keys
  lib/ics.js        iCalendar feed + Google Calendar links
  lib/share.js      what trusted people can see + caregiver tips
  store.jsx         encrypted sync, auto-publishing share links & calendar feed
  pages/            Today, Calendar, Insights, Report, People, SharedView, Learn, Privacy, Settings
server/src/
  routes/           account, entries, calendar, shares
  db.js             schema (Postgres, or in-memory pg-mem when no DATABASE_URL)
```

## Running it

```bash
npm run setup
npm run dev
```

Then open http://localhost:5173. Without a `DATABASE_URL`, the API uses an in-memory database, so there's nothing else to install.

For production, set `DATABASE_URL` and `SESSION_SECRET` (see `server/.env.example`), then:

```bash
npm run build && npm start
```

Express serves the built client and the API from one process. Calendar subscriptions need a public HTTPS address, because Google fetches the feed from its own servers.

```bash
npm test
```

## Roadmap

- **Caregiver-managed profiles:** a parent or caregiver logs *for* someone who can't (for example, a disabled teen).
- Password change with re-encryption, and an optional recovery key.
- More languages, and a low-literacy / picture-first logging mode.
- Installable PWA with offline logging.
- Distribution through school nurses and pediatric clinics, with printable first-period guides that link to Cadence.

---

© 2026 Suhani Tiwari. All rights reserved. See [LICENSE](LICENSE).
Cadence gives general information and is not medical advice.
