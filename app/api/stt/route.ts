import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    console.log("STT endpoint HIT");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Save temp file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join(os.tmpdir(), `speech-${Date.now()}.webm`);
    await fs.promises.writeFile(tempPath, buffer);

    // 🎤 SPEECH → TEXT
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: "whisper-1",
      language: "en",
      prompt:
        "A cooking assistant command. Talk about recipes, ingredients, steps. Short concise English.",
      temperature: 0,
    });

    fs.unlink(tempPath, () => {});

    return NextResponse.json({
      text: transcription.text,
    });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json({ error: "STT failed" }, { status: 500 });
  }
}
