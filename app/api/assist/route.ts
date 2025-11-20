import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { userSpeech, currentStepIndex, recipeTitle, activeTimers } =
      await req.json();
    const timerListString =
      activeTimers && activeTimers.length > 0
        ? activeTimers.map((t: any) => `"${t.label}"`).join(", ")
        : "NONE";

    const timerCount = activeTimers ? activeTimers.length : 0;

    console.log(
      `🎤 User: "${userSpeech}" | Active(${timerCount}): [${timerListString}]`,
    );

    const systemPrompt = `
      You are a Controller for an AR Cooking App.
      Context: Cooking "${recipeTitle}". Step: ${currentStepIndex}.
      
      CURRENT ACTIVE TIMERS: [${timerListString}]
      
      Classify user intent into JSON.
      
      ---------------------------------------------------------
      🔴 RULES FOR STARTING TIMERS (Label Extraction):
      1. You MUST try to extract a label if the user mentions a food or object.
         - "Set timer for pasta" -> Label: "Pasta"
         - "Timer for the sauce" -> Label: "Sauce"
         - "Chicken timer 10 mins" -> Label: "Chicken"
      2. Only use "Timer" if the user specifies NO object (e.g., "Set a timer for 10 minutes").
      3. Do NOT worry about matching the active list. New timers can have new names.
      ---------------------------------------------------------
      
      ---------------------------------------------------------
      🔵 RULES FOR STOPPING TIMERS (Strict Matching):
      1. Check the "CURRENT ACTIVE TIMERS" list.
      2. If the user's word matches an active timer phonetically or partially (e.g., "Sau" -> "Sauce"), use the EXISTING label.
      3. If there is ONLY 1 active timer and user says "Stop timer", return that label.
      4. If NO match is found, return the User's exact word.
      ---------------------------------------------------------
      
      JSON STRUCTURE:
      1. NAVIGATE: { "intent": "NAVIGATE", "direction": "next" | "prev" }
      2. TIMER: 
         - Start: { "intent": "TIMER", "action": "start", "seconds": number, "label": string }
         - Stop:  { "intent": "TIMER", "action": "stop", "label": string }
         - Stop All: { "intent": "TIMER", "action": "stop_all" }
      3. SHOPPING: { "intent": "SHOPPING", "action": "add", "item": string }
      4. QUERY: { "intent": "QUERY", "answer": "Short text" }
      
      Return ONLY JSON.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userSpeech },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    console.log("AI Output:", content);
    return NextResponse.json(content);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Brain freeze" }, { status: 500 });
  }
}
