"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={
        compact
          ? "inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm font-semibold text-zinc-300"
          : "mt-auto rounded-md border border-zinc-800 px-3 py-2 text-left text-sm font-semibold text-zinc-300 transition hover:border-red-900/80 hover:bg-red-950/30 hover:text-red-200"
      }
    >
      Cerrar sesion
    </button>
  );
}
