# DevonGPT Portfolio Terminal

A Next.js 15 portfolio that presents two experiences:

- Desktop: an interactive 3D office built with React Three Fiber.
- Mobile: a classic terminal-only interface.

The terminal includes static portfolio commands (`resume`, `contact`, `fun-fact`, `help`) and an AI-powered `ask` command backed by a server-side OpenAI API route.

## Current Product Behavior

- `/` renders `src/app/page.tsx`.
- If viewport width is `< 768px` (`useIsMobile`), users get terminal-only mode.
- Otherwise users get the full 3D scene (`R3FScene`) with in-world interactions.
- Desktop controls: `WASD`/arrow keys move, proximity triggers contextual messages, `Enter` on the monitor enters terminal mode, and `Escape` returns to the scene.

## Tech Stack

- Framework: Next.js 15 (App Router), React 19, TypeScript (strict)
- 3D: `three`, `@react-three/fiber`, `@react-three/drei`
- State: Zustand + React Context
- AI: OpenAI Node SDK (`responses.create`) via `src/app/api/gpt/route.ts`
- Styling: SCSS modules + global CSS
- Testing: Jest + React Testing Library + SWC
- Build-time debug gates: `ifdef-loader`

## Architecture

```txt
src/
  app/
    layout.tsx
    page.tsx
    api/gpt/
      route.ts
      prompt.ts
  components/
    Terminal.tsx
    AskGPT.tsx
    Contact.tsx
    Resume.tsx
    FunFact.tsx
    HelpMenu.tsx
    three/
      R3FScene.tsx
      Room.tsx
      Character.tsx
      Camera.tsx
      Message.tsx
      InteractiveBox.tsx
      Desk.tsx
      Monitor.tsx
      BassGroup.tsx
      SkateboardGroup.tsx
  lib/
    stores/
      useExperience.ts
      useMovement.ts
    contexts/
      SceneContext.tsx
      MessageContext.tsx
```

## Stores And Context

### Zustand Stores

`src/lib/stores/useExperience.ts`

- Owns experience mode and transition state.
- State fields: `mode`, `targetMode`, `isTransitioning`, `cameraOverride`, `isBlackout`.
- Actions: `enterTerminal(target)`, `exitTerminal()`, `startBlackout()`, `completeTransition()`.

`src/lib/stores/useMovement.ts`

- Owns character position `{ x, y, z }`.
- `setPosition` is guarded to avoid no-op writes when coordinates have not changed.
- `resetPosition` restores the initial spawn position.

### React Contexts

`src/lib/contexts/SceneContext.tsx`

- Provides scene-wide configuration (room dimensions, wall properties, camera settings, object placement, object interaction box defaults).
- All scene objects consume this for shared, consistent layout and tuning values.

`src/lib/contexts/MessageContext.tsx`

- Owns transient UI message state shown by `Message` overlay.
- Supports optional `interaction.onEnter` callback for context-sensitive Enter behavior (for example entering terminal at the monitor).

## Data Flow

### App Entry Flow

1. `src/app/page.tsx` checks `useIsMobile()`.
2. Mobile renders `Terminal` directly.
3. Desktop renders `R3FScene` (dynamic import with `ssr: false`).
4. `R3FScene` wraps content with `MessageProvider` and `SceneProvider`.

### 3D Interaction Flow

1. `Character` updates movement in `useMovement` based on keyboard input.
2. `Room` mirrors store position into a stable `Vector3` ref (`proximityPositionRef`) each frame.
3. Object groups (`Monitor`, `BassGroup`, `SkateboardGroup`) receive that ref.
4. `InteractiveBox` computes parent bounds and tests containment against proximity position.
5. When inside bounds, it pushes contextual message via `MessageContext`.
6. If interaction includes `onEnter`, pressing Enter executes it.

### Scene <-> Terminal Transition Flow

1. Monitor interaction resolves camera target and calls `useExperience.enterTerminal(target)`.
2. `Camera` lerps toward the override target.
3. On close-enough threshold, `startBlackout()` runs.
4. After blackout timeout, store finalizes to `mode: "terminal"`.
5. Terminal becomes visible/interactable while canvas is visually inactive.
6. Pressing `Escape` triggers `exitTerminal()`, camera returns to follow mode, transition completes.

### Terminal Command Flow

1. `Terminal` listens for Enter on input.
2. Commands append component output into local `output` history.
3. `help` auto-renders on mount after `clear`.
4. `ask` renders `AskGPT`, which POSTs to `/api/gpt`.

