# TrustBridge — Pitch Package for the 50-Mark Rubric

Built from the repo and the live deployment on 2026-10-28. Everything below is designed to be
rehearsed, not read on stage.

- Live app: https://trustbridge-abhithe.vercel.app
- Health check: `/api/health` returns `database: ok`
- Demo entry: `/signin` → "Open a demo portal" → Buyer / Seller / Admin / Reviewer
- Verification demo: `/check` → scenario chips
- Seeded deal for the money demo: `/deal/demo-milestone-deal`

---

## 0. The one sentence

**TrustBridge verifies the claim before you pay, then protects the payment until the work is
delivered — so a stranger's promise is never the only thing between you and your money.**

Say that sentence at the start and again at the end. Judges remember repetition.

---

## 1. Score map — where each mark is earned

| Rubric line | Marks | What the judge must hear or see | Where it happens |
|---|---:|---|---|
| A. Clarity and impact of the opening | 3 | One concrete message, one amount, one consequence. No company intro, no agenda. | 0:00 hook |
| A. Communication of the idea and value | 4 | "Verify the claim → protect the payment" in plain words. One sentence, repeated. | 0:25 and 4:35 |
| A. Ability to capture interest | 3 | A simulated scam message that looks real, then an unexpected verdict. | 0:00 and demo step 1 |
| B. Clear definition of the problem | 4 | The failure is **prepayment on an unverified claim**, not "online fraud" in general. | 0:25 problem block |
| B. Relevance and significance | 3 | One credible external number + the everyday frequency of the pattern. | 0:35 |
| B. Understanding of target users | 3 | Name the three users and what each needs before money moves. | 0:45 |
| C. Logical flow and clarity | 3 | Hook → problem → insight → demo → proof → close. Signpost each turn. | Full script |
| C. Quality of demonstration | 4 | Live, rehearsed, 2:20, one "wow" moment: unresolved verification → explicit acknowledgment → release. | 1:30 demo |
| C. Time management and Q&A | 3 | Hard stop at 5:00. Three prepared answers with evidence, not opinion. | Timer + Q&A bank |
| D. Functionality and working implementation | 7 | Live check, live deal, live release, live audit trail. Mention 28 passing tests, 40 routes, 22 models, CI. | Demo + proof |
| D. Innovation and originality | 5 | Evidence tiers E0–E3, four honest verdicts, verification-gated money. Not another chatbot. | 1:05 insight |
| D. Effectiveness of the solution | 5 | The money only moves against acceptance; contradicted claims cannot release; high-value decisions need two admins. | Demo + proof |
| D. Technical execution and completeness | 3 | Deterministic engine, idempotent payouts, hashed contracts, signed webhooks, private evidence, strict TS. | 3:50 proof |

**Scoring tactic:** the rubric scores categories separately, so say the category out loud.
"Let me define the problem." "Our users are..." "I'll show you the working product." "To close..."
This makes the judge's job easy and prevents them from inferring a weaker story.

---

## 2. The 5-minute script

Timings are hard stops. If you are behind, cut the WhatsApp/extension line, never the demo.
Speaker and driver should be different people if possible. The driver never talks.

### 0:00–0:25 — Hook (A: 3+3)

> [Show the simulated Google internship message, full screen. Do not introduce yourself yet.]
>
> "This message is simulated. The pattern is not.
>
> 'You've been selected for the Google AI internship. Pay a ₹1,500 refundable registration fee
> within 24 hours to confirm your seat.'
>
> The logo is right. The offer letter is a PDF. The Gmail address says `hr.google.intern`.
> A student pays. There is no internship.
>
> This is not a phishing problem — the message came from a real account. It is not a stupidity
> problem either. It is a **payment** problem: she had no independent reason to trust the claim,
> and no way to get the money back."

**Why this works:** concrete, visual, one number, one consequence. No "we are team X and our
project is..." opening.

### 0:25–1:05 — Problem and users (B: 4+3+3)

> "Let me define the problem precisely.
>
> India runs on chat commerce — internships, freelance gigs, tuition, deposits, second-hand gear.
> The deal is agreed in WhatsApp. The money moves on UPI. The only evidence is a screenshot.
>
> **A screenshot is a claim, not evidence.** It proves the message exists, not that it is true.
> Platforms verify accounts, not claims. And traditional escrow is built for property and large
> contracts, not a ₹5,000 design job.
>
> The scale is not small: the FBI's IC3 recorded more than **$16.6 billion** in reported
> cybercrime losses in 2024. We attack a narrower, more personal slice: the moment before you pay
> someone you met online.
>
> Our users are three people. The **student or first-job seeker** deciding whether an offer is
> real. The **small freelancer or solo seller** who needs a buyer to trust them without a brand.
> And the **buyer** in informal commerce who cannot afford to lose the advance.
>
> None of them need a fraud report. They need a decision they can act on **before** the money
> leaves."

