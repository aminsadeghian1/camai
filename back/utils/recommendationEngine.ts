export type RecommendationActivity =
  | "lesson"
  | "lab"
  | "practice"
  | "challenge"
  | "review";

export type RecommendationCandidate = {
  reasonCode: string;
  activityType: RecommendationActivity;
  activityId?: string;
  explanation: string;
  priority: number;
};

export type RecommendationInput = {
  inProgressLesson?: { lessonId: string; title: string; currentBlock: number };
  weakSkill?: { key: string; title: string; state: string };
  labToRepeat?: { labId: string; title: string; score: number };
  nextLesson?: { lessonId: string; title: string };
  pendingPractice?: { assignmentId: string; title: string };
  reviewLesson?: { lessonId: string; title: string };
};

export const chooseRecommendation = (
  input: RecommendationInput,
): RecommendationCandidate => {
  if (input.inProgressLesson) {
    return {
      reasonCode: "RESUME_LESSON",
      activityType: "lesson",
      activityId: input.inProgressLesson.lessonId,
      explanation: `Continue ${input.inProgressLesson.title} at block ${
        input.inProgressLesson.currentBlock + 1
      }.`,
      priority: 100,
    };
  }

  if (input.pendingPractice) {
    return {
      reasonCode: "PENDING_PRACTICE",
      activityType: "practice",
      activityId: input.pendingPractice.assignmentId,
      explanation:
        `Your practice "${input.pendingPractice.title}" is ready to shoot.`,
      priority: 90,
    };
  }

  if (input.weakSkill) {
    return {
      reasonCode: "WEAK_SKILL",
      activityType: "practice",
      explanation:
        `Practice ${input.weakSkill.title}; current mastery is ${input.weakSkill.state}.`,
      priority: 80,
    };
  }

  if (input.labToRepeat) {
    return {
      reasonCode: "LOW_LAB_SCORE",
      activityType: "lab",
      activityId: input.labToRepeat.labId,
      explanation:
        `Repeat ${input.labToRepeat.title} to improve your last score of ${input.labToRepeat.score}.`,
      priority: 70,
    };
  }

  if (input.nextLesson) {
    return {
      reasonCode: "NEXT_LESSON",
      activityType: "lesson",
      activityId: input.nextLesson.lessonId,
      explanation:
        `Start ${input.nextLesson.title}, the next lesson in your path.`,
      priority: 60,
    };
  }

  if (input.reviewLesson) {
    return {
      reasonCode: "REVIEW_FUNDAMENTALS",
      activityType: "review",
      activityId: input.reviewLesson.lessonId,
      explanation:
        `Review ${input.reviewLesson.title} to reinforce the fundamentals.`,
      priority: 50,
    };
  }

  return {
    reasonCode: "EXPLORE_LEARNING_PATH",
    activityType: "lesson",
    explanation:
      "Explore the learning path and choose a lesson that matches your current goal.",
    priority: 10,
  };
};
