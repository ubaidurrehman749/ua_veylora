# Role 2: 3D Developer

Everything for the `ModelViewer` task lives in this folder, laid out exactly like the deliverables on the team sheet, so merging means copying folders:

| Here | Goes to |
|---|---|
| `src/components/ModelViewer/` | `/src/components/ModelViewer/` |
| `public/models/` | `/public/models/` |
| `public/fallback/` | `/public/fallback/` |
| `docs/models-licenses.md` | `/docs/models-licenses.md` |

`scripts/` and `models-src/` are tools and source files. They don't need to be shipped, though `scripts/` is worth keeping.

**Status:** Opportunity and Ingenuity are the **real NASA models** (untouched originals are in `models-src/nasa-originals/`). `lrv.glb` is **our own model** (built by `scripts/make-lrv.mjs`), because NASA publishes no Lunar Roving Vehicle model. It is not a NASA model and is credited that way. See `docs/models-licenses.md`.

## Using the viewer

```tsx
import { ModelViewer } from './components/ModelViewer';

<ModelViewer
  modelPath="/models/opportunity.glb"      // omit it and the picture is shown instead
  fallbackSrc="/fallback/opportunity.svg"
  setting="mars"                           // 'mars' (default) or 'moon': the world behind the object
  title={mission.name}                     // info card (PRD 5.2 "Meet the object")
  place="Mars · Meridiani Planum"
  status={mission.status.value}            // badge: Inactive / Silent / Still operating (PRD 6.1 wording)
  hook="Explored Mars and found evidence of ancient watery environments."
  alt="The Opportunity rover: a gold body, solar deck, camera mast and six wheels."
  hotspots={[
    { id: 'pancam', label: 'Panoramic camera', description: 'Twin cameras on the mast.', position: [0, 0.6, -0.25] },
  ]}
/>
```

- **Look:** each object sits in its own world, drawn entirely in code (no image or HDR files). `setting="moon"`: black starry sky, Earth above the horizon, grey regolith. `setting="mars"`: dusty sky, rust-coloured ground. Both have scattered rocks, real soft shadows, image-based lighting for realistic metal reflections, and filmic tone mapping. Use `moon` for the Lunar Roving Vehicle and `mars` for Opportunity and Ingenuity.
- **Layouts:** `layout="overlay"` (default) puts the parts under the viewer and pops part details up inside it. `layout="split"` puts the viewer on the left and the parts list plus a detail card on the right, and stacks them on phones (under 860px). In the split layout, leave out `title`/`status` if a fact strip below already shows them; the object is then centred.
- **Interface:** a glass info card (place, name, status badge, one-line hook), a floating control dock with icon buttons, a progress ring while loading, and full screen where the browser allows it. On wide screens the object is framed to the right of the card; on phones it sits below it.
- **Parts (hotspots):** pulsing numbered markers. Picking one, on the model or in the list below, glides the camera to that part and opens a card with its description. Esc or "Reset view" glides back.
- **Rotate and zoom:** drag, scroll or pinch; dock buttons; keyboard (arrows rotate, `+` `-` zoom, `0` resets, Esc closes part details). The camera can't go below the ground.
- **Performance:** the 3D code loads only near the screen, rendering pauses when the viewer is scrolled away, and pixel density drops automatically on slow devices.
- **Frameworks:** works in Vite (team sheet) and Next.js (PRD 11). It is marked `'use client'` and touches WebGL only in the browser.
- **Lazy:** three.js and the model only load when the viewer is near the screen.
- **Fallback:** the picture shows while loading, and stays if there's no model, no WebGL, or the file fails.
- **Reduced motion:** no auto-rotate, no damping.
- **Hotspots (P2):** `position` is in a normalised space (model scaled to about 2 units, centred on 0). Use `scripts/part-positions.mjs` to get positions for models with named parts.

## Commands (run inside this folder)

```bash
npm install
node scripts/make-lrv.mjs   # rebuilds our own Lunar Roving Vehicle into models-src/lrv.glb
npm run make-placeholders   # old stand-ins for Opportunity and Ingenuity (never overwrites existing files)
npm run optimize            # models-src/*.glb  →  public/models/*.glb  (must end under 2 MB)
npm run check-sizes         # fails if any model ≥ 2 MB or has no image fallback
```

To add or replace a model: put the file in `models-src/` (named `opportunity.glb`, `lrv.glb` or `ingenuity.glb`), run `npm run optimize`, then `npm run check-sizes`. Convert `.blend` or `.obj` files to `.glb` first. Then update `docs/models-licenses.md`. The optimizer can read Draco-compressed files (NASA uses them) and always writes Meshopt.

Helpers:

```bash
node scripts/inspect-model.mjs models-src/ingenuity.glb       # triangles, textures, size, part names
node scripts/part-positions.mjs public/models/ingenuity.glb   # hotspot position for each named part
```

`npm run make-placeholders` never overwrites an existing file, so it can't replace the NASA models. The old placeholder Opportunity and Ingenuity are kept in `models-src/placeholders/` for reference only.

## Needed from teammates

- **Content (`missions.json`):** add `"modelPath": "/models/<id>.glb"` to each mission. The field is required by the type but is missing from all three records today. Also, the 3D-model credits there name sources that don't match the files I downloaded (see `docs/models-licenses.md`).
- **Integrator:** add `@react-three/drei` (and `three`, `@react-three/fiber`) to the project's `package.json`.
- **Team decision:** what to do about the Lunar Roving Vehicle model (options in `docs/models-licenses.md`).
