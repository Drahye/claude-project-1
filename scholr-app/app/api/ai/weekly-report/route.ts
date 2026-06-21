import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { limitOr429 } from "@/lib/rate-limit"
import { generateReport, isGroqConfigured } from "@/lib/ai-report"

/** On-demand generation for a single student (teacher clicks "Generate"). */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only staff may trigger generation — this is an expensive AI call. A parent
  // (or any other signed-in user) hitting it directly would burn AI quota.
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single() as unknown as
    { data: { role: string } | null }
  if (!profile || !["teacher", "admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Cap generation rate per IP as a second layer against runaway cost.
  const limited = limitOr429(req, "ai-report", 15, 60_000); if (limited) return limited

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Add a valid GROQ_API_KEY to your environment to enable report generation." },
      { status: 503 },
    )
  }

  const { studentId, studentName, weekStart, teacherNotes } = await req.json()
  if (!studentId || !studentName || !weekStart) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const r = await generateReport(supabase as any, { studentId, studentName, weekStart, teacherNotes })
    return NextResponse.json({
      summary:            r.summary,
      encouragement:      r.encouragement,
      attendance_days:    r.attendanceDays,
      attendance_total:   r.attendanceTotal,
      homework_submitted: r.hwSubmitted,
      homework_total:     r.hwTotal,
    })
  } catch (err: unknown) {
    console.error("[AI weekly-report]", err)
    const msg = err instanceof Error ? err.message : "Failed to generate report"
    if (msg.includes("401") || msg.includes("403")) {
      return NextResponse.json({ error: "AI authentication failed. Check your GROQ_API_KEY." }, { status: 503 })
    }
    if (msg.includes("429")) {
      return NextResponse.json({ error: "AI is busy right now. Please try again in a moment." }, { status: 429 })
    }
    return NextResponse.json({ error: "Failed to generate report." }, { status: 500 })
  }
}