### 1:05–1:30 — Insight (D: innovation)

> "Existing tools give you a score. A score is not a decision.
>
> We give **four honest outcomes**: verified, verified with conditions, contradicted, undetermined.
>
> And we rank evidence by what it can actually prove. A screenshot is **E0** — self-asserted.
> A Gmail address is **E1** — platform-asserted. An independent first-party source is **E3**.
> Material reliance needs E3, and it must exist **before** the decision, not after.
>
> The hard part is the fourth outcome. When the evidence is silent, most tools say 'unknown' and
> stop. We say: **do not pay unprotected — move the deal onto rails where the money is protected.**
> That is the product."

### 1:30–3:50 — Live demo (C: 4, D: 7)

Driver: follow the runbook in section 3 exactly. Speaker: narrate outcomes, not clicks.

**Step 1 — the scam (1:30–1:55, 25s)**
> "Same message. One click."
>
> [Click "Fake Google internship". Verdict appears instantly.]
>
> "Contradicted. Not because the logo is fake — because Google's own published guidance says no
> reputable person or agency demands payment on the spot. That is an independent source, and it
> contradicts the fee.
>
> The decision is **do not proceed**. And notice what we do *not* claim: we list what we could not
> determine — whether the sender works at Google, whether the letter was issued by Google. We do
> not fake certainty."

**Step 2 — the honest maybe (1:55–2:20, 25s)**
> [Click "Unknown freelance seller".]
>
> "Different case. No contradiction, but no proof either. Outcome: **undetermined**. Decision:
> proceed with protection. This is the honest answer for most real deals.
>
> One click turns the warning into a transaction."
>
> [Click "Protect this deal". Prefilled create screen appears.]
>
> "Price, deliverables, acceptance criteria, milestones, contract. The warning is now a deal with
> terms."

**Step 3 — the money gate (2:20–3:20, 60s)**
> [Switch to the buyer tab, open the seeded "Brand site — milestone build".]
>
> "This deal is already in flight. Three milestones. The first was released. The second is
> submitted with evidence. Watch the gate."
>
> [Scroll to "Visual design". Point at "Verification is unresolved". Tick the acknowledgment.
> Click "Accept & release".]
>
> "The verification could not confirm every material claim, so the buyer must explicitly
> acknowledge the residual risk. Then ₹12,000 releases against acceptance — not against a promise.
> The timeline records who did what, when. The final milestone stays protected."
>
> "If the verification had been **contradicted**, this button would not release anything. A
> contradicted claim cannot move money."

**Step 4 — breadth (3:20–3:35, 15s, cut first if behind)**
> "The same engine runs in WhatsApp, in a browser extension on the page where the offer appears,
> and in the Flutter app. One decision, three surfaces."

**Demo close (3:35–3:50, 15s)**
> "Verification is unilateral. Protection is bilateral. That is the whole architecture."

### 3:50–4:35 — Proof and moat (D: 5+5+3)

> "Under the hood, this is a deterministic rules engine — not an LLM guess. The AI is used only to
> triage delivery evidence. It never decides whether money moves.
>
> Every payout uses an idempotency key. Every contract is snapshot-hashed with SHA-256. Every
> high-value refund or release above a configurable threshold needs a second admin. Evidence is
> private, served through short-lived signed URLs, and hashed for tamper evidence.
>
> The build: 40 route handlers, 22 data models, 28 tests passing, CI that typechecks, lints, tests
> and builds, a release APK, and this live deployment with a healthy database.
>
> The innovation is not the chatbot. It is the **evidence model plus the payment gate**: a
> contradicted claim cannot release money; an undetermined claim requires explicit acknowledgment;
> a delivered milestone releases against its own acceptance criteria."

### 4:35–5:00 — Close (A: value)

> "Every scam starts with a claim. Every deal ends with a payment.
>
> We put the evidence between the two.
>
> TrustBridge: **verify the claim before you pay.**
>
> Thank you."

**Stop talking at 5:00.** Do not fill silence. Let the last line land.

---

## 3. Demo runbook

### 3.1 Pre-flight (T-10 minutes)

1. Open the production app, not localhost. Local returned `503` at build time because its database
   was not connected; production `/api/health` returns `database: ok`.
