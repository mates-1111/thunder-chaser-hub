import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "bourkar.pushCity";

export function getStoredCity(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function PushDialog({
  open,
  onOpenChange,
  onSubscribed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubscribed?: (city: string) => void;
}) {
  const [city, setCity] = useState(getStoredCity() ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) {
      toast.error("Zadej město.");
      return;
    }
    setBusy(true);
    try {
      // Request notification permission
      if (!("Notification" in window)) {
        toast.error("Tvůj prohlížeč nepodporuje notifikace.");
        return;
      }
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Notifikace nebyly povolené.");
        return;
      }

      localStorage.setItem(STORAGE_KEY, trimmed);
      await supabase.from("subscribers").insert({ city: trimmed });

      toast.success(`Notifikace zapnuty pro ${trimmed}.`);
      onSubscribed?.(trimmed);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Nepodařilo se zapnout notifikace.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Zapnout push notifikace</DialogTitle>
          <DialogDescription>
            Zadej svoje město. Když se k tobě bude blížit bouřka, pípneme ti.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="push-city">Město</Label>
            <Input
              id="push-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="např. Brno"
              autoFocus
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Zapínám…" : "Zapnout notifikace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
