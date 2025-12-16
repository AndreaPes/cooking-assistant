# AR Cooking Assistant

> **A voice-controlled Augmented Reality cooking companion.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat&logo=openai&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-Database-00E599?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
[![Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://cooking-assistant-green.vercel.app/)

Built with **Next.js**, **React Three Fiber (WebXR)**, and **OpenAI**, this application transforms your kitchen into a
smart environment. It allows users to view recipe steps, manage timers, and control inventory hands-free using voice
commands or through an AR headset.

## Key Features

- **Immersive AR Interface:** Floating 3D panels for recipes, timers, and lists that follow you in the room.
- **Voice First:** Full hands-free control. Just say **"Hey Mirage"** to wake the assistant up.
- **AI Powered:** Powered by OpenAI to understand natural language, generate recipes, and answer cooking
  questions.
- **Cloud Sync:** Shopping List persists in a **PostgreSQL Database**, accessible from any device.
- **Fridge Scanning:** Scan your fridge contents using your device camera to suggest recipes based on available ingredients.

---

## Voice Commands Cheatsheet

Once you say the wake word **"Hey Mirage"** (or click the microphone), try these commands:

| Category       | Command Examples                                                                                                                   |
|:---------------|:-----------------------------------------------------------------------------------------------------------------------------------|
| **Cooking**    | "I want to cook a Carbonara" <br> "Suggest a vegan recipe with what I have"                                                        |
| **Navigation** | "Next step", "Go back", "Repeat that", "What is step 3?"                                                                           |
| **Timers**     | "Start a timer for 10 minutes for pasta" <br> "Pause the timer" <br> "Add 5 minutes to the timer" <br> "Rename the timer to Pizza" |
| **Shopping**   | "Add milk and eggs to shopping list" <br> "Remove the chicken" <br> "Show shopping list" <br> "Clear the shopping list"            |
| **Scan**       | "Scan my fridge"                                                                                                                   |
| **Fridge**     | "Add tomatoes to the fridge" <br> "What do I have in the fridge?" <br> "Clear the fridge inventory"                                |
| **General**    | "How many grams is one cup of flour?" (Unit conversion)                                                                            |

---

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/)
- **3D Engine:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
- **XR/AR:** [@react-three/xr](https://github.com/pmndrs/react-three-xr)
- **AI Logic:** OpenAI API (Function Calling)
- **Voice Recognition:** [Picovoice Porcupine](https://picovoice.ai/platform/porcupine/) (Wake Word) + Web Speech API (Transcription)
- **Database:** Prisma ORM + Neon (PostgreSQL)
- **State Management:** Zustand
- **Deployment:** [Vercel](https://cooking-assistant-green.vercel.app/)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites

- Node.js (v18+)
- A modern browser (Chrome/Edge/Safari)
- **OpenAI API Key**
- A **Neon** (Postgres) Database URL

### 2. Installation

```bash
# Clone the repository
git clone [https://github.com/andreapes/cooking-assistant.git](https://github.com/andreapes/cooking-assistant.git)

# Navigate into directory
cd cooking-assistant

# Install dependencies
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory (do NOT commit this file):

```bash
# OpenAI Key for the AI Brain
OPENAI_API_KEY="sk-proj-..........................."

# Database Connection (Neon/Postgres)
DATABASE_URL="postgres://user:password@ep-your-region.aws.neon.tech/neondb?sslmode=require"
```

### 4. Database Initialization
Push the Prisma schema to your remote database to create the tables.

```bash
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```
open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.