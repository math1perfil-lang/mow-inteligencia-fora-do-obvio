import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "paused";

export interface RecordingResult {
  blob: Blob;
  mime: string;
  seconds: number;
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

/** Gravador de áudio com pausar/retomar. O estado vive no componente que usa o hook. */
export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef("");
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef(0);

  const elapsed = useCallback((): number => {
    const running = segmentStartRef.current > 0 ? (Date.now() - segmentStartRef.current) / 1000 : 0;
    return accumulatedRef.current + running;
  }, []);

  useEffect(() => {
    if (state !== "recording") return;
    const id = window.setInterval(() => setSeconds(Math.floor(elapsed())), 250);
    return () => window.clearInterval(id);
  }, [state, elapsed]);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") rec.stop();
      releaseStream();
    },
    [],
  );

  const start = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador não permite gravar áudio. Use o Chrome ou o Safari em HTTPS.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      mimeRef.current = mime;
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = rec;
      accumulatedRef.current = 0;
      segmentStartRef.current = Date.now();
      rec.start(1000);
      setSeconds(0);
      setState("recording");
      return true;
    } catch (e) {
      releaseStream();
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Permissão do microfone negada. Libere o microfone nas configurações do navegador e tente de novo."
          : name === "NotFoundError"
            ? "Nenhum microfone encontrado neste dispositivo."
            : "Não foi possível iniciar a gravação.",
      );
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") return;
    rec.pause();
    accumulatedRef.current = elapsed();
    segmentStartRef.current = 0;
    setSeconds(Math.floor(accumulatedRef.current));
    setState("paused");
  }, [elapsed]);

  const resume = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "paused") return;
    rec.resume();
    segmentStartRef.current = Date.now();
    setState("recording");
  }, []);

  const stop = useCallback((): Promise<RecordingResult | null> => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return Promise.resolve(null);
    const total = elapsed();
    return new Promise((resolve) => {
      rec.onstop = () => {
        const mime = rec.mimeType || mimeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        recorderRef.current = null;
        releaseStream();
        accumulatedRef.current = 0;
        segmentStartRef.current = 0;
        setSeconds(0);
        setState("idle");
        resolve(blob.size > 0 ? { blob, mime, seconds: total } : null);
      };
      rec.stop();
    });
  }, [elapsed]);

  return { state, seconds, error, start, pause, resume, stop };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
