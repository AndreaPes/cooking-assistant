import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * API Route for the Computer Vision Module.
 *
 * This endpoint acts as the "Eyes" of the application. It receives a snapshot
 * from the user's camera (in Base64 format) and uses OpenAI's Vision model
 * to identify food ingredients.
 *
 * The System Prompt is heavily engineered to ensure the output is:
 * 1. **Structured**: Strictly JSON.
 * 2. **Clean**: Normalized names (e.g., "bread" instead of "loaf of bread").
 * 3. **Quantified**: Rough estimates of quantity.
 *
 * @param req - The HTTP request containing the JSON body with the `image` string (Base64).
 * @returns A JSON response containing an array of detected `ingredients`.
 */
export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // 1. PROMPT ENGINEERING
    // -------------------------------------------------------------------------
    // We define strict rules to prevent "noisy" data (e.g., adjectives, branding)
    // from entering the inventory system.
    const systemPrompt = `
      You are a Fridge Inventory AI. 
      Analyze the provided image. Identify all food ingredients visible.
      
      RULES FOR OUTPUT:
      1. Identify items accurately but use SIMPLE, STANDARD ENGLISH names.
         - NO adjectives like "sliced", "fresh", "organic".
         - Use singular forms (e.g., "apple" not "apples").
         - Specific mappings: 
           - "sliced ham" or "prosciutto crudo" -> "ham".
           - "toast bread" or "loaf" -> "bread".
      2. Estimate quantity roughly.
      3. Ignore non-food items.
      
      Return ONLY a raw JSON array of objects. 
      Format example:
      [
        { "name": "milk", "quantity": 1 },
        { "name": "egg", "quantity": 6 },
        { "name": "bread", "quantity": 1 }
      ]
    `;

    // -------------------------------------------------------------------------
    // 2. VISION API CALL
    // -------------------------------------------------------------------------
    // We use 'gpt-4o-mini' as it offers the best balance of speed and vision accuracy
    // for simple object detection tasks.
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this fridge image and list ingredients.",
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "low", // "low" consumes fewer tokens and is sufficient for macro ingredients
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content || "[]";

    // -------------------------------------------------------------------------
    // 3. RESPONSE PARSING
    // -------------------------------------------------------------------------
    // Clean up potential Markdown formatting (```json ... ```) often added by LLMs.
    const cleanJson = content.replace(/```json|```/g, "").trim();

    let ingredients = [];
    try {
      ingredients = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Vision JSON:", content);
      // We return an empty array instead of crashing to allow the UI to handle it gracefully.
    }

    return NextResponse.json({ ingredients });
  } catch (error) {
    console.error("OpenAI Vision Error:", error);
    return NextResponse.json(
      { error: "Vision processing failed" },
      { status: 500 },
    );
  }
}
