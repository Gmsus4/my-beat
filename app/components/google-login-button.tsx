"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function GoogleLoginButton() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (session?.user) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400"
        >
          Ir al dashboard
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-700 px-5 text-sm font-semibold text-white transition hover:border-zinc-500"
        >
          Cerrar sesion
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Cargando..." : "Continuar con Google"}
    </button>
  );
}
