import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LocalWeatherDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [city, setCity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCity("");
    setTemperature("");
    setPhoto(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!city.trim() || !temperature.trim()) {
      toast.error("Vyplňte město a teplotu.");
      return;
    }
    setSubmitting(true);
    try {
      // TODO: odeslat na server (Lovable Cloud)
      await new Promise((r) => setTimeout(r, 400));
      toast.success(`Díky! ${city}: ${temperature} °C${photo ? " (s fotkou)" : ""}`);
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Počasí u vás</DialogTitle>
          <DialogDescription>
            Nahlaste, jak je u vás. Foto je dobrovolné.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">Město / obec</Label>
            <Input
              id="city"
              placeholder="např. Brno"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="temp">Teplota (°C)</Label>
            <Input
              id="temp"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="např. 23.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="photo">
              Foto <span className="text-muted-foreground">(volitelné)</span>
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            {photo && (
              <p className="text-xs text-muted-foreground truncate">{photo.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Odesílám…" : "Odeslat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
