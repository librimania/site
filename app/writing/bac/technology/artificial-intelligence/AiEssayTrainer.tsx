"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "../../../WritingBrowser";
import { technologyEssays } from "../essays";

const glossary = [
  ["Generative AI", "Artificial intelligence that can create new content, such as text, images, or music."],
  ["AI tool", "Software that uses artificial intelligence to help with a task."],
  ["AI-generated", "Made by artificial intelligence rather than by a human."],
  ["AI-assisted", "Done by a human with help from artificial intelligence."],
  ["Prompt", "The instruction, question, or text given to an AI system."],
  ["Prompt engineering", "The skill of writing clear instructions to get better AI results."],
  ["Large language model (LLM)", "An AI system trained on large amounts of text to understand and generate language."],
  ["Machine learning", "A branch of AI in which computers learn patterns from data."],
  ["Deep learning", "A type of machine learning that uses artificial neural networks with many layers."],
  ["AI slop", "Low-quality, mass-produced content created carelessly by AI."],
  ["Chatbot", "A computer program designed to have a conversation with a human."],
  ["Parasocial", "Describing a one-sided emotional relationship with a public figure, creator, or chatbot."],
  ["Augmentation / augment", "Improving or extending human ability with technology."],
  ["Automation / automate", "Using technology to perform tasks without human effort."],
  ["AI ethics", "The study of moral questions raised by developing and using AI."],
  ["Vibe coding", "Writing code quickly with heavy AI help, often without understanding every line."],
  ["Human-in-the-loop (HITL)", "A system in which a human checks or corrects AI output before it is final."],
  ["Deepfake", "A fake video, image, or audio clip made with AI to look or sound real."],
  ["Clanker", "An informal, mocking internet term for a robot or AI."],
] as const;

const linkingGroups = [
  { title: "Introducing the issue", phrases: ["It is often argued that…", "Many people believe that…", "There is no doubt that…"] },
  { title: "Presenting advantages", phrases: ["One major advantage is that…", "A further benefit is…", "This can lead to…"] },
  { title: "Presenting disadvantages", phrases: ["The main drawback is that…", "Another potential risk is…", "This may result in…"] },
  { title: "Adding ideas", phrases: ["Moreover,", "Furthermore,", "In addition,"] },
  { title: "Contrasting ideas", phrases: ["However,", "On the other hand,", "Nevertheless,", "Whereas…"] },
  { title: "Giving examples", phrases: ["For example,", "For instance,", "Such as…"] },
  { title: "Concluding", phrases: ["To sum up,", "All things considered,", "In conclusion,"] },
] as const;

const stages = ["Useful vocabulary / glossary", "Clichés and linking words", "Let’s write an essay"] as const;
const ESSAY_KEY = "librimania-bac-ai-essay";

export default function AiEssayTrainer() {
  const [stage, setStage] = useState(0);
  const [essay, setEssay] = useState("");
  const topic = technologyEssays[0];
  useEffect(() => setEssay(localStorage.getItem(ESSAY_KEY) || ""), []);
  useEffect(() => { localStorage.setItem(ESSAY_KEY, essay); }, [essay]);
  const wordCount = useMemo(() => essay.trim() ? essay.trim().split(/\s+/).length : 0, [essay]);

  return (
    <Shell>
      <Link className="writing-back" href="/writing/bac/technology">← Back</Link>
      <div className="writing-kicker writing-kicker-coral">BAC — Technology</div>
      <h1 className="essay-trainer-title">{topic.title}</h1>
      <div className="essay-stage-tabs" role="tablist" aria-label="Essay practice stages">
        {stages.map((label, index) => (
          <button className={stage === index ? "active" : ""} key={label} onClick={() => setStage(index)} type="button">
            <span>{index + 1}</span>{label}
          </button>
        ))}
      </div>

      {stage === 0 && (
        <section className="essay-stage-panel">
          <div className="essay-section-heading"><span>Step 1</span><h2>Useful vocabulary / glossary</h2></div>
          <p>Open each term to review its meaning. Try to use at least eight terms in your practice text.</p>
          <div className="glossary-grid">
            {glossary.map(([term, definition]) => (
              <details className="glossary-card" key={term}><summary>{term}</summary><p>{definition}</p></details>
            ))}
          </div>
          <div className="vocabulary-writing-task">
            <h3>Vocabulary challenge</h3>
            <p>Write 120–150 words on: <strong>“Is AI making us smarter or lazier?”</strong> Use at least eight glossary terms naturally.</p>
          </div>
          <button className="essay-next" type="button" onClick={() => setStage(1)}>Continue to linking words →</button>
        </section>
      )}

      {stage === 1 && (
        <section className="essay-stage-panel">
          <div className="essay-section-heading"><span>Step 2</span><h2>Clichés and linking words</h2></div>
          <p>Choose phrases from different groups to organise advantages and disadvantages clearly.</p>
          <div className="linking-grid">
            {linkingGroups.map((group) => <article className="linking-card" key={group.title}><h3>{group.title}</h3>{group.phrases.map((phrase) => <span key={phrase}>{phrase}</span>)}</article>)}
          </div>
          <button className="essay-next" type="button" onClick={() => setStage(2)}>Continue to the essay →</button>
        </section>
      )}

      {stage === 2 && (
        <section className="essay-stage-panel">
          <div className="essay-section-heading"><span>Step 3</span><h2>Let’s write an essay</h2></div>
          <div className="essay-plan"><strong>Suggested structure</strong><span>Introduction</span><span>Advantages</span><span>Disadvantages</span><span>Conclusion</span></div>
          <textarea className="essay-box essay-draft" value={essay} onChange={(event) => setEssay(event.target.value)} placeholder="Write your essay here…" />
          <div className={`word-count ${wordCount >= 180 && wordCount <= 220 ? "good" : ""}`}><span>{wordCount} words</span><span>Suggested target: 180–220 words</span></div>
          <p className="essay-save-note">Your draft is saved automatically on this device.</p>
        </section>
      )}
    </Shell>
  );
}
