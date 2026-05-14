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

export type DeleteAccountState = {
  error?: string;
  deleted?: boolean;
};

const usernamePattern = /^[a-z0-9_]{3,24}$/;
const socialPlatforms = new Set([
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "youtube",
  "threads",
  "linkedin",
]);
const healthPlatforms = new Set([
  "strava",
  "garmin",
  "adidas",
  "huawei",
  "nike",
  "coros",
  "polar",
  "suunto",
]);
const musicPlatforms = new Set(["spotify", "youtubeMusic", "appleMusic"]);

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
  const socialLinks = [1, 2, 3].map((index) => ({
    platform: String(formData.get(`socialPlatform${index}`) ?? "").trim(),
    url: String(formData.get(`socialUrl${index}`) ?? "").trim(),
  }));
  const normalizedSocialLinks = normalizeSocialLinks(socialLinks);
  const healthPlatform = String(formData.get("healthPlatform") ?? "").trim();
  const healthUrl = String(formData.get("healthUrl") ?? "").trim();
  const musicPlatform = String(formData.get("musicPlatform") ?? "").trim();
  const musicUrl = String(formData.get("musicUrl") ?? "").trim();

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

  const socialError = validateSocialLinks(normalizedSocialLinks);

  if (socialError) {
    return { error: socialError };
  }

  const healthError = validateOptionalPlatformLink({
    platform: healthPlatform,
    url: healthUrl,
    allowedPlatforms: healthPlatforms,
    validateUrl: validateHealthUrl,
    category: "app deportiva/salud",
  });

  if (healthError) {
    return { error: healthError };
  }

  const musicError = validateOptionalPlatformLink({
    platform: musicPlatform,
    url: musicUrl,
    allowedPlatforms: musicPlatforms,
    validateUrl: validateMusicUrl,
    category: "musica",
  });

  if (musicError) {
    return { error: musicError };
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
      socialPlatform1: normalizedSocialLinks[0].platform || null,
      socialUrl1: normalizedSocialLinks[0].url || null,
      socialPlatform2: normalizedSocialLinks[1].platform || null,
      socialUrl2: normalizedSocialLinks[1].url || null,
      socialPlatform3: normalizedSocialLinks[2].platform || null,
      socialUrl3: normalizedSocialLinks[2].url || null,
      healthPlatform: healthPlatform || null,
      healthUrl: healthUrl || null,
      musicPlatform: musicPlatform || null,
      musicUrl: musicUrl || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath(`/${currentUser.username}`);
  revalidatePath(`/${username}`);

  return { success: "Perfil actualizado." };
}

