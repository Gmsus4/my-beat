import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/app/components/sign-out-button";
import { DeleteAccountForm } from "@/app/dashboard/profile/delete-account-form";
import { ProfileForm } from "@/app/dashboard/profile/profile-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      username: true,
      name: true,
      bio: true,
      avatar: true,
      cover: true,
      socialPlatform1: true,
      socialUrl1: true,
      socialPlatform2: true,
      socialUrl2: true,
      socialPlatform3: true,
      socialUrl3: true,
      healthPlatform: true,
      healthUrl: true,
      musicPlatform: true,
      musicUrl: true,
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  return (
    <main className="px-4 py-8 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
          >
            Volver al dashboard
          </Link>
          <h1 className="mt-5 text-3xl font-semibold tracking-normal">
            Settings de perfil
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Edita como se vera tu perfil publico en /{user.username}.
          </p>
        </div>

        <ProfileForm user={user} />

        <div className="border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold">Cuenta</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Cierra tu sesión en este dispositivo.
          </p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>

        <DeleteAccountForm username={user.username} />
      </section>
    </main>
  );
}
