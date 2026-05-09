export function normalizeResumeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateResumeText(text: string): { valid: boolean; error?: string } {
  const cleaned = normalizeResumeText(text);
  if (!cleaned || cleaned.length < 50) {
    return { valid: false, error: "Resume is too short. Please paste your full resume text." };
  }
  if (cleaned.length > 15000) {
    return { valid: false, error: "Resume is too long. Please limit to 15,000 characters." };
  }
  return { valid: true };
}

export function validateJobDescription(text: string): { valid: boolean; error?: string } {
  const cleaned = text.trim();
  if (!cleaned || cleaned.length < 30) {
    return { valid: false, error: "Job description is too short. Please paste the full description." };
  }
  if (cleaned.length > 10000) {
    return { valid: false, error: "Job description is too long. Please limit to 10,000 characters." };
  }
  return { valid: true };
}
