import axios from "axios";

import type { ApiErrorEnvelope } from "./types";

/** Pulls the user-facing message out of the backend error envelope
 * ({ error: { code, message, details } }), with sensible fallbacks. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const envelope = error.response?.data as Partial<ApiErrorEnvelope> | undefined;
    if (envelope?.error?.message) {
      return envelope.error.message;
    }
  }
  return fallback;
}
