import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { FollowButton } from "@/app/components/follow-button";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type FollowingPageProps = {
  params: Promise<{ username: string }>;
};

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { username } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      following: {
        orderBy: { createdAt: "desc" },
        select: {
          following: {
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
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  if (user.username !== username) {
    notFound();
  }

  return (
    <main className="px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Header
          username={user.username}
          title="Siguiendo"
          detail="Personas cuyas actividades aparecen en tu inicio."
        />

        {user.following.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {user.following.map(({ following }) => (
              <SocialUserCard
                key={following.id}
                user={following}
                isCurrentUser={false}
                isFollowing
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Aun no sigues a nadie." />
        )}
      </section>
    </main>
  );
}

function Header({
  username,
  title,
  detail,
}: {
  username: string;
  title: string;
  detail: string;
}) {
  return (
    <div>
      <Link
        href={`/${username}`}
        className="text-sm font-semibold text-orange-500 transition hover:text-orange-400"
      >
        Volver al perfil
      </Link>
      <h1 className="mt-5 text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">{detail}</p>
    </div>
  );
}

function SocialUserCard({
  user,
  isCurrentUser,
  isFollowing,
}: {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    _count: {
      activities: number;
      followers: number;
    };
  };
  isCurrentUser: boolean;
  isFollowing: boolean;
}) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/${user.username}`} className="flex min-w-0 items-center gap-3">
          <Avatar name={user.name} avatar={user.avatar} />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{user.name}</h2>
            <p className="truncate text-sm text-zinc-500">@{user.username}</p>
          </div>
        </Link>
        <FollowButton
          username={user.username}
          isCurrentUser={isCurrentUser}
          isFollowing={isFollowing}
        />
      </div>

      {user.bio ? (
        <p className="mt-4 line-clamp-2 text-sm text-zinc-300">{user.bio}</p>
      ) : null}

      <div className="mt-4 flex gap-4 text-sm text-zinc-500">
        <span>{user._count.activities} actividades</span>
        <span>{user._count.followers} seguidores</span>
      </div>
    </article>
  );
}

function Avatar({ name, avatar }: { name: string; avatar: string | null }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-black text-base font-semibold text-orange-500">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-zinc-400">
        Busca usuarios para empezar a construir tu inicio.
      </p>
    </div>
  );
}