### AI Request Flow

1. `AskGPT` sends `{ query }` to `POST /api/gpt`.
2. Route validates input and builds `input` from system prompt (`prompt.ts`), optional short history (last 6 turns if provided), optional `userProfile`, and current user query.
3. If `VECTOR_STORE_ID` exists, request includes `file_search` tool.
4. Server calls `client.responses.create({ model: "gpt-4o-mini", ... })`.
5. Client displays `response.output_text` (after citation cleanup).

## Rendering Logic

### Scene Composition (`src/components/three/R3FScene.tsx`)

- `Canvas` is mounted after first client render (`showCanvas`) to avoid hydration pitfalls.
- Canvas scene graph includes `Lights`, `Room`, `Character`, and `Camera`.
- `Message` overlay is rendered outside Canvas for legible UI layering.
- Terminal layer and blackout overlay are class-driven from `useExperience` state.

### Interaction Volumes (`src/components/three/InteractiveBox.tsx`)

- Computes bounds from parent mesh geometry (or explicit `size`/`center` overrides).
- Containment checks include both full 3D volume containment and XZ footprint containment fallback.
- This allows interactions to trigger even when character Y differs from object center.

## Performance Optimizations Currently In Place

- Guarded Zustand updates in `useMovement.setPosition` prevent no-op store publishes.
- `Character` only writes movement when position changes beyond epsilon.
- `Camera` subscribes only to movement `position` slice and preallocates vectors for frame-loop math.
- `Room` mutates a stable proximity `Vector3` in `useFrame` to avoid React rerenders in child object groups.
- Heavy scene components use `memo` (`Room`, `Lights`, `Character`, `Desk`, `Monitor`, `BassGroup`, `SkateboardGroup`, `Message`).
- Repeated mapped object children are memoized in `BassGroup` and `SkateboardGroup`.
- Textures are configured in `useEffect` rather than per render (`Room`).
- GLTF assets are preloaded where applicable (`useGLTF.preload`).
- Interactive monitor camera target calculations reuse vectors to limit allocation churn.
- Debug-only behavior is stripped in non-debug builds via `ifdef-loader`.

## Debug Mode

Run debug mode:

```bash
yarn debug
```

This sets `NEXT_PUBLIC_DEBUG=true`, enabling `#if DEBUG` blocks in selected Three components via webpack `ifdef-loader` (`next.config.js`).

Debug-only capabilities include:

- Leva controls for object transforms and interaction box tuning.
- Optional movement logging in `Character`.
- Interactive bounds visualization from `InteractiveBox`.
- Initial interaction-box control seeding from resolved mesh bounds.

In non-debug mode, those blocks are compiled out.

## Environment Variables

Required:

```env
OPENAI_API_KEY=...
```

Optional:

```env
VECTOR_STORE_ID=...
```

Notes:

- `OPENAI_API_KEY` must remain server-only.
- `VECTOR_STORE_ID` enables `file_search` tool usage in `/api/gpt`.

## Local Development

```bash
yarn install
yarn dev
```

Open `http://localhost:3000`.

## Scripts

- `yarn dev`: standard dev server
- `yarn debug`: dev server with debug-gated Three tooling
- `yarn build`: production build
- `yarn start`: run production server
- `yarn lint`: Next.js ESLint
- `yarn typecheck`: `tsc --noEmit`
- `yarn test`: Jest test suite
- `yarn compile-resume-markdown`: converts `src/assets/resume.pdf` -> `src/assets/resume.md`
- `yarn compile-resume-html`: converts `src/assets/resume.pdf` -> `src/assets/resume.html`

## Testing

```bash
yarn test
```

Recommended pre-merge check:

```bash
yarn lint && yarn typecheck && yarn test --ci && yarn build
```

Three component tests are unit-level and run under `jsdom` with shared harness mocks in `__mocks__/threeTestHarness.tsx`.

## Handoff Notes For Engineers

- The README intentionally reflects current implementation, not aspirational architecture.
- `AskGPT` and `/api/gpt` are stateless by default unless caller passes history/profile.
- 3D and terminal experiences are intentionally split by viewport width and desktop transition state.
- If you add new debug-only controls, include the file in the `ifdef-loader` test regex in `next.config.js`.
- Message rendering uses `dangerouslySetInnerHTML`; keep message sources trusted.

## Deployment

- `next.config.js` uses `output: "standalone"` for container/deployment friendliness.
- `Dockerfile` and `heroku.yml` are present for non-Vercel deployments.
