import LegalFooter from "@/components/legal-footer";

const steps = [
  ["01", "Check the claim", "Paste the offer, fee, or link. See what an independent source can actually support before money moves."],
  ["02", "Lock the payment", "Share one TrustBridge link. The deposit is held, and the balance waits for acceptance."],
  ["03", "Release with proof", "Delivery evidence is reviewed. The deposit releases on delivery; the balance on acceptance, or a human decides."],
];

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="TrustBridge home"><span className="brand-mark">T</span> trustbridge</a>
        <div className="nav-links"><a href="#how-it-works">How it works</a><a href="/check">Verify a claim</a><a href="/referee">Referee chat</a><a href="/demo/scam?preview=1">Extension demo</a><a className="nav-ghost" href="/signin">Sign in</a><a className="nav-cta" href="/create">Create a deal <span>↗</span></a></div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Built for deals made in chat</p>
          <h1>Don&apos;t send money into the <em>void.</em></h1>
          <p className="hero-text">TrustBridge checks the claim before you pay, then holds the payment until the work is delivered. One link. Four honest outcomes. No fake certainty.</p>
          <div className="hero-actions"><a className="button-primary" href="/check">Check a claim <span>↗</span></a><a className="text-link" href="/create">Protect a deal <span>→</span></a><a className="text-link" href="/demo/scam?preview=1">See the extension <span>↗</span></a></div>
          <div className="proof-line"><span className="proof-avatars"><i>R</i><i>M</i><i>A</i></span><span>For the people done<br /><strong>getting scammed.</strong></span></div>
        </div>
        <div className="hero-visual" aria-label="TrustBridge payment protection preview">
          <div className="paper-card deal-card"><div className="card-top"><span className="status-pill"><b /> Payment protected</span><span className="small-muted">#DS-4829</span></div><p className="card-label">SERVICE AGREEMENT</p><h2>Brand identity &amp; launch kit</h2><p className="muted">A complete visual identity system for the new product launch.</p><div className="deliver-row"><span><span className="mini-icon">✓</span> 3 deliverables</span><span>Due 18 Mar</span></div><div className="card-divider" /><div className="money-row"><span>Protected amount</span><strong>$1,200.00</strong></div><div className="card-footer"><span className="secure-lock">⌁</span> Held securely until you approve delivery <span className="arrow">→</span></div></div>
          <div className="floating-note note-proof"><span className="note-icon">✓</span><span><b>Proof attached</b><small>2 files · just now</small></span></div>
          <div className="floating-note note-release"><span className="release-icon">↗</span><span><b>Released</b><small>Buyer confirmed delivery</small></span></div>
          <span className="scribble">no awkward chasing.</span>
        </div>
      </section>

      <section className="trust-strip" id="trust"><span>SCREENSHOTS ARE CLAIMS</span><span className="strip-line" /><span>Evidence tiers</span><span className="strip-line" /><span>Human-first disputes</span><span className="strip-line" /><span>Proof before payout</span></section>
      <section className="steps-section" id="how-it-works"><div className="section-heading"><p className="eyebrow">The simple version</p><h2>Trust, but make it <em>tangible.</em></h2></div><div className="steps-grid">{steps.map(([number, title, text]) => <article className="step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="start-section" id="start"><div><p className="eyebrow">Ready when you are</p><h2>Make the next deal<br /><em>the safe one.</em></h2></div><a className="button-light" href="/create">Create your first deal <span>↗</span></a></section>
      <footer><a className="brand" href="#top"><span className="brand-mark">T</span> trustbridge</a><span>Verify first. Protect the deal.</span><span>© 2026 TrustBridge</span></footer>
      <LegalFooter />
    </main>
  );
}
