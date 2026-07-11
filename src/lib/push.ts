import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "./push-config";
import { upsertSubscription } from "./subscribe.functions";

export const PUSH_CITY_KEY = "bourkar.pushCity";
export const PUSH_DISMISSED_KEY = "bourkar.pushDismissed";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registerSW(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

function subToJson(sub: PushSubscription) {
  const j = sub.toJSON();
  return {
    endpoint: j.endpoint!,
    p256dh: j.keys?.p256dh ?? "",
    auth: j.keys?.auth ?? "",
  };
}

export async function enablePushForCity(city: string): Promise<void> {
  if (!pushSupported()) throw new Error("Tvůj prohlížeč nepodporuje push notifikace.");

  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifikace nebyly povolené.");

  const reg = await registerSW();
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const { endpoint, p256dh, auth } = subToJson(sub);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null;

  // Upsert by endpoint. Try update first; if 0 rows, insert.
  const { data: updated, error: upErr } = await supabase
    .from("subscribers")
    .update({ city, p256dh, auth, user_agent: ua, updated_at: new Date().toISOString() })
    .eq("endpoint", endpoint)
    .select("id");

  if (upErr) throw upErr;
  if (!updated || updated.length === 0) {
    const { error: insErr } = await supabase
      .from("subscribers")
      .insert({ city, endpoint, p256dh, auth, user_agent: ua });
    if (insErr && !String(insErr.message).includes("duplicate")) throw insErr;
  }

  localStorage.setItem(PUSH_CITY_KEY, city);
}

export function getStoredCity(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PUSH_CITY_KEY);
}

export function markPushDismissed() {
  if (typeof window !== "undefined") localStorage.setItem(PUSH_DISMISSED_KEY, "1");
}

export function shouldPromptForPush(): boolean {
  if (!pushSupported()) return false;
  if (getStoredCity()) return false;
  if (typeof localStorage !== "undefined" && localStorage.getItem(PUSH_DISMISSED_KEY)) return false;
  if (Notification.permission === "denied") return false;
  return true;
}
