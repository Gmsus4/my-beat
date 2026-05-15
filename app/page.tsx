import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/app/components/app-shell";
import { FeedList } from "@/app/components/feed-list";
import { GoogleLoginButton } from "@/app/components/google-login-button";
import { authOptions } from "@/lib/auth";
import { getFollowedFeedPage } from "@/lib/feed";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "MyBeat - Comparte tus metricas GPX con privacidad",
  description:
    "Diario de actividad fisica para subir GPX, visualizar metricas deportivas y compartir tu progreso sin exponer necesariamente tus rutas exactas.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MyBeat - Comparte tus metricas GPX con privacidad",
    description:
      "Sube archivos GPX, controla la visibilidad de tus datos y comparte tu progreso con un perfil publico.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBeat - Comparte tus metricas GPX con privacidad",
    description:
      "Sube archivos GPX, controla la visibilidad de tus datos y comparte tu progreso con un perfil publico.",
  },
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MyBeat",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://my-beatme.vercel.app",
    description:
      "Diario de actividad fisica para subir archivos GPX, visualizar metricas deportivas y compartir progreso con control de privacidad geografica.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-nav.png"
              alt="MyBeat"
              className="h-10 w-10 rounded-md object-contain"
            />
            <span className="font-['Outfit'] text-2xl font-black uppercase">
              mybeat
            </span>
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            Diario de actividad fisica seguro y compartible
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
            Demuestra tu esfuerzo, protege tu camino.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            Centraliza tus caminatas, carreras y rodadas desde archivos GPX.
            Comparte tu progreso con medicos, nutriologos o amigos sin exponer
            necesariamente tus rutas exactas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <GoogleLoginButton />
            <Link
              href="/help/gpx"
              className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-700 px-5 text-sm font-semibold text-zinc-100 transition hover:border-orange-500 hover:text-orange-200"
            >
              Como obtener un GPX
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
            <Link
              href="/privacy"
              className="transition hover:text-orange-300"
            >
              Politica de privacidad
            </Link>
            <Link href="/terms" className="transition hover:text-orange-300">
              Condiciones del servicio
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Benefit
              title="Privacidad geografica"
              text="Controla si muestras mapa, ritmo, frecuencia cardiaca o calorias."
            />
            <Benefit
              title="Progreso en contexto"
              text="Revisa distancia, ritmo y constancia por periodo en un perfil claro."
            />
            <Benefit
              title="Carga multiple"
              text="Sube varios GPX de una vez y manten tu historial actualizado."
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-orange-950/20">
          <div className="mb-4 flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-white">Sabastian Sawe</p>
              <p className="text-xs text-zinc-500">
                Record mundial - Londres 2026
              </p>
            </div>
            <span className="rounded-full border border-orange-500/40 px-3 py-1 text-xs font-semibold text-orange-300">
              Maraton
            </span>
          </div>
          <div className="rounded-md border border-zinc-800 bg-black p-5">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric label="Distancia" value="42.20 km" />
              <Metric label="Ritmo" value="2:50 /km" />
              <Metric label="Duracion" value="1:59:30" />
            </div>
            <div className="mt-6 h-64 rounded-md bg-zinc-950 p-5">
              <svg
                viewBox="0 0 320 240"
                role="img"
                aria-label="Vista previa de una actividad"
                className="h-full w-full"
              >
                <path
                  d="M160 194 C148 174, 96 142, 88 98 C82 64, 112 44, 138 58 C150 64, 156 74, 160 82 C164 74, 170 64, 182 58 C208 44, 238 64, 232 98 C224 142, 172 174, 160 194 Z"
                  fill="none"
                  stroke="#f97316"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="8"
                />
                <circle cx="160" cy="194" r="7" fill="#ffffff" />
                <circle cx="160" cy="82" r="7" fill="#f97316" />
              </svg>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-zinc-400">
            <Step number="1" text="Captura tu actividad con reloj o GPS." />
            <Step number="2" text="Sube uno o varios archivos GPX." />
            <Step number="3" text="Comparte tu perfil con quien tu decidas." />
          </div>
        </div>
      </section>
    </main>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-800 bg-black px-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-black">
        {number}
      </span>
      <span>{text}</span>
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
