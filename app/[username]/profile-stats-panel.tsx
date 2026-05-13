"use client";

import { useState } from "react";

type ProfileStatsPanelProps = {
  children: React.ReactNode;
};

export function ProfileStatsPanel({ children }: ProfileStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between border-b border-zinc-800 bg-black px-3 py-3 text-left lg:pointer-events-none"
        aria-expanded={isOpen}
      >
        <h2 className="text-lg font-semibold">Mis estadísticas</h2>
        <span className="text-sm font-semibold text-orange-500 lg:hidden">
          {isOpen ? "Ocultar" : "Ver"}
        </span>
      </button>

      <div className={isOpen ? "block" : "hidden lg:block"}>{children}</div>
    </section>
  );
}
