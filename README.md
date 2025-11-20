# AR Cooking Assistant

A voice-controlled Augmented Reality cooking assistant built with **Next.js**, **React Three Fiber (WebXR)**, and **OpenAI**.

This project allows users to view recipe steps, set timers, and manage shopping lists via a hands-free AR interface (or webcam passthrough).

## Getting Started

### 1. Prerequisites
- Node.js
- A modern browser (Chrome/Edge) or Meta Quest 3 for AR.
- **OpenAI API Key** (Required for the AI "Brain").

### 2. Installation

```bash
# Clone the repo
git clone [https://github.com/YOUR_USERNAME/cooking-assistant.git](https://github.com/YOUR_USERNAME/cooking-assistant.git)

# Install dependencies
npm install
```

### 3. Environment Setup
Create a .env.local file in the root directory and add your keys:

```bash
 OPENAI_API_KEY=sk-proj-...........................
# Do not commit this file to GitHub!
```

### 4. Run Development Server
```bash
 npm run dev
```
Open http://localhost:3000 to see the app.

Click "Start AR Mode" to use your Webcam as a simulator.

Click "Speak" to give voice commands.

## Project Architecture

To prevent merge conflicts, we use a **Feature-Based Architecture**.
Do **NOT** put everything in `components/` or `state/cookingState.ts`.

### Folder Structure

```text
/features             <-- ALL NEW UI WORK GOES HERE
  /timer/             -> Specific feature folder
    Timer.tsx         -> The 3D Component
    timer.prompt.ts   -> AI Rules for this feature
  /new_feature/
    new_feature.tsx
    new_feature.prompt.ts

/state/slices         <-- ALL NEW LOGIC GOES HERE
  timerSlice.ts       -> Logic for timers
  new_feature.ts      -> Logic for the new feature
 ```

## Developer Guide: How to Add a New Feature

Follow these 4 steps to add a new interface without breaking other code.

### 1. Create the Feature UI

Create a folder in features/new_feature and build your 3D component.

```
// features/new_feature/new_feature.tsx
import { Html } from '@react-three/drei';

export function new_feature({ items }) {
  return (
    <group position={[1.5, 0, -2]}>
      <Html transform>{/* Your UI Here */}</Html>
    </group>
  );
}
```

### 2. Define AI Rules (Prompts)

Create a prompt file in your feature folder so the AI knows how to handle your feature.

```
// features/new_feature/new_feature.prompt.ts
export const NEW_FEATURE_RULES = `
- If user says "something", return something
`;

export const NEW_FEATURE_JSON_FORMAT = `
- FEATURE: { something }
`;
```

### 3. Register the Component

Open components/InterfaceManager.tsx.
1. Import your component at the top. 
2. Add a case to the renderDynamicInterface switch statement.

```
// components/InterfaceManager.tsx
import { new_feature } from '@/features/new_feature/new_feature'; // 1. Import

// ... inside renderDynamicInterface switch ...
case 'new_feature': // 2. Map Intent
  return <new_feature items={data.item} />;
```

### 4. Connect to the API

Open app/api/assist/route.ts and import your rules.

```
import { NEW_FEATURE_RULES, NEW_FEATURE_JSON_FORMAT } from "@/features/new_feature/new_feature.prompt";
```

## Git Workflow
To avoid conflicts, please follow this workflow:
- Create a Branch: git checkout -b feature/your-feature-name 
- Work: Follow the steps above. 
- Push: git push origin feature/your-feature-name 
- PR: Create a Pull Request to merge into main (or develop).