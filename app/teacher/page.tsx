import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";
const TEACHER_EMAIL = "librimaniastore@gmail.com";

export default async function TeacherPage() {
  const user = await requireChatGPTUser("/teacher");
  if (user.email.toLowerCase() !== TEACHER_EMAIL) {
    return <main style={{padding:40,fontFamily:"sans-serif"}}><h1>Teacher access only</h1><p>This area is restricted to the Librimania teacher account.</p><a href="/">Return to Librimania</a></main>;
  }
  return <iframe src="/teacher-mode.html" title="Librimania Teacher’s mode" style={{position:"fixed",inset:0,width:"100%",height:"100%",border:0}} />;
}
