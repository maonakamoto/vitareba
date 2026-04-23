"use client";

// Checks sessionStorage for assessment scores saved during the guest overlay flow.
// If found, POSTs them to /api/assessment and refreshes the page so the dashboard
// immediately shows the user's results without asking them to retake the assessment.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PORTAL_ROUTES } from "@/lib/config/routes";

export function PendingAssessmentSaver() {
  const router = useRouter();

  useEffect(() => {
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem("pendingAssessment");
    } catch {
      return;
    }
    if (!pending) return;

    try {
      const { scores, overallScore } = JSON.parse(pending) as {
        scores: Record<string, number>;
        overallScore: number;
      };

      fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, overallScore }),
      })
        .then((res) => {
          try { sessionStorage.removeItem("pendingAssessment"); } catch {}
          if (res.ok) {
            // Navigate to assessments page so user sees their saved results
            router.push(`${PORTAL_ROUTES.assessments}?saved=1`);
          }
        })
        .catch(() => {
          try { sessionStorage.removeItem("pendingAssessment"); } catch {}
        });
    } catch {
      try { sessionStorage.removeItem("pendingAssessment"); } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
