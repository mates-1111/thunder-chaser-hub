import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StormMap } from "@/components/StormMap";
import { RadarTimeline } from "@/components/RadarTimeline";
import { LocalWeatherDialog } from "@/components/LocalWeatherDialog";
import { NearestStormCard } from "@/components/NearestStormCard";
import { PushDialog } from "@/components/PushDialog";
import { useAlerts } from "@/hooks/useAlerts";
import { fetchRadar, type RadarData } from "@/lib/radar";
import { shouldPromptForPush } from "@/lib/push";

const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/012fa587-d378-4769-a378-5122aa072c09/id-preview-4de7d202--f76a542d-a0dc-47c7-88b8-40699a2ad3f0.lovable.app-1782641686620.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bouřkář CZ — Živý radar bouřek a předpověď pro Česko" },
      {
        name: "description",
        content:
          "Živý radar bouřek a srážek nad Českem, krátkodobá a dlouhodobá varování s mapou nebezpečí a push upozorněními.",
      },
      { property: "og:title", content: "Bouřkář CZ — Živý radar a předpověď bouřek" },
      {
        property: "og:description",
        content:
          "Sledujte radar bouřek a blesky v reálném čase nad Českem a získejte upozornění na bouřky, které se blíží k vaší poloze.",
      },
      { property: "og:url", content: "https://bourkar-cz.lovable.app/" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:title", content: "Bouřkář CZ — Živý radar a předpověď bouřek" },
      {
        name: "twitter:description",
        content:
          "Sledujte radar bouřek a blesky v reálném čase nad Českem a získejte upozornění na bouřky, které se blíží k vaší poloze.",
      },
    ],
    links: [{ rel: "canonical", href: "https://bourkar-cz.lovable.app/" }],
  }),
  component: HomePage,
});

function HomePage() {
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [idx, setIdx] = useState(0);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
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

    // Auto-open push dialog after 2s on first visit
    const promptId = setTimeout(() => {
      if (!cancelled && shouldPromptForPush()) setPushOpen(true);
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
      clearTimeout(promptId);
    };
  }, []);

  const frames = radar ? [...radar.past, ...radar.nowcast] : [];
  const currentFrame = frames[idx] ?? null;

  return (
    <main className="relative h-screen w-screen overflow-hidden" style={{ background: "oklch(0.96 0.004 240)" }}>
      <h1 className="sr-only">Bouřkář CZ — živý radar bouřek a srážek v Česku</h1>
      <StormMap currentFrame={currentFrame} bounds={radar?.bounds ?? null} alerts={alerts} />

      <Header onEnablePush={() => setPushOpen(true)} />
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
      <PushDialog open={pushOpen} onOpenChange={setPushOpen} />


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
