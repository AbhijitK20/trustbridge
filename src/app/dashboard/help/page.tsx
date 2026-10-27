import Link from "next/link";

const LEGAL = [
  { href: "/legal/terms", title: "Terms of service", note: "The rules for using TrustBridge, creating deals, and paying." },
  { href: "/legal/privacy", title: "Privacy policy", note: "What we store, why, and how long it stays." },
  { href: "/legal/refunds", title: "Refunds & disputes", note: "How money is returned and who decides." },
  { href: "/legal/seller-agreement", title: "Seller agreement", note: "Payouts, evidence, and seller obligations." },
  { href: "/legal/grievance", title: "Grievance", note: "Escalation route and response windows." },
  { href: "/legal/acceptable-use", title: "Acceptable use", note: "What cannot be bought or sold." },
];

export default function DashboardHelpPage() {
  return (
    <>
      <header className="ws-page-head">
        <div>
          <p className="ws-eyebrow">Support · help & legal</p>
          <h1>
            Read the <em>fine print.</em>
          </h1>
          <p>
            Plain-language terms, refunds, privacy, and the rules that protect both sides of a deal.
          </p>
        </div>
        <div className="ws-head-actions">
          <Link className="ws-btn" href="/legal/terms">
            Open terms <i>↗</i>
          </Link>
        </div>
      </header>

      <section className="ws-grid-3" style={{ marginTop: 0 }} aria-label="Legal documents">
        {LEGAL.map((item) => (
          <Link className="ws-panel" href={item.href} key={item.href}>
            <div className="ws-panel-body">
              <span className="ws-kpi-label">Legal</span>
              <h2 style={{ fontSize: 15, fontWeight: 500, margin: "10px 0 6px", letterSpacing: "-0.02em" }}>
                {item.title}
              </h2>
              <p className="ws-split-note" style={{ margin: 0 }}>{item.note}</p>
              <p className="ws-task-action" style={{ marginTop: 14 }}>Read ↗</p>
            </div>
          </Link>
        ))}
      </section>

      <div className="ws-grid-2">
        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Support</small>
              <h2>Talk to a human</h2>
            </div>
            <span className="ws-row-note">Mon–Fri · IST</span>
          </div>
          <div className="ws-panel-body ws-panel-body-flush">
            <Link className="ws-task" href="/referee">
              <span className="ws-task-mark">→</span>
              <span className="ws-task-copy">
                <strong>Open the referee</strong>
                <small>Independent review of a claim or a delivery</small>
              </span>
              <span className="ws-task-action">Open</span>
            </Link>
            <Link className="ws-task" href="/demo/whatsapp">
              <span className="ws-task-mark">◉</span>
              <span className="ws-task-copy">
                <strong>WhatsApp referee</strong>
                <small>Send an offer and get a verdict in chat</small>
              </span>
              <span className="ws-task-action">Open</span>
            </Link>
            <Link className="ws-task" href="mailto:abhijitchandrakantkapure@gmail.com">
              <span className="ws-task-mark">@</span>
              <span className="ws-task-copy">
                <strong>Email support</strong>
                <small>abhijitchandrakantkapure@gmail.com</small>
              </span>
              <span className="ws-task-action">Write</span>
            </Link>
            <Link className="ws-task" href="/legal/grievance">
              <span className="ws-task-mark">§</span>
              <span className="ws-task-copy">
                <strong>Grievance officer</strong>
                <small>Formal escalation under Indian IT rules</small>
              </span>
              <span className="ws-task-action">Read</span>
            </Link>
          </div>
        </section>

        <section className="ws-panel">
          <div className="ws-panel-head">
            <div>
              <small>Scope</small>
              <h2>What TrustBridge is</h2>
            </div>
          </div>
          <div className="ws-panel-body">
            <div className="ws-fact">
              <span>Is</span>
              <strong>A verification and deal-record platform</strong>
            </div>
            <div className="ws-fact">
              <span>Is</span>
              <strong>A protected payment flow with a human referee</strong>
            </div>
            <div className="ws-fact">
              <span>Is not</span>
              <strong>A bank, escrow company, or money transmitter</strong>
            </div>
            <div className="ws-fact">
              <span>Is not</span>
              <strong>A guarantee that a person is honest</strong>
            </div>
            <hr className="ws-divider" />
            <p className="ws-note">
              TrustBridge is a sole proprietorship of Abhijit Chandrakant Kapure. Payments are
              processed and held by the payment partner. The referee decides from evidence, not from
              chat pressure.
            </p>
          </div>
        </section>
      </div>

      <section className="ws-panel" style={{ marginTop: 12 }}>
        <div className="ws-panel-head">
          <div>
            <small>Demo</small>
            <h2>About this environment</h2>
          </div>
        </div>
        <div className="ws-panel-body">
          <p className="ws-split-note">
            This workspace runs in sandbox mode. Deals, checks, and decisions are recorded, but no
            real money moves. Data may be reset between demos. Do not enter real bank credentials.
          </p>
          <p className="ws-footer-note" style={{ marginTop: 14 }}>
            TrustBridge · evidence first
          </p>
        </div>
      </section>
    </>
  );
}
