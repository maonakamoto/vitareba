export const DIMENSIONS = [
  { id: "arousal", name: "Arousal & Activation", icon: "⚡" },
  { id: "divergent", name: "Divergent Output", icon: "💥" },
  { id: "hyperfocus", name: "Hyperfocus", icon: "🎯" },
  { id: "volatility", name: "Volatility & Cost", icon: "🌊" },
  { id: "environment", name: "Environment Design", icon: "🏗️" },
] as const;

export type DimensionId = (typeof DIMENSIONS)[number]["id"];

export interface Question {
  text: string;
  dimension: DimensionId;
  reversed: boolean;
}

export const QUESTIONS: Question[] = [
  {
    text: "I can reliably get myself into a productive state when I need to.",
    dimension: "arousal",
    reversed: false,
  },
  {
    text: "My energy levels are consistent throughout the day.",
    dimension: "arousal",
    reversed: false,
  },
  {
    text: "I need external pressure (deadlines, consequences) to start important tasks.",
    dimension: "arousal",
    reversed: true,
  },
  {
    text: "I know my peak performance windows and schedule my most important work in them.",
    dimension: "arousal",
    reversed: false,
  },
  {
    text: "I often feel mentally exhausted despite not having done much.",
    dimension: "arousal",
    reversed: true,
  },
  {
    text: "Caffeine or stimulants are essential for me to function normally.",
    dimension: "arousal",
    reversed: true,
  },
  {
    text: "I generate more ideas than most people around me.",
    dimension: "divergent",
    reversed: false,
  },
  {
    text: "My best ideas come at unexpected, inconvenient times.",
    dimension: "divergent",
    reversed: true,
  },
  {
    text: "I can effectively capture and develop my ideas into finished outputs.",
    dimension: "divergent",
    reversed: false,
  },
  {
    text: "People describe me as creative or unconventional in my thinking.",
    dimension: "divergent",
    reversed: false,
  },
  {
    text: "I often start new projects before finishing existing ones.",
    dimension: "divergent",
    reversed: true,
  },
  {
    text: "My creative output directly contributes to my professional success.",
    dimension: "divergent",
    reversed: false,
  },
  {
    text: "When I am deeply engaged, I lose track of time completely.",
    dimension: "hyperfocus",
    reversed: false,
  },
  {
    text: "I can deliberately enter a state of deep focus when I choose to.",
    dimension: "hyperfocus",
    reversed: false,
  },
  {
    text: "My hyperfocus episodes are productive rather than consuming.",
    dimension: "hyperfocus",
    reversed: false,
  },
  {
    text: "I struggle to shift attention from one task to another when needed.",
    dimension: "hyperfocus",
    reversed: true,
  },
  {
    text: "I have strategies to protect my deep work from interruption.",
    dimension: "hyperfocus",
    reversed: false,
  },
  {
    text: "My best work happens in intense bursts rather than steady effort.",
    dimension: "hyperfocus",
    reversed: true,
  },
  {
    text: "My mood can shift dramatically within a single day.",
    dimension: "volatility",
    reversed: true,
  },
  {
    text: "I make impulsive decisions I later regret.",
    dimension: "volatility",
    reversed: true,
  },
  {
    text: "I can manage my emotional reactions in professional settings.",
    dimension: "volatility",
    reversed: false,
  },
  {
    text: "Rejection or criticism affects me more intensely than it seems to affect others.",
    dimension: "volatility",
    reversed: true,
  },
  {
    text: "My performance variance frustrates the people around me.",
    dimension: "volatility",
    reversed: true,
  },
  {
    text: "I have reliable strategies for recovering from emotional lows.",
    dimension: "volatility",
    reversed: false,
  },
  {
    text: "My workspace is designed to support my focus and productivity.",
    dimension: "environment",
    reversed: false,
  },
  {
    text: "I have clear boundaries between work and personal time.",
    dimension: "environment",
    reversed: false,
  },
  {
    text: "The people around me understand how my brain works.",
    dimension: "environment",
    reversed: false,
  },
  {
    text: "I regularly feel overwhelmed by my physical environment.",
    dimension: "environment",
    reversed: true,
  },
  {
    text: "My daily routine supports my cognitive performance.",
    dimension: "environment",
    reversed: false,
  },
  {
    text: "I have deliberately designed my life around how my brain works best.",
    dimension: "environment",
    reversed: false,
  },
];

