import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Google AI Internship 2026 — TrustBridge demo",
  description: "A simulated scam offer used to demonstrate the TrustBridge browser extension.",
};

export default async function DemoScamPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-8 text-[#182026]">
      {preview === "1" && <Script src="/extension/content.js" strategy="afterInteractive" />}
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-md border border-[#d9483b] bg-[#fdecea] px-4 py-3 text-xs leading-5 text-[#8c2f25]">
          <strong>TrustBridge demo artifact.</strong> This is a simulated scam offer, not a real Google
          communication. Do not pay. It exists so the extension has a realistic page to read.
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(20,40,80,0.16)]">
          <div className="flex items-center justify-between border-b border-[#e6ebf1] px-6 py-5">
            <div className="text-2xl font-semibold tracking-tight">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </div>
            <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a73e8]">
              Careers · 2026
            </span>
          </div>

          <article
            data-trustbridge-offer="true"
            data-trustbridge-org="Google"
            data-trustbridge-email="hr.google.intern@gmail.com"
            data-trustbridge-official="https://www.google.com/about/careers/applications/how-we-hire/"
          >
            <div className="bg-[#1a73e8] px-6 py-10 text-white">
              <p className="text-[10px] uppercase tracking-[0.22em] text-blue-100">Remote · AI Internship</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em]">
                You&apos;ve been selected.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-blue-50">
                Congratulations, Aarav. Your profile was shortlisted for the Google AI Internship 2026.
                The cohort starts in two weeks.
              </p>
            </div>

            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Stipend", "₹40,000 / month"],
                  ["Duration", "8 weeks"],
                  ["Location", "Remote"],
                ].map(([label, value]) => (
                  <div className="rounded-lg border border-[#e6ebf1] bg-[#f8fafd] p-4" key={label}>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#5f6b7a]">{label}</p>
                    <p className="mt-2 text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-[#f0c7b8] bg-[#fff7f3] p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a14d43]">
                  Action required within 24 hours
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em]">
                  Confirm your seat with a ₹1,500 refundable registration fee.
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#5f6b7a]">
                  Pay via UPI to <strong className="text-[#182026]">google.intern@upi</strong>, then send the
                  screenshot to Priya Sharma (HR) on WhatsApp. The fee is fully refundable after onboarding.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-5 cursor-not-allowed rounded-md bg-[#1a73e8] px-5 py-3 text-sm font-semibold text-white opacity-60"
                >
                  Pay ₹1,500 · UPI (demo)
                </button>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#e6ebf1] pt-5 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold">Priya Sharma</p>
                  <p className="text-xs leading-5 text-[#5f6b7a]">HR, Google AI Talent</p>
                  <p className="text-xs leading-5 text-[#5f6b7a]">hr.google.intern@gmail.com</p>
                </div>
                <a
                  className="text-xs font-semibold text-[#1a73e8] underline decoration-[#c9d7ee] underline-offset-4"
                  href="https://www.google.com/about/careers/applications/how-we-hire/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official Google Careers page ↗
                </a>
              </div>
            </div>
          </article>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#6f7d8a]">
          TrustBridge demo: click the floating <strong>Check this offer</strong> pill to verify this page.
          {preview !== "1" && " The extension reads the marked offer card; use ?preview=1 to preview the overlay without installing it."}
        </p>
      </div>
    </main>
  );
}
