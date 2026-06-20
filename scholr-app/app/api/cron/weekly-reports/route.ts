import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { generateReport, isGroqConfigured, weekEndFrom } from "@/lib/ai-report"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // allow longer runs for batch generation

/** Monday of the current week (YYYY-MM-DD). */
function currentWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split("T")[0]
}

/**
 * Scheduled job — generate DRAFT weekly reports for every active, enrolled
 * student for the current week. Drafts have sent_at = NULL and stay hidden
 * from parents until a teacher approves them.
 *
 * Protect with CRON_SECRET. Call as:
 *   GET/POST /api/cron/weekly-reports   with header  Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron sends this header automatically when CRON_SECRET is set. The secret
 * is only ever read from the header (never a query string), so it can't leak into
 * access/server logs.
 */
async function run(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }
  const auth = req.headers.get("authorization") ?? ""
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isGroqConfigured()) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 })
  }

  const s = await createServiceClient()
  const weekStart = currentWeekStart()
  const weekEnd   = weekEndFrom(weekStart)

  // Active students that are enrolled in at least one class
  const { data: enr } = await s.from("student_class_enrollments").select("student_id")
  const enrolledIds = [...new Set((enr ?? []).map((e: any) => e.student_id))] as string[]
  if (enrolledIds.length === 0) return NextResponse.json({ ok: true, generated: 0, skipped: 0, failed: 0 })

  const { data: students } = await s
    .from("students").select("id, full_name, school_id").in("id", enrolledIds).eq("is_active", true)

  // Skip students who already have a report for this week (draft OR sent)
  const { data: existing } = await s
    .from("weekly_reports").select("student_id").eq("week_start", weekStart).in("student_id", enrolledIds)
  const have = new Set((existing ?? []).map((e: any) => e.student_id))

  let generated = 0, skipped = 0, failed = 0

  for (const st of students ?? []) {
    if (have.has(st.id)) { skipped++; continue }
    try {
      const r = await generateReport(s as any, {
        studentId: st.id, studentName: st.full_name, weekStart,
      })
      const { error } = await s.from("weekly_reports").insert({
        school_id:          st.school_id,
        student_id:         st.id,
        week_start:         weekStart,
        week_end:           weekEnd,
        attendance_days:    r.attendanceDays,
        attendance_total:   r.attendanceTotal,
        homework_submitted: r.hwSubmitted,
        homework_total:     r.hwTotal,
        ai_summary:         r.summary,
        ai_encouragement:   r.encouragement,
        teacher_notes:      [],
        sent_at:            null, // draft — awaits teacher approval
      })
      if (error) { failed++; console.error("[cron weekly-reports] insert", st.id, error.message) }
      else generated++
    } catch (e) {
      failed++
      console.error("[cron weekly-reports] generate", st.id, e)
    }
  }

  return NextResponse.json({ ok: true, weekStart, generated, skipped, failed })
}

export async function GET(req: NextRequest)  { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
