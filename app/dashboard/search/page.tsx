import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FollowButton } from "@/app/components/follow-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      following: {
        select: { followingId: true },
      },
    },
  });

  if (!currentUser) {
    redirect("/onboarding");
  }

  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] ?? "" : q ?? "";
  const normalizedQuery = query.trim();
  const followingIds = new Set(
    currentUser.following.map((follow) => follow.followingId),
  );
  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUser.id },
      ...(normalizedQuery
        ? {
            OR: [
              { username: { contains: normalizedQuery, mode: "insensitive" } },
              { name: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      _count: {
        select: {
          activities: { where: { isPublic: true } },
          followers: true,
        },
      },
    },
  });

  return (
    <main className="px-4 py-8 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            Buscar
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl">
            Encuentra atletas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Sigue usuarios para ver sus actividades públicas en tu inicio.
          </p>
        </div>

        <form className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
          <input
            name="q"
            defaultValue={normalizedQuery}
            placeholder="Buscar por nombre o username"
            className="h-11 w-full rounded-md border border-zinc-800 bg-black px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 sm:h-12"
          />
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-orange-500 px-5 text-sm font-semibold text-black transition hover:bg-orange-400 sm:h-12 sm:w-auto sm:self-end"
          >
            Buscar
          </button>
        </form>

        {users.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/${user.username}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Avatar name={user.name} avatar={user.avatar} />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold sm:text-lg">
                        {user.name}
                      </h2>
                      <p className="truncate text-xs text-zinc-500 sm:text-sm">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                  <div className="shrink-0">
                    <FollowButton
                      username={user.username}
                      isCurrentUser={false}
                      isFollowing={followingIds.has(user.id)}
                    />
                  </div>
                </div>

                {user.bio ? (
                  <p className="mt-3 line-clamp-2 text-xs text-zinc-300 sm:mt-4 sm:text-sm">
                    {user.bio}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 sm:mt-4 sm:text-sm">
                  <span>{user._count.activities} actividades</span>
                  <span>{user._count.followers} seguidores</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold sm:text-xl">
              No encontramos usuarios.
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Prueba con otro nombre o username.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-black text-sm font-semibold text-orange-500 sm:h-12 sm:w-12 sm:text-base">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}