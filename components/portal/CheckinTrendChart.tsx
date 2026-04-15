"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  date: string;
  sleep: number;
  energy: number;
  mood: number;
  focus: number;
  stress: number;
};

type Props = {
  data: DataPoint[];
};

const METRIC_LINES = [
  { key: "sleep",  label: "Sleep",  color: "var(--purple, #6366f1)" },
  { key: "energy", label: "Energy", color: "var(--teal)" },
  { key: "mood",   label: "Mood",   color: "var(--gold)" },
  { key: "focus",  label: "Focus",  color: "var(--teal-dark)" },
  { key: "stress", label: "Stress", color: "var(--danger)" },
] as const;

export function CheckinTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-dm-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: "0.78rem",
            fontFamily: "var(--font-dm-sans)",
          }}
          labelStyle={{ color: "var(--muted)", marginBottom: "0.25rem" }}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: "0.72rem", fontFamily: "var(--font-dm-sans)" }}
        />
        {METRIC_LINES.map(({ key, label, color }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
