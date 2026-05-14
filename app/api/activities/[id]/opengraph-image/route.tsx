import { ImageResponse } from "next/og";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RoutePoint = {
  lat: number;
  lon: number;
};

export const runtime = "nodejs";

const size = {
  width: 1200,
  height: 630,
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      isPublic: true,
    },
    select: {
      name: true,
      type: true,
      distance: true,
      duration: true,
      polyline: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!activity) {
    return new ImageResponse(<FallbackImage />, size);
  }

  const points = parsePolyline(activity.polyline);
  const routePath = getRoutePath(points, {
    x: 80,
    y: 92,
    width: 500,
    height: 430,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#050505",
          color: "#ffffff",
          fontFamily: "Arial",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 25% 55%, rgba(249, 115, 22, 0.18), transparent 34%), radial-gradient(circle at 85% 5%, rgba(249, 115, 22, 0.12), transparent 28%)",
          }}
        />

        <svg
          width="620"
          height="630"
          viewBox="0 0 620 630"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
          }}
        >
          {routePath ? (
            <path
              d={routePath}
              fill="none"
              stroke="#f97316"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="12"
            />
          ) : null}
        </svg>

        <div
          style={{
            position: "absolute",
            left: 650,
            top: 74,
            width: 470,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              color: "#f97316",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {formatActivityType(activity.type)}
          </div>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1,
              fontWeight: 900,
              marginBottom: 24,
            }}
          >
            {activity.name}
          </div>
          <div
            style={{
              color: "#d4d4d8",
              fontSize: 30,
              fontWeight: 700,
              marginBottom: 48,
            }}
          >
            @{activity.user.username}
          </div>

          <Metric label="Distancia" value={formatDistance(activity.distance)} />
          <Metric
            label="Ritmo"
            value={formatPace(activity.distance, activity.duration)}
          />
          <Metric label="Duracion" value={formatDuration(activity.duration)} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 56,
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: "0.08em",
          }}
        >
          MYBEAT
        </div>
      </div>
    ),
    size,
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 34 }}>
      <div
        style={{
          color: "#d4d4d8",
          fontSize: 30,
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ color: "#ffffff", fontSize: 54, fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

function FallbackImage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        color: "#ffffff",
        fontSize: 64,
        fontWeight: 900,
        fontFamily: "Arial",
      }}
    >
      MYBEAT
    </div>
  );
}

function parsePolyline(polyline: string | null): RoutePoint[] {
  if (!polyline) {
    return [];
  }

  try {
    const parsed = JSON.parse(polyline) as RoutePoint[];

    return Array.isArray(parsed)
      ? parsed.filter(
          (point) =>
            typeof point.lat === "number" && typeof point.lon === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function getRoutePath(
  points: RoutePoint[],
  bounds: { x: number; y: number; width: number; height: number },
) {
  if (points.length < 2) {
    return "";
  }

  const minLat = Math.min(...points.map((point) => point.lat));
  const maxLat = Math.max(...points.map((point) => point.lat));
  const minLon = Math.min(...points.map((point) => point.lon));
  const maxLon = Math.max(...points.map((point) => point.lon));
  const latRange = Math.max(maxLat - minLat, 0.00001);
  const lonRange = Math.max(maxLon - minLon, 0.00001);
  const scale = Math.min(bounds.width / lonRange, bounds.height / latRange);
  const routeWidth = lonRange * scale;
  const routeHeight = latRange * scale;
  const offsetX = bounds.x + (bounds.width - routeWidth) / 2;
  const offsetY = bounds.y + (bounds.height - routeHeight) / 2;

  return points
    .map((point, index) => {
      const x = Math.round(offsetX + (point.lon - minLon) * scale);
      const y = Math.round(offsetY + (maxLat - point.lat) * scale);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function formatActivityType(type: string) {
  const labels: Record<string, string> = {
    run: "Run",
    walk: "Caminata",
    ride: "Bici",
  };

  return labels[type.toLowerCase()] ?? type;
}

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPace(distance: number, duration: number) {
  if (distance <= 0 || duration <= 0) {
    return "--";
  }

  const secondsPerKilometer = duration / (distance / 1000);
  const minutes = Math.floor(secondsPerKilometer / 60);
  const seconds = Math.round(secondsPerKilometer % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds} /km`;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
