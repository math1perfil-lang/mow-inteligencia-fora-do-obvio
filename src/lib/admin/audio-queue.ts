/**
 * Fila local (IndexedDB) de gravações que ainda não foram enviadas.
 * Usada quando a loja está sem internet: o áudio fica guardado neste notebook
 * e é reenviado automaticamente quando a conexão volta.
 */
import { uploadInterviewAudio } from "./api";

const DB_NAME = "mow-admin-audio";
const STORE = "pending";

export interface PendingAudio {
  id: string;
  interviewId: string;
  blob: Blob;
  mime: string;
  seconds: number;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB indisponível"));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Falha no IndexedDB"));
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function queueAudio(item: Omit<PendingAudio, "id" | "createdAt">): Promise<void> {
  const record: PendingAudio = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  await run("readwrite", (s) => s.put(record));
}

export async function listPendingAudio(interviewId?: string): Promise<PendingAudio[]> {
  const all = await run<PendingAudio[]>("readonly", (s) => s.getAll() as IDBRequest<PendingAudio[]>);
  return interviewId ? all.filter((a) => a.interviewId === interviewId) : all;
}

async function removePending(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

let flushing = false;

/** Tenta enviar tudo o que está na fila. Retorna quantos arquivos foram enviados. */
export async function flushPendingAudio(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let sent = 0;
  try {
    const items = (await listPendingAudio()).sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      try {
        await uploadInterviewAudio(item.interviewId, item.blob, item.mime, item.seconds);
        await removePending(item.id);
        sent += 1;
      } catch {
        // Sem conexão ou sem sessão: mantém na fila e tenta de novo depois.
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return sent;
}
