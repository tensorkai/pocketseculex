# PocketSeculex website

A responsive Next.js presentation and interactive thesis prototype, based on [README.md](README.md).

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js. `npm run build` creates the production build; `npm start` serves it.

## Included

- Cinematic urban landing page and an interactive CSS 3D device with six faces, screen, dual triggers, woven strap, and buckle. Drag horizontally or use the rotation buttons.
- Thesis-based system overview, architecture, and mission sections.
- User demo profile held in page memory; refreshing clears it.
- Simulated SOS, LGU brief, illustrative location diagram, dispatch, resolution, and reset.
- Responsive navigation, native modal focus containment, Escape dismissal, reduced-motion support, and accessible control names.

## Integration boundaries

This is a frontend prototype, not an operational emergency service. No authentication, telemetry ingestion, persistent profile storage, live location subscription, Groq inference, or route computation is implemented. The LGU map and brief are explicitly illustrative. Supabase, hardware, Groq, and geographical routing need a separately secured backend integration before live use. The hardware appearance is a concept, not a manufacturing specification.

## Assets

The local [city photograph](public/city-night.jpg) was downloaded from [Unsplash](https://images.unsplash.com/photo-1519608487953-e999c86e7455). It provides fictional urban atmosphere and is not presented as a photograph of the demo location. The device, icons, and technical illustration are rendered with CSS and inline SVG; no external model runtime or font service is required.
