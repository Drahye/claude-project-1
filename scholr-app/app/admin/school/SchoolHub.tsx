"use client"
import { useState } from "react"
import { Globe, Images } from "lucide-react"
import type { School } from "@/types/database"
import SchoolBuilderForm from "./SchoolBuilderForm"
import GalleryClient from "@/app/admin/gallery/GalleryClient"
import type { PageInsights } from "./page"

type Tab = "page" | "gallery"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "page",    label: "Public page", icon: Globe },
  { id: "gallery", label: "Gallery", icon: Images },
]

export default function SchoolHub({
  school, initialTab = "page", insights,
}: {
  school: School
  initialTab?: Tab
  insights?: PageInsights
}) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 w-full sm:w-max overflow-x-auto" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }} role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? "var(--c-bg)" : "transparent",
                color: active ? "var(--c-indigo)" : "var(--c-text-muted)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}
            >
              <Icon size={15} /> {label}
            </button>
          )
        })}
      </div>

      {/* Panels */}
      <div hidden={tab !== "page"}>
        <SchoolBuilderForm school={school} insights={insights} />
      </div>
      <div hidden={tab !== "gallery"}>
        <GalleryClient schoolId={school.id} schoolName={school.name} />
      </div>
    </div>
  )
}
