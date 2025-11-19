import {NextResponse} from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export async function POST(req: Request) {
    try {
        const {userSpeech, currentStepIndex, recipeTitle} = await req.json();
        console.log(`🎤 User: "${userSpeech}" | Context: ${recipeTitle} Step ${currentStepIndex}`);
        const systemPrompt = `
      You are the Controller for an AR Cooking App.
      Context: Cooking "${recipeTitle}", currently at Step Index: ${currentStepIndex}.
      
      Classify user intent into a JSON Action:
      
      1. NAVIGATE: User says "next", "back", "start", "repeat".
         -> Action: { "intent": "NAVIGATE", "direction": "next" | "prev" | "repeat" }
         
      2. TIMER: User wants to set or cancel timers.
         - START: { "intent": "TIMER", "action": "start", "seconds": number, "label": string }
         - STOP ONE: { "intent": "TIMER", "action": "stop", "label": string } 
           (Use "label" to identify which one, e.g., "pasta", "oven")
         - STOP ALL: { "intent": "TIMER", "action": "stop_all" }
         
      3. SHOPPING: User mentions shopping list or missing items.
         -> { "intent": "SHOPPING", "action": "add", "item": string }
         
      4. INGREDIENTS: User asks "what do I need?" or "show ingredients".
         -> { "intent": "SHOW_INGREDIENTS" }
         
      5. QUERY: User asks a question (e.g., "How much is 200g?").
         -> { "intent": "QUERY", "answer": "Short answer text" }

      Return ONLY JSON.
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {role: "system", content: systemPrompt},
                {role: "user", content: userSpeech}
            ],
            response_format: {type: "json_object"}
        });

        const content = JSON.parse(response.choices[0].message.content || "{}");
        console.log("🤖 AI Output:", content);
        return NextResponse.json(content);

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Brain freeze"}, {status: 500});
    }
}