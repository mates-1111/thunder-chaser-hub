// VAPID public key is safe to expose to the browser.
export const VAPID_PUBLIC_KEY =
  "BMlrNlm4XhNnOJhh0cibo55i5TrKGTHQNZiUbZDsNx59SEnz4r4Yk1GTvpMXj7P4zpUsM9Fzof2-qU7Bl0AeEsA";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
