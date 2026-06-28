import { createFileRoute } from "@tanstack/react-router";

const CHMI_CONFIG_URL = "https://data-provider.chmi.cz/api/map/init/radary.radary";

export const Route = createFileRoute("/api/chmi/radar-config")({
  server: {
    handlers: {
      GET: async () => {
        const response = await fetch(CHMI_CONFIG_URL, {
          headers: { accept: "application/json" },
        });

        if (!response.ok) {
          return Response.json(
            { message: "ČHMÚ radar configuration is unavailable" },
            { status: 502 },
          );
        }

        const data = await response.json();
        return Response.json(data, {
          headers: {
            "cache-control": "public, max-age=60, stale-while-revalidate=180",
          },
        });
      },
    },
  },
});