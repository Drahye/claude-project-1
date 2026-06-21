import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Homework } from "@/types/database"
import HomeworkPanel from "./HomeworkPanel"

export const metadata: Metadata = { title: "Homework" }

export default async function HomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch classes assigned to this teacher
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("teacher_id", user.id)
    .order("name") as unknown as {
      data: Array<{ id: string; name: string; grade_level: string }> | null
    }

  const classIds = (classes ?? []).map(c => c.id)

  // Fetch all homework for these classes
  let homeworkList: Homework[] = []
  if (classIds.length > 0) {
    const { data } = await supabase
      .from("homework")
      .select("*")
      .in("class_id", classIds)
      .order("due_date", { ascending: false })
      .limit(50)
    homeworkList = (data ?? []) as Homework[]
  }

  // Build class map for display
  const classMap: Record<string, string> = {}
  for (const c of classes ?? []) classMap[c.id] = c.name

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Homework
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {homeworkList.length} assignment{homeworkList.length !== 1 ? "s" : ""} assigned
        </p>
      </div>

      <HomeworkPanel
        classes={classes ?? []}
        homeworkList={homeworkList}
        classMap={classMap}
        teacherId={user.id}
      />
    </div>
  )
}
