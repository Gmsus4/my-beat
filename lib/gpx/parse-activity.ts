import type { Point } from "gpxparser";

type GpxPoint = Point & {
  ele: number | null;
  time: Date | null;
};

type GpxTrack = {
  name?: string | null;
  type?: string | null;
  points: GpxPoint[];
  distance: {
    total: number;
    cumul?: unknown;
  };
  elevation: {
    pos?: number | null;
  };
};

type ParsedGpx = {
  tracks: GpxTrack[];
  routes: GpxTrack[];
  metadata: {
    time?: string | Date | null;
  };
  xmlSource: unknown;
};

type ParsedActivity = {
  name: string;
  type: string;
  date: Date;
  distance: number;
  duration: number;
  elevationGain: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  polyline: string;
};

export type KilometerSplit = {
  kilometer: number;
  distance: number;
  duration: number;
  pace: number;
};

export type BestEffort = {
  distance: number;
  duration: number;
};

export type ActivityChartPoint = {
  distance: number;
  elevation: number | null;
  heartRate: number | null;
  pace: number | null;
};

const maxStoredPoints = 1200;
const maxChartPoints = 700;

export const bestEffortTargetDistances = [
  400,
  804.672,
  1000,
  1609.344,
  3218.688,
  5000,
  10000,
  15000,
  21097.5,
  42195,
];

export type ParsedUploadActivityData = {
  activity: ParsedActivity;
  splitsData: KilometerSplit[];
  chartData: ActivityChartPoint[];
  bestEffortsData: BestEffort[];
};

export async function parseGpxUploadData(
  xml: string,
): Promise<ParsedUploadActivityData> {
  const parser = await parseGpx(xml);
  const track = getMainTrack(parser);

  if (!track || track.points.length < 2) {
    throw new Error("El archivo GPX no contiene una ruta valida.");
  }

  return {
    activity: getParsedActivity(parser, track),
    splitsData: getKilometerSplits(track),
    chartData: getChartSeries(parser, track),
    bestEffortsData: getBestEfforts(track, bestEffortTargetDistances),
  };
}

export async function parseGpxActivity(xml: string): Promise<ParsedActivity> {
  const parser = await parseGpx(xml);
  const track = getMainTrack(parser);

  if (!track || track.points.length < 2) {
    throw new Error("El archivo GPX no contiene una ruta valida.");
  }

  return getParsedActivity(parser, track);
}

function getParsedActivity(
  parser: ParsedGpx,
  track: GpxTrack,
): ParsedActivity {
  const points = track.points as GpxPoint[];
  const firstPointWithTime = points.find((point) => point.time);
  const lastPointWithTime = [...points].reverse().find((point) => point.time);
  const duration =
    firstPointWithTime?.time && lastPointWithTime?.time
      ? Math.max(
          0,
          Math.round(
            (lastPointWithTime.time.getTime() -
              firstPointWithTime.time.getTime()) /
              1000,
          ),
        )
      : 0;
  const distance = track.distance.total;
  const speeds = getSegmentSpeeds(points);
  const document = parser.xmlSource as unknown as Document;
  const heartRates = getHeartRates(document);
  const type = normalizeActivityType(track.type);
  const date =
    firstPointWithTime?.time ??
    (parser.metadata.time ? new Date(parser.metadata.time) : new Date());

  return {
    name: getActivityName(track),
    type,
    date,
    distance,
    duration,
    elevationGain: track.elevation.pos ?? null,
    avgSpeed: duration > 0 ? distance / duration : null,
    maxSpeed: speeds.length > 0 ? Math.max(...speeds) : null,
    avgHeartRate:
      heartRates.length > 0
        ? Math.round(
            heartRates.reduce((sum, heartRate) => sum + heartRate, 0) /
              heartRates.length,
          )
        : null,
    maxHeartRate: heartRates.length > 0 ? Math.max(...heartRates) : null,
    polyline: JSON.stringify(samplePoints(points)),
  };
}

