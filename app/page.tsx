import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/app/components/app-shell";
import { FeedList } from "@/app/components/feed-list";
import { GoogleLoginButton } from "@/app/components/google-login-button";
import { authOptions } from "@/lib/auth";
import { getFollowedFeedPage } from "@/lib/feed";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <Landing />;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  const feedPage = await getFollowedFeedPage(session.user.email);

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

          <FeedList
            initialActivities={feedPage.activities}
            initialNextCursor={feedPage.nextCursor}
          />
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
              mybeat
              {/* mybeat.me */}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
