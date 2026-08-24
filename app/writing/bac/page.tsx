import Link from "next/link";
import { Shell } from "../WritingBrowser";
import { bacTopics } from "./topics";

export default function BacTopicsPage() {
  return (
    <Shell>
      <Link className="writing-back" href="/writing">← Back</Link>
      <div className="writing-kicker writing-kicker-coral">BAC — Writing Trainer</div>
      <h1 className="writing-title">Choose your topic</h1>
      <p className="writing-lead">
        Practice Subiectul II and Subiectul III with topic-specific vocabulary and structure.
      </p>
      <div className="writing-topic-list">
        {bacTopics.map((topic) => (
          <details className="topic-accordion" key={topic.id}>
            <summary className="writing-card topic-accordion-summary">
              <div>
                <h2>{topic.title}</h2>
                <p>Explore available essay topics</p>
              </div>
              <span className="topic-accordion-meta">
                <span>{topic.subtopics.length} {topic.subtopics.length === 1 ? "subtopic" : "subtopics"}</span>
                <span className="topic-accordion-icon" aria-hidden="true" />
              </span>
            </summary>
            <div className="topic-subtopic-list">
              {topic.subtopics.map((subtopic, index) => (
                <a href={subtopic.route} key={subtopic.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{subtopic.title}</strong>
                  <span aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Shell>
  );
}

