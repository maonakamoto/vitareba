"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Assessment from "@/components/Assessment";
import type { DimensionId } from "@/lib/assessment/data";
import { PORTAL_ROUTES } from "@/lib/config/routes";
import styles from "./assessment.module.css";

export default function AssessmentPage() {
  const router = useRouter();

  const handleComplete = useCallback(
    async (scores: Record<DimensionId, number>, overallScore: number) => {
      await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, overallScore }),
      });
      router.push(`${PORTAL_ROUTES.assessments}?saved=1`);
    },
    [router]
  );

  const handleClose = useCallback(() => {
    router.push(PORTAL_ROUTES.dashboard);
  }, [router]);

  return (
    <div className={styles.page}>
      <Assessment onClose={handleClose} onComplete={handleComplete} />
    </div>
  );
}
