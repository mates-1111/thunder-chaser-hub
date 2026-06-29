import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { layerImageUrl, type RadarFrame } from "@/lib/radar";
import type { Alert } from "@/hooks/useAlerts";

interface StormMapProps {
  currentFrame: RadarFrame | null;
  bounds: [[number, number], [number, number]] | null;
  alerts?: Alert[];
}

const CZ_CENTER: [number, number] = [49.8, 15.5];
const CZ_ZOOM = 7;
const CZ_MAX_BOUNDS: [[number, number], [number, number]] = [
  [47.1, 9.5],
  [52.7, 21.5],
];

const LEVEL_COLOR: Record<number, string> = {
  1: "#10b981",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
  5: "#a21caf",
};

export function StormMap({ currentFrame, bounds, alerts = [] }: StormMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.ImageOverlay | null>(null);
  const lightningLayerRef = useRef<L.ImageOverlay | null>(null);
  const alertLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const LRef = useRef<typeof import("leaflet") | null>(null);

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
      Lmod.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      alertLayerRef.current = Lmod.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // radar + blesky
  useEffect(() => {
    const map = mapRef.current;
    const Lmod = LRef.current;
    if (!mapReady || !map || !Lmod || !bounds || !currentFrame) return;

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
  }, [bounds, currentFrame, mapReady]);

  // alert circles
  useEffect(() => {
    const Lmod = LRef.current;
    const group = alertLayerRef.current;
    if (!mapReady || !Lmod || !group) return;
    group.clearLayers();
    for (const a of alerts) {
      if (a.type !== "short" || a.lat == null || a.lng == null || !a.radius_km) continue;
      const color = LEVEL_COLOR[a.level] ?? "#888";
      const circle = Lmod.circle([a.lat, a.lng], {
        radius: a.radius_km * 1000,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.22,
      });
      const ends = a.expires_at
        ? new Date(a.expires_at).toLocaleString("cs-CZ")
        : "neurčeno";
      circle.bindPopup(
        `<div style="min-width:200px">
          <div style="font-weight:600;color:${color}">${escapeHtml(a.name || "Výstraha")}</div>
          <div style="font-size:11px;text-transform:uppercase;color:#666;margin-bottom:4px">
            Úroveň ${a.level} · ${a.radius_km} km
          </div>
          <div style="font-size:13px;margin-bottom:6px">${escapeHtml(a.description)}</div>
          <div style="font-size:11px;color:#666">Platí do: ${escapeHtml(ends)}</div>
        </div>`,
      );
      group.addLayer(circle);
    }
  }, [alerts, mapReady]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      style={{ background: "oklch(0.96 0.004 240)" }}
    />
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
