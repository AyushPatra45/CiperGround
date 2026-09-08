import { ApiError } from './security';
/** Bound allocations even for chunked requests without a Content-Length header. */
export async function readJsonBody(
  request: Request,
  limit = 16000,
): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > limit) throw new ApiError(413, 'Request too large');
  if (!request.body) throw new ApiError(400, 'JSON object required');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new ApiError(413, 'Request too large');
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new ApiError(400, 'Invalid JSON');
  }
}
