type SecureCookieInput = {
  headers: Pick<Headers, "get">;
  nodeEnv?: string;
  url: string;
};

export function shouldUseSecureSessionCookie({
  headers,
  nodeEnv = process.env.NODE_ENV,
  url,
}: SecureCookieInput): boolean {
  if (nodeEnv !== "production") {
    return false;
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return new URL(url).protocol === "https:";
}
