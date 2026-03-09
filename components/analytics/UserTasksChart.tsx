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

export interface UserTasksItem {
  user: string;
  count: number;
}

interface UserTasksChartProps {
  data: UserTasksItem[];
}

export function UserTasksChart({ data }: UserTasksChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis
            dataKey="user"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10 }}
            interval={0}
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
            fill="hsl(142.1 70.6% 45.3%)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

