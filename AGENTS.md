# General Instructions for Agent

## Project Context

You are assisting with a modern Next.js project written in React with TypeScript. The project may use advanced 3D rendering powered by React Three Fiber (R3F), and you should be deeply familiar with the Three.js ecosystem, including performance optimizations, shaders, and geometry handling.

## Core Responsibilities

Next.js (React + TypeScript) Development
Provide or generate modular, idiomatic code that aligns with Next.js best practices.
Use functional components and hooks over class-based components.
Ensure TypeScript types are accurate and ergonomic.
Help with getStaticProps, getServerSideProps, dynamic routing, and API routes.

## React Three Fiber Support

Guide the creation of performant, composable 3D scenes using R3F.
Optimize use of Drei helpers, suspense boundaries, lighting, and camera controls.
Assist with loading and animating GLTF models using @react-three/drei and useGLTF.
Understand and assist with postprocessing effects, shaders, and materials.
Handle advanced topics like bounding volumes, raycasting, BVH, and scene graph traversal.

## Project Tooling & Workflow

Use Yarn as the package manager unless told otherwise.
Support integration of ESLint, Prettier, and TypeScript strict mode.
Be aware of .babelrc, tsconfig.json, next.config.js, and jest.config.js setup.
Help debug and resolve build-time and runtime errors, including those related to three-mesh-bvh or module resolution.

## Git Workflow

Always use trunk-based development.
`main` is the trunk and must stay deployable at all times.
Never commit directly to `main`; branch from the latest `main` for every change.
Keep branches short-lived and small in scope (hours to a day, not weeks).
Name branches by change type: `feat/…`, `fix/…`, `docs/…`, `refactor/…`, `chore/…`.
Rebase on `main` before merging, merge via pull request, and delete the branch afterward.
Do not create long-lived feature, release, or develop branches; ship unfinished work in small, safe increments instead.

Always use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and PR titles:
`<type>(<optional scope>): <short imperative description>`
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
Use lowercase, imperative mood, and no trailing period (e.g. `feat(tracking): add vercel analytics`).
Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer.
Keep each commit to one logical change.

## Agent Behavior

When offering sugestions, prefer clarity and simplicity but don’t avoid advanced topics when appropriate.
If there are multiple ways to approach a problem (e.g., Canvas layering, routing patterns), describe the tradeoffs.
Always check for performance implications, especially when working with 3D or animation-heavy components.

## Examples of Tasks You May Be Asked To Help With

Implementing an interactive object in the R3F scene.
Creating a 3D interactive object that responds to scroll or pointer input.
Troubleshooting build errors related to ESM/CommonJS incompatibilities.
Helping organize components, hooks, and utilities in a scalable way.
Assisting with Docker setup, env variable loading, or deployment to Heroku/Vercel.
Converting Markdown to HTML for a dynamic resume page.
Handling camera transitions and animated scene state in R3F.

## Avoid

Using any in TypeScript unless absolutely necessary (always try to infer or define appropriate types).
Assuming global styles — use CSS Modules, SCSS, or styled-components if needed.
Using outdated packages or deprecated APIs in R3F or Next.js.

## Make sure to

Use functional components whenever possible.
Use the project's existing coding style and conventions.
Use existing ESLint and Prettier rules when making updates.

## Scene Dimensions & Positions

Use `SceneContext` (`src/lib/contexts/SceneContext.tsx`) as the single source of truth when making updates to dimensions, positions, rotations, or scale of objects in the 3D scene.
Do not hardcode these values in components; read them via `useScene()` and use the existing helpers (e.g. `scaledFeet`, `feetFromWall`, `wallFaces`) where applicable.
Any new adjustable prop added to `SceneContext` must also have a corresponding Leva control in debug mode, following the existing `// #if DEBUG` / `// #if !DEBUG` pattern (see `Desk.tsx`): `useControls` seeded from the context value under `#if DEBUG`, and a fallback to the plain context value under `#if !DEBUG`.

## Visual Style & Art Direction

The scene should feel like a **fun, cartoony, toy-like room**: playful and inviting, but cohesive and grounded. Nothing should look like a debug primitive or a sticker pasted on top of the scene.

### Overall feel

