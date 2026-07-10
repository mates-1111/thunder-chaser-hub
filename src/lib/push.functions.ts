import { createServerFn } from "@tanstack/react-start";

type AlertPayload = {
  id: string;
  type: "long" | "short";
  level: number;
  name: string | null;
  description: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
};

function normalizeCity(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

export const sendAlertPush = createServerFn({ method: "POST" })
  .inputValidator((data: { alert: AlertPayload; targetCity?: string | null }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildPushPayload } = await import("@block65/webcrypto-web-push");

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@bourkar.cz";
    if (!publicKey || !privateKey) {
      console.error("[push] Missing VAPID keys");
      return { sent: 0, skipped: 0, failed: 0, reason: "no-vapid" };
    }

    // Fetch subscribers
    let query = supabaseAdmin
      .from("subscribers")
      .select("id,city,endpoint,p256dh,auth")
      .not("endpoint", "is", null);

    const target = normalizeCity(data.targetCity ?? data.alert.city);
    if (data.alert.type === "short" && target) {
      // match by city (case-insensitive). Short alerts should only ping the named city.
      query = query.ilike("city", target);
    }

    const { data: subs, error } = await query;
    if (error) {
      console.error("[push] fetch subscribers", error);
      return { sent: 0, skipped: 0, failed: 0, reason: "db" };
    }
    if (!subs || subs.length === 0) return { sent: 0, skipped: 0, failed: 0 };

    const title =
      data.alert.type === "short"
        ? `⚡ Výstraha – ${data.alert.name ?? "bouřka"} (úroveň ${data.alert.level})`
        : `⚠️ ${data.alert.name ?? "Výstraha"} (úroveň ${data.alert.level})`;
    const body = data.alert.description.slice(0, 300);

    const message = {
      data: {
        title,
        body,
        tag: `alert-${data.alert.id}`,
        level: data.alert.level,
        url: "/",
      },
      options: { ttl: 60 * 60 * 6, urgency: "high" as const },
    };

    let sent = 0;
    let failed = 0;
    const deadEndpoints: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        if (!s.endpoint || !s.p256dh || !s.auth) return;
        const subscription = {
          endpoint: s.endpoint,
          expirationTime: null,
          keys: { auth: s.auth, p256dh: s.p256dh },
        };
        try {
          const payload = await buildPushPayload(message, subscription, {
            subject,
            publicKey,
            privateKey,
          });
          const resp = await fetch(subscription.endpoint, {
            method: payload.method,
            headers: payload.headers,
            body: payload.body,
          });
          if (resp.status === 404 || resp.status === 410) {
            deadEndpoints.push(s.endpoint);
            failed++;
          } else if (!resp.ok) {
            failed++;
            console.warn("[push] send failed", resp.status, await resp.text().catch(() => ""));
          } else {
            sent++;
          }
        } catch (e) {
          failed++;
          console.warn("[push] error", e);
        }
      }),
    );

    if (deadEndpoints.length) {
      await supabaseAdmin.from("subscribers").delete().in("endpoint", deadEndpoints);
    }

    return { sent, failed, skipped: 0, total: subs.length };
  });
