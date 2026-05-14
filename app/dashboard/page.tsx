import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProfileStatsPanel } from "@/app/[username]/profile-stats-panel";
import { ActivityTypeFilter } from "@/app/components/activity-type-filter";
import { DateRangeFilter } from "@/app/components/date-range-filter";
import { authOptions } from "@/lib/auth";
import {
  bestEffortTargetDistances,
  type BestEffort,
} from "@/lib/gpx/parse-activity";
import { readStoredBestEfforts } from "@/lib/gpx/stored-activity-data";
import {
  getActivityDateFilter,
  getActivityDateRangeLabel,
  normalizeActivityDateRange,
} from "@/lib/activity-date-filter";
import { prisma } from "@/lib/prisma";

type DashboardPageProps = {
  searchParams: Promise<{
    range?: string | string[];
    type?: string | string[];
    page?: string | string[];
  }>;
};

const activityPageSize = 30;

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const { range, type, page } = await searchParams;
  const activeRange = normalizeActivityDateRange(range);
  const fromDate = getActivityDateFilter(activeRange);
  const activeType = normalizeActivityTypeFilter(type);
  const activePage = normalizePage(page);
  const activityWhere = {
    user: { email: session.user.email },
    ...(fromDate ? { date: { gte: fromDate } } : {}),
    ...(activeType ? { type: activeType } : {}),
  };
  const [user, activityTypes, lifetimeStats, activityCount, periodStats, medalActivities, activities] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        username: true,
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
    getLifetimeDashboardStats(session.user.email),
    prisma.activity.count({ where: activityWhere }),
    prisma.activity.aggregate({
      where: activityWhere,
      _sum: {
        distance: true,
        duration: true,
        elevationGain: true,
      },
    }),
    prisma.activity.findMany({
      where: activityWhere,
      select: {
        distance: true,
        duration: true,
        bestEffortsData: true,
      },
    }),
    prisma.activity.findMany({
      where: activityWhere,
      orderBy: { date: "desc" },
      skip: (activePage - 1) * activityPageSize,
      take: activityPageSize,
      select: {
        id: true,
        name: true,
        type: true,
        date: true,
        distance: true,
        duration: true,
        elevationGain: true,
        avgHeartRate: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/onboarding");
  }

  const dashboardStats = getDashboardStatsFromAggregate(periodStats);
  const bestEfforts = getDashboardBestEfforts(medalActivities);
  const totalPages = Math.max(1, Math.ceil(activityCount / activityPageSize));

  return (
    <main className="px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
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
              {activityCount} en {getActivityDateRangeLabel(activeRange)}.
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
          <div className="order-2 min-w-0 lg:order-1">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                  Actividades
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Privadas - {getActivityDateRangeLabel(activeRange)}
                </h2>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/95 p-3 lg:sticky lg:top-6 lg:z-20">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Fechas
                </p>
                <DateRangeFilter
                  activeRange={activeRange}
                  activityType={activeType}
                  basePath="/dashboard"
                />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Tipo
                </p>
                <ActivityTypeFilter
                  activeRange={activeRange}
                  activeType={activeType}
                  basePath="/dashboard"
                  types={activityTypes.map((activity) => activity.type)}
                />
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="grid gap-4">
                {activities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/dashboard/activity/${activity.id}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 transition hover:border-orange-500/70"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="min-w-0">
                          <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-500">
                            {activity.type}
                          </p>
                          <h2 className="mt-1 truncate text-lg font-semibold">
                            {activity.name}
                          </h2>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {formatDate(activity.date)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
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
                <PaginationControls
                  activePage={activePage}
                  totalPages={totalPages}
                  basePath="/dashboard"
                  range={activeRange}
                  type={activeType}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
                <h2 className="text-xl font-semibold">Aun no hay actividades.</h2>
                <p className="mt-2 max-w-2xl text-zinc-400">
                  Sube tu primer GPX para empezar a construir tu perfil publico.
                </p>
              </div>
            )}
          </div>

          <aside className="order-1 lg:sticky lg:top-6 lg:order-2">
            <ProfileStatsPanel>
              <StatsTableSection title="Mejores tiempos">
                {bestEfforts.map((effort) => (
                  <MedalTableRow
                    key={effort.distance}
                    label={formatRaceDistance(effort.distance)}
                    duration={effort.duration}
                  />
                ))}
              </StatsTableSection>

              <StatsTableSection
                title={getActivityDateRangeLabel(activeRange) ?? "Periodo"}
              >
                <StatsTableRow
                  label="Actividades"
                  value={activityCount.toString()}
                />
                <StatsTableRow
                  label="Distancia"
                  value={formatDistance(dashboardStats.totalDistance)}
                />
                <StatsTableRow
                  label="Duracion"
                  value={formatCompactDuration(dashboardStats.totalDuration)}
                />
                <StatsTableRow
                  label="Desnivel positivo"
                  value={formatElevation(dashboardStats.totalElevation)}
                />
              </StatsTableSection>

              <StatsTableSection title="Totales">
                <StatsTableRow
                  label="Actividades"
                  value={lifetimeStats.activityCount.toString()}
                />
                <StatsTableRow
                  label="Distancia"
                  value={formatDistance(lifetimeStats.totalDistance)}
                />
                <StatsTableRow
                  label="Duracion"
                  value={formatCompactDuration(lifetimeStats.totalDuration)}
                />
                <StatsTableRow
                  label="Desnivel positivo"
                  value={formatElevation(lifetimeStats.totalElevation)}
                />
              </StatsTableSection>
            </ProfileStatsPanel>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatsTableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-zinc-800 pb-2 last:border-b-0 last:pb-0 [&+&]:pt-2">
      <div className="bg-black px-3 py-2.5 text-sm font-semibold text-white">
        {title}
      </div>
      <div className="divide-y divide-zinc-800">{children}</div>
    </div>
  );
}

function StatsTableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-xs odd:bg-zinc-900/45 even:bg-black/30">
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function MedalTableRow({
  label,
  duration,
}: {
  label: string;
  duration: number | null;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-xs odd:bg-black/30 even:bg-zinc-900/45">
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="font-semibold text-orange-400">
        {duration ? formatDuration(duration) : "--"}
      </span>
    </div>
  );
}

function PaginationControls({
  activePage,
  totalPages,
  basePath,
  range,
  type,
}: {
  activePage: number;
  totalPages: number;
  basePath: string;
  range: string;
  type: string | null;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm">
      <PaginationLink
        href={buildPageHref(basePath, activePage - 1, range, type)}
        disabled={activePage <= 1}
      >
        Anterior
      </PaginationLink>
      <span className="text-zinc-500">
        Pagina {activePage} de {totalPages}
      </span>
      <PaginationLink
        href={buildPageHref(basePath, activePage + 1, range, type)}
        disabled={activePage >= totalPages}
      >
        Siguiente
      </PaginationLink>
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 px-3 font-semibold text-zinc-700">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 px-3 font-semibold text-zinc-200 transition hover:border-orange-500 hover:text-orange-200"
    >
      {children}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
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

function formatCompactDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
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

function normalizePage(page: string | string[] | undefined) {
  const value = Number(Array.isArray(page) ? page[0] : page);

  return Number.isInteger(value) && value > 0 ? value : 1;
}

function buildPageHref(
  basePath: string,
  page: number,
  range: string,
  type: string | null,
) {
  const searchParams = new URLSearchParams();

  if (range) {
    searchParams.set("range", range);
  }

  if (type) {
    searchParams.set("type", type);
  }

  if (page > 1) {
    searchParams.set("page", page.toString());
  }

  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
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

function getDashboardStatsFromAggregate(stats: {
  _sum: {
    distance: number | null;
    duration: number | null;
    elevationGain: number | null;
  };
}) {
  const totalDistance = stats._sum.distance ?? 0;
  const totalDuration = stats._sum.duration ?? 0;
  const totalElevation = stats._sum.elevationGain ?? 0;

  return {
    totalDistance,
    totalDuration,
    totalElevation,
    marathonEquivalent: totalDistance / 42195,
  };
}

function getDashboardBestEfforts(
  activities: {
    distance: number;
    duration: number;
    bestEffortsData?: unknown;
  }[],
) {
  return bestEffortTargetDistances.map((distance) => {
    const best = activities.reduce<BestEffort | null>((currentBest, activity) => {
      const storedBestEffort = readStoredBestEfforts(
        activity.bestEffortsData,
      ).find((effort) => effort.distance === distance);
      const candidate =
        storedBestEffort ?? getEstimatedBestEffort(activity, distance);

      if (!candidate) {
        return currentBest;
      }

      if (!currentBest || candidate.duration < currentBest.duration) {
        return candidate;
      }

      return currentBest;
    }, null);

    return {
      distance,
      duration: best?.duration ?? null,
    };
  });
}

function getEstimatedBestEffort(
  activity: {
    distance: number;
    duration: number;
  },
  distance: number,
) {
  if (activity.distance < distance || activity.distance <= 0) {
    return null;
  }

  const estimatedDuration = Math.round(
    activity.duration * (distance / activity.distance),
  );

  return { distance, duration: estimatedDuration };
}

async function getLifetimeDashboardStats(email: string) {
  const result = await prisma.activity.aggregate({
    where: {
      user: { email },
    },
    _count: {
      _all: true,
    },
    _sum: {
      distance: true,
      duration: true,
      elevationGain: true,
    },
  });

  return {
    activityCount: result._count._all,
    totalDistance: result._sum.distance ?? 0,
    totalDuration: result._sum.duration ?? 0,
    totalElevation: result._sum.elevationGain ?? 0,
  };
}
