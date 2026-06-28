import { useEffect, useState } from "react";
import { Pause, Play, SkipBack } from "lucide-react";
import { type RadarFrame, formatTime } from "@/lib/radar";
import { cn } from "@/lib/utils";

interface RadarTimelineProps {
  past: RadarFrame[];
  nowcast: RadarFrame[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
}

const FRAME_MS = 600;

export function RadarTimeline({
  past,
  nowcast,
  currentIndex,
  onIndexChange,
}: RadarTimelineProps) {
  const frames = [...past, ...nowcast];
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => {
      onIndexChange((currentIndex + 1) % frames.length);
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [playing, currentIndex, frames.length, onIndexChange]);

  if (frames.length === 0) return null;

  const current = frames[currentIndex];
  const isPrediction = currentIndex >= past.length;
  const nowIdx = past.length - 1;

  return (
    <div className="pointer-events-auto absolute bottom-20 left-1/2 z-[1000] w-[min(720px,calc(100vw-32px))] -translate-x-1/2 rounded-xl bg-panel/95 px-4 py-3 text-panel-foreground shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
          aria-label={playing ? "Pauza" : "Přehrát"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onIndexChange(0)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Na začátek"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <div className="ml-2 flex-1 text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{formatTime(current.time)}</span>{" "}
          {isPrediction ? (
            <span className="text-bolt">
              · +{(currentIndex - nowIdx) * 10} min (predikce)
            </span>
          ) : (
            <span>
              · {currentIndex === nowIdx ? "nyní" : `${(nowIdx - currentIndex) * -10} min`}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-end gap-[3px]">
        {frames.map((f, i) => {
          const isFuture = i >= past.length;
          const active = i === currentIndex;
          return (
            <button
              key={f.time}
              onClick={() => {
                setPlaying(false);
                onIndexChange(i);
              }}
              className={cn(
                "flex-1 rounded-sm transition-all",
                active ? "h-7" : "h-5 opacity-70 hover:opacity-100",
                isFuture
                  ? "bg-bolt"
                  : i === nowIdx
                    ? "bg-bolt"
                    : "bg-muted-foreground/70",
              )}
              aria-label={formatTime(f.time)}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>−{past.length * 10} min</span>
        <span className="text-bolt">nyní</span>
        <span>+{nowcast.length * 10} min</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        Radar RainViewer · měření po ~10 min, predikce vpravo
      </div>
    </div>
  );
}
