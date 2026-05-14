"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActivitySettingsState = {
  error?: string;
  success?: string;
};

export async function updateActivitySettings(
  activityId: string,
  _state: ActivitySettingsState,
  formData: FormData,
): Promise<ActivitySettingsState> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      user: { email: session.user.email },
    },
    select: { id: true },
  });

  if (!activity) {
    return { error: "No se encontro la actividad." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 3 || name.length > 80) {
    return { error: "El nombre debe tener entre 3 y 80 caracteres." };
  }

  if (type.length < 2 || type.length > 40) {
    return { error: "El tipo debe tener entre 2 y 40 caracteres." };
  }

  if (description.length > 500) {
    return { error: "La descripcion no puede superar 500 caracteres." };
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      name,
      type,
      description: description || null,
      isPublic: formData.get("isPublic") === "on",
      showMap: formData.get("showMap") === "on",
      showHeartRate: formData.get("showHeartRate") === "on",
      showSpeed: formData.get("showSpeed") === "on",
      showCalories: formData.get("showCalories") === "on",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/activity/${activityId}`);

  return { success: "Actividad actualizada." };
}

export async function deleteActivity(activityId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      user: { email: session.user.email },
    },
    select: { id: true },
  });

  if (!activity) {
    redirect("/dashboard");
  }

  await prisma.activity.delete({
    where: { id: activityId },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
