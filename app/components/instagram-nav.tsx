"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type InstagramNavProps = {
  user: {
    username: string;
    name: string;
    avatar: string | null;
  } | null;
};

export function InstagramNav({ user }: InstagramNavProps) {
  const pathname = usePathname();
  const publicProfileHref = user ? `/${user.username}` : "/";
  const items = user
      ? [
        { href: "/", label: "Inicio", icon: HomeIcon },
        { href: "/dashboard", label: "Dashboard", icon: StatsIcon },
        { href: "/dashboard/search", label: "Buscar", icon: SearchIcon },
        { href: "/dashboard/upload", label: "Crear", icon: PlusIcon },
        { href: "/dashboard/profile", label: "Perfil", icon: UserIcon },
        { href: publicProfileHref, label: "Publico", icon: GlobeIcon },
      ]
    : [{ href: "/", label: "Entrar", icon: HomeIcon }];

  return (
    <>
      <aside className="group fixed inset-y-0 left-0 z-50 hidden w-[76px] border-r border-zinc-900 bg-black px-3 py-6 transition-[width] duration-200 ease-out hover:w-[244px] lg:flex lg:flex-col">
        <Link
          href={user ? "/dashboard" : "/"}
          className="mb-8 flex h-10 items-center gap-3 overflow-hidden px-3"
          aria-label="Mybeat"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/android-chrome-192x192.png"
              alt="Mybeat"
              width={32}
              height={32}
              className="h-8 w-8 max-w-none shrink-0 object-contain"
            />
          </span>
          <span className="whitespace-nowrap text-2xl font-semibold uppercase tracking-normal opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            mybeat
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActive(pathname, item.href)}
              Icon={item.icon}
            />
          ))}
        </nav>

        {user ? (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={publicProfileHref}
              className="flex items-center gap-3 overflow-hidden rounded-lg px-3 py-3 transition hover:bg-zinc-900"
            >
              <span className="flex w-6 shrink-0 items-center justify-center">
                <Avatar user={user} />
              </span>
              <div className="min-w-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-zinc-500">
                  @{user.username}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 overflow-hidden rounded-lg px-3 py-3 text-left text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-red-200"
            >
              <span className="flex w-6 shrink-0 items-center justify-center">
                <LogoutIcon />
              </span>
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                Cerrar sesion
              </span>
            </button>
          </div>
        ) : null}
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-zinc-900 bg-black/95 px-2 py-2 backdrop-blur lg:hidden">
        {items.slice(0, 5).map((item) => (
          <MobileNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            active={isActive(pathname, item.href)}
            Icon={item.icon}
          />
        ))}
      </nav>
    </>
  );
}

function NavLink({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: () => React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex items-center gap-4 overflow-hidden rounded-lg bg-zinc-900 px-3 py-3 text-base font-semibold text-white"
          : "flex items-center gap-4 overflow-hidden rounded-lg px-3 py-3 text-base font-medium text-zinc-200 transition hover:bg-zinc-900 hover:text-white"
      }
    >
      <span className="flex w-6 shrink-0 items-center justify-center">
        <Icon />
      </span>
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: () => React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex flex-col items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white"
          : "flex flex-col items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500"
      }
    >
      <Icon />
      <span>{label}</span>
    </Link>
  );
}

function Avatar({
  user,
}: {
  user: { name: string; username: string; avatar: string | null };
}) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 text-sm font-semibold text-orange-500">
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : (
        user.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  // Rutas exactas que no deben activar subrutas
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m16.5 16.5 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M5 19V9M12 19V5M19 19v-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M4 19h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 21a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
