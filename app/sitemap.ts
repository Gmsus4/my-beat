import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://my-beatme.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    getRoute("/", 1),
    getRoute("/help/gpx", 0.7),
    getRoute("/privacy", 0.3),
    getRoute("/terms", 0.3),
  ];

  try {
    const [users, activities] = await Promise.all([
      prisma.user.findMany({
        where: {
          activities: {
            some: { isPublic: true },
          },
        },
        select: {
          username: true,
          createdAt: true,
        },
        take: 500,
      }),
      prisma.activity.findMany({
        where: { isPublic: true },
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          user: {
            select: { username: true },
          },
        },
        take: 1000,
      }),
    ]);

    return [
      ...staticRoutes,
      ...users.map((user) => ({
        url: `${appUrl}/${user.username}`,
        lastModified: user.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...activities.map((activity) => ({
        url: `${appUrl}/${activity.user.username}/activity/${activity.id}`,
        lastModified: activity.date,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}

function getRoute(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  };
}
