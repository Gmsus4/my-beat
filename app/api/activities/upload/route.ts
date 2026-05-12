import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { parseGpxActivity } from "@/lib/gpx/parse-activity";
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

    const payload = (await request.json()) as {
      fileName?: unknown;
      gpxData?: unknown;
    };
    const fileName =
      typeof payload.fileName === "string" ? payload.fileName : "";
    const gpxData = typeof payload.gpxData === "string" ? payload.gpxData : "";

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

    if (new TextEncoder().encode(gpxData).byteLength > maxFileSize) {
      return NextResponse.json(
        { error: "El archivo GPX debe pesar menos de 8 MB." },
        { status: 400 },
      );
    }

    const parsed = await parseGpxActivity(gpxData);

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
        gpxData,
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
