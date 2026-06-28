import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Bouřkář CZ" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm rounded-2xl bg-panel p-6 text-panel-foreground shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bolt text-bolt-foreground">
            <Shield className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-semibold">Administrace</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Přihlášení heslem připravím v další fázi (Cloud + admin gate).
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Zpět na mapu
        </Link>
      </div>
    </main>
  );
}
