"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/components/motion";

// TENTVAALE brand design system — logo-only intro (~4s), home route only, once
// per browser session. Beam -> trace the tent-and-chair mark in gold (a
// clip-path wipe over the PNG's alpha channel used as a CSS mask, since there's
// no vector/path version of the logo to animate a true stroke-draw on) ->
// metallic shine sweep -> hold -> fade into the page underneath.
const SESSION_KEY = "tentvaale:introSeen";
const LOGO_SRC = "/brand/logo/tentvaale-logo-mark.png";
const TOTAL_MS = 4000;
const TRACE_AT_MS = 550;
const TRACE_DURATION_MS = 1150;
const SHINE_AT_MS = 1850;
const HOLD_AT_MS = 2550;
const EXIT_AT_MS = 3450;

type Phase = "beam" | "trace" | "shine" | "hold" | "exit";

// Deterministic pseudo-random layout (no Math.random — keeps every render of
// a given index identical, which matters less here since this never renders
// on the server, but costs nothing to keep simple).
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 11) % 100}%`,
  size: 2 + ((i * 7) % 4),
  delay: (i % 5) * 0.4,
  warm: i % 3 === 0,
  drift: i % 2 === 0 ? "animate-float-a" : "animate-float-b",
}));

const maskStyle: React.CSSProperties = {
  WebkitMaskImage: `url(${LOGO_SRC})`,
  maskImage: `url(${LOGO_SRC})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
};

export function CinematicIntro() {
  const pathname = usePathname();
  // null until framer-motion resolves the media query client-side — doubles
  // as our SSR/mount guard, so there's no separate "mounted" state to track.
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("beam");
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    if (reduceMotion === null || pathname !== "/" || reduceMotion) return;
    let seen = true;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Storage blocked (private mode / locked-down browser) — just don't persist.
    }
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount-detection read (reduced-motion + sessionStorage), not an ongoing subscription; matches the pattern in theme-toggle.tsx
      setVisible(true);
    }
  }, [pathname, reduceMotion]);

  const finish = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisible(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Nothing to do — it'll just replay next load, which is an acceptable fallback.
    }
  }, []);

  React.useEffect(() => {
    if (!visible) return;
    // Autoplay can be (and often is) blocked by the browser; the intro must
    // still play silently rather than stall or throw.
    audioRef.current?.play().catch(() => {});

    const schedule = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    schedule(TRACE_AT_MS, () => setPhase("trace"));
    schedule(SHINE_AT_MS, () => setPhase("shine"));
    schedule(HOLD_AT_MS, () => setPhase("hold"));
    schedule(EXIT_AT_MS, () => setPhase("exit"));
    schedule(TOTAL_MS, finish);
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [visible, finish]);

  React.useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, finish]);

  if (!visible) return null;

  const traced = phase !== "beam";
  const shining = phase === "shine" || phase === "hold" || phase === "exit";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 55%, #241306 0%, #090604 42%, #020202 76%)" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: phase === "exit" ? (TOTAL_MS - EXIT_AT_MS) / 1000 : 0, ease: EASE.in }}
    >
      {/* No shipped sound effect yet — add one at this path (an original cue,
          not a copy of another platform's chime) to turn this on; silently
          a no-op file until then. */}
      <audio ref={audioRef} src="/brand/sound/intro-chime.mp3" preload="auto" onError={() => {}} />

      <div aria-hidden className="absolute inset-0">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className={`absolute rounded-full ${p.drift}`}
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              color: p.warm ? "#FF7A18" : "#FFB14A",
              background: "currentColor",
              boxShadow: "0 0 8px 2px currentColor",
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        aria-hidden
        className="absolute top-1/2 left-1/2 h-px w-[60vw] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "linear-gradient(90deg, transparent, #FFCF75, transparent)" }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: traced ? 0 : 1, opacity: traced ? 0 : 1 }}
        transition={{ duration: 0.5, ease: EASE.out }}
      />

      <div className="relative h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-48 lg:w-48">
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{ ...maskStyle, background: "linear-gradient(135deg, #FFCF75, #FFB14A 55%, #D87519)" }}
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: traced ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
          transition={{ duration: TRACE_DURATION_MS / 1000, ease: EASE.inOut }}
        />
        {shining && (
          <div
            aria-hidden
            className="absolute inset-0 animate-shimmer [animation-iteration-count:1]"
            style={{
              ...maskStyle,
              backgroundImage: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%)",
              backgroundSize: "250% 100%",
              mixBlendMode: "overlay",
            }}
          />
        )}
      </div>

      <button
        type="button"
        onClick={finish}
        className="absolute top-5 right-5 rounded-full border border-white/20 px-4 py-2 text-xs tracking-[0.2em] text-white/70 uppercase transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB14A] md:top-8 md:right-8"
      >
        Skip
      </button>
    </motion.div>
  );
}
