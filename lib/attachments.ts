const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"]);

export const ATTACHMENT_MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export function isAllowedAttachmentMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}
