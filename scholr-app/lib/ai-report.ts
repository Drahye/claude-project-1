/**
 * Shared weekly-report generation. Server-only.
 * Computes a student's attendance + homework stats for the week and asks Groq
 * to write a parent-facing summary + a note to the child.
 *
 * Pass any Supabase client capable of reading the school's data (service-role
 * for cron, or the authenticated SSR client for on-demand teacher use).
 */
import type { SupabaseClient } from "@supabase/supabase-js"

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

export const REPORT_SYSTEM_PROMPT = `You write warm, concise weekly school reports for parents about their child.

For every request, produce exactly two things:
1. "summary": A warm, professional parent-facing summary (2–3 sentences) describing how the student did this week. Honest but encouraging. Plain language, no jargon. Do NOT start with "This week" or the student's name.
2. "encouragement": A short, personal note (1–2 sentences) addressed directly to the child. Start with something like "Keep up..." or "This week you showed...". Warm and specific.

Base everything strictly on the data provided. Never invent events, grades, or behaviour that isn't in the data.

Respond with ONLY valid JSON in this exact shape, no markdown fences, no extra text:
{"summary": "...", "encouragement": "..."}`

export function isGroqConfigured() {
  const key = process.env.GROQ_API_KEY
  return !!key && key.length > 10 && !key.includes("...")
}

export function weekEndFrom(weekStart: string) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 4)
  return d.toISOString().split("T")[0]
}

export interface ReportResult {
  summary:          string
  encouragement:    string
  attendanceDays:   number
  attendanceTotal:  number
  hwSubmitted:      number
  hwTotal:          number
}

/** Gather this week's stats for a student. */
export async function gatherStats(
  supabase: SupabaseClient,
  studentId: string,
  weekStart: string,
) {
  const weekEnd = weekEndFrom(weekStart)

  const { data: attendance } = await supabase
    .from("attendance").select("status, date")
    .eq("student_id", studentId).gte("date", weekStart).lte("date", weekEnd) as unknown as {
      data: Array<{ status: string; date: string }> | null
    }

  const attendanceDays  = (attendance ?? []).filter(a => a.status === "present" || a.status === "late").length
  const attendanceTotal = (attendance ?? []).length || 5

  const { data: enrollments } = await supabase
    .from("student_class_enrollments").select("class_id").eq("student_id", studentId) as unknown as {
      data: Array<{ class_id: string }> | null
    }
  const classIds = (enrollments ?? []).map(e => e.class_id)

  let hwSubmitted = 0, hwTotal = 0
  if (classIds.length > 0) {
    const { data: homework } = await supabase
      .from("homework").select("id").in("class_id", classIds)
      .gte("due_date", weekStart).lte("due_date", weekEnd) as unknown as { data: Array<{ id: string }> | null }
    hwTotal = (homework ?? []).length
    if (hwTotal > 0) {
      const hwIds = (homework ?? []).map(h => h.id)
      const { data: subs } = await supabase
        .from("homework_submissions").select("id").eq("student_id", studentId).in("homework_id", hwIds) as unknown as {
          data: Array<{ id: string }> | null
        }
      hwSubmitted = (subs ?? []).length
    }
  }

  return { attendance: attendance ?? [], attendanceDays, attendanceTotal, hwSubmitted, hwTotal }
}

/** Call Groq to write summary + encouragement. Throws on failure. */
export async function generateReport(
  // Accepts either client flavour (service-role for cron, SSR for on-demand).
  // supabase-js types the two differently, so callers pass `as any` here.
  supabase: SupabaseClient,
  opts: { studentId: string; studentName: string; weekStart: string; teacherNotes?: string },
): Promise<ReportResult> {
  const { attendance, attendanceDays, attendanceTotal, hwSubmitted, hwTotal } =
    await gatherStats(supabase, opts.studentId, opts.weekStart)

  const attendanceStr = attendance.length > 0
    ? attendance.map(a => `${a.date}: ${a.status}`).join(", ")
    : "No attendance records this week"
  const hwStr = hwTotal > 0
    ? `Submitted ${hwSubmitted} of ${hwTotal} homework assignments`
    : "No homework assigned this week"
  const notesStr = opts.teacherNotes?.trim()
    ? `Teacher's personal notes: "${opts.teacherNotes.trim()}"`
    : "No additional teacher notes."

  const userPrompt = `Student: ${opts.studentName}
Week of: ${opts.weekStart}

ATTENDANCE:
${attendanceStr}
Summary: present ${attendanceDays} of ${attendanceTotal} days.

HOMEWORK:
${hwStr}

${notesStr}`

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: REPORT_SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const text: string = data?.choices?.[0]?.message?.content ?? ""
  if (!text) throw new Error("Empty AI response")

  let parsed: { summary: string; encouragement: string }
  try { parsed = JSON.parse(text.trim()) }
  catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) throw new Error("Unexpected AI format")
    parsed = JSON.parse(m[0])
  }

  return {
    summary:         parsed.summary,
    encouragement:   parsed.encouragement,
    attendanceDays, attendanceTotal, hwSubmitted, hwTotal,
  }
}
