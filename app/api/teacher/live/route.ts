import { env } from "cloudflare:workers";

const TEACHER_EMAIL = "librimaniastore@gmail.com";
function isTeacher(request: Request) { return request.headers.get("oai-authenticated-user-email")?.toLowerCase() === TEACHER_EMAIL; }

async function ensureLiveSchema() {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS live_sessions (id TEXT PRIMARY KEY, student_id INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, material_type TEXT NOT NULL DEFAULT 'workbook', material_title TEXT NOT NULL DEFAULT 'Present Simple', page INTEGER NOT NULL DEFAULT 1, teacher_cursor_x INTEGER NOT NULL DEFAULT 30, teacher_cursor_y INTEGER NOT NULL DEFAULT 30, student_cursor_x INTEGER NOT NULL DEFAULT 70, student_cursor_y INTEGER NOT NULL DEFAULT 60, student_answer TEXT NOT NULL DEFAULT '', teacher_note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_live_sessions_student ON live_sessions(student_id, active)"),
  ]);
}

export async function GET(request: Request) {
  if (!isTeacher(request)) return Response.json({ error: "Teacher access required" }, { status: 403 });
  await ensureLiveSchema();
  const id = new URL(request.url).searchParams.get("id");
  const session = id ? await env.DB.prepare("SELECT l.*, s.name AS student_name FROM live_sessions l JOIN students s ON s.id=l.student_id WHERE l.id=?").bind(id).first() : null;
  return Response.json({ session });
}

export async function POST(request: Request) {
  if (!isTeacher(request)) return Response.json({ error: "Teacher access required" }, { status: 403 });
  await ensureLiveSchema();
  const body = await request.json() as Record<string, string | number>;
  if (body.studentId) {
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO live_sessions(id, student_id, material_type, material_title) VALUES(?, ?, ?, ?)").bind(id, body.studentId, body.materialType || "workbook", body.materialTitle || "Present Simple").run();
    return Response.json({ id }, { status: 201 });
  }
  if (!body.id) return Response.json({ error: "Session id required" }, { status: 400 });
  await env.DB.prepare("UPDATE live_sessions SET page=COALESCE(?,page), teacher_cursor_x=COALESCE(?,teacher_cursor_x), teacher_cursor_y=COALESCE(?,teacher_cursor_y), teacher_note=COALESCE(?,teacher_note), material_type=COALESCE(?,material_type), material_title=COALESCE(?,material_title), updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(body.page ?? null, body.cursorX ?? null, body.cursorY ?? null, body.note ?? null, body.materialType ?? null, body.materialTitle ?? null, body.id).run();
  return Response.json({ ok: true });
}