export interface Interpretation {
  maxScore: number;
  text: string;
}

export const INTERPRETATIONS: Record<DimensionId, Interpretation[]> = {
  arousal: [
    {
      maxScore: 45,
      text: "Your activation system is largely externally driven. You rely on urgency, novelty or crisis to get started. This is the most energy-expensive way to operate — and it's the pattern most responsive to biological intervention.",
    },
    {
      maxScore: 70,
      text: "You have partial control over your activation but it's inconsistent. Some days you can self-start; others you can't. The variability itself is the signal — it points to biological fluctuation that can be stabilised.",
    },
    {
      maxScore: 101,
      text: "Your arousal system is well-regulated. You can reliably get yourself into a productive state. The remaining work is optimising your peak windows and reducing the energy cost of activation.",
    },
  ],
  divergent: [
    {
      maxScore: 45,
      text: "Your creative output is either suppressed or not being captured effectively. ADHD brains generate enormous creative potential — if yours isn't visible, the environment is likely the bottleneck, not the brain.",
    },
    {
      maxScore: 70,
      text: "You generate substantial creative output but struggle to convert it into finished work. The gap between ideation and execution is your highest-leverage intervention point.",
    },
    {
      maxScore: 101,
      text: "Your divergent thinking is a well-deployed asset. The work now is building systems that protect and channel this capacity so it compounds rather than scatters.",
    },
  ],
  hyperfocus: [
    {
      maxScore: 45,
      text: "Hyperfocus is either rare or uncontrolled — happening to you rather than for you. Shifting to deliberately designed hyperfocus is the highest-leverage change available.",
    },
    {
      maxScore: 70,
      text: "You experience hyperfocus regularly but can't always direct it. The work is building triggers, protection and exit strategies so you can deploy this capacity strategically.",
    },
    {
      maxScore: 101,
      text: "Hyperfocus is a well-understood, regularly deployed asset. The refinement now is building better protection for these states once they are activated.",
    },
  ],
  volatility: [
    {
      maxScore: 45,
      text: "Your performance volatility is producing significant real-world costs in decisions, relationships and health. This requires biological and structural intervention — not discipline, but design.",
    },
    {
      maxScore: 70,
      text: "Your volatility is manageable but costly in ways others absorb more than you see. The work is raising your baseline floor through biological stabilisation and structural support.",
    },
    {
      maxScore: 101,
      text: "You have reasonable control over your performance variation. The remaining work is building a more consistent baseline so the people around you can rely on which version of you shows up.",
    },
  ],
  environment: [
    {
      maxScore: 45,
      text: "There is a large gap between the environment you currently work in and the one your brain needs. This is likely the single biggest drag on your performance — and the most fixable problem in your profile.",
    },
    {
      maxScore: 70,
      text: "You understand your environmental needs partially but haven't fully designed around them. Deliberate redesign of your workspace, schedule and team structure will compound every other intervention.",
    },
    {
      maxScore: 101,
      text: "You have built an environment that works with your neurotype. The task now is protecting it as the complexity of your life and business increases.",
    },
  ],
};

export interface VerdictTier {
  minScore: number;
  maxScore: number;
  name: string;
  color: string;
  text: string;
}

export const VERDICT_TIERS: VerdictTier[] = [
  {
    minScore: 0,
    maxScore: 35,
    name: "Deep Friction",
    color: "#e05a5a",
    text: "Your ADHD profile is producing significant friction across multiple dimensions. The biological and structural interventions are clear — and so is the magnitude of what becomes available when they're addressed.",
  },
  {
    minScore: 36,
    maxScore: 55,
    name: "Managed Tension",
    color: "#d4820a",
    text: "You have developed coping strategies, but the underlying tension between your neurotype and your environment is still producing real costs. The work is moving from coping to designing.",
  },
  {
    minScore: 56,
    maxScore: 75,
    name: "Asymmetric Performance",
    color: "#2a7a8a",
    text: "You have significant strengths and specific vulnerabilities. This is the profile most responsive to targeted intervention — because the foundation is already strong.",
  },
  {
    minScore: 76,
    maxScore: 100,
    name: "Optimised Neurotype",
    color: "#2a7a8a",
    text: "Your ADHD profile is largely working for you. The refinement available at this level is precision optimisation — fine-tuning the edges to extract the full potential of your neurotype.",
  },
];
