import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredCity } from "@/components/PushDialog";

export type Alert = {
  id: string;
  type: "long" | "short";
  level: number;
  description: string;
  city: string | null;
  radius_km: number | null;
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
      if (!cancelled && data) setAlerts(data as Alert[]);
    }
    load();

    const channel = supabase
      .channel("alerts-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const a = payload.new as Alert;
            setAlerts((cur) => [a, ...cur]);
            maybeNotify(a);
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

  return alerts;
}

function maybeNotify(a: Alert) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const city = getStoredCity();
  if (!city) return;
  // Long-range alerts apply to everyone subscribed; short-range only when city matches.
  if (a.type === "short") {
    if (!a.city || a.city.toLowerCase() !== city.toLowerCase()) return;
  }
  const title =
    a.type === "short"
      ? `⚡ Bouřka u tebe (úroveň ${a.level})`
      : `⚠️ Výstraha (úroveň ${a.level})`;
  try {
    new Notification(title, {
      body: a.description,
      tag: a.id,
    });
  } catch (e) {
    console.warn("Notification failed", e);
  }
}
