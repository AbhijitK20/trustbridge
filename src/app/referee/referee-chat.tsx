"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS, runCheck } from "@/lib/verification";
import type { CheckInput, CheckResult, ScenarioId } from "@/lib/verification";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text?: string;
  result?: CheckResult;
  reply?: string;
  input?: CheckInput;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "bot",
  text: "Paste the offer, the sender's email, or a link. I'll separate the claim from the evidence, then draft a reply you can send.",
};

const CHIPS: Array<{ id: ScenarioId; label: string }> = [
  { id: "fake_internship", label: "Fake Google internship" },
  { id: "unknown_seller", label: "Freelance website ₹18,000" },
  { id: "official_page", label: "Is this link official?" },
  { id: "verified_recruiter", label: "Matching recruiter domain" },
];

const KNOWN_ORGS = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Flipkart", "Infosys", "TCS", "Wipro"];

function nextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractOrganization(text: string) {
  return KNOWN_ORGS.find((name) => new RegExp(`\\b${name}\\b`, "i").test(text)) ?? "";
}

function extractEmail(text: string) {
  return text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? "";
}

function extractUrl(text: string) {
  return text.match(/https?:\/\/[^\s)]+/i)?.[0] ?? "";
}

function extractAmount(text: string) {
  return text.match(/₹\s?([\d,]+)/)?.[1]?.replaceAll(",", "") ?? "";
}

function outcomeClass(outcome: CheckResult["outcome"]) {
  return `outcome-${outcome.toLowerCase().replaceAll("_", "-")}`;
}

function draftReply(result: CheckResult, organization: string) {
  const conditions = result.conditions.slice(0, 3);
  if (result.outcome === "CONTRADICTED") {
    const claim = result.claims.find((item) => item.outcome === "CONTRADICTED");
    const source = claim?.evidence.find((item) => item.relation === "CONTRADICTS")?.label ?? "an official source";
    return `I can't proceed with this offer. ${source} contradicts “${claim?.text ?? "a material claim"}”. Please send an official link from ${organization}'s own domain and remove the upfront fee. If this is genuine, I'm happy to verify through ${organization}'s published contact channel.`;
  }
  if (result.outcome === "UNDETERMINED") {
    return `I'm interested, but I can't send money unprotected. I can proceed through a TrustBridge deal with a written deliverable, a deadline, and acceptance criteria.${conditions.length ? ` Before we start: ${conditions.join(" ")}` : ""}`;
  }
  if (result.outcome === "VERIFIED_WITH_CONDITIONS") {
    return `Thanks — the checkable details line up. Before we start, please confirm: ${conditions.join(" ")} I'll hold the payment in a protected deal and release it after delivery.`;
  }
  return "That checks out against the official source. Use the page's own application or contact flow, and don't pay anyone who contacts you separately.";
}

export default function RefereeChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [protectPending, setProtectPending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pending]);

  async function callCheck(payload: CheckInput, userText: string) {
    const userMessage: ChatMessage = { id: nextId(), role: "user", text: userText };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as CheckResult | { error?: string };
      if (!response.ok || !("outcome" in data)) throw new Error("error" in data ? data.error : "The check failed.");
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "bot", result: data, reply: draftReply(data, payload.organization), input: payload },
      ]);
    } catch {
      const local = runCheck(payload);
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "bot", result: local, reply: draftReply(local, payload.organization), input: payload },
      ]);
    } finally {
      setPending(false);
    }
  }

  function sendFreeText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    void callCheck(
      {
        organization: extractOrganization(text) || "Unknown organisation",
        counterpartyName: "",
        counterpartyEmail: extractEmail(text),
        promise: text,
        amount: extractAmount(text),
        officialUrl: extractUrl(text),
        evidenceText: "Pasted into the TrustBridge referee chat.",
      },
      text,
    );
  }

  function sendScenario(id: ScenarioId) {
    if (pending) return;
    const preset = SCENARIOS[id];
    void callCheck({ ...preset.input, scenario: id }, preset.input.promise);
  }

  async function protect(message: ChatMessage) {
    if (!message.input) return;
    setProtectPending(true);
    try {
      const response = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.input),
      });
      const body = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !body.id) {
        setMessages((current) => [...current, { id: nextId(), role: "bot", text: body.error ?? "The verification could not be saved. Try again." }]);
        return;
      }
      const params = new URLSearchParams({ verificationId: body.id });
      const title = message.input.promise.trim().slice(0, 120);
      const description = message.input.promise.trim().slice(0, 1000);
      if (title) params.set("title", title);
      if (description) params.set("description", description);
      if (message.input.amount.trim()) params.set("price", message.input.amount.trim());
      router.push(`/create?${params.toString()}`);
    } catch {
      setMessages((current) => [...current, { id: nextId(), role: "bot", text: "Could not reach the verification service." }]);
    } finally {
      setProtectPending(false);
    }
  }

  async function copyReply(message: ChatMessage) {
    if (!message.reply || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(message.reply);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch {
      setCopiedId("");
    }
  }

  return (
    <section className="referee-chat">
      <div className="chat-log" ref={logRef}>
        {messages.map((message) => (
          <div className={`chat-row ${message.role}`} key={message.id}>
            {message.role === "bot" && <span className="chat-avatar">T</span>}
            <div className={`chat-bubble ${message.role}`}>
              {message.text && <p>{message.text}</p>}
              {message.result && (
                <div className={`chat-result ${outcomeClass(message.result.outcome)}`}>
                  <div className="result-top">
                    <span className="verdict-pill">{message.result.outcome.replaceAll("_", " ")}</span>
                    <span className="result-id">#{message.result.id.slice(0, 6).toUpperCase()}</span>
                  </div>
                  <h3>{message.result.headline}</h3>
                  <p className="chat-summary">{message.result.summary}</p>
                  {message.result.conditions.length > 0 && (
                    <ul className="chat-conditions">
                      {message.result.conditions.slice(0, 3).map((condition) => (
                        <li key={condition}>{condition}</li>
                      ))}
                    </ul>
                  )}
                  {message.reply && (
                    <div className="chat-reply">
                      <div className="chat-reply-head">
                        <span>DRAFT REPLY</span>
                        <button type="button" onClick={() => copyReply(message)}>
                          {copiedId === message.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p>{message.reply}</p>
                    </div>
                  )}
                  {message.result.outcome === "CONTRADICTED" ? (
                    <p className="chat-blocked">A protected deal cannot fix a contradicted claim. Do not pay or share documents.</p>
                  ) : message.input ? (
                    <button className="button-primary chat-protect" type="button" onClick={() => protect(message)} disabled={protectPending}>
                      {protectPending ? "Saving verification…" : "Create protected deal"} <span>↗</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && (
          <div className="chat-row bot">
            <span className="chat-avatar">T</span>
            <div className="chat-bubble bot chat-thinking">Reading the claim, then the evidence…</div>
          </div>
        )}
      </div>

      <div className="chat-chips">
        {CHIPS.map((chip) => (
          <button type="button" className="chat-chip" key={chip.id} onClick={() => sendScenario(chip.id)} disabled={pending}>
            {chip.label}
          </button>
        ))}
      </div>

      <form className="chat-input" onSubmit={sendFreeText}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste the offer, message, or link. Include any fee or email you were given."
          rows={3}
        />
        <div className="chat-actions">
          <span className="form-hint">No AI key? The deterministic referee still works.</span>
          <button className="button-primary" type="submit" disabled={pending || !input.trim()}>
            {pending ? "Checking…" : "Send to referee"} <span>↗</span>
          </button>
        </div>
      </form>
    </section>
  );
}
