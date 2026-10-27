import type { Scenario, ScenarioId } from "./types";

const GOOGLE_CAREERS_URL = "https://www.google.com/about/careers/applications/how-we-hire/";
const GOOGLE_SCAMS_URL = "https://support.google.com/faqs/answer/2952493";

const fakeInternship: Scenario = {
  label: "Fake Google internship",
  blurb: "₹1,500 registration fee, Gmail address, official logo",
  input: {
    scenario: "fake_internship",
    organization: "Google",
    counterpartyName: "Priya Sharma (HR)",
    counterpartyEmail: "hr.google.intern@gmail.com",
    promise:
      "You are selected for a remote AI internship. Pay a ₹1,500 refundable registration fee within 24 hours to confirm your seat.",
    amount: "1500",
    officialUrl: GOOGLE_CAREERS_URL,
    evidenceText: "WhatsApp screenshot with a Google logo, a PDF offer letter, and a QR code for the fee.",
  },
  claims: [
    {
      id: "identity",
      text: "The sender is authorised to recruit for Google.",
      material: true,
      outcome: "UNDETERMINED",
      rationale:
        "The only identity evidence is a screenshot (E0) and a Gmail address (E1). Neither establishes that the sender works for Google. Google's official domain is google.com, not gmail.com.",
      evidence: [
        {
          id: "shot",
          tier: "E0",
          timing: "BEFORE",
          label: "WhatsApp screenshot and offer-letter PDF",
          relation: "SUPPORTS",
          note: "Self-asserted. A screenshot proves the message exists, not that its contents are true.",
        },
        {
          id: "email",
          tier: "E1",
          timing: "BEFORE",
          label: "Sender email: hr.google.intern@gmail.com",
          relation: "NEUTRAL",
          note: "Gmail is a platform-asserted address. It is not a Google employment record.",
        },
        {
          id: "domain",
          tier: "E3",
          timing: "BEFORE",
          label: "Google's official domain is google.com",
          relation: "NEUTRAL",
          url: "https://www.google.com/",
        },
      ],
      conditions: [],
      couldNotDetermine: [
        "Whether the sender is employed by Google",
        "Whether the offer letter was issued by Google",
      ],
    },
    {
      id: "fee",
      text: "Google requires a ₹1,500 refundable registration fee to confirm an internship.",
      material: true,
      outcome: "CONTRADICTED",
      rationale:
        "Google's own published scam guidance says no reputable person or agency will demand payment on the spot. That is an independent, first-party statement, and the fee claim contradicts it. A screenshot cannot override the contradiction.",
      evidence: [
        {
          id: "fee-shot",
          tier: "E0",
          timing: "BEFORE",
          label: "Screenshot: '₹1,500 refundable registration fee'",
          relation: "SUPPORTS",
          note: "The message asks for the fee. It does not prove the fee is real.",
        },
        {
          id: "policy",
          tier: "E3",
          timing: "BEFORE",
          label: "Google Help — Avoid and report scams",
          relation: "CONTRADICTS",
          url: GOOGLE_SCAMS_URL,
          quote:
            "No reputable person or agency will ever demand payment or your personal information on the spot.",
        },
      ],
      conditions: [],
      couldNotDetermine: [
        "Whether any legitimate Google program ever collects a fee through a different channel",
      ],
    },
    {
      id: "delivery",
      text: "The internship will be delivered after the fee is paid.",
      material: true,
      outcome: "UNDETERMINED",
      rationale:
        "Future delivery cannot be verified before performance. The fee claim is already contradicted, so the delivery promise cannot rescue the offer.",
      evidence: [
        {
          id: "offer",
          tier: "E0",
          timing: "BEFORE",
          label: "Offer-letter PDF",
          relation: "SUPPORTS",
          note: "Self-asserted.",
        },
      ],
      conditions: [],
      couldNotDetermine: ["Whether the internship exists", "Whether the sender can deliver it"],
    },
  ],
};

