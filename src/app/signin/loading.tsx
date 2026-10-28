export default function Loading() {
  return (
    <main className="form-page">
      <div className="form-intro">
        <span className="brand">
          <span className="brand-mark">T</span> trustbridge
        </span>
        <p className="eyebrow">Your protected workspace</p>
        <h1>
          Keep your deals
          <br />
          <em>close.</em>
        </h1>
        <p>Sign in to create agreements, submit delivery, and keep a clear record of every decision.</p>
      </div>
      <div className="deal-form auth-card" aria-busy="true" style={{ animation: "none" }}>
        <div style={{ height: 38, background: "#e9e1d1", borderRadius: 6, marginBottom: 20 }} />
        <div style={{ height: 30, width: "58%", background: "#e6e4da", borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 12, width: "72%", background: "#eeece2", borderRadius: 4, marginBottom: 26 }} />
        <div style={{ height: 46, background: "#f3f0e6", borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 46, background: "#f3f0e6", borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 46, background: "#f3f0e6", borderRadius: 6, marginBottom: 18 }} />
        <div style={{ height: 44, background: "#14110d", borderRadius: 6 }} />
      </div>
    </main>
  );
}
