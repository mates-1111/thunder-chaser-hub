import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StormMap } from "@/components/StormMap";
import { RadarTimeline } from "@/components/RadarTimeline";
import { LocalWeatherDialog } from "@/components/LocalWeatherDialog";
import { NearestStormCard } from "@/components/NearestStormCard";
import { useAlerts } from "@/hooks/useAlerts";
import { fetchRadar, type RadarData } from "@/lib/radar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bouřkář CZ — radar bouřek, předpovědi a hlášení pro Česko" },
      {
        name: "description",
        content:
          "Živý radar bouřek a srážek nad Českem, krátkodobá a dlouhodobá varování s mapou nebezpečí.",
      },
      { property: "og:title", content: "Bouřkář CZ" },
      { property: "og:description", content: "Radar a výstrahy bouřek pro Česko." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [idx, setIdx] = useState(0);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const alerts = useAlerts();

  useEffect(() => {
    let cancelled = false;
    fetchRadar()
      .then((d) => {
        if (cancelled) return;
        setRadar(d);
        setIdx(Math.max(0, d.past.length - 1));
      })
      .catch((err) => console.error("Radar fetch failed", err));

    const id = setInterval(() => {
      fetchRadar()
        .then((d) => !cancelled && setRadar(d))
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const frames = radar ? [...radar.past, ...radar.nowcast] : [];
  const currentFrame = frames[idx] ?? null;

  return (
    <main className="relative h-screen w-screen overflow-hidden" style={{ background: "oklch(0.96 0.004 240)" }}>
      <StormMap currentFrame={currentFrame} bounds={radar?.bounds ?? null} alerts={alerts} />

      <Header />
      <Sidebar />

      <div className="pointer-events-auto absolute top-16 left-3 z-[1000]">
        <button
          type="button"
          onClick={() => setWeatherOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-bolt px-4 py-1.5 text-xs font-semibold text-bolt-foreground shadow-2xl transition hover:brightness-95"
        >
          <MapPin className="h-3.5 w-3.5" />
          Počasí u vás
        </button>
      </div>

      <NearestStormCard alerts={alerts} />

      <LocalWeatherDialog open={weatherOpen} onOpenChange={setWeatherOpen} />

      {radar && (
        <RadarTimeline
          past={radar.past}
          nowcast={radar.nowcast}
          currentIndex={idx}
          onIndexChange={setIdx}
        />
      )}
    </main>
  );
}
