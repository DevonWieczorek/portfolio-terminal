# DevonGPT - Terminal Portfolio (Next.js)

A terminal-style portfolio website built with Next.js 14, featuring an AI assistant powered by OpenAI's Assistant API. This project demonstrates modern React patterns, server-side API integration, and a unique terminal interface for portfolio presentation.

## 🚀 Features

- **Terminal-style interface** with command-line interactions and authentic terminal aesthetics
- **AI assistant** powered by OpenAI's Assistant API with thread-based conversations
- **Interactive resume display** with markdown rendering
- **Contact information** with styled output
- **Fun facts** about Devon with random selection
- **Help menu** with available commands and descriptions
- **Responsive design** that works across different screen sizes
- **Desktop 3D scene** built with React Three Fiber (mobile devices use the classic terminal)
- **TypeScript** for type safety and better developer experience

## 🏗️ Architecture Overview

## ⚡ R3F Performance Improvements

The following React Three Fiber optimizations are implemented in this codebase:

- **Guarded movement store updates**: `setPosition` now no-ops when position values are unchanged, preventing redundant Zustand updates and rerenders (`src/lib/stores/useMovement.ts`).
- **Frame-loop write reduction in character movement**: `Character` now checks for real coordinate changes before writing to the movement store, avoiding per-frame no-op writes while idle or blocked by collision (`src/components/three/Character.tsx`).
- **Narrowed Zustand subscription in camera**: `Camera` now subscribes only to `position` instead of the full movement store object, reducing avoidable rerenders from unrelated movement-store changes (`src/components/three/Camera.tsx`).
- **Stable proximity vector for interactive checks**: `Room` now updates a shared `Vector3` via `useFrame` and passes that stable reference through `Desk`, `BassGroup`, and `SkateboardGroup`, removing movement-driven React rerenders from the room subtree (`src/components/three/Room.tsx`, `src/components/three/Desk.tsx`).
- **Removed per-frame camera vector allocations**: `Camera` now reuses preallocated vectors for zoomed camera offset calculations instead of cloning vectors each frame (`src/components/three/Camera.tsx`).
- **Moved debug model introspection out of render**: Bass dimension logging now runs in `useEffect` and only when the model path changes, keeping render pure in debug mode (`src/components/three/Bass.tsx`).
- **Reduced interaction-time allocations in monitor targeting**: `Monitor` now reuses preallocated vectors when computing terminal camera targets instead of repeatedly cloning vectors (`src/components/three/Monitor.tsx`).
- **Removed unused GLTF preload**: dropped a stale bass preload from `BassGroup` to match the active model set (`src/components/three/BassGroup.tsx`).

### Design Decisions

**Why Terminal Interface?**

- **Unique UX**: Stands out from traditional portfolio layouts
- **Developer-friendly**: Appeals to technical audiences and recruiters
- **Interactive**: Creates engagement through command discovery
- **Nostalgic**: Evokes classic computing experiences
- **Immersive showcase**: Desktop visitors explore a 3D room built with React Three Fiber

**Why Next.js 14 with App Router?**

- **Server-side rendering**: Better SEO and initial load performance
- **API routes**: Secure server-side API calls (OpenAI keys stay private)
- **File-based routing**: Intuitive project structure
- **Built-in optimizations**: Automatic code splitting and bundling

**Why OpenAI Assistant API over Chat Completions?**

- **Thread-based conversations**: Maintains context across interactions
- **More sophisticated responses**: Can use tools and access files
- **Better for personal assistants**: Designed for ongoing conversations
- **Future extensibility**: Can easily add more capabilities

## 📁 Next.js Project Structure Deep Dive

This project uses Next.js 14 with the **App Router** (the newer routing system). Here's how the structure works:

### App Router Structure (`src/app/`)

