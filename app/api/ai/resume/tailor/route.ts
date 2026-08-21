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

    const jobId = body.job_id;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "job_id is required",
        },
        { status: 400 }
      );
    }

    // Get the student's saved resume
    const { data: resume, error: resumeError } = await supabase
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

    if (!resume) {
      return NextResponse.json(
        {
          success: false,
          error: "Resume not found. Please create your resume first.",
        },
        { status: 404 }
      );
    }

    // Get the selected job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 }
      );
    }

    const prompt = `
You are an expert ATS resume writer.

Tailor the student's existing resume for the selected job.

IMPORTANT RULES:
1. Never invent skills, qualifications, experience, projects, certifications,
   achievements, employers, education or metrics.
2. Only use facts already present in the student's resume.
3. Do not claim the student has a skill they do not have.
4. Highlight existing skills and experience that are relevant to the job.
5. Improve wording using professional action verbs.
6. Keep the content concise and ATS-friendly.
7. Do not add fake numbers or achievements.
8. Preserve the truth of the student's background.

STUDENT RESUME:
${JSON.stringify(resume, null, 2)}

SELECTED JOB:
${JSON.stringify(job, null, 2)}

Return ONLY valid JSON in this structure:

{
  "professional_summary": "",
  "career_objective": "",
  "skills": [],
  "education": [],
  "projects": [],
  "experience": [],
  "internships": [],
  "certifications": [],
  "achievements": [],
  "relevance_notes": []
}

The relevance_notes should briefly explain which existing parts
of the student's profile were emphasized for this job.
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

    let tailoredResume;

    try {
      tailoredResume = JSON.parse(text);
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
      data: {
        job: {
          id: job.id,
          company: job.company,
          title: job.title,
        },
        tailored_resume: tailoredResume,
      },
    });
  } catch (error) {
    console.error("AI Resume Tailoring Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to tailor resume",
      },
      { status: 500 }
    );
  }
}