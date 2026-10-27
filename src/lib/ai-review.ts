import { GoogleGenerativeAI } from "@google/generative-ai";

export type EvidenceReview = {
  verdict: "MATCHES" | "PARTIAL" | "DOES_NOT_MATCH" | "NEEDS_HUMAN_REVIEW";
  confidence: number;
  summary: string;
  missingOrUnclear: string[];
  safetyNote: string;
};

type ReviewInput = {
  dealDescription: string;
  evidence: Array<{ mimeType: string; data: string }>;
};

const modelAliases: Record<string, string> = {
  "gemini-3-flash": "gemini-3-flash-preview",
  "gemini-3.5-flash-lite": "gemini-3.5-flash-lite-preview",
  "gemini-2.5-flash": "gemini-2.5-flash",
};

const reviewPrompt = (description: string) => `You are an evidence triage assistant for an escrow service. Compare the uploaded delivery evidence against the buyer and seller's agreed service description below.

Service description:
${description}

Return ONLY valid JSON with this shape:
{"verdict":"MATCHES|PARTIAL|DOES_NOT_MATCH|NEEDS_HUMAN_REVIEW","confidence":0,"summary":"","missingOrUnclear":[],"safetyNote":""}

Never claim certainty from incomplete screenshots. Do not decide whether money should be released. Any ambiguity, unverifiable claim, or possible manipulation must use NEEDS_HUMAN_REVIEW. Keep confidence between 0 and 100.`;

function parseReview(text: string): EvidenceReview {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("AI provider returned no JSON review");
  const value = JSON.parse(json) as Partial<EvidenceReview>;
  if (!value.verdict || typeof value.confidence !== "number" || !value.summary) {
    throw new Error("AI provider returned an invalid review");
  }
  return {
    verdict: value.verdict,
    confidence: Math.max(0, Math.min(100, Math.round(value.confidence))),
    summary: value.summary,
    missingOrUnclear: value.missingOrUnclear ?? [],
    safetyNote: value.safetyNote ?? "Human review is required before any fund release.",
  };
}

async function reviewWithGemini(modelName: string, input: ReviewInput) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: modelAliases[modelName] ?? modelName });
  const result = await model.generateContent([
    reviewPrompt(input.dealDescription),
    ...input.evidence.map((file) => ({ inlineData: { mimeType: file.mimeType, data: file.data } })),
  ]);
  return parseReview(result.response.text());
}

async function reviewWithLocalGateway(input: ReviewInput) {
  const baseUrl = process.env.LOCAL_LLM_BASE_URL ?? "http://localhost:8080/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.LOCAL_LLM_API_KEY ? { Authorization: `Bearer ${process.env.LOCAL_LLM_API_KEY}` } : {}) },
    body: JSON.stringify({ model: "gemini-2.5-flash", temperature: 0, messages: [{ role: "user", content: reviewPrompt(input.dealDescription) }] }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Local gateway returned ${response.status}`);
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return parseReview(body.choices?.[0]?.message?.content ?? "");
}

export async function reviewEvidence(input: ReviewInput) {
  const providers = (process.env.AI_REVIEW_PROVIDERS ?? "gemini-3-flash,gemini-3.5-flash-lite,gemini-2.5-flash,local-gateway").split(",").map((item) => item.trim()).filter(Boolean);
  const failures: string[] = [];
  for (const provider of providers) {
    try {
      const review = provider === "local-gateway" ? await reviewWithLocalGateway(input) : await reviewWithGemini(provider, input);
      return { provider, review, failures };
    } catch (error) {
      failures.push(`${provider}: ${error instanceof Error ? error.message : "provider failed"}`);
    }
  }
  throw new Error(`All evidence review providers failed: ${failures.join("; ")}`);
}
