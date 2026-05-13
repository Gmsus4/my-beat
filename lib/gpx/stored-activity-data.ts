import type {
  ActivityChartPoint,
  BestEffort,
  KilometerSplit,
} from "@/lib/gpx/parse-activity";

export function readStoredSplits(value: unknown): KilometerSplit[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isKilometerSplit);
}

export function readStoredChartPoints(value: unknown): ActivityChartPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isActivityChartPoint);
}

export function readStoredBestEfforts(value: unknown): BestEffort[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isBestEffort);
}

function isKilometerSplit(value: unknown): value is KilometerSplit {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.kilometer === "number" &&
    typeof value.distance === "number" &&
    typeof value.duration === "number" &&
    typeof value.pace === "number"
  );
}

function isActivityChartPoint(value: unknown): value is ActivityChartPoint {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.distance === "number" &&
    isNullableNumber(value.elevation) &&
    isNullableNumber(value.heartRate) &&
    isNullableNumber(value.pace)
  );
}

function isBestEffort(value: unknown): value is BestEffort {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.distance === "number" && typeof value.duration === "number";
}

function isNullableNumber(value: unknown) {
  return value === null || typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
