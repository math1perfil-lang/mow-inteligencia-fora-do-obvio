import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ditado por voz (fala vira texto) usando o reconhecimento de voz do navegador.
 * Só um campo dita por vez. O texto parcial aparece ao vivo e o texto final é
 * entregue ao callback, que o acrescenta à resposta.
 *
 * Observações: depende de internet (o navegador envia o áudio ao serviço de voz
 * dele) e só existe no Chrome, Edge e Safari. Não há tipos oficiais no TypeScript,
 * por isso as interfaces mínimas abaixo.
 */

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: RecognitionAlternative | undefined;
}
interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult | undefined };
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const FATAL_MESSAGES: Record<string, string> = {
  "not-allowed": "Permissão do microfone negada. Libere o microfone nas configurações do navegador.",
  "service-not-allowed": "O navegador não permite o ditado neste dispositivo.",
  "audio-capture":
    "Não foi possível usar o microfone para ditar. Se a gravação de áudio estiver ligada, tente pausá-la ou use o Chrome no notebook.",
  network: "O ditado precisa de internet.",
  "language-not-supported": "O navegador não suporta ditado em português.",
};

export function useDictation(onFinal: (key: string, text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const keyRef = useRef<string | null>(null);
  const wantRef = useRef(false);
  const quickEndsRef = useRef(0);
  const startedAtRef = useRef(0);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  const start = useCallback((key: string) => {
    const Ctor = getCtor();
    if (!Ctor || recRef.current) return;

    setError(null);
    setInterim("");
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        const alt = result?.[0];
        if (!result || !alt) continue;
        if (result.isFinal) {
          const text = alt.transcript.trim();
          if (text && keyRef.current) onFinalRef.current(keyRef.current, text);
        } else {
          partial += alt.transcript;
        }
      }
      setInterim(partial);
    };

    rec.onerror = (e) => {
      // "no-speech" (silêncio) e "aborted" são normais: o onend reinicia sozinho.
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantRef.current = false;
      setError(FATAL_MESSAGES[e.error] ?? "O ditado falhou. Tente de novo.");
    };

    rec.onend = () => {
      if (wantRef.current && recRef.current === rec) {
        // O navegador encerra após alguns segundos de silêncio: continua ouvindo.
        const livedMs = Date.now() - startedAtRef.current;
        quickEndsRef.current = livedMs < 800 ? quickEndsRef.current + 1 : 0;
        if (quickEndsRef.current < 4) {
          try {
            startedAtRef.current = Date.now();
            rec.start();
            return;
          } catch {
            // cai na limpeza abaixo
          }
        } else {
          setError("O ditado não conseguiu continuar. Toque em Ditar de novo.");
        }
      }
      if (recRef.current === rec) recRef.current = null;
      keyRef.current = null;
      wantRef.current = false;
      setActiveKey(null);
      setInterim("");
    };

    recRef.current = rec;
    keyRef.current = key;
    wantRef.current = true;
    quickEndsRef.current = 0;
    startedAtRef.current = Date.now();
    try {
      rec.start();
      setActiveKey(key);
    } catch {
      recRef.current = null;
      keyRef.current = null;
      wantRef.current = false;
      setError("Não foi possível iniciar o ditado.");
    }
  }, []);

  /** Para de ouvir, mas ainda entrega as últimas palavras que estavam sendo processadas. */
  const stop = useCallback(() => {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      // já parado
    }
  }, []);

  useEffect(
    () => () => {
      wantRef.current = false;
      const rec = recRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.abort();
        } catch {
          // já parado
        }
      }
    },
    [],
  );

  return { supported, activeKey, interim, error, start, stop };
}
