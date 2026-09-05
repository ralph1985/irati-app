"use client";

import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { calculateAge, formatAge, type BabyProfile } from "../domain/baby-profile";
import { formatAgeUnitValue, getAgeUnits, type AgeUnit } from "./live-age-model";
import styles from "./live-age.module.css";

type LiveAgeProps = {
  initialNow: string;
  profile: BabyProfile;
};

export function LiveAge({ initialNow, profile }: LiveAgeProps) {
  const [now, setNow] = useState(() => new Date(initialNow));
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const age = calculateAge(profile, now);
  const accessibleAge = formatAge(profile, now);
  const units = getAgeUnits(age);
  const primaryUnits = units.filter((unit) => unit.emphasis === "primary");
  const secondaryUnits = units.filter((unit) => unit.emphasis === "secondary");

  return (
    <span aria-label={accessibleAge} className={styles.counter} role="timer">
      <span aria-hidden="true" className={styles.unitRows}>
        <span className={styles.primaryUnits}>
          {primaryUnits.map((unit) => (
            <AgeUnit key={unit.key} reduceMotion={shouldReduceMotion} unit={unit} />
          ))}
        </span>
        <span className={styles.secondaryUnits}>
          {secondaryUnits.map((unit) => (
            <AgeUnit key={unit.key} reduceMotion={shouldReduceMotion} unit={unit} />
          ))}
        </span>
      </span>
    </span>
  );
}

function AgeUnit({ reduceMotion, unit }: { reduceMotion: boolean | null; unit: AgeUnit }) {
  const value = formatAgeUnitValue(unit);
  const pulseControls = useAnimationControls();
  const previousValue = useRef(unit.value);

  useEffect(() => {
    const changed = previousValue.current !== unit.value;
    previousValue.current = unit.value;

    if (!changed || reduceMotion !== false) {
      return;
    }

    void pulseControls.start({
      rotateZ: [0, -0.7, 0],
      scale: [1, 1.035, 1],
      transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
    });
  }, [pulseControls, reduceMotion, unit.value]);

  return (
    <motion.span animate={pulseControls} className={styles.unit} data-emphasis={unit.emphasis}>
      <AnimatedDigits reduceMotion={reduceMotion} value={value} />
      <span className={styles.label}>{unit.label}</span>
    </motion.span>
  );
}

function AnimatedDigits({ reduceMotion, value }: { reduceMotion: boolean | null; value: string }) {
  return (
    <span aria-hidden="true" className={styles.valueViewport}>
      {value.split("").map((digit, index) => (
        <span className={styles.digitViewport} key={index}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
              className={styles.digit}
              exit={reduceMotion ? undefined : { opacity: 0, rotateX: 18, scale: 1.08, y: "-100%" }}
              initial={reduceMotion ? false : { opacity: 0, rotateX: -18, scale: 0.88, y: "100%" }}
              key={digit}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { damping: 24, mass: 0.38, stiffness: 420, type: "spring" }
              }
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
