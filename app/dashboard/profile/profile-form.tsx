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
    socialPlatform1: string | null;
    socialUrl1: string | null;
    socialPlatform2: string | null;
    socialUrl2: string | null;
    socialPlatform3: string | null;
    socialUrl3: string | null;
    healthPlatform: string | null;
    healthUrl: string | null;
    musicPlatform: string | null;
    musicUrl: string | null;
  };
};

const initialState: ProfileSettingsState = {};
const socialPlatforms = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X / Twitter" },
  { value: "youtube", label: "YouTube" },
  { value: "threads", label: "Threads" },
  { value: "linkedin", label: "LinkedIn" },
];
const healthPlatforms = [
  { value: "strava", label: "Strava" },
  { value: "garmin", label: "Garmin Connect" },
  { value: "adidas", label: "Adidas Running" },
  { value: "huawei", label: "Huawei Health" },
  { value: "nike", label: "Nike Run Club" },
  { value: "coros", label: "COROS" },
  { value: "polar", label: "Polar Flow" },
  { value: "suunto", label: "Suunto" },
];
const musicPlatforms = [
  { value: "spotify", label: "Spotify" },
  { value: "youtubeMusic", label: "YouTube Music" },
  { value: "appleMusic", label: "Apple Music" },
];

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

        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <div>
            <h2 className="text-lg font-semibold">Redes sociales</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Elige hasta 3 redes sociales para mostrarlas en tu perfil.
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <SocialLinkFields
              index={1}
              platform={user.socialPlatform1}
              url={user.socialUrl1}
            />
            <SocialLinkFields
              index={2}
              platform={user.socialPlatform2}
              url={user.socialUrl2}
            />
            <SocialLinkFields
              index={3}
              platform={user.socialPlatform3}
              url={user.socialUrl3}
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <div>
            <h2 className="text-lg font-semibold">App deportiva / salud</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Elige solo una plataforma para mostrar en tu perfil.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Plataforma
              <select
                name="healthPlatform"
                defaultValue={user.healthPlatform ?? ""}
                className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-white outline-none transition focus:border-orange-500"
              >
                <option value="">Ninguna</option>
                {healthPlatforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
              URL
              <input
                name="healthUrl"
                defaultValue={user.healthUrl ?? ""}
                type="url"
                placeholder="https://www.strava.com/athletes/..."
                className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-black p-4">
          <div>
            <h2 className="text-lg font-semibold">Musica</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Elige solo una plataforma musical para mostrar en tu perfil.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
              Plataforma
              <select
                name="musicPlatform"
                defaultValue={user.musicPlatform ?? ""}
                className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-white outline-none transition focus:border-orange-500"
              >
                <option value="">Ninguna</option>
                {musicPlatforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
              URL
              <input
                name="musicUrl"
                defaultValue={user.musicUrl ?? ""}
                type="url"
                placeholder="https://open.spotify.com/..."
                className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
              />
            </label>
          </div>
        </div>
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

function SocialLinkFields({
  index,
  platform,
  url,
}: {
  index: 1 | 2 | 3;
  platform: string | null;
  url: string | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
        Red {index}
        <select
          name={`socialPlatform${index}`}
          defaultValue={platform ?? ""}
          className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-white outline-none transition focus:border-orange-500"
        >
          <option value="">Ninguna</option>
          {socialPlatforms.map((socialPlatform) => (
            <option key={socialPlatform.value} value={socialPlatform.value}>
              {socialPlatform.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
        URL
        <input
          name={`socialUrl${index}`}
          defaultValue={url ?? ""}
          type="url"
          placeholder="https://www.instagram.com/tu_usuario"
          className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500"
        />
      </label>
    </div>
  );
}
