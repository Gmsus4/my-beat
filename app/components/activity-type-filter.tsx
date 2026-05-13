import Link from "next/link";
import type { ReactNode } from "react";

import type { ActivityDateRange } from "@/lib/activity-date-filter";

type ActivityTypeFilterProps = {
  activeType: string | null;
  activeRange: ActivityDateRange;
  basePath: string;
  types: string[];
};

export function ActivityTypeFilter({
  activeType,
  activeRange,
  basePath,
  types,
}: ActivityTypeFilterProps) {
  const uniqueTypes = Array.from(new Set(types.map((type) => type.trim())))
    .filter(Boolean)
    .sort((a, b) => getActivityTypeLabel(a).localeCompare(getActivityTypeLabel(b)));

  if (uniqueTypes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <FilterLink
        href={buildHref(basePath, { range: activeRange, type: null })}
        active={!activeType}
      >
        Todos
      </FilterLink>
      {uniqueTypes.map((type) => (
        <FilterLink
          key={type}
          href={buildHref(basePath, { range: activeRange, type })}
          active={activeType === type}
        >
          {getActivityTypeLabel(type)}
        </FilterLink>
      ))}
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex h-7 items-center justify-center rounded-md bg-orange-500 px-2 text-[11px] font-semibold text-black"
          : "inline-flex h-7 items-center justify-center rounded-md border border-zinc-800 px-2 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-600"
      }
    >
      {children}
    </Link>
  );
}

function buildHref(
  basePath: string,
  params: { range: ActivityDateRange; type: string | null },
) {
  const searchParams = new URLSearchParams();

  if (params.range !== "all") {
    searchParams.set("range", params.range);
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
}

function getActivityTypeLabel(type: string) {
  const labels: Record<string, string> = {
    run: "Run",
    running: "Run",
    walk: "Caminar",
    walking: "Caminar",
    hike: "Caminar",
    ride: "Bici",
    cycling: "Bici",
    bike: "Bici",
  };

  return labels[type.toLowerCase()] ?? capitalize(type);
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
