"use client";

import { useState } from "react";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import ImpactStats from "@/components/sections/ImpactStats";
import Pillars from "@/components/sections/Pillars";
import Approach from "@/components/sections/Approach";
import Pathway from "@/components/sections/Pathway";
import Diagnostics from "@/components/sections/Diagnostics";
import SylClock from "@/components/sections/SylClock";
import PsychedelicReadiness from "@/components/sections/PsychedelicReadiness";
import Addiction from "@/components/sections/Addiction";
import Programs from "@/components/sections/Programs";
import Team from "@/components/sections/Team";
import Cta from "@/components/sections/Cta";
import Footer from "@/components/sections/Footer";
import Assessment from "@/components/Assessment";

export default function Home() {
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  return (
    <>
      <Nav onAssessmentOpen={() => setAssessmentOpen(true)} />

      <main>
        <Hero onAssessmentOpen={() => setAssessmentOpen(true)} />

        <ImpactStats />

        <Pillars />

        <hr className="hr-rule" />

        <Approach />

        <hr className="hr-rule" />

        <Pathway />

        <hr className="hr-rule" />

        <Diagnostics />

        <hr className="hr-rule" />

        <SylClock />

        <PsychedelicReadiness />

        <hr className="hr-rule" />

        <Addiction />

        <hr className="hr-dark" />

        <Programs />

        <hr className="hr-rule" />

        <Team />

        <Cta onAssessmentOpen={() => setAssessmentOpen(true)} />
      </main>

      <Footer />

      {assessmentOpen && (
        <Assessment onClose={() => setAssessmentOpen(false)} />
      )}
    </>
  );
}
