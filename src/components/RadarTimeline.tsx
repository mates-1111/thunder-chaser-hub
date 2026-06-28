import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack } from "lucide-react";
import { type RadarFrame, formatTime } from "@/lib/radar";
import { cn } from "@/lib/utils";

interface RadarTimelineProps {
  past: RadarFrame[];
  nowcast: RadarFrame[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
}

const FRAME_MS = 700;

export function RadarTimeline({
  past,
  nowcast,
  currentIndex,
  onIndexChange,
}: RadarTimelineProps) {
  const frames = [...past, ...nowcast];
  const [playing, setPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // přehrávání
  useEffect(() => {
    if (!playing || dragging || frames.length === 0) return;
    const id = setInterval(() => {
      onIndexChange((currentIndex + 1) % frames.length);
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [playing, dragging, currentIndex, frames.length, onIndexChange]);

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || frames.length === 0) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(ratio * (frames.length - 1));
    },
    [frames.length],
  );

  // drag handlers – pointer events pokrývají myš i dotyk
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setPlaying(false);
    onIndexChange(indexFromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onIndexChange(indexFromClientX(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };

  // klávesnice
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onIndexChange(Math.max(0, currentIndex - 1));
      setPlaying(false);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onIndexChange(Math.min(frames.length - 1, currentIndex + 1));
      setPlaying(false);
    } else if (e.key === " ") {
      e.preventDefault();
      setPlaying((p) => !p);
    }
  };

  if (frames.length === 0) return null;

  const current = frames[currentIndex];
  const isPrediction = currentIndex >= past.length;
  const nowIdx = past.length - 1;
  const ratio = currentIndex / Math.max(1, frames.length - 1);

  return (
    <div className="pointer-events-auto absolute bottom-20 left-1/2 z-[1000] w-[min(720px,calc(100vw-24px))] -translate-x-1/2 select-none rounded-xl bg-panel/95 px-4 py-3 text-panel-foreground shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
          aria-label={playing ? "Pauza" : "Přehrát"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => {
            onIndexChange(0);
            setPlaying(false);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Na začátek"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <div className="ml-1 flex-1 text-xs tabular-nums text-muted-foreground">
          <span className="text-sm font-semibold text-foreground">
            {formatTime(current.time)}
          </span>{" "}
          {isPrediction ? (
            <span className="text-bolt">
              · +{(currentIndex - nowIdx) * 10} min · predikce
            </span>
          ) : currentIndex === nowIdx ? (
            <span>· nyní</span>
          ) : (
            <span>· {(nowIdx - currentIndex) * 10} min zpět</span>
          )}
        </div>
      </div>

      {/* Drag scrubber */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={frames.length - 1}
        aria-valuenow={currentIndex}
        aria-label="Časová osa radaru – drž a táhni"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className={cn(
          "relative mt-3 h-10 cursor-grab touch-none rounded-lg",
          "bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40",
          dragging && "cursor-grabbing",
        )}
        style={{ touchAction: "none" }}
      >
        {/* dělící čára = teď */}
        <div
          className="absolute top-1 bottom-1 w-px bg-bolt/60"
          style={{ left: `${(nowIdx / (frames.length - 1)) * 100}%` }}
          aria-hidden
        />

        {/* sloupečky snímků */}
        <div className="absolute inset-0 flex items-center gap-[2px] px-1.5">
          {frames.map((f, i) => {
            const isFuture = i > nowIdx;
            const isNow = i === nowIdx;
            const active = i === currentIndex;
            return (
              <div
                key={f.time}
                className={cn(
                  "flex-1 rounded-[2px] transition-all",
                  active ? "h-7 opacity-100" : "h-5 opacity-60",
                  isFuture
                    ? "bg-bolt"
                    : isNow
                      ? "bg-bolt"
                      : "bg-foreground/70",
                )}
                aria-hidden
              />
            );
          })}
        </div>

        {/* Scrubber rukojeť */}
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bolt shadow-lg ring-2 ring-bolt/30 transition-transform",
            dragging ? "h-10 w-3 ring-4" : "h-8 w-2.5",
          )}
          style={{ left: `${ratio * 100}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>−{past.length * 10} min</span>
        <span className="font-semibold text-bolt">nyní</span>
        <span>+{nowcast.length * 10} min</span>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        Radar RainViewer · podrž a táhni rukojeť, nebo šipky ←/→
      </div>
    </div>
  );
}
