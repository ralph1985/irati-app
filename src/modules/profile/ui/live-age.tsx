"use client";

import { useEffect, useState } from "react";
import { formatAge, BabyProfile } from "../domain/baby-profile";

type LiveAgeProps = {
  initialNow: string;
  profile: BabyProfile;
};

export function LiveAge({ initialNow, profile }: LiveAgeProps) {
  const [now, setNow] = useState(() => new Date(initialNow));

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return <>{formatAge(profile, now)}</>;
}
