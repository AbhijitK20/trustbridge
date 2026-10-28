import Link from "next/link";

export default function OnboardingRefreshPage() {
  return <main className="form-page form-page-single"><div className="form-intro"><Link className="brand" href="/"><span className="brand-mark">T</span> trustbridge</Link><p className="eyebrow">Stripe setup</p><h1>Let&apos;s try<br /><em>again.</em></h1><p>Your Stripe onboarding link expired or was interrupted. Start again to continue verification.</p><Link className="button-primary" href="/onboarding">Restart onboarding ↗</Link></div></main>;
}
