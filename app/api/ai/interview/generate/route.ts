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

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id, name, degree, branch, year, career_goal")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const count = Math.min(
      Math.max(Number(body.count ?? 5), 1),
      10
    );

    const mode = body.mode ?? "technical";

    const { data: assessments } = await supabase
      .from("skill_assessments")
      .select("skill_id, score, assessed_at")
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false })
      .limit(20);

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI interview simulator for a college placement preparation platform.

Generate ${count} interview questions for this student.

STUDENT:
${JSON.stringify(profile, null, 2)}

INTERVIEW MODE:
${mode}

RECENT SKILL ASSESSMENTS:
${JSON.stringify(assessments ?? [], null, 2)}

Rules:
1. Questions must match the student's career goal.
2. Prefer questions relevant to the student's assessed skills.
3. Mix technical and behavioral questions when appropriate.
4. Make the questions realistic for a placement interview.
5. Do not provide answers.
6. Return ONLY valid JSON.
7. Generate exactly ${count} questions.

Use exactly this structure:

{
  "career_goal": "string or null",
  "mode": "${mode}",
  "questions": [
    {
      "question_number": 1,
      "question": "interview question",
      "type": "technical | behavioral | situational",
      "difficulty": "easy | medium | hard",
      "skill": "related skill or null"
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

    let interview;

    try {
      interview = JSON.parse(cleanedText);
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

    // Create an interview session so the frontend has a session ID.
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .insert({
        student_id: profile.id,
        mode,
        transcript: {
          generated_questions: interview.questions ?? [],
        },
      })
      .select(
        "id, career_goal_id, mode, transcript, overall_score, feedback, started_at, completed_at"
      )
      .single();

    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          error: sessionError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session,
        interview,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Interview generation failed",
      },
      { status: 500 }
    );
  }
}