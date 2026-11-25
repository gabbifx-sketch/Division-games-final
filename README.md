# DIVISION

A browser-games platform foundation built with **plain HTML, CSS and JavaScript**. No React, no frontend framework, and no build step.

## Run locally
Open `index.html` in a browser, or use the VS Code Live Server extension.

## Frontend structure
- `index.html` — homepage
- `styles.css` — homepage styles and responsive layout
- `app.js` — demo catalogue, search, category interactions
- `pages.css` — shared styles for secondary pages
- `login.html`, `register.html` — authentication screens (UI only until Supabase is connected)
- `game.html`, `game.js` — game detail/player placeholder
- `profile.html`, `settings.html` — player account pages (preview)
- `about.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html` — information pages
- `admin/index.html`, `admin.js` — admin dashboard preview
- `assets/division-mark.svg` — editable SVG brand mark
- `supabase/schema.sql` — proposed database schema and row-level security policies

## Demo content
The catalogue in `app.js` and `game.js` is placeholder content. The current game cards do not contain playable game files. Replace the demo entries with approved game artwork, descriptions and playable URLs when the game library is ready.

## Supabase setup (not yet connected)
1. Create a Supabase project using the owner account.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Configure Authentication redirect URLs for the eventual Vercel domain and local development.
4. Register your own account through the website once Supabase Auth is connected.
5. Promote the owner profile to admin from the trusted Supabase SQL Editor only, for example:
   `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_OWNER_EMAIL');`
6. Add the Supabase project URL and anon key to the frontend configuration in a later commit.

**Security:** never put the Supabase `service_role` key in browser code. The admin dashboard is currently a visual preview, not a protected admin system. Do not use it to manage real users or games until authentication, role checks and database integration are implemented and tested.

## Planned next steps
- Connect Supabase Auth (email/password and Google OAuth)
- Load games/categories from Supabase instead of the demo array
- Add protected admin game CRUD and image uploads
- Connect comments, likes, favourites, follows and reports
- Add moderation tools and secure contact form submission
- Test mobile layouts and game embeds before launch

The privacy and terms pages are starter drafts and must be reviewed against the actual platform's data practices and applicable law before launch.
