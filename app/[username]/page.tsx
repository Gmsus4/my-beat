import Link from "next/link";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MiniRouteCanvas } from "@/app/[username]/mini-route-canvas";
import { ActivityTypeFilter } from "@/app/components/activity-type-filter";
import { DateRangeFilter } from "@/app/components/date-range-filter";
import { FollowButton } from "@/app/components/follow-button";
import {
  getActivityDateFilter,
  getActivityDateRangeLabel,
  normalizeActivityDateRange,
} from "@/lib/activity-date-filter";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    range?: string | string[];
    type?: string | string[];
  }>;
};

type RoutePoint = {
  lat: number;
  lon: number;
};

const reservedRoutes = new Set(["api", "dashboard", "onboarding"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  if (reservedRoutes.has(username.toLowerCase())) {
    return {};
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      avatar: true,
      cover: true,
      _count: {
        select: {
          activities: { where: { isPublic: true } },
          followers: true,
        },
      },
    },
  });

  if (!user) {
    return {
      title: "Perfil no encontrado",
    };
  }

  const title = `${user.name} (@${user.username})`;
  const description =
    user.bio ||
    `${user._count.activities} actividades publicas en Mybeat. ${user._count.followers} seguidores.`;
  const images = getMetadataImages(user.cover, user.avatar);

  return {
    title,
    description,
    alternates: {
      canonical: `/${user.username}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${user.username}`,
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params;
  const { range, type } = await searchParams;
  const activeRange = normalizeActivityDateRange(range);
  const fromDate = getActivityDateFilter(activeRange);
  const activeType = normalizeActivityTypeFilter(type);
  const session = await getServerSession(authOptions);

  if (reservedRoutes.has(username.toLowerCase())) {
    notFound();
  }

  const [user, currentUser, activityTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        cover: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        activities: {
          where: {
            isPublic: true,
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
            calories: true,
            polyline: true,
            showMap: true,
            showHeartRate: true,
            showSpeed: true,
            showCalories: true,
          },
        },
      },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            following: {
              select: { followingId: true },
            },
          },
        })
      : null,
    prisma.activity.findMany({
      where: {
        isPublic: true,
        user: { username },
        ...(fromDate ? { date: { gte: fromDate } } : {}),
      },
      distinct: ["type"],
      orderBy: { type: "asc" },
      select: { type: true },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const isCurrentUser = currentUser?.id === user.id;
  const isFollowing =
    currentUser?.following.some((follow) => follow.followingId === user.id) ??
    false;
  const totalDistance = user.activities.reduce(
    (sum, activity) => sum + activity.distance,
    0,
  );
  const publicStats = getPublicProfileStats(user.activities);
  const medals = getPublicMedals(user.activities);
  const activities = user.activities;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-zinc-900">
        <div
          className="h-48 bg-zinc-950"
          style={
            user.cover
              ? {
                  backgroundImage: `url(${user.cover})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 pb-8">
          <div className="-mt-8 flex flex-col gap-5 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 !rounded-full text-2xl font-semibold text-orange-500 sm:h-24 sm:w-24 sm:text-3xl">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-2xl font-semibold tracking-normal sm:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-1 truncate text-sm text-zinc-400 sm:text-base">
                  @{user.username}
                </p>
              </div>
            </div>
            <FollowButton
              username={user.username}
              isCurrentUser={isCurrentUser}
              isFollowing={isFollowing}
            />
            {isCurrentUser ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/profile"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-semibold text-black transition hover:bg-orange-400"
                >
                  Editar perfil
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-orange-500 hover:text-orange-200"
                >
                  Editar actividades
                </Link>
              </div>
            ) : null}
          </div>

          {user.bio ? (
            <p className="max-w-2xl text-zinc-300">{user.bio}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <ProfileStat
              label="Actividades"
              value={user.activities.length.toString()}
            />
            <ProfileStat
              label="Distancia"
              value={formatDistance(totalDistance)}
            />
            <ProfileStat
              label="Desde"
              value={new Intl.DateTimeFormat("es-MX", {
                month: "short",
                year: "numeric",
              }).format(user.createdAt)}
            />
            <ProfileStat
              label="Seguidores"
              value={user._count.followers.toString()}
              href={isCurrentUser ? `/${user.username}/followers` : undefined}
            />
            <ProfileStat
              label="Siguiendo"
              value={user._count.following.toString()}
              href={isCurrentUser ? `/${user.username}/following` : undefined}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <InsightCard
            label="Equivalente"
            value={`${publicStats.marathonEquivalent.toFixed(1)} maratones`}
            detail="Usando 42.195 km como referencia."
          />
          <InsightCard
            label="Actividad mas larga"
            value={
              publicStats.longestActivity
                ? formatDistance(publicStats.longestActivity.distance)
                : "--"
            }
            detail={publicStats.longestActivity?.name ?? "Sin actividades."}
          />
          <InsightCard
            label="Tiempo total"
            value={formatDuration(publicStats.totalDuration)}
            detail={`En ${getActivityDateRangeLabel(activeRange)?.toLowerCase()}.`}
          />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <InsightCard
            label="Desnivel"
            value={formatElevation(publicStats.totalElevation)}
            detail="Elevacion positiva acumulada."
          />
          <InsightCard
            label="Ritmo promedio"
            value={formatPace(publicStats.totalDistance, publicStats.totalDuration)}
            detail="Calculado con actividades visibles."
          />
          <InsightCard
            label="Promedio por salida"
            value={formatDistance(publicStats.averageDistance)}
            detail="Distancia media por actividad publica."
          />
        </div>

        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                Medallas
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Mejores marcas</h2>
            </div>
            <p className="text-sm text-zinc-500">
              Calculadas desde actividades publicas con ritmo visible.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {medals.bestEfforts.map((effort) => (
              <MedalCard
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
                    : "Sube una actividad publica suficiente."
                }
              />
            ))}
          </div>
        </div>

        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
              Actividades
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Publicas - {getActivityDateRangeLabel(activeRange)}
            </h2>
          </div>
        </div>

        <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="mb-3 text-sm font-semibold text-zinc-400">Fechas</p>
          <DateRangeFilter
            activeRange={activeRange}
            activityType={activeType}
            basePath={`/${user.username}`}
          />
          <p className="mb-3 mt-5 text-sm font-semibold text-zinc-400">
            Tipo de actividad
          </p>
          <ActivityTypeFilter
            activeRange={activeRange}
            activeType={activeType}
            basePath={`/${user.username}`}
            types={activityTypes.map((activity) => activity.type)}
          />
        </div>

        {activities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activities.map((activity) => {
              const points = parsePolyline(activity.polyline);

              return (
                <Link
                  key={activity.id}
                  href={
                    isCurrentUser
                      ? `/dashboard/activity/${activity.id}`
                      : `/${user.username}/activity/${activity.id}`
                  }
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-orange-500/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                        {activity.type}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">
                        {activity.name}
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-500">
                      {isCurrentUser ? "Editar" : formatShortDate(activity.date)}
                    </p>
                  </div>

                  {activity.showMap ? (
                    <div className="mt-4">
                      <MiniRouteCanvas points={points} />
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <ActivityStat
                      label="Distancia"
                      value={formatDistance(activity.distance)}
                    />
                    {activity.showSpeed ? (
                      <ActivityStat
                        label="Ritmo"
                        value={formatPace(activity.distance, activity.duration)}
                      />
                    ) : null}
                    <ActivityStat
                      label="Tiempo"
                      value={formatDuration(activity.duration)}
                    />
                    <ActivityStat
                      label="Elevacion"
                      value={formatElevation(activity.elevationGain)}
                    />
                    {activity.showHeartRate ? (
                      <ActivityStat
                        label="FC"
                        value={formatHeartRate(activity.avgHeartRate)}
                      />
                    ) : null}
                    {activity.showCalories ? (
                      <ActivityStat
                        label="Calorias"
                        value={formatCalories(activity.calories)}
                      />
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
            <h3 className="text-xl font-semibold">Sin actividades publicas.</h3>
          </div>
        )}
      </section>
    </main>
  );
}

function getMetadataImages(...urls: (string | null)[]) {
  return urls
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url }));
}

function ProfileStat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-orange-500/70"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      {content}
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

function MedalCard({
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

function ActivityStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function parsePolyline(polyline: string | null): RoutePoint[] {
  if (!polyline) {
    return [];
  }

  try {
    const parsed = JSON.parse(polyline) as RoutePoint[];

    return Array.isArray(parsed)
      ? parsed.filter(
          (point) =>
            typeof point.lat === "number" && typeof point.lon === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
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
  return elevation === null ? "--" : `${Math.round(elevation)} m`;
}

function formatHeartRate(heartRate: number | null) {
  return heartRate === null ? "--" : `${heartRate} ppm`;
}

function formatCalories(calories: number | null) {
  return calories === null ? "--" : `${calories} kcal`;
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

function getPublicProfileStats(
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
    averageDistance:
      activities.length > 0 ? totalDistance / activities.length : 0,
  };
}

function getPublicMedals(
  activities: {
    distance: number;
    duration: number;
    elevationGain: number | null;
    showSpeed: boolean;
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
  const visibleSpeedActivities = activities.filter((activity) => activity.showSpeed);

  return {
    bestEfforts: targetDistances.map((distance) => {
      const best = visibleSpeedActivities.reduce<{
        distance: number;
        duration: number;
      } | null>((currentBest, activity) => {
        if (activity.distance < distance || activity.distance <= 0) {
          return currentBest;
        }

        const estimatedDuration = Math.round(
          activity.duration * (distance / activity.distance),
        );

        if (!currentBest || estimatedDuration < currentBest.duration) {
          return { distance, duration: estimatedDuration };
        }

        return currentBest;
      }, null);

      return {
        distance,
        duration: best?.duration ?? null,
      };
    }),
  };
}