function getActivityName(track: { name?: string | null }): string {
  const name = track.name?.trim();

  if (name) {
    return name;
  }

  return "Actividad GPX";
}

function normalizeActivityType(type: string | null | undefined): string {
  const normalized = type?.trim().toLowerCase();

  if (!normalized) {
    return "run";
  }

  if (["cycling", "bike", "biking", "ride"].includes(normalized)) {
    return "ride";
  }

  if (["running", "run"].includes(normalized)) {
    return "run";
  }

  if (["walking", "hike", "hiking"].includes(normalized)) {
    return "walk";
  }

  return normalized;
}

function getSegmentSpeeds(points: GpxPoint[]) {
  const speeds: number[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    if (!previous.time || !current.time) {
      continue;
    }

    const seconds =
      (current.time.getTime() - previous.time.getTime()) / 1000;

    if (seconds <= 0) {
      continue;
    }

    speeds.push(distanceBetween(previous, current) / seconds);
  }

  return speeds.filter((speed) => Number.isFinite(speed) && speed > 0);
}

export async function parseGpxKilometerSplits(
  xml: string,
): Promise<KilometerSplit[]> {
  const parser = await parseGpx(xml);
  const track = getMainTrack(parser);

  if (!track || track.points.length < 2) {
    return [];
  }

  return getKilometerSplits(track);
}

function getKilometerSplits(track: GpxTrack) {
  const points = track.points as GpxPoint[];
  const cumulativeDistances = getCumulativeDistances(
    points,
    Array.isArray(track.distance.cumul) ? track.distance.cumul : [],
  );
  const splits: KilometerSplit[] = [];
  let nextKilometer = 1;
  let splitStartTime = points.find((point) => point.time)?.time ?? null;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const previousDistance = cumulativeDistances[index - 1];
    const currentDistance = cumulativeDistances[index];

    if (
      !previous.time ||
      !current.time ||
      !splitStartTime ||
      !Number.isFinite(previousDistance) ||
      !Number.isFinite(currentDistance)
    ) {
      continue;
    }

    const segmentDistance = currentDistance - previousDistance;
    const segmentDuration =
      (current.time.getTime() - previous.time.getTime()) / 1000;

    if (segmentDistance <= 0 || segmentDuration < 0) {
      continue;
    }

    while (currentDistance >= nextKilometer * 1000) {
      const targetDistance = nextKilometer * 1000;
      const ratio = (targetDistance - previousDistance) / segmentDistance;
      const splitEndTime = new Date(
        previous.time.getTime() + segmentDuration * ratio * 1000,
      );
      const duration = Math.round(
        (splitEndTime.getTime() - splitStartTime.getTime()) / 1000,
      );

      splits.push({
        kilometer: nextKilometer,
        distance: 1000,
        duration,
        pace: duration,
      });

      splitStartTime = splitEndTime;
      nextKilometer += 1;
    }
  }

  const lastPointWithTime = [...points].reverse().find((point) => point.time);
  const totalDistance =
    cumulativeDistances[cumulativeDistances.length - 1] ?? track.distance.total;
  const remainingDistance = totalDistance - (nextKilometer - 1) * 1000;

  if (
    splitStartTime &&
    lastPointWithTime?.time &&
    remainingDistance >= 50
  ) {
    const duration = Math.round(
      (lastPointWithTime.time.getTime() - splitStartTime.getTime()) / 1000,
    );

    if (duration > 0) {
      splits.push({
        kilometer: nextKilometer,
        distance: remainingDistance,
        duration,
        pace: duration / (remainingDistance / 1000),
      });
    }
  }

  return splits;
}

export async function parseGpxBestEfforts(
  xml: string,
  targetDistances: number[],
): Promise<BestEffort[]> {
  const parser = await parseGpx(xml);
  const track = getMainTrack(parser);

  if (!track || track.points.length < 2) {
    return [];
  }

  return getBestEfforts(track, targetDistances);
}

