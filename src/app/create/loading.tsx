export default function Loading() {
  return (
    <main className="form-page">
      <div className="form-intro">
        <span className="brand">
          <span className="brand-mark">T</span> trustbridge
        </span>
        <p className="eyebrow">Start a protected deal</p>
        <h1>
          Put the agreement
          <br />
          <em>in writing.</em>
        </h1>
        <p>One link. Clear deliverables. Payment protected until the work is delivered.</p>
      </div>
      <div className="deal-form auth-card" aria-busy="true" style={{ animation: "none" }}>
        <div style={{ height: 12, width: "30%", background: "#eeece2", borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 46, background: "#f3f0e6", borderRadius: 6, marginBottom: 22 }} />
        <div style={{ height: 12, width: "34%", background: "#eeece2", borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 110, background: "#f3f0e6", borderRadius: 6, marginBottom: 22 }} />
        <div style={{ height: 46, background: "#f3f0e6", borderRadius: 6, marginBottom: 22 }} />
        <div style={{ height: 46, background: "#f3f0e6", borderRadius: 6, marginBottom: 18 }} />
        <div style={{ height: 44, background: "#14110d", borderRadius: 6 }} />
      </div>
    </main>
  );
}
