import { logout } from "@/actions/auth/logout";
import { Button } from "@/components/ui/button";

export default function ProcessesListPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">Processes List</h1>
      <form action={logout}>
        <Button type="submit" variant="outline">
          Sair
        </Button>
      </form>
    </main>
  );
}
