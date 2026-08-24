import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  const studentId = Number(new URL(request.url).searchParams.get("studentId"));
  if (!studentId) return Response.json({ error: "Student required" }, { status: 400 });
  const session = await env.DB.prepare("SELECT * FROM live_sessions WHERE student_id=? AND active=1 ORDER BY updated_at DESC LIMIT 1").bind(studentId).first();
  return Response.json({ session });
}

export async function POST(request: Request) {
  const body = await request.json() as { id?:string; studentId?:number; cursorX?:number; cursorY?:number; answer?:string };
  if (!body.id || !body.studentId) return Response.json({ error: "Session required" }, { status: 400 });
  await env.DB.prepare("UPDATE live_sessions SET student_cursor_x=COALESCE(?,student_cursor_x), student_cursor_y=COALESCE(?,student_cursor_y), student_answer=COALESCE(?,student_answer), updated_at=CURRENT_TIMESTAMP WHERE id=? AND student_id=?")
    .bind(body.cursorX ?? null, body.cursorY ?? null, body.answer ?? null, body.id, body.studentId).run();
  return Response.json({ ok:true });
}

