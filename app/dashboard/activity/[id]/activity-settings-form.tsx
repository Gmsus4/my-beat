"use client";

import { useActionState } from "react";

import {
  updateActivitySettings,
  type ActivitySettingsState,
} from "@/app/dashboard/activity/[id]/actions";

type ActivitySettingsFormProps = {
  activity: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    isPublic: boolean;
    showMap: boolean;
    showHeartRate: boolean;
    showSpeed: boolean;
    showCalories: boolean;
  };
};

const initialState: ActivitySettingsState = {};

export function ActivitySettingsForm({ activity }: ActivitySettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateActivitySettings.bind(null, activity.id),
    initialState,
  );

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
    >
      <div className="border-b border-zinc-800 bg-black px-5 py-4">
        <h2 className="text-lg font-semibold">Editar actividad</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ajusta el nombre, tipo y que datos se muestran publicamente.
        </p>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Nombre
          <input
            name="name"
            defaultValue={activity.name}
            minLength={3}
            maxLength={80}
            required
            className="h-11 rounded-md border border-zinc-800 bg-black px-3 text-white outline-none transition focus:border-orange-500"
          />
        </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
            Tipo de actividad
            <input
              name="type"
              defaultValue={activity.type}
              minLength={2}
              maxLength={40}
              required
              placeholder="run, walk, ride..."
              className="h-11 rounded-md border border-zinc-800 bg-black px-3 text-white outline-none transition focus:border-orange-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
          Descripcion
          <textarea
            name="description"
            defaultValue={activity.description ?? ""}
            maxLength={500}
            rows={4}
            className="resize-none rounded-md border border-zinc-800 bg-black px-3 py-3 text-white outline-none transition focus:border-orange-500"
          />
        </label>

        <section className="rounded-lg border border-zinc-800 bg-black/50 p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Visibilidad</h3>
              <p className="text-xs text-zinc-500">
                Decide que ve la gente en tu actividad publica.
              </p>
            </div>
            <span
              className={
                activity.isPublic
                  ? "text-xs font-semibold text-orange-400"
                  : "text-xs font-semibold text-zinc-500"
              }
            >
              {activity.isPublic ? "Publica" : "Privada"}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Toggle
          name="isPublic"
              label="Publica"
              description="Perfil"
              icon={<GlobeIcon />}
              featured
          defaultChecked={activity.isPublic}
        />
        <Toggle
          name="showMap"
              label="Mapa"
              description="Ruta"
              icon={<MapIcon />}
          defaultChecked={activity.showMap}
        />
        <Toggle
          name="showSpeed"
              label="Ritmo"
              description="Pace"
              icon={<SpeedIcon />}
          defaultChecked={activity.showSpeed}
        />
        <Toggle
          name="showHeartRate"
              label="FC"
              description="Pulso"
              icon={<HeartIcon />}
          defaultChecked={activity.showHeartRate}
        />
        <Toggle
          name="showCalories"
              label="Calorias"
              description="kcal"
              icon={<FlameIcon />}
          defaultChecked={activity.showCalories}
        />
          </div>
        </section>
      </div>

      {state.error ? (
        <p className="mx-5 rounded-md border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="mx-5 rounded-md border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <div className="flex border-t border-zinc-800 px-5 py-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Toggle({
  name,
  label,
  description,
  icon,
  featured = false,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  featured?: boolean;
  defaultChecked: boolean;
}) {
  return (
    <label className="visibility-toggle relative flex min-h-20 cursor-pointer flex-col justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300 transition hover:border-zinc-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex items-center justify-between gap-3">
        <span
          className={
            featured
              ? "visibility-toggle-icon text-orange-500 transition"
              : "visibility-toggle-icon text-zinc-500 transition"
          }
        >
          {icon}
        </span>
        <span className="visibility-toggle-track flex h-5 w-9 items-center rounded-full border border-zinc-700 bg-zinc-900 p-0.5 transition">
          <span className="visibility-toggle-knob h-3.5 w-3.5 rounded-full bg-zinc-500 transition" />
        </span>
      </span>
      <span className="mt-2 block">
        <span className="block font-semibold text-white">{label}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
    </label>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 12h18M12 3c2.4 2.7 3.6 5.7 3.6 9s-1.2 6.3-3.6 9c-2.4-2.7-3.6-5.7-3.6-9S9.6 5.7 12 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M9 3v15M15 6v15" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 19a9 9 0 1 1 14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="m12 14 4-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M20.8 7.8c0 5-8.8 10.4-8.8 10.4S3.2 12.8 3.2 7.8A4.6 4.6 0 0 1 12 5.9a4.6 4.6 0 0 1 8.8 1.9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 22c4 0 7-2.8 7-6.8 0-2.6-1.4-5-3.4-6.7-.5 2.3-1.8 3.6-3.2 4.4.6-3.8-.9-7.2-4.1-10C8.1 6.2 5 9.2 5 15.2 5 19.2 8 22 12 22Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
