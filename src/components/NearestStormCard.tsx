import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import type { Alert } from "@/hooks/useAlerts";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

const DIRS = ["sever", "severovýchod", "východ", "jihovýchod", "jih", "jihozápad", "západ", "severozápad"];
function dirLabel(deg: number) {
  return DIRS[Math.round(deg / 45) % 8];
}

export function NearestStormCard({ alerts }: { alerts: Alert[] }) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setDenied(true),
      { maximumAge: 5 * 60 * 1000, timeout: 8000 },
    );
  }, []);

  if (dismissed || denied || !pos) return null;

  const localized = alerts
    .filter((a) => a.type === "short" && a.lat != null && a.lng != null)
    .map((a) => {
      const dist = haversineKm(pos.lat, pos.lng, a.lat!, a.lng!);
      const edge = Math.max(0, dist - (a.radius_km ?? 0));
      return { a, dist, edge, dir: bearing(pos.lat, pos.lng, a.lat!, a.lng!) };
    })
    .sort((x, y) => x.edge - y.edge);

  const nearest = localized[0];

  return (
    <div className="pointer-events-auto absolute bottom-24 left-3 z-[1000] w-[min(280px,calc(100vw-24px))] rounded-xl bg-panel p-3 text-panel-foreground shadow-2xl backdrop-blur">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground hover:bg-accent"
        aria-label="Zavřít"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <MapPin className="h-3 w-3" />
        Vaše poloha
      </div>
      {nearest ? (
        <>
          <div className="text-sm font-semibold">
            Nejbližší bouřka: {nearest.edge < 1 ? "u vás" : `${nearest.edge.toFixed(0)} km`}
          </div>
          <div className="text-xs text-muted-foreground">
            Směr: {dirLabel(nearest.dir)} · úroveň {nearest.a.level}
          </div>
          {nearest.a.name && (
            <div className="mt-1 text-xs">{nearest.a.name}</div>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">Žádné bouřky v okolí.</div>
      )}
    </div>
  );
}
