import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
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

    // Student profile
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select(
        "id, user_id, name, college, degree, branch, year, preferred_language, career_goal"
      )
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

    // Latest skill assessments
    const { data: skillAssessments } = await supabase
      .from("skill_assessments")
      .select("id, skill_id, score, source, assessed_at")
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false });

    const skillIds = [
      ...new Set((skillAssessments ?? []).map((item) => item.skill_id)),
    ];

    let skills: Array<{
      id: string;
      name: string;
      category: string;
    }> = [];

    if (skillIds.length > 0) {
      const { data } = await supabase
        .from("skills")
        .select("id, name, category")
        .in("id", skillIds);

      skills = data ?? [];
    }

    const skillMap = new Map(skills.map((skill) => [skill.id, skill]));

    const latestSkills = new Map<
      string,
      {
        skill_id: string;
        skill_name: string;
        category: string;
        score: number;
        source: string;
        assessed_at: string;
      }
    >();

    for (const assessment of skillAssessments ?? []) {
      if (!latestSkills.has(assessment.skill_id)) {
        const skill = skillMap.get(assessment.skill_id);

        latestSkills.set(assessment.skill_id, {
          skill_id: assessment.skill_id,
          skill_name: skill?.name ?? "Unknown skill",
          category: skill?.category ?? "Unknown",
          score: Number(assessment.score),
          source: assessment.source,
          assessed_at: assessment.assessed_at,
        });
      }
    }

    // Latest readiness
    const { data: readinessData } = await supabase
      .from("progress_snapshots")
      .select(
        "readiness_score, skill_score, communication_score, interview_score, snapshot_date"
      )
      .eq("student_id", profile.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Progress snapshots
    const { data: progressSnapshots } = await supabase
      .from("progress_snapshots")
      .select(
        "skill_id, readiness_score, skill_score, communication_score, interview_score, snapshot_date"
      )
      .eq("student_id", profile.id)
      .order("snapshot_date", { ascending: false })
      .limit(10);

    // Practice statistics
    const { data: practiceAttempts } = await supabase
      .from("practice_attempts")
      .select("score, is_correct, attempted_at")
      .eq("student_id", profile.id)
      .order("attempted_at", { ascending: false })
      .limit(50);

    const practiceScores = (practiceAttempts ?? [])
      .map((attempt) => Number(attempt.score))
      .filter((score) => Number.isFinite(score));

    const practiceAverage =
      practiceScores.length > 0
        ? Math.round(
            practiceScores.reduce((sum, score) => sum + score, 0) /
              practiceScores.length
          )
        : null;

    const practiceCorrect = (practiceAttempts ?? []).filter(
      (attempt) => attempt.is_correct === true
    ).length;

    // Learning progress
    const { data: learningAttempts } = await supabase
      .from("learning_attempts")
      .select(
        "resource_id, status, progress_percent, started_at, completed_at"
      )
      .eq("student_id", profile.id)
      .order("started_at", { ascending: false })
      .limit(50);

    const learningProgress = learningAttempts ?? [];

    const completedLearning = learningProgress.filter(
      (attempt) => attempt.status === "completed"
    ).length;

    const averageLearningProgress =
      learningProgress.length > 0
        ? Math.round(
            learningProgress.reduce(
              (sum, attempt) => sum + Number(attempt.progress_percent ?? 0),
              0
            ) / learningProgress.length
          )
        : 0;

    // Latest communication assessment
    const { data: communication } = await supabase
      .from("communication_assessments")
      .select(
        "id, assessment_type, score, feedback, assessed_at"
      )
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Latest interview
    const { data: interview } = await supabase
      .from("interview_sessions")
      .select(
        "id, mode, overall_score, feedback, started_at, completed_at"
      )
      .eq("student_id", profile.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Skill-gap approximation for dashboard display.
    // A score below 70 is considered an area needing improvement.
    const skillGaps = Array.from(latestSkills.values())
      .filter((skill) => skill.score < 70)
      .map((skill) => ({
        skill_id: skill.skill_id,
        skill_name: skill.skill_name,
        category: skill.category,
        current_score: skill.score,
        gap: Math.max(0, 70 - skill.score),
      }))
      .sort((a, b) => b.gap - a.gap);

    return NextResponse.json({
      success: true,
      data: {
        profile,

        skills: Array.from(latestSkills.values()),

        skill_gaps: skillGaps,

        readiness: {
          readiness_score: readinessData?.readiness_score ?? null,
          skill_score: readinessData?.skill_score ?? null,
          communication_score:
            readinessData?.communication_score ??
            communication?.score ??
            null,
          interview_score:
            readinessData?.interview_score ??
            interview?.overall_score ??
            null,
          snapshot_date: readinessData?.snapshot_date ?? null,
        },

        practice: {
          total_attempts: practiceAttempts?.length ?? 0,
          correct_attempts: practiceCorrect,
          average_score: practiceAverage,
        },

        learning: {
          total_attempts: learningProgress.length,
          completed: completedLearning,
          average_progress_percent: averageLearningProgress,
        },

        communication: communication
          ? {
              id: communication.id,
              assessment_type: communication.assessment_type,
              score: communication.score,
              feedback: communication.feedback,
              assessed_at: communication.assessed_at,
            }
          : null,

        interview: interview
          ? {
              id: interview.id,
              mode: interview.mode,
              overall_score: interview.overall_score,
              feedback: interview.feedback,
              started_at: interview.started_at,
              completed_at: interview.completed_at,
            }
          : null,

        progress_snapshots: progressSnapshots ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Dashboard aggregation failed",
      },
      { status: 500 }
    );
  }
}