2. Sign in as **Buyer** in tab B before you walk on stage, so the session cookie is already set.
3. Tab A: `/check`, scrolled so the **TRY A SCENARIO** chips are visible. Tab B:
   `/deal/demo-milestone-deal`, scrolled to the **Visual design** milestone. Tab C (optional,
   incognito): `/admin` signed in as Admin.
4. Confirm on the seeded deal that **"Visual design" is `SUBMITTED`** and the button says
   **"Accept & release"**. If it says `RELEASED`, reset with section 3.4 before going on stage.
5. Zoom 110%. Close bookmarks bar, notifications, Slack, and every unrelated tab.
6. Put a visible timer in the corner at 5:00. Assign one person to call "1 minute left."
7. Backup: a 90-second screen recording of the exact flow, plus the screenshots in `design/`.
8. Charger connected. Do not rely on venue Wi-Fi for anything except the live app; if it fails,
   switch to the recording without apologising.

### 3.2 Exact click path

| # | Where | Action | Say this | Time |
|---|---|---|---|---|
| 1 | `/check` | Click **Fake Google internship** | "Same message. One click." | 0:05 |
| 2 | result | Point at **CONTRADICTED**, then at the E3 quote | "Google's own guidance contradicts the fee." | 0:15 |
| 3 | result | Point at **What we could not determine** | "We do not fake certainty." | 0:05 |
| 4 | `/check` | Click **Unknown freelance seller** | "No contradiction, no proof. Undetermined." | 0:10 |
| 5 | result | Click **Protect this deal** | "One click turns a warning into a deal." | 0:08 |
| 6 | `/create` | Let the prefilled form show, then switch tab | "Price, milestones, acceptance criteria." | 0:07 |
| 7 | `/deal/demo-milestone-deal` | Scroll to **Visual design** | "The second milestone is submitted." | 0:08 |
| 8 | milestone | Point at **Verification is unresolved** | "The buyer must acknowledge the risk." | 0:07 |
| 9 | milestone | Tick the checkbox | "Explicitly." | 0:03 |
| 10 | milestone | Click **Accept & release** | "₹12,000 releases against acceptance." | 0:08 |
| 11 | timeline | Point at the new audit entry | "Who, what, when — on the record." | 0:05 |
| 12 | optional | Switch to WhatsApp or extension | "Same engine, three surfaces." | 0:15 |

### 3.3 Failure fallbacks

- **App slow or down:** switch to the recording. Say "I'll show the recorded run so we don't burn
  your time," then keep narrating. Do not debug on stage.
- **Already signed out:** use the Buyer demo portal; it is one click and seeds the workspace.
- **Milestone already released:** skip step 10, point at the timeline entry and say "this is the
  release we just ran in rehearsal — the record is the same one the live click writes." Then move
  on. Better: reset before stage (3.4).
- **Create redirects to sign-in:** the session cookie was lost. Show the prefilled URL is intact,
  say "the deal draft survives the auth boundary," and jump to the seeded deal. Do not sign in
  live unless it takes one click.
- **Judge asks you to type a custom offer:** do it only if you have 60 spare seconds. Otherwise:
  "I'll take that after the demo; the engine is deterministic and the form is the same path."

### 3.4 Reset the seeded money demo after a rehearsal

The release click is real and persists. Rehearse on a preview deployment if you can, and keep
production pristine for the pitch. If you must rehearse on production, run this against the demo
database after each run (psql with `DATABASE_URL`; never paste the URL on stage):

```sql
BEGIN;

UPDATE "Milestone" m
SET status = 'SUBMITTED',
    "releasedAt" = NULL,
    "releasedById" = NULL,
    "reviewNote" = NULL
FROM "Deal" d
WHERE m."dealId" = d.id
  AND d."publicToken" = 'demo-milestone-deal'
  AND m.position = 2;

DELETE FROM "AuditLog" a
USING "Deal" d
WHERE a."dealId" = d.id
  AND d."publicToken" = 'demo-milestone-deal'
  AND a.action = 'MILESTONE_RELEASED'
  AND (a.metadata->>'position') = '2';

COMMIT;
```

Then reload the deal and confirm the button is back to **Accept & release** and the verification
gate still says **unresolved**.

---

## 4. Slide outline (7 slides, minimal text)

1. **Title** — TrustBridge. "Verify the claim before you pay." No agenda slide.
2. **The message** — the simulated Google offer, ₹1,500, the Gmail address. One line:
   "The logo is right. The offer is not."
3. **The real problem** — "A screenshot is a claim, not evidence." Three user icons:
   student, freelancer, buyer. The $16.6B IC3 line as a footnote, not the headline.
