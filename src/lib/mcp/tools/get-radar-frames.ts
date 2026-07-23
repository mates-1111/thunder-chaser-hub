import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fetchRadar } from "@/lib/radar";

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
      const data = await fetchRadar();
      const payload =
        include === "past"
          ? { past: data.past, bounds: data.bounds, generated: data.generated }
          : include === "nowcast"
            ? { nowcast: data.nowcast, bounds: data.bounds, generated: data.generated }
            : data;
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
        structuredContent: payload,
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to fetch radar: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  },
});
