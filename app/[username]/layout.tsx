import { AppShell } from "@/app/components/app-shell";

export default function PublicProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
