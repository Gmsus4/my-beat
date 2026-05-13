import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { UploadForm } from "@/app/dashboard/upload/upload-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UploadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/onboarding");
  }

  return (
    <main className="px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
          >
            Volver al dashboard
          </Link>
          <h1 className="mt-5 text-3xl font-semibold tracking-normal">
            Subir archivo GPX
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Importa una ruta desde Strava, Garmin, Adidas Running u otra app
            compatible con GPX.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6">
          <UploadForm />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Ayuda
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                Como consigo un archivo GPX?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Consulta una guia rapida para exportar actividades desde Strava,
                Garmin Connect y otras apps antes de subirlas a Mybeat.
              </p>
            </div>
            <Link
              href="/help/gpx"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-semibold text-white transition hover:border-orange-500 hover:text-orange-400"
            >
              Ver tutorial GPX
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