4. **The four outcomes** — verified / verified with conditions / contradicted / undetermined.
   "Most tools stop at unknown. We change the payment structure."
5. **Verify → Protect** — one horizontal diagram: claim → evidence tiers → decision → protected
   deal → milestone release → dispute/audit. No architecture diagram on stage.
6. **Demo** — a blank slide or the live tab. Do not put screenshots of the app here; the live
   product is the slide.
7. **Proof + close** — 28 tests, 40 routes, 22 models, live deployment, APK. Then the closing line:
   "Every scam starts with a claim. Every deal ends with a payment. We put the evidence between
   the two."

Keep a hidden appendix slide with the architecture diagram, data model counts, and security
controls for Q&A. Do not show it unless asked.

---

## 5. Q&A bank

Answer in one breath, then stop. One concrete proof per answer beats three abstractions.

**1. Isn't this just escrow?**
> No. Escrow is one layer. We verify the claim before a deal exists, attach the evidence to the
> deal, gate each milestone on it, and keep the dispute record. Funds are handled by the payment
> partner; we are a technology layer, not a licensed escrow agent, and the legal copy says so.

**2. Why rules instead of AI?**
> Because money should not depend on a hallucination. The verification engine is deterministic
> and testable — 8 of our 28 tests cover contradiction, official domains, and unknown sellers.
> The AI only triages delivery evidence and can return "needs human review"; it never releases
> funds.

**3. What is genuinely novel?**
> The combination: evidence tiers with timing and materiality, four honest outcomes, and a payment
> gate that refuses to release against a contradicted claim. A scam checker warns you. We complete
> the transaction safely.

**4. Who pays?**
> Verification is free. Protected deals carry a configurable platform fee — 3% by default — split
> across deposit and balance. The payer is the party that benefits from the deal closing — the
> buyer, the seller, or a marketplace that bundles it.

**5. Why would a scammer agree to a protected deal?**
> They won't. That is the point. Protection is for the legitimate-but-unproven seller. A scammer
> refusing protection is itself a signal, and verification catches the contradicted claims before
> a deal starts.

**6. What stops a real domain from faking employment?**
> A matching domain proves the domain, not the person. Our "recruiter with a matching domain"
> scenario returns verified for the domain but keeps identity unconfirmed, so the decision is
> proceed with conditions. We never upgrade domain evidence into employment evidence.

**7. What happens after the money is released?**
> The balance releases on acceptance or after a 7-day review window. A dispute freezes releases
> and routes to an admin with buyer and seller statements, evidence hashes, and a maker-checker
> second approval above a threshold. Every step is in the audit log.

**8. Is this regulated?**
> We are explicit that TrustBridge is not a bank, escrow agent, trustee, or money transmitter.
> Production requires a licensed payment or escrow partner and real KYC. The demo does not move
> real money, and the product says so.

**9. What is actually working vs mocked?**
> Working end-to-end: verification, saved reports, protected deals, demo and Stripe payment paths,
> milestones, contracts and PDF, disputes, admin queues, KYC queue, trust score, WhatsApp
> simulator, extension, Flutter client, legal pages, audit log. Mocked or demo-grade: settlement,
> KYC/sanctions, mobile auth, and the extension is not published. I'll show any of it.

**10. How do you scale verification?**
> The registry and rule set are data, not prompts. Add domain/registry APIs, document checks, and
> community reports without changing the outcome model. The engine already returns "could not
> determine" instead of inventing coverage, so new sources raise confidence honestly.

**11. What is the biggest risk?**
> False confidence. That is why the fourth outcome exists and why contradicted claims block
> protection instead of being "protected anyway." The second risk is regulatory; that is a partner
> problem, and we have designed the legal surface around it.

**12. Why now?**
> Fake offers are now cheap to produce — a logo, a PDF, a Gmail address. At the same time, payment
> APIs make protection buildable for small deals. The gap between "looks real" and "is real" is
> widening, and the payment moment is where the loss happens.

**13. What would you do with the next 30 days?**
> Real KYC and a licensed payment partner, a store-published extension, mobile auth, and a fraud
> evidence dataset from real disputes. The core loop is built; the next work is trust infrastructure,
> not more screens.

**14. Show me the code.**
> Open `src/lib/verification/engine.ts` for the rules, `payouts.ts` for idempotent transfers, and
> `contracts.ts` for the hash and signature lifecycle. The tests are in the same tree and run with
> `npm test`.

**15. What is the official problem statement, and how do you map to it?**
> [Insert the exact statement.] TrustBridge answers the part where money is actually lost: trust
> before payment. Verification handles the claim; protection handles the transaction.

