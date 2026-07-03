import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion vocabulary. Keep it subtle: small offsets, short durations,
 * soft ease-out. Every animation in the app should draw from these presets so
 * timing and feel stay consistent.
 */

// Soft ease-out (easeOutQuint-ish) used for most enter transitions.
export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const durations = {
  fast: 0.18,
  base: 0.28,
  slow: 0.4,
} as const;

export const baseTransition: Transition = {
  duration: durations.base,
  ease: easeOut,
};

/** Full page / route transition: fade + gentle vertical slide. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: baseTransition },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: durations.fast, ease: easeOut },
  },
};

/** Lighter crossfade for switching within a section (e.g. chat rooms, tabs). */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: baseTransition },
  exit: { opacity: 0, transition: { duration: durations.fast, ease: easeOut } },
};

/** Fade + rise, for content mounting into place. */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: baseTransition },
};

/** Parent that staggers its direct motion children in sequence. */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: baseTransition },
};

/** Subtle press feedback for interactive elements. */
export const tapScale = { scale: 0.94 } as const;
export const hoverScale = { scale: 1.05 } as const;
