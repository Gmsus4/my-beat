"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityChartPoint } from "@/lib/gpx/parse-activity";

type ActivityChartsProps = {
  points: ActivityChartPoint[];
  showHeartRate: boolean;
  showSpeed: boolean;
};

const chartMargin = { top: 12, right: 12, bottom: 0, left: 0 };

export function ActivityCharts({
  points,
  showHeartRate,
  showSpeed,
}: ActivityChartsProps) {
  const hasElevation = points.some((point) => point.elevation !== null);
  const hasHeartRate =
    showHeartRate && points.some((point) => point.heartRate !== null);
  const hasPace = showSpeed && points.some((point) => point.pace !== null);

  if (!hasElevation && !hasHeartRate && !hasPace) {
    return null;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 bg-black px-4 py-4">
        <h2 className="text-lg font-semibold">Graficas</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Lecturas extraidas del GPX a lo largo de la ruta.
        </p>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-2">
        {hasElevation ? (
          <ChartCard title="Altitud" value="m">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={points} margin={chartMargin}>
                <defs>
                  <linearGradient id="elevationFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="distance"
                  stroke="#71717a"
                  tickFormatter={formatDistanceTick}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  tickFormatter={(value) => `${value} m`}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={formatDistanceLabel}
                  formatter={(value) => [formatElevationValue(value), "Altitud"]}
                />
                <Area
                  connectNulls
                  dataKey="elevation"
                  fill="url(#elevationFill)"
                  stroke="#f97316"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : null}

        {hasHeartRate ? (
          <ChartCard title="Frecuencia cardiaca" value="ppm">
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={points} margin={chartMargin}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="distance"
                  stroke="#71717a"
                  tickFormatter={formatDistanceTick}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  tickFormatter={(value) => `${value}`}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={formatDistanceLabel}
                  formatter={(value) => [
                    formatHeartRateValue(value),
                    "Frecuencia cardiaca",
                  ]}
                />
                <Line
                  connectNulls
                  dataKey="heartRate"
                  dot={false}
                  stroke="#fb7185"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : null}

        {hasPace ? (
          <ChartCard title="Ritmo" value="/km">
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={points} margin={chartMargin}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="distance"
                  stroke="#71717a"
                  tickFormatter={formatDistanceTick}
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  tickFormatter={formatPaceValue}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={formatDistanceLabel}
                  formatter={(value) => [formatPaceValue(value), "Ritmo"]}
                />
                <Line
                  connectNulls
                  dataKey="pace"
                  dot={false}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : null}
      </div>
    </section>
  );
}

function ChartCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-black p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs font-medium text-zinc-500">{value}</span>
      </div>
      {children}
    </div>
  );
}

function formatDistanceTick(value: number | string) {
  return `${Number(value).toFixed(1)}k`;
}

function formatDistanceLabel(value: ReactNode) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? `Km ${numericValue.toFixed(2)}` : "";
}

function formatElevationValue(value: unknown) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? `${Math.round(numericValue)} m` : "--";
}

function formatHeartRateValue(value: unknown) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? `${Math.round(numericValue)} ppm` : "--";
}

function formatPaceValue(value: unknown) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "--";
  }

  const minutes = Math.floor(numericValue / 60);
  const seconds = Math.round(numericValue % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

const tooltipStyle = {
  background: "#09090b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  color: "#fafafa",
};
