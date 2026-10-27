"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type MilestoneView = {
  id: string;
  position: number;
  title: string;
  description: string;
  acceptanceCriteria: string | null;
  amountCents: number;
  dueAt: string | null;
  status: string;
  verificationRequired: boolean;
  submissionNote: string | null;
  reviewNote: string | null;
  submittedAt: string | null;
  releasedAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  CHANGES_REQUESTED: "Changes requested",
  RELEASED: "Released",
  DISPUTED: "Disputed",
};

function statusClass(status: string) {
  return `ms-status ms-${status.toLowerCase().replaceAll("_", "-")}`;
}

export default function MilestonePanel({
  token,
  milestones,
  currency,
  isBuyer,
  isSeller,
  verificationOutcome,
  demoMode,
}: {
  token: string;
  milestones: MilestoneView[];
  currency: string;
  isBuyer: boolean;
  isSeller: boolean;
  verificationOutcome: string | null;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ack, setAck] = useState<Record<string, boolean>>({});
  const [needsAck, setNeedsAck] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const totals = useMemo(() => {
    const total = milestones.reduce((sum, item) => sum + item.amountCents, 0);
    const released = milestones
      .filter((item) => item.status === "RELEASED")
      .reduce((sum, item) => sum + item.amountCents, 0);
    return {
      total,
      released,
      remaining: Math.max(0, total - released),
      releasedCount: milestones.filter((item) => item.status === "RELEASED").length,
      percent: total > 0 ? Math.round((released / total) * 100) : 0,
    };
  }, [milestones]);

  const money = (cents: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(cents / 100);

  async function act(milestone: MilestoneView, action: "SUBMIT" | "ACCEPT" | "REQUEST_CHANGES" | "DISPUTE") {
    setPendingId(milestone.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/deals/${token}/milestones/${milestone.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: notes[milestone.id] ?? "",
          acknowledgeUnverified: Boolean(ack[milestone.id]),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        requiresAcknowledgement?: boolean;
      };
      if (!response.ok) {
        if (data.requiresAcknowledgement) setNeedsAck((current) => ({ ...current, [milestone.id]: true }));
        setError(data.error ?? "The milestone action failed.");
        return;
      }
      setNotice(data.message ?? "Milestone updated.");
      setNotes((current) => ({ ...current, [milestone.id]: "" }));
      setAck((current) => ({ ...current, [milestone.id]: false }));
      setNeedsAck((current) => ({ ...current, [milestone.id]: false }));
      router.refresh();
    } catch {
      setError("Could not reach the milestone service.");
    } finally {
      setPendingId(null);
    }
  }

  if (milestones.length === 0) return null;

  const unresolved = verificationOutcome === "UNDETERMINED" || !verificationOutcome;
  const contradicted = verificationOutcome === "CONTRADICTED";

  return (
    <section className="milestone-section">
      <div className="milestone-head">
        <div>
          <p className="card-label">VERIFICATION-GATED MILESTONES</p>
          <h2>Release work in steps.</h2>
          <p className="milestone-intro">
            Each milestone has its own acceptance criteria. Money moves only after the buyer accepts,
            and the verification gate is shown before release.
          </p>
        </div>
        <div className="milestone-total">
          <strong>
            {totals.releasedCount}/{milestones.length}
          </strong>
          <span>released</span>
        </div>
      </div>

      <div className="milestone-progress" aria-label="Milestone progress">
        <span style={{ width: `${totals.percent}%` }} />
      </div>
      <div className="milestone-totals">
        <span>{money(totals.released)} released</span>
        <span>{money(totals.remaining)} still protected</span>
      </div>

      <div className="milestone-list">
        {milestones.map((milestone) => {
          const note = notes[milestone.id] ?? "";
          const canSubmit = isSeller && ["PENDING", "CHANGES_REQUESTED"].includes(milestone.status);
          const canReview = isBuyer && milestone.status === "SUBMITTED";
          const gateBlocked = milestone.verificationRequired && contradicted;
          const gateNeedsAck =
            milestone.verificationRequired && unresolved && !ack[milestone.id];

          return (
            <article className="milestone-card" key={milestone.id}>
              <div className="milestone-card-top">
                <span className="milestone-number">M{milestone.position}</span>
                <span className={statusClass(milestone.status)}>
                  {STATUS_LABEL[milestone.status] ?? milestone.status}
                </span>
                <strong>{money(milestone.amountCents)}</strong>
              </div>
              <h3>{milestone.title}</h3>
              <p>{milestone.description}</p>
              {milestone.acceptanceCriteria && (
                <p className="milestone-criteria">
                  <b>Acceptance</b> {milestone.acceptanceCriteria}
                </p>
              )}
              <div className="milestone-meta">
                <span>{milestone.dueAt ? `Due ${new Date(milestone.dueAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No fixed due date"}</span>
                {milestone.verificationRequired && <span>Verification required</span>}
                {milestone.releasedAt && (
                  <span>
                    Released{" "}
                    {new Date(milestone.releasedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>

              {milestone.submissionNote && (
                <div className="milestone-note">
                  <b>Seller submission</b>
                  <p>{milestone.submissionNote}</p>
                </div>
              )}
              {milestone.reviewNote && (
                <div className="milestone-note milestone-note-review">
                  <b>Buyer note</b>
                  <p>{milestone.reviewNote}</p>
                </div>
              )}

              {canSubmit && (
                <div className="milestone-action">
                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [milestone.id]: event.target.value }))
                    }
                    rows={3}
                    placeholder="Describe what you delivered and where the buyer can review it."
                  />
                  <button
                    className="button-primary"
                    onClick={() => act(milestone, "SUBMIT")}
                    disabled={pendingId === milestone.id || note.trim().length < 10}
                  >
                    {pendingId === milestone.id ? "Submitting…" : "Submit milestone ↗"}
                  </button>
                </div>
              )}

              {canReview && (
                <div className="milestone-action">
                  <textarea
                    value={note}
                    onChange={(event) =>
                      setNotes((current) => ({ ...current, [milestone.id]: event.target.value }))
                    }
                    rows={3}
                    placeholder="Optional acceptance note, or explain what needs to change."
                  />
                  {milestone.verificationRequired && (
                    <div className={contradicted ? "milestone-gate milestone-gate-blocked" : "milestone-gate"}>
                      <b>
                        {contradicted
                          ? "Verification blocked this release"
                          : unresolved
                            ? "Verification is unresolved"
                            : "Verification passed"}
                      </b>
                      <p>
                        {contradicted
                          ? "A material claim was contradicted. You cannot release this milestone."
                          : unresolved
                            ? "The verification could not confirm every material claim. You can still release, but you must acknowledge that risk."
                            : "The attached verification supports the material claims in this milestone."}
                      </p>
                      {unresolved && !contradicted && (
                        <label className="milestone-ack">
                          <input
                            type="checkbox"
                            checked={Boolean(ack[milestone.id])}
                            onChange={(event) =>
                              setAck((current) => ({
                                ...current,
                                [milestone.id]: event.target.checked,
                              }))
                            }
                          />
                          <span>
                            I understand the verification is unresolved and want to release this
                            milestone anyway.
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                  <div className="action-row">
                    <button
                      className="button-primary"
                      onClick={() => act(milestone, "ACCEPT")}
                      disabled={
                        pendingId === milestone.id ||
                        gateBlocked ||
                        (milestone.verificationRequired && gateNeedsAck)
                      }
                    >
                      {pendingId === milestone.id ? "Releasing…" : "Accept & release"}
                    </button>
                    <button
                      className="button-light"
                      onClick={() => act(milestone, "REQUEST_CHANGES")}
                      disabled={pendingId === milestone.id || note.trim().length < 10}
                    >
                      Request changes
                    </button>
                  </div>
                  {needsAck[milestone.id] && (
                    <p className="form-error">
                      Tick the acknowledgement above, then accept again.
                    </p>
                  )}
                  {demoMode && (
                    <p className="milestone-demo-note">
                      Demo ledger: this records the release in the workspace. No real money moves.
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {notice && <p className="form-success">{notice}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
