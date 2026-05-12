"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function followUser(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    }),
  ]);

  if (!currentUser) {
    redirect("/onboarding");
  }

  if (!targetUser || currentUser.id === targetUser.id) {
    return;
  }

  try {
    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUser.id,
      },
    });
  } catch {
    // If the relation already exists, the desired state is already true.
  }

  revalidateFollowPaths(targetUser.username);
}

export async function unfollowUser(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true },
    }),
  ]);

  if (!currentUser) {
    redirect("/onboarding");
  }

  if (!targetUser || currentUser.id === targetUser.id) {
    return;
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: currentUser.id,
      followingId: targetUser.id,
    },
  });

  revalidateFollowPaths(targetUser.username);
}

function revalidateFollowPaths(username: string) {
  revalidatePath("/");
  revalidatePath("/dashboard/search");
  revalidatePath(`/${username}`);
}
