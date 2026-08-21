import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.question || !body.answer) {
      return NextResponse.json(
        {
          success: false,
          error: "question and answer are required",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI evaluator for a student career preparation platform.

Evaluate the student's answer to the practice question.

QUESTION:
${body.question}

STUDENT ANSWER:
${body.answer}

SKILL:
${body.skill ?? "Not specified"}

Rules:
1. Evaluate correctness, understanding, and completeness.
2. Give a score from 0 to 100.
3. Give concise constructive feedback.
4. Explain what was done well.
5. Explain what should be improved.
6. If the answer is incorrect, explain the correct concept.
7. Return ONLY valid JSON.

Use exactly this structure:

{
  "score": 0,
  "correct": true,
  "feedback": "short overall feedback",
  "strengths": ["strength 1"],
  "improvements": ["improvement 1"],
  "correct_explanation": "brief explanation of the correct concept"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned an empty response",
        },
        { status: 502 }
      );
    }

    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let evaluation;

    try {
      evaluation = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned invalid JSON",
          raw_response: text,
        },
        { status: 502 }
      );
    }

    // Store the attempt so it contributes to the student's practice history.
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      await supabase.from("practice_attempts").insert({
        student_id: profile.id,
        skill_id: body.skill_id ?? null,
        question: body.question,
        answer: body.answer,
        is_correct: Boolean(evaluation.correct),
        score: Number(evaluation.score),
      });
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Answer evaluation failed",
      },
      { status: 500 }
    );
  }
}