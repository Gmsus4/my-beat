import Link from "next/link";

import {
  activityDateRanges,
  type ActivityDateRange,
} from "@/lib/activity-date-filter";

type DateRangeFilterProps = {
  activeRange: ActivityDateRange;
  basePath: string;
  activityType?: string | null;
};

export function DateRangeFilter({
  activeRange,
  basePath,
  activityType,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {activityDateRanges.map((range) => {
        const isActive = range.value === activeRange;
        const href = buildHref(basePath, {
          range: range.value === "all" ? null : range.value,
          type: activityType,
        });

        return (
          <Link
            key={range.value}
            href={href}
            className={
              isActive
                ? "inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-3 text-sm font-semibold text-black"
                : "inline-flex h-10 items-center justify-center rounded-md border border-zinc-800 px-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-600"
            }
          >
            {range.label}
          </Link>
        );
      })}
    </div>
  );
}

function buildHref(
  basePath: string,
  params: { range?: string | null; type?: string | null },
) {
  const searchParams = new URLSearchParams();

  if (params.range) {
    searchParams.set("range", params.range);
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
}
