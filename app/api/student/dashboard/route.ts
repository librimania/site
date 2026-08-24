import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as { code?: string };
  const code = body.code?.trim().toUpperCase();
  if (!code) return Response.json({ error: "Student code is required" }, { status: 400 });
  const student = await env.DB.prepare("SELECT id,name,email,last_seen_at FROM students WHERE access_code=? AND active=1").bind(code).first<{id:number;name:string;email:string;last_seen_at:string|null}>();
  if (!student) return Response.json({ error: "Student access is no longer active" }, { status: 403 });
  const { results } = await env.DB.prepare("SELECT material_id,material_title,percent,score,updated_at FROM progress WHERE student_id=? ORDER BY updated_at DESC").bind(student.id).all();
  const progress = results as Array<{material_id:string;material_title:string;percent:number;score:string|null;updated_at:string}>;
  const overall = progress.length ? Math.round(progress.reduce((sum,item)=>sum+Number(item.percent||0),0)/progress.length) : 0;
  return Response.json({ student, progress, overall, completed: progress.filter(item=>Number(item.percent)>=100) });
}

