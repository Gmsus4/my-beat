"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("gpx");

    if (!(file instanceof File) || file.size === 0) {
      setError("Selecciona un archivo GPX.");
      setIsPending(false);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("El archivo debe tener extension .gpx.");
      setIsPending(false);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("El archivo GPX debe pesar menos de 8 MB.");
      setIsPending(false);
      return;
    }

    try {
      const gpxData = await readBrowserFile(file);
      const response = await fetch("/api/activities/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          gpxData,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "No se pudo subir el archivo GPX.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo subir el archivo GPX.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
        Archivo GPX
        <input
          name="gpx"
          type="file"
          accept=".gpx,application/gpx+xml,text/xml,application/xml"
          required
          className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-orange-400"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Procesando..." : "Subir actividad"}
      </button>
    </form>
  );
}

async function readBrowserFile(file: File) {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new TextDecoder().decode(await file.arrayBuffer());
}
