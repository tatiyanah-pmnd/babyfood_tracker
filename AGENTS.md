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

## Architecture rules
- Access control is family-based: every baby belongs to a `families` row; RLS uses security-definer helpers (`is_family_member`, `can_edit_family`, `is_family_owner`) so permissions never rely on frontend checks.
- App-wide roles (admin) live only in `user_roles`; family roles live in `family_members` — never store roles on profiles.
- Signed-in pages live under `src/routes/_authenticated/` and wrap content in `AppShell` (bottom nav on mobile, sidebar on desktop).
- Selected baby is a per-device UI preference in localStorage (`useSelectedBaby`); all data stays in the database.
- Advertising data must stay separate from family/health data and never be targeted on it.
