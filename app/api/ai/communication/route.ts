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

    const body = await request.json();

    if (!body.transcript?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "transcript is required",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id, preferred_language, career_goal")
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

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI communication coach for a student preparing for placements.

Analyze the following student response.

TRANSCRIPT:
${body.transcript}

PREFERRED LANGUAGE:
${profile.preferred_language ?? "English"}

CAREER GOAL:
${profile.career_goal ?? "Not specified"}

Evaluate:
- clarity
- fluency
- grammar
- vocabulary
- confidence
- relevance
- overall communication quality

Give scores from 0 to 100.

Rules:
1. Be constructive and encouraging.
2. Identify specific strengths.
3. Identify specific improvements.
4. Give practical advice for improving communication.
5. Do not judge the student's accent or nationality.
6. Return ONLY valid JSON.

Use exactly this structure:

{
  "overall_score": 0,
  "clarity_score": 0,
  "fluency_score": 0,
  "grammar_score": 0,
  "vocabulary_score": 0,
  "confidence_score": 0,
  "relevance_score": 0,
  "strengths": ["strength 1"],
  "improvements": ["improvement 1"],
  "feedback": "short overall feedback",
  "practice_tip": "one practical tip"
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

    let analysis;

    try {
      analysis = JSON.parse(cleanedText);
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

    // Store the assessment result.
    const { data: savedAssessment, error: saveError } = await supabase
      .from("communication_assessments")
      .insert({
        student_id: profile.id,
        assessment_type: body.assessment_type ?? "communication",
        transcript: body.transcript,
        score: Number(analysis.overall_score),
        feedback: JSON.stringify(analysis),
      })
      .select(
        "id, assessment_type, transcript, score, feedback, assessed_at"
      )
      .single();

    if (saveError) {
      return NextResponse.json(
        {
          success: false,
          error: saveError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        assessment: savedAssessment,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Communication analysis failed",
      },
      { status: 500 }
    );
  }
}