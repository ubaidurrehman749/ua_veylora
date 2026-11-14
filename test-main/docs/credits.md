
# Asset Credits & Technical Acknowledgments

**Project:** Abandoned but Not Forgotten (NASA Space Apps Challenge 2026)  
**Team:** UA VEYLORA  
**Document Owner:** Zarnish Fatima (Content / Resource Lead)  
**Document Version:** 4.0 (Comprehensive Technical & Asset Audit)

---

## 1. 3D Model Assets & Licensing

Our 3D visual canvas combines official NASA planetary hardware models with custom, hand-crafted 3D models built by Team UA VEYLORA.

### A. Official NASA 3D Models (NASA 3D Resources)

*Downloaded from official NASA 3D Resources under NASA Public Domain Media Usage Guidelines. Processed and compressed using glTF-Transform (`--compress meshopt --texture-compress false`) for high-performance web loading.*

| Asset Name | Target Hardware | Source / Publisher | Compression / Pipeline | License |
| :--- | :--- | :--- | :--- | :--- |
| **Opportunity Rover** | Opportunity Rover | NASA VTAD / JPL-Caltech | glTF-Transform meshopt | Public Domain |
| **InSight Lander** | InSight Mars Lander | NASA VTAD / JPL-Caltech | glTF-Transform meshopt | Public Domain |

### B. Custom Team-Modeled 3D Assets (Team UA VEYLORA Original Work)

*Hand-built and modeled in Blender by Sunaila Ilyas (3D Developer, Team UA VEYLORA) specifically for this project, as official 3D mesh files were unavailable from NASA archives.*

| Asset Name | Target Hardware | Author / Modeling Tool | Pipeline Details | License |
| :--- | :--- | :--- | :--- | :--- |
| **Lunar Roving Vehicle (LRV)** | Apollo 15–17 LRV | Sunaila Ilyas (Blender) | Custom GLTF mesh & PBR materials | Educational / Project Original |
| **Laser Ranging Retroreflector** | Apollo 11/14/15 ALSEP | Sunaila Ilyas (Blender) | Custom GLTF mesh | Educational / Project Original |
| **Surveyor 3 Lander** | Surveyor 3 Lunar Lander | Sunaila Ilyas (Blender) | Custom GLTF mesh | Educational / Project Original |
| **Sojourner Rover** | Pathfinder Sojourner | Sunaila Ilyas (Blender) | Custom GLTF mesh | Educational / Project Original |

---

## 2. 3D Engine, Rendering & Animation Stack

| Package / Tool | Version / Scope | Purpose | License |
| :--- | :--- | :--- | :--- |
| **Three.js** | r169 | Core 3D WebGL Rendering Engine | MIT License |
| **@react-three/fiber** | 8.17.10 | React renderer wrapper for Three.js scene graph | MIT License |
| **@react-three/drei** | 9.x | React Three Fiber helpers & OrbitControls | MIT License |
| **@react-three/postprocessing** | 2.x | Post-processing visual effects pipeline | MIT License |
| **GSAP (GreenSock)** | 3.12.5 | ScrollTrigger timeline orchestration & UI motion | Free Non-Commercial |

*Note on Performance Optimization:* The entire 3D canvas layer is **lazy-loaded after initial page paint** to guarantee instant first-contentful-paint (FCP) performance for web visitors.

---

## 3. Planetary Textures & Visual Media

| Asset Category | Source / Provenance | Usage / Storage | License |
| :--- | :--- | :--- | :--- |
| **Lunar Surface & Elevation Textures** | NASA Visible Earth / PDS Archive | `public/textures/moon_*` | Public Domain |
| **Martian Surface Textures** | NASA Mars Trek / PDS Archive | `public/textures/mars_*` | Public Domain |
| **Procedural Sky & Constellation FX** | 100% Three.js procedural sphere points & point clouds | `src/components/QuestionEcho.tsx` | Code-Generated |

*Zero external HDRI files, zero third-party stock photography, and **zero AI-generated visual media** were used in the rendering pipeline.*

---

## 4. Typography, Glyphs & UI Libraries

| Resource Name | Type | License |
| :--- | :--- | :--- |
| **Newsreader** | Google Font (Serif) | SIL Open Font License 1.1 |
| **IBM Plex Sans** | Google Font (Sans-Serif) | SIL Open Font License 1.1 |
| **IBM Plex Mono** | Google Font (Monospace) | SIL Open Font License 1.1 |
| **Unicode Interface Symbols** | Plain Text Glyphs (✓ ◆ ? ■ ◌ ● ☾ ♂) | Open Unicode Standard |
| **React & React-DOM** | 18.3.1 | MIT License |

---

## 5. Team UA VEYLORA Roles & Responsibilities

- **Ubaid ur Rehman**: Team Owner & System Integrator (Scaffolding, Build Pipelines, Vercel Deployment)
- **Sunaila Ilyas**: 3D Developer (Three.js / React Three Fiber scene setup, Blender 3D modeling, glTF-Transform optimization, post-processing)
- **Umar Kashif**: UI / Interaction Developer (GSAP ScrollTrigger orchestration, Responsive UI components, Constellation engine)
- **Zarnish Fatima**: Content & Resource Lead (NASA Data Audit, 3-Tier Evidence Classification, Documentation, `src/data/missions.json`, `docs/sources.md`, `docs/credits.md`)
- **Ali Hassan**: Fact Checker, QA & Design Lead (UI/UX Review, Color Palette Contrast Accessibility & Scientific QA)

---

*Verified and Published by Zarnish Fatima (Content & Resource Lead) — November 15, 2026*
