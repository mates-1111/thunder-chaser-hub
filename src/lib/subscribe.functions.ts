import { createServerFn } from "@tanstack/react-start";

export const upsertSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      city: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      user_agent?: string | null;
    }) => {
      const city = (data.city ?? "").trim();
      const endpoint = (data.endpoint ?? "").trim();
      const p256dh = (data.p256dh ?? "").trim();
      const auth = (data.auth ?? "").trim();
      if (!city || city.length > 100) throw new Error("Invalid city");
      if (!endpoint || endpoint.length > 2000 || !/^https?:\/\//.test(endpoint))
        throw new Error("Invalid endpoint");
      if (!p256dh || p256dh.length > 500) throw new Error("Invalid p256dh");
      if (!auth || auth.length > 500) throw new Error("Invalid auth");
      const ua = (data.user_agent ?? "").toString().slice(0, 500) || null;
      return { city, endpoint, p256dh, auth, user_agent: ua };
    },
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          city: data.city,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.user_agent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    if (error) {
      console.error("[push] upsert subscription", error);
      throw new Error("Failed to save subscription");
    }
    return { ok: true };
  });
