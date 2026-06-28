import { AlertTriangle } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="pointer-events-auto absolute right-3 top-3 z-[1000] flex w-[min(340px,calc(100vw-24px))] flex-col gap-3 sm:right-4 sm:top-4">
      <section className="rounded-xl bg-panel p-4 text-panel-foreground shadow-2xl backdrop-blur">
        <header className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          Aktivní předpovědi
        </header>
        <p className="text-sm text-muted-foreground">Žádné aktivní výstrahy.</p>
      </section>
    </aside>
  );
}
