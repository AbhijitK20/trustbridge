"use client";

import { useState } from "react";

export default function ShareDeal({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — protected with TrustBridge: ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="share-deal">
      <p className="card-label">SHARE THE DEAL</p>
      <div className="share-links">
        <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp ↗</a>
        <a href={telegram} target="_blank" rel="noreferrer">Telegram ↗</a>
        <button type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
      </div>
      <small>Share one link. The agreement, evidence, and decision stay in one place.</small>
    </div>
  );
}
