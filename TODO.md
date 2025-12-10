# 🍳 Cooking Assistant - Roadmap & Todo

## 📌 Legend

| Symbol | Meaning                                            |
|:------:|:---------------------------------------------------|
|   🟢   | **Low Complexity**                                 |
|   🟡   | **Medium Complexity**                              |
|   🔴   | **High Complexity**                                |
|   ⭐    | **High Feasibility**                               |
|   ⚖️   | **Medium Feasibility**   |
|   🧪   | **Low Feasibility**   |

---

## 🐛 Bug Fixes & Polish

These are the immediate fixes required to improve stability and UX based on recent testing.

- [X] **Fix Processing State Sync**
    - *Issue:* Microphone returns to "White/Idle" too quickly, even while AI is still thinking.
    - *Goal:* Ensure status stays `PROCESSING` (Yellow) until the *entire* action (API call + UI update) is complete.
    - *Metrics:* Complexity: 🟢 | Feasibility: ⭐

- [ ] **Interface State Restoration**
    - *Issue:* Asking a generic question (Query) closes the current view (e.g., Fridge/Recipe), resetting to default.
    - *Goal:* Store `previousInterface` in Zustand. When closing an InfoPanel, restore the exact previous view.
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

- [ ] **Shopping List Cross-Reference**
    - *Issue:* Missing ingredients in a recipe are marked red even if they are already in the Shopping List.
    - *Goal:* In `SuggestRecipe`, check `ingredientsMissing` against `useShoppingState`. If item exists, show a distinct
      icon (e.g., "In Cart" 🛒) instead of "Missing".
    - *Metrics:* Complexity: 🟢 | Feasibility: ⭐

---

## 🧠 AI & Logic

Enhancing the "Brain" to handle more natural and complex requests.

- [ ] **Context Awareness (Timers)**
    - *Goal:* Allow queries like "How much time is left?" by injecting timer state into the generic QUERY context so the
      AI can read it.
    - *Metrics:* Complexity: 🟢 | Feasibility: ⭐

- [ ] **Smart Timer Control**
    - *Goal:* Support commands like "Pause timer", "Resume timer", "Add 5 minutes to pasta timer".
    - *Implementation:* Update `timer.tools.ts` enum and `ARScene` logic.
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

- [ ] **Multi-language Support**
    - *Goal:* Detect `navigator.language`. Inject "User speaks [Language]" into System Prompt to force AI replies in the
      matching language.
    - *Metrics:* Complexity: 🟢 | Feasibility: ⭐

- [ ] **Step Clarifications**
    - *Goal:* Handle "What does simmer mean?" questions without closing the current Cooking Step interface.
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

- [ ] **Ingredient Substitutions**
    - *Goal:* Logic to ask "I don't have buttermilk" and get suggestions, potentially updating the active recipe steps
      on the fly.
    - *Metrics:* Complexity: 🔴 | Feasibility: ⚖️

---

## 🎨 User Experience & Interface

Improving how the user interacts with the assistant.

- [ ] **Text-to-Speech (TTS)**
    - *Goal:* Implement web `SpeechSynthesis` API to read aloud steps and confirmations. Essential for hands-free
      cooking.
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

- [ ] **Ephemeral UI Updates**
    - *Goal:* Allow renaming timers or items via voice (e.g., "Rename timer 1 to Rice").
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

- [ ] **Save Recipes**
    - *Goal:* Persist favorite recipes (JSON) to `localStorage` or Database to access them later without regenerating
      via AI.
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

---

## 🛠️ Technical & Architecture

Code health, performance, and scalability.

- [ ] **Wake Word Engine**
    - *Goal:* Implement local wake word (Picovoice Porcupine or TensorFlow.js) to trigger listening without clicking.
    - *Metrics:* Complexity: 🔴 | Feasibility: ⚖️ (Browser limitations)

- [ ] **Unit Testing for Tools**
    - *Goal:* Write tests for `timer.tools.ts` and `route.ts` logic to ensure prompt engineering doesn't regress during
      updates.
    - *Metrics:* Complexity: 🟡 | Feasibility: ⭐

- [ ] **Error Boundaries**
    - *Goal:* Wrap AR components in React Error Boundaries to prevent full app crashes if a single component fails.
    - *Metrics:* Complexity: 🟢 | Feasibility: ⭐

---

## 👁️ Computer Vision

Experimental features for the future.

- [ ] **Visual Step Trigger**
    - *Goal:* Use Vision API to detect state changes (e.g., water boiling) to auto-advance steps.
    - *Metrics:* Complexity: 🔴 | Feasibility: 🧪 (Costly & High Latency)

- [ ] **Visual Fridge Add**
    - *Goal:* Allow showing an item to the camera and saying "Add this" (Visual object recognition + Inventory update).
    - *Metrics:* Complexity: 🔴 | Feasibility: ⚖️