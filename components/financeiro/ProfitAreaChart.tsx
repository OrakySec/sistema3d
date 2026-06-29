"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProfitAreaChartProps {
  data: { month: string; lucro: number; margem: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-lg text-xs">
      <p className="mb-2 font-semibold text-text-primary">{label}</p>
      <div className="flex items-center gap-2 py-0.5">
        <div className="h-2 w-2 rounded-full bg-success" />
        <span className="text-text-muted">Lucro:</span>
        <span className="font-semibold text-text-primary">
          {Number(payload[0]?.value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>
      <div className="flex items-center gap-2 py-0.5">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-text-muted">Margem:</span>
        <span className="font-semibold text-text-primary">{payload[1]?.value}%</span>
      </div>
    </div>
  );
}

export function ProfitAreaChart({ data }: ProfitAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
        <Area
          type="monotone"
          dataKey="lucro"
          stroke="#22C55E"
          strokeWidth={2.5}
          fill="url(#gradLucro)"
          dot={{ r: 3, fill: "#22C55E", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