---

## 6. Cuts for other time limits

### 3-minute version

- 0:00–0:20 hook
- 0:20–0:50 problem + users
- 0:50–1:10 insight (four outcomes)
- 1:10–2:20 demo: fake internship verdict → seeded milestone release with acknowledgment
- 2:20–2:45 proof: deterministic engine, payment gate, 28 tests, live app
- 2:45–3:00 close

### 30-second elevator

> "People lose money to offers they met in chat because a screenshot is not evidence. TrustBridge
> verifies the claim against independent sources, returns four honest outcomes, and then protects
> the payment until delivery. Contradicted claims cannot release money; unresolved claims require
> explicit risk acceptance. Verify the claim before you pay."

---

## 7. Leave-behind one-pager

**TrustBridge — verify the claim before you pay.**

- **Problem:** prepayment on unverified claims in chat commerce. A screenshot proves a message
  exists, not that it is true.
- **Solution:** evidence-tiered verification (E0–E3, before/during/after, supports/contradicts)
  → four outcomes → protected deal with milestones, hashed contract, disputes, audit.
- **Wedge:** students and first-job seekers; small freelancers and solo sellers; buyers in informal
  commerce.
- **Proof:** live at trustbridge-abhithe.vercel.app; 28 tests passing; 40 route handlers; 22 data
  models; CI typecheck/lint/test/build; Flutter APK; WhatsApp and extension surfaces.
- **Business:** free verification; configurable platform fee (3% default) on protected deals;
  partner-led KYC and settlement.
- **Boundary:** not a bank or licensed escrow; funds handled by the payment partner.
- **Contact:** [name] · [phone] · [email] · [GitHub]

---

## 8. Evidence appendix (verified at pitch build time)

| Claim | Evidence |
|---|---|
| Live app and database healthy | `GET /api/health` → `{"status":"ok","database":"ok"}` |
| 28 tests pass | `npx vitest run` → 7 files, 28 tests passed |
| 40 route handlers | `find src/app/api -name route.ts` → 40 |
| 22 models, 14 enums | `prisma/schema.prisma` |
| APK built | `mobile-dist/TrustBridge.apk`, ~52 MB |
| Demo portal live | `/signin` contains "Open a demo portal" |
| Scenarios live | `/check` contains the fake internship, recruiter, unknown seller chips |
| Seed state for money demo | `demo.ts`: milestone 1 released, 2 submitted, 3 pending |
| CI | `.github/workflows/ci.yml`: typegen, typecheck, lint, test, build with Postgres 16 |
| Security controls | `next.config.ts`, `src/lib/abuse.ts`, signed storage URLs, Stripe webhook idempotency |
| Google quote | `src/lib/verification/scenarios.ts` (E3 contradiction) |
| IC3 2024 loss figure | https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf (> $16.6B reported losses) |

Do not add "users", "revenue", "partnerships", or "accuracy percentage" unless you can point to a
record. Judges reward candour more than invented traction.

---

## 9. What not to say

- "AI detects scams." → The engine is deterministic; AI only triages delivery evidence.
- "100% safe." → We return four honest outcomes, including undetermined. Say "honest outcomes."
- "We are escrow." → Say "payment protection layer; funds handled by the payment partner."
- "It's like [competitor]." → Name the mechanism, not the competitor.
- "We built a lot of features." → Name the one gate that matters: contradicted claims cannot
  release money.
- "Any questions?" as the last line. → End on the tagline. Then invite questions.

---

## 10. Rehearsal checklist

- [ ] Three full run-throughs with a timer; two under 5:00, one under 4:45.
- [ ] One run with the network deliberately off (fallback recording).
- [ ] One run where the milestone is already released (fallback narration).
- [ ] Demo driver can complete the click path without the speaker's instructions.
- [ ] Speaker can deliver the hook and close from memory, without slides.
- [ ] Q&A: answer 1, 2, 3, 5, 8, and 9 out loud until each is under 20 seconds.
- [ ] Reset the seeded milestone after the last rehearsal (section 3.4).
- [ ] Confirm production health and buyer session 10 minutes before stage.
- [ ] Charge laptop, phone, and clicker; disable notifications; close personal tabs.

---

## 11. One thing to adapt

The rubric says the score must reflect the **official problem statement**. Paste that statement
into Q&A answer 15 and into the 0:25 transition ("The official statement asks for X; the part that
actually loses money is Y"). If the statement is broader than trust and payments, do not stretch
the demo — reframe the opening sentence to the statement's exact verb, then return to the payment
moment. One sentence of explicit mapping is worth more than a slide.
