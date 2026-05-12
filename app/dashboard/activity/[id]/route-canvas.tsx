"use client";

import { useEffect, useRef } from "react";

type RoutePoint = {
  lat: number;
  lon: number;
};

export function RouteCanvas({ points }: { points: RoutePoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || points.length < 2) {
      return;
    }

    const draw = () => {
      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      const ratio = Math.min(window.devicePixelRatio || 1, 3);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const padding = 28;
      const smoothedPoints = smoothPoints(points);
      const lats = smoothedPoints.map((point) => point.lat);
      const lons = smoothedPoints.map((point) => point.lon);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const latRange = maxLat - minLat || 1;
      const lonRange = maxLon - minLon || 1;
      const drawableWidth = width - padding * 2;
      const drawableHeight = height - padding * 2;
      const scale = Math.min(
        drawableWidth / lonRange,
        drawableHeight / latRange,
      );
      const routeWidth = lonRange * scale;
      const routeHeight = latRange * scale;
      const offsetX = (width - routeWidth) / 2;
      const offsetY = (height - routeHeight) / 2;

      const projectedPoints = smoothedPoints.map((point) => ({
        x: offsetX + (point.lon - minLon) * scale,
        y: offsetY + (maxLat - point.lat) * scale,
      }));

      context.lineCap = "round";
      context.lineJoin = "round";
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.shadowColor = "rgba(249, 115, 22, 0.28)";
      context.shadowBlur = 12;
      context.strokeStyle = "#f97316";
      context.lineWidth = 5;
      drawSmoothPath(context, projectedPoints);

      context.shadowColor = "transparent";
      context.strokeStyle = "rgba(255, 255, 255, 0.18)";
      context.lineWidth = 1.5;
      drawSmoothPath(context, projectedPoints);

      const start = projectedPoints[0];
      const end = projectedPoints[projectedPoints.length - 1];

      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(start.x, start.y, 4, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#f97316";
      context.beginPath();
      context.arc(end.x, end.y, 5, 0, Math.PI * 2);
      context.fill();
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
        Sin coordenadas para dibujar ruta.
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="block h-80 w-full rounded-lg border border-zinc-800 bg-zinc-950"
      aria-label="Ruta GPS de la actividad"
    />
  );
}

function drawSmoothPath(
  context: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  if (points.length < 2) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midpoint = {
      x: (current.x + next.x) / 2,
      y: (current.y + next.y) / 2,
    };

    context.quadraticCurveTo(current.x, current.y, midpoint.x, midpoint.y);
  }

  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
  context.stroke();
}

function smoothPoints(points: RoutePoint[]) {
  if (points.length < 5) {
    return points;
  }

  return points.map((point, index) => {
    if (index < 2 || index > points.length - 3) {
      return point;
    }

    const window = points.slice(index - 2, index + 3);

    return {
      lat:
        window.reduce((sum, current) => sum + current.lat, 0) / window.length,
      lon:
        window.reduce((sum, current) => sum + current.lon, 0) / window.length,
    };
  });
}
