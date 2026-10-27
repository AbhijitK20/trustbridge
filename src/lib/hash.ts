import { createHash } from "node:crypto";

export function evidenceHash(input: {
  dealId: string;
  fileName: string;
  fileSize?: number | null;
  mimeType: string;
  note?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        dealId: input.dealId,
        fileName: input.fileName,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType,
        note: input.note ?? null,
      }),
    )
    .digest("hex");
}

export function shortHash(hash: string | null | undefined) {
  return hash ? `${hash.slice(0, 12)}…` : null;
}
