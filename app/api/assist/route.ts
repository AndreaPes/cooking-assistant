import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenAI } from '@google/genai';

// Import rules from the Features
import { TIMER_RULES, TIMER_JSON_FORMAT } from "@/features/timer/timer.prompt";
import { CORE_JSON_FORMAT } from "@/features/core/core.prompt";
import {
  SHOPPING_LIST_RULES,
  SHOPPING_LIST_JSON_FORMAT,
} from "@/features/shopping_list/shopping_list.prompt";

//const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      
      ${SHOPPING_LIST_RULES}
      (Add other feature rules here...)
      
      =====================
      
      JSON STRUCTURE:
      {
        "intent": "string",
        ...fields based on intent
      }
      
      VALID INTENTS:
      ${TIMER_JSON_FORMAT}
      ${SHOPPING_LIST_JSON_FORMAT}
      ${CORE_JSON_FORMAT}
      
      Return ONLY JSON.
    `;

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    } else if (process.env.GOOGLE_API_KEY) {
      const googleAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
      const response = await googleAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }, { text: userSpeech }] }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0,
        }
      });
      const content = JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      console.log("AI Output:", content);
      return NextResponse.json(content);
    }

    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Brain freeze" }, { status: 500 });
  }
}
