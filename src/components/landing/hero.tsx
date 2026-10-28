"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { LinesReveal, Magnetic, SectionTag } from "@/components/experience/ui";

const VaultScene = dynamic(() => import("./vault-scene"), { ssr: false });

let webglSupport: boolean | null = null;

function supportsWebgl() {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    webglSupport = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

function FallbackSeal() {
  return (
    <svg
      className="lp-hero-fallback"
      viewBox="0 0 600 600"
      role="img"
      aria-label="Escrow seal illustration"
    >
      <defs>
        <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f26b" />
          <stop offset="0.45" stopColor="#8fae66" />
          <stop offset="0.7" stopColor="#f3efe6" />
          <stop offset="1" stopColor="#2e5347" />
        </linearGradient>
        <radialGradient id="core" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#eaffa8" />
          <stop offset="0.55" stopColor="#b9d94e" stopOpacity="0.75" />
          <stop offset="1" stopColor="#17493a" stopOpacity="0.15" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="300" r="184" fill="none" stroke="url(#chrome)" strokeWidth="44" />
      <circle cx="300" cy="300" r="226" fill="none" stroke="#d9f26b" strokeWidth="2" opacity="0.55" strokeDasharray="320 900" />
      <circle cx="300" cy="300" r="252" fill="none" stroke="#7fa35a" strokeWidth="1" opacity="0.4" strokeDasharray="120 900" />
      <circle cx="300" cy="300" r="122" fill="url(#core)" />
      <circle cx="300" cy="300" r="122" fill="none" stroke="#d9f26b" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const webgl = useSyncExternalStore<boolean | null>(
    () => () => {},
    () => supportsWebgl(),
    () => null,
  );
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const visualY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const visualScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.6 });

  return (
    <section className="lp-hero" id="top" ref={ref}>
      <div className="lp-hero-glow" aria-hidden />
      <div className="lp-hero-grid-lines" aria-hidden />

      <div className="lp-wrap lp-hero-grid">
        <motion.div
          className="lp-hero-copy"
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <SectionTag>Built for deals made in chat</SectionTag>
          </motion.div>

          <h1 className="lp-h1">
            <LinesReveal
              delay={0.22}
              lines={[
                <>Don&apos;t send</>,
                <>money into</>,
                <>
                  the <em className="lp-h1-em">void.</em>
                </>,
              ]}
            />
          </h1>

          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.62 }}
          >
            TrustBridge checks the claim before you pay, then holds the payment
            until the work is delivered. One link. Four honest outcomes. No
            fake certainty.
          </motion.p>

          <motion.div
            className="lp-hero-actions"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.74 }}
          >
            <Magnetic>
              <Link className="lp-btn lp-btn-lime" href="/check">
                Check a claim <i>↗</i>
              </Link>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Link className="lp-btn lp-btn-ghost" href="/signin">
                Protect a deal <i>→</i>
              </Link>
            </Magnetic>
          </motion.div>

          <motion.div
            className="lp-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.95 }}
          >
            <span className="lp-avatars">
              <i>R</i>
              <i>M</i>
              <i>A</i>
            </span>
            <span>
              For the people done
              <br />
              <strong>getting scammed.</strong>
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          className="lp-hero-visual"
          style={reduced ? undefined : { y: visualY, scale: visualScale }}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            px.set(((event.clientX - rect.left) / rect.width - 0.5) * 18);
            py.set(((event.clientY - rect.top) / rect.height - 0.5) * 14);
          }}
          onPointerLeave={() => {
            px.set(0);
            py.set(0);
          }}
        >
          <motion.div className="lp-orbit" aria-hidden style={reduced ? undefined : { x: sx, y: sy }}>
            {webgl === null ? null : webgl && !reduced ? (
              <VaultScene quality="high" />
            ) : (
              <FallbackSeal />
            )}
          </motion.div>

          <motion.div
            className="lp-chip lp-chip-proof"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.15 }}
          >
            <span className="lp-chip-icon">✓</span>
            <span>
              <b>Proof attached</b>
              <small>2 files · just now</small>
            </span>
          </motion.div>

          <motion.div
            className="lp-chip lp-chip-release"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <span className="lp-chip-icon">↗</span>
            <span>
              <b>Released on delivery</b>
              <small>Buyer confirmed</small>
            </span>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}
