export type InterviewStatus = "rascunho" | "concluida";

export interface Interview {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  started_at: string;
  status: InterviewStatus;
  store_name: string;
  interviewee_name: string;
  interviewee_role: string;
  store_size: string | null;
  city: string;
  consent_recording: boolean;
  consent_at: string | null;
  main_pain_key: string | null;
  commitment_level: string | null;
  commitment_notes: string;
  general_notes: string;
  price_accept_brl: number | null;
  price_too_expensive_brl: number | null;
  price_too_cheap_brl: number | null;
  audio_path: string | null;
  audio_duration_seconds: number;
}

export type InterviewPatch = Partial<Omit<Interview, "id" | "created_by" | "created_at" | "updated_at">>;

export interface AnswerRow {
  interview_id: string;
  question_key: string;
  answer_text: string;
}

export interface PickState {
  rank: 1 | 2 | null;
  no_difference: boolean;
}

export type PicksMap = Record<string, PickState>;

export interface PickRow {
  interview_id: string;
  feature_key: string;
  rank: number | null;
  no_difference: boolean;
}

export interface InterviewBundle {
  interview: Interview;
  answers: Record<string, string>;
  picks: PicksMap;
}

export interface AudioFile {
  name: string;
  path: string;
  url: string;
}
