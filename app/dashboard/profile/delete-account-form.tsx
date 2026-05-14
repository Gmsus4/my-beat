"use client";

import { signOut } from "next-auth/react";
import { useActionState, useEffect } from "react";

import {
  deleteAccount,
  type DeleteAccountState,
} from "@/app/dashboard/profile/actions";

type DeleteAccountFormProps = {
  username: string;
};

const initialState: DeleteAccountState = {};

export function DeleteAccountForm({ username }: DeleteAccountFormProps) {
  const [state, formAction, isPending] = useActionState(
    deleteAccount,
    initialState,
  );

  useEffect(() => {
    if (state.deleted) {
      void signOut({ callbackUrl: "/" });
    }
  }, [state.deleted]);

  return (
    <form
      action={formAction}
      className="rounded-lg border border-red-950 bg-red-950/20 p-5"
    >
      <h2 className="text-lg font-semibold text-red-100">Zona peligrosa</h2>
      <p className="mt-2 max-w-2xl text-sm text-red-200/80">
        Eliminar tu cuenta borrara tu perfil, actividades, seguidores y personas
        que sigues. Esta accion no se puede deshacer.
      </p>

      <label className="mt-5 flex max-w-md flex-col gap-2 text-sm font-medium text-red-100">
        Escribe tu username para confirmar
        <input
          name="confirmation"
          placeholder={username}
          autoComplete="off"
          className="h-11 rounded-md border border-red-900/70 bg-black px-3 text-white outline-none transition placeholder:text-red-200/40 focus:border-red-400"
        />
      </label>

      {state.error ? (
        <p className="mt-4 rounded-md border border-red-900/70 bg-red-950/70 px-4 py-3 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || state.deleted}
        className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending || state.deleted ? "Eliminando..." : "Eliminar mi cuenta"}
      </button>
    </form>
  );
}
