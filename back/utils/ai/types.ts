export type AiReviewInput = {
  assignment: Record<string, unknown>;
  lessonObjective?: string;
  learnerLevel?: string;
  skillState?: unknown;
  exif?: Record<string, unknown>;
  technicalAnalysis?: Record<string, unknown>;
  imageReference?: string;
  labEvidence?: unknown;
};

export type AiReviewOutput = {
  summary: string;
  strengths: string[];
  issues: string[];
  evidence: string[];
  actions: string[];
  nextExercise: Record<string, unknown>;
  confidence: number;
  modelVersion: string;
  promptVersion: string;
};

export type AiProviderResult = {
  provider: string;
  model: string;
  output: unknown;
};

export type AiProvider = {
  name: string;
  model: string;
  generate(input: AiReviewInput, prompt: string): Promise<AiProviderResult>;
};
