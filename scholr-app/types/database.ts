// ─── Scholr Database Types ────────────────────────────────────────────────────
// Generated manually from schema. Run `pnpm supabase gen types` after DB setup.

export type UserRole = "parent" | "teacher" | "admin" | "super_admin"
export type AttendanceStatus = "present" | "absent" | "late" | "excused"
export type HomeworkStatus = "assigned" | "submitted" | "graded" | "overdue"
export type MessageType = "direct" | "announcement" | "system"
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise"
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled"
export type NotificationType = "absence" | "homework" | "message" | "report" | "fee" | "announcement"

// A custom section a school can add to its public /{slug} page (paid feature)
export interface ContentBlock {
  id: string
  title: string
  body: string
}

// ─── Core Tables ──────────────────────────────────────────────────────────────

export interface School {
  id: string
  name: string
  slug: string                     // unique URL-safe identifier
  country: string                  // ISO 3166-1 alpha-2
  timezone: string                 // IANA timezone
  logo_url: string | null
  primary_color: string | null       // admin dashboard theme
  public_color?: string | null       // public /{slug} page accent
  theme?: string | null              // public page theme: aurora | editorial | campus
  welcome_headline?: string | null   // public /{slug} page branding
  welcome_subtext?: string | null
  hero_image_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  content_blocks?: ContentBlock[] | null  // custom public-page sections (paid)
  hide_branding?: boolean | null           // remove "Powered by Scholr" (paid)
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  student_count: number
  max_students: number             // plan limit
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string                       // matches auth.users.id
  school_id: string
  role: UserRole
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface StudentMedical {
  blood_group?: string
  allergies?: string
  conditions?: string
  medications?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  doctor?: string
  notes?: string
}

export interface StudentPersonal {
  hobbies?: string
  interests?: string
  languages?: string
  dietary?: string
  about?: string
}

export interface StudentActivity {
  id: string
  name: string
  category: string          // sport | swimming | club | creative | music | other
  note?: string
  added_by_role?: string    // teacher | admin
}

export interface Student {
  id: string
  school_id: string
  admission_number: string
  full_name: string
  date_of_birth: string | null
  gender: "male" | "female" | "other"
  photo_url: string | null
  is_active: boolean
  medical?: StudentMedical | null      // admin + parent (migration 014)
  personal?: StudentPersonal | null    // parent
  activities?: StudentActivity[] | null // teacher
  created_at: string
  updated_at: string
}

export interface Parent {
  id: string                       // matches profile.id
  school_id: string
  relationship_to_child: string | null
}

export interface ParentStudent {
  parent_id: string
  student_id: string
  is_primary: boolean
  created_at: string
}

export interface Teacher {
  id: string                       // matches profile.id
  school_id: string
  subjects: string[]
  employee_number: string | null
}

export interface Class {
  id: string
  school_id: string
  name: string                     // e.g. "Year 6B"
  grade_level: string              // e.g. "6"
  academic_year: string            // e.g. "2025-2026"
  teacher_id: string | null        // homeroom teacher
  created_at: string
}

export interface StudentClassEnrollment {
  student_id: string
  class_id: string
  enrolled_at: string
  is_active: boolean
}

// ─── Academic Tables ──────────────────────────────────────────────────────────

export interface Attendance {
  id: string
  school_id: string
  student_id: string
  class_id: string
  teacher_id: string
  date: string                     // ISO date
  status: AttendanceStatus
  note: string | null
  notified_at: string | null       // when parent was alerted
  created_at: string
}

export interface Homework {
  id: string
  school_id: string
  class_id: string
  teacher_id: string
  title: string
  description: string
  subject: string
  due_date: string
  file_urls: string[]
  max_score: number | null
  status: HomeworkStatus
  created_at: string
  updated_at: string
}

export interface HomeworkSubmission {
  id: string
  homework_id: string
  school_id: string                // added in migration 002 (admin dashboard queries it)
  student_id: string
  submitted_at: string | null
  file_urls: string[]
  score: number | null
  feedback: string | null
  graded_at: string | null
  graded_by: string | null
}

// ─── Communication Tables ─────────────────────────────────────────────────────

export interface MessageThread {
  id: string
  school_id: string
  subject: string | null
  type: MessageType
  participant_ids: string[]        // profile ids (renamed from `participants` in migration 002)
  last_message_at: string | null
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  school_id: string
  sender_id: string
  body: string
  file_urls: string[]
  is_read_by: string[]             // profile ids who have read
  sent_at: string
}

export interface Notification {
  id: string
  school_id: string
  recipient_id: string             // profile id
  type: NotificationType
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

// ─── AI & Reports ─────────────────────────────────────────────────────────────

export interface WeeklyReport {
  id: string
  school_id: string
  student_id: string
  week_start: string               // ISO date (Monday)
  week_end: string                 // ISO date (Friday)
  attendance_days: number
  attendance_total: number
  homework_submitted: number
  homework_total: number
  ai_summary: string               // Claude-generated narrative
  ai_encouragement: string         // personalised note to child
  teacher_notes: string[]
  sent_at: string | null
  created_at: string
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface Subscription {
  id: string
  school_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_end: string | null
  created_at: string
  updated_at: string
}

// ─── Public-page extras ───────────────────────────────────────────────────────

export interface GalleryImage {
  id: string
  school_id: string
  storage_path: string             // e.g. gallery/school-id/1234567890.jpg
  url: string                      // public CDN URL
  name: string                     // original filename
  uploaded_by: string | null
  uploaded_at: string
}

export interface SchoolPageEvent {
  id: string
  school_id: string
  event: string                    // 'view' | 'login_click'
  created_at: string
}

// ─── Supabase DB helper type ──────────────────────────────────────────────────

// An insertable row: every column is optional (the DB fills id, timestamps, and
// any column with a default), except `Req` — the columns a caller must provide.
// This mirrors what `supabase gen types` produces and lets typed .insert() calls
// drop the `as any` casts that were previously needed.
type Ins<T, Req extends keyof T = never> = Partial<T> & Pick<T, Req>

// supabase-js's GenericTable requires Row/Insert/Update to extend
// Record<string, unknown> AND a `Relationships` key. A TS `interface` is NOT
// assignable to Record<string, unknown> (it can be augmented), so passing the
// row interfaces straight through makes the whole schema collapse to `never` —
// which is the real reason every query used to be cast to `any`. Running each
// shape through this mapped type turns the interface into an anonymous object
// type that satisfies the constraint, while keeping every property for checking.
type Resolve<T> = { [K in keyof T]: T[K] }

type Table<Row, Insert, Update> = {
  Row: Resolve<Row>
  Insert: Resolve<Insert>
  Update: Resolve<Update>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      schools:                   Table<School,                 Ins<School, "name" | "slug">,                                                                                       Partial<School>>
      profiles:                  Table<Profile,                Ins<Profile, "id" | "school_id" | "role" | "full_name" | "email">,                                                  Partial<Profile>>
      students:                  Table<Student,                Ins<Student, "school_id" | "admission_number" | "full_name">,                                                       Partial<Student>>
      parents:                   Table<Parent,                 Ins<Parent, "id" | "school_id">,                                                                                    Partial<Parent>>
      parent_students:           Table<ParentStudent,          Ins<ParentStudent, "parent_id" | "student_id">,                                                                     Partial<ParentStudent>>
      teachers:                  Table<Teacher,                Ins<Teacher, "id" | "school_id">,                                                                                   Partial<Teacher>>
      classes:                   Table<Class,                  Ins<Class, "school_id" | "name" | "grade_level" | "academic_year">,                                                 Partial<Class>>
      student_class_enrollments: Table<StudentClassEnrollment, Ins<StudentClassEnrollment, "student_id" | "class_id">,                                                             Partial<StudentClassEnrollment>>
      attendance:                Table<Attendance,             Ins<Attendance, "school_id" | "student_id" | "class_id" | "teacher_id" | "date" | "status">,                        Partial<Attendance>>
      homework:                  Table<Homework,               Ins<Homework, "school_id" | "class_id" | "teacher_id" | "title" | "subject" | "due_date">,                          Partial<Homework>>
      homework_submissions:      Table<HomeworkSubmission,     Ins<HomeworkSubmission, "school_id" | "homework_id" | "student_id">,                                                 Partial<HomeworkSubmission>>
      message_threads:           Table<MessageThread,          Ins<MessageThread, "school_id" | "participant_ids">,                                                                Partial<MessageThread>>
      messages:                  Table<Message,                Ins<Message, "thread_id" | "school_id" | "sender_id" | "body">,                                                     Partial<Message>>
      notifications:             Table<Notification,           Ins<Notification, "school_id" | "recipient_id" | "type" | "title" | "body">,                                        Partial<Notification>>
      weekly_reports:            Table<WeeklyReport,           Ins<WeeklyReport, "school_id" | "student_id" | "week_start" | "week_end">,                                           Partial<WeeklyReport>>
      subscriptions:             Table<Subscription,           Ins<Subscription, "school_id" | "stripe_subscription_id" | "stripe_customer_id" | "plan" | "status" | "current_period_start" | "current_period_end">, Partial<Subscription>>
      gallery_images:            Table<GalleryImage,           Ins<GalleryImage, "school_id" | "storage_path" | "url" | "name">,                                 Partial<GalleryImage>>
      school_page_events:        Table<SchoolPageEvent,        Ins<SchoolPageEvent, "school_id" | "event">,                                                     Partial<SchoolPageEvent>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
