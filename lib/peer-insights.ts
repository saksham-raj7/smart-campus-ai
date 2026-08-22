/**
 * Client contract for the anonymized peer-insights API.
 *
 * This matches the current backend response from:
 * GET /api/peer-insights
 */

export type PeerReadiness = {
  current: number;
  peerAverage: number;
  percentile: number;
};

export type PeerSkillComparison = {
  skillId: string;
  skillName: string;
  currentScore: number;
  peerAverage: number;
  targetScore: number;
};

export type PeerCommonGap = {
  skillId: string;
  skillName: string;
  percentage: number;
};

export type PeerInsight = {
  type: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export type PeerInsightsResponse = {
  readiness: PeerReadiness;
  skillComparison: PeerSkillComparison[];
  commonGaps: PeerCommonGap[];
  insights: PeerInsight[];
};

export type PeerInsightsResult =
  | { status: "ready"; data: PeerInsightsResponse }
  | { status: "empty" }
  | { status: "error"; message: string };

function isScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeResponse(
  payload: unknown
): PeerInsightsResponse | null {
  if (!isObject(payload)) return null;

  const data = isObject(payload.data) ? payload.data : payload;

  if (
    !isObject(data.readiness) ||
    !isScore(data.readiness.current) ||
    !isScore(data.readiness.peerAverage) ||
    !isScore(data.readiness.percentile)
  ) {
    return null;
  }

  const skills = Array.isArray(data.skills) ? data.skills : [];

  const skillComparison: PeerSkillComparison[] = skills
    .filter(
      (skill): skill is Record<string, unknown> =>
        isObject(skill) &&
        typeof skill.skill === "string" &&
        isScore(skill.current) &&
        isScore(skill.peerAverage) &&
        isScore(skill.target)
    )
    .map((skill) => ({
      skillId: skill.skill as string,
      skillName: skill.skill as string,
      currentScore: skill.current as number,
      peerAverage: skill.peerAverage as number,
      targetScore: skill.target as number,
    }));

  const rawGaps = Array.isArray(data.commonGaps)
    ? data.commonGaps
    : [];

  const commonGaps: PeerCommonGap[] = rawGaps
    .filter(
      (gap): gap is Record<string, unknown> =>
        isObject(gap) &&
        typeof gap.skill === "string" &&
        isScore(gap.percentage)
    )
    .map((gap) => ({
      skillId: gap.skill as string,
      skillName: gap.skill as string,
      percentage: gap.percentage as number,
    }));

  const rawInsights = Array.isArray(data.actionableInsights)
    ? data.actionableInsights
    : [];

  const insights: PeerInsight[] = rawInsights
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .map((description, index) => ({
      type: "actionable",
      title:
        index === 0
          ? "Readiness insight"
          : "Recommended action",
      description,
    }));

  return {
    readiness: {
      current: data.readiness.current as number,
      peerAverage: data.readiness.peerAverage as number,
      percentile: data.readiness.percentile as number,
    },
    skillComparison,
    commonGaps,
    insights,
  };
}

export async function getPeerInsights(
  signal?: AbortSignal
): Promise<PeerInsightsResult> {
  try {
    const response = await fetch("/api/peer-insights", {
      signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 204 || response.status === 404) {
      return {
        status: "empty",
      };
    }

    const payload: unknown = await response.json();

    if (!response.ok) {
      const message =
        isObject(payload) &&
        typeof payload.error === "string"
          ? payload.error
          : "Unable to load peer insights.";

      return {
        status: "error",
        message,
      };
    }

    /*
     * The backend returns insufficient_data when
     * there are not enough eligible peers.
     */
    if (
      isObject(payload) &&
      isObject(payload.data) &&
      payload.data.status === "insufficient_data"
    ) {
      return {
        status: "empty",
      };
    }

    const normalized = normalizeResponse(payload);

    if (
      !normalized ||
      normalized.skillComparison.length === 0
    ) {
      return {
        status: "empty",
      };
    }

    return {
      status: "ready",
      data: normalized,
    };
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    return {
      status: "error",
      message: "Unable to load peer insights.",
    };
  }
}