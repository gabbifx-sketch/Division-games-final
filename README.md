# DIVISION

A browser-games platform starter built with **plain HTML, CSS and JavaScript**. No React, no frontend framework, and no build step.

## Run locally
Open `index.html` in a browser, or use the VS Code Live Server extension.

## Structure
- `index.html` — page structure
- `styles.css` — all visual styling and responsive breakpoints
- `app.js` — demo catalogue, search, category interactions
- `assets/division-mark.svg` — editable SVG brand mark

## Demo content
The game catalogue in `app.js` is placeholder content. The current cards are visual demo entries and do not contain playable game files. Replace the `image`, `description`, and later `gameUrl` fields with approved game assets and playable embeds.

## Next implementation stages
1. Game details/player page and real game URLs
2. Supabase authentication and profiles
3. Supabase tables, comments, favourites and play tracking
4. Admin dashboard and protected game management
5. Legal, contact and moderation pages

Keep secrets out of frontend JavaScript. Supabase's public anon key may be used in browser code with correctly configured Row Level Security; service-role keys must never be exposed.
