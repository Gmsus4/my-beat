import Link from "next/link";
import { notFound } from "next/navigation";

import { RouteCanvas } from "@/app/dashboard/activity/[id]/route-canvas";
import { parseGpxKilometerSplits } from "@/lib/gpx/parse-activity";
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
      gpxData: true,
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
  const splits =
    activity.gpxData && activity.showSpeed
      ? await parseGpxKilometerSplits(activity.gpxData)
      : [];

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
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

        {activity.showMap ? <RouteCanvas points={points} /> : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Distancia" value={formatDistance(activity.distance)} />
          {activity.showSpeed ? (
            <>
              <Metric
                label="Ritmo"
                value={formatPace(activity.distance, activity.duration)}
              />
              <Metric
                label="Vel. promedio"
                value={formatSpeed(activity.avgSpeed)}
              />
              <Metric
                label="Vel. maxima"
                value={formatSpeed(activity.maxSpeed)}
              />
            </>
          ) : null}
          <Metric label="Duracion" value={formatDuration(activity.duration)} />
          <Metric
            label="Elevacion"
            value={formatElevation(activity.elevationGain)}
          />
          {activity.showHeartRate ? (
            <>
              <Metric
                label="FC promedio"
                value={formatHeartRate(activity.avgHeartRate)}
              />
              <Metric
                label="FC maxima"
                value={formatHeartRate(activity.maxHeartRate)}
              />
            </>
          ) : null}
          {activity.showCalories ? (
            <Metric label="Calorias" value={formatCalories(activity.calories)} />
          ) : null}
        </div>

        {activity.showSpeed ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold">Ritmos por kilometro</h2>
            {splits.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-zinc-800 text-zinc-500">
                    <tr>
                      <th className="py-3 font-medium">Split</th>
                      <th className="py-3 font-medium">Distancia</th>
                      <th className="py-3 font-medium">Ritmo</th>
                      <th className="py-3 font-medium">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splits.map((split) => (
                      <tr
                        key={`${split.kilometer}-${split.distance}`}
                        className="border-b border-zinc-900 last:border-0"
                      >
                        <td className="py-3 font-semibold text-white">
                          {split.distance >= 1000
                            ? `Km ${split.kilometer}`
                            : "Final"}
                        </td>
                        <td className="py-3 text-zinc-300">
                          {formatDistance(split.distance)}
                        </td>
                        <td className="py-3 text-orange-500">
                          {formatPace(split.distance, split.duration)}
                        </td>
                        <td className="py-3 text-zinc-300">
                          {formatDuration(split.duration)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No hay datos suficientes para calcular ritmos por kilometro.
              </p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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
