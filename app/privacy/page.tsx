import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de privacidad",
  description:
    "Conoce como MyBeat usa tu cuenta de Google y los archivos GPX que subes.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "Datos que recopilamos",
    items: [
      "Datos basicos de tu cuenta de Google, como nombre, correo e imagen de perfil, para crear tu cuenta e iniciar sesion.",
      "Archivos GPX que subes voluntariamente para generar tus actividades, metricas y visualizaciones.",
      "Datos derivados del GPX, como distancia, duracion, ritmo, elevacion, frecuencia cardiaca si el archivo la incluye, y coordenadas GPS.",
    ],
  },
  {
    title: "Como usamos tus datos",
    items: [
      "Para mostrar tu dashboard privado y tu perfil publico cuando decidas compartir actividades.",
      "Para calcular metricas deportivas y generar tarjetas visuales a partir de tus archivos GPX.",
      "Para permitirte controlar que datos se muestran publicamente, como mapa, ritmo, frecuencia cardiaca o calorias.",
    ],
  },
  {
    title: "Privacidad geografica",
    items: [
      "MyBeat permite ocultar el mapa de una actividad publica para reducir la exposicion de tus rutas y habitos de movimiento.",
      "Si decides mostrar el mapa, la ruta puede ser visible para cualquier persona con acceso a tu perfil publico.",
      "Tu control de visibilidad se configura por actividad desde tu dashboard.",
    ],
  },
  {
    title: "Comparticion y terceros",
    items: [
      "No vendemos tus datos personales.",
      "No compartimos tus archivos GPX con terceros para publicidad.",
      "Usamos proveedores necesarios para operar el servicio, como autenticacion, base de datos y hosting.",
    ],
  },
  {
    title: "Control y eliminacion",
    items: [
      "Puedes editar tu perfil y la visibilidad de tus actividades desde el dashboard.",
      "Puedes eliminar actividades individuales.",
      "Puedes eliminar tu cuenta desde la configuracion de perfil; esto elimina tu usuario, actividades y relaciones de seguimiento.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
          >
            Volver a MyBeat
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            Privacidad
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
            Politica de privacidad
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            MyBeat esta pensado para documentar y compartir actividad fisica con
            control. Esta politica explica que datos usamos y como protegemos tu
            informacion.
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Ultima actualizacion: 14 de mayo de 2026
          </p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-xl font-semibold">Contacto</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Si tienes preguntas sobre esta politica o sobre tus datos, contacta
            al responsable de MyBeat desde el canal de soporte que se publique
            en la aplicacion.
          </p>
        </section>
      </section>
    </main>
  );
}