export async function deleteAccount(
  _state: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
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

  const confirmation = String(formData.get("confirmation") ?? "")
    .trim()
    .toLowerCase();

  if (confirmation !== currentUser.username.toLowerCase()) {
    return {
      error: `Escribe ${currentUser.username} para confirmar la eliminacion.`,
    };
  }

  await prisma.activity.deleteMany({
    where: { userId: currentUser.id },
  });

  await prisma.follow.deleteMany({
    where: {
      OR: [{ followerId: currentUser.id }, { followingId: currentUser.id }],
    },
  });

  await prisma.user.delete({
    where: { id: currentUser.id },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/${currentUser.username}`);

  return { deleted: true };
}

function normalizeSocialLinks(
  links: {
    platform: string;
    url: string;
  }[],
) {
  return links.map((link) => {
    if (!link.url) {
      return {
        platform: "",
        url: "",
      };
    }

    return link;
  });
}

function validateSocialLinks(
  links: {
    platform: string;
    url: string;
  }[],
) {
  const usedPlatforms = new Set<string>();

  for (const link of links) {
    if (!link.platform && !link.url) {
      continue;
    }

    if (!link.platform || !socialPlatforms.has(link.platform)) {
      return "Selecciona una red social valida.";
    }

    if (!link.url) {
      return "Agrega la URL de cada red social seleccionada.";
    }

    if (usedPlatforms.has(link.platform)) {
      return "No repitas la misma red social en mas de un campo.";
    }

    usedPlatforms.add(link.platform);

    if (!validateSocialUrl(link.platform, link.url)) {
      return getSocialError(link.platform);
    }
  }

  return null;
}

function validateSocialUrl(platform: string, value: string) {
  if (platform === "instagram") {
    return matchesUrl(value, "www.instagram.com", /^\/[A-Za-z0-9._]+\/?$/);
  }

  if (platform === "facebook") {
    return matchesUrl(value, "www.facebook.com", /^\/[A-Za-z0-9.]+\/?$/);
  }

  if (platform === "tiktok") {
    return matchesUrl(value, "www.tiktok.com", /^\/@[A-Za-z0-9._]+\/?$/);
  }

  if (platform === "x") {
    return (
      matchesUrl(value, "x.com", /^\/[A-Za-z0-9_]+\/?$/) ||
      matchesUrl(value, "twitter.com", /^\/[A-Za-z0-9_]+\/?$/)
    );
  }

  if (platform === "youtube") {
    return (
      matchesUrl(value, "www.youtube.com", /^\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+)\/?$/) ||
      matchesUrl(value, "youtube.com", /^\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+)\/?$/)
    );
  }

  if (platform === "threads") {
    return matchesUrl(value, "www.threads.net", /^\/@[A-Za-z0-9._]+\/?$/);
  }

  if (platform === "linkedin") {
    return matchesUrl(value, "www.linkedin.com", /^\/in\/[A-Za-z0-9_-]+\/?$/);
  }

  return false;
}

function getSocialError(platform: string) {
  const errors: Record<string, string> = {
    instagram: "Instagram debe tener el formato https://www.instagram.com/username.",
    facebook: "Facebook debe tener el formato https://www.facebook.com/username.",
    tiktok: "TikTok debe tener el formato https://www.tiktok.com/@username.",
    x: "X debe tener el formato https://x.com/username.",
    youtube: "YouTube debe tener el formato https://www.youtube.com/@username.",
    threads: "Threads debe tener el formato https://www.threads.net/@username.",
    linkedin: "LinkedIn debe tener el formato https://www.linkedin.com/in/username.",
  };

  return errors[platform] ?? "La URL de la red social no es valida.";
}

function validateOptionalPlatformLink({
  platform,
  url,
  allowedPlatforms,
  validateUrl,
  category,
}: {
  platform: string;
  url: string;
  allowedPlatforms: Set<string>;
  validateUrl: (platform: string, url: string) => boolean;
  category: string;
}) {
  if (!platform && !url) {
    return null;
  }

  if (!platform || !allowedPlatforms.has(platform)) {
    return `Selecciona una plataforma valida de ${category}.`;
  }

  if (!url) {
    return `Agrega la URL de tu ${category}.`;
  }

  if (!validateUrl(platform, url)) {
    return `La URL de ${category} no coincide con la plataforma seleccionada.`;
  }

  return null;
}

function validateHealthUrl(platform: string, value: string) {
  const url = parseHttpsUrl(value);

  if (!url) {
    return false;
  }

  const host = normalizeHost(url.hostname);

  if (platform === "strava") {
    return host === "strava.com" && url.pathname.startsWith("/athletes/");
  }

  if (platform === "garmin") {
    return host === "connect.garmin.com";
  }

  if (platform === "adidas") {
    return host === "runtastic.com" || host.endsWith(".runtastic.com") || host === "adidas.com";
  }

  if (platform === "huawei") {
    return host === "huawei.com" || host.endsWith(".huawei.com");
  }

  if (platform === "nike") {
    return host === "nike.com" || host.endsWith(".nike.com");
  }

  if (platform === "coros") {
    return host === "coros.com" || host.endsWith(".coros.com");
  }

  if (platform === "polar") {
    return host === "flow.polar.com";
  }

  if (platform === "suunto") {
    return host === "suunto.com" || host.endsWith(".suunto.com") || host === "sports-tracker.com";
  }

  return false;
}

function validateMusicUrl(platform: string, value: string) {
  const url = parseHttpsUrl(value);

  if (!url) {
    return false;
  }

  const host = normalizeHost(url.hostname);

  if (platform === "spotify") {
    return host === "open.spotify.com";
  }

  if (platform === "youtubeMusic") {
    return host === "music.youtube.com";
  }

  if (platform === "appleMusic") {
    return host === "music.apple.com";
  }

  return false;
}

function matchesUrl(value: string, hostname: string, pathnamePattern: RegExp) {
  const url = parseHttpsUrl(value);

  return (
    Boolean(url) &&
    url?.hostname.toLowerCase() === hostname &&
    pathnamePattern.test(url.pathname)
  );
}

function parseHttpsUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
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
