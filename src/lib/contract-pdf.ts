import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ContractSignatureView, ContractSnapshot } from "@/lib/contracts";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const INK = rgb(0.09, 0.14, 0.12);
const MUTED = rgb(0.43, 0.49, 0.46);
const GREEN = rgb(0.105, 0.302, 0.243);
const LINE = rgb(0.84, 0.85, 0.82);

function safeText(value: string) {
  return value
    .replaceAll("₹", "INR ")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("…", "...")
    .replaceAll("·", "-")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function money(cents: number, currency: string) {
  return `${currency.toUpperCase()} ${(cents / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function date(value: string | null | undefined) {
  if (!value) return "Not specified";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const normalized = safeText(text).replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let buffer = "";
      for (const character of word) {
        if (font.widthOfTextAtSize(buffer + character, size) > maxWidth) {
          lines.push(buffer);
          buffer = character;
        } else {
          buffer += character;
        }
      }
      current = buffer;
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class ContractWriter {
  private page: PDFPage;
  private y = PAGE_HEIGHT - 64;
  private readonly pages: PDFPage[] = [];

  constructor(
    private readonly document: PDFDocument,
    private readonly font: PDFFont,
    private readonly bold: PDFFont,
    private readonly oblique: PDFFont,
    private readonly contractNumber: string,
    private readonly contentHash: string,
  ) {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(this.page);
  }

  private newPage() {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pages.push(this.page);
    this.y = PAGE_HEIGHT - 64;
  }

  private ensure(space: number) {
    if (this.y - space < 54) this.newPage();
  }

  text(
    value: string,
    options: {
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: ReturnType<typeof rgb>;
      leading?: number;
      gap?: number;
      x?: number;
      width?: number;
    } = {},
  ) {
    const size = options.size ?? 9;
    const leading = options.leading ?? size + 4;
    const x = options.x ?? MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    const font = options.bold ? this.bold : options.italic ? this.oblique : this.font;
    const lines = wrap(value, font, size, width);
    this.ensure(lines.length * leading + (options.gap ?? 0));
    for (const line of lines) {
      this.page.drawText(line, { x, y: this.y, size, font, color: options.color ?? INK });
      this.y -= leading;
    }
    this.y -= options.gap ?? 0;
  }

  title(value: string, subtitle?: string) {
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 12, width: PAGE_WIDTH, height: 12, color: GREEN });
    this.page.drawText("TRUSTBRIDGE", {
      x: MARGIN,
      y: PAGE_HEIGHT - 44,
      size: 9,
      font: this.bold,
      color: GREEN,
    });
    this.page.drawText("PROTECTED DEAL CONTRACT", {
      x: MARGIN,
      y: PAGE_HEIGHT - 60,
      size: 8,
      font: this.font,
      color: MUTED,
    });
    this.y = PAGE_HEIGHT - 88;
    this.text(value, { size: 22, bold: true, leading: 26, gap: 3 });
    if (subtitle) this.text(subtitle, { size: 9, color: MUTED, leading: 13, gap: 10 });
    this.rule();
  }

  heading(value: string) {
    this.ensure(34);
    this.y -= 6;
    this.page.drawText(safeText(value).toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 8,
      font: this.bold,
      color: GREEN,
    });
    this.y -= 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.7,
      color: LINE,
    });
    this.y -= 15;
  }

  rule() {
    this.ensure(12);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.7,
      color: LINE,
    });
    this.y -= 15;
  }

  keyValue(label: string, value: string) {
    this.ensure(26);
    this.page.drawText(safeText(label).toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 7,
      font: this.bold,
      color: MUTED,
    });
    this.y -= 12;
    this.text(value, { size: 9.5, leading: 13, gap: 7 });
  }

  signatures(signatures: ContractSignatureView[]) {
    this.ensure(145);
    this.heading("Electronic signatures");
    this.text(
      "By signing, each party confirms that they have read the agreement, the attached verification report, and the evidence manifest. This is a typed electronic acknowledgment generated by TrustBridge. It is not legal advice.",
      { size: 8.5, color: MUTED, leading: 12, gap: 12 },
    );

    const boxes: Array<{ role: "SELLER" | "BUYER"; label: string }> = [
      { role: "SELLER", label: "Seller" },
      { role: "BUYER", label: "Buyer" },
    ];

    const boxWidth = (CONTENT_WIDTH - 14) / 2;
    this.ensure(100);
    const top = this.y;
    for (let index = 0; index < boxes.length; index++) {
      const { role, label } = boxes[index];
      const x = MARGIN + index * (boxWidth + 14);
      const signature = signatures.find((item) => item.role === role);
      this.page.drawRectangle({
        x,
        y: top - 82,
        width: boxWidth,
        height: 82,
        borderColor: LINE,
        borderWidth: 0.8,
      });
      this.page.drawText(label.toUpperCase(), {
        x: x + 10,
        y: top - 18,
        size: 7,
        font: this.bold,
        color: MUTED,
      });
      if (signature) {
        this.page.drawText(safeText(signature.name), {
          x: x + 10,
          y: top - 37,
          size: 10,
          font: this.bold,
          color: INK,
        });
        this.page.drawText(safeText(`"${signature.signatureText}"`), {
          x: x + 10,
          y: top - 52,
          size: 9,
          font: this.oblique,
          color: GREEN,
        });
        this.page.drawText(safeText(`Signed ${date(signature.signedAt)}`), {
          x: x + 10,
          y: top - 68,
          size: 7,
          font: this.font,
          color: MUTED,
        });
      } else {
        this.page.drawText("Awaiting signature", {
          x: x + 10,
          y: top - 42,
          size: 9,
          font: this.oblique,
          color: MUTED,
        });
        this.page.drawText("Not yet signed", {
          x: x + 10,
          y: top - 58,
          size: 7,
          font: this.font,
          color: MUTED,
        });
      }
    }
    this.y = top - 100;
  }

  finish(generatedAt: string) {
    this.pages.forEach((page, index) => {
      page.drawLine({
        start: { x: MARGIN, y: 43 },
        end: { x: PAGE_WIDTH - MARGIN, y: 43 },
        thickness: 0.5,
        color: LINE,
      });
      page.drawText(
        safeText(
          `Generated ${date(generatedAt)}  |  ${this.contractNumber}  |  SHA-256 ${this.contentHash.slice(0, 24)}...`,
        ),
        { x: MARGIN, y: 30, size: 6.5, font: this.font, color: MUTED },
      );
      page.drawText(`Page ${index + 1} of ${this.pages.length}`, {
        x: PAGE_WIDTH - MARGIN - 55,
        y: 30,
        size: 6.5,
        font: this.font,
        color: MUTED,
      });
    });
  }
}

export async function buildContractPdf(
  snapshot: ContractSnapshot,
  signatures: ContractSignatureView[],
  contentHash: string,
) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const oblique = await document.embedFont(StandardFonts.HelveticaOblique);
  const writer = new ContractWriter(
    document,
    font,
    bold,
    oblique,
    snapshot.number,
    contentHash,
  );

  writer.title(
    snapshot.deal.title,
    `${snapshot.number}  ·  ${snapshot.deal.status.replaceAll("_", " ")}  ·  ${money(
      snapshot.deal.amountCents,
      snapshot.deal.currency,
    )}`,
  );

  writer.heading("1. Parties");
  writer.keyValue("Seller", snapshot.parties.seller.legalName);
  writer.keyValue(
    "Seller verification",
    `${snapshot.parties.seller.kycStatus.replaceAll("_", " ")} · Payout ${snapshot.parties.seller.payoutBank ?? "not provided"} ${
      snapshot.parties.seller.payoutLast4 ? `ending ${snapshot.parties.seller.payoutLast4}` : ""
    }`,
  );
  writer.keyValue("Buyer", snapshot.parties.buyer?.name ?? "Buyer not yet assigned");
  writer.keyValue("Platform", `${snapshot.terms.platform} · ${snapshot.terms.paymentPartner}`);

  writer.heading("2. Scope and price");
  writer.text(snapshot.deal.description, { size: 9.5, leading: 14, gap: 8 });
  writer.keyValue("Total protected amount", money(snapshot.deal.amountCents, snapshot.deal.currency));
  writer.keyValue("Delivery deadline", date(snapshot.deal.deliveryDeadline));
  writer.keyValue("Contract date", date(snapshot.generatedAt));

  writer.heading("3. Milestones and release conditions");
  if (snapshot.milestones.length === 0) {
    writer.text(
      "This agreement uses a single delivery. The balance is released when the buyer accepts the delivery, subject to the dispute process.",
      { size: 9.5, leading: 14, gap: 8 },
    );
  } else {
    for (const milestone of snapshot.milestones) {
      const line = `${milestone.position}. ${milestone.title}  -  ${money(
        milestone.amountCents,
        snapshot.deal.currency,
      )}  -  ${milestone.status.replaceAll("_", " ")}`;
      writer.text(line, { size: 9.5, bold: true, leading: 13, gap: 2 });
      writer.text(milestone.description, { size: 8.8, color: MUTED, leading: 12, gap: 2 });
      if (milestone.acceptanceCriteria) {
        writer.text(`Acceptance: ${milestone.acceptanceCriteria}`, {
          size: 8.8,
          color: MUTED,
          leading: 12,
          gap: 2,
        });
      }
      writer.text(
        `${milestone.dueAt ? `Due ${date(milestone.dueAt)}` : "No fixed due date"}  ·  ${
          milestone.verificationRequired ? "Verification required before release" : "Buyer acceptance required"
        }`,
        { size: 8, color: MUTED, leading: 11, gap: 9 },
      );
    }
  }

  writer.heading("4. Verification and evidence");
  if (snapshot.verification) {
    writer.keyValue("Verification outcome", snapshot.verification.outcome.replaceAll("_", " "));
    writer.text(snapshot.verification.headline, { size: 9.5, leading: 13, gap: 3 });
    writer.text(snapshot.verification.summary, { size: 8.8, color: MUTED, leading: 12, gap: 4 });
    if (snapshot.verification.couldNotDetermine.length > 0) {
      writer.text("Open questions recorded by the verification:", {
        size: 8.5,
        bold: true,
        leading: 12,
        gap: 2,
      });
      for (const item of snapshot.verification.couldNotDetermine.slice(0, 8)) {
        writer.text(`- ${item}`, { size: 8.3, color: MUTED, leading: 11, gap: 1 });
      }
    }
  } else {
    writer.text("No verification report is attached to this contract.", {
      size: 9,
      color: MUTED,
      leading: 13,
      gap: 8,
    });
  }

  if (snapshot.evidence.length === 0) {
    writer.text("No evidence files are attached yet.", { size: 9, color: MUTED, leading: 13, gap: 8 });
  } else {
    writer.text(
      "Evidence manifest (each row is a file or submission hash recorded by TrustBridge):",
      { size: 8.5, bold: true, leading: 12, gap: 4 },
    );
    for (const item of snapshot.evidence) {
      writer.text(`- ${item.fileName}`, { size: 8.4, leading: 11, gap: 1 });
      writer.text(
        `  ${item.sha256 ? `SHA-256 ${item.sha256}` : "Hash pending"}${item.note ? `  ·  ${item.note}` : ""}`,
        { size: 7.5, color: MUTED, leading: 10, gap: 4 },
      );
    }
  }

  writer.heading("5. Fees and payout");
  writer.text(
    `Platform fee: ${money(snapshot.fees.platformFeeCents, snapshot.deal.currency)} (${snapshot.fees.platformFeePercent}%). Seller receives: ${money(
      snapshot.fees.sellerNetCents,
      snapshot.deal.currency,
    )}. Fees are deducted from the seller payout.`,
    { size: 9, leading: 13, gap: 8 },
  );

  writer.heading("6. Dispute and refunds");
  writer.text(
    `If either party disputes the delivery, both sides may submit evidence. TrustBridge's human review aims to resolve the dispute within ${snapshot.terms.disputeWindowDays} days. Funds remain protected while the dispute is open. Refunds and releases follow the platform's published refund and dispute policy.`,
    { size: 8.8, leading: 12, gap: 6 },
  );
  writer.text(
    "TrustBridge is a technology platform, not a bank or licensed escrow. Payment processing and custody are provided by the named payment partner, subject to that partner's terms.",
    { size: 8.4, color: MUTED, leading: 11, gap: 8 },
  );

  writer.signatures(signatures);
  writer.finish(snapshot.generatedAt);

  return document.save();
}

