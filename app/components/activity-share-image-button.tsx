"use client";

import { useState } from "react";

type RoutePoint = {
  lat: number;
  lon: number;
};

type ShareMetric = {
  label: string;
  value: string;
};

type ActivityShareImageButtonProps = {
  activityName: string;
  metrics: ShareMetric[];
  points: RoutePoint[];
  shareUrl?: string | null;
  showDownload?: boolean;
};

const imageWidth = 1080;
const imageHeight = 1920;

export function ActivityShareImageButton({
  activityName,
  metrics,
  points,
  shareUrl,
  showDownload = true,
}: ActivityShareImageButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = imageWidth;
      canvas.height = imageHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      await document.fonts.load("900 68px Outfit");

      drawShareImage(context, {
        activityName,
        metrics,
        points,
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(activityName)}-mybeat-transparente.png`;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleShare() {
    if (!shareUrl) {
      setShareMessage("Haz publica la actividad para compartirla.");
      return;
    }

    const url = new URL(shareUrl, window.location.origin).toString();
    const shareData = {
      title: activityName,
      text: `Mira mi actividad en Mybeat: ${activityName}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage(null);
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareMessage("Link copiado.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setShareMessage("No se pudo compartir. Intentalo de nuevo.");
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      {showDownload ? (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generando..." : "Descargar imagen PNG"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-orange-500 hover:text-orange-400"
      >
        Compartir actividad
      </button>
      {shareMessage ? (
        <p className="text-center text-xs text-zinc-500">{shareMessage}</p>
      ) : null}
    </div>
  );
}

function drawShareImage(
  context: CanvasRenderingContext2D,
  {
    metrics,
    points,
  }: ActivityShareImageButtonProps,
) {
  context.clearRect(0, 0, imageWidth, imageHeight);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.5)";
  context.shadowBlur = 10;
  context.shadowOffsetY = 4;

  const topMetricY = 295;
  const metricGap = 310;

  metrics.slice(0, 3).forEach((metric, index) => {
    const y = topMetricY + index * metricGap;
    context.fillStyle = "#ffffff";
    context.font = "800 54px Arial, sans-serif";
    context.fillText(metric.label, imageWidth / 2, y);
    context.font = "900 118px Arial, sans-serif";
    context.fillText(metric.value, imageWidth / 2, y + 104);
  });

  drawRoute(context, points, {
    x: 300,
    y: 1250,
    width: 480,
    height: 330,
  });

  context.fillStyle = "#ffffff";
  context.font = "900 72px Outfit, Arial, sans-serif";
  drawTrackedText(context, "MYBEAT", imageWidth / 2, 1738, 7);
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
}

function drawRoute(
  context: CanvasRenderingContext2D,
  points: RoutePoint[],
  bounds: { x: number; y: number; width: number; height: number },
) {
  const validPoints = points.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lon),
  );

  if (validPoints.length < 2) {
    return;
  }

  const minLat = Math.min(...validPoints.map((point) => point.lat));
  const maxLat = Math.max(...validPoints.map((point) => point.lat));
  const minLon = Math.min(...validPoints.map((point) => point.lon));
  const maxLon = Math.max(...validPoints.map((point) => point.lon));
  const latRange = Math.max(maxLat - minLat, 0.00001);
  const lonRange = Math.max(maxLon - minLon, 0.00001);
  const scale = Math.min(bounds.width / lonRange, bounds.height / latRange);
  const routeWidth = lonRange * scale;
  const routeHeight = latRange * scale;
  const offsetX = bounds.x + (bounds.width - routeWidth) / 2;
  const offsetY = bounds.y + (bounds.height - routeHeight) / 2;

  context.beginPath();
  validPoints.forEach((point, index) => {
    const x = offsetX + (point.lon - minLon) * scale;
    const y = offsetY + (maxLat - point.lat) * scale;

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.strokeStyle = "#f97316";
  context.lineWidth = 12;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  const characters = text.split("");
  const width =
    characters.reduce(
      (sum, character) => sum + context.measureText(character).width,
      0,
    ) +
    tracking * (characters.length - 1);
  let cursor = x - width / 2;

  context.textAlign = "left";
  characters.forEach((character) => {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + tracking;
  });
  context.textAlign = "center";
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "actividad"
  );
}
