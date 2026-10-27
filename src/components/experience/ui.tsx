"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
} from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ElementType,
  type ReactNode,
} from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function Reveal({
  children,
  delay = 0,
  y = 30,
  blur = true,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  className?: string;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: blur ? "blur(10px)" : "none" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function LinesReveal({
  lines,
  className,
  delay = 0,
  stagger = 0.08,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <span ref={ref} className={`xp-lines ${className ?? ""}`}>
      {lines.map((line, index) => (
        <span className="xp-line" key={index}>
          <motion.span
            className="xp-line-inner"
            initial={reduced ? undefined : { y: "110%", rotate: 3 }}
            animate={
              reduced || inView
                ? { y: "0%", rotate: 0 }
                : { y: "110%", rotate: 3 }
            }
            transition={{
              duration: 1.05,
              delay: delay + index * stagger,
              ease: EASE,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Magnetic({
  children,
  strength = 0.32,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const reduced = useReducedMotion();

  if (reduced) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={`xp-magnetic ${className ?? ""}`}
      style={{ x: sx, y: sy }}
      onPointerMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * strength);
        y.set((event.clientY - rect.top - rect.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function Tilt({
  children,
  max = 7,
  className,
  style,
}: {
  children: ReactNode;
  max?: number;
  className?: string;
  style?: MotionStyle;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={className} style={style as React.CSSProperties}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onPointerMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        ry.set(px * max * 2);
        rx.set(-py * max * 2);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1600,
  className,
  decimals = 0,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView || reduced) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(to * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, duration, reduced]);

  const shown = reduced ? to : value;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0.5);
  const y = useTransform(progress, [0, 1], [distance, -distance]);
  const sy = useSpring(y, { stiffness: 120, damping: 24 });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (rect.top + rect.height / 2) / (vh + rect.height);
      progress.set(Math.min(1, Math.max(0, p)));
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [progress, reduced]);

  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} className={className} style={{ y: sy }}>
      {children}
    </motion.div>
  );
}

export function SectionTag({
  children,
  tone = "ink",
}: {
  children: ReactNode;
  tone?: "ink" | "light";
}) {
  return (
    <span className={`xp-tag xp-tag-${tone}`}>
      <span className="xp-tag-dot" />
      {children}
    </span>
  );
}

export function GlowText({
  children,
  as: Tag = "span",
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  return <Tag className={`xp-glow ${className ?? ""}`}>{children}</Tag>;
}
