import { prisma } from "@/lib/prisma";

export const feedPageSize = 8;

export type FeedActivity = {
  id: string;
  name: string;
  type: string;
  date: string;
  distance: number;
  duration: number;
  elevationGain: number | null;
  avgHeartRate: number | null;
  calories: number | null;
  polyline: string | null;
  showMap: boolean;
  showHeartRate: boolean;
  showSpeed: boolean;
  showCalories: boolean;
  user: {
    username: string;
    name: string;
    avatar: string | null;
  };
};

export type FeedPage = {
  activities: FeedActivity[];
  nextCursor: string | null;
};

export async function getFollowedFeedPage(
  email: string,
  cursor?: string | null,
): Promise<FeedPage> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      following: {
        select: { followingId: true },
      },
    },
  });

  if (!user) {
    return {
      activities: [],
      nextCursor: null,
    };
  }

  const followingIds = user.following.map((follow) => follow.followingId);

  if (followingIds.length === 0) {
    return {
      activities: [],
      nextCursor: null,
    };
  }

  const activities = await prisma.activity.findMany({
    where: {
      isPublic: true,
      userId: { in: followingIds },
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    take: feedPageSize + 1,
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
      user: {
        select: {
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  const pageActivities = activities.slice(0, feedPageSize);
  const hasNextPage = activities.length > feedPageSize;

  return {
    activities: pageActivities.map((activity) => ({
      ...activity,
      date: activity.date.toISOString(),
    })),
    nextCursor: hasNextPage
      ? pageActivities[pageActivities.length - 1]?.id ?? null
      : null,
  };
}
