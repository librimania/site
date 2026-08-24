import WritingBrowser from "../../../WritingBrowser";
export default async function Page({params}:{params:Promise<{examId:string,taskTypeId:string,topicId:string}>}){const p=await params;return <WritingBrowser ids={[p.examId,p.taskTypeId,p.topicId]}/>}

