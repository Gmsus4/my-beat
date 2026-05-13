import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050505",
          color: "white",
          padding: "72px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: "#f97316",
            fontSize: "30px",
            fontWeight: 700,
          }}
        >
          <span>Mybeat</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <h1
            style={{
              margin: 0,
              maxWidth: "900px",
              fontSize: "82px",
              lineHeight: 1,
              letterSpacing: 0,
            }}
          >
            Tus actividades GPX, visuales y compartibles.
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "780px",
              color: "#d4d4d8",
              fontSize: "30px",
              lineHeight: 1.35,
            }}
          >
            Sube rutas, revisa ritmos, comparte perfiles y sigue a otros
            atletas.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "18px",
            color: "#a1a1aa",
            fontSize: "24px",
          }}
        >
          <span>GPX</span>
          <span>/</span>
          <span>Run</span>
          <span>/</span>
          <span>Bici</span>
          <span>/</span>
          <span>Caminar</span>
        </div>
      </div>
    ),
    size,
  );
}
