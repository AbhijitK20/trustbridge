import { z } from "zod";

export const scenarioIds = ["fake_internship", "official_page", "verified_recruiter", "unknown_seller"] as const;

export const checkInputSchema = z.object({
  scenario: z.enum(scenarioIds).optional(),
  organization: z.string().trim().min(2, "Tell us who the counterparty claims to represent.").max(120),
  counterpartyName: z.string().trim().max(120).optional().default(""),
  counterpartyEmail: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email address or leave it blank.")
    .optional()
    .default(""),
  promise: z.string().trim().min(10, "Describe what was promised in at least 10 characters.").max(4000),
  amount: z.string().trim().max(30).optional().default(""),
  officialUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^https?:\/\/[^\s]+$/i.test(value), "Enter a full http(s) URL or leave it blank.")
    .optional()
    .default(""),
  evidenceText: z.string().trim().max(4000).optional().default(""),
});

export type CheckInputPayload = z.infer<typeof checkInputSchema>;
