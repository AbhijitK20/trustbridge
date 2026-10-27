"use client";

import { useState } from "react";

type Props = {
  token: string;
  status: string;
  isSeller: boolean;
  isBuyer: boolean;
  demoMode?: boolean;
  hasMilestones?: boolean;
};

export default function DealActions({ token, status, isSeller, isBuyer, demoMode = false, hasMilestones = false }: Props) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (hasMilestones) return null;

  async function submitDelivery() {
    setPending(true);
    setError("");
    if (!file) {
      setError("Choose a delivery file first.");
      setPending(false);
      return;
    }
    const uploadResponse = await fetch(`/api/deals/${token}/uploads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
    });
    const upload = await uploadResponse.json();
    if (!uploadResponse.ok) {
      setError(upload.error ?? "Upload could not be prepared.");
      setPending(false);
      return;
    }
    const putHeaders: Record<string, string> = { "Content-Type": file.type };
    if (upload.provider === "supabase") putHeaders["x-upsert"] = "true";
    const putResponse = await fetch(upload.uploadUrl, { method: "PUT", headers: putHeaders, body: file });
    if (!putResponse.ok) {
      setError("Evidence upload failed.");
      setPending(false);
      return;
    }
    const response = await fetch(`/api/deals/${token}/delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note,
        evidence: [{ fileName: file.name, storageKey: upload.key, mimeType: file.type, fileSize: file.size }],
      }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Delivery submitted. The buyer can now review it." : "");
    setError(response.ok ? "" : body.error ?? "Delivery failed.");
    setPending(false);
    if (response.ok) window.location.reload();
  }

  async function submitDemoDelivery() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/deals/${token}/delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, evidence: [] }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error ?? "Delivery failed.");
      setPending(false);
      return;
    }
    window.location.reload();
  }

  async function act(action: "confirm" | "dispute") {
    setPending(true);
    setError("");
    const response = await fetch(`/api/deals/${token}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "dispute" ? { action, reason: note } : { action }),
    });
    const body = await response.json();
    setMessage(response.ok ? body.message : "");
    setError(response.ok ? "" : body.error ?? "Action failed.");
    setPending(false);
    if (response.ok) window.location.reload();
  }

  if (status === "HELD" && isSeller) {
    return (
      <div className="workflow-box">
        <p className="workflow-title">Have you delivered the work?</p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What did you deliver?"
          rows={3}
        />
        {demoMode ? (
          <>
            <p className="form-hint">Storage is not configured, so this records a text delivery.</p>
            <button
              className="button-primary form-submit"
              onClick={submitDemoDelivery}
              disabled={pending || note.length < 10}
            >
              {pending ? "Submitting delivery…" : "Submit text delivery ↗"}
            </button>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              className="button-primary form-submit"
              onClick={submitDelivery}
              disabled={pending || !file || note.length < 10}
            >
              {pending ? "Uploading and submitting…" : "Submit delivery ↗"}
            </button>
          </>
        )}
        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (status === "DELIVERED" && isBuyer) {
    return (
      <div className="workflow-box">
        <p className="workflow-title">Review the delivery</p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note, or explain the problem"
          rows={3}
        />
        <div className="action-row">
          <button className="button-primary" onClick={() => act("confirm")} disabled={pending}>
            Confirm delivery
          </button>
          <button className="button-danger" onClick={() => act("dispute")} disabled={pending || note.length < 10}>
            Open dispute
          </button>
        </div>
        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  return null;
}