```
src/app/
├── layout.tsx          # Root layout (applies to all pages)
├── page.tsx           # Home page (route: /)
├── globals.css        # Global styles
└── api/               # API routes (server-side endpoints)
    └── gpt/
        └── route.ts   # POST /api/gpt endpoint
```

**Key Concepts:**

1. **Layout.tsx** - The root layout that wraps all pages
    - Defines the `<html>` and `<body>` tags
    - Sets metadata (title, description)
    - Imports global styles
    - Applies to every route in the app

2. **Page.tsx** - The home page component
    - Uses `"use client"` directive (client-side component)
    - Renders the main Terminal component
    - Handles state management for the app

3. **API Routes** - Server-side endpoints
    - Located in `app/api/` directory
    - `route.ts` files define HTTP methods (GET, POST, etc.)
    - Run on the server, keeping API keys secure
    - Handle OpenAI API calls and data processing

### Component Architecture

```
src/components/
├── Terminal.tsx       # Main terminal interface
├── AskGPT.tsx         # AI interaction component
├── Resume.tsx         # Resume display component
├── Contact.tsx        # Contact information
├── FunFact.tsx        # Random fun facts
└── HelpMenu.tsx       # Command help system
```

**Component Design Patterns:**

- **Container Pattern**: `Terminal.tsx` acts as the main container
- **Command Pattern**: Each command (`resume`, `contact`, etc.) has its own component
- **State Management**: Uses React hooks for local state
- **Event Handling**: Custom keyboard utilities for terminal-like input

### Styling Strategy

```
src/styles/
├── reset.scss           # Global reset for consistent styling
├── Home.module.scss     # Home page styles
├── Terminal.module.scss # Terminal interface styles
├── AskGPT.module.scss   # AI interaction styles
├── Resume.module.scss   # Resume display styles
└── Contact.module.scss  # Contact information styles
```

**SCSS Modules Approach:**

- **Scoped styles**: Each component has its own SCSS module
- **No global conflicts**: Styles are automatically scoped to components
- **TypeScript support**: SCSS modules work well with TypeScript
- **Maintainable**: Easy to find and modify component-specific styles

### Utility Functions

```
src/utils/
├── keyboard.ts        # Keyboard event utilities
└── formatting.ts      # Text formatting helpers
```

**Utility Design:**

- **Single responsibility**: Each utility file has a specific purpose
- **Reusable**: Functions can be used across components
- **Type-safe**: TypeScript ensures proper usage

## 🔧 Setup & Development

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- Yarn 1.22.19
- OpenAI API key with Assistant API access

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd portfolio-terminal
yarn install
```

2. **Environment Configuration:**
   Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
# Optional: enables file_search tool in API responses endpoint
VECTOR_STORE_ID=your_vector_store_id_here
```

3. **Start development server:**

```bash
yarn dev
```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

### Available Commands

| Command    | Description                                | Component      |
| ---------- | ------------------------------------------ | -------------- |
| `resume`   | Displays Devon's resume in markdown format | `Resume.tsx`   |
| `contact`  | Shows contact information and social links | `Contact.tsx`  |
| `ask`      | Opens AI assistant for questions           | `AskGPT.tsx`   |
| `fun-fact` | Displays a random fun fact about Devon     | `FunFact.tsx`  |
| `help`     | Shows available commands and descriptions  | `HelpMenu.tsx` |
| `clear`    | Clears the terminal output                 | Built-in       |

## ✅ Testing

### Run Tests

```bash
yarn test
```

Run lint, types, tests, and production build locally (same checks used in CI):

```bash
yarn lint && yarn typecheck && yarn test --ci && yarn build
```

Run only Three component tests:

```bash
yarn test src/components/three
```

Run a single test file:

```bash
yarn test src/components/three/Bass.test.tsx
```

### Test Organization

- Non-Three component tests live in `src/components/*.test.tsx`.
- Three component tests live in `src/components/three/*.test.tsx` with one file per component.
- Shared browser API mocks (like `window.matchMedia`) are installed via `jest.setup.js` from `__mocks__/matchMediaMock.js`.

