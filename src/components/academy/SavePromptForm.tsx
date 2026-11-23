import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AreaId } from "@/lib/academy/areas";
import { updateAcademy } from "@/lib/academy/store";

export function SavePromptForm({
  text,
  quality,
  area,
  defaultTitle,
}: {
  text: string;
  quality: number;
  area: AreaId;
  defaultTitle: string;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [saved, setSaved] = useState(false);
  return (
    <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-border pt-4">
      <div className="min-w-48 flex-1">
        <label htmlFor="save-title" className="eyebrow text-muted-foreground">
          Título na biblioteca
        </label>
        <Input
          id="save-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
          className="mt-2 h-12 text-base"
        />
      </div>
      <Button
        variant="outline"
        disabled={saved || !title.trim()}
        onClick={() => {
          const now = new Date().toISOString();
          updateAcademy((s) => ({
            ...s,
            prompts: [
              {
                id: crypto.randomUUID(),
                title: title.trim(),
                area,
                category: "Curso",
                objective: "",
                text,
                version: 1,
                createdAt: now,
                updatedAt: now,
                quality,
                result: "",
                notes: "",
                status: "em teste",
              },
              ...s.prompts,
            ],
          }));
          setSaved(true);
        }}
      >
        {saved ? "Salvo na biblioteca" : "Salvar na biblioteca"}
      </Button>
    </div>
  );
}
