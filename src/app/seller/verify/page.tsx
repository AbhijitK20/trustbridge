import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { legalEntity } from "@/lib/legal";
import VerifySellerForm from "./verify-form";

export default async function VerifySellerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/seller/verify");

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    select: { slug: true, isVerified: true, verificationMethod: true, verificationDomain: true },
  });

  return (
    <main className="form-page">
      <div className="form-intro">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span> trustbridge
        </Link>
        <p className="eyebrow">Seller onboarding</p>
        <h1>Prove the<br /><em>person.</em></h1>
        <p>
          Work email, domain control, and a mock DigiLocker check. Not full KYC — enough to make the
          seller profile more than a screenshot.
        </p>
        {profile?.slug && <Link className="text-link" href={`/seller/${profile.slug}`}>View public profile <span>↗</span></Link>}
      </div>
      <VerifySellerForm
        defaultEmail={session.user.email ?? ""}
        defaultDomain={profile?.verificationDomain ?? ""}
        defaultLegalName={session.user.name ?? ""}
        alreadyVerified={profile?.isVerified ?? false}
        method={profile?.verificationMethod ?? null}
        kycProvider={legalEntity.kycProvider}
      />
    </main>
  );
}
