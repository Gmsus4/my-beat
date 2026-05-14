import Link from "next/link";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaSpotify,
  FaApple,
  FaYoutube,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { SiStrava, SiYoutubemusic, SiThreads } from "react-icons/si";

import { MiniRouteCanvas } from "@/app/[username]/mini-route-canvas";
import { ProfileStatsPanel } from "@/app/[username]/profile-stats-panel";
import { ActivityTypeFilter } from "@/app/components/activity-type-filter";
import { DateRangeFilter } from "@/app/components/date-range-filter";
import { FollowButton } from "@/app/components/follow-button";
import { ShareProfileButton } from "@/app/components/share-profile-button";
import {
  getActivityDateFilter,
  getActivityDateRangeLabel,
  normalizeActivityDateRange,
} from "@/lib/activity-date-filter";
import { authOptions } from "@/lib/auth";
import {
  bestEffortTargetDistances,
  type BestEffort,
} from "@/lib/gpx/parse-activity";
import { readStoredBestEfforts } from "@/lib/gpx/stored-activity-data";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    range?: string | string[];
    type?: string | string[];
  }>;
};

type RoutePoint = {
  lat: number;
  lon: number;
};

const reservedRoutes = new Set(["api", "dashboard", "onboarding"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  if (reservedRoutes.has(username.toLowerCase())) {
    return {};
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      avatar: true,
      socialPlatform1: true,
      socialUrl1: true,
      socialPlatform2: true,
      socialUrl2: true,
      socialPlatform3: true,
      socialUrl3: true,
      healthPlatform: true,
      healthUrl: true,
      musicPlatform: true,
      musicUrl: true,
      _count: {
        select: {
          activities: { where: { isPublic: true } },
          followers: true,
        },
      },
    },
  });

  if (!user) {
    return {
      title: "Perfil no encontrado",
    };
  }

  const title = `${user.name} (@${user.username})`;
  const description =
    user.bio ||
    `${user._count.activities} actividades publicas en Mybeat. ${user._count.followers} seguidores.`;
  const images = getSquareProfileImages(user.avatar);

  return {
    title,
    description,
    alternates: {
      canonical: `/${user.username}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${user.username}`,
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary" : "summary",
      title,
      description,
      images,
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params;
  const { range, type } = await searchParams;
  const activeRange = normalizeActivityDateRange(range);
  const fromDate = getActivityDateFilter(activeRange);
  const activeType = normalizeActivityTypeFilter(type);
  const session = await getServerSession(authOptions);

  if (reservedRoutes.has(username.toLowerCase())) {
    notFound();
  }

  const [user, currentUser, activityTypes] = await Promise.all([
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        cover: true,
        bio: true,
        socialPlatform1: true,
        socialUrl1: true,
        socialPlatform2: true,
        socialUrl2: true,
        socialPlatform3: true,
        socialUrl3: true,
        healthPlatform: true,
        healthUrl: true,
        musicPlatform: true,
        musicUrl: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        activities: {
          where: {
            isPublic: true,
            ...(fromDate ? { date: { gte: fromDate } } : {}),
            ...(activeType ? { type: activeType } : {}),
          },
          orderBy: { date: "desc" },
          select: {
            id: true,
            name: true,
            type: true,
            date: true,
            distance: true,
            duration: true,
            elevationGain: true,
            avgHeartRate: true,
            calories: true,
            polyline: true,
            showMap: true,
            showHeartRate: true,
            showSpeed: true,
            showCalories: true,
            bestEffortsData: true,
          },
        },
      },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            following: {
              select: { followingId: true },
            },
          },
        })
      : null,
    prisma.activity.findMany({
      where: {
        isPublic: true,
        user: { username },
        ...(fromDate ? { date: { gte: fromDate } } : {}),
      },
      distinct: ["type"],
      orderBy: { type: "asc" },
      select: { type: true },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const isCurrentUser = currentUser?.id === user.id;
  const isFollowing =
    currentUser?.following.some((follow) => follow.followingId === user.id) ??
    false;
  const totalDistance = user.activities.reduce(
    (sum, activity) => sum + activity.distance,
    0,
  );
  const publicStats = getPublicProfileStats(user.activities);
  const lifetimeStats = await getLifetimePublicStats(user.id);
  const medals = getPublicMedals(user.activities);
  const activities = user.activities;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-zinc-900">
        <div
          className="h-48 bg-zinc-950"
          style={
            user.cover
              ? {
                  backgroundImage: `url(${user.cover})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : undefined
          }
        />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 pb-8">
          <div className="-mt-8 flex flex-col gap-5 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 !rounded-full text-2xl font-semibold text-orange-500 sm:h-24 sm:w-24 sm:text-3xl">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-2xl font-semibold tracking-normal sm:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-1 truncate text-sm text-zinc-400 sm:text-base">
                  @{user.username}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <FollowButton
                username={user.username}
                isCurrentUser={isCurrentUser}
                isFollowing={isFollowing}
              />
              <ShareProfileButton
                name={user.name}
                username={user.username}
                profilePath={`/${user.username}`}
              />
              {isCurrentUser ? (
                <>
                <Link
                  href="/dashboard/profile"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-orange-500 px-4 text-sm font-semibold text-black transition hover:bg-orange-400"
                >
                  Editar perfil
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-orange-500 hover:text-orange-200"
                >
                  Editar actividades
                </Link>
                </>
              ) : null}
            </div>
          </div>

          {user.bio ? (
            <p className="max-w-2xl text-zinc-300">{user.bio}</p>
          ) : null}

          <SocialLinks
            socialLinks={[
              { platform: user.socialPlatform1, url: user.socialUrl1 },
              { platform: user.socialPlatform2, url: user.socialUrl2 },
              { platform: user.socialPlatform3, url: user.socialUrl3 },
            ]}
            healthPlatform={user.healthPlatform}
            healthUrl={user.healthUrl}
            musicPlatform={user.musicPlatform}
            musicUrl={user.musicUrl}
          />

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-400">
            <ProfileStat
              label="Actividades"
              value={user.activities.length.toString()}
              icon="activities"
            />
            <ProfileStat
              label="Distancia"
              value={formatDistance(totalDistance)}
              icon="distance"
            />
            <ProfileStat
              label="Desde"
              value={new Intl.DateTimeFormat("es-MX", {
                month: "short",
                year: "numeric",
              }).format(user.createdAt)}
              icon="calendar"
            />
            <ProfileStat
              label="Seguidores"
              value={user._count.followers.toString()}
              href={isCurrentUser ? `/${user.username}/followers` : undefined}
              icon="followers"
            />
            <ProfileStat
              label="Siguiendo"
              value={user._count.following.toString()}
              href={isCurrentUser ? `/${user.username}/following` : undefined}
              icon="following"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
          <div className="order-2 min-w-0 lg:order-1">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                  Actividades
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Publicas - {getActivityDateRangeLabel(activeRange)}
                </h2>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/95 p-3 lg:sticky lg:top-6 lg:z-20">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Fechas
                </p>
                <DateRangeFilter
                  activeRange={activeRange}
                  activityType={activeType}
                  basePath={`/${user.username}`}
                />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Tipo
                </p>
                <ActivityTypeFilter
                  activeRange={activeRange}
                  activeType={activeType}
                  basePath={`/${user.username}`}
                  types={activityTypes.map((activity) => activity.type)}
                />
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {activities.map((activity) => {
                  const points = parsePolyline(activity.polyline);

                  return (
                    <Link
                      key={activity.id}
                      href={
                        isCurrentUser
                          ? `/dashboard/activity/${activity.id}`
                          : `/${user.username}/activity/${activity.id}`
                      }
                      className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-orange-500/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                            {activity.type}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold">
                            {activity.name}
                          </h3>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {isCurrentUser
                            ? "Editar"
                            : formatShortDate(activity.date)}
                        </p>
                      </div>

                      {activity.showMap ? (
                        <div className="mt-4">
                          <MiniRouteCanvas points={points} />
                        </div>
                      ) : null}

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <ActivityStat
                          label="Distancia"
                          value={formatDistance(activity.distance)}
                        />
                        {activity.showSpeed ? (
                          <ActivityStat
                            label="Ritmo"
                            value={formatPace(
                              activity.distance,
                              activity.duration,
                            )}
                          />
                        ) : null}
                        <ActivityStat
                          label="Tiempo"
                          value={formatDuration(activity.duration)}
                        />
                        <ActivityStat
                          label="Elevacion"
                          value={formatElevation(activity.elevationGain)}
                        />
                        {activity.showHeartRate ? (
                          <ActivityStat
                            label="FC"
                            value={formatHeartRate(activity.avgHeartRate)}
                          />
                        ) : null}
                        {activity.showCalories ? (
                          <ActivityStat
                            label="Calorias"
                            value={formatCalories(activity.calories)}
                          />
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-8">
                <h3 className="text-xl font-semibold">
                  Sin actividades publicas.
                </h3>
              </div>
            )}
          </div>

          <aside className="order-1 lg:sticky lg:top-6 lg:order-2">
            <ProfileStatsPanel>
              <StatsTableSection title="Mejores tiempos">
                {medals.bestEfforts.map((effort) => (
                  <MedalTableRow
                    key={effort.distance}
                    label={formatRaceDistance(effort.distance)}
                    duration={effort.duration}
                  />
                ))}
              </StatsTableSection>

              <StatsTableSection
                title={getActivityDateRangeLabel(activeRange) ?? "Periodo"}
              >
                <StatsTableRow
                  label="Actividades"
                  value={user.activities.length.toString()}
                />
                <StatsTableRow
                  label="Distancia"
                  value={formatDistance(publicStats.totalDistance)}
                />
                <StatsTableRow
                  label="Duracion"
                  value={formatCompactDuration(publicStats.totalDuration)}
                />
                <StatsTableRow
                  label="Desnivel positivo"
                  value={formatElevation(publicStats.totalElevation)}
                />
              </StatsTableSection>

              <StatsTableSection title="Totales">
                <StatsTableRow
                  label="Actividades"
                  value={lifetimeStats.activityCount.toString()}
                />
                <StatsTableRow
                  label="Distancia"
                  value={formatDistance(lifetimeStats.totalDistance)}
                />
                <StatsTableRow
                  label="Duracion"
                  value={formatCompactDuration(lifetimeStats.totalDuration)}
                />
                <StatsTableRow
                  label="Desnivel positivo"
                  value={formatElevation(lifetimeStats.totalElevation)}
                />
              </StatsTableSection>
            </ProfileStatsPanel>
          </aside>
        </div>
      </section>
    </main>
  );
}

function getSquareProfileImages(url: string | null) {
  return url
    ? [
        {
          url: getAbsoluteUrl(url),
          width: 1200,
          height: 1200,
          alt: "Foto de perfil",
        },
      ]
    : [];
}

function getAbsoluteUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return new URL(path, baseUrl).toString();
}

function ProfileStat({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: string;
  href?: string;
  icon: ProfileStatIcon;
}) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <ProfileStatIcon name={icon} />
      <span className="font-semibold text-white">{value}</span>
      <span>{label.toLowerCase()}</span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center transition hover:text-orange-400"
      >
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center">{content}</div>;
}

type ProfileStatIcon =
  | "activities"
  | "distance"
  | "calendar"
  | "followers"
  | "following";

function ProfileStatIcon({ name }: { name: ProfileStatIcon }) {
  const commonProps = {
    className: "h-4 w-4 shrink-0 text-zinc-500",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "activities") {
    return (
      <svg {...commonProps}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === "distance") {
    return (
      <svg {...commonProps}>
        <path d="M4 17c3-6 5-6 8 0s5 6 8 0" />
        <circle cx="5" cy="7" r="2" />
        <circle cx="19" cy="7" r="2" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...commonProps}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }

  if (name === "followers") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4v2" />
      <circle cx="13.5" cy="7" r="4" />
      <path d="M3 8h4" />
      <path d="M5 6v4" />
    </svg>
  );
}

function SocialLinks({
  socialLinks,
  healthPlatform,
  healthUrl,
  musicPlatform,
  musicUrl,
}: {
  socialLinks: {
    platform: string | null;
    url: string | null;
  }[];
  healthPlatform: string | null;
  healthUrl: string | null;
  musicPlatform: string | null;
  musicUrl: string | null;
}) {
  const links = [
    ...socialLinks
      .filter(
        (link): link is { platform: string; url: string } =>
          Boolean(link.platform && link.url),
      )
      .map((link) => ({
        href: link.url,
        label: getSocialPlatformLabel(link.platform),
        icon: getSocialIcon(link.platform),
      })),
    healthUrl && healthPlatform
      ? {
          href: healthUrl,
          label: getHealthPlatformLabel(healthPlatform),
          icon: getHealthIcon(healthPlatform),
        }
      : null,
    musicUrl && musicPlatform
      ? {
          href: musicUrl,
          label: getMusicPlatformLabel(musicPlatform),
          icon: getMusicIcon(musicPlatform),
        }
      : null,
  ].filter((link): link is { href: string; label: string; icon: SocialIconName } =>
    Boolean(link?.href),
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-800 px-3 text-sm font-semibold text-zinc-200 transition hover:border-orange-500 hover:text-orange-400"
        >
          <SocialIcon name={link.icon} />
          {link.label}
        </a>
      ))}
    </div>
  );
}

type SocialIconName =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "x"
  | "youtube"
  | "threads"
  | "linkedin"
  | "strava"
  | "spotify"
  | "youtubeMusic"
  | "appleMusic"
  | "health";

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "instagram") {
    return <FaInstagram className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "facebook") {
    return <FaFacebookF className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "tiktok") {
    return <FaTiktok className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "x") {
    return <FaTwitter className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "youtube") {
    return <FaYoutube className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "threads") {
    return <SiThreads className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "linkedin") {
    return <FaLinkedinIn className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "strava") {
    return <SiStrava className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "spotify") {
    return <FaSpotify className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "youtubeMusic") {
    return <SiYoutubemusic className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  if (name === "appleMusic") {
    return <FaApple className="h-4 w-4 shrink-0" aria-hidden="true" />;
  }

  const commonProps = {
    className: "h-4 w-4 shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  return (
    <svg {...commonProps}>
      <path d="m8 16 4-10 4 10" />
      <path d="m10.5 14 1.5 4 1.5-4" />
    </svg>
  );
}

function getHealthIcon(platform: string): SocialIconName {
  return platform === "strava" ? "strava" : "health";
}

function getSocialIcon(platform: string): SocialIconName {
  const icons: Record<string, SocialIconName> = {
    instagram: "instagram",
    facebook: "facebook",
    tiktok: "tiktok",
    x: "x",
    youtube: "youtube",
    threads: "threads",
    linkedin: "linkedin",
  };

  return icons[platform] ?? "instagram";
}

function getSocialPlatformLabel(platform: string) {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    x: "X",
    youtube: "YouTube",
    threads: "Threads",
    linkedin: "LinkedIn",
  };

  return labels[platform] ?? "Red social";
}

function getMusicIcon(platform: string): SocialIconName {
  if (platform === "spotify") {
    return "spotify";
  }

  if (platform === "youtubeMusic") {
    return "youtubeMusic";
  }

  if (platform === "appleMusic") {
    return "appleMusic";
  }

  return "health";
}

function getHealthPlatformLabel(platform: string) {
  const labels: Record<string, string> = {
    strava: "Strava",
    garmin: "Garmin",
    adidas: "Adidas Running",
    huawei: "Huawei Health",
    nike: "Nike Run Club",
    coros: "COROS",
    polar: "Polar Flow",
    suunto: "Suunto",
  };

  return labels[platform] ?? "Salud";
}

function getMusicPlatformLabel(platform: string) {
  const labels: Record<string, string> = {
    spotify: "Spotify",
    youtubeMusic: "YouTube Music",
    appleMusic: "Apple Music",
  };

  return labels[platform] ?? "Musica";
}

function StatsTableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-zinc-800 pb-2 last:border-b-0 last:pb-0 [&+&]:pt-2">
      <div className="bg-black px-3 py-2.5 text-sm font-semibold text-white">
        {title}
      </div>
      <div className="divide-y divide-zinc-800">{children}</div>
    </div>
  );
}

function StatsTableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-xs odd:bg-zinc-900/45 even:bg-black/30">
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function MedalTableRow({
  label,
  duration,
}: {
  label: string;
  duration: number | null;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-xs odd:bg-black/30 even:bg-zinc-900/45">
      <span className="font-medium text-zinc-200">{label}</span>
      <span className="font-semibold text-orange-400">
        {duration ? formatDuration(duration) : "--"}
      </span>
    </div>
  );
}

function ActivityStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function parsePolyline(polyline: string | null): RoutePoint[] {
  if (!polyline) {
    return [];
  }

  try {
    const parsed = JSON.parse(polyline) as RoutePoint[];

    return Array.isArray(parsed)
      ? parsed.filter(
          (point) =>
            typeof point.lat === "number" && typeof point.lon === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPace(distance: number, duration: number) {
  if (distance <= 0 || duration <= 0) {
    return "--";
  }

  const secondsPerKilometer = duration / (distance / 1000);
  const minutes = Math.floor(secondsPerKilometer / 60);
  const seconds = Math.round(secondsPerKilometer % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds} /km`;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatCompactDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

function formatElevation(elevation: number | null) {
  return elevation === null ? "--" : `${Math.round(elevation)} m`;
}

function formatHeartRate(heartRate: number | null) {
  return heartRate === null ? "--" : `${heartRate} ppm`;
}

function formatCalories(calories: number | null) {
  return calories === null ? "--" : `${calories} kcal`;
}

function normalizeActivityTypeFilter(type: string | string[] | undefined) {
  const value = Array.isArray(type) ? type[0] : type;
  const normalized = value?.trim().toLowerCase();

  return normalized || null;
}

function formatRaceDistance(distance: number) {
  if (distance === 400) {
    return "400 m";
  }

  if (distance === 804.672) {
    return "1/2 milla";
  }

  if (distance === 1000) {
    return "1 km";
  }

  if (distance === 1609.344) {
    return "1 milla";
  }

  if (distance === 3218.688) {
    return "2 millas";
  }

  if (distance === 21097.5) {
    return "21K";
  }

  if (distance === 42195) {
    return "42K";
  }

  return `${Math.round(distance / 1000)}K`;
}

function getPublicProfileStats(
  activities: {
    name: string;
    distance: number;
    duration: number;
    elevationGain: number | null;
  }[],
) {
  const totalDistance = activities.reduce(
    (sum, activity) => sum + activity.distance,
    0,
  );
  const totalDuration = activities.reduce(
    (sum, activity) => sum + activity.duration,
    0,
  );
  const totalElevation = activities.reduce(
    (sum, activity) => sum + (activity.elevationGain ?? 0),
    0,
  );
  const longestActivity = activities.reduce<
    { name: string; distance: number } | null
  >((longest, activity) => {
    if (!longest || activity.distance > longest.distance) {
      return { name: activity.name, distance: activity.distance };
    }

    return longest;
  }, null);

  return {
    totalDistance,
    totalDuration,
    totalElevation,
    longestActivity,
    marathonEquivalent: totalDistance / 42195,
    averageDistance:
      activities.length > 0 ? totalDistance / activities.length : 0,
  };
}

function getPublicMedals(
  activities: {
    distance: number;
    duration: number;
    elevationGain: number | null;
    showSpeed: boolean;
    bestEffortsData?: unknown;
  }[],
) {
  const visibleSpeedActivities = activities.filter((activity) => activity.showSpeed);

  return {
    bestEfforts: bestEffortTargetDistances.map((distance) => {
      const best = visibleSpeedActivities.reduce<BestEffort | null>(
        (currentBest, activity) => {
          const storedBestEffort = readStoredBestEfforts(
            activity.bestEffortsData,
          ).find((effort) => effort.distance === distance);
          const candidate =
            storedBestEffort ?? getEstimatedBestEffort(activity, distance);

          if (!candidate) {
            return currentBest;
          }

          if (!currentBest || candidate.duration < currentBest.duration) {
            return candidate;
          }

          return currentBest;
        },
        null,
      );

      return {
        distance,
        duration: best?.duration ?? null,
      };
    }),
  };
}

function getEstimatedBestEffort(
  activity: {
    distance: number;
    duration: number;
  },
  distance: number,
) {
  if (activity.distance < distance || activity.distance <= 0) {
    return null;
  }

  const estimatedDuration = Math.round(
    activity.duration * (distance / activity.distance),
  );

  return { distance, duration: estimatedDuration };
}

async function getLifetimePublicStats(userId: string) {
  const result = await prisma.activity.aggregate({
    where: {
      userId,
      isPublic: true,
    },
    _count: {
      _all: true,
    },
    _sum: {
      distance: true,
      duration: true,
      elevationGain: true,
    },
  });

  return {
    activityCount: result._count._all,
    totalDistance: result._sum.distance ?? 0,
    totalDuration: result._sum.duration ?? 0,
    totalElevation: result._sum.elevationGain ?? 0,
  };
}
