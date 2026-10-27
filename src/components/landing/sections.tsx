"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  CountUp,
  LinesReveal,
  Magnetic,
  Reveal,
  SectionTag,
  Tilt,
} from "@/components/experience/ui";

/* ---------------------------------------------------------------- marquee */

const marqueeItems = [
  "Screenshots are claims",
  "Evidence tiers",
  "Human-first disputes",
  "Proof before payout",
  "One link",
  "Four honest outcomes",
];

function MarqueeSet() {
  return (
    <div className="lp-marquee-set" aria-hidden>
      {marqueeItems.map((item) => (
        <span key={item}>
          {item} <i>◆</i>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="lp-marquee" aria-label="TrustBridge principles">
      <div className="lp-marquee-track">
        <MarqueeSet />
        <MarqueeSet />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- statement */

const flow =
  "A screenshot is a claim. A screen recording is a claim. A promise in your DMs is a claim. Only evidence moves money.".split(
    " ",
  );

function FlowWord({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = Math.min(1, start + 1.4 / total);
  const opacity = useTransform(progress, [start, end], [0.14, 1]);
  return (
    <motion.span style={{ opacity }}>
      {word}{" "}
    </motion.span>
  );
}

export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.55"],
  });

  return (
    <section className="lp-statement" id="problem">
      <div className="lp-wrap">
        <div className="lp-statement-head">
          <div>
            <Reveal>
              <p className="lp-kicker">The problem</p>
            </Reveal>
            <h2 className="lp-h2">
              <LinesReveal
                lines={[
                  <>Screenshots are</>,
                  <>
                    claims, not <em>evidence.</em>
                  </>,
                ]}
              />
            </h2>
          </div>
          <Reveal delay={0.15} className="lp-statement-note">
            <p style={{ margin: 0 }}>
              Anyone can fake a payment receipt, a dashboard, a client message.
              TrustBridge separates what someone says from what an independent
              record can actually support.
            </p>
          </Reveal>
        </div>

        <div ref={ref}>
          <p className="lp-wordflow" aria-label={flow.join(" ")}>
            {flow.map((word, index) => (
              <FlowWord
                key={`${word}-${index}`}
                word={word}
                index={index}
                total={flow.length}
                progress={scrollYProgress}
              />
            ))}
          </p>
        </div>

        <div className="lp-stats">
          <Reveal className="lp-stat" delay={0.05}>
            <b>
              <CountUp to={4} />
            </b>
            <span>
              Honest outcomes. Every claim lands somewhere real — including
              &ldquo;we can&rsquo;t tell yet.&rdquo;
            </span>
          </Reveal>
          <Reveal className="lp-stat" delay={0.12}>
            <b>
              E0<em>–</em>E3
            </b>
            <span>
              Weighted evidence tiers. A self-assertion never outranks an
              independent record.
            </span>
          </Reveal>
          <Reveal className="lp-stat" delay={0.19}>
            <b>
              <CountUp to={100} suffix="%" />
            </b>
            <span>
              Releases need proof. Deposit on delivery, balance on acceptance —
              or a human decides.
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- process */

const steps = [
  {
    number: "01",
    title: "Check the claim",
    body: "Paste the offer, fee, or link. TrustBridge shows what an independent source can actually support — before any money moves.",
    visual: (
      <div className="lp-mock">
        <div className="lp-mock-row">
          <b>Business registry</b>
          <span className="lp-mock-ok">match</span>
        </div>
        <div className="lp-mock-row">
          <b>Payment receipt</b>
          <span className="lp-mock-warn">unverified</span>
        </div>
        <div className="lp-mock-row">
          <b>Domain age</b>
          <span className="lp-mock-bad">11 days</span>
        </div>
        <div className="lp-mock-row">
          <b>Verdict</b>
          <span className="lp-mock-warn">undetermined</span>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "Lock the payment",
    body: "Share one TrustBridge link. The deposit is held, the balance waits for acceptance. No bank details in a DM, no screenshots of transfers.",
    visual: (
      <div className="lp-mock">
        <div className="lp-mock-row">
          <span>Protected amount</span>
          <b>₹1,200.00</b>
        </div>
        <div className="lp-mock-row">
          <span>Deposit released on</span>
          <b>Delivery</b>
        </div>
        <div className="lp-mock-row">
          <span>Balance released on</span>
          <b>Acceptance</b>
        </div>
        <div className="lp-mock-amount">₹360</div>
        <div className="lp-mock-bar">
          <span />
        </div>
      </div>
    ),
  },
  {
    number: "03",
    title: "Release with proof",
    body: "Delivery evidence is reviewed against the brief. The deposit releases on delivery; the balance on acceptance — or a human referee decides.",
    visual: (
      <div className="lp-mock">
        <div className="lp-mock-row">
          <b>Brief</b>
          <span className="lp-mock-ok">signed</span>
        </div>
        <div className="lp-mock-row">
          <b>Delivery</b>
          <span className="lp-mock-ok">2 files</span>
        </div>
        <div className="lp-mock-row">
          <b>Evidence tier</b>
          <span className="lp-mock-ok">E3</span>
        </div>
        <div className="lp-mock-row">
          <b>Release</b>
          <span className="lp-mock-ok">released ↗</span>
        </div>
      </div>
    ),
  },
];

export function Process() {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });
  const rawX = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const x = useSpring(rawX, { stiffness: 120, damping: 26, mass: 0.4 });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const index = Math.min(steps.length - 1, Math.floor(value * steps.length + 0.35));
    setActive(index);
  });

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      setDistance(Math.max(0, el.scrollWidth - window.innerWidth + 40));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section className="lp-process" id="how-it-works">
      <div className="lp-wrap lp-process-intro">
        <Reveal>
          <p className="lp-kicker" style={{ color: "rgba(243,239,230,.42)" }}>
            How it works
          </p>
        </Reveal>
        <h2 className="lp-h2">
          <LinesReveal
            lines={[
              <>Three moves.</>,
              <>
                One <em>less</em> thing to worry about.
              </>,
            ]}
          />
        </h2>
      </div>

      <div className="lp-pin" ref={pinRef}>
        <div className="lp-pin-sticky">
          <motion.div
            className="lp-pin-track"
            ref={trackRef}
            style={reduced ? undefined : { x }}
          >
            {steps.map((step) => (
              <article className="lp-step" key={step.number}>
                <div className="lp-step-index">
                  <b>{step.number}</b>
                  <span />
                  <span className="lp-pin-label">trustbridge flow</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <div className="lp-step-visual">{step.visual}</div>
              </article>
            ))}
            <div className="lp-step" aria-hidden>
              <div className="lp-step-index">
                <b>→</b>
                <span />
              </div>
              <h3>
                Then it&rsquo;s <em style={{ fontFamily: "var(--font-display)", color: "var(--lime)" }}>done.</em>
              </h3>
              <p>
                No chasing, no screenshots, no &ldquo;trust me bro.&rdquo; Just a
                receipt both sides can read.
              </p>
              <div style={{ marginTop: 34 }}>
                <Magnetic>
                  <Link className="lp-btn lp-btn-lime" href="/create">
                    Create a deal <i>↗</i>
                  </Link>
                </Magnetic>
              </div>
            </div>
          </motion.div>

          <div className="lp-pin-meter" style={{ position: "absolute", bottom: 56, left: 40 }}>
            {steps.map((step, index) => (
              <i key={step.number} className={index <= active ? "is-live" : ""} />
            ))}
          </div>
        </div>
      </div>

      <div className="lp-process-mobile">
        {steps.map((step) => (
          <Reveal key={step.number} className="lp-wrap" y={36}>
            <article className="lp-step" style={{ width: "100%", borderLeft: 0, padding: "0 0 44px" }}>
              <div className="lp-step-index">
                <b>{step.number}</b>
                <span />
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <div className="lp-step-visual">{step.visual}</div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- outcomes */

const outcomes = [
  {
    tone: "tone-green",
    title: "Verified",
    em: false,
    desc: "An independent record supports the claim. Money can move.",
    chips: ["Registry match", "Signed contract", "Platform record"],
  },
  {
    tone: "tone-lime",
    title: "Verified",
    em: true,
    suffix: "with conditions",
    desc: "The claim is true only if a stated condition holds — amount, date, scope.",
    chips: ["Conditional", "Time-bound", "Scope-limited"],
  },
  {
    tone: "tone-amber",
    title: "Undetermined",
    em: false,
    desc: "Not enough evidence either way. TrustBridge says so instead of guessing.",
    chips: ["Thin evidence", "Needs a human", "Hold funds"],
  },
  {
    tone: "tone-clay",
    title: "Contradicted",
    em: false,
    desc: "An independent record conflicts with the claim. The deal does not proceed.",
    chips: ["Mismatch", "Fake proof", "Escalated"],
  },
];

export function Outcomes() {
  const [active, setActive] = useState(1);

  return (
    <section className="lp-outcomes" id="outcomes">
      <div className="lp-wrap">
        <div className="lp-outcomes-top">
          <div>
            <Reveal>
              <SectionTag>Four honest outcomes</SectionTag>
            </Reveal>
            <h2 className="lp-h2" style={{ marginTop: 26 }}>
              <LinesReveal
                lines={[
                  <>No fake</>,
                  <>
                    <em>certainty.</em>
                  </>,
                ]}
              />
            </h2>
          </div>
          <Reveal delay={0.12} className="lp-outcomes-copy">
            <p style={{ margin: 0 }}>
              Most tools pretend every check is a pass. TrustBridge is built
              around the two answers nobody wants to give:{" "}
              <strong style={{ color: "var(--cream)" }}>undetermined</strong> and{" "}
              <strong style={{ color: "var(--cream)" }}>contradicted</strong>.
              That honesty is the product.
            </p>
          </Reveal>
        </div>

        <div className="lp-outcome-list">
          {outcomes.map((outcome, index) => (
            <Reveal key={`${outcome.title}-${index}`} delay={index * 0.06} y={18}>
              <div
                className={`lp-outcome${active === index ? " is-active" : ""}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(index);
                  }
                }}
              >
                <span className="lp-outcome-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="lp-outcome-title">
                    <span className={`lp-outcome-dot ${outcome.tone}`} />
                    {outcome.title}
                    {outcome.em ? (
                      <>
                        {" "}
                        <em>{outcome.suffix}</em>
                      </>
                    ) : null}
                  </h3>
                </div>
                <div className="lp-outcome-extra">
                  <p className="lp-outcome-desc">{outcome.desc}</p>
                  <motion.div
                    className="lp-outcome-chips"
                    animate={{ opacity: active === index ? 1 : 0.35 }}
                    transition={{ duration: 0.4 }}
                  >
                    {outcome.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </motion.div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- evidence */

const tiers = [
  {
    code: "E0",
    tag: "self-assertion",
    name: "Someone says so",
    body: "A message, a screenshot, a PDF they made. It is a claim, not proof.",
  },
  {
    code: "E1",
    tag: "copyable",
    name: "A screenshot",
    body: "Easy to fake, easy to crop. Weak on its own, useful as a lead.",
  },
  {
    code: "E2",
    tag: "platform record",
    name: "A platform trace",
    body: "A payment, delivery or account record from the system involved.",
  },
  {
    code: "E3",
    tag: "independent",
    name: "An independent record",
    body: "Registry, bank, or signed contract that neither side controls. It decides.",
  },
];

export function Evidence() {
  return (
    <section className="lp-evidence" id="evidence">
      <div className="lp-wrap">
        <div className="lp-evidence-head">
          <div>
            <Reveal>
              <p className="lp-kicker">Evidence ladder</p>
            </Reveal>
            <h2 className="lp-h2">
              <LinesReveal
                lines={[
                  <>Not all proof</>,
                  <>
                    is <em>equal.</em>
                  </>,
                ]}
              />
            </h2>
          </div>
          <Reveal delay={0.12}>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.65, margin: 0, maxWidth: 290 }}>
              Every claim is scored on where the evidence came from — not how
              confident it sounds.
            </p>
          </Reveal>
        </div>

        <div className="lp-ladder">
          {tiers.map((tier, index) => (
            <Reveal key={tier.code} delay={index * 0.07} y={26}>
              <Tilt max={5}>
                <article className="lp-tier" data-index={index}>
                  <div className="lp-tier-top">
                    <span className="lp-tier-code">{tier.code}</span>
                    <span className="lp-tier-tag">{tier.tag}</span>
                  </div>
                  <h3>{tier.name}</h3>
                  <p>{tier.body}</p>
                  <div className="lp-tier-scale">
                    <i />
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- preview */

export function Preview() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [4.5, -4.5]);
  const y = useTransform(scrollYProgress, [0, 1], [24, -24]);

  return (
    <section className="lp-preview">
      <div className="lp-wrap">
        <div className="lp-preview-stage" ref={ref}>
          <div className="lp-preview-copy">
            <SectionTag>What the other side sees</SectionTag>
            <h2>
              One link.
              <br />
              <em>Zero</em> awkward chasing.
            </h2>
            <p>
              A protected deal page both people can read. What is held, what
              unlocks release, and what happens if it goes wrong.
            </p>
            <ul className="lp-preview-list">
              <li>
                <i>✓</i> Deposit held until delivery
              </li>
              <li>
                <i>✓</i> Balance released on acceptance
              </li>
              <li>
                <i>✓</i> Human review when evidence conflicts
              </li>
            </ul>
          </div>

          <div className="lp-deal-wrap">
            <motion.div style={reduced ? undefined : { rotate, y }}>
              <Tilt max={8}>
                <article className="lp-deal">
                  <div className="lp-deal-top">
                    <span className="lp-deal-status">
                      <b /> Payment protected
                    </span>
                    <span className="lp-deal-id">#TB-4829</span>
                  </div>
                  <p className="lp-deal-label">Service agreement</p>
                  <h3>Brand identity &amp; launch kit</h3>
                  <p className="lp-deal-sub">
                    A complete visual identity system for the new product
                    launch.
                  </p>
                  <div className="lp-deal-rows">
                    <div className="lp-deal-row">
                      <span>Deliverables</span>
                      <b>3 · due 18 Mar</b>
                    </div>
                    <div className="lp-deal-row">
                      <span>Deposit · on delivery</span>
                      <b>₹360</b>
                    </div>
                    <div className="lp-deal-row">
                      <span>Balance · on acceptance</span>
                      <b>₹840</b>
                    </div>
                  </div>
                  <div className="lp-deal-total">
                    <span>Protected amount</span>
                    <strong>
                      ₹1,200<small>INR</small>
                    </strong>
                  </div>
                  <div className="lp-deal-foot">
                    <i>⌁</i> Held until you approve delivery
                  </div>
                </article>
              </Tilt>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- cta */

export function FinalCta() {
  return (
    <section className="lp-cta">
      <div className="lp-cta-rings" aria-hidden />
      <div className="lp-wrap lp-cta-inner">
        <SectionTag>Ready when you are</SectionTag>
        <h2>
          Make the next deal
          <br />
          the <em>safe</em> one.
        </h2>
        <p>
          Check a claim in under a minute. Protect the deal in one link. No
          signup required to verify.
        </p>
        <div className="lp-cta-actions">
          <Magnetic strength={0.4}>
            <Link className="lp-btn lp-btn-lime" href="/create">
              Create your first deal <i>↗</i>
            </Link>
          </Magnetic>
          <Link className="lp-cta-link" href="/check">
            Or verify a claim first →
          </Link>
        </div>
      </div>
    </section>
  );
}
