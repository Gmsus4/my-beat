"use client";

import { useState } from "react";

type ShareProfileButtonProps = {
  name: string;
  username: string;
  profilePath: string;
};

export function ShareProfileButton({
  name,
  username,
  profilePath,
}: ShareProfileButtonProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleShare() {
    const url = new URL(profilePath, window.location.origin).toString();
    const shareData = {
      title: `${name} (@${username}) en Mybeat`,
      text: `Mira el perfil de ${name} en Mybeat.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setMessage(null);
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage("Link copiado.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage("No se pudo compartir.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-orange-500 hover:text-orange-200"
      >
        Compartir perfil
      </button>
      {message ? <p className="text-xs text-zinc-500">{message}</p> : null}
    </div>
  );
}
