"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

type LenisLike = {
  scrollTo: (target: number | string, opts?: Record<string, unknown>) => void;
  raf: (time: number) => void;
  stop: () => void;
  start: () => void;
  destroy: () => void;
};

const SmoothScrollContext = createContext<LenisLike | null>(null);

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<LenisLike | null>(null);
  const reduced = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;
    let instance: LenisLike | null = null;
    let frame = 0;
    let cancelled = false;

    void (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      const l = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
        anchors: true,
      });
      instance = l as unknown as LenisLike;
      setLenis(instance);
      const loop = (time: number) => {
        instance?.raf(time);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      instance?.destroy();
      setLenis(null);
    };
  }, [reduced]);

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return (
    <SmoothScrollContext.Provider value={lenis}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState(false);
  const enabled = useSyncExternalStore(
    () => () => {},
    () =>
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let frame = 0;

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      const target = event.target as HTMLElement | null;
      setHot(Boolean(target?.closest("a, button, [data-cursor='hot']")));
    };

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      }
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="xp-cursor" aria-hidden>
      <div ref={ring} className={`xp-cursor-ring${hot ? " is-hot" : ""}`} />
      <div ref={dot} className={`xp-cursor-dot${hot ? " is-hot" : ""}`} />
    </div>
  );
}

function Preloader() {
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const pathname = usePathname();
  const shouldPlay = useSyncExternalStore(
    () => () => {},
    () =>
      pathname === "/" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      sessionStorage.getItem("tb-intro") !== "done",
    () => false,
  );
  const visible = shouldPlay && !finished;

  useEffect(() => {
    if (!shouldPlay) return;

    const start = Date.now();
    const total = 1350;
    const interval = window.setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / total);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 100));
      if (t >= 1) window.clearInterval(interval);
    }, 40);
    const done = window.setTimeout(() => {
      sessionStorage.setItem("tb-intro", "done");
      setFinished(true);
    }, total + 380);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [shouldPlay]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          className="xp-intro"
          initial={{ opacity: 1 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="xp-intro-grid" aria-hidden />
          <div className="xp-intro-center">
            <motion.div
              className="xp-intro-mark"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>T</span>
            </motion.div>
            <div className="xp-intro-meta">
              <span>trustbridge</span>
              <span className="xp-intro-count">{String(count).padStart(3, "0")}</span>
            </div>
            <div className="xp-intro-track">
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: count / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Experience({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <Preloader />
      <Cursor />
      {children}
    </SmoothScroll>
  );
}
