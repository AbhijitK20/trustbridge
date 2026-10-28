# TrustBridge

**Verify the claim before you pay.**

TrustBridge is a verification and protected-payment workspace for deals made in chat, email, and job boards. It turns an offer into checkable claims, shows what each source can actually support, and keeps the payment attached to a written deal instead of a screenshot.

> **Hackathon build — sandbox payments.** Production runs with `DEMO_MODE=true` and Razorpay test keys. The payments page labels the ledger "sandbox", checkout writes `demo_…` references, and **no real money is held or moved**. TrustBridge is not a bank or a licensed escrow; in a live flow a licensed payment partner holds funds.

## What it does

- **Four-state verification** — `VERIFIED`, `VERIFIED_WITH_CONDITIONS`, `CONTRADICTED`, `UNDETERMINED`, with per-claim rationale, evidence tiers E0–E3, and a "could not determine" list.
- **Referee chat** — paste an offer; get the verdict plus a reply you can send.
- **Protected deals** — public deal link, deposit/balance or milestone releases, delivery acceptance, disputes, audit trail, receipt.
- **Browser extension** — a "Check this offer" pill on any page, with a Shadow DOM panel.
- **Mobile web workspace** — `/app` is a phone-sized portal over the same data.
- **Demo surfaces** — a fake Google internship page and a WhatsApp simulator.

## Stack

Next.js 16 App Router, TypeScript, Prisma + PostgreSQL (Supabase), Auth.js, Tailwind, Three.js, Flutter mobile client, Chrome MV3 extension, Vitest.

## Local setup

```bash
cp .env.example .env          # fill DATABASE_URL and AUTH_SECRET
npm install
npx prisma generate
npm run db:push
npm run dev                   # http://localhost:3000
```

Minimum env: `DATABASE_URL`, `AUTH_SECRET` (or `NEXTAUTH_SECRET`), `NEXT_PUBLIC_APP_URL`.
Optional integrations: `RAZORPAY_*`, `STRIPE_*`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `SUPABASE_*`, Upstash rate limiting.

Set `DEMO_MODE="true"` for the no-money demo (demo seats on `/signin`, simulated payouts and disputes).

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/check` | Claim verification + scenarios |
| `/referee` | Chat wrapper around the verification engine |
| `/create` | Start a protected deal (signed in) |
| `/dashboard` | Buyer/seller workspace: deals, payments, disputes, checks |
| `/deal/[token]` | Public deal page, receipt, contract |
| `/seller/[slug]` | Public seller profile |
| `/seller/verify` | Seller onboarding |
| `/app` | Mobile web workspace |
| `/demo/scam?preview=1` | Extension demo (fake internship) |
| `/demo/whatsapp` | WhatsApp bot simulator |
| `/admin/*` | Admin queues (approvals, disputes, payouts, compliance) |

## Browser extension

Source: [`public/extension`](public/extension) (Manifest V3).

1. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `public/extension`.
2. Reload the page you want to check. The pill appears bottom-right; clicking the toolbar icon also toggles the panel.
3. Prefer no install? Open `https://trustbridge-abhithe.vercel.app/demo/scam?preview=1`.

`config.js` sets the API origin; `content.js` falls back to the page origin on TrustBridge hosts. The extension does not run on `chrome://` pages or the Chrome Web Store, and needs a reload after install or a redeploy.

## Tests

```bash
npm run lint
npm run typecheck
npm run test
```

## Deploy

```bash
vercel --prod
```

`.vercelignore` excludes `node_modules`, `.next`, `refs`, `video`, and mobile build output so uploads stay small. Never commit `.env` files. After a deploy, hard-refresh open tabs (`Ctrl+Shift+R`) — stale chunks from the previous build are the usual cause of blank pages or failed redirects.

## Docs

- [`PROJECT.md`](PROJECT.md) — architecture, data model, API surface, compliance notes.
- [`PITCH.md`](PITCH.md) — product narrative and demo script.
- [`video/README.md`](video/README.md) — the pitch-video pipeline (scripts only; rendered media is git-ignored).
