import { getServerSession } from "next-auth/next";

import { InstagramNav } from "@/app/components/instagram-nav";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          username: true,
          name: true,
          avatar: true,
        },
      })
    : null;

  return (
    <div className="min-h-screen bg-black text-white lg:pl-[76px]">
      <InstagramNav user={user} />
      <div className="min-w-0 pb-20 lg:pb-0">{children}</div>
    </div>
  );
}
