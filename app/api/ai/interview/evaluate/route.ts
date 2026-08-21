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

    if (!body.session_id || !body.questions || !body.answers) {
      return NextResponse.json(
        {
          success: false,
          error: "session_id, questions and answers are required",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id, name, career_goal")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Make sure the session belongs to this student.
    const { data: session, error: sessionError } = await supabase
      .from("interview_sessions")
      .select("id, mode, transcript")
      .eq("id", body.session_id)
      .eq("student_id", profile.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: "Interview session not found" },
        { status: 404 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI interview evaluator for a college placement preparation platform.

Evaluate this student's complete interview.

STUDENT:
${JSON.stringify(profile, null, 2)}

QUESTIONS:
${JSON.stringify(body.questions, null, 2)}

STUDENT ANSWERS:
${JSON.stringify(body.answers, null, 2)}

Evaluate:
- technical correctness
- relevance
- clarity
- communication
- completeness
- confidence

Rules:
1. Score everything from 0 to 100.
2. Be constructive and specific.
3. Identify strengths and weaknesses.
4. Give actionable improvement advice.
5. Return ONLY valid JSON.

Use exactly this structure:

{
  "overall_score": 0,
  "technical_score": 0,
  "communication_score": 0,
  "relevance_score": 0,
  "completeness_score": 0,
  "strengths": ["strength 1"],
  "weaknesses": ["weakness 1"],
  "feedback": "overall feedback",
  "recommendations": ["recommendation 1"],
  "question_results": [
    {
      "question_number": 1,
      "score": 0,
      "feedback": "feedback for this answer"
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

    const { data: updatedSession, error: updateError } = await supabase
      .from("interview_sessions")
      .update({
        transcript: {
          questions: body.questions,
          answers: body.answers,
        },
        overall_score: Number(evaluation.overall_score),
        feedback: evaluation,
        completed_at: new Date().toISOString(),
      })
      .eq("id", body.session_id)
      .eq("student_id", profile.id)
      .select(
        "id, career_goal_id, mode, transcript, overall_score, feedback, started_at, completed_at"
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        evaluation,
        session: updatedSession,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Interview evaluation failed",
      },
      { status: 500 }
    );
  }
}