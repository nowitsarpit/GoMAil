import type { NextConfig } from "next";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load single .env from backend folder if present
const backendEnvPath = path.resolve(__dirname, "../backend/.env");
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

const nextConfig: NextConfig = {
  env: {
    // Public API URL — exposed to browser. Never put secrets here.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
    // Public site URL — used for canonical URLs, sitemap, OG images.
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
