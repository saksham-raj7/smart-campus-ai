import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const MIN_COHORT_SIZE = 5;

type StudentMetrics = {
  studentId: string;
  readiness: number | null;
  skillScores: Map<string, number>;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function getTargetScore(relevanceWeight: number): number {
  if (relevanceWeight >= 1) return 90;
  if (relevanceWeight >= 0.9) return 88;
  if (relevanceWeight >= 0.8) return 85;
  if (relevanceWeight >= 0.7) return 82;
  return 80;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function round(value: number | null): number | null {
  if (value === null) return null;

  return Math.round(value * 100) / 100;
}

function calculateReadiness(
  skillScore: number | null,
  communicationScore: number | null,
  practiceScore: number | null,
  interviewScore: number | null
): number | null {
  const components = [
    { score: skillScore, weight: 0.5 },
    { score: communicationScore, weight: 0.2 },
    { score: practiceScore, weight: 0.15 },
    { score: interviewScore, weight: 0.15 },
  ];

  const available = components.filter(
    (component) => component.score !== null
  );

  const totalWeight = available.reduce(
    (sum, component) => sum + component.weight,
    0
  );

  if (totalWeight === 0) return null;

  const weightedScore = available.reduce(
    (sum, component) =>
      sum + (component.score ?? 0) * component.weight,
    0
  );

  return weightedScore / totalWeight;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // =========================================================
    // 1. AUTHENTICATION
    // =========================================================

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

    // =========================================================
    // 2. CURRENT STUDENT
    // =========================================================

    const { data: currentStudent, error: profileError } =
      await supabase
        .from("student_profiles")
        .select("id, user_id, career_goal")
        .eq("user_id", user.id)
        .single();

    if (profileError || !currentStudent) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile not found",
        },
        { status: 404 }
      );
    }

    if (!currentStudent.career_goal) {
      return NextResponse.json(
        {
          success: false,
          error: "Career goal not set",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 3. CURRENT STUDENT PRIVACY SETTING
    // =========================================================

    const { data: currentPrivacy, error: currentPrivacyError } =
      await supabase
        .from("student_privacy_settings")
        .select("anonymous_peer_benchmarking")
        .eq("user_id", user.id)
        .maybeSingle();

    if (currentPrivacyError) {
      return NextResponse.json(
        {
          success: false,
          error: currentPrivacyError.message,
        },
        { status: 500 }
      );
    }

    const currentStudentAllowsBenchmarking =
      currentPrivacy?.anonymous_peer_benchmarking ?? true;

    // =========================================================
    // 4. SAME-CAREER-GOAL COHORT
    // =========================================================

    const { data: cohortStudents, error: cohortError } =
      await supabase
        .from("student_profiles")
        .select("id, user_id, career_goal")
        .eq("career_goal", currentStudent.career_goal);

    if (cohortError) {
      return NextResponse.json(
        {
          success: false,
          error: cohortError.message,
        },
        { status: 500 }
      );
    }

    const cohort = cohortStudents ?? [];

    // =========================================================
    // 5. PRIVACY SETTINGS FOR COHORT
    // =========================================================

    const cohortUserIds = cohort.map(
      (student) => student.user_id
    );

    let privacySettings: Array<{
      user_id: string;
      anonymous_peer_benchmarking: boolean;
    }> = [];

    if (cohortUserIds.length > 0) {
      const { data: settings, error: privacyError } =
        await supabase
          .from("student_privacy_settings")
          .select(
            "user_id, anonymous_peer_benchmarking"
          )
          .in("user_id", cohortUserIds);

      if (privacyError) {
        return NextResponse.json(
          {
            success: false,
            error: privacyError.message,
          },
          { status: 500 }
        );
      }

      privacySettings = settings ?? [];
    }

    const privacyMap = new Map(
      privacySettings.map((setting) => [
        setting.user_id,
        setting.anonymous_peer_benchmarking,
      ])
    );

    /*
     * No preference row means the default is true.
     */
    const eligibleCohort = cohort.filter(
      (student) =>
        privacyMap.get(student.user_id) ?? true
    );

    // =========================================================
    // 6. ELIGIBLE STUDENT IDS
    // =========================================================

    const eligibleStudentIds = eligibleCohort.map(
      (student) => student.id
    );

    /*
     * Always include the current student for calculating
     * their own values.
     */
    if (!eligibleStudentIds.includes(currentStudent.id)) {
      eligibleStudentIds.push(currentStudent.id);
    }

    // =========================================================
    // 7. SKILL ASSESSMENTS
    // =========================================================

    const { data: skillAssessments, error: skillError } =
      await supabase
        .from("skill_assessments")
        .select(
          "student_id, skill_id, score, assessed_at"
        )
        .in("student_id", eligibleStudentIds)
        .order("assessed_at", { ascending: false });

    if (skillError) {
      return NextResponse.json(
        {
          success: false,
          error: skillError.message,
        },
        { status: 500 }
      );
    }

    const latestSkillScores = new Map<string, number>();

    for (const assessment of skillAssessments ?? []) {
      const key = `${assessment.student_id}:${assessment.skill_id}`;

      if (!latestSkillScores.has(key)) {
        latestSkillScores.set(
          key,
          clampScore(Number(assessment.score))
        );
      }
    }

    // =========================================================
    // 8. COMMUNICATION ASSESSMENTS
    // =========================================================

    const {
      data: communicationAssessments,
      error: communicationError,
    } = await supabase
      .from("communication_assessments")
      .select("student_id, score, assessed_at")
      .in("student_id", eligibleStudentIds)
      .not("score", "is", null)
      .order("assessed_at", { ascending: false });

    if (communicationError) {
      return NextResponse.json(
        {
          success: false,
          error: communicationError.message,
        },
        { status: 500 }
      );
    }

    const latestCommunication = new Map<string, number>();

    for (const assessment of communicationAssessments ?? []) {
      if (!latestCommunication.has(assessment.student_id)) {
        latestCommunication.set(
          assessment.student_id,
          clampScore(Number(assessment.score))
        );
      }
    }

    // =========================================================
    // 9. PRACTICE PERFORMANCE
    // =========================================================

    const {
      data: practiceAttempts,
      error: practiceError,
    } = await supabase
      .from("practice_attempts")
      .select("student_id, score, attempted_at")
      .in("student_id", eligibleStudentIds)
      .not("score", "is", null);

    if (practiceError) {
      return NextResponse.json(
        {
          success: false,
          error: practiceError.message,
        },
        { status: 500 }
      );
    }

    const practiceScores = new Map<string, number[]>();

    for (const attempt of practiceAttempts ?? []) {
      const scores =
        practiceScores.get(attempt.student_id) ?? [];

      scores.push(
        clampScore(Number(attempt.score))
      );

      practiceScores.set(
        attempt.student_id,
        scores
      );
    }

    const practiceAverage = new Map<string, number>();

    for (const [studentId, scores] of practiceScores) {
      const avg = average(scores);

      if (avg !== null) {
        practiceAverage.set(studentId, avg);
      }
    }

    // =========================================================
    // 10. INTERVIEW PERFORMANCE
    // =========================================================

    const {
      data: interviewSessions,
      error: interviewError,
    } = await supabase
      .from("interview_sessions")
      .select(
        "student_id, overall_score, completed_at"
      )
      .in("student_id", eligibleStudentIds)
      .not("overall_score", "is", null)
      .order("completed_at", { ascending: false });

    if (interviewError) {
      return NextResponse.json(
        {
          success: false,
          error: interviewError.message,
        },
        { status: 500 }
      );
    }

    const latestInterview = new Map<string, number>();

    for (const interview of interviewSessions ?? []) {
      if (!latestInterview.has(interview.student_id)) {
        latestInterview.set(
          interview.student_id,
          clampScore(Number(interview.overall_score))
        );
      }
    }

    // =========================================================
    // 11. BUILD METRICS
    // =========================================================

    const studentMetrics =
      new Map<string, StudentMetrics>();

    for (const studentId of eligibleStudentIds) {
      const skillScores = new Map<string, number>();

      for (const [key, score] of latestSkillScores) {
        if (key.startsWith(`${studentId}:`)) {
          const skillId = key.substring(
            `${studentId}:`.length
          );

          skillScores.set(skillId, score);
        }
      }

      const skillAverage = average(
        Array.from(skillScores.values())
      );

      const readiness = calculateReadiness(
        skillAverage,
        latestCommunication.get(studentId) ?? null,
        practiceAverage.get(studentId) ?? null,
        latestInterview.get(studentId) ?? null
      );

      studentMetrics.set(studentId, {
        studentId,
        readiness,
        skillScores,
      });
    }

    // =========================================================
    // 12. CURRENT STUDENT METRICS
    // =========================================================

    const currentMetrics = studentMetrics.get(
      currentStudent.id
    );

    if (!currentMetrics) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to calculate current student metrics",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 13. PEERS
    // =========================================================

    const peers = eligibleCohort.filter(
      (student) =>
        student.id !== currentStudent.id
    );

    if (peers.length < MIN_COHORT_SIZE) {
      return NextResponse.json({
        success: true,
        data: {
          status: "insufficient_data",
          message:
            "There are not enough comparable students to provide meaningful peer benchmarking.",
          minimum_peer_count: MIN_COHORT_SIZE,
          available_peer_count: peers.length,
        },
      });
    }

    // =========================================================
    // 14. PEER READINESS
    // =========================================================

    const peerReadinessValues = peers
      .map(
        (peer) =>
          studentMetrics.get(peer.id)?.readiness ?? null
      )
      .filter(
        (score): score is number =>
          score !== null
      );

    if (peerReadinessValues.length < MIN_COHORT_SIZE) {
      return NextResponse.json({
        success: true,
        data: {
          status: "insufficient_data",
          message:
            "There is not enough readiness data to provide meaningful peer benchmarking.",
          minimum_peer_count: MIN_COHORT_SIZE,
          available_peer_count:
            peerReadinessValues.length,
        },
      });
    }

    const peerAverageReadiness =
      average(peerReadinessValues);

    // =========================================================
    // 15. PERCENTILE
    // =========================================================

    let percentile: number | null = null;

    if (
      currentMetrics.readiness !== null &&
      peerReadinessValues.length > 0
    ) {
      const belowOrEqual =
        peerReadinessValues.filter(
          (score) =>
            score <= currentMetrics.readiness!
        ).length;

      percentile = Math.round(
        (belowOrEqual /
          peerReadinessValues.length) *
          100
      );
    }

    // =========================================================
    // 16. CAREER GOAL
    // =========================================================

    const {
      data: careerGoal,
      error: careerGoalError,
    } = await supabase
      .from("career_goals")
      .select("id, name")
      .eq("name", currentStudent.career_goal)
      .maybeSingle();

    if (careerGoalError) {
      return NextResponse.json(
        {
          success: false,
          error: careerGoalError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 17. SKILL BENCHMARKS
    // =========================================================

    let skillBenchmarks: Array<{
      skill_id: string;
      skill_name: string;
      category: string | null;
      relevance_weight: number;
      target_score: number;
    }> = [];

    if (careerGoal) {
      const {
        data: careerGoalSkills,
        error: careerGoalSkillsError,
      } = await supabase
        .from("career_goal_skills")
        .select(
          "skill_id, relevance_weight, skills(id, name, category)"
        )
        .eq("career_goal_id", careerGoal.id);

      if (careerGoalSkillsError) {
        return NextResponse.json(
          {
            success: false,
            error: careerGoalSkillsError.message,
          },
          { status: 500 }
        );
      }

      skillBenchmarks =
        (careerGoalSkills ?? []).map((item) => {
          const skill = Array.isArray(item.skills)
            ? item.skills[0]
            : item.skills;

          const relevanceWeight =
            Number(item.relevance_weight);

          return {
            skill_id: item.skill_id,
            skill_name:
              skill?.name ?? "Unknown skill",
            category:
              skill?.category ?? null,
            relevance_weight:
              relevanceWeight,
            target_score:
              getTargetScore(relevanceWeight),
          };
        });
    }

    // =========================================================
    // 18. SKILL-WISE PEER BENCHMARKS
    // =========================================================

    const skillBenchmarksResponse =
      skillBenchmarks.map((benchmark) => {
        const currentScore =
          currentMetrics.skillScores.get(
            benchmark.skill_id
          ) ?? null;

        const peerScores = peers
          .map(
            (peer) =>
              studentMetrics
                .get(peer.id)
                ?.skillScores.get(
                  benchmark.skill_id
                ) ?? null
          )
          .filter(
            (score): score is number =>
              score !== null
          );

        const peerAverage =
          average(peerScores);

        const gap =
          currentScore !== null
            ? Math.max(
                0,
                benchmark.target_score -
                  currentScore
              )
            : benchmark.target_score;

        return {
          skill_id: benchmark.skill_id,
          skill_name: benchmark.skill_name,
          category: benchmark.category,
          current_score: round(currentScore),
          peer_average_score:
            round(peerAverage),
          target_score:
            benchmark.target_score,
          gap: round(gap),
          relevance_weight:
            benchmark.relevance_weight,
          peer_data_available:
            peerScores.length >=
            MIN_COHORT_SIZE,
        };
      });

    // =========================================================
    // 19. COMMON SKILL GAPS
    // =========================================================

    const commonSkillGaps =
      skillBenchmarksResponse
        .map((skill) => {
          const peerWeakCount =
            peers.filter((peer) => {
              const score =
                studentMetrics
                  .get(peer.id)
                  ?.skillScores.get(
                    skill.skill_id
                  );

              return (
                score !== undefined &&
                score < skill.target_score
              );
            }).length;

          return {
            skill_id: skill.skill_id,
            skill_name: skill.skill_name,
            category: skill.category,
            peer_average_score:
              skill.peer_average_score,
            target_score:
              skill.target_score,
            peers_below_target:
              peerWeakCount,
            cohort_gap_percentage:
              Math.round(
                (peerWeakCount /
                  peers.length) *
                  100
              ),
          };
        })
        .filter(
          (skill) =>
            skill.peers_below_target > 0
        )
        .sort(
          (a, b) =>
            b.cohort_gap_percentage -
            a.cohort_gap_percentage
        )
        .slice(0, 5);

    // =========================================================
    // 20. ACTIONABLE INSIGHTS
    // =========================================================

    const actionableInsights: string[] = [];

    if (
      currentMetrics.readiness !== null &&
      peerAverageReadiness !== null
    ) {
      if (
        currentMetrics.readiness <
        peerAverageReadiness
      ) {
        actionableInsights.push(
          "Your readiness is below the average for students targeting the same career goal. Focus on the largest skill gaps first."
        );
      } else {
        actionableInsights.push(
          "Your readiness is at or above the average for students targeting the same career goal. Continue strengthening your highest-impact skills."
        );
      }
    }

    const biggestGap =
      [...skillBenchmarksResponse]
        .filter(
          (skill) =>
            skill.gap !== null
        )
        .sort(
          (a, b) =>
            (b.gap ?? 0) -
            (a.gap ?? 0)
        )[0];

    const biggestGapValue =
      biggestGap?.gap ?? 0;

    if (
      biggestGap &&
      biggestGapValue > 0
    ) {
      actionableInsights.push(
        `Prioritize ${biggestGap.skill_name}, where your current score is below the target benchmark.`
      );
    }

    // =========================================================
    // 21. FRONTEND-FRIENDLY FINAL RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,

      data: {
        status: "ready",

        readiness: {
          current:
            round(currentMetrics.readiness) ?? 0,

          peerAverage:
            round(peerAverageReadiness) ?? 0,

          percentile:
            percentile ?? 0,
        },

        skills: skillBenchmarksResponse.map(
          (skill) => ({
            skill: skill.skill_name,

            current:
              skill.current_score ?? 0,

            peerAverage:
              skill.peer_average_score ?? 0,

            target:
              skill.target_score,
          })
        ),

        commonGaps: commonSkillGaps.map(
          (gap) => ({
            skill: gap.skill_name,

            percentage:
              gap.cohort_gap_percentage,
          })
        ),

        careerGoal:
          currentStudent.career_goal,

        cohort: {
          type: "same_career_goal",
          peerCount: peers.length,
          minimumPeerCount:
            MIN_COHORT_SIZE,
        },

        actionableInsights,
      },
    });
  } catch (error) {
    console.error(
      "Peer Insights Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Peer Insights failed",
      },
      { status: 500 }
    );
  }
}