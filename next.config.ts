import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ revision: "1", url: "/~offline" }],
  disable: process.env.NODE_ENV !== "production",
  register: false,
  swDest: "public/sw.js",
  swSrc: "src/app/sw.ts",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.200"],
};

export default withSerwist(nextConfig);
