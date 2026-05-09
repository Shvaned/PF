const dailyQuestions = [
  // Behavioral
  "Tell me about a time you had to learn a new skill quickly. How did you approach it?",
  "Describe a situation where you disagreed with a team member. How did you resolve it?",
  "Give an example of a goal you set and how you achieved it.",
  "Tell me about a time you received constructive criticism. How did you respond?",
  "Describe a project where you had to manage multiple priorities.",
  "Tell me about a time you went above and beyond what was expected.",
  "How do you handle working under pressure or tight deadlines?",
  "Describe a time you had to adapt to a significant change.",
  // Technical
  "Explain a technical concept to a non-technical person. How would you do it?",
  "What's the most challenging technical problem you've solved?",
  "How do you stay current with new technologies and industry trends?",
  "Describe your approach to debugging a complex issue.",
  "How do you ensure the quality of your work or code?",
  "What tools or frameworks have you recently learned and why?",
  // HR / General
  "Why did you choose this career path?",
  "Where do you see yourself in 3 years?",
  "What do you look for in a company culture?",
  "How do you define success in your role?",
  "What motivates you to do your best work?",
  "Tell me about yourself and your background.",
  "What are your greatest professional strengths?",
  "What areas are you currently working to improve?",
  // Role-specific
  "How do you measure the impact of your work?",
  "Describe how you collaborate with cross-functional teams.",
  "How do you handle ambiguity or unclear requirements?",
  "What's your approach to making decisions with incomplete information?",
  "How do you balance speed and quality in your work?",
  "Tell me about a time you took initiative on a project.",
  "How do you handle feedback that you disagree with?",
  "Describe your ideal work environment.",
];

function getDailyIndex(): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % dailyQuestions.length;
}

interface DailyQuestionProps {
  roleCategory?: string | null;
}

export default function DailyQuestion({ roleCategory }: DailyQuestionProps) {
  const idx = getDailyIndex();
  const question = dailyQuestions[idx];

  return (
    <div className="bg-gradient-to-r from-[#EFF6FF] to-[#F5F3FF] rounded-[14px] p-4 border border-[#2563EB]/10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB]">
          QUESTION OF THE DAY
        </span>
        {roleCategory && (
          <span className="text-[10px] text-[#9CA3AF] capitalize">· {roleCategory}</span>
        )}
      </div>
      <p className="text-sm text-[#111827] font-medium leading-relaxed">{question}</p>
      <p className="text-xs text-[#9CA3AF] mt-2">
        Practice answering this aloud. Focus on structure and specific examples.
      </p>
    </div>
  );
}
