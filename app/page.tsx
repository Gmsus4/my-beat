import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MiniRouteCanvas } from "@/app/[username]/mini-route-canvas";
import { AppShell } from "@/app/components/app-shell";
import { GoogleLoginButton } from "@/app/components/google-login-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RoutePoint = {
  lat: number;
  lon: number;
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <Landing />;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      following: {
        select: { followingId: true },
      },
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const followingIds = user.following.map((follow) => follow.followingId);
  const activities =
    followingIds.length > 0
      ? await prisma.activity.findMany({
          where: {
            isPublic: true,
            userId: { in: followingIds },
          },
          orderBy: { date: "desc" },
          take: 30,
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
            user: {
              select: {
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        })
      : [];

  return (
    <AppShell>
      <main className="px-6 py-10 text-white">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                Inicio
              </p>
              <h1 className="mt-3 text-3xl font-semibold">Actividad reciente</h1>
              <p className="mt-2 max-w-2xl text-zinc-400">
                Aqui aparecen las actividades publicas de las personas que sigues.
              </p>
            </div>
            <Link
              href="/dashboard/search"
              className="inline-flex h-12 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400"
            >
              Buscar usuarios
            </Link>
          </div>

          {activities.length > 0 ? (
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
                        <Avatar
                          name={activity.user.name}
                          avatar={activity.user.avatar}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {activity.user.name}
                          </p>
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
                      <h2 className="mt-2 text-xl font-semibold">
                        {activity.name}
                      </h2>
                    </div>

                    {activity.showMap ? (
                      <div className="mt-4">
                        <MiniRouteCanvas points={points} />
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <Metric
                        label="Distancia"
                        value={formatDistance(activity.distance)}
                      />
                      {activity.showSpeed ? (
                        <Metric
                          label="Ritmo"
                          value={formatPace(activity.distance, activity.duration)}
                        />
                      ) : null}
                      <Metric
                        label="Tiempo"
                        value={formatDuration(activity.duration)}
                      />
                      <Metric
                        label="Elevacion"
                        value={formatElevation(activity.elevationGain)}
                      />
                      {activity.showHeartRate ? (
                        <Metric
                          label="FC"
                          value={formatHeartRate(activity.avgHeartRate)}
                        />
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
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
              <h2 className="text-xl font-semibold">Tu inicio esta vacio.</h2>
              <p className="mt-2 max-w-2xl text-zinc-400">
                Busca usuarios y sigue a otros atletas para ver sus actividades
                publicas aqui.
              </p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function Landing() {
  return (
    <main className="flex min-h-screen items-center bg-black px-6 py-10 text-white">
      <section className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
              My Stats
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Tus rutas GPX convertidas en historias visuales.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              Inicia sesion con Google y prepara tu perfil para subir carreras,
              rodadas y caminatas desde Strava, Garmin, Adidas Running y mas.
            </p>
          </div>

          <GoogleLoginButton />
        </div>

        <div className="grid gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between text-sm text-zinc-400">
              <span>Carrera matutina</span>
              <span>12 May</span>
            </div>
            <div className="h-56 rounded-md bg-[linear-gradient(135deg,#18181b,#09090b)] p-5">
              <svg
                viewBox="0 0 320 180"
                role="img"
                aria-label="Vista previa de una ruta GPS"
                className="h-full w-full"
              >
                <path
                  d="M18 136 C62 108, 74 154, 112 116 S166 62, 205 88 245 150, 302 48"
                  fill="none"
                  stroke="#f97316"
                  strokeLinecap="round"
                  strokeWidth="8"
                />
                <circle cx="18" cy="136" r="7" fill="#ffffff" />
                <circle cx="302" cy="48" r="7" fill="#f97316" />
              </svg>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Metric label="Distancia" value="8.42 km" />
              <Metric label="Ritmo" value="5:18 /km" />
              <Metric label="Tiempo" value="44:39" />
            </div>
          </div>
        </div>
      </section>
    </main>
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
