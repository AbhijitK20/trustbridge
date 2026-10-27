"use client";

import { useState, type FormEvent } from "react";

type Statement = {
  id: string;
  role: string;
  statement: string;
  author: string;
  createdAt: string;
};

export default function DisputeThread({
  token,
  statements: initial,
  canPost,
}: {
  token: string;
  statements: Statement[];
  canPost: boolean;
}) {
  const [statements, setStatements] = useState(initial);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`/api/deals/${token}/statement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statement: text }),
    });
    const body = (await response.json()) as { error?: string; id?: string; role?: string; statement?: string; createdAt?: string };
    if (!response.ok || !body.id || !body.role || !body.statement) {
      setError(body.error ?? "The statement could not be saved.");
      setPending(false);
      return;
    }
    setStatements((current) => [
      ...current,
      {
        id: body.id as string,
        role: body.role as string,
        statement: body.statement as string,
        author: "You",
        createdAt: body.createdAt ?? new Date().toISOString(),
      },
    ]);
    setText("");
    setPending(false);
  }

  return (
    <div className="dispute-thread">
      <h3>Statements from both sides</h3>
      {statements.length === 0 ? (
        <p className="muted">No statements yet. The buyer and seller can each add one.</p>
      ) : (
        <div className="dispute-statement-list">
          {statements.map((item) => (
            <article className="dispute-statement" key={item.id}>
              <div className="dispute-statement-head">
                <span className={`statement-role role-${item.role.toLowerCase()}`}>{item.role}</span>
                <small>{item.author} · {new Date(item.createdAt).toLocaleDateString()}</small>
              </div>
              <p>{item.statement}</p>
            </article>
          ))}
        </div>
      )}
      {canPost ? (
        <form className="statement-form" onSubmit={submit}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Add your side of the story (minimum 10 characters)"
            rows={3}
          />
          {error && <p className="form-error">{error}</p>}
          <button className="button-primary" type="submit" disabled={pending || text.length < 10}>
            {pending ? "Saving…" : "Add statement"} <span>↗</span>
          </button>
        </form>
      ) : (
        <p className="form-hint">Only the buyer or seller can add a statement.</p>
      )}
    </div>
  );
}
