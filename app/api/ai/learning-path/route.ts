import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
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

    // Get logged-in user
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

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id, name, college, degree, branch, year, career_goal")
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

    // Get student's skill assessments
    const { data: assessments, error: assessmentError } = await supabase
      .from("skill_assessments")
      .select("skill_id, score, source, assessed_at")
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false });

    if (assessmentError) {
      return NextResponse.json(
        {
          success: false,
          error: assessmentError.message,
        },
        { status: 500 }
      );
    }

    // Get skill names
    const skillIds = [
      ...new Set((assessments ?? []).map((item) => item.skill_id)),
    ];

    let skills: Array<{
      id: string;
      name: string;
      category: string;
      description: string | null;
    }> = [];

    if (skillIds.length > 0) {
      const { data: skillData, error: skillError } = await supabase
        .from("skills")
        .select("id, name, category, description")
        .in("id", skillIds);

      if (skillError) {
        return NextResponse.json(
          {
            success: false,
            error: skillError.message,
          },
          { status: 500 }
        );
      }

      skills = skillData ?? [];
    }

    // Keep only the latest assessment for each skill
    const latestAssessments = new Map<string, number>();

    for (const assessment of assessments ?? []) {
      if (!latestAssessments.has(assessment.skill_id)) {
        latestAssessments.set(
          assessment.skill_id,
          Math.max(0, Math.min(100, Number(assessment.score)))
        );
      }
    }

    const skillData = skills.map((skill) => ({
      skill: skill.name,
      category: skill.category,
      current_score: latestAssessments.get(skill.id) ?? null,
      description: skill.description,
    }));

    // Get available learning resources
    const { data: resources, error: resourceError } = await supabase
      .from("learning_resources")
      .select(
        "id, skill_id, title, description, resource_type, url, difficulty, duration_minutes"
      )
      .limit(50);

    if (resourceError) {
      return NextResponse.json(
        {
          success: false,
          error: resourceError.message,
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are an AI career mentor inside a student career preparation platform.

Create a practical personalized learning path for this student.

STUDENT:
${JSON.stringify(profile, null, 2)}

SKILL ASSESSMENTS:
${JSON.stringify(skillData, null, 2)}

AVAILABLE LEARNING RESOURCES:
${JSON.stringify(resources ?? [], null, 2)}

Rules:
1. Prioritize skills with lower scores.
2. Consider the student's career goal.
3. Recommend realistic learning steps.
4. Prefer the provided learning resources when relevant.
5. Do not invent resource IDs or URLs.
6. Keep the plan suitable for a college student.
7. Return ONLY valid JSON.
8. Return 3 to 6 learning steps.

Use exactly this JSON structure:

{
  "career_goal": "string or null",
  "summary": "short explanation of the student's current situation",
  "learning_path": [
    {
      "step": 1,
      "skill": "skill name",
      "priority": "high | medium | low",
      "reason": "why this should be learned now",
      "action": "specific action the student should take",
      "estimated_minutes": 60,
      "resource_ids": ["existing resource id"]
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

    // Remove markdown code fences if Gemini adds them.
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let learningPath;

    try {
      learningPath = JSON.parse(cleanedText);
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
      data: learningPath,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Learning path generation failed",
      },
      { status: 500 }
    );
  }
}