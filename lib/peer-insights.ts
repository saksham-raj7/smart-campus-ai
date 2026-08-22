/**
 * Client contract for the anonymized peer-insights API.
 *
 * Expected GET /api/peer-insights response:
 * { readiness: { current, peerAverage, percentile }, skillComparison: [], commonGaps: [], insights: [] }
 * The API must enforce aggregation, anonymization, authorization, and minimum
 * cohort thresholds. This client intentionally has no fallback statistics.
 */
export type PeerReadiness = { current: number; peerAverage: number; percentile: number };
export type PeerSkillComparison = { skillId: string; skillName: string; currentScore: number; peerAverage: number; targetScore: number };
export type PeerCommonGap = { skillId: string; skillName: string; percentage: number };
export type PeerInsight = { type: string; title: string; description: string; actionLabel?: string; actionHref?: string };
export type PeerInsightsResponse = { readiness: PeerReadiness; skillComparison: PeerSkillComparison[]; commonGaps: PeerCommonGap[]; insights: PeerInsight[] };
export type PeerInsightsResult = { status: "ready"; data: PeerInsightsResponse } | { status: "empty" } | { status: "error"; message: string };

function isScore(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100; }
function isPeerInsightsResponse(value: unknown): value is PeerInsightsResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<PeerInsightsResponse>;
  return Boolean(response.readiness && isScore(response.readiness.current) && isScore(response.readiness.peerAverage) && isScore(response.readiness.percentile) && Array.isArray(response.skillComparison) && Array.isArray(response.commonGaps) && Array.isArray(response.insights));
}

export async function getPeerInsights(signal?: AbortSignal): Promise<PeerInsightsResult> {
  try {
    const response = await fetch("/api/peer-insights", { signal, headers: { Accept: "application/json" } });
    // 404 is expected until the backend route is deployed; no benchmark is inferred.
    if (response.status === 204 || response.status === 404) return { status: "empty" };
    if (!response.ok) return { status: "error", message: "Unable to load peer insights." };
    const payload: unknown = await response.json();
    if (!isPeerInsightsResponse(payload) || payload.skillComparison.length === 0) return { status: "empty" };
    return { status: "ready", data: payload };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { status: "error", message: "Unable to load peer insights." };
  }
}
