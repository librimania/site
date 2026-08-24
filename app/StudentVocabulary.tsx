"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

type Position = { x: number; y: number };
type VocabularyWord = { id: string; text: string };

const WORDS_KEY = "librimania-vocabulary-words";
const POSITION_KEY = "librimania-vocabulary-position";
const SESSION_KEY = "librimania-session";

function isStudentSession() {
  try {
    const mainSession = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (mainSession) return mainSession.role === "student";
    return Boolean(JSON.parse(localStorage.getItem("librimania-sb-student") || "null"));
  } catch {
    return false;
  }
}

function clampPosition(position: Position): Position {
  return {
    x: Math.max(12, Math.min(position.x, window.innerWidth - 72)),
    y: Math.max(12, Math.min(position.y, window.innerHeight - 72)),
  };
}

export default function StudentVocabulary() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [draft, setDraft] = useState("");
  const drag = useRef({ active: false, moved: false, dx: 0, dy: 0 });

  useEffect(() => {
    const savedPosition = JSON.parse(localStorage.getItem(POSITION_KEY) || "null") as Position | null;
    setPosition(clampPosition(savedPosition || { x: window.innerWidth - 88, y: window.innerHeight - 88 }));
    setWords(JSON.parse(localStorage.getItem(WORDS_KEY) || "[]"));
    const refreshVisibility = () => setVisible(isStudentSession());
    refreshVisibility();
    window.addEventListener("storage", refreshVisibility);
    window.addEventListener("focus", refreshVisibility);
    const resize = () => setPosition((current) => clampPosition(current));
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("storage", refreshVisibility);
      window.removeEventListener("focus", refreshVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (visible) localStorage.setItem(POSITION_KEY, JSON.stringify(position));
  }, [position, visible]);

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    drag.current = {
      active: true,
      moved: false,
      dx: event.clientX - position.x,
      dy: event.clientY - position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current.active) return;
    const next = clampPosition({ x: event.clientX - drag.current.dx, y: event.clientY - drag.current.dy });
    if (Math.abs(next.x - position.x) > 2 || Math.abs(next.y - position.y) > 2) drag.current.moved = true;
    setPosition(next);
  }

  function endDrag() {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (!drag.current.moved) setOpen((value) => !value);
  }

  function addWord(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [...words, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text }];
    setWords(next);
    localStorage.setItem(WORDS_KEY, JSON.stringify(next));
    setDraft("");
  }

  function removeWord(id: string) {
    const next = words.filter((word) => word.id !== id);
    setWords(next);
    localStorage.setItem(WORDS_KEY, JSON.stringify(next));
  }

  if (!visible) return null;

  const panelLeft = Math.max(12, Math.min(position.x - 264, window.innerWidth - 332));
  const panelTop = position.y > window.innerHeight / 2
    ? Math.max(12, position.y - 390)
    : Math.min(window.innerHeight - 402, position.y + 70);

  return (
    <>
      {open && (
        <section className="vocabulary-panel" style={{ left: panelLeft, top: panelTop }} aria-label="My vocabulary">
          <div className="vocabulary-heading">
            <div>
              <span>My vocabulary</span>
              <h2>New words</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close vocabulary">×</button>
          </div>
          <form className="vocabulary-form" onSubmit={addWord}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Type a new word…" aria-label="New vocabulary word" />
            <button type="submit">Add</button>
          </form>
          <div className="vocabulary-list">
            {words.length ? words.map((word) => (
              <div className="vocabulary-row" key={word.id}>
                <span>{word.text}</span>
                <button type="button" onClick={() => removeWord(word.id)} aria-label={`Remove ${word.text}`}>×</button>
              </div>
            )) : <p className="vocabulary-empty">Add unfamiliar words while you study. They will stay here on this device.</p>}
          </div>
        </section>
      )}
      <button
        className="vocabulary-orb"
        style={{ left: position.x, top: position.y }}
        type="button"
        title="Vocabulary"
        aria-label="Open vocabulary notebook. Drag to move."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => { drag.current.active = false; }}
      >
        <strong>V</strong>
        <small>vocab</small>
      </button>
    </>
  );
}

