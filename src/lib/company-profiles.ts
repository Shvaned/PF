export interface CompanyProfile {
  name: string;
  type: "faang" | "product" | "startup" | "service" | "backend";
  behavioralWeight: number;   // 0–100
  technicalWeight: number;    // 0–100
  questionPatterns: string[];
  evaluationCriteria: { dimension: string; weight: number; description: string }[];
  insights: string[];
}

export const COMPANY_PROFILES: CompanyProfile[] = [
  {
    name: "Google",
    type: "faang",
    behavioralWeight: 35,
    technicalWeight: 65,
    questionPatterns: [
      "System design and scalability questions",
      "Algorithm and data structure problems",
      "Behavioral: leadership and impact",
      "Problem-solving under ambiguity",
    ],
    evaluationCriteria: [
      { dimension: "technical", weight: 45, description: "Technical depth and system thinking" },
      { dimension: "problemSolving", weight: 25, description: "Approach to novel problems" },
      { dimension: "communication", weight: 15, description: "Clarity in explaining complex ideas" },
      { dimension: "behavioral", weight: 15, description: "Leadership and impact examples" },
    ],
    insights: [
      "Google values problem-solving ability over memorization",
      "Expect system design questions even for junior roles",
      "Emphasize 'Googleyness' — intellectual humility and collaboration",
      "Use the STAR method for behavioral questions",
    ],
  },
  {
    name: "Amazon",
    type: "faang",
    behavioralWeight: 50,
    technicalWeight: 50,
    questionPatterns: [
      "Leadership Principles: Ownership, Customer Obsession, Bias for Action",
      "System design with focus on scalability and cost",
      "Behavioral: concrete examples with measurable impact",
      "Technical: practical engineering and architecture",
    ],
    evaluationCriteria: [
      { dimension: "behavioral", weight: 40, description: "Leadership principle alignment" },
      { dimension: "technical", weight: 30, description: "Practical engineering decisions" },
      { dimension: "structure", weight: 15, description: "Organized, data-driven answers" },
      { dimension: "confidence", weight: 15, description: "Ownership and accountability" },
    ],
    insights: [
      "Amazon interviews are heavily behavioral — prepare 2-3 stories per leadership principle",
      "Every answer should include measurable results and data points",
      "Expect 'Bar Raiser' interviewers focused on raising the hiring bar",
      "Demonstrate ownership thinking: 'I owned this, here's what I did, here's the result'",
    ],
  },
  {
    name: "Meta",
    type: "faang",
    behavioralWeight: 30,
    technicalWeight: 70,
    questionPatterns: [
      "Fast-paced coding challenges",
      "System design: scalability and reliability",
      "Behavioral: move fast, impact, and growth mindset",
      "Product sense and user empathy questions",
    ],
    evaluationCriteria: [
      { dimension: "technical", weight: 50, description: "Coding speed and accuracy" },
      { dimension: "problemSolving", weight: 25, description: "Quick problem decomposition" },
      { dimension: "behavioral", weight: 15, description: "Impact and growth mindset" },
      { dimension: "clarity", weight: 10, description: "Clear communication under time pressure" },
    ],
    insights: [
      "Meta values speed and impact — practice timed coding exercises",
      "Expect product sense questions even for engineering roles",
      "Demonstrate growth mindset: 'I failed at X, learned Y, improved to Z'",
      "System design questions often focus on real Meta-scale problems",
    ],
  },
  {
    name: "Microsoft",
    type: "faang",
    behavioralWeight: 45,
    technicalWeight: 55,
    questionPatterns: [
      "Collaboration and teamwork scenarios",
      "Technical: practical system design and coding",
      "Behavioral: growth mindset and inclusion",
      "Role-specific domain knowledge",
    ],
    evaluationCriteria: [
      { dimension: "technical", weight: 35, description: "Domain expertise and problem-solving" },
      { dimension: "behavioral", weight: 35, description: "Collaboration and growth mindset" },
      { dimension: "communication", weight: 15, description: "Ability to work cross-team" },
      { dimension: "clarity", weight: 15, description: "Structured thinking" },
    ],
    insights: [
      "Microsoft emphasizes collaboration — prepare cross-team examples",
      "Growth mindset is critical: show how you learn and adapt",
      "Technical questions are practical, not theoretical puzzles",
      "Diversity and inclusion awareness matters",
    ],
  },
  {
    name: "Startup (Early-Stage)",
    type: "startup",
    behavioralWeight: 40,
    technicalWeight: 60,
    questionPatterns: [
      "Full-stack versatility and breadth",
      "Behavioral: ownership, speed, and ambiguity",
      "Practical architecture decisions",
      "Product and user empathy",
    ],
    evaluationCriteria: [
      { dimension: "technical", weight: 35, description: "Breadth of practical skills" },
      { dimension: "behavioral", weight: 30, description: "Ownership and initiative" },
      { dimension: "confidence", weight: 20, description: "Comfort with ambiguity and speed" },
      { dimension: "problemSolving", weight: 15, description: "Resourceful problem-solving" },
    ],
    insights: [
      "Startups value people who can wear multiple hats",
      "Emphasize speed of execution and ability to ship fast",
      "Show you can handle ambiguity without clear requirements",
      "Ownership examples are more important than scale",
    ],
  },
  {
    name: "Product Company",
    type: "product",
    behavioralWeight: 40,
    technicalWeight: 60,
    questionPatterns: [
      "Practical engineering with product awareness",
      "Behavioral: cross-functional collaboration",
      "System design: real-world trade-offs",
      "Customer-focused technical decisions",
    ],
    evaluationCriteria: [
      { dimension: "technical", weight: 35, description: "Practical engineering quality" },
      { dimension: "behavioral", weight: 25, description: "Product thinking and collaboration" },
      { dimension: "structure", weight: 20, description: "Trade-off analysis and reasoning" },
      { dimension: "relevance", weight: 20, description: "Customer-centric approach" },
    ],
    insights: [
      "Product companies want engineers who understand the 'why' behind features",
      "Show you can balance technical quality with business needs",
      "Prepare examples of working with PMs, designers, and stakeholders",
      "Demonstrate you care about the end-user experience",
    ],
  },
  {
    name: "Service Company (TCS/Infosys/Wipro/Accenture)",
    type: "service",
    behavioralWeight: 55,
    technicalWeight: 45,
    questionPatterns: [
      "Communication skills and client handling",
      "Fundamental technical concepts",
      "Behavioral: teamwork, adaptability, learning",
      "Process-oriented problem solving",
    ],
    evaluationCriteria: [
      { dimension: "communication", weight: 35, description: "Clear, professional communication" },
      { dimension: "behavioral", weight: 30, description: "Teamwork and adaptability" },
      { dimension: "technical", weight: 20, description: "Fundamentals and learning ability" },
      { dimension: "clarity", weight: 15, description: "Structured, polite responses" },
    ],
    insights: [
      "Service companies prioritize communication and professionalism",
      "Focus on fundamentals — deep expertise matters less than broad competence",
      "Prepare examples of working in teams and adapting to new technologies",
      "Client-facing scenarios are common — practice polite, structured responses",
    ],
  },
];

