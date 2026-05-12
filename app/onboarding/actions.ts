"use server";

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type OnboardingState = {
  error?: string;
};

const usernamePattern = /^[a-z0-9_]{3,24}$/;

export async function completeOnboarding(
  _state: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!usernamePattern.test(username)) {
    return {
      error:
        "Usa 3 a 24 caracteres: letras minusculas, numeros o guion bajo.",
    };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUsername) {
    return { error: "Ese username ya esta ocupado." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/dashboard");
  }

  await prisma.user.create({
    data: {
      email: session.user.email,
      username,
      name: session.user.name ?? username,
      avatar: session.user.image,
    },
  });

  redirect("/dashboard");
}
