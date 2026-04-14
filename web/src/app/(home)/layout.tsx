import { auth } from "@/configs/auth/auth";
import { AppShell } from "@/components/app-shell";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = {
    name: session?.user?.name ?? null,
    email: session?.user?.email ?? null,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
