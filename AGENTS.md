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
- Admin (`/admin`, private, noindex): multi-sector market-validation interview tool (car dealers, dental, engineering, restaurants, salons, real estate, other). Own light admin theme: `html.admin-theme` class (set by `src/routes/admin.tsx`) overrides the design tokens in `src/styles.css`; do not reuse the public site's fonts or dark theme there. Routes: `admin.tsx` (auth gate + sidebar layout), `admin/index.tsx` (dashboard), `admin/entrevistas.index.tsx` (list), `admin/entrevistas.$id.tsx` (interview, autosave), `admin/analise.tsx` (cross-sector analysis, CSV), `admin/roteiros.tsx` (read-only scripts). Each sector has its OWN script (context, pains, tools, value questions, pain options mapped to shared themes, feature candidates) in `src/lib/admin/sectors.ts` (add a sector = add an item; no migration needed). Universal script, pain categories and decision thresholds: `src/lib/admin/questions.ts`. Data via Supabase (`src/lib/supabase.ts`; `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Schema/RLS/private `interview-audio` bucket: `supabase/migrations/20261115000000_admin_entrevistas.sql`, multi-sector columns: `20261115120000_multi_setor.sql`. Roles in `user_roles`; first account becomes admin. Audio via MediaRecorder with IndexedDB retry queue (`src/lib/admin/audio-queue.ts`). There is no voice dictation: the keyboard microphone is used for typing.
