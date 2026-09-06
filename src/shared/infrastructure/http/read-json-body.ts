export const MAX_JSON_BODY_BYTES = 64 * 1024;

type JsonBodyErrorStatus = 400 | 413 | 415;

export class JsonBodyError extends Error {
  constructor(
    readonly status: JsonBodyErrorStatus,
    message: "Invalid JSON" | "Payload too large" | "Unsupported media type",
  ) {
    super(message);
    this.name = "JsonBodyError";
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<unknown> {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();

  if (mediaType !== "application/json") {
    throw new JsonBodyError(415, "Unsupported media type");
  }

  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new JsonBodyError(413, "Payload too large");
  }

  if (!request.body) {
    throw new JsonBodyError(400, "Invalid JSON");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new JsonBodyError(413, "Payload too large");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new JsonBodyError(400, "Invalid JSON");
  }
}

export function toJsonBodyError(error: unknown): JsonBodyError {
  return error instanceof JsonBodyError ? error : new JsonBodyError(400, "Invalid JSON");
}