function getBestEfforts(track: GpxTrack, targetDistances: number[]) {
  const points = track.points as GpxPoint[];
  const cumulativeDistances = getCumulativeDistances(
    points,
    Array.isArray(track.distance.cumul) ? track.distance.cumul : [],
  );

  return targetDistances
    .map((distance) => {
      const duration = getBestDurationForDistance(
        points,
        cumulativeDistances,
        distance,
      );

      return duration === null ? null : { distance, duration };
    })
    .filter((effort): effort is BestEffort => effort !== null);
}

export async function parseGpxChartSeries(
  xml: string,
): Promise<ActivityChartPoint[]> {
  const parser = await parseGpx(xml);
  const track = getMainTrack(parser);

  if (!track || track.points.length < 2) {
    return [];
  }

  return getChartSeries(parser, track);
}

function getChartSeries(parser: ParsedGpx, track: GpxTrack) {
  const points = track.points as GpxPoint[];
  const document = parser.xmlSource as unknown as Document;
  const trackPointMetrics = getTrackPointMetrics(document);
  const cumulativeDistances = getCumulativeDistances(
    points,
    Array.isArray(track.distance.cumul)
      ? (track.distance.cumul as unknown as number[])
      : [],
  );
  const paceValues = getMovingPaces(points, cumulativeDistances);
  const step = Math.max(1, Math.ceil(points.length / maxChartPoints));

  return points
    .map((point, index) => {
      const metrics = trackPointMetrics[index];
      const elevation =
        typeof point.ele === "number" && Number.isFinite(point.ele)
          ? Math.round(point.ele * 10) / 10
          : null;

      return {
        distance: roundDistance(cumulativeDistances[index] ?? 0),
        elevation,
        heartRate: metrics?.heartRate ?? null,
        pace: paceValues[index] ?? null,
      };
    })
    .filter(
      (_, index) =>
        index % step === 0 ||
        index === points.length - 1 ||
        index === points.length - 2,
    );
}

function getBestDurationForDistance(
  points: GpxPoint[],
  cumulativeDistances: number[],
  targetDistance: number,
) {
  let bestDuration: number | null = null;

  for (let startIndex = 0; startIndex < points.length - 1; startIndex += 1) {
    const startPoint = points[startIndex];
    const startDistance = cumulativeDistances[startIndex];

    if (!startPoint.time || !Number.isFinite(startDistance)) {
      continue;
    }

    const targetCumulativeDistance = startDistance + targetDistance;
    const endIndex = findFirstDistanceIndex(
      cumulativeDistances,
      targetCumulativeDistance,
      startIndex + 1,
    );

    if (endIndex === -1) {
      continue;
    }

    const endPoint = points[endIndex];
    const previousEndPoint = points[endIndex - 1];
    const endDistance = cumulativeDistances[endIndex];
    const previousEndDistance = cumulativeDistances[endIndex - 1];

    if (
      !endPoint.time ||
      !previousEndPoint?.time ||
      !Number.isFinite(endDistance) ||
      !Number.isFinite(previousEndDistance)
    ) {
      continue;
    }

    const segmentDistance = endDistance - previousEndDistance;
    const segmentDuration =
      (endPoint.time.getTime() - previousEndPoint.time.getTime()) / 1000;
    const ratio =
      segmentDistance > 0
        ? (targetCumulativeDistance - previousEndDistance) / segmentDistance
        : 0;
    const interpolatedEndTime = new Date(
      previousEndPoint.time.getTime() + segmentDuration * ratio * 1000,
    );
    const duration =
      (interpolatedEndTime.getTime() - startPoint.time.getTime()) / 1000;

    if (duration <= 0) {
      continue;
    }

    if (bestDuration === null || duration < bestDuration) {
      bestDuration = duration;
    }
  }

  return bestDuration === null ? null : Math.round(bestDuration);
}

function findFirstDistanceIndex(
  cumulativeDistances: number[],
  targetDistance: number,
  startIndex: number,
) {
  let low = startIndex;
  let high = cumulativeDistances.length - 1;
  let result = -1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);

    if (cumulativeDistances[middle] >= targetDistance) {
      result = middle;
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }

  return result;
}

