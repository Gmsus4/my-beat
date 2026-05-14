import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityCharts } from "@/app/components/activity-charts";
import { ActivityShareImageButton } from "@/app/components/activity-share-image-button";
import { RouteCanvas } from "@/app/dashboard/activity/[id]/route-canvas";
import {
  readStoredChartPoints,
  readStoredSplits,
} from "@/lib/gpx/stored-activity-data";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    username: string;
    id: string;
  }>;
};

type RoutePoint = {
  lat: number;
  lon: number;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, id } = await params;
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      isPublic: true,
      user: { username },
    },
    select: {
      name: true,
      type: true,
      date: true,
      distance: true,
      duration: true,
      elevationGain: true,
      showSpeed: true,
      user: {
        select: {
          username: true,
          name: true,
          avatar: true,
          cover: true,
        },
      },
    },
  });

  if (!activity) {
    return {
      title: "Actividad no encontrada",
    };
  }

  const title = `${activity.name} de ${activity.user.name}`;
  const description = [
    formatActivityType(activity.type),
    formatDistance(activity.distance),
    activity.showSpeed
      ? `${formatPace(activity.distance, activity.duration)}`
      : null,
    formatDuration(activity.duration),
    activity.elevationGain !== null
      ? `${Math.round(activity.elevationGain)} m+`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");
  const url = `/${activity.user.username}/activity/${id}`;
  const absoluteUrl = getAbsoluteUrl(url);
  const imageUrl = getAbsoluteUrl(`/api/activities/${id}/opengraph-image`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl,
      publishedTime: activity.date.toISOString(),
      authors: [activity.user.name],
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicActivityPage({ params }: PageProps) {
  const { username, id } = await params;
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      isPublic: true,
      user: { username },
    },
    select: {
      name: true,
      description: true,
      type: true,
      date: true,
      distance: true,
      duration: true,
      elevationGain: true,
      avgSpeed: true,
      maxSpeed: true,
      avgHeartRate: true,
      maxHeartRate: true,
      calories: true,
      polyline: true,
      splitsData: true,
      chartData: true,
      showMap: true,
      showHeartRate: true,
      showSpeed: true,
      showCalories: true,
      user: {
        select: {
          username: true,
          name: true,
        },
      },
    },
  });

  if (!activity) {
    notFound();
  }

  const points = parsePolyline(activity.polyline);
  const splits = activity.showSpeed ? readStoredSplits(activity.splitsData) : [];
  const chartPoints = readStoredChartPoints(activity.chartData);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div>
          <Link
            href={`/${activity.user.username}`}
            className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
          >
            Volver a @{activity.user.username}
          </Link>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
              {activity.type}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">
              {activity.name}
            </h1>
            <p className="mt-2 text-zinc-400">
              {activity.user.name} · {formatDate(activity.date)}
            </p>
            {activity.description ? (
              <p className="mt-4 max-w-2xl text-zinc-300">
                {activity.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
          <div className="min-w-0">
            {activity.showMap ? <RouteCanvas points={points} /> : null}

            <ActivityCharts
              points={chartPoints}
              showHeartRate={activity.showHeartRate}
              showSpeed={activity.showSpeed}
            />

            {activity.showSpeed ? (
              <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="border-b border-zinc-800 bg-black px-4 py-4">
                  <h2 className="text-lg font-semibold">
                    Ritmos por kilometro
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Calculados con tiempo en movimiento para acercarse a
                    plataformas como Strava.
                  </p>
                </div>
                {splits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="border-b border-zinc-800 text-zinc-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Split</th>
                          <th className="px-4 py-3 font-medium">Distancia</th>
                          <th className="px-4 py-3 font-medium">Ritmo</th>
                          <th className="px-4 py-3 font-medium">Tiempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {splits.map((split) => (
                          <tr
                            key={`${split.kilometer}-${split.distance}`}
                            className="border-b border-zinc-900 last:border-0 odd:bg-zinc-900/45 even:bg-black/30"
                          >
                            <td className="px-4 py-3 font-semibold text-white">
                              {split.distance >= 1000
                                ? `Km ${split.kilometer}`
                                : "Final"}
                            </td>
                            <td className="px-4 py-3 text-zinc-300">
                              {formatDistance(split.distance)}
                            </td>
                            <td className="px-4 py-3 text-orange-500">
                              {formatPace(split.distance, split.duration)}
                            </td>
                            <td className="px-4 py-3 text-zinc-300">
                              {formatDuration(split.duration)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm text-zinc-500">
                    No hay datos suficientes para calcular ritmos por kilometro.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-6">
            <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 bg-black px-3 py-3">
                <h2 className="text-lg font-semibold">Datos de actividad</h2>
              </div>
              <StatsTableSection title="Resumen">
                <StatsTableRow
                  label="Distancia"
                  value={formatDistance(activity.distance)}
                />
                {activity.showSpeed ? (
                  <StatsTableRow
                    label="Ritmo"
                    value={formatPace(activity.distance, activity.duration)}
                  />
                ) : null}
                <StatsTableRow
                  label="Duracion"
                  value={formatDuration(activity.duration)}
                />
                <StatsTableRow
                  label="Elevacion"
                  value={formatElevation(activity.elevationGain)}
                />
              </StatsTableSection>

              {activity.showSpeed ? (
                <StatsTableSection title="Velocidad">
                  <StatsTableRow
                    label="Promedio"
                    value={formatSpeed(activity.avgSpeed)}
                  />
                  <StatsTableRow
                    label="Maxima"
                    value={formatSpeed(activity.maxSpeed)}
                  />
                </StatsTableSection>
              ) : null}

              {activity.showHeartRate ? (
                <StatsTableSection title="Frecuencia cardiaca">
                  <StatsTableRow
                    label="Promedio"
                    value={formatHeartRate(activity.avgHeartRate)}
                  />
                  <StatsTableRow
                    label="Maxima"
                    value={formatHeartRate(activity.maxHeartRate)}
                  />
                </StatsTableSection>
              ) : null}

              {activity.showCalories ? (
                <StatsTableSection title="Energia">
                  <StatsTableRow
                    label="Calorias"
                    value={formatCalories(activity.calories)}
                  />
                </StatsTableSection>
              ) : null}
            </section>
            <ActivityShareImageButton
              activityName={activity.name}
              metrics={getShareMetrics({
                distance: activity.distance,
                duration: activity.duration,
                showSpeed: activity.showSpeed,
              })}
              points={activity.showMap ? points : []}
              shareUrl={`/${activity.user.username}/activity/${id}`}
              showDownload={false}
            />
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
  children: React.ReactNode;
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
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

function formatSpeed(speed: number | null) {
  return speed === null ? "--" : `${(speed * 3.6).toFixed(1)} km/h`;
}

function formatHeartRate(heartRate: number | null) {
  return heartRate === null ? "--" : `${heartRate} ppm`;
}

function formatCalories(calories: number | null) {
  return calories === null ? "--" : `${calories} kcal`;
}

function formatActivityType(type: string) {
  const labels: Record<string, string> = {
    run: "Run",
    walk: "Caminata",
    ride: "Bici",
  };

  return labels[type.toLowerCase()] ?? type;
}

function getAbsoluteUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return new URL(path, baseUrl).toString();
}

function getShareMetrics({
  distance,
  duration,
  showSpeed,
}: {
  distance: number;
  duration: number;
  showSpeed: boolean;
}) {
  return [
    { label: "Distancia", value: formatDistance(distance) },
    showSpeed ? { label: "Ritmo", value: formatPace(distance, duration) } : null,
    { label: "Duracion", value: formatShareDuration(duration) },
  ].filter((metric): metric is { label: string; value: string } =>
    Boolean(metric),
  );
}

function formatShareDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}
