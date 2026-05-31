import { getCurrentUser } from "@/lib/auth-helpers";
import { getOrGenerateReport, getReportHistory } from "@/lib/weekly-report";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to continue" }, { status: 401 });

  try {
    const report = await getOrGenerateReport(user.id);
    const history = await getReportHistory(user.id);

    return Response.json({
      report: {
        ...report,
        wins: report.wins ? JSON.parse(report.wins) : [],
        focusAreas: report.focusAreas ? JSON.parse(report.focusAreas) : [],
        recommendations: report.recommendations ? JSON.parse(report.recommendations) : [],
        premiumInsights: report.premiumInsights ? JSON.parse(report.premiumInsights) : null,
      },
      history: history.map((r) => ({
        ...r,
        wins: r.wins ? JSON.parse(r.wins) : [],
        focusAreas: r.focusAreas ? JSON.parse(r.focusAreas) : [],
        recommendations: r.recommendations ? JSON.parse(r.recommendations) : [],
      })),
    });
  } catch (error: any) {
    console.error("[WEEKLY] error", error?.message);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
