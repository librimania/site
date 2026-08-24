const TEACHER_EMAIL = "librimaniastore@gmail.com";

export async function GET(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  return Response.json({ role: email === TEACHER_EMAIL ? "teacher" : "guest" });
}

