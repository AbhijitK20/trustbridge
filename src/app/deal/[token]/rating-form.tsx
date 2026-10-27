"use client";

import { useState } from "react";

export default function RatingForm({ token }: { token: string }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit() {
    const response = await fetch(`/api/deals/${token}/rating`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, comment }) });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Rating could not be saved."); else { setMessage("Thanks. Your verified rating is now part of this seller's record."); setScore(0); setComment(""); }
  }
  return <div className="rating-box"><p className="workflow-title">How was the deal?</p><div className="rating-stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={value <= score ? "selected" : ""} onClick={() => setScore(value)} aria-label={`${value} stars`}>★</button>)}</div><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional note for future buyers" rows={3} /><button className="button-primary" onClick={submit} disabled={!score}>Leave verified rating</button>{message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}</div>;
}
