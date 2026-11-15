import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ditado por voz (fala vira texto) usando o reconhecimento de voz do navegador.
 * Só um campo dita por vez. O texto parcial aparece ao vivo e o texto final é
 * entregue ao callback, que o acrescenta à resposta.
 *
 * Observações: depende de internet (o navegador envia o áudio ao serviço de voz
 * dele) e só funciona de verdade no Chrome, Edge e Safari "de verdade". Navegadores
 * embutidos em apps costumam expor a API mas nunca iniciar a escuta, por isso há um
 * vigia que avisa quando o ditado não começa. Não há tipos oficiais no TypeScript,
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
  onstart: (() => void) | null;
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
  "service-not-allowed":
    "O navegador não permite o ditado neste dispositivo. No iPhone, ligue o Ditado em Ajustes > Geral > Teclado.",
  "audio-capture":
    "Não foi possível usar o microfone para ditar. Se a gravação de áudio estiver ligada, tente pausá-la ou use o Chrome no notebook.",
  network: "O ditado precisa de internet.",
  "language-not-supported": "O navegador não suporta ditado em português.",
};

const NOT_STARTED_MESSAGE =
  "O ditado não iniciou neste navegador. Abra o site direto no Chrome (notebook) ou no Safari, fora de navegadores embutidos em apps.";

/** Tempo máximo esperando o navegador começar a ouvir (inclui o aviso de permissão). */
const START_TIMEOUT_MS = 15000;
/** Tempo que o "Parar" espera as últimas palavras antes de encerrar à força. */
const STOP_GRACE_MS = 1500;

export function useDictation(onFinal: (key: string, text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const keyRef = useRef<string | null>(null);
  const wantRef = useRef(false);
  const quickEndsRef = useRef(0);
  const startedAtRef = useRef(0);
  const watchdogRef = useRef<number | undefined>(undefined);
  const graceRef = useRef<number | undefined>(undefined);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  /** Solta um reconhecimento: desliga os eventos e, se pedido, aborta a escuta. */
  const release = useCallback((rec: Recognition, abort: boolean) => {
    window.clearTimeout(watchdogRef.current);
    window.clearTimeout(graceRef.current);
    rec.onstart = null;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    if (abort) {
      try {
        rec.abort();
      } catch {
        // já parado
      }
    }
    if (recRef.current === rec) {
      recRef.current = null;
      keyRef.current = null;
      wantRef.current = false;
      setActiveKey(null);
      setListening(false);
      setInterim("");
    }
  }, []);

  const start = useCallback(
    (key: string) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      // Sobrou um reconhecimento travado de antes: descarta e começa do zero.
      if (recRef.current) release(recRef.current, true);

      setError(null);
      setInterim("");
      setListening(false);
      const rec = new Ctor();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        window.clearTimeout(watchdogRef.current);
        setListening(true);
      };

      rec.onresult = (e) => {
        window.clearTimeout(watchdogRef.current);
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
        setError(FATAL_MESSAGES[e.error] ?? "O ditado falhou. Tente de novo.");
        release(rec, true);
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
        release(rec, false);
      };

      recRef.current = rec;
      keyRef.current = key;
      wantRef.current = true;
      quickEndsRef.current = 0;
      startedAtRef.current = Date.now();
      try {
        rec.start();
        setActiveKey(key);
        // Vigia: se o navegador nunca começar a ouvir, avisa em vez de ficar travado.
        window.clearTimeout(watchdogRef.current);
        watchdogRef.current = window.setTimeout(() => {
          if (recRef.current === rec) {
            setError(NOT_STARTED_MESSAGE);
            release(rec, true);
          }
        }, START_TIMEOUT_MS);
      } catch {
        release(rec, true);
        setError("Não foi possível iniciar o ditado.");
      }
    },
    [release],
  );

  /**
   * Para de ouvir. A tela responde na hora; o navegador ainda tem um instante para
   * entregar as últimas palavras e, se não avisar que terminou, é encerrado à força.
   */
  const stop = useCallback(() => {
    wantRef.current = false;
    setActiveKey(null);
    setListening(false);
    setInterim("");
    const rec = recRef.current;
    if (!rec) return;
    window.clearTimeout(watchdogRef.current);
    try {
      rec.stop();
    } catch {
      // já parado
    }
    window.clearTimeout(graceRef.current);
    graceRef.current = window.setTimeout(() => release(rec, true), STOP_GRACE_MS);
  }, [release]);

  useEffect(
    () => () => {
      wantRef.current = false;
      window.clearTimeout(watchdogRef.current);
      window.clearTimeout(graceRef.current);
      const rec = recRef.current;
      if (rec) {
        rec.onstart = null;
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

  return { supported, activeKey, listening, interim, error, start, stop };
}
