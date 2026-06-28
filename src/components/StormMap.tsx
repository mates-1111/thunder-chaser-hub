import { useEffect, useRef } from "react";
import type L from "leaflet";
import { layerImageUrl, type RadarFrame } from "@/lib/radar";

interface StormMapProps {
  currentFrame: RadarFrame | null;
  bounds: [[number, number], [number, number]] | null;
}

// Centrum Česka
const CZ_CENTER: [number, number] = [49.8, 15.5];
const CZ_ZOOM = 7;
const CZ_MAX_BOUNDS: [[number, number], [number, number]] = [
  [47.1, 9.5],
  [52.7, 21.5],
];

export function StormMap({ currentFrame, bounds }: StormMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.ImageOverlay | null>(null);
  const lightningLayerRef = useRef<L.ImageOverlay | null>(null);

  const LRef = useRef<typeof import("leaflet") | null>(null);

  // init map once (client only – dynamic import avoids SSR window access)
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current || mapRef.current) return;
    import("leaflet").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const Lmod = mod.default ?? mod;
      LRef.current = Lmod;
      const map = Lmod.map(containerRef.current, {
        center: CZ_CENTER,
        zoom: CZ_ZOOM,
        minZoom: 6,
        maxZoom: 15,
        zoomSnap: 0.25,
        wheelPxPerZoomLevel: 90,
        maxBounds: CZ_MAX_BOUNDS,
        maxBoundsViscosity: 0.55,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
      });
      Lmod.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a> contributors',
          maxZoom: 19,
        },
      ).addTo(map);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // update official ČHMÚ radar + lightning image overlays when frame changes
  useEffect(() => {
    const map = mapRef.current;
    const Lmod = LRef.current;
    if (!map || !Lmod || !bounds || !currentFrame) return;

    const radarLayer = Lmod.imageOverlay(layerImageUrl("radary", currentFrame), bounds, {
      opacity: 0.86,
      zIndex: 400,
      interactive: false,
      className: "chmi-radar-overlay",
    });
    const lightningLayer = Lmod.imageOverlay(layerImageUrl("blesky", currentFrame), bounds, {
      opacity: 0.92,
      zIndex: 410,
      interactive: false,
      className: "chmi-lightning-overlay",
    });
    radarLayer.addTo(map);
    lightningLayer.addTo(map);

    const oldRadar = radarLayerRef.current;
    const oldLightning = lightningLayerRef.current;
    radarLayer.once("load", () => {
      if (oldRadar) oldRadar.remove();
      if (oldLightning) oldLightning.remove();
    });
    const t = setTimeout(() => {
      if (oldRadar && oldRadar !== radarLayer) oldRadar.remove();
      if (oldLightning && oldLightning !== lightningLayer) oldLightning.remove();
    }, 800);

    radarLayerRef.current = radarLayer;
    lightningLayerRef.current = lightningLayer;

    return () => clearTimeout(t);
  }, [bounds, currentFrame]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}
