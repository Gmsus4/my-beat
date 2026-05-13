"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type UploadPhase = "idle" | "reading" | "uploading" | "redirecting";

type UploadProgress = {
  current: number;
  total: number;
  fileName: string;
  success: number;
  failed: number;
};

const maxFileSize = 8 * 1024 * 1024;

const uploadSteps = [
  "Enviando el GPX al servidor...",
  "Leyendo puntos GPS, tiempos y elevacion...",
  "Calculando distancia, duracion y velocidad...",
  "Extrayendo parciales y frecuencia cardiaca...",
  "Guardando la actividad en tu perfil...",
];

export function UploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadStepIndex, setUploadStepIndex] = useState(0);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const isPending = phase !== "idle";

  useEffect(() => {
    if (phase !== "uploading") {
      return;
    }

    const interval = window.setInterval(() => {
      setUploadStepIndex((currentIndex) =>
        Math.min(currentIndex + 1, uploadSteps.length - 1),
      );
    }, 1400);

    return () => {
      window.clearInterval(interval);
    };
  }, [phase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setUploadStepIndex(0);
    setPhase("reading");

    const formData = new FormData(event.currentTarget);
    const files = formData
      .getAll("gpx")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (files.length === 0) {
      setError("Selecciona uno o varios archivos GPX.");
      setPhase("idle");
      return;
    }

    const invalidExtension = files.find(
      (file) => !file.name.toLowerCase().endsWith(".gpx"),
    );

    if (invalidExtension) {
      setError(`"${invalidExtension.name}" debe tener extension .gpx.`);
      setPhase("idle");
      return;
    }

    const oversizedFile = files.find((file) => file.size > maxFileSize);

    if (oversizedFile) {
      setError(`"${oversizedFile.name}" debe pesar menos de 8 MB.`);
      setPhase("idle");
      return;
    }

    let shouldReset = true;
    let successCount = 0;
    let failedCount = 0;
    const failures: string[] = [];

    try {
      for (const [index, file] of files.entries()) {
        setProgress({
          current: index + 1,
          total: files.length,
          fileName: file.name,
          success: successCount,
          failed: failedCount,
        });
        setPhase("reading");

        const gpxData = await readBrowserFile(file);

        setUploadStepIndex(0);
        setPhase("uploading");

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
          failedCount += 1;
          failures.push(
            `${file.name}: ${payload.error ?? "No se pudo subir."}`,
          );
        } else {
          successCount += 1;
        }

        setProgress({
          current: index + 1,
          total: files.length,
          fileName: file.name,
          success: successCount,
          failed: failedCount,
        });
      }

      router.refresh();

      if (failedCount > 0) {
        setError(
          `${failedCount} de ${files.length} archivos no se pudieron subir. ${failures
            .slice(0, 3)
            .join(" ")}`,
        );
        setSuccessMessage(
          successCount > 0
            ? `${successCount} actividades se guardaron correctamente.`
            : null,
        );
        return;
      }

      shouldReset = false;
      setPhase("redirecting");
      router.push("/dashboard");
    } catch {
      setError("No se pudo completar la carga de archivos GPX.");
    } finally {
      if (shouldReset) {
        setPhase("idle");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-200">
        Archivos GPX
        <input
          name="gpx"
          type="file"
          accept=".gpx,application/gpx+xml,text/xml,application/xml"
          multiple
          required
          disabled={isPending}
          className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-orange-400"
        />
        <span className="text-xs font-normal text-zinc-500">
          Puedes seleccionar varios archivos .gpx al mismo tiempo.
        </span>
      </label>

      {isPending ? (
        <div
          className="overflow-hidden rounded-md border border-orange-500/30 bg-orange-500/10"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-orange-100">
            <LoadingSpinner />
            <div className="min-w-0">
              <p>{getPhaseMessage(phase, uploadStepIndex, progress)}</p>
              {progress ? (
                <p className="mt-1 truncate text-xs text-orange-100/70">
                  {progress.current} de {progress.total}: {progress.fileName}
                  {" · "}
                  {progress.success} guardadas
                  {progress.failed > 0 ? ` · ${progress.failed} fallidas` : ""}
                </p>
              ) : null}
            </div>
          </div>
          <div className="h-1 overflow-hidden bg-zinc-900">
            <div className="h-full w-1/2 animate-[upload-progress_1.15s_ease-in-out_infinite] bg-orange-500" />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-900/70 bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner dark />
            {getButtonLabel(phase)}
          </span>
        ) : (
          "Subir actividad"
        )}
      </button>

      <style jsx>{`
        @keyframes upload-progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(60%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </form>
  );
}

async function readBrowserFile(file: File) {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new TextDecoder().decode(await file.arrayBuffer());
}

function LoadingSpinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${
        dark ? "text-black" : "text-orange-400"
      }`}
      aria-hidden="true"
    />
  );
}

function getPhaseMessage(
  phase: UploadPhase,
  uploadStepIndex: number,
  progress: UploadProgress | null,
) {
  if (phase === "reading") {
    return progress && progress.total > 1
      ? "Leyendo el siguiente archivo GPX en tu navegador..."
      : "Leyendo el archivo GPX en tu navegador...";
  }

  if (phase === "uploading") {
    return uploadSteps[uploadStepIndex];
  }

  if (phase === "redirecting") {
    return "Actividad guardada. Volviendo al dashboard...";
  }

  return "";
}

function getButtonLabel(phase: UploadPhase) {
  if (phase === "redirecting") {
    return "Abriendo dashboard...";
  }

  return "Procesando...";
}
