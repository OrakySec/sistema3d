"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: {
    month: string;
    receita: number;
    despesas: number;
    lucro: number;
  }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-lg text-xs">
      <p className="mb-2 font-semibold text-text-primary">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text-muted capitalize">{p.name}:</span>
          <span className="font-semibold text-text-primary">
            {Number(p.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          formatter={(value) => <span style={{ color: "var(--color-text-secondary)" }}>{value}</span>}
        />
        <Bar dataKey="receita"  name="Receita"   fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="despesas" name="Despesas"  fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Line
          dataKey="lucro"
          name="Lucro"
          type="monotone"
          stroke="#22C55E"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
