import { z } from "zod";

// ── Input Sanitization ──

/** Strip HTML tags to prevent XSS in text fields */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

/** Sanitize a filename: remove path traversal, special chars */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\.\./g, "_")
    .replace(/^\.+/, "")
    .slice(0, 255);
}

/** Validate UUID format */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ── File Upload Validation ──

const ALLOWED_UPLOAD_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  data: ["application/json", "text/csv", "application/xml", "text/xml"],
  shapefile: ["application/zip", "application/x-zip-compressed"],
};

const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,      // 10MB
  document: 20 * 1024 * 1024,   // 20MB
  data: 50 * 1024 * 1024,       // 50MB
  shapefile: 100 * 1024 * 1024, // 100MB
};

const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".pif",
  ".js", ".vbs", ".wsf", ".ps1", ".sh", ".bash",
  ".php", ".asp", ".aspx", ".jsp", ".cgi",
];

export function validateFileUpload(
  file: File,
  category: keyof typeof ALLOWED_UPLOAD_TYPES = "document"
): { valid: boolean; error?: string } {
  // Check extension
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "This file type is not allowed" };
  }

  // Check MIME type
  const allowedTypes = ALLOWED_UPLOAD_TYPES[category] || ALLOWED_UPLOAD_TYPES.document;
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split("/")[1]).join(", ")}` };
  }

  // Check size
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.document;
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true };
}

// ── Form Validation Schemas ──

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Minimum 6 characters").max(128),
});

export const jobCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  operation_type: z.string().min(1).max(50),
  total_acres: z.number().positive().max(100000),
  description: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  requirements: z.string().max(5000).optional(),
});

export const quoteSchema = z.object({
  job_id: z.string().uuid(),
  base_rate: z.number().positive().max(1000000),
  total_quote: z.number().positive().max(10000000),
  notes: z.string().max(2000).optional(),
});

// ── Rate Limiting (Client-side debounce) ──

const actionTimestamps = new Map<string, number>();

export function canPerformAction(action: string, cooldownMs = 1000): boolean {
  const now = Date.now();
  const last = actionTimestamps.get(action) || 0;
  if (now - last < cooldownMs) return false;
  actionTimestamps.set(action, now);
  return true;
}
