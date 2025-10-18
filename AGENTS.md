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

# Current Task for Agent

Move all components that don't have a test file to a new subfolder of components called "three". Update imports for all of those components accordingly.

Components to move include the following:

- Bass.tsx
- BassGroup.tsx
- BoundingBox.tsx
- Camera.tsx
- Character.tsx
- Desk.tsx
- InteractiveBox.tsx
- Lights.tsx
- Message.tsx
- Monitor.tsx
- R3FScene.tsx
- Room.tsx
- Skateboard.tsx
- SkateboardGroup.tsx

Three components that import each other should use the aliased, absolute paths when importing another component (i.e. @/components/three/ComponentName).

# Notes from Agent

(Please add any notes or updates made by the agent below)
