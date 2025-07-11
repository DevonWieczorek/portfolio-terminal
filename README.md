# DevonGPT - Terminal Portfolio (Next.js)

A terminal-style portfolio website built with Next.js, featuring an AI assistant powered by OpenAI.

## Features

-   Terminal-style interface with command-line interactions
-   AI assistant powered by OpenAI GPT
-   Resume display
-   Contact information
-   Fun facts about Devon
-   Help menu with available commands

## Migration from Create React App

This project has been migrated from Create React App to Next.js with the following changes:

-   **Server-side API calls**: OpenAI API calls now happen on the server side via API routes
-   **App Router**: Uses Next.js 13+ App Router structure
-   **TypeScript**: Full TypeScript support
-   **Less CSS**: Maintains Less CSS styling with webpack configuration

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Create a `.env.local` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

-   `resume`: Displays plain-text version of Devon's resume
-   `contact`: Find out where to reach Devon
-   `ask`: Asks AI Devon a question
-   `fun-fact`: Displays a random "fun fact" about Devon
-   `clear`: Clear the console
-   `help`: Displays the help menu

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── gpt/           # OpenAI API endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── styles/               # Less CSS files
└── utils/                # Utility functions
```

## API Routes

-   `POST /api/gpt`: Handles OpenAI API calls on the server side

## Deployment

The project is configured for deployment on platforms like Vercel, Netlify, or Heroku.

## Technologies Used

-   Next.js 14
-   React 18
-   TypeScript
-   Less CSS
-   OpenAI API
-   React Markdown
