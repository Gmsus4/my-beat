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
      </section>
    </main>
  );
}
