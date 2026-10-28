function text(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export const legalEntity = {
  name: text(process.env.LEGAL_ENTITY_NAME, "TrustBridge Technologies Pvt. Ltd. (placeholder)"),
  address: text(process.env.LEGAL_ENTITY_ADDRESS, "[Registered address — replace before launch]"),
  contactEmail: text(process.env.LEGAL_CONTACT_EMAIL, "legal@trustbridge.example"),
  grievanceEmail: text(process.env.LEGAL_GRIEVANCE_EMAIL, "grievance@trustbridge.example"),
  grievanceOfficer: text(process.env.LEGAL_GRIEVANCE_OFFICER, "[Grievance Officer — replace before launch]"),
  jurisdiction: text(process.env.LEGAL_JURISDICTION, "India"),
  paymentPartner: text(process.env.PAYMENT_PARTNER_NAME, "[Licensed payment/escrow partner — replace before launch]"),
  termsVersion: text(process.env.LEGAL_TERMS_VERSION, "2026-10-28"),
  privacyVersion: text(process.env.LEGAL_PRIVACY_VERSION, "2026-10-27"),
  sellerAgreementVersion: text(process.env.LEGAL_SELLER_AGREEMENT_VERSION, "2026-10-28"),
  effectiveDate: text(process.env.LEGAL_EFFECTIVE_DATE, "28 October 2026"),
  kycProvider: text(process.env.KYC_PROVIDER, "manual"),
};

export const legalEntityIsTemplate = [
  legalEntity.name,
  legalEntity.address,
  legalEntity.paymentPartner,
  legalEntity.grievanceOfficer,
].some((value) => /placeholder|\[|example/i.test(value));

export const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/refunds", label: "Refunds & disputes" },
  { href: "/legal/acceptable-use", label: "Acceptable use" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/seller-agreement", label: "Seller agreement" },
  { href: "/legal/grievance", label: "Grievance" },
];
