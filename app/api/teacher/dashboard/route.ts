import { env } from "cloudflare:workers";

const TEACHER_EMAIL="librimaniastore@gmail.com";
const teacher=(request:Request)=>request.headers.get("oai-authenticated-user-email")?.toLowerCase()===TEACHER_EMAIL;

async function schema(){
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS \"groups\" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS student_groups (student_id INTEGER PRIMARY KEY, group_id INTEGER NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS teacher_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL UNIQUE, note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS lesson_focus (id INTEGER PRIMARY KEY AUTOINCREMENT, material_id TEXT NOT NULL, material_title TEXT NOT NULL, group_id INTEGER, active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_student_groups_group_id ON student_groups(group_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_lesson_focus_active ON lesson_focus(active)"),
  ]);
}

export async function GET(request:Request){
  if(!teacher(request)) return Response.json({error:"Teacher access required"},{status:403});
  await schema();
  const [groups,focus,notes]=await Promise.all([
    env.DB.prepare("SELECT g.*, COUNT(sg.student_id) AS member_count FROM \"groups\" g LEFT JOIN student_groups sg ON sg.group_id=g.id GROUP BY g.id ORDER BY g.name").all(),
    env.DB.prepare("SELECT * FROM lesson_focus WHERE active=1 ORDER BY updated_at DESC").all(),
    env.DB.prepare("SELECT * FROM teacher_notes").all(),
  ]);
  return Response.json({groups:groups.results,focus:focus.results,notes:notes.results});
}

export async function POST(request:Request){
  if(!teacher(request)) return Response.json({error:"Teacher access required"},{status:403});
  await schema();
  const body=await request.json() as {action?:string;name?:string;studentId?:number;note?:string;materialId?:string;materialTitle?:string;groupId?:number|null};
  if(body.action==="create-group"&&body.name?.trim()){
    try{const group=await env.DB.prepare("INSERT INTO \"groups\"(name) VALUES(?) RETURNING *").bind(body.name.trim()).first();return Response.json({group},{status:201});}
    catch{return Response.json({error:"A group with this name already exists"},{status:409});}
  }
  if(body.action==="save-note"&&body.studentId){
    await env.DB.prepare("INSERT INTO teacher_notes(student_id,note,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(student_id) DO UPDATE SET note=excluded.note,updated_at=CURRENT_TIMESTAMP").bind(body.studentId,body.note||"").run();
    return Response.json({ok:true});
  }
  if(body.action==="set-focus"&&body.materialId&&body.materialTitle){
    await env.DB.prepare("UPDATE lesson_focus SET active=0 WHERE group_id IS ? OR group_id=?").bind(body.groupId??null,body.groupId??null).run();
    await env.DB.prepare("INSERT INTO lesson_focus(material_id,material_title,group_id,active,updated_at) VALUES(?,?,?,1,CURRENT_TIMESTAMP)").bind(body.materialId,body.materialTitle,body.groupId??null).run();
    return Response.json({ok:true});
  }
  return Response.json({error:"Invalid action"},{status:400});
}

export async function DELETE(request:Request){
  if(!teacher(request)) return Response.json({error:"Teacher access required"},{status:403});
  await schema();
  const id=Number(new URL(request.url).searchParams.get("groupId"));
  if(!id)return Response.json({error:"Group id required"},{status:400});
  await env.DB.batch([env.DB.prepare("DELETE FROM student_groups WHERE group_id=?").bind(id),env.DB.prepare("DELETE FROM \"groups\" WHERE id=?").bind(id)]);
  return Response.json({ok:true});
}

