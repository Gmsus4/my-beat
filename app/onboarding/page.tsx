import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { UsernameForm } from "@/app/onboarding/username-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center bg-black px-6 py-10 text-white">
      <section className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            Onboarding
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-normal">
            Elige tu username publico.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-300">
            Este sera el enlace de tu perfil publico: mybeat.me/username.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6">
          <UsernameForm />
        </div>
      </section>
    </main>
  );
}
