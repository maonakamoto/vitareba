"use client";

// Guest-mode assessment overlay — shown when URL contains ?assessment=open.
// No auth required. After completion, ResultsScreen offers a /register CTA
// that preserves scores in sessionStorage so they're auto-saved post-login.

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Assessment from "@/components/Assessment";

function AssessmentOverlayInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(searchParams.get("assessment") === "open");
  }, [searchParams]);

  if (!show) return null;

  function handleClose() {
    setShow(false);
    // Remove the query param, keep the locale path intact
    router.replace(pathname, { scroll: false });
  }

  return <Assessment onClose={handleClose} />;
}

export function AssessmentOverlay() {
  return (
    <Suspense fallback={null}>
      <AssessmentOverlayInner />
    </Suspense>
  );
}
