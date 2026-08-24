import WritingBrowser from "../WritingBrowser";
export default async function Page({params}:{params:Promise<{examId:string}>}){const p=await params;return <WritingBrowser ids={[p.examId]}/>}

