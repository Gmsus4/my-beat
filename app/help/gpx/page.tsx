import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Como subir un GPX",
  description:
    "Aprende como obtener un archivo GPX desde tus apps deportivas y subirlo a Mybeat.",
};

const steps = [
  {
    title: "1. Exporta tu actividad",
    text: "Abre la actividad en la app o web donde la registraste y busca una opcion como Export GPX, Descargar GPX o Exportar archivo.",
  },
  {
    title: "2. Revisa el archivo",
    text: "El archivo debe terminar en .gpx y venir de una actividad con GPS. Las actividades indoor o sin mapa pueden venir vacias.",
  },
  {
    title: "3. Subelo a Mybeat",
    text: "Entra a Subir GPX, selecciona el archivo y espera a que se calculen distancia, ritmo, elevacion, parciales y ruta.",
  },
];

const sources = [
  {
    name: "Strava",
    href: "https://support.strava.com/hc/en-us/articles/216918437-Exporting-your-Data-and-Bulk-Export",
    title: "Desde Strava",
    steps: [
      "Entra a Strava desde la web.",
      "Abre una actividad propia que tenga mapa/GPS.",
      "Usa el menu de mas opciones y elige Export GPX.",
      "Guarda el archivo .gpx en tu computadora.",
    ],
  },
  {
    name: "Garmin Connect",
    href: "https://support.garmin.com/en-AU/?faq=W1TvTPW8JZ6LfJSfK512Q8",
    title: "Desde Garmin Connect",
    steps: [
      "Entra a Garmin Connect desde un navegador.",
      "Ve a Activities y abre la actividad que quieres exportar.",
      "Usa el icono de engrane en la esquina superior derecha.",
      "Selecciona Export to GPX y descarga el archivo.",
    ],
  },
  {
    name: "Adidas Running / Runtastic",
    href: "https://www.adidas.com/us/help/us-adidas-runtastic/how-do-i-export-or-delete-my-fitness-data",
    title: "Desde Adidas Running",
    steps: [
      "Revisa la version web de Runtastic/adidas Running.",
      "Busca opciones de exportacion o descarga de datos de tu cuenta.",
      "Si la app no entrega GPX directo, puedes sincronizar con Strava o Garmin y exportarlo desde ahi.",
      "Asegurate de subir el archivo .gpx, no capturas ni enlaces.",
    ],
  },
];

const troubleshooting = [
  {
    title: "Mi archivo no sube",
    text: "Confirma que pese menos de 8 MB y que la extension sea .gpx.",
  },
  {
    title: "No aparece el mapa",
    text: "Probablemente la actividad no tiene coordenadas GPS o el GPX viene vacio.",
  },
  {
    title: "Faltan frecuencia cardiaca o cadencia",
    text: "No todos los GPX incluyen sensores. Mybeat muestra esos datos solo cuando vienen dentro del archivo.",
  },
];

export default function GpxHelpPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div>
          <Link
            href="/dashboard/upload"
            className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
          >
            Volver a subir GPX
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            Guia GPX
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
            Como obtener tu archivo GPX y subirlo a Mybeat
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            Un GPX es el archivo que guarda la ruta GPS de una actividad. Mybeat
            lo usa para dibujar el trazo, calcular estadisticas y crear una
            tarjeta visual para tu perfil.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
            >
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{step.text}</p>
            </article>
          ))}
        </div>

        <section className="grid gap-5">
          <div>
            <h2 className="text-2xl font-semibold">Exportar desde tus apps</h2>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Normalmente esto funciona mejor desde computadora, porque muchas
              apps esconden la exportacion en su version web.
            </p>
          </div>

          <div className="grid gap-4">
            {sources.map((source) => (
              <article
                key={source.name}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-semibold">{source.title}</h3>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
                  >
                    Ver ayuda oficial
                  </a>
                </div>
                <ol className="mt-4 grid gap-2 text-sm leading-6 text-zinc-300">
                  {source.steps.map((step) => (
                    <li key={step} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-2xl font-semibold">Subirlo a Mybeat</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
            <p>1. Inicia sesion y entra a Dashboard.</p>
            <p>2. Abre Subir GPX y selecciona tu archivo.</p>
            <p>3. Espera a que termine el procesamiento.</p>
            <p>
              4. Revisa la actividad creada y ajusta si sera publica, si muestra
              mapa, ritmo, frecuencia cardiaca o calorias.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400"
          >
            Subir un GPX
          </Link>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Problemas comunes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {troubleshooting.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-5"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
