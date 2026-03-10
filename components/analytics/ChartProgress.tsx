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

export interface ProgressData {
  label: string;
  completed: number;
  total: number;
}

interface ChartProgressProps {
  data: ProgressData[];
}

export function ChartProgress({ data }: ChartProgressProps) {
  const chartData = data.map((item) => {
    const remaining = Math.max(item.total - item.completed, 0);
    return {
      ...item,
      remaining
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
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
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(214 32% 91%)",
              fontSize: 11
            }}
            formatter={(_value, _name, props: any) => {
              const entry = props?.payload as ProgressData & { remaining: number };
              const total = entry.total;
              const completed = entry.completed;
              const percent =
                total > 0 ? Math.round((completed / total) * 100) : 0;
              return [`${completed} из ${total} (${percent}%)`, "Прогресс"];
            }}
          />
          <Bar
            dataKey="remaining"
            stackId="progress"
            radius={[4, 4, 0, 0]}
            fill="hsl(215.4 16.3% 46.9%)"
          />
          <Bar
            dataKey="completed"
            stackId="progress"
            radius={[4, 4, 0, 0]}
            fill="hsl(142.1 70.6% 45.3%)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

