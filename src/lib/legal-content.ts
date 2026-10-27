import { legalEntity } from "@/lib/legal";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPage = {
  slug: string;
  title: string;
  description: string;
  version: string;
  sections: LegalSection[];
};

const entity = legalEntity.name;
const partner = legalEntity.paymentPartner;
const jurisdiction = legalEntity.jurisdiction;
const contact = legalEntity.contactEmail;
const grievance = legalEntity.grievanceEmail;

export const LEGAL_PAGES: Record<string, LegalPage> = {
  terms: {
    slug: "terms",
    title: "Terms of Service",
    description: "The rules for using TrustBridge, creating deals, and paying or getting paid through the platform.",
    version: legalEntity.termsVersion,
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          `${entity} operates TrustBridge, a technology platform that helps two parties record a deal, check claims against evidence, and manage a protected payment flow.`,
          `TrustBridge is not a bank, a licensed escrow agent, a trustee, or a money transmitter. Payment processing and the holding of customer funds are provided by ${partner}. Your legal relationship for the movement of money is with the payment partner and the other party to the deal, not with TrustBridge as a deposit-taker.`,
        ],
      },
      {
        heading: "2. Accepting these terms",
        paragraphs: [
          "By creating an account, creating or joining a deal, or using the verification tools, you agree to these Terms, the Privacy Policy, and the Refund & Dispute Policy. If you do not agree, do not use the service.",
          "You must be at least 18 years old and legally able to enter into contracts. If you use TrustBridge for a business, you confirm that you are authorised to bind that business.",
        ],
      },
      {
        heading: "3. Deals, deposits, and balances",
        paragraphs: [
          "A deal records the deliverable, deadline, price, currency, and the deposit/balance schedule. The buyer funds the protected amount through the payment partner. The deposit is released on delivery and the balance on acceptance, subject to the deal terms and any dispute.",
          "Do not move a deal off-platform to avoid fees or review. If you do, TrustBridge cannot protect the payment or review the evidence.",
        ],
      },
      {
        heading: "4. Seller obligations",
        paragraphs: [
          "Sellers must complete identity and payout verification, use a payout account in the legal seller's name, deliver what was promised, and comply with applicable tax and consumer laws.",
          "Sellers are responsible for the accuracy of their listing, the quality of their work, and any taxes, GST, TDS, or other obligations arising from their sales.",
        ],
        bullets: [
          "Complete KYC and sanctions screening before receiving payouts.",
          "Keep the payout account name consistent with the verified legal name.",
          "Do not ask a buyer to pay outside the protected deal.",
          "Respond to a dispute within the evidence window.",
        ],
      },
      {
        heading: "5. Buyer obligations",
        paragraphs: [
          "Buyers must provide accurate payment and contact information, review the seller disclosure before paying, inspect the delivery in good faith, and raise a dispute within the stated window.",
          "A buyer must not use a chargeback to avoid a legitimate dispute decision. Chargebacks are handled with the payment partner and may result in account suspension.",
        ],
      },
      {
        heading: "6. Verification and no guarantee",
        paragraphs: [
          "TrustBridge's verification tools produce a four-state result: verified, verified with conditions, contradicted, or undetermined. A positive result is not a guarantee that a person, business, or future delivery is safe.",
          "Evidence tiers, sources, and unknowns are shown so you can make your own decision. TrustBridge does not provide legal, financial, tax, or investment advice.",
        ],
      },
      {
        heading: "7. Disputes and refunds",
        paragraphs: [
          "A dispute is reviewed by a human using the agreement, the evidence attached to the deal, the verification report, and statements from both sides. TrustBridge may request more information and may decline a claim that is unsupported or outside the dispute window.",
          "Refunds and releases are processed through the payment partner. Timing depends on the partner, the payment method, and the banks involved.",
        ],
      },
      {
        heading: "8. Fees and taxes",
        paragraphs: [
          "TrustBridge charges the platform fee shown at checkout or in the deal record. The fee is separate from the seller's price and may be subject to GST or other taxes. Sellers are responsible for their own income tax and tax registrations.",
        ],
      },
      {
        heading: "9. Suspension and termination",
        paragraphs: [
          "We may suspend or close an account, hold a payout for review, or remove a listing if we suspect fraud, sanctions exposure, illegal activity, a payout-name mismatch, or a breach of these Terms. Where appropriate, we will give notice and an opportunity to respond.",
        ],
      },
      {
        heading: "10. Liability and governing law",
        paragraphs: [
          "To the maximum extent permitted by law, TrustBridge is not liable for indirect, incidental, or consequential losses, or for a seller's failure to deliver. Nothing in these Terms limits rights that cannot be limited under applicable consumer law.",
          `These Terms are governed by the laws of ${jurisdiction}. Disputes will be handled in the courts or arbitration forum specified by counsel for ${entity}.`,
        ],
      },
      {
        heading: "11. Contact",
        paragraphs: [`Questions about these Terms: ${contact}. Grievance contact: ${grievance}.`],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What TrustBridge collects, why, who it shares with, and the rights you have over your data.",
    version: legalEntity.privacyVersion,
    sections: [
      {
        heading: "1. Data we collect",
        paragraphs: [
          "We collect account details (name, email, role), deal details (agreement, amount, delivery and dispute records), verification inputs (public links, emails, promises, evidence you submit), payment references from the payment partner, and limited technical data (IP address, user agent, timestamps).",
          "For seller verification we collect legal name, entity type, the last four characters of a tax identifier, payout account name, bank name, and the last four digits of the account. We do not store full government ID images, full bank account numbers, or full tax identifiers in the TrustBridge application database; those are handled by the KYC or payment partner.",
        ],
      },
      {
        heading: "2. Why we use it",
        paragraphs: [
          "We use data to create and operate deals, verify claims, prevent fraud and sanctions exposure, process payments and payouts, resolve disputes, comply with legal obligations, and improve the service.",
          "Where required, we rely on consent; otherwise we rely on performing the contract, legal obligations, or legitimate interests that are not overridden by your rights.",
        ],
      },
      {
        heading: "3. Who we share with",
        paragraphs: [
          `We share the minimum necessary data with ${partner} for payment processing, with KYC/sanctions providers for identity checks, with cloud hosting and storage providers, and with professional advisers or authorities where required by law.`,
          "We do not sell personal data. A seller's legal name, verification status, and payout-account last four digits may be shown to the buyer as a payee disclosure.",
        ],
        bullets: [
          "Payment and payout partner: to hold, release, or refund funds.",
          "KYC and sanctions providers: to verify identity and screen for prohibited parties.",
          "Cloud and evidence storage: to host the service and protect deal records.",
          "Legal and regulatory: when required by a valid request or to prevent harm.",
        ],
      },
      {
        heading: "4. Retention",
        paragraphs: [
          "We keep account, deal, consent, verification, and payment records for as long as needed to provide the service and to meet legal, tax, AML, and dispute obligations. Retention periods may be extended if a dispute, investigation, or legal hold is active.",
        ],
      },
      {
        heading: "5. Your rights",
        paragraphs: [
          "Depending on your location, you may request access, correction, deletion, restriction, portability, or withdrawal of consent. Some records must be retained for legal or AML reasons even after a deletion request.",
          `To exercise a right or ask a question, contact ${contact}. For unresolved concerns, contact the Grievance Officer at ${grievance}.`,
        ],
      },
      {
        heading: "6. Security and cross-border transfers",
        paragraphs: [
          "We use access controls, encryption in transit, audit logs, and least-privilege access. No system is completely secure. If we transfer data across borders, we use appropriate safeguards required by applicable law.",
        ],
      },
    ],
  },
  refunds: {
    slug: "refunds",
    title: "Refund & Dispute Policy",
    description: "How the protected payment, evidence review, refunds, releases, and chargebacks work.",
    version: legalEntity.termsVersion,
    sections: [
      {
        heading: "1. Protected payment",
        paragraphs: [
          "The buyer funds the protected amount through the payment partner. The deposit is released to the seller on delivery and the balance on acceptance, unless a dispute is opened within the review window.",
          "If the seller does not deliver, the buyer may open a dispute. Funds that have not been released remain protected while the review is open.",
        ],
      },
      {
        heading: "2. Dispute window and evidence",
        paragraphs: [
          "A dispute should be opened promptly after delivery, and no later than the window shown on the deal. The buyer and seller may each submit a statement and evidence. The human reviewer may request more information.",
          "Evidence is assessed against the written agreement, not against what either party says after the fact. Screenshots and forwarded messages are treated as claims unless an independent source or platform record supports them.",
        ],
      },
      {
        heading: "3. Human review",
        paragraphs: [
          "TrustBridge may use automated triage to prioritise a case, but a human makes the final release or refund decision. The decision considers the agreement, delivery evidence, verification report, both parties' statements, and any sanctions or payout mismatch flags.",
        ],
      },
      {
        heading: "4. Refunds and releases",
        paragraphs: [
          `Refunds and releases are processed by ${partner}. Timing depends on the payment method and the banks involved. Platform fees are generally non-refundable once the review has been completed, unless required by law.`,
        ],
      },
      {
        heading: "5. Chargebacks",
        paragraphs: [
          "A chargeback is a separate process run by the card issuer or bank. Opening a chargeback does not replace a TrustBridge dispute. We may share deal and evidence records with the payment partner to respond to a chargeback.",
        ],
      },
      {
        heading: "6. Appeals",
        paragraphs: [
          `A party may ask for a review of a decision by contacting ${grievance} within the period stated in the decision. An appeal is not a new dispute and should identify a specific error or new evidence.`,
        ],
      },
    ],
  },
  "acceptable-use": {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    description: "What cannot be sold or facilitated through TrustBridge.",
    version: legalEntity.termsVersion,
    sections: [
      {
        heading: "1. Prohibited transactions",
        paragraphs: ["TrustBridge may not be used for transactions that are illegal, deceptive, or pose an unacceptable financial or safety risk."],
        bullets: [
          "Illegal goods, services, or content.",
          "Fraud, impersonation, phishing, or fake job or investment offers.",
          "Money laundering, terrorist financing, sanctions evasion, or money-mule activity.",
          "Weapons, controlled substances, stolen goods, or counterfeit items.",
          "Adult content or services involving exploitation or non-consensual activity.",
          "Gambling, unlicensed financial services, or securities offerings.",
          "Any transaction that requires a licence TrustBridge or the seller does not hold.",
        ],
      },
      {
        heading: "2. Enforcement",
        paragraphs: [
          "We may decline, suspend, reverse, or report a transaction, and may suspend an account, if we reasonably believe it violates this policy. We may also report suspected financial crime to the appropriate authority.",
        ],
      },
      {
        heading: "3. Reporting",
        paragraphs: [`To report a concern, contact ${contact} or use the report control on a seller profile.`],
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    description: "How TrustBridge uses cookies and similar technologies.",
    version: legalEntity.privacyVersion,
    sections: [
      {
        heading: "1. Essential cookies",
        paragraphs: [
          "TrustBridge uses essential cookies for sign-in, session security, CSRF protection, and remembering consent choices. These are required for the service to work.",
        ],
      },
      {
        heading: "2. Analytics and optional cookies",
        paragraphs: [
          "If analytics are enabled, they are used to understand aggregate usage and improve the service. Non-essential cookies are only set with the consent required by applicable law. The current build does not include advertising cookies.",
        ],
      },
      {
        heading: "3. Managing cookies",
        paragraphs: [
          "You can block or delete cookies in your browser. Blocking essential cookies may prevent sign-in and payment flows from working.",
        ],
      },
    ],
  },
  "seller-agreement": {
    slug: "seller-agreement",
    title: "Seller Agreement",
    description: "Additional terms for sellers who receive payouts through TrustBridge.",
    version: legalEntity.sellerAgreementVersion,
    sections: [
      {
        heading: "1. Verification",
        paragraphs: [
          "A seller must complete identity, business, tax, sanctions, and payout-ownership verification before receiving a payout. We may re-verify an account, request updated information, or suspend payouts while a review is open.",
          "The payout account must belong to the verified legal seller. A mismatch between the legal name and the payout account name will place the account in review.",
        ],
      },
      {
        heading: "2. Delivery and acceptance",
        paragraphs: [
          "The seller must deliver the agreed work by the agreed deadline, attach truthful evidence, and respond to a dispute within the stated window. The seller must not submit fabricated, copied, or manipulated evidence.",
        ],
      },
      {
        heading: "3. Taxes and invoices",
        paragraphs: [
          "The seller is responsible for its own tax registrations, invoices, GST, TDS, income tax, and any other obligations. TrustBridge may issue a platform fee invoice separately from the seller's invoice.",
        ],
      },
      {
        heading: "4. Chargebacks and refunds",
        paragraphs: [
          "If a buyer obtains a chargeback or a refund, the seller may be required to return the released amount and any associated fees, to the extent permitted by law and the payment partner's rules.",
        ],
      },
      {
        heading: "5. Suspension and indemnity",
        paragraphs: [
          "We may suspend a seller for a verification failure, prohibited transaction, repeated disputes, or a breach of these terms. The seller indemnifies TrustBridge for losses caused by its unlawful conduct or breach, to the extent permitted by law.",
        ],
      },
      {
        heading: "6. Consent",
        paragraphs: [
          `By completing seller onboarding, the seller agrees to this Seller Agreement, the Terms, the Privacy Policy, and electronic records. The accepted version is stored with the seller's consent record.`,
        ],
      },
    ],
  },
  grievance: {
    slug: "grievance",
    title: "Grievance & Contact",
    description: "How to reach the TrustBridge grievance team and what to include.",
    version: legalEntity.termsVersion,
    sections: [
      {
        heading: "1. Grievance Officer",
        paragraphs: [`Grievance Officer: ${legalEntity.grievanceOfficer}. Email: ${grievance}.`],
      },
      {
        heading: "2. What to include",
        paragraphs: ["Please include your account email, deal reference (if any), a clear description of the issue, the outcome you are seeking, and any supporting evidence."],
      },
      {
        heading: "3. Response",
        paragraphs: [
          "We aim to acknowledge a grievance within a reasonable period and to provide a substantive response within the timeline required by applicable law. Complex disputes may take longer; we will keep you updated.",
        ],
      },
      {
        heading: "4. Escalation",
        paragraphs: [
          `If you are not satisfied with the response, you may escalate to ${contact} with the original grievance reference. Nothing here limits your right to contact a regulator or consumer forum.`,
        ],
      },
    ],
  },
};

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES);
