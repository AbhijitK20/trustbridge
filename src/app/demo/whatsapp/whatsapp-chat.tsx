"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type Message = { id: string; role: "user" | "bot"; text: string; checkId?: string | null };

const WELCOME: Message = {
  id: "welcome",
  role: "bot",
  text: "Hi. I'm the TrustBridge referee.\n\nSend me an offer, a link, or a recruiter message. I'll separate the claim from the evidence and tell you what actually holds up.",
};

const CHIPS = [
  {
    label: "Fake Google internship",
    text: "check Google HR says I am selected for an AI internship. They want a ₹1,500 refundable registration fee to hr.google.intern@gmail.com. Official link: https://www.google.com/about/careers/applications/how-we-hire/",
  },
  {
    label: "Freelance website ₹18,000",
    text: "check Rahul at rahul.builds@protonmail.com will build a 5-page website in 10 days for ₹18,000 and wants a 50% advance. No official site.",
  },
  {
    label: "Official Google page",
    text: "check this link https://www.google.com/about/careers/applications/how-we-hire/",
  },
];

function nextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WhatsAppSimulator() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || pending) return;
    setMessages((current) => [...current, { id: nextId(), role: "user", text: value }]);
    setInput("");
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const body = (await response.json()) as { reply?: string; checkId?: string | null; error?: string };
      if (!response.ok || !body.reply) throw new Error(body.error ?? "The bot did not reply.");
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "bot", text: body.reply ?? "", checkId: body.checkId },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The bot could not reply.");
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <section className="wa-chat">
      <div className="wa-head">
        <span className="wa-avatar">T</span>
        <div>
          <strong>TrustBridge referee</strong>
          <small>WhatsApp bot · demo</small>
        </div>
        <span className="wa-status">online</span>
      </div>
      <div className="wa-log" ref={logRef}>
        {messages.map((message) => (
          <div className={`wa-row ${message.role}`} key={message.id}>
            <div className={`wa-bubble ${message.role}`}>
              <p>{message.text.replaceAll("*", "")}</p>
              {message.checkId && (
                <Link className="wa-report" href={`/verification/${message.checkId}`}>Open full report ↗</Link>
              )}
            </div>
          </div>
        ))}
        {pending && <div className="wa-row bot"><div className="wa-bubble bot wa-typing">Reading the claim…</div></div>}
        {error && <p className="form-error">{error}</p>}
      </div>
      <div className="wa-chips">
        {CHIPS.map((chip) => (
          <button type="button" key={chip.label} onClick={() => void send(chip.text)} disabled={pending}>{chip.label}</button>
        ))}
      </div>
      <form className="wa-input" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
        />
        <button type="submit" disabled={pending || !input.trim()}>Send</button>
      </form>
      <p className="wa-note">Demo only. Messages are stored in the demo database. Production requires Meta Cloud API credentials and signature verification.</p>
    </section>
  );
}
