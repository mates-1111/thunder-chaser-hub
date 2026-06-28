// RainViewer public API – načítá snímky radaru (minulé + predikce).
// https://www.rainviewer.com/api.html

export interface RadarFrame {
  time: number; // unix sec
  path: string; // base path for tiles
}

export interface RadarData {
  host: string;
  past: RadarFrame[];
  nowcast: RadarFrame[]; // predikce
  generated: number;
}

const ENDPOINT = "https://api.rainviewer.com/public/weather-maps.json";

export async function fetchRadar(): Promise<RadarData> {
  const res = await fetch(ENDPOINT);
  if (!res.ok) throw new Error("RainViewer API failed");
  const json = await res.json();
  return {
    host: json.host,
    generated: json.generated,
    past: json.radar.past as RadarFrame[],
    nowcast: json.radar.nowcast as RadarFrame[],
  };
}

// Color scheme 2 = Original (klasická radarová paleta jako CHMI/INCA:
// modrá → azurová → zelená → žlutá → oranžová → červená → magenta → bílá).
// Smooth = 1, snow = 1 pro pěknější vykreslení.
export function tileUrl(host: string, frame: RadarFrame, size = 256): string {
  return `${host}${frame.path}/${size}/{z}/{x}/{y}/2/1_1.png`;
}

export function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}
