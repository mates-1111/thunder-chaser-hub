import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const CHMI_CONFIG_URL = "https://data-provider.chmi.cz/api/map/init/radary.radary";

interface ChmiConfig {
  timelines?: Array<{ defaultStep?: number }>;
  boundingBoxes?: Array<{ id: string; xmin: number; ymin: number; xmax: number; ymax: number }>;
  layers?: Array<{ id: string; dataParts?: Array<{ dataRef: string }> }>;
}

function refToUnix(ref: string): number {
  const y = Number(ref.slice(0, 4));
  const m = Number(ref.slice(4, 6)) - 1;
  const d = Number(ref.slice(6, 8));
  const h = Number(ref.slice(8, 10));
  const mm = Number(ref.slice(10, 12));
  return Math.floor(Date.UTC(y, m, d, h, mm) / 1000);
}

export default defineTool({
  name: "get_radar_frames",
  title: "Get radar frames",
  description:
    "Return the current ČHMÚ radar frame timeline for Czechia (past measurements and short-term nowcast). Public data — the same frames shown on the Bouřkář CZ map.",
  inputSchema: {
    include: z
      .enum(["all", "past", "nowcast"])
      .optional()
      .describe("Which frames to return. Defaults to all."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ include }) => {
    try {
      const res = await fetch(CHMI_CONFIG_URL, { headers: { accept: "application/json" } });
      if (!res.ok) {
        return { content: [{ type: "text", text: `ČHMÚ upstream ${res.status}` }], isError: true };
      }
      const json = (await res.json()) as ChmiConfig;
      const refs = json.layers?.find((l) => l.id === "radary")?.dataParts?.map((p) => p.dataRef) ?? [];
      const frames = refs.map((ref) => ({ ref, time: refToUnix(ref) }));
      const now = Math.min(
        Math.max(0, json.timelines?.[0]?.defaultStep ?? frames.length - 1),
        Math.max(0, frames.length - 1),
      );
      const box = json.boundingBoxes?.find((b) => b.id === "main");
      const payload = {
        past: frames.slice(0, now + 1),
        nowcast: frames.slice(now + 1),
        bounds: box
          ? [
              [box.ymin, box.xmin],
              [box.ymax, box.xmax],
            ]
          : null,
        generated: Math.floor(Date.now() / 1000),
      };
      const filtered =
        include === "past"
          ? { past: payload.past, bounds: payload.bounds, generated: payload.generated }
          : include === "nowcast"
            ? { nowcast: payload.nowcast, bounds: payload.bounds, generated: payload.generated }
            : payload;
      return {
        content: [{ type: "text", text: JSON.stringify(filtered) }],
        structuredContent: { data: filtered } as Record<string, unknown>,
      };
    } catch (err) {
      return {
        content: [
          { type: "text", text: `Failed to fetch radar: ${err instanceof Error ? err.message : String(err)}` },
        ],
        isError: true,
      };
    }
  },
});
