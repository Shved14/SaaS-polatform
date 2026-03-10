"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

export interface ActivityPoint {
  date: string;
  actionsCount: number;
}

interface ChartActivityProps {
  data: ActivityPoint[];
}

export function ChartActivity({ data }: ChartActivityProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 10 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "hsl(217.2 91.2% 59.8%)", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(214 32% 91%)",
              fontSize: 11
            }}
          />
          <Legend
            verticalAlign="top"
            height={24}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="actionsCount"
            name="Активность"
            stroke="hsl(217.2 91.2% 59.8%)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

