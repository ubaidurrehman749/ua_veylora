# Abandoned but Not Forgotten

NASA Space Apps Challenge 2026 · Team UA VEYLORA

An interactive site about machines whose missions ended but whose discoveries did not: the Apollo Lunar Roving Vehicle, the Opportunity rover and the Ingenuity helicopter. Each one has a story, a 3D model with clickable parts, its equipment, the evidence it gathered, and an open question for the future.

The page opens with a scroll-driven flight from the Moon to Mars, with each machine marked where it rests today.

Built with React, TypeScript, Vite, three.js (React Three Fiber + drei), GSAP and Lenis.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # validates data, type-checks, builds to dist/
npm run preview    # serve the built site
```

## Project structure

```
abandoned-but-not-forgotten/
├── public/
│   ├── models/          3D models (.glb), each under 2 MB
│   ├── images/          fallback pictures for the models, and the Moon and Mars maps for the opening globes
│   └── assets/          other static files
├── src/
│   ├── components/
│   │   ├── Navbar.tsx         sticky top navigation
│   │   ├── Landing.tsx        opening scene: scroll-driven flight from the Moon to Mars
│   │   ├── HeroScene/         the 3D globes and camera flight behind the opening scene
│   │   ├── Destination.tsx    the mission section: picker + everything about one machine
│   │   ├── StorySection.tsx   the mission's story
│   │   ├── ModelViewer/       3D viewer (ModelViewer.tsx, scene, backdrop, styles)
│   │   ├── EquipmentCard.tsx  facts and key instruments
│   │   ├── EvidenceDesk.tsx   confirmed / interpretation / unknown claims
│   │   ├── OpenQuestion.tsx   the learner picks what the next mission should do
│   │   ├── Timeline.tsx       all machines in date order
│   │   ├── QuestionEcho.tsx   sky of everyone's answers
│   │   ├── FutureQuestions.tsx, SourceCredits.tsx, EchoSky.tsx
│   │   ├── Starfield.tsx      star background
│   │   └── fx.tsx             intro loader, ticker, magnetic buttons, count-up stats
│   ├── data/
│   │   ├── missions.json      all mission content (single source of truth)
│   │   └── display.ts, evidenceLabels.ts, collectCredits.ts
│   ├── pages/HomePage.tsx     puts the sections together
│   ├── hooks/                 useReveal, useSplitReveal, useReducedMotion
│   ├── types/mission.ts       types for missions.json
│   ├── lib/                   GSAP setup (gsap.ts), smooth scrolling and pointer effects (motion.ts)
│   ├── styles.css, premium.css
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   ├── validate-data.js       checks missions.json (runs before every build)
│   └── *.mjs                  3D model tools (optimize, check sizes, inspect)
├── models-src/                original, unoptimised 3D models
├── docs/                      sources, credits, 3D model licences
├── package.json
└── README.md
```

## Editing content

All text lives in `src/data/missions.json`. After editing, run:

```bash
npm run validate
```

It checks every required field, status and evidence labels, that each evidence claim cites a real source id, that the open question has exactly 3 choices, and that the model and fallback files exist in `public/`.

Each mission can also set `sites` (latitude and longitude of where it rests, shown as gold dots on the opening globes), `fallbackSrc`, `setting` (`"mars"` or `"moon"`), `alt` and `hotspots` (clickable parts on the 3D model; `position` is in a space where the model is about 2 units wide and centred on 0).

## 3D models

To add or replace a model: put the `.glb` in `models-src/` (named after the mission id), then run:

```bash
npm run optimize      # models-src/*.glb -> public/models/*.glb
npm run check-sizes   # fails if a model is 2 MB or more, or has no picture in public/images/
```

Helpers: `node scripts/inspect-model.mjs <file>` and `node scripts/part-positions.mjs <file>` (hotspot positions for named parts).

Opportunity and Ingenuity are NASA models from NASA 3D Resources. The Lunar Roving Vehicle is the team's own model (NASA publishes none) and is credited that way. See `docs/models-licenses.md`.

## Deploying

Vercel / Netlify: build command `npm run build`, output folder `dist`.