const officialPage: Scenario = {
  label: "Check an official page",
  blurb: "Is this link really Google's careers site?",
  input: {
    scenario: "official_page",
    organization: "Google",
    counterpartyName: "",
    counterpartyEmail: "",
    promise: "I want to confirm that this link is Google's official careers page before I apply.",
    amount: "",
    officialUrl: GOOGLE_CAREERS_URL,
    evidenceText: "",
  },
  claims: [
    {
      id: "official-url",
      text: "The link points to Google's official careers site.",
      material: true,
      outcome: "VERIFIED",
      rationale:
        "The URL host is google.com, the path is under Google's /about/careers/ section, and the page identifies itself as 'Our hiring process - Google Careers'. This is an independent, first-party source.",
      evidence: [
        {
          id: "google-page",
          tier: "E3",
          timing: "BEFORE",
          label: "Official Google Careers page",
          relation: "SUPPORTS",
          url: GOOGLE_CAREERS_URL,
          quote: "Our hiring process - Google Careers",
        },
      ],
      conditions: [],
      couldNotDetermine: [
        "Whether a specific recruiter who contacts you from this page is authorised by Google",
      ],
    },
  ],
};

const verifiedRecruiter: Scenario = {
  label: "Recruiter with a matching domain",
  blurb: "Official domain, free process, identity still unconfirmed",
  input: {
    scenario: "verified_recruiter",
    organization: "Google",
    counterpartyName: "Alex Chen",
    counterpartyEmail: "alex.chen@google.com",
    promise:
      "A Google recruiter contacted me about a software engineering role and asked me to apply through the official careers site. No fee was requested.",
    amount: "",
    officialUrl: GOOGLE_CAREERS_URL,
    evidenceText: "Email from alex.chen@google.com plus a LinkedIn profile link.",
  },
  claims: [
    {
      id: "domain-match",
      text: "The sender's email domain matches Google's official domain.",
      material: true,
      outcome: "VERIFIED",
      rationale:
        "The sender address ends in @google.com, and google.com is Google's official domain. This confirms the domain; it does not confirm the individual.",
      evidence: [
        {
          id: "sender",
          tier: "E1",
          timing: "BEFORE",
          label: "Sender address: alex.chen@google.com",
          relation: "SUPPORTS",
          note: "Platform-asserted email address.",
        },
        {
          id: "google-domain",
          tier: "E3",
          timing: "BEFORE",
          label: "Google's official site",
          relation: "SUPPORTS",
          url: "https://www.google.com/",
        },
      ],
      conditions: [],
      couldNotDetermine: ["Whether the mailbox belongs to a specific named employee"],
    },
    {
      id: "process",
      text: "Google recruits through its official careers site and does not require an upfront payment.",
      material: true,
      outcome: "VERIFIED",
      rationale:
        "Google's official hiring page describes the application process, and Google's own scam guidance warns that no reputable agency demands payment on the spot.",
      evidence: [
        {
          id: "hiring",
          tier: "E3",
          timing: "BEFORE",
          label: "Google Careers — Our hiring process",
          relation: "SUPPORTS",
          url: GOOGLE_CAREERS_URL,
          quote: "Our hiring process - Google Careers",
        },
        {
          id: "policy",
          tier: "E3",
          timing: "BEFORE",
          label: "Google Help — Avoid and report scams",
          relation: "SUPPORTS",
          url: GOOGLE_SCAMS_URL,
          quote:
            "No reputable person or agency will ever demand payment or your personal information on the spot.",
        },
      ],
      conditions: [],
      couldNotDetermine: [],
    },
    {
      id: "person",
      text: "This specific person is a Google recruiter.",
      material: false,
      outcome: "UNDETERMINED",
      rationale:
        "A matching domain is consistent with a real recruiter, but it does not prove who typed the message. An interested third-party profile (E2) is not independent confirmation.",
      evidence: [
        {
          id: "signature",
          tier: "E0",
          timing: "BEFORE",
          label: "Email signature: Alex Chen, Google Talent",
          relation: "SUPPORTS",
          note: "Self-asserted.",
        },
        {
          id: "linkedin",
          tier: "E2",
          timing: "BEFORE",
          label: "LinkedIn profile linked in the email",
          relation: "SUPPORTS",
          note: "Interested third party. The profile was not independently verified.",
        },
      ],
      conditions: [
        "Confirm the recruiter's name in Google's official directory or by calling the office number listed on google.com.",
        "Apply only through careers.google.com. Never send money or identity documents to the sender.",
      ],
      couldNotDetermine: [
        "Whether the sender is the named recruiter",
        "Whether the message came from that person's mailbox",
      ],
    },
  ],
};

