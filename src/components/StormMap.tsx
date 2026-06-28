import { useEffect, useRef } from "react";
import L from "leaflet";
import { type RadarFrame, tileUrl } from "@/lib/radar";

interface StormMapProps {
  host: string | null;
  currentFrame: RadarFrame | null;
}

// Centrum Česka
const CZ_CENTER: [number, number] = [49.8, 15.5];
const CZ_ZOOM = 7;

export function StormMap({ host, currentFrame }: StormMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CZ_CENTER,
      zoom: CZ_ZOOM,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // update radar layer when frame changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !host || !currentFrame) return;

    const url = tileUrl(host, currentFrame);
    const newLayer = L.tileLayer(url, {
      opacity: 0.7,
      zIndex: 400,
      tileSize: 256,
    });
    newLayer.addTo(map);

    const old = radarLayerRef.current;
    // Fade in: po loadu sundáme starou vrstvu
    newLayer.once("load", () => {
      if (old) {
        old.remove();
      }
    });
    // Fallback: kdyby load nepřišel, sundáme po 800 ms
    const t = setTimeout(() => {
      if (old && old !== newLayer) old.remove();
    }, 800);

    radarLayerRef.current = newLayer;

    return () => clearTimeout(t);
  }, [host, currentFrame]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}
