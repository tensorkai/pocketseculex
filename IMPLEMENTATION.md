# PocketSeculex website

A responsive Next.js presentation and interactive thesis prototype, based on [README.md](README.md).

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js. `npm run build` creates the production build; `npm start` serves it.

## Included

- An elevated morning city lobby with restrained ivory/forest typography and a Three.js device: continuous rounded shell, illuminated display, dual triggers, woven strap, and metal buckle. Drag horizontally or use the rotation and reset buttons.
- Thesis-based system overview, architecture, and mission sections.
- User demo profile held in page memory; refreshing clears it.
- Simulated SOS, LGU brief, illustrative location diagram, dispatch, resolution, and reset.
- Responsive navigation, native modal focus containment, Escape dismissal, reduced-motion support, and accessible control names.
- Separate personal and LGU account pages: `/user/login`, `/user/create-account`, `/lgu/login`, and `/lgu/create-account`. The shared form provides inline validation, password confirmation and visibility controls, and a password-reset dialog. LGU registration includes organization, jurisdiction, and department details.

## Account-page behavior

The account pages use Supabase Auth for signup, password sign-in, confirmation resend, password-reset emails, and password updates. Cookie-based sessions are refreshed by [proxy.ts](proxy.ts); server-rendered account pages verify identity with Supabase before loading data. `/account` routes users to `/user/dashboard` or `/lgu/dashboard` using the stored profile category. Supabase RLS remains authoritative for every database operation; no service-role key is used.

Personal accounts can edit their profile and view their assigned devices and incidents. LGU accounts retain organization details in signup metadata, then explicitly submit them for review after confirming their email and signing in. Only active organization members can load LGU incidents and change their status. Profiles and memberships must already exist in the configured schema. Realtime refreshes incidents; membership changes are rechecked every 30 seconds and on window focus. Contact/location details are fetched on demand with RLS. Previously displayed data cannot be retroactively revoked.

### Local database scripts

The local-only `supabase/` folder contains `01-schema.sql` (tables, profile signup trigger, existing-account backfill, RLS, grants, and Realtime publication), `02-verify.sql` (read-only setup checks), and `03-approve-responder.sql` (optional administrator approval). Paste these into Supabase SQL Editor; they are not deployed by the website. The folder is ignored by Git and must be backed up separately. Its README provides the setup order, email templates, and live-account checks.

The signup trigger creates the profile required by `/account`; the backfill repairs users registered before schema installation. LGU membership is granted only after administrator approval. Installing the SQL does not configure Auth email delivery, URL allowlists, or hosting environment variables.

### Environment and email links

Next.js does not load `.env.example`. Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) in `.env.local` locally and in the hosting provider's environment settings for deployment. Restart the dev server after changing values; production public values require a rebuild. Never use a service-role key for these variables.

In Supabase Authentication URL Configuration, set the Site URL to the actual website origin and allow these redirect URLs for each origin you use:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/callback?next=/auth/update-password`
- The same two paths on your deployed HTTPS origin (and `127.0.0.1` if you use that hostname).

Default Supabase email templates work through the PKCE code exchange at `/auth/callback`; open the email in the same browser used to sign up/request recovery. If you customized templates to use token hashes, use `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` for confirmation and `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery` for recovery. The callback only permits account or password-update destinations. Expired/invalid links show a recovery page. Passwords are submitted only to Supabase, never stored in application tables or signup metadata.

If configuration is absent, account routes show a setup message and the homepage remains usable. Signup retains the email address and offers confirmation resend directly after registration. Database signup errors are distinguished from incorrect passwords and network failures.

### Verification

Run `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test:e2e`. Install the test browser once with `npx playwright install chromium`. Browser tests mock Supabase Auth responses to exercise personal/LGU signup payloads, password sign-in, cookie creation, error handling, recovery, and anonymous portal protection without sending emails or creating accounts. They do not certify the live database's RLS or email delivery. Use real confirmed personal and LGU accounts to verify deployment redirects and organization-scoped data access.

## Integration boundaries

Account authentication, persistent profiles, LGU access requests, RLS-scoped incident/device reads, incident status changes, and incident/location change subscriptions are integrated with Supabase. The homepage SOS walkthrough remains an explicitly labeled simulation; it does not create incidents. Hardware telemetry ingestion, Groq inference, and route computation remain separate integrations, so this is not an operational emergency service. The hardware appearance is a concept, not a manufacturing specification.

## Assets

The lobby uses a locally saved [morning city backdrop](public/city-morning.webp), generated with the built-in image-generation tool and optimized to WebP. It depicts a fictional city, not a verified location. The previous [nighttime photograph](public/city-night.jpg), from [Unsplash](https://images.unsplash.com/photo-1519608487953-e999c86e7455), is retained but no longer used by the lobby.

Generation prompt: “Use case: photorealistic-natural. Asset type: wide website background, 16:9 landscape. A realistic cinematic elevated aerial view looking diagonally down over a dense modern city in the early morning, Manila-inspired urban blocks, mid-rise concrete buildings, a few glass towers, treelined streets, rooftops and roads visible far below. High rooftop or drone viewpoint, no street-level viewpoint. Warm pale morning sunshine, atmospheric haze in the distance, natural ivory concrete, soft blue-grey shadows, muted sage trees. Sophisticated architectural editorial photograph, believable and calm, no neon, no night, no saturated orange sunset, no sci-fi. Composition: city buildings predominantly on the right two thirds and bottom, distant hazy urban landscape on the left so dark headline text can overlay left side using a light scrim. No text, no logos, no device, no interface. Fine realistic detail, 35mm aerial photography.”

The [device renderer](app/device-model.tsx) loads Three.js on the client. It caps pixel density, renders on demand, pauses offscreen, disposes GPU resources on unmount, and provides a static CSS preview if WebGL is unavailable. Reduced motion disables interpolated rotation. Icons remain inline SVG; no external font service is required.
