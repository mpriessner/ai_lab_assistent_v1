# AI Lab Assistant v1

This is a Next.js application designed as an AI-powered lab assistant. It integrates with various AI services to provide its functionalities.

## Features

*   Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/).
*   Integrates with:
    *   OpenAI API
    *   Google Gemini API
    *   ElevenLabs API

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mpriessner/ai_lab_assistent_v1.git
cd ai_lab_assistent_v1
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables. Replace the placeholder values with your actual API keys.

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**Important:** Ensure `.env.local` is listed in your `.gitignore` file to prevent your API keys from being committed to the repository.

### 3. Install Dependencies

```bash
npm install
# or
# yarn install
```

### 4. Run the Development Server

```bash
npm run dev
# or
# yarn dev
```

The application should now be running on [http://localhost:9002](http://localhost:9002) (or the port specified in your `package.json` dev script).

## How to Work With It

*   The main application code is located in the `src/` directory.
*   Next.js pages and API routes can be found in `src/app/` or `src/pages/` (depending on whether you are using the App Router or Pages Router).
*   Services for interacting with external APIs (like OpenAI, Gemini, ElevenLabs) are likely located in a `src/services/` or `src/lib/` directory.

## Deployment

(Details on how to deploy this application, e.g., to Vercel or Netlify, can be added here.)

