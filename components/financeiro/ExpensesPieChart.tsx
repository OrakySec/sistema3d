"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ExpensesPieChartProps {
  data: { name: string; value: number; color: string }[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-lg text-xs">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.payload.color }} />
        <span className="font-semibold text-text-primary">{d.name}</span>
      </div>
      <p className="text-text-muted">
        {d.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        <span className="ml-1 text-text-muted">({d.payload.percent}%)</span>
      </p>
    </div>
  );
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ExpensesPieChart({ data }: ExpensesPieChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const withPercent = data.map((d) => ({ ...d, percent: Math.round((d.value / total) * 100) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={withPercent}
          cx="50%"
          cy="45%"
          outerRadius={90}
          innerRadius={50}
          dataKey="value"
          labelLine={false}
          label={CustomLabel}
        >
          {withPercent.map((entry, i) => (
            <Cell key={i} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "var(--color-text-secondary)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
