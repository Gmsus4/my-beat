"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ProfileSettingsState = {
  error?: string;
  success?: string;
};

const usernamePattern = /^[a-z0-9_]{3,24}$/;

export async function updateProfileSettings(
  _state: ProfileSettingsState,
  formData: FormData,
): Promise<ProfileSettingsState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, username: true },
  });

  if (!currentUser) {
    redirect("/onboarding");
  }

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatar = String(formData.get("avatar") ?? "").trim();
  const cover = String(formData.get("cover") ?? "").trim();

  if (!usernamePattern.test(username)) {
    return {
      error:
        "El username debe tener 3 a 24 caracteres: letras minusculas, numeros o guion bajo.",
    };
  }

  if (name.length < 2 || name.length > 80) {
    return { error: "El nombre debe tener entre 2 y 80 caracteres." };
  }

  if (bio.length > 240) {
    return { error: "La bio no puede superar 240 caracteres." };
  }

  if (!isValidOptionalUrl(avatar) || !isValidOptionalUrl(cover)) {
    return { error: "Avatar y cover deben ser URLs validas." };
  }

  if (username !== currentUser.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      return { error: "Ese username ya esta ocupado." };
    }
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      username,
      name,
      bio: bio || null,
      avatar: avatar || null,
      cover: cover || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath(`/${currentUser.username}`);
  revalidatePath(`/${username}`);

  return { success: "Perfil actualizado." };
}

function isValidOptionalUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
