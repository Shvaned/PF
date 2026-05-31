import { getCurrentUser } from "@/lib/auth-helpers";
import { compareResumes } from "@/lib/resume-lab";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const { resumeIdA, resumeIdB } = await request.json();
    const comparison = await compareResumes(resumeIdA, resumeIdB, user.id);
    if (!comparison) return Response.json({ error: "Resumes not found" }, { status: 404 });
    return Response.json(comparison);
  } catch (error: any) {
    return Response.json({ error: "Comparison failed" }, { status: 500 });
  }
}
