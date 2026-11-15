import { getSupabase } from "@/lib/supabase";
import type {
  AnswerRow,
  AudioFile,
  Interview,
  InterviewBundle,
  InterviewPatch,
  PickRow,
  PicksMap,
} from "./types";

export const AUDIO_BUCKET = "interview-audio";

const sb = () => getSupabase();

// ---------------------------------------------------------------- Autenticação

export async function adminExists(): Promise<boolean> {
  const { data, error } = await sb().rpc("admin_exists");
  if (error) throw error;
  return data === true;
}

export async function hasAdminRole(userId: string): Promise<boolean> {
  const { data, error } = await sb()
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

// ---------------------------------------------------------------- Entrevistas

export async function listInterviews(): Promise<Interview[]> {
  const { data, error } = await sb().from("interviews").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Interview[];
}

export async function createInterview(): Promise<Interview> {
  const { data, error } = await sb().from("interviews").insert({}).select("*").single();
  if (error) throw error;
  return data as Interview;
}

export async function getInterviewBundle(id: string): Promise<InterviewBundle | null> {
  const [iv, ans, pk] = await Promise.all([
    sb().from("interviews").select("*").eq("id", id).maybeSingle(),
    sb().from("interview_answers").select("question_key, answer_text").eq("interview_id", id),
    sb().from("interview_feature_picks").select("feature_key, rank, no_difference").eq("interview_id", id),
  ]);
  if (iv.error) throw iv.error;
  if (ans.error) throw ans.error;
  if (pk.error) throw pk.error;
  if (!iv.data) return null;

  const answers: Record<string, string> = {};
  for (const row of (ans.data ?? []) as { question_key: string; answer_text: string }[]) {
    answers[row.question_key] = row.answer_text;
  }
  const picks: PicksMap = {};
  for (const row of (pk.data ?? []) as { feature_key: string; rank: number | null; no_difference: boolean }[]) {
    picks[row.feature_key] = {
      rank: row.rank === 1 || row.rank === 2 ? row.rank : null,
      no_difference: row.no_difference,
    };
  }
  return { interview: iv.data as Interview, answers, picks };
}

export async function patchInterview(id: string, patch: InterviewPatch): Promise<void> {
  const { error } = await sb().from("interviews").update(patch).eq("id", id);
  if (error) throw error;
}

export async function saveAnswers(interviewId: string, answers: Record<string, string>): Promise<void> {
  const rows = Object.entries(answers).map(([question_key, answer_text]) => ({
    interview_id: interviewId,
    question_key,
    answer_text,
  }));
  if (rows.length === 0) return;
  const { error } = await sb().from("interview_answers").upsert(rows, { onConflict: "interview_id,question_key" });
  if (error) throw error;
}

export async function savePicks(interviewId: string, picks: PicksMap): Promise<void> {
  const rows = Object.entries(picks).map(([feature_key, p]) => ({
    interview_id: interviewId,
    feature_key,
    rank: p.rank,
    no_difference: p.no_difference,
  }));
  if (rows.length === 0) return;
  const { error } = await sb().from("interview_feature_picks").upsert(rows, { onConflict: "interview_id,feature_key" });
  if (error) throw error;
}

// ---------------------------------------------------------------- Áudio

function baseMime(mime: string): string {
  return (mime.split(";")[0] ?? "audio/webm").trim() || "audio/webm";
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

/** Envia uma gravação ao bucket privado e soma a duração ao total da entrevista. */
export async function uploadInterviewAudio(
  interviewId: string,
  blob: Blob,
  mime: string,
  durationSeconds: number,
): Promise<string> {
  const path = `${interviewId}/${Date.now()}.${extensionFor(mime)}`;
  const { error } = await sb()
    .storage.from(AUDIO_BUCKET)
    .upload(path, blob, { contentType: baseMime(mime), upsert: false });
  if (error) throw error;

  const { data: current } = await sb()
    .from("interviews")
    .select("audio_duration_seconds")
    .eq("id", interviewId)
    .maybeSingle();
  const previous = (current as { audio_duration_seconds: number } | null)?.audio_duration_seconds ?? 0;
  await patchInterview(interviewId, {
    audio_path: path,
    audio_duration_seconds: previous + Math.max(0, Math.round(durationSeconds)),
  });
  return path;
}

export async function listInterviewAudio(interviewId: string): Promise<AudioFile[]> {
  const { data, error } = await sb()
    .storage.from(AUDIO_BUCKET)
    .list(interviewId, { sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  const files = (data ?? []).filter((f) => f.name && !f.name.endsWith("/"));
  if (files.length === 0) return [];

  const paths = files.map((f) => `${interviewId}/${f.name}`);
  const signed = await sb().storage.from(AUDIO_BUCKET).createSignedUrls(paths, 60 * 60);
  if (signed.error) throw signed.error;

  const out: AudioFile[] = [];
  for (const item of signed.data ?? []) {
    if (item.signedUrl && item.path) {
      out.push({ name: item.path.split("/").pop() ?? item.path, path: item.path, url: item.signedUrl });
    }
  }
  return out;
}

// ---------------------------------------------------------------- Análise

export interface AnalysisData {
  interviews: Interview[];
  answers: AnswerRow[];
  picks: PickRow[];
}

export async function loadAnalysisData(): Promise<AnalysisData> {
  const [iv, ans, pk] = await Promise.all([
    sb().from("interviews").select("*").order("created_at", { ascending: false }),
    sb().from("interview_answers").select("interview_id, question_key, answer_text"),
    sb().from("interview_feature_picks").select("interview_id, feature_key, rank, no_difference"),
  ]);
  if (iv.error) throw iv.error;
  if (ans.error) throw ans.error;
  if (pk.error) throw pk.error;
  return {
    interviews: (iv.data ?? []) as Interview[],
    answers: (ans.data ?? []) as AnswerRow[],
    picks: (pk.data ?? []) as PickRow[],
  };
}