const unknownSeller: Scenario = {
  label: "Unknown freelance seller",
  blurb: "No official domain, 50% advance, portfolio screenshot",
  input: {
    scenario: "unknown_seller",
    organization: "Independent seller",
    counterpartyName: "Rahul",
    counterpartyEmail: "rahul.builds@protonmail.com",
    promise: "I will build a 5-page website in 10 days for ₹18,000. I need a 50% advance to start.",
    amount: "18000",
    officialUrl: "",
    evidenceText: "WhatsApp chat, a portfolio link, and three screenshots of previous work.",
  },
  claims: [
    {
      id: "identity",
      text: "The seller controls the business they claim to represent.",
      material: true,
      outcome: "UNDETERMINED",
      rationale:
        "There is no official domain or registration to check. A portfolio link and screenshots are self-asserted (E0), and a ProtonMail address is only platform-asserted (E1).",
      evidence: [
        {
          id: "portfolio",
          tier: "E0",
          timing: "BEFORE",
          label: "Portfolio link and three work screenshots",
          relation: "SUPPORTS",
          note: "Self-asserted. Anyone can screenshot or copy a portfolio.",
        },
        {
          id: "email",
          tier: "E1",
          timing: "BEFORE",
          label: "Sender email: rahul.builds@protonmail.com",
          relation: "NEUTRAL",
          note: "A free mailbox does not identify a business.",
        },
      ],
      conditions: [
        "Ask for the seller's registered business name, address, and a government ID, then verify them independently.",
        "Keep the conversation and payment on the protected deal.",
      ],
      couldNotDetermine: ["Whether the seller is a registered business", "Whether the portfolio is the seller's own work"],
    },
    {
      id: "delivery",
      text: "The seller will deliver a 5-page website in 10 days.",
      material: true,
      outcome: "UNDETERMINED",
      rationale:
        "Future delivery cannot be verified before performance. A chat promise is not evidence of capability or intent.",
      evidence: [
        {
          id: "chat",
          tier: "E0",
          timing: "BEFORE",
          label: "WhatsApp promise",
          relation: "SUPPORTS",
          note: "Self-asserted.",
        },
      ],
      conditions: [
        "Write the deliverable, deadline, and acceptance criteria into the deal.",
        "Release the balance only after you inspect the pages.",
      ],
      couldNotDetermine: ["Whether the seller will perform as promised"],
    },
    {
      id: "refund",
      text: "The 50% advance will be refunded if delivery fails.",
      material: true,
      outcome: "UNDETERMINED",
      rationale:
        "No refund terms were provided. The advance is requested off-platform, so there is no neutral party holding it.",
      evidence: [
        {
          id: "advance",
          tier: "E0",
          timing: "BEFORE",
          label: "Chat request for a 50% advance",
          relation: "SUPPORTS",
          note: "Self-asserted. No refund policy attached.",
        },
      ],
      conditions: [
        "Do not pay a 50% advance off-platform. Use a protected deal with a smaller deposit and a balance on delivery.",
      ],
      couldNotDetermine: ["Whether any refund would be honoured"],
    },
  ],
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  fake_internship: fakeInternship,
  official_page: officialPage,
  verified_recruiter: verifiedRecruiter,
  unknown_seller: unknownSeller,
};

export const SCENARIO_LIST = (Object.keys(SCENARIOS) as ScenarioId[]).map((id) => ({
  id,
  label: SCENARIOS[id].label,
  blurb: SCENARIOS[id].blurb,
}));
