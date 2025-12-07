import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

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
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content || "[]";

    const cleanJson = content.replace(/```json|```/g, "").trim();

    let ingredients = [];
    try {
      ingredients = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Vision JSON:", content);
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
