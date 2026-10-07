import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/analytics";
import { TEXT_TYPES } from "@/lib/pipeline/types";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 6px 20px -8px oklch(0 0 0 / 0.2)",
};
const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

export function VolumeChart({ data, stacked = false, height = 280 }: { data: Record<string, number | string>[]; stacked?: boolean; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {stacked ? (
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
          {TEXT_TYPES.map((t, i) => (
            <Bar key={t} dataKey={t} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Articles"]} />
          <Area type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} fill="url(#vol)" />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}

export function TypeDonut({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0" style={{ width: height * 0.8, height }}>
        <ResponsiveContainer>
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={1.5} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular-nums font-medium">{d.value}</span>
            <span className="tabular-nums text-xs text-muted-foreground w-10 text-right">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBarChart({ data, height, color = "var(--chart-2)", onClick }: { data: { name: string; value: number; id?: string }[]; height?: number; color?: string; onClick?: (d: { name: string; id?: string }) => void }) {
  return (
    <ResponsiveContainer width="100%" height={height ?? Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ ...axis, fill: "var(--foreground)" }} tickLine={false} axisLine={false} width={170} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} formatter={(v) => [v, "Articles"]} />
        <Bar
          dataKey="value"
          fill={color}
          radius={[0, 4, 4, 0]}
          barSize={16}
          cursor={onClick ? "pointer" : undefined}
          onClick={(d) => onClick?.(d as unknown as { name: string; id?: string })}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TypeBySourceChart({ data, height = 300 }: { data: Record<string, number | string>[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} interval={0} angle={-18} textAnchor="end" height={56} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
        {TEXT_TYPES.map((t, i) => (
          <Bar key={t} dataKey={t} stackId="s" fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data, color = "var(--chart-1)" }: { data: { v: number }[]; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.12} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
