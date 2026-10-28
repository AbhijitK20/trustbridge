"use client";

import { useState } from "react";
import Link from "next/link";
import AdminNav from "../admin-nav";

type Report = { id: string; reason: string; status: string; createdAt: Date; seller: { slug: string; user: { name: string | null; email: string } }; reporter: { name: string | null; email: string }; deal: { title: string; publicToken: string } | null };

export default function ReportQueue({ reports: initial }: { reports: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [error, setError] = useState("");
  async function update(id: string, status: "REVIEWING" | "RESOLVED" | "DISMISSED") {
    const response = await fetch(`/api/admin/reports/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Report update failed.");
    else if (status !== "REVIEWING") setReports((items) => items.filter((item) => item.id !== id));
    else setReports((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
  return <main className="admin-page"><AdminNav section="report desk" /><header className="admin-header"><p className="eyebrow">Trust moderation</p><h1>Read the <em>signal.</em></h1><p>Review community reports before deciding whether a seller&apos;s public trust record should change.</p></header>{error && <p className="form-error">{error}</p>}{reports.length === 0 ? <section className="empty-state"><p className="eyebrow">Queue clear</p><h2>Quiet signals.</h2><p>No open community reports need review right now.</p><Link className="button-primary" href="/admin/money">Back to the money desk ↗</Link></section> : <section className="dispute-list">{reports.map((report) => <article className="dispute-card" key={report.id}><div className="dispute-meta"><span className="status-pill"><b /> {report.status}</span><span className="small-muted">{new Date(report.createdAt).toLocaleDateString()}</span></div><h2>{report.seller.user.name ?? report.seller.slug}</h2><p className="dispute-reason">“{report.reason}”</p><p className="small-muted">Reported by {report.reporter.name ?? report.reporter.email}{report.deal ? ` · Deal: ${report.deal.title}` : ""}</p><div className="action-row"><button className="button-primary" onClick={() => update(report.id, "REVIEWING")}>Mark reviewing</button><button className="button-primary" onClick={() => update(report.id, "RESOLVED")}>Confirm report</button><button className="button-danger" onClick={() => update(report.id, "DISMISSED")}>Dismiss</button></div></article>)}</section>}</main>;
}
