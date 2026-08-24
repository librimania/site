import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as { code?: string; email?: string };
  const code = body.code?.trim().toUpperCase();
  const email = body.email?.trim().toLowerCase();
  if (!code || !email) return Response.json({ error: "Email and code are required" }, { status: 400 });
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, access_code TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1, last_seen_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  const student = await env.DB.prepare("SELECT id,name,email FROM students WHERE access_code=? AND LOWER(email)=? AND active=1").bind(code,email).first<{id:number;name:string;email:string}>();
  if (!student) return Response.json({ error: "Email and code do not match" }, { status: 403 });
  await env.DB.prepare("UPDATE students SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?").bind(student.id).run();
  return Response.json({ student });
}

