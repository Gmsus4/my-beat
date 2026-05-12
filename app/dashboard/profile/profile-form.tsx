"use client";

import { useActionState } from "react";

import {
  updateProfileSettings,
  type ProfileSettingsState,
} from "@/app/dashboard/profile/actions";

type ProfileFormProps = {
  user: {
    username: string;
    name: string;
    bio: string | null;
    avatar: string | null;
    cover: string | null;
  };
};

const initialState: ProfileSettingsState = {};

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileSettings,
    initialState,
  );

  return (
    <form action={formAction} className="rounded-lg border border-zinc-800 bg-zinc-950 p-6">
      <div className="grid gap-5">
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Username
          <input
            name="username"
            defaultValue={user.username}
            minLength={3}
            maxLength={24}
            pattern="[a-z0-9_]+"
            required
            className="h-11 rounded-md border border-zinc-800 bg-black px-3 text-white outline-none transition focus:border-orange-500"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Nombre
          <input
            name="name"
            defaultValue={user.name}
            minLength={2}
            maxLength={80}
            required
            className="h-11 rounded-md border border-zinc-800 bg-black px-3 text-white outline-none transition focus:border-orange-500"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Bio
          <textarea
            name="bio"
            defaultValue={user.bio ?? ""}
            maxLength={240}
            rows={4}
            className="resize-none rounded-md border border-zinc-800 bg-black px-3 py-3 text-white outline-none transition focus:border-orange-500"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Avatar URL
          <input
            name="avatar"
            defaultValue={user.avatar ?? ""}
            type="url"
            placeholder="https://..."
            className="h-11 rounded-md border border-zinc-800 bg-black px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Cover URL
          <input
            name="cover"
            defaultValue={user.cover ?? ""}
            type="url"
            placeholder="https://..."
            className="h-11 rounded-md border border-zinc-800 bg-black px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
          />
        </label>
      </div>

      {state.error ? (
        <p className="mt-5 rounded-md border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="mt-5 rounded-md border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
