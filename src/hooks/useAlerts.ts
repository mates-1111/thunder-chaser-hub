import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Alert = {
  id: string;
  type: "long" | "short";
  level: number;
  name: string | null;
  description: string;
  city: string | null;
  lat: number | null;
  lng: number | null;
  radius_km: number | null;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
};

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (!cancelled && data) setAlerts(data as unknown as Alert[]);
    }
    load();

    const channel = supabase.channel("alerts-stream");
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const a = payload.new as Alert;
            setAlerts((cur) => [a, ...cur.filter((x) => x.id !== a.id)]);
            maybeNotify(a);
          } else if (payload.eventType === "UPDATE") {
            const a = payload.new as Alert;
            setAlerts((cur) => cur.map((x) => (x.id === a.id ? a : x)));
          } else if (payload.eventType === "DELETE") {
            const id = (payload.old as { id: string }).id;
            setAlerts((cur) => cur.filter((x) => x.id !== id));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter expired
  const now = Date.now();
  return alerts.filter((a) => !a.expires_at || new Date(a.expires_at).getTime() > now);
}

function maybeNotify(a: Alert) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const title =
    a.type === "short"
      ? `⚡ Bouřka v okolí (úroveň ${a.level})`
      : `⚠️ Výstraha (úroveň ${a.level})`;
  try {
    new Notification(title, {
      body: a.name ? `${a.name}\n${a.description}` : a.description,
      tag: a.id,
    });
  } catch (e) {
    console.warn("Notification failed", e);
  }
}
