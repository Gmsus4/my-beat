"use client";

import { useActionState } from "react";

import {
  completeOnboarding,
  type OnboardingState,
} from "@/app/onboarding/actions";

const initialState: OnboardingState = {};

export function UsernameForm() {
  const [state, formAction, isPending] = useActionState(
    completeOnboarding,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
        Username
        <input
          name="username"
          type="text"
          minLength={3}
          maxLength={24}
          pattern="[a-z0-9_]+"
          required
          autoComplete="username"
          placeholder="tu_username"
          className="h-12 rounded-md border border-zinc-800 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
        />
      </label>

      {state.error ? (
        <p className="rounded-md border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Crear perfil"}
      </button>
    </form>
  );
}