- Think "stylized diorama" or "toy box". Simple chunky shapes and friendly proportions, lit by believable soft light.
- Stylization comes from **shape, color and motion**, not from mixing rendering styles. Every object shares one lighting model, so things feel like they belong together.
- The room should feel lived-in and cozy. Avoid sterile, clinical or overly bright looks, and avoid heavy orange/yellow warmth.

### Lighting & color

- Light is **slightly warm, close to neutral** (~5600K, blended toward white). It should never read as blue, and never as heavy amber.
- Surfaces are off-white and soft (warm off-white walls rather than yellow beige, wood floor).
- Accent colors (character clothing, instruments, decks) can be bright and saturated for fun. They should still be lit by the room's lights, so they pick up its shading and warmth.
- Avoid pure black (`#000`) and pure white on lit surfaces unless intentional. Soft near-blacks and off-whites sit better in the scene.
- Glow/bloom is reserved for genuine light sources (screens, LEDs). Ordinary lit surfaces should never bloom.
- Reflections are subtle. Pastel rim highlights from the environment map give rounded edges a cartoon-style two-tone sheen.

### Materials & geometry

- Use `meshStandardMaterial` (PBR) for everything visible. Don't use Lambert/Phong/Basic for lit objects. Mismatched shading models are the #1 cause of things looking out of place.
- Prefer fairly matte surfaces (roughness ~0.7–0.9) for a soft, painted-toy feel.
- Give hard-edged primitives a slight bevel (e.g. drei `RoundedBox`) so edges catch highlights like the GLTF models do.
- Keep silhouettes simple and blocky/chunky. Detail comes from color and light, not from geometric complexity.

### Grounding

- Objects should cast **and** receive shadows where appropriate, so parts shade each other.
- Characters and props that touch the floor need contact grounding (shadow or blob shadow), so they never look like they're floating.
- Screen-space ambient occlusion (N8AO) adds soft corner/contact darkening. Don't fight it.

### Motion

- Movement should feel bouncy and alive, never rigid or sliding. Examples: procedural walk cycles with limb swing and a small bob, idle breathing, eased starts and stops.
- Keep animation subtle enough not to be distracting. It should be cheap too: procedural, in `useFrame`, with no per-frame allocations.

### Avoid

- Applying toon shading or outlines to a single object. Stylization like that must be scene-wide or not at all.
- Flat, unlit colors on objects that sit in the lit room.
- Saturated "UI" colors on large surfaces (walls, floor, ceiling).
- Lights placed or shaped so they blow out nearby surfaces (e.g. point lights right under the ceiling).

# Current Task for Agent

Update the hosting for this project from Heroku to Vercel.

Any Heroku-related environment variables, and their usage, should be removed. Any enviornment variables that are needed for Vercel should be created as placeholders, and should be noted in the Notes from Agent section below.

sync-env-vars.sh should be updated to eliminate Heroku logic, and replace it with logic on syncing to Vercel.

Update the package.json deploy script to use Vercel CLI instead of Heroku CLI.

Update the github workflow to deploy to Vercel instead of Heroku.

Additionally, make whatever upgrades are requested in [this document](https://vercel.com/kb/bulletin/react2shell) to ensure the project is optimized for hosting on Vercel.

Create all these changes on a branch that can be merged both into main as well as into feat/react-three-fiber.

Leave any notes on implementation decisions, or any follow-up items needed from me in the Notes from Agent section below.

# Notes from Agent

- Deployment now targets Vercel via CLI-based GitHub Actions (`deploy:pull`, `deploy:build`, `deploy`).
- Added `.env.example` placeholders for required sync/deploy variables: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, and `GH_TOKEN`.
- `sync-env-vars.sh` now syncs `.env` values to GitHub Actions secrets and to Vercel env targets (`development`, `preview`, `production`) through the Vercel REST API.
- React2Shell bulletin guidance was applied by running `npx fix-react2shell-next --fix`, which upgraded Next.js from `15.4.3` to `15.4.10`.
- Deploy workflow now exports `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` in addition to `VERCEL_TOKEN` to pin Vercel project/org context in CI.
- `sync-env-vars.sh` now fails on Vercel API HTTP errors and JSON-escapes secret values (via Python `json.dumps`) before upsert calls.
- Follow-up: rotate production secrets after deploying the patched version, per Vercel bulletin guidance.
- Follow-up: if Heroku is no longer needed in your infrastructure, you can archive/remove `heroku.yml`; this environment blocked file deletion so it was replaced with a deprecation note.
