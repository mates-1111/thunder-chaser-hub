import { AlertTriangle } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";

const levelColors: Record<number, string> = {
  1: "bg-emerald-500",
  2: "bg-yellow-500",
  3: "bg-orange-500",
  4: "bg-red-500",
  5: "bg-fuchsia-600",
};

export function Sidebar() {
  const alerts = useAlerts();
  return (
    <aside className="pointer-events-auto absolute right-3 top-16 z-[1000] flex w-[min(320px,calc(100vw-24px))] flex-col gap-3">
      <section className="rounded-xl bg-panel p-3 text-panel-foreground shadow-2xl backdrop-blur">
        <header className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          Aktivní výstrahy ({alerts.length})
        </header>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné aktivní výstrahy.</p>
        ) : (
          <ul className="space-y-2 max-h-[40vh] overflow-y-auto">
            {alerts.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-lg border border-border/40 p-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className={`inline-block h-2 w-2 rounded-full ${levelColors[a.level] ?? "bg-muted"}`} />
                  {a.type === "long" ? "Dlouhodobá" : "Krátkodobá"} · úroveň {a.level}
                  {a.type === "short" && a.radius_km ? ` · ${a.radius_km} km` : ""}
                </div>
                {a.name && <div className="text-sm font-semibold leading-snug">{a.name}</div>}
                <div className="text-xs leading-snug text-muted-foreground">{a.description}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
