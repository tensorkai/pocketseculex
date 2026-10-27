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

The account pages are frontend previews. Valid submissions show an explicit service-unavailable message; they never claim to authenticate, create accounts, send reset emails, or submit an LGU access request. Credentials are not sent to a backend or persisted by application code. Use sample data for previews. LGU approval messaging describes the intended access policy; enforcement must be implemented in the backend before real account services are enabled.

## Integration boundaries

This is a frontend prototype, not an operational emergency service. No authentication, telemetry ingestion, persistent profile storage, live location subscription, Groq inference, or route computation is implemented. The LGU map and brief are explicitly illustrative. Supabase, hardware, Groq, and geographical routing need a separately secured backend integration before live use. The hardware appearance is a concept, not a manufacturing specification.

## Assets

The lobby uses a locally saved [morning city backdrop](public/city-morning.webp), generated with the built-in image-generation tool and optimized to WebP. It depicts a fictional city, not a verified location. The previous [nighttime photograph](public/city-night.jpg), from [Unsplash](https://images.unsplash.com/photo-1519608487953-e999c86e7455), is retained but no longer used by the lobby.

Generation prompt: “Use case: photorealistic-natural. Asset type: wide website background, 16:9 landscape. A realistic cinematic elevated aerial view looking diagonally down over a dense modern city in the early morning, Manila-inspired urban blocks, mid-rise concrete buildings, a few glass towers, treelined streets, rooftops and roads visible far below. High rooftop or drone viewpoint, no street-level viewpoint. Warm pale morning sunshine, atmospheric haze in the distance, natural ivory concrete, soft blue-grey shadows, muted sage trees. Sophisticated architectural editorial photograph, believable and calm, no neon, no night, no saturated orange sunset, no sci-fi. Composition: city buildings predominantly on the right two thirds and bottom, distant hazy urban landscape on the left so dark headline text can overlay left side using a light scrim. No text, no logos, no device, no interface. Fine realistic detail, 35mm aerial photography.”

The [device renderer](app/device-model.tsx) loads Three.js on the client. It caps pixel density, renders on demand, pauses offscreen, disposes GPU resources on unmount, and provides a static CSS preview if WebGL is unavailable. Reduced motion disables interpolated rotation. Icons remain inline SVG; no external font service is required.
