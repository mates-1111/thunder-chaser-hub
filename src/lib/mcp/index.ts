import { defineMcp } from "@lovable.dev/mcp-js";
import listActiveAlerts from "./tools/list-active-alerts";
import getRadarFrames from "./tools/get-radar-frames";

export default defineMcp({
  name: "bourkar-cz-mcp",
  title: "Bouřkář CZ MCP",
  version: "0.1.0",
  instructions:
    "Public tools for Bouřkář CZ. Use `list_active_alerts` to read currently active storm/weather alerts for Czechia. Use `get_radar_frames` to fetch the ČHMÚ radar frame timeline (past + nowcast).",
  tools: [listActiveAlerts, getRadarFrames],
});
