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
