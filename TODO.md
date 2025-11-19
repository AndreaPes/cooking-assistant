# 🍳 Cooking Assistant - Roadmap & Todo

## AI & Logic
- [ ] **Dynamic Recipe Generation:** Switch from hardcoded `recipes.ts` to AI-generated recipes (Prompt Engineering).
- [ ] **Multi-language Support:** Update `useVoiceInput` to detect `navigator.language` and update AI system prompt to reply in the matching language (Italian/English).
- [ ] **Context Awareness:** Allow the user to say "How much time is left?" and have the AI read the current state of the running timers.
- [ ] **Ephemeral Interfaces:** Allow the user to change the content of the interface (ex: name of the timer)

## Technical & Performance
- [ ] **Wake Word:** Implement a local wake word engine (like Picovoice Porcupine) so you don't have to click "Speak" every time.

## Computer Vision
- [ ] **Object Detection:** Implement TensorFlow.js (Coco-SSD) to recognize ingredients (e.g., "I see pasta").
- [ ] **Visual Trigger:** Allow the AI to auto-progress steps when it "sees" a specific action (e.g., water boiling).