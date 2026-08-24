import Link from "next/link";
import { Shell } from "../../WritingBrowser";
import { technologyEssays } from "./essays";

export default function TechnologyPlaceholderPage() {
  return (
    <Shell>
      <Link className="writing-back" href="/writing/bac">← Back</Link>
      <div className="writing-kicker writing-kicker-coral">BAC — Writing Trainer</div>
      <h1 className="writing-title">Technology</h1>
      <p className="writing-lead">Choose an essay topic and work through vocabulary, linking language, and writing practice.</p>
      <div className="writing-topic-list">
        {technologyEssays.map((essay) => (
          <a className="writing-card essay-topic-card" href={essay.route} key={essay.id}>
            <span className="essay-topic-label">Essay topic</span>
            <h2>{essay.title}</h2>
            <p>Open the exercises</p>
          </a>
        ))}
      </div>
    </Shell>
  );
}
