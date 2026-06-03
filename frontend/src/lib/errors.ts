// src/lib/errors.ts

import type { ErrorResponse, ValidationErrorDetail } from '@/types/api';

/**
 * Extract a user-facing message from an ErrorResponse.
 * Prefer the top-level message; fall back to first error detail.
 */
export function getDisplayMessage(res: ErrorResponse): string {
  if (res.message) return res.message;
  const errors = res.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors[0].message;
  }
  return 'Something went wrong';
}

/**
 * Turn validation errors array into a field → message map.
 * Use this to show inline errors on form fields.
 * 
 * Example:
 *   { email: "Value is not a valid email", password: "..." }
 */
export function getFieldErrors(
  res: ErrorResponse
): Record<string, string> {
  const errors = res.errors;
  if (!Array.isArray(errors) || errors.length === 0) return {};

  // Narrow: ValidationErrorDetail has 'field', HttpErrorDetail has 'code'
  const isValidationErrors = (
    e: typeof errors
  ): e is ValidationErrorDetail[] => 'field' in e[0];

  if (!isValidationErrors(errors)) return {};

  const result: Record<string, string> = {};
  for (const e of errors) {
    if ('field' in e) {
      result[e.field] = e.message; // TypeScript now knows e is ValidationErrorDetail
    }
  }
  return result;
}