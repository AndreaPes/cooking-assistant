import { NextResponse } from "next/server";
import OpenAI from "openai";

// Import rules from the Features
import { TIMER_RULES, TIMER_JSON_FORMAT } from "@/features/timer/timer.prompt";
import { CORE_JSON_FORMAT } from "@/features/core/core.prompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { userSpeech, activeTimers } = await req.json();

    // Helper to format list for AI
    const timerListString =
      activeTimers && activeTimers.length > 0
        ? activeTimers.map((t: any) => `"${t.label}"`).join(", ")
        : "NONE";

    const timerCount = activeTimers ? activeTimers.length : 0;

    console.log(
      `🎤 User: "${userSpeech}" | Active(${timerCount}): [${timerListString}]`,
    );

    // Build the prompt dynamically
    const systemPrompt = `
      You are a Logic Controller for an AR Cooking App.
      
      CURRENT ACTIVE TIMERS: [${timerListString}]
      
      Classify user intent into JSON.
      
      === FEATURE RULES ===
      
      ${TIMER_RULES}
      
      (Add other feature rules here...)
      
      =====================
      
      JSON STRUCTURE:
      {
        "intent": "string",
        ...fields based on intent
      }
      
      VALID INTENTS:
      ${TIMER_JSON_FORMAT}
      ${CORE_JSON_FORMAT}
      
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
