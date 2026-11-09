import axios from 'axios';

/**
 * Single authoritative API error message extractor for Learnflow LMS.
 * Extracts clean human-readable messages from Axios errors, FastAPI Pydantic details, and standard Errors.
 */
export function getApiErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (!err) return fallback;

  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first && typeof first === 'object' && 'msg' in first) {
        return String(first.msg);
      }
      return JSON.stringify(detail);
    }
    if (err.response?.data?.message && typeof err.response.data.message === 'string') {
      return err.response.data.message;
    }
    if (err.message) return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'string') {
    return err;
  }

  return fallback;
}

