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
On desktop, when the character approaches the monitor in the 3D scene, a "Press ENTER to use the compuer" message is displayed on screen. If the user then presses the Enter key, the camera should zoom into the computer monitor and there should be a smooth transition that switches the R3FScene to the Terminal experience that is used on mobile.

Once the Terminal view is initialized, all events should be delegated to that component. 

Pressing the ESC key while in the Terminal view should exit the Terminal and smoothly transition the camera back to the original position in the 3D scene.

Performance considerations should be taken into account to ensure a smooth user experience during these transitions.


# Notes from Agent
(Please add any notes or updates made by the agent below)
* Implemented desktop experience toggle between R3F scene and Terminal, including camera transitions and ESC/ENTER controls.
