export type TaskType = "resume-analysis" | "interview-questions" | "weak-feedback" | "job-extraction" | "mock-questions";

export const MODEL_CHAINS: Record<TaskType, string[]> = {
  "resume-analysis": [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "z-ai/glm-4.5-air:free",
    "openai/gpt-oss-120b:free",
  ],
  "interview-questions": [
    "poolside/laguna-xs.2:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
  ],
  "weak-feedback": [
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "poolside/laguna-xs.2:free",
  ],
  "job-extraction": [
    "poolside/laguna-xs.2:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
  ],
  "mock-questions": [
    "poolside/laguna-xs.2:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
  ],
};
