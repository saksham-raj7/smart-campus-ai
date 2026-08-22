import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured",
        },
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
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id, name, degree, branch, year, career_goal")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const skillId = body.skill_id ?? null;
    const difficulty = body.difficulty ?? "medium";
    const count = Math.min(Math.max(Number(body.count ?? 5), 1), 10);

    let skill = null;

    if (skillId) {
      const { data: skillData, error: skillError } = await supabase
        .from("skills")
        .select("id, name, category, description")
        .eq("id", skillId)
        .single();

      if (skillError || !skillData) {
        return NextResponse.json(
          {
            success: false,
            error: "Skill not found",
          },
          { status: 404 }
        );
      }

      skill = skillData;
    }

    const { data: assessments } = await supabase
      .from("skill_assessments")
      .select("skill_id, score, source, assessed_at")
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false })
      .limit(20);

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI practice-question generator for a student career preparation platform.

Generate ${count} practice questions for this student.

STUDENT:
${JSON.stringify(profile, null, 2)}

REQUESTED SKILL:
${JSON.stringify(skill, null, 2)}

DIFFICULTY:
${difficulty}

RECENT SKILL ASSESSMENTS:
${JSON.stringify(assessments ?? [], null, 2)}

Rules:
1. Questions should be relevant to the student's career goal.
2. Focus on the requested skill when one is provided.
3. Match the requested difficulty.
4. Questions should test understanding, not just memorization.
5. Do not include answers in the question text.
6. Return ONLY valid JSON.
7. Generate exactly ${count} questions.

Use exactly this structure:

{
  "skill": "skill name or null",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "question text",
      "question_type": "technical | conceptual | scenario",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correct_answer": "correct option",
      "explanation": "short explanation"
    }
  ]
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

    let practice;

    try {
      practice = JSON.parse(cleanedText);
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

    return NextResponse.json({
      success: true,
      data: practice,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Practice generation failed",
      },
      { status: 500 }
    );
  }
}