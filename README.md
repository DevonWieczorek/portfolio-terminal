# DevonGPT - Terminal Portfolio (Next.js)

A terminal-style portfolio website built with Next.js 14, featuring an AI assistant powered by OpenAI's Assistant API. This project demonstrates modern React patterns, server-side API integration, and a unique terminal interface for portfolio presentation.

## 🚀 Features

-   **Terminal-style interface** with command-line interactions and authentic terminal aesthetics
-   **AI assistant** powered by OpenAI's Assistant API with thread-based conversations
-   **Interactive resume display** with markdown rendering
-   **Contact information** with styled output
-   **Fun facts** about Devon with random selection
-   **Help menu** with available commands and descriptions
-   **Responsive design** that works across different screen sizes
-   **TypeScript** for type safety and better developer experience

## 🏗️ Architecture Overview

### Design Decisions

**Why Terminal Interface?**

-   **Unique UX**: Stands out from traditional portfolio layouts
-   **Developer-friendly**: Appeals to technical audiences and recruiters
-   **Interactive**: Creates engagement through command discovery
-   **Nostalgic**: Evokes classic computing experiences

**Why Next.js 14 with App Router?**

-   **Server-side rendering**: Better SEO and initial load performance
-   **API routes**: Secure server-side API calls (OpenAI keys stay private)
-   **File-based routing**: Intuitive project structure
-   **Built-in optimizations**: Automatic code splitting and bundling

**Why OpenAI Assistant API over Chat Completions?**

-   **Thread-based conversations**: Maintains context across interactions
-   **More sophisticated responses**: Can use tools and access files
-   **Better for personal assistants**: Designed for ongoing conversations
-   **Future extensibility**: Can easily add more capabilities

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

-   **Container Pattern**: `Terminal.tsx` acts as the main container
-   **Command Pattern**: Each command (`resume`, `contact`, etc.) has its own component
-   **State Management**: Uses React hooks for local state
-   **Event Handling**: Custom keyboard utilities for terminal-like input

### Styling Strategy

```
src/styles/
├── reset.css          # CSS reset for consistent styling
├── Home.module.css    # Home page styles
├── Terminal.module.css # Terminal interface styles
├── AskGPT.module.css  # AI interaction styles
├── Resume.module.css  # Resume display styles
└── Contact.module.css # Contact information styles
```

**CSS Modules Approach:**

-   **Scoped styles**: Each component has its own CSS module
-   **No global conflicts**: Styles are automatically scoped to components
-   **TypeScript support**: CSS modules work well with TypeScript
-   **Maintainable**: Easy to find and modify component-specific styles

### Utility Functions

```
src/utils/
├── keyboard.ts        # Keyboard event utilities
└── formatting.ts      # Text formatting helpers
```

**Utility Design:**

-   **Single responsibility**: Each utility file has a specific purpose
-   **Reusable**: Functions can be used across components
-   **Type-safe**: TypeScript ensures proper usage

## 🔧 Setup & Development

### Prerequisites

-   Node.js 18+
-   Yarn or npm
-   OpenAI API key with Assistant API access

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
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_ASSISTANT_ID=your_assistant_id_here
```

**Note**: The `NEXT_PUBLIC_` prefix is used because these values are needed on the client side for the API calls. In a production environment, you might want to handle this differently for security.

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

-   **Network errors**: Graceful fallback with user-friendly messages
-   **API limits**: Proper error messages for rate limiting
-   **Invalid requests**: Validation on both client and server side
-   **Timeout handling**: Automatic retry logic for long-running requests

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Other Platforms

The project includes configuration for:

-   **Heroku**: `heroku.yml` and `Dockerfile` included
-   **Netlify**: Compatible with standard Next.js build process
-   **Railway**: Works with the included Docker configuration

### Environment Variables for Production

```env
NEXT_PUBLIC_OPENAI_API_KEY=your_production_api_key
NEXT_PUBLIC_OPENAI_ASSISTANT_ID=your_production_assistant_id
```

## 🛠️ Technologies & Dependencies

### Core Framework

-   **Next.js 14**: React framework with App Router
-   **React 18**: Latest React with concurrent features
-   **TypeScript 5**: Type-safe JavaScript

### AI & APIs

-   **OpenAI SDK**: Official OpenAI JavaScript library
-   **Assistant API**: Thread-based conversation management

### UI & Styling

-   **CSS Modules**: Scoped component styling
-   **React Markdown**: Markdown rendering for resume

### Development Tools

-   **ESLint**: Code linting and formatting
-   **TypeScript**: Static type checking
-   **Next.js Config**: Custom webpack and build configuration

## 🎯 Learning Opportunities

This project is designed as a learning platform for Next.js concepts:

### Next.js App Router Patterns

-   **File-based routing**: Understanding how `page.tsx` creates routes
-   **Layouts**: How `layout.tsx` provides consistent structure
-   **API routes**: Server-side API handling with `route.ts` files
-   **Client vs Server components**: When to use `"use client"`

### React Patterns

-   **Custom hooks**: State management and side effects
-   **Component composition**: Building complex UIs from simple components
-   **Event handling**: Keyboard interactions and form submissions
-   **State management**: Local state with useState and useCallback

### Modern JavaScript/TypeScript

-   **Async/await**: Handling API calls and promises
-   **Type safety**: TypeScript interfaces and type definitions
-   **ES6+ features**: Arrow functions, destructuring, template literals

## 🤝 Contributing

This is a personal portfolio project, but suggestions and improvements are welcome! The codebase is structured to be educational and maintainable.

## 📄 License

MIT License - feel free to use this as a template for your own portfolio!
