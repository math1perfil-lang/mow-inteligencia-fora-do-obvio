import { FEATURES } from "@/lib/admin/questions";
import type { PicksMap } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

interface FeaturePickerProps {
  picks: PicksMap;
  onChange: (next: PicksMap) => void;
}

type Choice = "first" | "second" | "none" | "clear";

function emptyPick() {
  return { rank: null, no_difference: false } as const;
}

export function FeaturePicker({ picks, onChange }: FeaturePickerProps) {
  const apply = (featureKey: string, choice: Choice) => {
    const next: PicksMap = {};
    for (const f of FEATURES) {
      const current = picks[f.key] ?? emptyPick();
      next[f.key] = { rank: current.rank, no_difference: current.no_difference };
    }
    const rankToSet = choice === "first" ? 1 : choice === "second" ? 2 : null;

    // Só uma função pode ser 1ª escolha e só uma pode ser 2ª escolha.
    if (rankToSet !== null) {
      for (const f of FEATURES) {
        const p = next[f.key];
        if (p && p.rank === rankToSet) next[f.key] = { rank: null, no_difference: p.no_difference };
      }
    }
    next[featureKey] =
      choice === "clear"
        ? { rank: null, no_difference: false }
        : choice === "none"
          ? { rank: null, no_difference: true }
          : { rank: rankToSet === 1 ? 1 : 2, no_difference: false };
    onChange(next);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FEATURES.map((f) => {
        const p = picks[f.key] ?? emptyPick();
        const choice: Choice | null = p.rank === 1 ? "first" : p.rank === 2 ? "second" : p.no_difference ? "none" : null;
        const button = (value: Exclude<Choice, "clear">, label: string) => (
          <button
            type="button"
            aria-pressed={choice === value}
            onClick={() => apply(f.key, choice === value ? "clear" : value)}
            className={cn(
              "border px-3 py-1.5 text-xs transition-colors",
              choice === value
                ? "border-foreground bg-foreground text-background"
                : "border-input text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
        return (
          <div key={f.key} className="space-y-3 border border-border bg-card p-4">
            <div>
              <p className="font-medium">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {button("first", "1ª escolha")}
              {button("second", "2ª escolha")}
              {button("none", "Não faria diferença")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
