import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_KINDS = new Set(["radary", "blesky"]);
const REF_RE = /^\d{12}$/;

export const Route = createFileRoute("/api/chmi/layer")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const kind = url.searchParams.get("kind") ?? "";
        const ref = url.searchParams.get("ref") ?? "";

        if (!ALLOWED_KINDS.has(kind) || !REF_RE.test(ref)) {
          return Response.json({ message: "Invalid radar layer request" }, { status: 400 });
        }

        const response = await fetch(
          `https://data-provider.chmi.cz/api/data/pocasi/${kind}/${ref}`,
          { headers: { accept: "application/json" } },
        );

        if (!response.ok) {
          return Response.json({ message: "Radar layer is unavailable" }, { status: 502 });
        }

        const payload = (await response.json()) as { img?: string };
        const base64 = payload.img?.replace(/^data:image\/png;base64,/, "");
        if (!base64) {
          return Response.json({ message: "Radar layer image is missing" }, { status: 502 });
        }

        const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        return new Response(bytes, {
          headers: {
            "content-type": "image/png",
            "cache-control": "public, max-age=300, stale-while-revalidate=600",
          },
        });
      },
    },
  },
});