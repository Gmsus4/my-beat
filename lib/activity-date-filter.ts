export const activityDateRanges = [
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "3 meses", value: "3m" },
  { label: "6 meses", value: "6m" },
  { label: "Este año", value: "year" },
  { label: "Completo", value: "all" },
] as const;

export type ActivityDateRange = (typeof activityDateRanges)[number]["value"];

export function normalizeActivityDateRange(
  value: string | string[] | undefined,
): ActivityDateRange {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (activityDateRanges.some((range) => range.value === candidate)) {
    return candidate as ActivityDateRange;
  }

  return "all";
}

export function getActivityDateFilter(range: ActivityDateRange) {
  if (range === "all") {
    return undefined;
  }

  const date = new Date();

  if (range === "week") {
    date.setDate(date.getDate() - 7);
  }

  if (range === "month") {
    date.setMonth(date.getMonth() - 1);
  }

  if (range === "3m") {
    date.setMonth(date.getMonth() - 3);
  }

  if (range === "6m") {
    date.setMonth(date.getMonth() - 6);
  }

  if (range === "year") {
    date.setFullYear(date.getFullYear() - 1);
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

export function getActivityDateRangeLabel(range: ActivityDateRange) {
  return activityDateRanges.find((option) => option.value === range)?.label;
}
