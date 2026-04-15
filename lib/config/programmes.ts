// Programme and phase definitions — SSOT for all labels and descriptions

export const PROGRAMME_ENUM_VALUES = [
  "edge_diagnostic",
  "riding_the_wave",
  "total_longevity",
] as const;

export const PHASE_ENUM_VALUES = [
  "intake",
  "assessment",
  "planning",
  "active",
  "review",
  "completed",
] as const;

export type ProgrammeKey = (typeof PROGRAMME_ENUM_VALUES)[number];
export type PhaseKey = (typeof PHASE_ENUM_VALUES)[number];

export const PROGRAMME_CONFIG: Record<
  ProgrammeKey,
  { label: string; description: string; duration: string }
> = {
  edge_diagnostic: {
    label: "Edge Diagnostic",
    description:
      "Comprehensive metabolic and neuropsychological profiling to map your ADHD phenotype. Includes full biomarker panel, Inflection Edge assessment, and a detailed clinical report.",
    duration: "4–6 weeks",
  },
  riding_the_wave: {
    label: "Riding the Wave",
    description:
      "Structured 12-week optimisation programme targeting the specific bottlenecks in your neurotype. Combines metabolic intervention, environment design, and regular check-ins with Manuel.",
    duration: "12 weeks",
  },
  total_longevity: {
    label: "Total Longevity",
    description:
      "Full systemic health and cognitive longevity programme. Deep metabolic work, cognitive enhancement stack, and long-term monitoring. For patients committed to sustained peak performance.",
    duration: "Ongoing",
  },
};

export const PHASE_CONFIG: Record<
  PhaseKey,
  { label: string; description: string }
> = {
  intake: {
    label: "Intake",
    description:
      "Manuel is reviewing your profile and assessment results. You will hear from him shortly to discuss next steps.",
  },
  assessment: {
    label: "Assessment",
    description:
      "Diagnostic phase underway. Complete your Inflection Edge assessment and check in daily so Manuel has the full picture.",
  },
  planning: {
    label: "Planning",
    description:
      "Manuel is designing your personalised protocol based on your profile. Expect your plan within the next few days.",
  },
  active: {
    label: "Active",
    description:
      "Your programme is underway. Follow your protocol, check in daily, and message Manuel if anything changes.",
  },
  review: {
    label: "Review",
    description:
      "Progress review in progress. Manuel is evaluating your outcomes against your baseline. A follow-up consultation will be scheduled.",
  },
  completed: {
    label: "Completed",
    description:
      "Programme completed. Your results are in your portal. Book a follow-up consultation to discuss ongoing support.",
  },
};
