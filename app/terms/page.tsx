import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Condiciones del servicio",
  description:
    "Consulta las reglas de uso de MyBeat para subir y compartir actividades deportivas.",
};

const sections = [
  {
    title: "Uso del servicio",
    items: [
      "MyBeat es una plataforma para subir archivos GPX, visualizar actividades fisicas y compartir perfiles de progreso.",
      "El servicio esta pensado para uso personal, informativo y de seguimiento general.",
      "No sustituye consejo medico, diagnostico, tratamiento profesional ni evaluacion de emergencia.",
    ],
  },
  {
    title: "Tu cuenta",
    items: [
      "Para usar MyBeat puedes iniciar sesion con Google.",
      "Eres responsable de mantener el acceso seguro a tu cuenta de Google.",
      "Debes proporcionar informacion verdadera en tu perfil y no suplantar a otras personas.",
    ],
  },
  {
    title: "Archivos y contenido",
    items: [
      "Eres responsable de los archivos GPX que subes y de tener derecho a usarlos.",
      "No debes subir contenido ilegal, ofensivo, falso o que vulnere derechos de terceros.",
      "MyBeat procesa tus archivos para calcular metricas, rutas y visualizaciones dentro de la plataforma.",
    ],
  },
  {
    title: "Privacidad y visibilidad",
    items: [
      "Puedes decidir si una actividad es publica o privada.",
      "Puedes controlar si se muestra el mapa, ritmo, frecuencia cardiaca o calorias cuando una actividad sea publica.",
      "Si compartes un enlace publico, cualquier persona con ese enlace puede ver la informacion marcada como visible.",
    ],
  },
  {
    title: "Disponibilidad y cambios",
    items: [
      "MyBeat puede cambiar, pausar o mejorar funciones con el tiempo.",
      "No garantizamos que el servicio este disponible sin interrupciones.",
      "Podemos actualizar estas condiciones cuando sea necesario para reflejar cambios del producto o requisitos legales.",
    ],
  },
];

export default function TermsPage() {
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
            Terminos
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
            Condiciones del servicio
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            Estas condiciones explican las reglas basicas para usar MyBeat,
            subir actividades y compartir tu perfil.
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
          <h2 className="text-xl font-semibold">Eliminacion de cuenta</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Puedes eliminar tu cuenta desde la configuracion de perfil. Al
            hacerlo, se eliminan tu usuario, actividades, seguidores y seguidos
            asociados a la cuenta.
          </p>
        </section>
      </section>
    </main>
  );
}
