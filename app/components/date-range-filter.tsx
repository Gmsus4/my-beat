import Link from "next/link";

import {
  activityDateRanges,
  type ActivityDateRange,
} from "@/lib/activity-date-filter";

type DateRangeFilterProps = {
  activeRange: ActivityDateRange;
  basePath: string;
};

export function DateRangeFilter({
  activeRange,
  basePath,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {activityDateRanges.map((range) => {
        const isActive = range.value === activeRange;
        const href =
          range.value === "all" ? basePath : `${basePath}?range=${range.value}`;

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
