import { env } from "cloudflare:workers";

const TEACHER_EMAIL = "librimaniastore@gmail.com";

function isTeacher(request: Request) {
  return request.headers.get("oai-authenticated-user-email")?.toLowerCase() === TEACHER_EMAIL;
}

async function ensureSchema() {
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, access_code TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1, last_seen_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS progress (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, material_id TEXT NOT NULL, material_title TEXT NOT NULL, percent INTEGER NOT NULL DEFAULT 0, score TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS \"groups\" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS student_groups (student_id INTEGER PRIMARY KEY, group_id INTEGER NOT NULL, FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE, FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_progress_student_id ON progress(student_id)"),
  ]);
}

export async function GET(request: Request) {
  if (!isTeacher(request)) return Response.json({ error: "Teacher access required" }, { status: 403 });
  await ensureSchema();
  const { results } = await env.DB.prepare("SELECT s.*, g.id AS group_id, g.name AS group_name, COALESCE(ROUND(AVG(p.percent)), 0) AS progress, COUNT(DISTINCT p.material_id) AS assigned_count, COUNT(DISTINCT CASE WHEN p.percent>=100 THEN p.material_id END) AS completed_count, COALESCE(GROUP_CONCAT(CASE WHEN p.percent >= 100 THEN p.material_title END, '|'), '') AS completed_materials FROM students s LEFT JOIN progress p ON p.student_id=s.id LEFT JOIN student_groups sg ON sg.student_id=s.id LEFT JOIN \"groups\" g ON g.id=sg.group_id GROUP BY s.id ORDER BY s.created_at DESC").all();
  return Response.json({ students: results });
}

export async function POST(request: Request) {
  if (!isTeacher(request)) return Response.json({ error: "Teacher access required" }, { status: 403 });
  await ensureSchema();
  const body = await request.json() as { name?: string; email?: string; code?: string; groupId?:number|null };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim().toUpperCase();
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !code) return Response.json({ error: "Valid name, email and code are required" }, { status: 400 });
  try {
    const result = await env.DB.prepare("INSERT INTO students(name, email, access_code, created_at) VALUES(?, ?, ?, CURRENT_TIMESTAMP) RETURNING *").bind(name, email, code).first<{id:number}>();
    if(result?.id&&body.groupId) await env.DB.prepare("INSERT OR REPLACE INTO student_groups(student_id,group_id) VALUES(?,?)").bind(result.id,body.groupId).run();
    return Response.json({ student: result }, { status: 201 });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    if (details.toLowerCase().includes("unique")) {
      return Response.json({ error: "This code already exists" }, { status: 409 });
    }
    return Response.json({ error: "Could not create student access. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isTeacher(request)) return Response.json({ error: "Teacher access required" }, { status: 403 });
  await ensureSchema();
  const body = await request.json() as { id?: number; active?: boolean; name?:string; email?:string; code?:string; completedMaterials?:string[]; addMaterial?:{id?:string;title?:string}; groupId?:number|null };
  if (!body.id) return Response.json({ error: "Student id is required" }, { status: 400 });
  if (body.name !== undefined || body.email !== undefined || body.code !== undefined) {
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim().toUpperCase();
    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email) || !code) return Response.json({ error:"Valid name, email and code are required" }, { status:400 });
    await env.DB.prepare("UPDATE students SET name=?, email=?, access_code=? WHERE id=?").bind(name,email,code,body.id).run();
  } else if (body.active !== undefined) {
    await env.DB.prepare("UPDATE students SET active=? WHERE id=?").bind(body.active ? 1 : 0, body.id).run();
  }
  if (Array.isArray(body.completedMaterials)) {
    await env.DB.prepare("DELETE FROM progress WHERE student_id=? AND percent>=100").bind(body.id).run();
    const materials = body.completedMaterials.map(value=>value.trim()).filter(Boolean);
    if (materials.length) await env.DB.batch(materials.map((title,index)=>env.DB.prepare("INSERT INTO progress(student_id, material_id, material_title, percent, updated_at) VALUES(?, ?, ?, 100, CURRENT_TIMESTAMP)").bind(body.id, `manual-${Date.now()}-${index}`, title)));
  }
  if (body.groupId !== undefined) {
    await env.DB.prepare("DELETE FROM student_groups WHERE student_id=?").bind(body.id).run();
    if(body.groupId) await env.DB.prepare("INSERT INTO student_groups(student_id,group_id) VALUES(?,?)").bind(body.id,body.groupId).run();
  }
  if (body.addMaterial?.id && body.addMaterial?.title) {
    const materialId = body.addMaterial.id.trim();
    const materialTitle = body.addMaterial.title.trim();
    const existing = await env.DB.prepare("SELECT id FROM progress WHERE student_id=? AND material_id=? LIMIT 1").bind(body.id, materialId).first();
    if (existing) {
      await env.DB.prepare("UPDATE progress SET material_title=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(materialTitle, existing.id).run();
    } else {
      await env.DB.prepare("INSERT INTO progress(student_id, material_id, material_title, percent, updated_at) VALUES(?, ?, ?, 0, CURRENT_TIMESTAMP)").bind(body.id, materialId, materialTitle).run();
    }
    return Response.json({ ok:true, assigned:true, material:{ id:materialId, title:materialTitle } });
  }
  return Response.json({ ok: true });
}

