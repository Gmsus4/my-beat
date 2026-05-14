import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { parseGpxUploadData } from "@/lib/gpx/parse-activity";
import { prisma } from "@/lib/prisma";

const maxFileSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Completa tu perfil antes de subir actividades." },
        { status: 403 },
      );
    }

    const { fileName, gpxData, size } = await readUploadPayload(request);

    if (!gpxData) {
      return NextResponse.json(
        { error: "Selecciona un archivo GPX." },
        { status: 400 },
      );
    }

    if (!fileName.toLowerCase().endsWith(".gpx")) {
      return NextResponse.json(
        { error: "El archivo debe tener extension .gpx." },
        { status: 400 },
      );
    }

    if (size > maxFileSize) {
      return NextResponse.json(
        { error: "El archivo GPX debe pesar menos de 8 MB." },
        { status: 400 },
      );
    }

    const { activity: parsed, splitsData, chartData, bestEffortsData } =
      await parseGpxUploadData(gpxData);

    await prisma.activity.create({
      data: {
        userId: user.id,
        name: parsed.name,
        type: parsed.type,
        date: parsed.date,
        distance: parsed.distance,
        duration: parsed.duration,
        elevationGain: parsed.elevationGain,
        avgSpeed: parsed.avgSpeed,
        maxSpeed: parsed.maxSpeed,
        avgHeartRate: parsed.avgHeartRate,
        maxHeartRate: parsed.maxHeartRate,
        polyline: parsed.polyline,
        splitsData,
        chartData,
        bestEffortsData,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("GPX upload failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo procesar el archivo GPX.",
      },
      { status: 400 },
    );
  }
}

async function readUploadPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("gpx");

    if (!(file instanceof File)) {
      return { fileName: "", gpxData: "", size: 0 };
    }

    return {
      fileName: file.name,
      gpxData: await readUploadedFile(file),
      size: file.size,
    };
  }

  const payload = (await request.json()) as {
    fileName?: unknown;
    gpxData?: unknown;
  };
  const gpxData = typeof payload.gpxData === "string" ? payload.gpxData : "";

  return {
    fileName: typeof payload.fileName === "string" ? payload.fileName : "",
    gpxData,
    size: new TextEncoder().encode(gpxData).byteLength,
  };
}

async function readUploadedFile(file: File) {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new TextDecoder().decode(await file.arrayBuffer());
}
