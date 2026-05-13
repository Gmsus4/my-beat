"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { MiniRouteCanvas } from "@/app/[username]/mini-route-canvas";
import type { FeedActivity, FeedPage } from "@/lib/feed";

type RoutePoint = {
  lat: number;
  lon: number;
};

type FeedListProps = {
  initialActivities: FeedActivity[];
  initialNextCursor: string | null;
};

export function FeedList({
  initialActivities,
  initialNextCursor,
}: FeedListProps) {
  const [activities, setActivities] = useState(initialActivities);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/feed?cursor=${encodeURIComponent(nextCursor)}`,
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar mas actividades.");
      }

      const page = (await response.json()) as FeedPage;

      setActivities((currentActivities) => [
        ...currentActivities,
        ...page.activities,
      ]);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar mas actividades.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, nextCursor]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !nextCursor) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, nextCursor]);

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
        <h2 className="text-xl font-semibold">Tu inicio esta vacio.</h2>
        <p className="mt-2 max-w-2xl text-zinc-400">
          Busca usuarios y sigue a otros atletas para ver sus actividades
          publicas aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {activities.map((activity) => {
        const points = parsePolyline(activity.polyline);

        return (
          <Link
            key={activity.id}
            href={`/${activity.user.username}/activity/${activity.id}`}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 transition hover:border-orange-500/70"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={activity.user.name} avatar={activity.user.avatar} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{activity.user.name}</p>
                  <p className="truncate text-sm text-zinc-500">
                    @{activity.user.username}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm text-zinc-500">
                {formatShortDate(activity.date)}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                {activity.type}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{activity.name}</h2>
            </div>

            {activity.showMap ? (
              <div className="mt-4">
                <MiniRouteCanvas points={points} />
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Metric label="Distancia" value={formatDistance(activity.distance)} />
              {activity.showSpeed ? (
                <Metric
                  label="Ritmo"
                  value={formatPace(activity.distance, activity.duration)}
                />
              ) : null}
              <Metric label="Tiempo" value={formatDuration(activity.duration)} />
              <Metric
                label="Elevacion"
                value={formatElevation(activity.elevationGain)}
              />
              {activity.showHeartRate ? (
                <Metric label="FC" value={formatHeartRate(activity.avgHeartRate)} />
              ) : null}
              {activity.showCalories ? (
                <Metric
                  label="Calorias"
                  value={formatCalories(activity.calories)}
                />
              ) : null}
            </div>
          </Link>
        );
      })}

      <div ref={sentinelRef} className="min-h-8">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            Cargando mas actividades...
          </p>
        ) : null}
        {error ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-orange-500"
            >
              Reintentar
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-black text-sm font-semibold text-orange-500">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
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

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
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
