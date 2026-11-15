import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatClock, useAudioRecorder } from "@/hooks/useAudioRecorder";
import { listInterviewAudio, uploadInterviewAudio } from "@/lib/admin/api";
import { listPendingAudio, queueAudio } from "@/lib/admin/audio-queue";
import type { AudioFile } from "@/lib/admin/types";

interface AudioBarProps {
  interviewId: string;
  /** Gravar só é permitido depois do consentimento do entrevistado. */
  consent: boolean;
  /** Chamado depois que um áudio é enviado, para o pai atualizar a duração total. */
  onUploaded: () => void;
  /** Avisa o pai quando começa/termina uma gravação (para travar "Concluir" no meio dela). */
  onRecordingChange: (recording: boolean) => void;
}

export function AudioBar({ interviewId, consent, onUploaded, onRecordingChange }: AudioBarProps) {
  const recorder = useAudioRecorder();
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [pending, setPending] = useState(0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setFiles(await listInterviewAudio(interviewId));
    } catch {
      // Sem conexão: a lista aparece quando voltar.
    }
    try {
      setPending((await listPendingAudio(interviewId)).length);
    } catch {
      setPending(0);
    }
  }, [interviewId]);

  useEffect(() => {
    void refresh();
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, [refresh]);

  // Evita perder a gravação ao fechar a aba sem querer.
  useEffect(() => {
    if (recorder.state === "idle") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [recorder.state]);

  const stopAndSave = async () => {
    setSaving(true);
    const result = await recorder.stop();
    if (!result) {
      setSaving(false);
      toast.error("A gravação ficou vazia.");
      return;
    }
    try {
      if (!navigator.onLine) throw new Error("offline");
      await uploadInterviewAudio(interviewId, result.blob, result.mime, result.seconds);
      toast.success("Áudio salvo.");
      onUploaded();
    } catch {
      try {
        await queueAudio({
          interviewId,
          blob: result.blob,
          mime: result.mime,
          seconds: result.seconds,
        });
        toast.warning("Áudio guardado neste notebook. Será enviado quando houver conexão.");
      } catch {
        toast.error("Não foi possível salvar o áudio. Baixe antes de fechar.");
      }
    } finally {
      setSaving(false);
      await refresh();
    }
  };

  const recording = recorder.state !== "idle";

  useEffect(() => {
    onRecordingChange(recording);
  }, [recording, onRecordingChange]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:left-60 border-t border-border bg-background/95 backdrop-blur">
      {open ? (
        <div className="mx-auto max-h-56 max-w-[1100px] space-y-3 overflow-y-auto px-5 py-3">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma gravação enviada ainda.</p>
          ) : (
            files.map((f, idx) => (
              <div key={f.path} className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground">Trecho {idx + 1}</span>
                <audio controls preload="none" src={f.url} className="h-9 max-w-full" />
                <a href={f.url} download={f.name} className="text-xs underline underline-offset-4">
                  Baixar
                </a>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-5 py-3">
        <span
          aria-live="polite"
          className={`text-xs font-medium uppercase tracking-wide ${recorder.state === "recording" ? "text-destructive" : "text-muted-foreground"}`}
        >
          {recorder.state === "recording" ? "● Gravando" : recorder.state === "paused" ? "Pausado" : "Áudio"}
        </span>
        <span className="font-mono text-lg tabular-nums">{formatClock(recorder.seconds)}</span>

        {!recording ? (
          <Button
            size="sm"
            disabled={!consent || saving}
            title={consent ? undefined : "Marque a autorização do entrevistado na etapa Abertura"}
            onClick={() => void recorder.start()}
          >
            Gravar
          </Button>
        ) : (
          <>
            {recorder.state === "recording" ? (
              <Button size="sm" variant="outline" onClick={recorder.pause}>
                Pausar
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={recorder.resume}>
                Retomar
              </Button>
            )}
            <Button size="sm" variant="destructive" disabled={saving} onClick={() => void stopAndSave()}>
              {saving ? "Salvando…" : "Parar e salvar"}
            </Button>
          </>
        )}

        {!consent && !recording ? (
          <span className="text-xs text-muted-foreground">Marque a autorização na etapa Abertura para gravar.</span>
        ) : null}
        {pending > 0 ? (
          <span className="text-xs text-muted-foreground">{pending} gravação(ões) aguardando conexão</span>
        ) : null}
        {recorder.error ? (
          <span role="alert" className="text-xs text-destructive">
            {recorder.error}
          </span>
        ) : null}

        <Button className="ml-auto" size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          Gravações ({files.length}) {open ? "▾" : "▴"}
        </Button>
      </div>
    </div>
  );
}