### Three.js / R3F Test Strategy

- Three tests are unit-level and run in `jsdom`.
- Shared test mocks are centralized in `__mocks__/threeTestHarness.tsx`.
- The harness mocks `@react-three/fiber`, `@react-three/drei`, scene/message contexts, and relevant Zustand stores so tests do not require a real WebGL runtime.

### Troubleshooting

If Jest fails with a Node dynamic library error like:

`Library not loaded: /usr/local/opt/icu4c/lib/libicui18n.*.dylib`

your local Node/Homebrew ICU linkage is broken. Reinstall/relink Node (or ICU) and rerun tests.

## 🔌 API Integration

### OpenAI Assistant API Flow

1. **Client Request**: User types a question in the terminal
2. **API Route**: `/api/gpt` receives the request
3. **Thread Creation**: Creates a new conversation thread
4. **Message Addition**: Adds the user's question to the thread
5. **Assistant Run**: Executes the assistant with the configured ID
6. **Response Retrieval**: Polls for completion and retrieves the response
7. **Client Display**: Shows the response in the terminal

### Error Handling

- **Network errors**: Graceful fallback with user-friendly messages
- **API limits**: Proper error messages for rate limiting
- **Invalid requests**: Validation on both client and server side
- **Timeout handling**: Automatic retry logic for long-running requests

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Other Platforms

The project includes configuration for:

- **Heroku**: `heroku.yml` and `Dockerfile` included
- **Netlify**: Compatible with standard Next.js build process
- **Railway**: Works with the included Docker configuration

### Environment Variables for Production

```env
OPENAI_API_KEY=your_production_api_key
VECTOR_STORE_ID=your_vector_store_id
```

### Continuous Integration and Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/test-and-deploy.yml` that runs lint, typecheck, tests, and build on pull requests to `main`, and deploys to Heroku on pushes to `main` after validation passes.

Add the following secrets in your GitHub repository settings:

- `HEROKU_API_KEY` – your Heroku API key
- `HEROKU_APP_NAME` – your Heroku app name
- `HEROKU_EMAIL` – the email associated with the Heroku account

Also ensure `OPENAI_API_KEY` (and optionally `VECTOR_STORE_ID`) are set in the Heroku environment.

## 🛠️ Technologies & Dependencies

### Core Framework

- **Next.js 15**: React framework with App Router
- **React 18**: Latest React with concurrent features
- **TypeScript 5**: Type-safe JavaScript

### AI & APIs

- **OpenAI SDK**: Official OpenAI JavaScript library
- **Assistant API**: Thread-based conversation management

### UI & Styling

- **CSS Modules**: Scoped component styling
- **React Markdown**: Markdown rendering for resume
- **React Three Fiber**: Desktop-only 3D scene rendering

### Development Tools

- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Next.js Config**: Custom webpack and build configuration

## 🎯 Learning Opportunities

This project is designed as a learning platform for Next.js concepts:

### Next.js App Router Patterns

- **File-based routing**: Understanding how `page.tsx` creates routes
- **Layouts**: How `layout.tsx` provides consistent structure
- **API routes**: Server-side API handling with `route.ts` files
- **Client vs Server components**: When to use `"use client"`

### React Patterns

- **Custom hooks**: State management and side effects
- **Component composition**: Building complex UIs from simple components
- **Event handling**: Keyboard interactions and form submissions
- **State management**: Local state with useState and useCallback

### Modern JavaScript/TypeScript

- **Async/await**: Handling API calls and promises
- **Type safety**: TypeScript interfaces and type definitions
- **ES6+ features**: Arrow functions, destructuring, template literals

## 🤝 Contributing

This is a personal portfolio project, but suggestions and improvements are welcome! The codebase is structured to be educational and maintainable.

## 📄 License

MIT License - feel free to use this as a template for your own portfolio!
