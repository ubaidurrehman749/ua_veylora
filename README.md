# Abandoned but Not Forgotten

An interactive, scroll-driven NASA Space Apps Challenge 2026 educational experience, built with React + TypeScript + Vite.

## Quick start (Windows)

1. Install **Node.js LTS** from https://nodejs.org/ if it is not already installed.
2. Extract the ZIP.
3. Double-click `START.bat`.
4. Wait for dependencies to install. Your browser should open at `http://localhost:5173`.

If the browser does not open automatically, copy `http://localhost:5173` into Chrome or Edge.

## Quick start (Mac / Linux)

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The build runs the Ajv mission-data schema validation before compiling the app.

## What's included

- Landing page and Moon / Mars destination selection
- Equipment gallery for Opportunity, Apollo Lunar Roving Vehicle, and Ingenuity
- Interactive 3D conceptual models (drag to rotate, scroll to zoom)
- Mission story, fact panels, current status, evidence labels
- Three-option Open Question flow with evidence/instrument choice
- Combined mission timeline
- Session-local Question Echo constellation and closing reflection
- NASA source links, responsive layouts, keyboard-operable controls, reduced-motion CSS
- JSON mission data and Ajv schema validation

## Important accuracy and asset note

The 3D models in this starter are **original conceptual models made from simple geometric shapes**. They are not official NASA CAD/model assets. Replace them with optimized, NASA-published or appropriately licensed glTF/GLB assets before final submission if available. Keep each optimized model below the PRD's 2 MB target and preserve the fallback experience.

Mission facts and dates are linked to official NASA pages in the app. The Apollo Lunar Roving Vehicle evidence includes one clearly labeled future-investigation question; it is not presented as an established NASA finding. Re-check all facts and each object's status with a second team member before submission, as required by the PRD.

## Project structure

```text
src/
  components/SpaceModel.tsx
  data/missions.json
  App.tsx
  main.tsx
  styles.css
scripts/
  mission.schema.json
  validate-data.js
```

## Deploy to Vercel

1. Push the extracted project folder to a GitHub repository.
2. Import that repository at https://vercel.com/new
3. Framework preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

No backend, account system, database, or AI service is used. Open Question responses remain in React state in the current browser session.
