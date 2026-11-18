import "server-only";

export class RequestBodyLimitError extends Error {
  constructor() { super("REQUEST_BODY_TOO_LARGE"); }
}

/** Count actual streamed bytes before JSON/multipart parsers allocate an entire body.
 * Content-Length is an early rejection only; absent or dishonest values cannot bypass the cap.
 */
export async function readBoundedRequestBody(request: Request, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maximum) throw new RequestBodyLimitError();
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximum) {
        await reader.cancel().catch(() => {});
        throw new RequestBodyLimitError();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
