/** Shared API model for links recommended from a student's verified skill gaps. */
export type LearningResourceType = "youtube" | "article" | "documentation" | "practice" | "course";
export type LearningResource = {
  id: string;
  title: string;
  type: LearningResourceType;
  url: string;
  description?: string;
  provider?: string;
  skillId?: string;
  skillName?: string;
  thumbnailUrl?: string;
  duration?: string;
};
