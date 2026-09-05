"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { calculateAge, formatAge, type BabyProfile } from "../domain/baby-profile";
import { getAgeUnits } from "./live-age-model";
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

function AgeUnit({
  reduceMotion,
  unit,
}: {
  reduceMotion: boolean | null;
  unit: ReturnType<typeof getAgeUnits>[number];
}) {
  return (
    <span className={styles.unit} data-emphasis={unit.emphasis}>
      <span className={styles.valueViewport}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: "-70%" }}
            initial={reduceMotion ? false : { opacity: 0, y: "70%" }}
            key={unit.value}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {unit.value}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className={styles.label}>{unit.label}</span>
    </span>
  );
}
