export interface RadarFrame {
  time: number; // unix sec
  ref: string; // YYYYMMDDHHmm reference used by ČHMÚ data-provider
}

export interface RadarData {
  past: RadarFrame[];
  nowcast: RadarFrame[]; // predikce
  generated: number;
  bounds: [[number, number], [number, number]];
}

interface ChmiLayer {
  id: string;
  dataParts?: Array<{ dataRef: string }>;
}

interface ChmiTimeline {
  defaultStep?: number;
}

interface ChmiConfig {
  timelines?: ChmiTimeline[];
  boundingBoxes?: Array<{
    id: string;
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  }>;
  layers?: ChmiLayer[];
}

const CHMI_CONFIG_ENDPOINT = "/api/chmi/radar-config";
const FALLBACK_BOUNDS: [[number, number], [number, number]] = [
  [48.047, 11.267],
  [51.467, 19.638],
];

function refToUnix(ref: string): number {
  const year = Number(ref.slice(0, 4));
  const month = Number(ref.slice(4, 6)) - 1;
  const day = Number(ref.slice(6, 8));
  const hour = Number(ref.slice(8, 10));
  const minute = Number(ref.slice(10, 12));
  return Math.floor(Date.UTC(year, month, day, hour, minute) / 1000);
}

export async function fetchRadar(): Promise<RadarData> {
  const res = await fetch(CHMI_CONFIG_ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error("ČHMÚ radar API failed");
  const json = (await res.json()) as ChmiConfig;

  const radarLayer = json.layers?.find((layer) => layer.id === "radary");
  const refs = radarLayer?.dataParts?.map((part) => part.dataRef) ?? [];
  const frames = refs.map((ref) => ({ ref, time: refToUnix(ref) }));
  const timeline = json.timelines?.[0];
  const nowIndex = Math.min(
    Math.max(0, timeline?.defaultStep ?? frames.length - 1),
    Math.max(0, frames.length - 1),
  );
  const box = json.boundingBoxes?.find((item) => item.id === "main");

  return {
    generated: Date.now() / 1000,
    past: frames.slice(0, nowIndex + 1),
    nowcast: frames.slice(nowIndex + 1),
    bounds: box
      ? [
          [box.ymin, box.xmin],
          [box.ymax, box.xmax],
        ]
      : FALLBACK_BOUNDS,
  };
}

export function layerImageUrl(kind: "radary" | "blesky", frame: RadarFrame): string {
  const params = new URLSearchParams({ kind, ref: frame.ref });
  return `/api/chmi/layer?${params.toString()}`;
}

export function formatTime(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}
