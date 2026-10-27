import Link from "next/link";

export default function OnboardingReturnPage() {
  return <main className="form-page"><div className="form-intro"><Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link><p className="eyebrow">Stripe setup</p><h1>Almost<br /><em>there.</em></h1><p>Stripe has returned you to TrustBridge. Your account status will be checked when a payout is requested.</p><Link className="button-primary" href="/create">Create a deal ↗</Link></div></main>;
}
