import {
  Easing,
  withSpring,
  withTiming,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

// ─── Duration constants ────────────────────────────────────────────────────

export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

// ─── Spring configs ────────────────────────────────────────────────────────

export const springConfig: WithSpringConfig = {
  damping: 20,
  stiffness: 200,
  mass: 1,
};

export const bouncySpring: WithSpringConfig = {
  damping: 12,
  stiffness: 300,
  mass: 0.8,
};

export const gentleSpring: WithSpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 1,
};

// ─── Timing configs ────────────────────────────────────────────────────────

export const fadeConfig: WithTimingConfig = {
  duration: DURATION.normal,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export const quickFade: WithTimingConfig = {
  duration: DURATION.fast,
  easing: Easing.ease,
};

// ─── Button press animations ───────────────────────────────────────────────

export const pressIn = (): number =>
  withSpring(0.94, { damping: 15, stiffness: 400 });

export const pressOut = (): number =>
  withSpring(1, { damping: 15, stiffness: 300 });

// ─── Common transitions ────────────────────────────────────────────────────

export const fadeIn = (duration = DURATION.normal): number =>
  withTiming(1, { duration, easing: Easing.out(Easing.cubic) });

export const fadeOut = (duration = DURATION.normal): number =>
  withTiming(0, { duration, easing: Easing.in(Easing.cubic) });

export const scaleIn = (): number =>
  withSpring(1, { damping: 18, stiffness: 200 });

export const scaleOut = (): number =>
  withSpring(0, { damping: 18, stiffness: 200 });

export const slideUpIn = (duration = DURATION.normal): number =>
  withTiming(0, { duration, easing: Easing.out(Easing.cubic) });

// ─── Glow pulse (for animated glow effects) ────────────────────────────────

export const glowPulse = (): number =>
  withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) });
