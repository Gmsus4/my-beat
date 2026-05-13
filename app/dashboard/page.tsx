import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityTypeFilter } from "@/app/components/activity-type-filter";
import { DateRangeFilter } from "@/app/components/date-range-filter";
import { authOptions } from "@/lib/auth";
import {
  getActivityDateFilter,
  getActivityDateRangeLabel,
  normalizeActivityDateRange,
} from "@/lib/activity-date-filter";
import {
  parseGpxBestEfforts,
  type BestEffort,
} from "@/lib/gpx/parse-activity";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    type?: string | string[];
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const { range, type } = await searchParams;
  const activeRange = normalizeActivityDateRange(range);
  const fromDate = getActivityDateFilter(activeRange);
  const activeType = normalizeActivityTypeFilter(type);
  const [user, activityTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        username: true,
        activities: {
          where: {
            ...(fromDate ? { date: { gte: fromDate } } : {}),
            ...(activeType ? { type: activeType } : {}),
          },
          orderBy: { date: "desc" },
          select: {
            id: true,
            name: true,
            type: true,
            date: true,
            distance: true,
            duration: true,
            elevationGain: true,
            avgHeartRate: true,
            gpxData: true,
          },
        },
      },
    }),
    prisma.activity.findMany({
      where: {
        user: { email: session.user.email },
        ...(fromDate ? { date: { gte: fromDate } } : {}),
      },
      distinct: ["type"],
      orderBy: { type: "asc" },
      select: { type: true },
    }),
  ]);

  if (!user) {
    redirect("/onboarding");
  }

  const dashboardStats = getDashboardStats(user.activities);
  const bestEfforts = await getDashboardBestEfforts(user.activities);

  return (
    <main className="px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Hola, {session.user.name ?? "atleta"}
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Tu perfil publico sera /{user.username}. Actividades cargadas:{" "}
              {user.activities.length} en {getActivityDateRangeLabel(activeRange)}.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/upload"
              className="inline-flex h-12 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400"
            >
              Subir GPX
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-400">Fechas</p>
          <DateRangeFilter
            activeRange={activeRange}
            activityType={activeType}
            basePath="/dashboard"
          />
          <p className="mb-3 mt-5 text-sm font-semibold text-zinc-400">
            Tipo de actividad
          </p>
          <ActivityTypeFilter
            activeRange={activeRange}
            activeType={activeType}
            basePath="/dashboard"
            types={activityTypes.map((activity) => activity.type)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            label="Actividades"
            value={user.activities.length.toString()}
          />
          <DashboardStat
            label="Distancia"
            value={formatDistance(dashboardStats.totalDistance)}
          />
          <DashboardStat
            label="Tiempo"
            value={formatDuration(dashboardStats.totalDuration)}
          />
          <DashboardStat
            label="Elevacion"
            value={formatElevation(dashboardStats.totalElevation)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <InsightCard
            label="Equivalente"
            value={`${dashboardStats.marathonEquivalent.toFixed(1)} maratones`}
            detail="Usando 42.195 km como referencia."
          />
          <InsightCard
            label="Actividad mas larga"
            value={
              dashboardStats.longestActivity
                ? formatDistance(dashboardStats.longestActivity.distance)
                : "--"
            }
            detail={dashboardStats.longestActivity?.name ?? "Sin actividades."}
          />
          <InsightCard
            label="Ritmo promedio"
            value={formatPace(
              dashboardStats.totalDistance,
              dashboardStats.totalDuration,
            )}
            detail={`En ${getActivityDateRangeLabel(activeRange)?.toLowerCase()}.`}
          />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                Medallas
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Mejores marcas</h2>
            </div>
            <p className="text-sm text-zinc-500">
              Calculadas con tus actividades del rango seleccionado.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {bestEfforts.map((effort) => (
              <BestEffortCard
                key={effort.distance}
                label={formatRaceDistance(effort.distance)}
                value={
                  effort.duration
                    ? formatDuration(effort.duration)
                    : "Sin marca"
                }
                detail={
                  effort.duration
                    ? formatPace(effort.distance, effort.duration)
                    : "Sin actividad suficiente."
                }
              />
            ))}
          </div>
        </div>

        {user.activities.length > 0 ? (
          <div className="grid gap-4">
            {user.activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/dashboard/activity/${activity.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 transition hover:border-orange-500/70"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                      {activity.type}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      {activity.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <Metric
                      label="Distancia"
                      value={formatDistance(activity.distance)}
                    />
                    <Metric
                      label="Ritmo"
                      value={formatPace(activity.distance, activity.duration)}
                    />
                    <Metric
                      label="Tiempo"
                      value={formatDuration(activity.duration)}
                    />
                    <Metric
                      label="Elevacion"
                      value={formatElevation(activity.elevationGain)}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
            <h2 className="text-xl font-semibold">Aun no hay actividades.</h2>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Sube tu primer GPX para empezar a construir tu perfil publico.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InsightCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function BestEffortCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-black p-4">
      <p className="text-sm font-semibold text-orange-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPace(distance: number, duration: number) {
  if (distance <= 0 || duration <= 0) {
    return "--";
  }

  const secondsPerKilometer = duration / (distance / 1000);
  const minutes = Math.floor(secondsPerKilometer / 60);
  const seconds = Math.round(secondsPerKilometer % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds} /km`;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatElevation(elevation: number | null) {
  if (elevation === null) {
    return "--";
  }

  return `${Math.round(elevation)} m`;
}

function normalizeActivityTypeFilter(type: string | string[] | undefined) {
  const value = Array.isArray(type) ? type[0] : type;
  const normalized = value?.trim().toLowerCase();

  return normalized || null;
}

function formatRaceDistance(distance: number) {
  if (distance === 400) {
    return "400 m";
  }

  if (distance === 804.672) {
    return "1/2 milla";
  }

  if (distance === 1000) {
    return "1 km";
  }

  if (distance === 1609.344) {
    return "1 milla";
  }

  if (distance === 3218.688) {
    return "2 millas";
  }

  if (distance === 21097.5) {
    return "21K";
  }

  if (distance === 42195) {
    return "42K";
  }

  return `${Math.round(distance / 1000)}K`;
}

function getDashboardStats(
  activities: {
    name: string;
    distance: number;
    duration: number;
    elevationGain: number | null;
  }[],
) {
  const totalDistance = activities.reduce(
    (sum, activity) => sum + activity.distance,
    0,
  );
  const totalDuration = activities.reduce(
    (sum, activity) => sum + activity.duration,
    0,
  );
  const totalElevation = activities.reduce(
    (sum, activity) => sum + (activity.elevationGain ?? 0),
    0,
  );
  const longestActivity = activities.reduce<
    { name: string; distance: number } | null
  >((longest, activity) => {
    if (!longest || activity.distance > longest.distance) {
      return { name: activity.name, distance: activity.distance };
    }

    return longest;
  }, null);

  return {
    totalDistance,
    totalDuration,
    totalElevation,
    longestActivity,
    marathonEquivalent: totalDistance / 42195,
  };
}

async function getDashboardBestEfforts(
  activities: {
    gpxData: string | null;
  }[],
) {
  const targetDistances = [
    400,
    804.672,
    1000,
    1609.344,
    3218.688,
    5000,
    10000,
    15000,
    21097.5,
    42195,
  ];
  const bestEffortMap = new Map<number, BestEffort>();

  for (const activity of activities) {
    if (!activity.gpxData) {
      continue;
    }

    const efforts = await parseGpxBestEfforts(
      activity.gpxData,
      targetDistances,
    );

    for (const effort of efforts) {
      const current = bestEffortMap.get(effort.distance);

      if (!current || effort.duration < current.duration) {
        bestEffortMap.set(effort.distance, effort);
      }
    }
  }

  return targetDistances.map((distance) => ({
    distance,
    duration: bestEffortMap.get(distance)?.duration ?? null,
  }));
}
