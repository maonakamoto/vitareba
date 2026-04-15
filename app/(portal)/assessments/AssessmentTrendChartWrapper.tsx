"use client";

import { AssessmentTrendChart } from "@/components/portal/AssessmentTrendChart";

type Props = {
  data: Array<{ date: string; score: number }>;
};

export function AssessmentTrendChartWrapper({ data }: Props) {
  return <AssessmentTrendChart data={data} />;
}
