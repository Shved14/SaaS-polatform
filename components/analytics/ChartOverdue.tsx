"use client";

import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell
} from "recharts";

export interface OverdueSlice {
  status: string;
  count: number;
}

interface ChartOverdueProps {
  data: OverdueSlice[];
}

const COLORS = [
  "hsl(0 84.2% 60.2%)",
  "hsl(38 92% 50%)",
  "hsl(217.2 91.2% 59.8%)",
  "hsl(142.1 70.6% 45.3%)"
];

export function ChartOverdue({ data }: ChartOverdueProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.status}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} задач`, "Просрочено"]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(214 32% 91%)",
              fontSize: 11
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={32}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Всего просроченных задач: {total}
      </p>
    </div>
  );
}

