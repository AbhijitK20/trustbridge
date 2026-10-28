"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { useSmoothScroll } from "@/components/experience/providers";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Four outcomes", href: "#outcomes" },
  { label: "Evidence", href: "#evidence" },
  { label: "Verify a claim", href: "/check" },
  { label: "Referee chat", href: "/referee" },
];

export function LandingNav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useSmoothScroll();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
    return () => {
      lenis?.start();
    };
  }, [open, lenis]);

  return (
    <>
      <header className={`lp-nav${stuck ? " is-stuck" : ""}`}>
        <Link className="lp-brand" href="/" aria-label="TrustBridge home">
          <span className="lp-brand-mark">
            <span>T</span>
          </span>
          trustbridge
        </Link>

        <nav className="lp-nav-links" aria-label="Primary">
          {links.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ),
          )}
          <Link className="lp-nav-cta" href="/signin">
            Create a deal <i>↗</i>
          </Link>
        </nav>

        <button
          className="lp-burger"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          Menu
        </button>

        <motion.span
          className="lp-nav-progress"
          style={{ scaleX: progress }}
          aria-hidden
        />
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="lp-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="lp-menu-top">
              <span className="lp-brand">
                <span className="lp-brand-mark">
                  <span>T</span>
                </span>
                trustbridge
              </span>
              <button
                className="lp-burger"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>
            <nav className="lp-menu-links">
              {links.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ y: 26, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.16 + index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.46, duration: 0.6 }}
              >
                <Link className="lp-btn lp-btn-lime" href="/signin" onClick={() => setOpen(false)}>
                  Create a deal <i>↗</i>
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
