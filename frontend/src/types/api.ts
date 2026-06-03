/**
 * @fileoverview Global API response types
 */

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string | null;
}

// For HTTP errors: { code: "LOGIN_FAILED", message: "..." }
export interface HttpErrorDetail {
  code: string;
  message: string;
  details?: unknown | null;
}

// For validation errors (422): { field: "email", message: "..." }
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: HttpErrorDetail[] | ValidationErrorDetail[] | null;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Convenience: unwrap data when response is known-success
export type SuccessData<T> = SuccessResponse<T>["data"];