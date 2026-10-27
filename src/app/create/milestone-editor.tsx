"use client";

export type MilestoneDraftView = {
  title: string;
  description: string;
  acceptanceCriteria: string;
  amount: string;
  dueAt: string;
  verificationRequired: boolean;
};

const EMPTY: MilestoneDraftView = {
  title: "",
  description: "",
  acceptanceCriteria: "",
  amount: "",
  dueAt: "",
  verificationRequired: false,
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function MilestoneEditor({
  milestones,
  onChange,
  price,
  currency,
}: {
  milestones: MilestoneDraftView[];
  onChange: (milestones: MilestoneDraftView[]) => void;
  price: string;
  currency: string;
}) {
  const totalCents = milestones.reduce((sum, milestone) => {
    const amount = Number(milestone.amount);
    return sum + (Number.isFinite(amount) ? Math.round(amount * 100) : 0);
  }, 0);
  const priceCents = Number(price) > 0 ? Math.round(Number(price) * 100) : 0;

  function update(index: number, patch: Partial<MilestoneDraftView>) {
    onChange(milestones.map((milestone, current) => (current === index ? { ...milestone, ...patch } : milestone)));
  }

  function add() {
    onChange([
      ...milestones,
      {
        ...EMPTY,
        title: `Milestone ${milestones.length + 1}`,
      },
    ]);
  }

  function remove(index: number) {
    onChange(milestones.filter((_, current) => current !== index));
  }

  return (
    <div className="milestone-editor">
      <div className="milestone-editor-head">
        <div>
          <p className="form-label">Milestones · optional</p>
          <p className="form-hint">
            Split the deal into verifiable stages. Each stage gets its own release and acceptance criteria.
          </p>
        </div>
        <button className="button-light milestone-add" type="button" onClick={add}>
          + Add milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <p className="milestone-empty">
          No milestones. The deal uses the deposit and balance schedule below.
        </p>
      ) : (
        <>
          <div className="milestone-edit-list">
            {milestones.map((milestone, index) => (
              <div className="milestone-edit-card" key={index}>
                <div className="milestone-edit-top">
                  <span>M{index + 1}</span>
                  <button type="button" onClick={() => remove(index)} aria-label={`Remove milestone ${index + 1}`}>
                    Remove
                  </button>
                </div>
                <label>
                  Milestone title
                  <input
                    value={milestone.title}
                    onChange={(event) => update(index, { title: event.target.value })}
                    placeholder="e.g. Homepage design"
                    required
                  />
                </label>
                <div className="milestone-edit-two">
                  <label>
                    Amount
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={milestone.amount}
                      onChange={(event) => update(index, { amount: event.target.value })}
                      placeholder="9000"
                      required
                    />
                  </label>
                  <label>
                    Due by
                    <input
                      type="date"
                      value={milestone.dueAt}
                      onChange={(event) => update(index, { dueAt: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Acceptance criteria
                  <textarea
                    rows={2}
                    value={milestone.acceptanceCriteria}
                    onChange={(event) => update(index, { acceptanceCriteria: event.target.value })}
                    placeholder="What exactly must be true before this milestone can release?"
                    required
                  />
                </label>
                <label>
                  What is delivered?
                  <textarea
                    rows={2}
                    value={milestone.description}
                    onChange={(event) => update(index, { description: event.target.value })}
                    placeholder="Short description of the deliverables for this stage."
                  />
                </label>
                <label className="milestone-verify">
                  <input
                    type="checkbox"
                    checked={milestone.verificationRequired}
                    onChange={(event) => update(index, { verificationRequired: event.target.checked })}
                  />
                  <span>Run the verification gate before this milestone can release</span>
                </label>
              </div>
            ))}
          </div>
          <div className="milestone-editor-total">
            <span>Milestone total</span>
            <strong className={priceCents > 0 && totalCents !== priceCents ? "is-wrong" : ""}>
              {money(totalCents, currency)}
            </strong>
            <small>
              {priceCents > 0
                ? totalCents === priceCents
                  ? "Matches the protected amount."
                  : `Must equal ${money(priceCents, currency)}.`
                : "Enter the agreed price above."}
            </small>
          </div>
        </>
      )}
    </div>
  );
}
