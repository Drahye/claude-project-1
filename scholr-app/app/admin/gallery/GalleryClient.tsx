"use client"
import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import {
  Upload, Trash2, Loader2, ImagePlus, Globe,
  X, ZoomIn, ArrowLeft, ArrowRight, CheckCircle2,
} from "lucide-react"
import EmptyState from "@/components/shared/EmptyState"

interface GalleryImage {
  id:           string
  url:          string
  name:         string
  storage_path: string
  uploaded_at:  string
}

export default function GalleryClient({
  schoolId: _schoolId,
  schoolName: _schoolName,
}: { schoolId: string; schoolName: string }) {
  const [images, setImages]       = useState<GalleryImage[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [lightbox, setLightbox]   = useState<number | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  // Load images from DB on mount
  useEffect(() => {
    fetch("/api/admin/gallery")
      .then(r => r.json())
      .then(body => setImages(body.images ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, 10)
    if (arr.length === 0) return

    setUploading(true); setUploadErr(null)

    for (const file of arr) {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "gallery")
      try {
        const res  = await fetch("/api/admin/upload", { method: "POST", body: fd })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error ?? "Upload failed")

        const img: GalleryImage = {
          id:           body.path ?? `${Date.now()}-${file.name}`,
          url:          body.url,
          name:         file.name,
          storage_path: body.path ?? "",
          uploaded_at:  new Date().toISOString(),
        }

        setImages(prev => [img, ...prev])
        setJustAdded(img.id)
        setTimeout(() => setJustAdded(null), 1800)
      } catch (err: unknown) {
        setUploadErr(err instanceof Error ? err.message : "Upload failed")
      }
    }

    // Refresh from DB to get proper ids assigned by the server
    fetch("/api/admin/gallery")
      .then(r => r.json())
      .then(body => setImages(body.images ?? []))
      .catch(() => {})
      .finally(() => setUploading(false))
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }, [uploadFiles])

  async function deleteImage(img: GalleryImage) {
    setDeleting(img.id)
    try {
      const res = await fetch("/api/admin/gallery", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: img.id, storage_path: img.storage_path }),
      })
      if (!res.ok) throw new Error()
      // Animate out then remove
      setTimeout(() => {
        setImages(prev => prev.filter(i => i.id !== img.id))
        setDeleting(null)
      }, 350)
    } catch {
      setDeleting(null)
    }
  }

  const prevIdx = lightbox !== null ? Math.max(0, lightbox - 1) : null
  const nextIdx = lightbox !== null ? Math.min(images.length - 1, lightbox + 1) : null

  return (
    <div>
      {/* Upload zone */}
      <div
        className="rounded-2xl transition-all duration-200 mb-6"
        style={{
          border: `2px dashed ${dragOver ? "var(--c-indigo)" : "var(--c-border)"}`,
          background: dragOver ? "var(--c-indigo-bg)" : "var(--c-surface)",
          padding: "clamp(24px, 5vw, 48px) 24px",
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: dragOver ? "var(--c-indigo)" : "var(--c-bg)",
              border: "1px solid var(--c-border)",
              transform: dragOver ? "scale(1.1) rotate(3deg)" : "scale(1)",
            }}
          >
            {uploading
              ? <Loader2 size={22} style={{ color: "var(--c-indigo)" }} className="animate-spin" />
              : <ImagePlus size={22} style={{ color: dragOver ? "white" : "var(--c-indigo)" }} />
            }
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              {dragOver ? "Drop to upload" : uploading ? "Uploading…" : "Drag photos here"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
              PNG, JPG, WebP · Max 5 MB each · Up to 10 at a time
            </p>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "var(--c-indigo)", color: "white" }}
          >
            <Upload size={14} /> Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={e => e.target.files && uploadFiles(e.target.files)}
          />
          {uploadErr && (
            <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
              {uploadErr}
            </p>
          )}
        </div>
      </div>

      {/* Public page note */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6"
        style={{ background: "var(--c-indigo-bg)", border: "1px solid var(--c-border)" }}>
        <Globe size={14} style={{ color: "var(--c-indigo)", flexShrink: 0 }} />
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
          These photos appear on your public school page.
          <span className="font-semibold ml-1" style={{ color: "var(--c-indigo)" }}>
            Toggle &ldquo;Public school page&rdquo; in Settings → Features to make it live.
          </span>
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl animate-pulse"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No photos yet"
          description="Upload photos of your school — classrooms, events, sports day — to bring your public page to life."
          action={{ label: "Browse files", onClick: () => fileInputRef.current?.click() }}
        />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              {images.length} photo{images.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden aspect-square"
                style={{
                  border: "1px solid var(--c-border)",
                  transform: deleting === img.id ? "scale(0.85)" : justAdded === img.id ? "scale(1.03)" : "scale(1)",
                  opacity:   deleting === img.id ? 0 : 1,
                  transition: "transform 350ms cubic-bezier(0.23,1,0.32,1), opacity 350ms ease-out",
                }}
              >
                <Image
                  src={img.url}
                  alt={img.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {justAdded === img.id && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                    style={{ background: "var(--c-emerald)", color: "white" }}>
                    <CheckCircle2 size={10} /> Added
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ background: "rgba(9,11,18,0.55)" }}
                >
                  <button
                    type="button"
                    onClick={() => setLightbox(idx)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                    title="View"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteImage(img)}
                    disabled={deleting === img.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                    style={{ background: "rgba(239,68,68,0.25)", color: "white" }}
                    title="Delete"
                  >
                    {deleting === img.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={16} />
                    }
                  </button>
                </div>
              </div>
            ))}

            {/* Upload-more tile */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-95"
              style={{
                border: "2px dashed var(--c-border)",
                background: "var(--c-surface)",
                color: "var(--c-text-muted)",
              }}
            >
              <ImagePlus size={20} />
              <span className="text-xs font-medium">Add more</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(9,11,18,0.92)", animation: "fadeIn 200ms ease-out" }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
            onClick={() => setLightbox(null)}
          >
            <X size={18} />
          </button>

          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
              onClick={e => { e.stopPropagation(); setLightbox(prevIdx!) }}
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div
            className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ animation: "modalIn 250ms cubic-bezier(0.23,1,0.32,1)" }}
          >
            <Image
              src={images[lightbox].url}
              alt={images[lightbox].name}
              width={1200}
              height={900}
              className="object-contain max-h-[85vh]"
            />
          </div>

          {lightbox < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
              onClick={e => { e.stopPropagation(); setLightbox(nextIdx!) }}
            >
              <ArrowRight size={18} />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  )
}
