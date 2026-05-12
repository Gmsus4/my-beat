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
    <form action={formAction} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div>
        <h2 className="text-lg font-semibold">Editar actividad</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Controla que informacion se mostrara cuando esta actividad sea publica.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
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
          Descripcion
          <textarea
            name="description"
            defaultValue={activity.description ?? ""}
            maxLength={500}
            rows={4}
            className="resize-none rounded-md border border-zinc-800 bg-black px-3 py-3 text-white outline-none transition focus:border-orange-500"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Toggle
          name="isPublic"
          label="Actividad publica"
          defaultChecked={activity.isPublic}
        />
        <Toggle
          name="showMap"
          label="Mostrar mapa"
          defaultChecked={activity.showMap}
        />
        <Toggle
          name="showSpeed"
          label="Mostrar velocidad/ritmo"
          defaultChecked={activity.showSpeed}
        />
        <Toggle
          name="showHeartRate"
          label="Mostrar frecuencia cardiaca"
          defaultChecked={activity.showHeartRate}
        />
        <Toggle
          name="showCalories"
          label="Mostrar calorias"
          defaultChecked={activity.showCalories}
        />
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
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-800 bg-black px-3 py-3 text-sm text-zinc-200">
      <span>{label}</span>
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-5 w-5 accent-orange-500"
      />
    </label>
  );
}
