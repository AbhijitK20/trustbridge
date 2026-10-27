import { prisma } from "@/lib/prisma";
import { runCheck } from "@/lib/verification";
import type { CheckInput, CheckResult } from "@/lib/verification";

const KNOWN_ORGS = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Flipkart", "Infosys", "TCS", "Wipro"];

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function extractOrganization(text: string) {
  return KNOWN_ORGS.find((name) => new RegExp(`\\b${name}\\b`, "i").test(text)) ?? "";
}

function extractEmail(text: string) {
  return text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? "";
}

function extractUrl(text: string) {
  return text.match(/https?:\/\/[^\s)]+/i)?.[0] ?? "";
}

function extractAmount(text: string) {
  return text.match(/(?:₹|rs\.?|inr)\s?([\d,]+)/i)?.[1]?.replaceAll(",", "") ?? "";
}

function replyFor(result: CheckResult, checkId: string) {
  const lines = [
    `*TrustBridge check: ${result.outcome.replaceAll("_", " ")}*`,
    result.headline,
    result.summary,
  ];
  if (result.outcome !== "CONTRADICTED" && result.conditions.length > 0) {
    lines.push("", "Conditions:", ...result.conditions.slice(0, 2).map((item) => `• ${item}`));
  }
  if (result.couldNotDetermine.length > 0) {
    lines.push("", "Could not determine:", ...result.couldNotDetermine.slice(0, 2).map((item) => `• ${item}`));
  }
  lines.push("", `Full report: ${appUrl()}/verification/${checkId}`);
  if (result.outcome !== "CONTRADICTED") lines.push(`Protect the deal: ${appUrl()}/create`);
  lines.push("This is a verification aid, not legal advice.");
  return lines.join("\n");
}

export async function handleWhatsAppText(waId: string, rawText: string) {
  const text = rawText.trim().slice(0, 2_000);
  if (!text) return { reply: "Send me a job offer, message, or link to check.", checkId: null, outcome: null };

  if (/^(hi|hello|start|help)\b/i.test(text)) {
    const reply = [
      "Hi. I am the TrustBridge referee.",
      "",
      "Send me an offer, recruiter message, or link. I will separate the claim from the evidence and tell you what holds up.",
      "",
      "Examples:",
      "• check Google wants a ₹1,500 internship fee to hr.google.intern@gmail.com",
      "• check this link https://www.google.com/about/careers/applications/how-we-hire/",
    ].join("\n");
    await logMessage(waId, text, reply);
    return { reply, checkId: null, outcome: null };
  }

  if (/^protect\b/i.test(text)) {
    const reply = [
      "To protect the deal, create it here:",
      `${appUrl()}/create`,
      "",
      "The full amount is held. The deposit releases on delivery, the balance on acceptance.",
    ].join("\n");
    await logMessage(waId, text, reply);
    return { reply, checkId: null, outcome: null };
  }

  const body = text.replace(/^check\s+/i, "");
  const input: CheckInput = {
    organization: extractOrganization(body) || "Unknown organisation",
    counterpartyName: "",
    counterpartyEmail: extractEmail(body),
    promise: body,
    amount: extractAmount(body),
    officialUrl: extractUrl(body),
    evidenceText: "Sent to the TrustBridge WhatsApp bot.",
  };
  const result = runCheck(input);
  const check = await prisma.verificationCheck.create({
    data: {
      outcome: result.outcome,
      decision: result.decision,
      organization: input.organization,
      counterpartyEmail: input.counterpartyEmail || null,
      promise: input.promise,
      result: JSON.parse(JSON.stringify(result)),
    },
    select: { id: true },
  });
  const reply = replyFor(result, check.id);
  await logMessage(waId, text, reply);
  return { reply, checkId: check.id, outcome: result.outcome };
}

async function logMessage(waId: string, body: string, reply: string) {
  try {
    await prisma.whatsAppMessage.create({ data: { waId, direction: "INBOUND", body, reply } });
  } catch (error) {
    console.error("whatsapp.log_failed", error);
  }
}

export async function sendWhatsAppReply(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { sent: false, reason: "WhatsApp Cloud API is not configured." };

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
  if (!response.ok) {
    console.error("whatsapp.send_failed", response.status, await response.text());
    return { sent: false, reason: `WhatsApp API returned ${response.status}.` };
  }
  return { sent: true };
}
