import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

/*
 * Convert career-goal relevance into a deterministic
 * target benchmark.
 *
 * Same formula used by /api/skill-gap.
 */
function getTargetScore(relevanceWeight: number): number {
  if (relevanceWeight >= 1) return 90;
  if (relevanceWeight >= 0.9) return 88;
  if (relevanceWeight >= 0.8) return 85;
  if (relevanceWeight >= 0.7) return 82;
  return 80;
}

function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;

  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) /
        scores.length) *
        100
    ) / 100
  );
}

export async function GET() {
  try {
    // Only Placement Officers and Admins can access this endpoint.
    const auth = await requireRole([
      "placement_officer",
      "admin",
    ]);

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: auth.status }
      );
    }

    const supabase = await createSupabaseServerClient();

    // =========================================================
    // 1. STUDENTS
    // =========================================================

    const { data: students, error: studentsError } =
      await supabase
        .from("student_profiles")
        .select(
          "id, user_id, name, college, degree, branch, year, career_goal"
        )
        .order("created_at", { ascending: false });

    if (studentsError) {
      return NextResponse.json(
        {
          success: false,
          error: studentsError.message,
        },
        { status: 500 }
      );
    }

    const studentList = students ?? [];

    // =========================================================
    // EMPTY STATE
    // =========================================================

    if (studentList.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            total_students: 0,
            average_readiness: null,
            ready_students: 0,
            developing_students: 0,
            students_needing_work: 0,
            students_not_started: 0,
          },

          assessment_statistics: {
            students_with_skill_assessment: 0,
            students_with_communication_assessment: 0,
            students_with_practice_attempts: 0,
            students_with_interview: 0,
          },

          skill_analytics: [],

          skill_benchmarks: [],

          assessment_studio: {
            skill_assessments: {
              total_attempts: 0,
              average_score: null,
              students_assessed: 0,
            },
            communication: {
              total_attempts: 0,
              average_score: null,
              students_assessed: 0,
            },
            practice: {
              total_attempts: 0,
              average_score: null,
              students_assessed: 0,
            },
            interviews: {
              total_attempts: 0,
              average_score: null,
              students_assessed: 0,
            },
          },

          students: [],
        },
      });
    }

    const studentIds = studentList.map(
      (student) => student.id
    );

    // =========================================================
    // 2. SKILL ASSESSMENTS
    // =========================================================

    const {
      data: skillAssessments,
      error: skillError,
    } = await supabase
      .from("skill_assessments")
      .select(
        "student_id, skill_id, score, assessed_at"
      )
      .in("student_id", studentIds)
      .order("assessed_at", {
        ascending: false,
      });

    if (skillError) {
      return NextResponse.json(
        {
          success: false,
          error: skillError.message,
        },
        { status: 500 }
      );
    }

    // Latest assessment for each student + skill.
    const latestSkillAssessments = new Map<
      string,
      {
        student_id: string;
        skill_id: string;
        score: number;
      }
    >();

    for (const assessment of skillAssessments ?? []) {
      const key = `${assessment.student_id}:${assessment.skill_id}`;

      if (!latestSkillAssessments.has(key)) {
        latestSkillAssessments.set(key, {
          student_id: assessment.student_id,
          skill_id: assessment.skill_id,
          score: clampScore(
            Number(assessment.score)
          ),
        });
      }
    }

    // Average skill score for each student.
    const skillScoresByStudent = new Map<
      string,
      number[]
    >();

    for (const assessment of latestSkillAssessments.values()) {
      const scores =
        skillScoresByStudent.get(
          assessment.student_id
        ) ?? [];

      scores.push(assessment.score);

      skillScoresByStudent.set(
        assessment.student_id,
        scores
      );
    }

    const averageSkillByStudent = new Map<
      string,
      number
    >();

    for (const [studentId, scores] of skillScoresByStudent) {
      const average =
        scores.reduce(
          (sum, score) => sum + score,
          0
        ) / scores.length;

      averageSkillByStudent.set(
        studentId,
        average
      );
    }

    // =========================================================
    // 3. COMMUNICATION ASSESSMENTS
    // =========================================================

    const {
      data: communicationAssessments,
      error: communicationError,
    } = await supabase
      .from("communication_assessments")
      .select(
        "student_id, score, assessed_at"
      )
      .in("student_id", studentIds)
      .not("score", "is", null)
      .order("assessed_at", {
        ascending: false,
      });

    if (communicationError) {
      return NextResponse.json(
        {
          success: false,
          error: communicationError.message,
        },
        { status: 500 }
      );
    }

    const latestCommunication = new Map<
      string,
      number
    >();

    for (const assessment of communicationAssessments ?? []) {
      if (
        !latestCommunication.has(
          assessment.student_id
        )
      ) {
        latestCommunication.set(
          assessment.student_id,
          clampScore(
            Number(assessment.score)
          )
        );
      }
    }

    // =========================================================
    // 4. PRACTICE ATTEMPTS
    // =========================================================

    const {
      data: practiceAttempts,
      error: practiceError,
    } = await supabase
      .from("practice_attempts")
      .select("student_id, score")
      .in("student_id", studentIds)
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

    const practiceScoresByStudent = new Map<
      string,
      number[]
    >();

    for (const attempt of practiceAttempts ?? []) {
      const scores =
        practiceScoresByStudent.get(
          attempt.student_id
        ) ?? [];

      scores.push(
        clampScore(Number(attempt.score))
      );

      practiceScoresByStudent.set(
        attempt.student_id,
        scores
      );
    }

    const averagePracticeByStudent = new Map<
      string,
      number
    >();

    for (const [studentId, scores] of practiceScoresByStudent) {
      const average =
        scores.reduce(
          (sum, score) => sum + score,
          0
        ) / scores.length;

      averagePracticeByStudent.set(
        studentId,
        average
      );
    }

    // =========================================================
    // 5. INTERVIEW SCORES
    // =========================================================

    const {
      data: interviewSessions,
      error: interviewError,
    } = await supabase
      .from("interview_sessions")
      .select(
        "student_id, overall_score, completed_at"
      )
      .in("student_id", studentIds)
      .not("overall_score", "is", null)
      .order("completed_at", {
        ascending: false,
      });

    if (interviewError) {
      return NextResponse.json(
        {
          success: false,
          error: interviewError.message,
        },
        { status: 500 }
      );
    }

    const latestInterview = new Map<
      string,
      number
    >();

    for (const interview of interviewSessions ?? []) {
      if (
        !latestInterview.has(
          interview.student_id
        )
      ) {
        latestInterview.set(
          interview.student_id,
          clampScore(
            Number(interview.overall_score)
          )
        );
      }
    }

    // =========================================================
    // 6. STUDENT READINESS
    // =========================================================

    /*
     * Readiness formula:
     *
     * Skill          = 50%
     * Communication  = 20%
     * Practice       = 15%
     * Interview      = 15%
     *
     * Missing components have their weights excluded.
     */

    const studentAnalytics = studentList.map(
      (student) => {
        const components = [
          {
            name: "skill",
            score:
              averageSkillByStudent.get(
                student.id
              ) ?? null,
            weight: 0.5,
          },
          {
            name: "communication",
            score:
              latestCommunication.get(
                student.id
              ) ?? null,
            weight: 0.2,
          },
          {
            name: "practice",
            score:
              averagePracticeByStudent.get(
                student.id
              ) ?? null,
            weight: 0.15,
          },
          {
            name: "interview",
            score:
              latestInterview.get(
                student.id
              ) ?? null,
            weight: 0.15,
          },
        ];

        const availableComponents =
          components.filter(
            (component) =>
              component.score !== null
          );

        const availableWeight =
          availableComponents.reduce(
            (sum, component) =>
              sum + component.weight,
            0
          );

        const readiness =
          availableWeight > 0
            ? availableComponents.reduce(
                (sum, component) =>
                  sum +
                  (component.score ?? 0) *
                    component.weight,
                0
              ) / availableWeight
            : null;

        let readinessLevel:
          | "not_started"
          | "needs_work"
          | "developing"
          | "ready";

        if (readiness === null) {
          readinessLevel = "not_started";
        } else if (readiness < 50) {
          readinessLevel = "needs_work";
        } else if (readiness < 75) {
          readinessLevel = "developing";
        } else {
          readinessLevel = "ready";
        }

        return {
          student_id: student.id,
          name: student.name,
          college: student.college,
          degree: student.degree,
          branch: student.branch,
          year: student.year,
          career_goal: student.career_goal,

          readiness_score:
            readiness !== null
              ? Math.round(
                  readiness * 100
                ) / 100
              : null,

          readiness_level:
            readinessLevel,

          skill_score:
            averageSkillByStudent.has(
              student.id
            )
              ? Math.round(
                  (averageSkillByStudent.get(
                    student.id
                  ) ?? 0) * 100
                ) / 100
              : null,

          communication_score:
            latestCommunication.get(
              student.id
            ) ?? null,

          practice_score:
            averagePracticeByStudent.get(
              student.id
            ) ?? null,

          interview_score:
            latestInterview.get(
              student.id
            ) ?? null,
        };
      }
    );

    // =========================================================
    // 7. COHORT ANALYTICS
    // =========================================================

    const readinessScores =
      studentAnalytics
        .map(
          (student) =>
            student.readiness_score
        )
        .filter(
          (score): score is number =>
            score !== null
        );

    const averageReadiness =
      readinessScores.length > 0
        ? readinessScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
          readinessScores.length
        : null;

    const readyStudents =
      studentAnalytics.filter(
        (student) =>
          student.readiness_level ===
          "ready"
      ).length;

    const developingStudents =
      studentAnalytics.filter(
        (student) =>
          student.readiness_level ===
          "developing"
      ).length;

    const studentsNeedingWork =
      studentAnalytics.filter(
        (student) =>
          student.readiness_level ===
          "needs_work"
      ).length;

    const studentsNotStarted =
      studentAnalytics.filter(
        (student) =>
          student.readiness_level ===
          "not_started"
      ).length;

    // =========================================================
    // 8. SKILL ANALYTICS
    // =========================================================

    const {
      data: skills,
      error: skillsError,
    } = await supabase
      .from("skills")
      .select(
        "id, name, category"
      );

    if (skillsError) {
      return NextResponse.json(
        {
          success: false,
          error: skillsError.message,
        },
        { status: 500 }
      );
    }

    const skillMap = new Map(
      (skills ?? []).map(
        (skill) => [
          skill.id,
          skill,
        ]
      )
    );

    const skillAnalyticsMap = new Map<
      string,
      {
        skill_id: string;
        skill_name: string;
        category: string;
        scores: number[];
      }
    >();

    for (const assessment of latestSkillAssessments.values()) {
      const skill = skillMap.get(
        assessment.skill_id
      );

      if (!skill) continue;

      const existing =
        skillAnalyticsMap.get(
          assessment.skill_id
        );

      if (existing) {
        existing.scores.push(
          assessment.score
        );
      } else {
        skillAnalyticsMap.set(
          assessment.skill_id,
          {
            skill_id:
              assessment.skill_id,
            skill_name:
              skill.name,
            category:
              skill.category,
            scores: [
              assessment.score,
            ],
          }
        );
      }
    }

    const skillAnalytics =
      Array.from(
        skillAnalyticsMap.values()
      )
        .map((skill) => {
          const average =
            skill.scores.reduce(
              (sum, score) =>
                sum + score,
              0
            ) /
            skill.scores.length;

          return {
            skill_id:
              skill.skill_id,

            skill_name:
              skill.skill_name,

            category:
              skill.category,

            average_score:
              Math.round(
                average * 100
              ) / 100,

            students_assessed:
              skill.scores.length,
          };
        })
        .sort(
          (a, b) =>
            a.average_score -
            b.average_score
        );

    // =========================================================
    // 9. SKILL BENCHMARKS
    // =========================================================

    const {
      data: careerGoalSkills,
      error:
        careerGoalSkillsError,
    } = await supabase
      .from("career_goal_skills")
      .select(
        "career_goal_id, skill_id, relevance_weight, career_goals(id, name), skills(id, name, category)"
      );

    if (careerGoalSkillsError) {
      return NextResponse.json(
        {
          success: false,
          error:
            careerGoalSkillsError.message,
        },
        { status: 500 }
      );
    }

    const skillBenchmarks =
      (
        careerGoalSkills ?? []
      ).map((item) => {
        const careerGoal =
          Array.isArray(
            item.career_goals
          )
            ? item.career_goals[0]
            : item.career_goals;

        const skill =
          Array.isArray(
            item.skills
          )
            ? item.skills[0]
            : item.skills;

        const relevanceWeight =
          Number(
            item.relevance_weight
          );

        return {
          career_goal_id:
            item.career_goal_id,

          career_goal:
            careerGoal?.name ??
            "Unknown career goal",

          skill_id:
            item.skill_id,

          skill_name:
            skill?.name ??
            "Unknown skill",

          category:
            skill?.category ??
            null,

          relevance_weight:
            relevanceWeight,

          target_score:
            getTargetScore(
              relevanceWeight
            ),
        };
      });

    // =========================================================
    // 10. AI ASSESSMENT STUDIO
    // =========================================================

    const skillAssessmentScores =
      (skillAssessments ?? [])
        .map((assessment) =>
          Number(
            assessment.score
          )
        )
        .filter((score) =>
          Number.isFinite(score)
        );

    const communicationAssessmentScores =
      (
        communicationAssessments ??
        []
      )
        .map((assessment) =>
          Number(
            assessment.score
          )
        )
        .filter((score) =>
          Number.isFinite(score)
        );

    const practiceAssessmentScores =
      (practiceAttempts ?? [])
        .map((attempt) =>
          Number(attempt.score)
        )
        .filter((score) =>
          Number.isFinite(score)
        );

    const interviewAssessmentScores =
      (interviewSessions ?? [])
        .map((interview) =>
          Number(
            interview.overall_score
          )
        )
        .filter((score) =>
          Number.isFinite(score)
        );

    const assessmentStudio = {
      skill_assessments: {
        total_attempts:
          skillAssessments?.length ??
          0,

        average_score:
          averageScore(
            skillAssessmentScores
          ),

        students_assessed:
          skillScoresByStudent.size,
      },

      communication: {
        total_attempts:
          communicationAssessments?.length ??
          0,

        average_score:
          averageScore(
            communicationAssessmentScores
          ),

        students_assessed:
          latestCommunication.size,
      },

      practice: {
        total_attempts:
          practiceAttempts?.length ??
          0,

        average_score:
          averageScore(
            practiceAssessmentScores
          ),

        students_assessed:
          practiceScoresByStudent.size,
      },

      interviews: {
        total_attempts:
          interviewSessions?.length ??
          0,

        average_score:
          averageScore(
            interviewAssessmentScores
          ),

        students_assessed:
          latestInterview.size,
      },
    };

    // =========================================================
    // 11. FINAL RESPONSE
    // =========================================================

    return NextResponse.json({
      success: true,

      data: {
        // Cohort Analytics
        overview: {
          total_students:
            studentList.length,

          average_readiness:
            averageReadiness !== null
              ? Math.round(
                  averageReadiness * 100
                ) / 100
              : null,

          ready_students:
            readyStudents,

          developing_students:
            developingStudents,

          students_needing_work:
            studentsNeedingWork,

          students_not_started:
            studentsNotStarted,
        },

        // Assessment participation
        assessment_statistics: {
          students_with_skill_assessment:
            skillScoresByStudent.size,

          students_with_communication_assessment:
            latestCommunication.size,

          students_with_practice_attempts:
            practiceScoresByStudent.size,

          students_with_interview:
            latestInterview.size,
        },

        // Skill analytics
        skill_analytics:
          skillAnalytics,

        // Career-goal skill benchmarks
        skill_benchmarks:
          skillBenchmarks,

        // AI Assessment Studio
        assessment_studio:
          assessmentStudio,

        // Student Insights
        students:
          studentAnalytics,
      },
    });
  } catch (error) {
    console.error(
      "Admin Analytics Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Admin analytics failed",
      },
      { status: 500 }
    );
  }
}