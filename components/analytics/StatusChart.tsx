"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type StatusKey = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface StatusChartItem {
  status: StatusKey;
  label: string;
  count: number;
}

interface StatusChartProps {
  data: StatusChartItem[];
}

export function StatusChart({ data }: StatusChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(214 32% 91%)",
              fontSize: 11
            }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            fill="hsl(217.2 91.2% 59.8%)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