function getCumulativeDistances(points: GpxPoint[], existing: number[]) {
  if (
    existing.length === points.length &&
    existing.every((distance) => Number.isFinite(distance))
  ) {
    return existing;
  }

  const distances: number[] = [0];

  for (let index = 1; index < points.length; index += 1) {
    distances[index] =
      distances[index - 1] + distanceBetween(points[index - 1], points[index]);
  }

  return distances;
}

function getMovingPaces(points: GpxPoint[], cumulativeDistances: number[]) {
  const paces: (number | null)[] = Array(points.length).fill(null);
  const windowDistance = 120;

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];

    if (!current.time) {
      continue;
    }

    let startIndex = index - 1;

    while (
      startIndex > 0 &&
      cumulativeDistances[index] - cumulativeDistances[startIndex] <
        windowDistance
    ) {
      startIndex -= 1;
    }

    const startPoint = points[startIndex];

    if (!startPoint.time) {
      continue;
    }

    const distance = cumulativeDistances[index] - cumulativeDistances[startIndex];
    const duration =
      (current.time.getTime() - startPoint.time.getTime()) / 1000;

    if (distance < 20 || duration <= 0) {
      continue;
    }

    const pace = duration / (distance / 1000);

    if (Number.isFinite(pace) && pace > 0) {
      paces[index] = Math.round(pace);
    }
  }

  return paces;
}

function distanceBetween(from: GpxPoint, to: GpxPoint) {
  const radius = 6371e3;
  const radians = Math.PI / 180;
  const fromLat = from.lat * radians;
  const toLat = to.lat * radians;
  const deltaLat = (to.lat - from.lat) * radians;
  const deltaLon = (to.lon - from.lon) * radians;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2;

  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getMainTrack(parser: ParsedGpx) {
  return parser.tracks[0] ?? parser.routes[0] ?? null;
}

async function parseGpx(): Promise<ParsedGpx>;
async function parseGpx(xml: string): Promise<ParsedGpx>;
async function parseGpx(xml?: string): Promise<ParsedGpx> {
  if (!("canParse" in URL)) {
    Object.defineProperty(URL, "canParse", {
      value(url: string | URL, base?: string | URL) {
        try {
          new URL(url, base);
          return true;
        } catch {
          return false;
        }
      },
    });
  }

  const { default: GpxParser } = await import("gpxparser");
  const parser = new GpxParser();
  parser.parse(xml ?? "");

  return parser as unknown as ParsedGpx;
}

function getHeartRates(document: Document) {
  const heartRates: number[] = [];
  const elements = Array.from(document.getElementsByTagName("*"));

  for (const element of elements) {
    if (element.localName.toLowerCase() !== "hr") {
      continue;
    }

    const value = Number(element.textContent);

    if (Number.isFinite(value) && value > 0) {
      heartRates.push(Math.round(value));
    }
  }

  return heartRates;
}

function getTrackPointMetrics(document: Document) {
  const points = Array.from(document.getElementsByTagName("*")).filter(
    (element) => element.localName.toLowerCase() === "trkpt",
  );

  return points.map((point) => {
    const children = Array.from(point.getElementsByTagName("*"));
    const heartRateElement = children.find(
      (element) => element.localName.toLowerCase() === "hr",
    );
    const heartRate = Number(heartRateElement?.textContent);

    return {
      heartRate:
        Number.isFinite(heartRate) && heartRate > 0
          ? Math.round(heartRate)
          : null,
    };
  });
}

function samplePoints(points: GpxPoint[]) {
  const step = Math.max(1, Math.ceil(points.length / maxStoredPoints));

  return points
    .filter((_, index) => index % step === 0 || index === points.length - 1)
    .map((point) => ({
      lat: roundCoordinate(point.lat),
      lon: roundCoordinate(point.lon),
    }));
}

function roundCoordinate(value: number) {
  return Math.round(value * 100000) / 100000;
}

function roundDistance(value: number) {
  return Math.round((value / 1000) * 100) / 100;
}
