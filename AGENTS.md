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
- Follow-up: rotate production secrets after deploying the patched version, per Vercel bulletin guidance.
- Follow-up: if Heroku is no longer needed in your infrastructure, you can archive/remove `heroku.yml`; this environment blocked file deletion so it was replaced with a deprecation note.
