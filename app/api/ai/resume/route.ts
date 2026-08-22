import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
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

    // Use supplied resume data, or fetch the user's saved resume.
    let resumeData = body;

    if (!body || Object.keys(body).length === 0) {
      const { data: savedResume, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (resumeError) {
        return NextResponse.json(
          {
            success: false,
            error: resumeError.message,
          },
          { status: 500 }
        );
      }

      if (!savedResume) {
        return NextResponse.json(
          {
            success: false,
            error: "Resume data not found. Please create your resume first.",
          },
          { status: 404 }
        );
      }

      resumeData = savedResume;
    }

    const prompt = `
You are a professional resume writer and career advisor.

Create professional, concise and ATS-friendly resume content from the student's information below.

IMPORTANT RULES:
1. Never invent qualifications, experience, projects, skills, certifications or achievements.
2. Only improve the wording and organization of information actually provided.
3. Use strong professional action verbs where appropriate.
4. Keep descriptions concise and achievement-oriented.
5. Make the content suitable for internships and entry-level placements.
6. Do not add fake numbers or metrics.
7. Keep the student's actual skills and experience truthful.

Student information:

${JSON.stringify(resumeData, null, 2)}

Return ONLY valid JSON using this structure:

{
  "professional_summary": "A concise professional summary",
  "career_objective": "Improved career objective",
  "skills": [],
  "education": [],
  "projects": [],
  "experience": [],
  "internships": [],
  "certifications": [],
  "achievements": []
}

For projects, experience and internships, improve the descriptions while preserving the original facts.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned an empty response",
        },
        { status: 500 }
      );
    }

    let generatedResume;

    try {
      generatedResume = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned invalid JSON",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: generatedResume,
    });
  } catch (error) {
    console.error("AI Resume Generation Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate AI resume",
      },
      { status: 500 }
    );
  }
}