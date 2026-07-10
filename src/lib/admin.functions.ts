import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type AdminSession = { isAdmin?: boolean };

function sessionConfig() {
  return {
    password: process.env.ADMIN_SESSION_SECRET!,
    name: "bourkar-admin",
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function safeEqual(a: string, b: string) {
  const ah = createHash("sha256").update(a, "utf8").digest();
  const bh = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ah, bh);
}

async function requireAdmin() {
  const session = await useSession<AdminSession>(sessionConfig());
  if (!session.data.isAdmin) throw new Error("Forbidden");
  return session;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD not set");
    if (!safeEqual(data.password ?? "", expected)) {
      return { ok: false as const };
    }
    const session = await useSession<AdminSession>(sessionConfig());
    await session.update({ isAdmin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(sessionConfig());
  return { isAdmin: !!session.data.isAdmin };
});

type AlertInput = {
  type: "long" | "short";
  level: number;
  name: string;
  description: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
};

function validate(data: AlertInput) {
  if (!["long", "short"].includes(data.type)) throw new Error("Bad type");
  if (data.level < 1 || data.level > 5) throw new Error("Bad level");
  if (!data.name?.trim()) throw new Error("Chybí název");
  if (!data.description?.trim()) throw new Error("Chybí popis");
  if (data.type === "short") {
    if (data.lat == null || data.lng == null || !data.radius_km) {
      throw new Error("Krátkodobá výstraha potřebuje polohu a okruh");
    }
  }
}

export const createAlert = createServerFn({ method: "POST" })
  .inputValidator((data: AlertInput) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    validate(data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cityValue = data.city?.trim() || null;
    const { data: row, error } = await supabaseAdmin
      .from("alerts")
      .insert({
        type: data.type,
        level: data.level,
        name: data.name.trim().slice(0, 200),
        description: data.description.trim().slice(0, 2000),
        city: cityValue,
        lat: data.type === "short" ? data.lat : null,
        lng: data.type === "short" ? data.lng : null,
        radius_km: data.type === "short" ? data.radius_km : null,
        starts_at: data.starts_at || new Date().toISOString(),
        expires_at: data.expires_at || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Fire-and-forget push send (don't fail alert creation if push fails).
    try {
      const { buildPushPayload } = await import("@block65/webcrypto-web-push");
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@bourkar.cz";
      if (publicKey && privateKey) {
        let q = supabaseAdmin
          .from("subscribers")
          .select("endpoint,p256dh,auth,city")
          .not("endpoint", "is", null);
        if (row.type === "short" && cityValue) q = q.ilike("city", cityValue);
        const { data: subs } = await q;
        const title =
          row.type === "short"
            ? `⚡ Výstraha – ${row.name ?? "bouřka"} (úroveň ${row.level})`
            : `⚠️ ${row.name ?? "Výstraha"} (úroveň ${row.level})`;
        const message = {
          data: { title, body: row.description.slice(0, 300), tag: `alert-${row.id}`, level: row.level, url: "/" },
          options: { ttl: 60 * 60 * 6, urgency: "high" as const },
        };
        const dead: string[] = [];
        await Promise.all(
          (subs ?? []).map(async (s) => {
            if (!s.endpoint || !s.p256dh || !s.auth) return;
            const sub = { endpoint: s.endpoint, expirationTime: null, keys: { auth: s.auth, p256dh: s.p256dh } };
            try {
              const payload = await buildPushPayload(message, sub, { subject, publicKey, privateKey });
              const resp = await fetch(sub.endpoint, {
                method: payload.method,
                headers: payload.headers,
                body: payload.body as BodyInit,
              });
              if (resp.status === 404 || resp.status === 410) dead.push(s.endpoint);
            } catch (e) {
              console.warn("[push] send error", e);
            }
          }),
        );
        if (dead.length) await supabaseAdmin.from("subscribers").delete().in("endpoint", dead);
        console.log(`[push] alert ${row.id}: dispatched to ${subs?.length ?? 0} subscribers`);
      }
    } catch (e) {
      console.error("[push] dispatch failed", e);
    }

    return row;
  });

export const updateAlert = createServerFn({ method: "POST" })
  .inputValidator((data: AlertInput & { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    validate(data);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("alerts")
      .update({
        type: data.type,
        level: data.level,
        name: data.name.trim().slice(0, 200),
        description: data.description.trim().slice(0, 2000),
        lat: data.type === "short" ? data.lat : null,
        lng: data.type === "short" ? data.lng : null,
        radius_km: data.type === "short" ? data.radius_km : null,
        starts_at: data.starts_at || new Date().toISOString(),
        expires_at: data.expires_at || null,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("alerts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
