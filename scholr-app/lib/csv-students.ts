/**
 * Shared CSV → student parsing for the teacher roster and the admin Students
 * page. Pure, client-safe (no DOM, no network) so both importers behave
 * identically and there's one place to fix column-detection quirks.
 */

export interface ParsedRow {
  full_name: string
  admission_number: string
  gender: string
  date_of_birth: string
}

/** Minimal CSV parser: handles quoted fields and commas inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") { row.push(field); field = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some(c => c.trim() !== "")) rows.push(row)
      row = []
    } else field += ch
  }
  if (field !== "" || row.length > 0) { row.push(field); if (row.some(c => c.trim() !== "")) rows.push(row) }
  return rows
}

/** Map CSV rows → student objects, detecting columns from the header row. */
export function rowsToStudents(rows: string[][]): ParsedRow[] {
  if (rows.length === 0) return []
  const header = rows[0].map(h => h.trim().toLowerCase())
  const looksLikeHeader = header.some(h => /name|admission|adm|gender|birth|dob/.test(h))
  const idx = (...keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)))
  const nameI = looksLikeHeader ? idx("full name", "name", "student") : 0
  const admI  = looksLikeHeader ? idx("admission", "adm", "roll", "id") : 1
  const genI  = looksLikeHeader ? idx("gender", "sex") : 2
  const dobI  = looksLikeHeader ? idx("birth", "dob") : 3
  const body = looksLikeHeader ? rows.slice(1) : rows
  return body.map(r => ({
    full_name:        (nameI >= 0 ? r[nameI] : r[0] ?? "").trim(),
    admission_number: (admI  >= 0 ? r[admI]  : r[1] ?? "").trim(),
    gender:           (genI  >= 0 ? r[genI]  : "").trim(),
    date_of_birth:    (dobI  >= 0 ? r[dobI]  : "").trim(),
  })).filter(s => s.full_name || s.admission_number)
}