export function getProfile(companyName: string): CompanyProfile | null {
  const exact = COMPANY_PROFILES.find(
    (p) => p.name.toLowerCase() === companyName.toLowerCase()
  );
  if (exact) return exact;

  // Fuzzy: check if companyName contains or is contained by a profile
  const fuzzy = COMPANY_PROFILES.find(
    (p) =>
      companyName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(companyName.toLowerCase())
  );
  return fuzzy || null;
}

export function getProfileByType(type: string): CompanyProfile | undefined {
  return COMPANY_PROFILES.find((p) => p.type === type);
}

export function getAllCompanyNames(): string[] {
  return COMPANY_PROFILES.map((p) => p.name);
}

export function getAllCompanyTypes(): string[] {
  return [...new Set(COMPANY_PROFILES.map((p) => p.type))];
}

/** Build company-specific prompt extension for question generation */
export function buildCompanyPrompt(
  companyName: string | null
): { promptExtension: string; evaluationWeights: string } {
  if (!companyName) return { promptExtension: "", evaluationWeights: "" };

  const profile = getProfile(companyName);
  if (!profile) return { promptExtension: "", evaluationWeights: "" };

  const extension = `
Company context: ${profile.name} (${profile.type})
Interview style: ${profile.questionPatterns.join("; ")}
Key focus: ${profile.insights.slice(0, 2).join(" ")}
Make questions feel like a real ${profile.name} interview.`;

  const weights = JSON.stringify({
    behavioralWeight: profile.behavioralWeight,
    technicalWeight: profile.technicalWeight,
    criteria: profile.evaluationCriteria,
  });

  return { promptExtension: extension, evaluationWeights: weights };
}
