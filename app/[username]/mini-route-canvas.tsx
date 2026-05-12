"use client";

import { useEffect, useRef } from "react";

type RoutePoint = {
  lat: number;
  lon: number;
};

export function MiniRouteCanvas({ points }: { points: RoutePoint[] }) {
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

      const padding = 18;
      const lats = points.map((point) => point.lat);
      const lons = points.map((point) => point.lon);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const latRange = maxLat - minLat || 1;
      const lonRange = maxLon - minLon || 1;
      const scale = Math.min(
        (width - padding * 2) / lonRange,
        (height - padding * 2) / latRange,
      );
      const offsetX = (width - lonRange * scale) / 2;
      const offsetY = (height - latRange * scale) / 2;
      const projected = points.map((point) => ({
        x: offsetX + (point.lon - minLon) * scale,
        y: offsetY + (maxLat - point.lat) * scale,
      }));

      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#f97316";
      context.lineWidth = 3.5;
      context.beginPath();
      context.moveTo(projected[0].x, projected[0].y);

      for (let index = 1; index < projected.length; index += 1) {
        context.lineTo(projected[index].x, projected[index].y);
      }

      context.stroke();
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [points]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-40 w-full rounded-md bg-black"
      aria-label="Ruta GPS"
    />
  );
}
