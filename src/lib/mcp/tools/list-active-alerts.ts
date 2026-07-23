import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_active_alerts",
  title: "List active storm alerts",
  description:
    "Return currently active weather/storm alerts published on Bouřkář CZ (level 1–5, description, target city, optional geographic radius). Public data — same info shown on the website.",
  inputSchema: {
    type: z
      .enum(["all", "long", "short"])
      .optional()
      .describe("Filter by alert type. 'long' = long-range forecast, 'short' = short-range storm. Defaults to all."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type }) => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      return { content: [{ type: "text", text: "Supabase env not configured" }], isError: true };
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
    if (type && type !== "all") query = query.eq("type", type);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: `Query error: ${error.message}` }], isError: true };
    }
    const now = Date.now();
    const active = (data ?? []).filter(
      (a: { expires_at: string | null }) => !a.expires_at || new Date(a.expires_at).getTime() > now,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(active) }],
      structuredContent: { alerts: active, count: active.length },
    };
  },
});
