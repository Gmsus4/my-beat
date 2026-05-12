"use client";

import { useTransition } from "react";

import { deleteActivity } from "@/app/dashboard/activity/[id]/actions";

export function DeleteActivityButton({ activityId }: { activityId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Esta accion eliminara la actividad permanentemente.",
    );

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void deleteActivity(activityId);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="inline-flex h-11 items-center justify-center rounded-md border border-red-900/80 px-5 text-sm font-semibold text-red-200 transition hover:border-red-700 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Eliminando..." : "Eliminar actividad"}
    </button>
  );
}
