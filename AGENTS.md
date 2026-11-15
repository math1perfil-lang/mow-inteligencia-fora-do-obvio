<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Landing is one page (`src/routes/index.tsx`) composed of section components in `src/components/mow/`; editable content (projects, social links, privacy URL) lives in `src/content/projects.ts` so it can be updated without touching layout.
- Contact form posts via server function `src/lib/contact.functions.ts` to the URL in the `CONTACT_WEBHOOK_URL` secret (e.g. a Formspree endpoint); without it the form shows a clear error instead of faking success.
- i18n: UI strings live in src/i18n/dict.ts (pt/en/es), provided via LangProvider in the index route; choice saved in localStorage. Why: whole-site language switch without routing changes.
- Admin (`/admin`, private, noindex): research tool for store-owner interviews. Routes in `src/routes/admin.tsx` (auth gate + layout) and `src/routes/admin/`. Questionnaire content, feature candidates and decision thresholds live in `src/lib/admin/questions.ts`. Data access via Supabase client (`src/lib/supabase.ts`, reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`). Schema, RLS (admin-only) and the private `interview-audio` bucket are in `supabase/migrations/20261115000000_admin_entrevistas.sql`. Roles live in `user_roles` (never on the client); the first account created becomes admin. Audio recorded with MediaRecorder; failed uploads are queued in IndexedDB (`src/lib/admin/audio-queue.ts`) and retried when online.
